"""Collection and refresh runs (tasks B6, B7). The worker calls execute(run) for each queued run.

collect: gathers new cards from the targets in data/sources/targets.json (PTT crawl, RAD-on API, PDFs), adds
         OpenAlex evidence, then scores every card.
refresh: re-reads the sources of known cards. A source that is gone, or no longer contains the quoted passage, is a
         status change. A collected card whose page changed is extracted again, and a new level is a status change.
"""
import hashlib
import json
import logging
import pathlib

import anthropic
import httpx
import psycopg
from pypdf.errors import PyPdfError

from . import enrich, score
from .collectors import crawler, documents, fetch, radon
from .collectors.build import card_id_for, save_snapshot_card, store
from .collectors.extract import NotAnInnovation, on_page
from .config import settings
from .db import connection

log = logging.getLogger("pipeline")
ITEM_ERRORS = (httpx.HTTPError, ValueError, RuntimeError, KeyError, fetch.Blocked, anthropic.APIError, psycopg.Error,
               FileNotFoundError, PyPdfError)


class Run:
    def __init__(self, row: dict):
        self.id, self.mode = row["id"], row["mode"]
        self.source_ids = row.get("source_ids") or []
        self.added = self.updated = self.changes = self.errors = self.checked = 0
        self.changed: list[str] = []
        self.lines: list[str] = []

    def note(self, msg: str) -> None:
        log.info("run %s: %s", self.id, msg)
        self.lines.append(msg[:300])

    def save(self, status: str | None = None) -> None:
        with connection() as conn:
            conn.execute("""UPDATE collect_runs SET cards_added=%s, cards_updated=%s, status_changes=%s, errors=%s, cards_checked=%s,
                              changed_card_ids=%s, log=%s, status=COALESCE(%s, status),
                              finished_at=CASE WHEN %s IN ('succeeded','failed') THEN now() ELSE finished_at END WHERE id=%s""",
                         (self.added, self.updated, self.changes, self.errors, self.checked, list(dict.fromkeys(self.changed)),
                          self.lines[-200:], status, status, self.id))


def targets() -> dict:
    return json.loads((pathlib.Path(settings.sources_dir) / "targets.json").read_text(encoding="utf-8"))


def known_ids() -> set[str]:
    with connection() as conn:
        return {str(r["id"]) for r in conn.execute("SELECT id FROM cards").fetchall()}


def skipped() -> set[str]:
    with connection() as conn:
        return {r["url"] for r in conn.execute("SELECT url FROM skipped_sources").fetchall()}


def remember_skip(url: str, reason: str) -> None:
    with connection() as conn:
        conn.execute("""INSERT INTO skipped_sources (url, reason) VALUES (%s,%s)
                        ON CONFLICT (url) DO UPDATE SET reason = EXCLUDED.reason, skipped_at = now()""", (url, reason[:300]))


def linked(card_id: str, url: str) -> bool:
    with connection() as conn:
        return bool(conn.execute("""SELECT 1 FROM card_sources cs JOIN sources s ON s.id = cs.source_id
                                    WHERE cs.card_id = %s AND s.url = %s""", (card_id, url)).fetchone())


def _keep(run: Run, card: dict) -> None:
    result = store(card)
    save_snapshot_card(card)
    run.changed.append(card["id"])
    if result["added"]:
        run.added += 1
        run.note(f"added {card['title'].get('en', '')[:80]}")
    else:
        run.updated += 1
    if result["statusChange"]:
        run.changes += 1
        run.note(f"status change on {card['id']}: {result['statusChange']}")


def ptt_cards() -> int:
    """Cards that link a PTT listing."""
    with connection() as conn:
        return conn.execute("""SELECT count(DISTINCT cs.card_id) AS n FROM card_sources cs JOIN sources s ON s.id = cs.source_id
                               WHERE s.url LIKE 'http%%://ptt.arp.pl/%%'""").fetchone()["n"]


def ptt_quota(ptt: dict, budget: int) -> int:
    """New PTT listings this run may add. PTT terms §2.3 and §2.11 (issue #10): never copy a substantial part of the
    database, so the run never takes the total past `max_cards_total`, whatever max_new and the budget allow."""
    room = int(ptt.get("max_cards_total", 30)) - ptt_cards()
    return max(0, min(int(ptt.get("max_new", 3)), budget, room))


