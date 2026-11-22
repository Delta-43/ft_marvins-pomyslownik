"""Task B16: the source registry. Owners add a source by editing data/sources/registry.json and .env, with no code change.

Format: data/sources/registry.example.json. Secrets never go in the registry: `tokenEnv` names the environment
variable that holds the token. The built-in sources (RAD-on, OpenAlex, PTT, pages, reports) keep their own collectors
and limits in targets.json; the registry adds generic ones:
- method "api":     GET baseUrl, take the items at `itemsPath`, map fields with `mapping` (a small JSONPath: $.a.b[0].c)
- method "feed":    RSS or Atom; every item link is read as a page
- method "sitemap": every <loc> is read as a page (optionally only URLs containing `filters.urlContains`)
- method "crawl":   the listed `urls` are read as pages
Every page and item goes through the same extraction, fact/estimate rule and robots.txt checks as the built-ins.
"""
import gzip
import html
import io
import json
import os
import pathlib
import re
from urllib.parse import urlparse

from .config import Settings, settings

BUILT_IN = {"radon", "openalex", "ptt", "school-and-council-pages", "reports", "gus-bdl"}
PROBLEMS = {
    "disabled": {"pl": "Źródło jest wyłączone w rejestrze.", "en": "The source is disabled in the registry."},
    "token": {"pl": "Brak tokenu: ustaw zmienną środowiskową wskazaną w tokenEnv.", "en": "Token missing: set the environment variable named in tokenEnv."},
    "robots": {"pl": "robots.txt nie pozwala nam czytać tej strony.", "en": "robots.txt does not allow us to read this site."},
    "mapping": {"pl": "Źródło API potrzebuje pól itemsPath i mapping (title, url).", "en": "An API source needs itemsPath and a mapping (title, url)."},
    "invalid": {"pl": "Wpis w rejestrze jest niepoprawny (brak id, method lub baseUrl, albo zły format).",
                "en": "The registry entry is invalid (missing id, method or baseUrl, or a wrong format)."},
    "token_name": {"pl": "tokenEnv może wskazywać tylko zmienną źródła, nie ustawienie aplikacji.",
                   "en": "tokenEnv may only name a source variable, not an application setting."},
    "file": {"pl": "Plik rejestru nie jest poprawnym JSON-em.", "en": "The registry file is not valid JSON."},
}
METHODS = {"api", "feed", "sitemap", "crawl", "document"}
# Settings the app itself uses. A tokenEnv naming one of them would send that secret to a third party (PR #30 review).
APP_SETTINGS = {name.upper() for name in Settings.model_fields} | {"POSTGRES_PASSWORD", "POSTGRES_USER", "POSTGRES_DB"}
SOURCE_SETTINGS = {"OPENALEX_API_KEY"}  # app settings that are also a source's token
MAX_XML = 20  # child sitemaps followed from a sitemap index


def path() -> pathlib.Path | None:
    root = pathlib.Path(settings.sources_dir)
    for name in ("registry.json", "registry.example.json"):
        if (root / name).exists():
            return root / name
    return None


def max_new(src: dict) -> int:
    """limits.maxNew as a small positive number; anything else falls back to 2."""
    try:
        return max(0, min(int((src.get("limits") or {}).get("maxNew", 2)), 50))
    except (TypeError, ValueError, AttributeError):
        return 2


def display_name(src: dict) -> str:
    """The Polish name for a source line; `name` may be a {pl, en} object or a plain string."""
    name = src.get("name")
    if isinstance(name, dict):
        return str(name.get("pl") or name.get("en") or src["id"])
    return str(name or src["id"])


def check(src) -> str | None:
    """Why an entry cannot be used at all, or None. Bad entries are reported, never fatal."""
    if not isinstance(src, dict) or not isinstance(src.get("id"), str) or not src["id"].strip():
        return "invalid"
    if src.get("method", "api") not in METHODS:
        return "invalid"
    if src.get("method", "api") in ("api", "feed", "sitemap") and src["id"] not in BUILT_IN and not str(src.get("baseUrl", "")).startswith("http"):
        return "invalid"
    if src.get("tokenEnv") is not None and not token_name_ok(src["tokenEnv"]):
        return "token_name"
    return None


