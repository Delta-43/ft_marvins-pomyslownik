"""Server-side language choice (task B15, contract draft 3+).

The routers keep building every person-facing text as a {pl, en} object. One response layer then:
- picks the language: `?lang=` wins, then `Accept-Language`, then the signed-in user's preferredLanguage, then `pl`;
- named language: turns every {pl, en[, uk]} object into one string in that language;
- no language named (deprecated form): keeps the object and adds `uk` when a translation exists;
- translates error messages, and sets Content-Language, Vary and Cache-Control.

Ukrainian (and Polish error messages) come from the `translations` table. A text that has no translation yet is
queued there (text NULL); the worker translates the queue with Claude and marks the rows as machine translations.
Until then the response falls back to English, so a screen is never empty.
"""
import hashlib
import json
import re

from ..config import settings
from ..db import connection

LANGS = ("pl", "en", "uk")
TEXT_KEYS = set(LANGS)
FALLBACK = {"pl": ("pl", "en"), "en": ("en", "pl"), "uk": ("uk", "en", "pl")}


def supported() -> list[str]:
    return [x for x in (s.strip() for s in settings.supported_languages.split(",")) if x in LANGS] or ["pl"]


def _q(params: str) -> float | None:
    """The q value of one Accept-Language entry: 1.0 when absent, None when malformed (the entry is then ignored)."""
    m = re.search(r"(?:^|;)\s*q\s*=\s*([^;\s]*)", params)
    if not m:
        return 1.0
    if not re.fullmatch(r"(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)", m.group(1)):
        return None
    return float(m.group(1))


def from_accept_language(header: str | None) -> str | None:
    """Best supported language in an Accept-Language header (RFC 9110). Entries with q=0 or a malformed q are ignored;
    "*" stands for the default language; on equal q the earlier entry wins. None when nothing matches."""
    best, best_q = None, 0.0
    for part in (header or "").split(","):
        tag, _, params = part.strip().partition(";")
        q = _q(params)
        code = tag.strip().lower().split("-")[0]
        if code == "*":
            code = supported()[0]
        if q and code in supported() and q > best_q:
            best, best_q = code, q
    return best


def bad_lang(query_lang: str | None) -> bool:
    """`?lang=` must be one of the LanguageCode values, exactly (the router answers 422 otherwise)."""
    return query_lang is not None and query_lang not in supported()


def negotiate(query_lang: str | None, accept_language: str | None, preferred: str | None) -> tuple[str, bool]:
    """(language, named). `named` is True when the request itself names a language (string form of LocalizedText)."""
    if query_lang in supported():
        return query_lang, True
    if accept_language and accept_language.strip():
        return from_accept_language(accept_language) or supported()[0], True
    return (preferred if preferred in supported() else supported()[0]), False


def _is_text(v) -> bool:
    return isinstance(v, dict) and v and set(v) <= TEXT_KEYS and all(isinstance(x, str) for x in v.values())


def source_of(text: dict) -> tuple[str, str] | None:
    """The text a translation is made from: Polish when present (closest to Ukrainian), else English."""
    for lang in ("pl", "en"):
        if (text.get(lang) or "").strip():
            return lang, text[lang].strip()
    return None


def key_for(source_lang: str, source_text: str) -> str:
    return hashlib.sha256(f"{source_lang}\n{source_text}".encode()).hexdigest()


def _walk(obj, found: list):
    if _is_text(obj):
        found.append(obj)
    elif isinstance(obj, dict):
        for v in obj.values():
            _walk(v, found)
    elif isinstance(obj, list):
        for v in obj:
            _walk(v, found)


def lookup(wanted: dict[str, tuple[str, str]], target: str) -> dict[str, str]:
    """Translations for {key: (source_lang, source_text)} into `target`. Misses are queued for the worker."""
    if not wanted:
        return {}
    with connection() as conn:
        rows = conn.execute("SELECT source_hash, text FROM translations WHERE target_lang = %s AND source_hash = ANY(%s)",
                            (target, list(wanted))).fetchall()
        have = {r["source_hash"]: r["text"] for r in rows}
        missing = [k for k in wanted if k not in have]
        if missing:
            with conn.cursor() as cur:
                cur.executemany("""INSERT INTO translations (source_hash, target_lang, source_lang, source_text)
                                   VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING""",
                                [(k, target, *wanted[k]) for k in missing])
    return {k: v for k, v in have.items() if v}


def localize(body, lang: str, named: bool, served: set | None = None):
    """Resolve every LocalizedText in a JSON body (see the module docstring). `served` collects the languages used."""
    served = served if served is not None else set()
    texts: list[dict] = []
    _walk(body, texts)
    uk: dict[str, str] = {}
    if "uk" in supported() and (lang == "uk" or not named):
        wanted = {}
        for t in texts:
            if not t.get("uk") and (src := source_of(t)):
                wanted[key_for(*src)] = src
        uk = lookup(wanted, "uk")

    def resolve(obj):
        if _is_text(obj):
            full = dict(obj)
            src = source_of(full) if "uk" in supported() and not full.get("uk") else None
            if src and (tr := uk.get(key_for(*src))):
                full["uk"] = tr
            if not named:
                served.update(k for k in full if full[k])
                return full
            used = next((x for x in FALLBACK[lang] if (full.get(x) or "").strip()), None)
            if used:
                served.add(used)
            return full[used] if used else ""
        if isinstance(obj, dict):
            out = {k: resolve(v) for k, v in obj.items()}
            if "assessment" in out and "oslo" in out and "evidence" in out and uk:  # a full card
                out["machineTranslated"] = ["uk"]  # every Ukrainian card text is a machine translation until reviewed
            return out
        if isinstance(obj, list):
            return [resolve(v) for v in obj]
        return obj

    return resolve(body)


def translate_message(message: str, lang: str) -> tuple[str, str]:
    """(message, language served). Error messages are written in English; other languages come from the
    translation table. Until a translation exists the English message is served, and said to be English."""
    if lang == "en" or not message:
        return message, "en"
    k = key_for("en", message)
    tr = lookup({k: ("en", message)}, lang).get(k)
    return (tr, lang) if tr else (message, "en")


def content_language(served: set, lang: str) -> str:
    """The Content-Language value: the languages actually served, the requested one first (RFC 9110 allows a list).
    "uk, en" tells the UI that some texts are not translated yet and are shown in English."""
    if not served:
        return lang
    return ", ".join(sorted(served, key=lambda x: (x != lang, LANGS.index(x))))


def rewrite(raw: bytes, lang: str, named: bool) -> tuple[bytes, str]:
    """(new body, Content-Language)."""
    body = json.loads(raw)
    served: set = set()
    if isinstance(body, dict) and isinstance(body.get("error"), dict):
        body["error"]["message"], used = translate_message(body["error"].get("message", ""), lang)
        served.add(used)
    elif named:
        body = localize(body, lang, named, served)
    else:
        body = localize(body, lang, named, served)
        served = {lang}  # object form: every language is present, the UI picks
    return json.dumps(body, ensure_ascii=False, separators=(",", ":")).encode(), content_language(served, lang)