def collect(run: Run) -> None:
    t = targets()
    budget = int(t.get("max_new_per_run", 6))
    ids, skip = known_ids(), skipped()

    for doc in t.get("documents", []):
        target = doc.get("enrich_card") or card_id_for(doc["url"])
        if linked(target, doc["url"]) or doc["url"] in skip:
            continue  # already read (a refresh run re-checks it) or judged not to be an innovation
        try:
            if doc.get("enrich_card"):
                out = documents.enrich_with_pdf(doc["enrich_card"], doc["url"], title=doc["title"])
                run.updated += 1
                run.changed.append(doc["enrich_card"])
                run.note(f"document added to card {doc['enrich_card']}: {out['facts']} facts")
                if out["statusChange"]:
                    run.changes += 1
            elif budget > 0:
                _keep(run, documents.collect_pdf(doc["url"], title=doc["title"]))
                budget -= 1
        except NotAnInnovation as exc:
            remember_skip(doc["url"], str(exc))
            run.note(f"document skipped {doc['url']}: {exc}")
        except ITEM_ERRORS as exc:
            run.errors += 1
            run.note(f"document failed {doc['url']}: {type(exc).__name__}: {exc}")

    ptt = t.get("ptt") or {}
    want = ptt_quota(ptt, budget) if ptt and budget > 0 else 0
    if ptt and budget > 0 and want <= 0:
        run.note(f"PTT: the total cap of {ptt.get('max_cards_total', 30)} cards is reached; no new listings read")
    if want > 0:
        read = 0
        try:
            urls_all = sorted(crawler.ptt_listing_urls(), key=lambda u: hashlib.sha256(u.encode()).hexdigest())
        except ITEM_ERRORS as exc:  # PTT down must not stop RAD-on, pages and scoring
            urls_all = []
            run.errors += 1
            run.note(f"PTT sitemap failed: {type(exc).__name__}: {exc}")
        for url in urls_all:
            if want <= 0 or read >= int(ptt.get("max_pages_read", 40)):
                break
            if card_id_for(url) in ids or url in skip:
                continue
            try:
                read += 1
                html, meta = fetch.get(url)
                text = crawler.ptt_listing_text(html)
                owner = crawler.ptt_owner_type(text)
                has_trl = "TRL " in text.split("Poziom gotowości technologicznej")[-1][:40]
                if owner not in ptt.get("owner_types", []) or not has_trl:
                    remember_skip(url, f"filtered: owner type {owner!r}, TRL stated: {has_trl}")
                    continue
                _keep(run, crawler.collect_url(url, kind="ptt", html=html, retrieved_at=meta["retrieved_at"]))
                want -= 1
                budget -= 1
            except NotAnInnovation as exc:
                remember_skip(url, str(exc))
                run.note(f"PTT skipped {url}: {exc}")
            except ITEM_ERRORS as exc:
                run.errors += 1
                run.note(f"PTT failed {url}: {type(exc).__name__}: {exc}")

    rd = t.get("radon") or {}
    if rd and budget > 0:
        want = min(int(rd.get("max_new", 2)), budget)
        for word in rd.get("title_words", []):
            if want <= 0:
                break
            try:
                projects = [p for p in radon.search(word, pages=3) if radon.usable(p, int(rd.get("since_year", 2019)))]
            except ITEM_ERRORS as exc:
                run.errors += 1
                run.note(f"RAD-on search failed for {word}: {exc}")
                continue
            for p in projects:
                if want <= 0:
                    break
                if any(card_id_for(u) in ids or u in skip for u in radon.known_urls(p)):
                    continue
                try:
                    _keep(run, radon.collect_project(p, retrieved_at=fetch.now_iso()))
                    ids.add(card_id_for(radon.record_url(p)))
                    want -= 1
                    budget -= 1
                except NotAnInnovation as exc:
                    remember_skip(radon.record_url(p), str(exc))
                    run.note(f"RAD-on skipped {p.get('uid')}: {exc}")
                except ITEM_ERRORS as exc:
                    run.errors += 1
                    run.note(f"RAD-on failed {p.get('uid')}: {type(exc).__name__}: {exc}")

    for page in t.get("pages", []):
        if budget <= 0 or card_id_for(page) in ids or page in skip:
            continue
        try:
            _keep(run, crawler.collect_url(page, kind="page"))
            budget -= 1
        except NotAnInnovation as exc:
            remember_skip(page, str(exc))
            run.note(f"page skipped {page}: {exc}")
        except ITEM_ERRORS as exc:
            run.errors += 1
            run.note(f"page failed {page}: {type(exc).__name__}: {exc}")