def load_checked() -> tuple[list[dict], list[dict]]:
    """(usable entries, problem rows for the admin page). A broken file or entry never breaks a run or the endpoint."""
    p = path()
    if not p:
        return [], []
    try:
        entries = json.loads(p.read_text(encoding="utf-8")).get("sources", [])
        if not isinstance(entries, list):
            raise TypeError("sources is not a list")
    except (OSError, ValueError, TypeError, AttributeError):  # unreadable or malformed: report it, never a 500
        return [], [{"id": p.name, "name": {"pl": p.name, "en": p.name}, "method": "api", "enabled": False, "tokenEnv": None,
                     "tokenPresent": None, "robots": "not_checked", "ready": False, "problem": PROBLEMS["file"]}]
    good, bad = [], []
    for i, src in enumerate(entries):
        why = check(src)
        if why is None:
            good.append(src)
        else:
            sid = src.get("id") if isinstance(src, dict) and isinstance(src.get("id"), str) and src["id"].strip() else f"entry-{i + 1}"
            bad.append({"id": sid, "name": {"pl": sid, "en": sid}, "method": src.get("method") if isinstance(src, dict) and src.get("method") in METHODS else "api",
                        "enabled": False, "tokenEnv": None, "tokenPresent": None, "robots": "not_checked", "ready": False,
                        "problem": PROBLEMS[why]})
    return good, bad


def load() -> list[dict]:
    return load_checked()[0]


def token_name_ok(name: str) -> bool:
    return bool(re.fullmatch(r"[A-Z][A-Z0-9_]{2,63}", name or "")) and (name not in APP_SETTINGS or name in SOURCE_SETTINGS)


def token(name: str | None) -> str:
    """The token value from the environment (OPENALEX_API_KEY also from .env via settings). Never logged, never
    returned by the API: every value read is registered with fetch.scrub."""
    if not name or not token_name_ok(name):
        return ""
    value = os.environ.get(name) or (str(getattr(settings, name.lower(), "") or "") if name in SOURCE_SETTINGS else "")
    if value:
        from .collectors import fetch
        fetch.register_secret(value)
    return value


def _probe_url(src: dict) -> str | None:
    if src.get("method") in ("crawl", "sitemap", "feed"):
        return src.get("baseUrl") or next(iter(src.get("urls") or []), None)
    return None


def robots_verdict(src: dict) -> str:
    url = _probe_url(src)
    if not url:
        return "not_applicable"
    try:
        from .collectors import fetch
        return "allowed" if fetch._robots_for(url).can_fetch(fetch.USER_AGENT, url) else "disallowed"
    except Exception:  # noqa: BLE001 - a readiness check must never fail the admin page
        return "not_checked"


def statuses() -> list[dict]:
    """Every entry for GET /admin/source-config: usable ones with readiness, broken ones with the reason."""
    good, bad = load_checked()
    return [status(s) for s in good] + bad


def status(src: dict, *, check_robots: bool = True) -> dict:
    """SourceConfigStatus in the contract. `tokenPresent` says whether the variable is set; the value never leaves."""
    env = src.get("tokenEnv")
    optional = bool((src.get("auth") or {}).get("optional"))
    present = bool(token(env)) if env else None
    robots = robots_verdict(src) if check_robots else "not_checked"
    problem = None
    if not src.get("enabled"):
        problem = "disabled"
    elif env and not present and not optional:
        problem = "token"
    elif robots == "disallowed":
        problem = "robots"
    elif src.get("method") == "api" and src.get("id") not in BUILT_IN and not (src.get("itemsPath") and (src.get("mapping") or {}).get("url")):
        problem = "mapping"
    name = src.get("name") if isinstance(src.get("name"), dict) else {"pl": display_name(src), "en": display_name(src)}
    return {"id": src["id"], "name": name, "method": src.get("method", "api"),
            "enabled": bool(src.get("enabled")), "tokenEnv": env, "tokenPresent": present, "robots": robots,
            "ready": problem is None, "problem": PROBLEMS.get(problem) if problem else None}


def jsonpath(obj, expr: str):
    """A small JSONPath: $.a.b, $.items[0].name. Returns None when a step is missing."""
    cur = obj
    for name, index in re.findall(r"\.?([^.\[\]]+)|\[(\d+)\]", (expr or "").removeprefix("$")):
        try:
            cur = cur[int(index)] if index else cur[name]
        except (KeyError, IndexError, TypeError):
            return None
    return cur


