"""Machine translation of queued person-facing texts (task B15).

    python -m app.translate            translate everything that is queued, then stop
    python -m app.translate --backfill  first walk the API in every language, so every text the site shows is queued

The API queues every text it could not serve in the requested language (table `translations`, text NULL).
The worker calls `translate_pending()` on each loop. Without ANTHROPIC_API_KEY nothing is translated and the API keeps
serving English for Ukrainian. Rows stay `machine = true`; the card shows `machineTranslated` until a person reviews.
"""
import sys
import uuid

import anthropic
from pydantic import BaseModel, Field

from .collectors.extract import MODEL
from .config import settings
from .db import close_pool, connection

NAMES = {"pl": "Polish", "en": "English", "uk": "Ukrainian"}
SYSTEM = """You translate short texts for Pomysłownik!, a public catalogue of Polish innovations, into one target language.
Rules:
- Translate the meaning naturally, in the register of a public-sector website. Never add or drop information.
- Keep names of organisations, places, programmes and products as they are (do not translate "Politechnika Warszawska").
- Keep every number, date, unit symbol, URL, patent number and code exactly as written.
- Text inside quotation marks („…”, "…") is a quote from a source: keep it exactly as written, in its own language.
- Return one translation per input id, in the same order. Return only the translation, no comments."""


class Item(BaseModel):
    id: int
    text: str = Field(description="The translation")


class Batch(BaseModel):
    items: list[Item]


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key or None)


def translate_batch(target: str, texts: list[str]) -> list[str]:
    """One structured call for up to `translate_batch` texts. Raises RuntimeError on a refusal or a bad answer."""
    listing = "\n\n".join(f'<text id="{i}">\n{t}\n</text>' for i, t in enumerate(texts))
    response = _client().beta.messages.parse(
        model=MODEL, max_tokens=16000, system=SYSTEM, output_config={"effort": "low"},
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        messages=[{"role": "user", "content": f"Target language: {NAMES[target]}.\n\n{listing}"}], output_format=Batch)
    if response.stop_reason == "refusal":
        raise RuntimeError("the model declined to translate this batch")
    if response.stop_reason == "max_tokens" or response.parsed_output is None:
        raise RuntimeError("the translation was cut off")
    got = {i.id: i.text.strip() for i in response.parsed_output.items}
    if set(got) != set(range(len(texts))) or not all(got.values()):
        raise RuntimeError("the answer does not have one translation per text")
    return [got[i] for i in range(len(texts))]


def translate_pending(limit: int | None = None) -> int:
    """Translate up to `limit` queued rows (default: one batch per target language). Returns how many were stored."""
    if not settings.anthropic_api_key:
        return 0
    done = 0
    with connection() as conn:
        targets = [r["target_lang"] for r in conn.execute(
            "SELECT DISTINCT target_lang FROM translations WHERE text IS NULL AND attempts < 3").fetchall()]
    for target in targets:
        with connection() as conn:
            rows = conn.execute("""SELECT source_hash, source_text FROM translations
                                   WHERE target_lang = %s AND text IS NULL AND attempts < 3 ORDER BY created_at LIMIT %s""",
                                (target, limit or settings.translate_batch)).fetchall()
        if not rows:
            continue
        try:
            out = translate_batch(target, [r["source_text"] for r in rows])
        except (RuntimeError, anthropic.APIError) as exc:
            print(f"translation to {target} failed: {type(exc).__name__}: {exc}")
            with connection() as conn:
                conn.execute("UPDATE translations SET attempts = attempts + 1 WHERE target_lang = %s AND source_hash = ANY(%s)",
                             (target, [r["source_hash"] for r in rows]))
            continue
        with connection() as conn, conn.cursor() as cur:
            cur.executemany("""UPDATE translations SET text = %s, translated_at = now(), machine = true
                               WHERE source_hash = %s AND target_lang = %s""",
                            [(t, r["source_hash"], target) for t, r in zip(out, rows)])
        done += len(rows)
    return done


def backfill() -> int:
    """Walk the API in every supported language, so every text the site can show is queued. Returns the queue size."""
    from fastapi.testclient import TestClient

    from .main import app
    c = TestClient(app)
    subject = f"translate-{uuid.uuid4().hex[:10]}"
    r = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": subject, "email": f"{subject}@example.invalid",
                                              "role": "universities", "affiliation": {"name": "Backfill", "type": "other"},
                                              "interests": [], "acceptedTerms": True})
    h = {"Authorization": f"Bearer {r.json()['data']['token']}", "Accept-Language": "uk"}
    try:
        ids = [x["id"] for x in c.get("/api/v1/cards?limit=100", headers=h).json()["data"]]
        for path in ["/api/v1/auth/providers", "/api/v1/audiences", "/api/v1/facets", "/api/v1/tags?limit=100",
                     "/api/v1/sources?limit=100", "/api/v1/stats/overview", "/api/v1/stats/usage", "/api/v1/me",
                     f"/api/v1/compare?ids={','.join(ids[:2])}", "/api/v1/cards/00000000-0000-4000-8000-000000000000"]:
            c.get(path, headers=h)
        for cid in ids:
            for path in (f"/api/v1/cards/{cid}", f"/api/v1/cards/{cid}/similar?limit=5", f"/api/v1/cards/{cid}/history"):
                c.get(path, headers=h)
        for lang in ("pl", "uk"):  # error messages are written in English
            c.get("/api/v1/cards", headers={"Accept-Language": lang})
            c.get("/api/v1/compare?ids=x", headers={**h, "Accept-Language": lang})
    finally:
        c.delete("/api/v1/me", headers=h)
    with connection() as conn:
        return conn.execute("SELECT count(*) AS n FROM translations WHERE text IS NULL").fetchone()["n"]


def main(argv: list[str]) -> int:
    if "--backfill" in argv:
        print("queued:", backfill())
    total = 0
    while True:
        n = translate_pending()
        total += n
        if n == 0:
            break
        print("translated", total)
    with connection() as conn:
        left = conn.execute("SELECT count(*) AS n FROM translations WHERE text IS NULL AND attempts < 3").fetchone()["n"]
    print(f"done: {total} translated, {left} still queued" + ("" if settings.anthropic_api_key else " (ANTHROPIC_API_KEY is not set)"))
    close_pool()
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