def _source_text(data: bytes) -> str:
    """Full text for checking quotes. Extraction uses a focused text; verification must see everything on the page."""
    return documents.pdf_text(data) if data.startswith(b"%PDF") else crawler.full_text(data)


def refresh(run: Run) -> None:
    from .seed import seed_ids
    curated = seed_ids()  # reviewed cards: a changed page is flagged in the history, never re-extracted over the review
    with connection() as conn:
        rows = conn.execute("""SELECT cs.card_id, cs.source_id, cs.passage, cs.state, s.url, s.type
                               FROM card_sources cs JOIN sources s ON s.id = cs.source_id
                               WHERE cs.passage IS NOT NULL AND s.type IN ('crawl', 'document')
                                 AND (%(ids)s::uuid[] IS NULL OR cs.source_id = ANY(%(ids)s::uuid[]))
                               ORDER BY cs.card_id""", {"ids": run.source_ids or None}).fetchall()
    for r in rows:
        card_id, url = str(r["card_id"]), r["url"]
        before = r["state"] or "source_ok"  # the passage was on the page when the card was made
        try:
            data, _ = fetch.get(url)
            text = _source_text(data)
            parts = [p for p in r["passage"].split(" … ") if p.strip()]
            state = "source_ok" if all(on_page(p, text) for p in parts) else "source_changed"
        except fetch.Blocked:
            run.note(f"robots.txt now blocks {url}; not re-read")
            continue
        except httpx.HTTPStatusError as exc:
            state = "source_unavailable" if exc.response.status_code in (404, 410) else None
            if state is None:
                run.errors += 1
                run.note(f"refresh: {url} answered {exc.response.status_code}")
                continue
        except ITEM_ERRORS as exc:
            run.errors += 1
            run.note(f"refresh failed {url}: {type(exc).__name__}: {exc}")
            continue
        run.checked += 1
        with connection() as conn, conn.transaction():
            conn.execute("UPDATE card_sources SET state = %s, checked_at = now() WHERE card_id = %s AND source_id = %s",
                         (state, card_id, r["source_id"]))
            if state == "source_ok":
                conn.execute("UPDATE cards SET last_checked_at = now() WHERE id = %s", (card_id,))
            if state != before:
                conn.execute("""INSERT INTO status_history (card_id, field, from_value, to_value, source_id) VALUES (%s,'other',%s,%s,%s)""",
                             (card_id, before, state, r["source_id"]))
                conn.execute("UPDATE cards SET status_changed_at = now() WHERE id = %s", (card_id,))
                run.changes += 1
                run.changed.append(card_id)
                run.note(f"{card_id}: {before} -> {state} ({url})")
        # A card we collected ourselves is extracted again when its page changed. Curated seed cards are not
        # overwritten; their change stays visible in the history for a person to review.
        if state == "source_changed" and card_id == card_id_for(url) and r["type"] == "crawl" and card_id not in curated:
            try:
                _keep(run, crawler.collect_url(url, kind="ptt" if "ptt.arp.pl" in url else "page"))
            except ITEM_ERRORS as exc:
                run.errors += 1
                run.note(f"re-extraction failed {url}: {type(exc).__name__}: {exc}")


def execute(row: dict) -> None:
    run = Run(row)
    try:
        if run.mode == "collect":
            collect(run)
            enrich.main(close=False)
        else:
            refresh(run)
        score.main(close=False)
        run.save("succeeded")
        run.note("done")
        run.save()
    except Exception as exc:
        log.exception("run %s failed", run.id)
        run.note(f"run failed: {type(exc).__name__}: {exc}")
        run.save("failed")