def _headers_and_url(src: dict) -> tuple[str, dict]:
    url, headers = src["baseUrl"], {}  # fetch.get keeps a token on its own host and scrubs it from every message
    auth = src.get("auth") or {}
    value = token(src.get("tokenEnv"))
    if value and auth.get("in") == "header":
        headers[auth.get("name", "Authorization")] = f"{auth['scheme']} {value}" if auth.get("scheme") else value
    elif value and auth.get("in") == "query":
        url += ("&" if "?" in url else "?") + f"{auth.get('name', 'api_key')}={value}"
    return url, headers


def api_items(src: dict, *, offline: bool = False) -> list[dict]:
    """Items of a generic API source, each as {url, title, text}. The text holds only the mapped fields."""
    from .collectors import fetch
    url, headers = _headers_and_url(src)
    secret = {(src.get("auth") or {}).get("name", "")} - {""}
    raw, _ = fetch.get(url, offline=offline, check_robots=False, headers=headers or None, cache_tag=f"registry:{src['id']}",
                       secret_params=secret)
    items = jsonpath(json.loads(raw), src.get("itemsPath", "$")) or []
    out = []
    for item in items if isinstance(items, list) else []:
        fields = {k: jsonpath(item, p) for k, p in (src.get("mapping") or {}).items()}
        link = str(fields.get("url") or "")
        if not link.startswith("http") or not fields.get("title"):
            continue
        out.append({"url": link, "title": str(fields["title"]),
                    "text": "\n".join(f"{k}: {v}" for k, v in fields.items() if v not in (None, "", [], {}))})
    return out


def _xml_text(body: bytes) -> str:
    """XML as text: gzip is unpacked (with the same size cap), CDATA wrappers are dropped. No XML parser is used, so
    no entity expansion or external entities (XXE)."""
    from .collectors import fetch
    if body[:2] == b"\x1f\x8b":
        with gzip.GzipFile(fileobj=io.BytesIO(body)) as f:
            body = f.read(fetch.settings.fetch_max_bytes + 1)
        if len(body) > fetch.settings.fetch_max_bytes:
            raise ValueError("unpacked sitemap is too large")
    return re.sub(r"<!\[CDATA\[(.*?)\]\]>", r"\1", body.decode("utf-8", "ignore"), flags=re.DOTALL)


def _links(text: str, method: str) -> list[str]:
    if method == "sitemap":
        found = re.findall(r"<loc>\s*([^<]+?)\s*</loc>", text)
    else:  # RSS <link>…</link>, or Atom <link href="…"/>
        found = (re.findall(r"<item\b.*?<link>\s*([^<]+?)\s*</link>", text, re.DOTALL)
                 or re.findall(r"<entry\b.*?<link[^>]*href=[\"']([^\"']+)[\"']", text, re.DOTALL))
    return [html.unescape(u.strip()) for u in found]


def page_urls(src: dict, *, offline: bool = False) -> list[str]:
    """Links to read for feed, sitemap and crawl sources. A sitemap index is followed one level (at most MAX_XML
    child sitemaps). Links must stay on the feed's own host unless filters.allowOtherHosts is true."""
    from .collectors import fetch
    if src.get("method") == "crawl":
        return [u for u in src.get("urls") or [] if u.startswith("http")]
    text = _xml_text(fetch.get(src["baseUrl"], offline=offline)[0])
    urls = _links(text, src.get("method"))
    if src.get("method") == "sitemap" and "<sitemapindex" in text:
        children, urls = urls[:MAX_XML], []
        for child in children:  # child sitemaps obey the same host rule as the links
            if filters_allow_host(src, child):
                urls += _links(_xml_text(fetch.get(child, offline=offline)[0]), "sitemap")
    need = (src.get("filters") or {}).get("urlContains")
    return [u for u in dict.fromkeys(urls)
            if u.startswith(("http://", "https://")) and (not need or need in u) and filters_allow_host(src, u)]


def filters_allow_host(src: dict, url: str) -> bool:
    """Links stay on the feed's own host unless filters.allowOtherHosts is true."""
    if (src.get("filters") or {}).get("allowOtherHosts"):
        return True
    return (urlparse(url).hostname or "").lower() == (urlparse(src["baseUrl"]).hostname or "").lower()
