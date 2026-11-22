"""Fixes from Philip's review of PR #28: PTT cap, card removal, curated cards, seeded history, stale and scoring rules."""
import copy
import json
import os
import pathlib
import uuid

import pytest

from app import pipeline
from app.collectors.build import sector_named

needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
SEED = pathlib.Path(__file__).resolve().parents[2] / "data" / "seed" / "cards"
DESILTING = "e7ddd917-2546-5e40-9d13-d47ba47930ea"
ROTOMOLDING = "175ffb50-1c2b-5cfc-8713-06de5ed8ff3f"


def test_ptt_quota_never_passes_the_total_cap(monkeypatch):
    ptt = {"max_new": 3, "max_cards_total": 30}
    monkeypatch.setattr(pipeline, "ptt_cards", lambda: 29)
    assert pipeline.ptt_quota(ptt, budget=6) == 1          # 29 + 1 = 30, never 32
    monkeypatch.setattr(pipeline, "ptt_cards", lambda: 30)
    assert pipeline.ptt_quota(ptt, budget=6) == 0
    monkeypatch.setattr(pipeline, "ptt_cards", lambda: 10)
    assert pipeline.ptt_quota(ptt, budget=2) == 2          # the run budget still applies


def test_no_sitemap_read_at_the_cap(monkeypatch):
    monkeypatch.setattr(pipeline, "targets", lambda: {"max_new_per_run": 6, "ptt": {"max_new": 3, "max_cards_total": 5}})
    monkeypatch.setattr(pipeline, "ptt_cards", lambda: 5)
    monkeypatch.setattr(pipeline, "known_ids", set)
    monkeypatch.setattr(pipeline, "skipped", set)
    def no_sitemap(*a, **k):
        raise AssertionError("the PTT sitemap must not be read at the cap")
    monkeypatch.setattr(pipeline.crawler, "ptt_listing_urls", no_sitemap)
    run = pipeline.Run({"id": uuid.uuid4(), "mode": "collect"})
    pipeline.collect(run)
    assert any("cap" in line for line in run.lines)


def test_generic_words_do_not_count_as_a_named_sector():
    text = "Produkcja przemysłowa wymaga nowych technologii i materiałów."
    assert not sector_named("Przemysł produkcyjny", text)
    assert sector_named("Kopalnie węgla", "Urządzenie stosowane w kopalniach od 2021 roku.")


@needs_db
def test_remove_cards_deletes_and_skips_both_url_forms(tmp_path):
    from app.db import connection
    from app.seed import load_card, remove_cards
    card = json.loads((SEED / "uj-cep-warsztaty-przyrodnicze.json").read_text(encoding="utf-8"))
    card["id"] = str(uuid.uuid4())
    card.pop("history", None)
    url, legacy = f"https://example.invalid/{uuid.uuid4()}", f"https://example.invalid/old/{uuid.uuid4()}"
    (tmp_path / "removed.json").write_text(json.dumps([{"id": card["id"], "url": url, "legacyUrl": legacy, "reason": "test"}]))
    with connection() as conn, conn.transaction():
        load_card(conn, card)
        assert remove_cards(conn, tmp_path) == 1
        assert not conn.execute("SELECT 1 FROM cards WHERE id = %s", (card["id"],)).fetchone()
        assert conn.execute("SELECT count(*) AS n FROM skipped_sources WHERE url = ANY(%s)", ([url, legacy],)).fetchone()["n"] == 2
        conn.execute("DELETE FROM skipped_sources WHERE url = ANY(%s)", ([url, legacy],))


@needs_db
def test_refresh_never_re_extracts_a_curated_card(monkeypatch):
    from app.db import connection
    with connection() as conn:
        row = conn.execute("""SELECT cs.source_id, cs.state, s.url FROM card_sources cs JOIN sources s ON s.id = cs.source_id
                              WHERE cs.card_id = %s AND s.type = 'crawl' AND s.url LIKE '%%ptt.arp.pl%%'""", (DESILTING,)).fetchone()
        last = conn.execute("SELECT coalesce(max(id), 0) AS m FROM status_history WHERE card_id = %s", (DESILTING,)).fetchone()["m"]
        changed_at = conn.execute("SELECT status_changed_at FROM cards WHERE id = %s", (DESILTING,)).fetchone()["status_changed_at"]
    assert pipeline.card_id_for(row["url"]) == DESILTING  # a collected card, so only the curated guard stops re-extraction
    monkeypatch.setattr(pipeline.fetch, "get", lambda url, **k: (b"<html><body><main>Strona zmieniona.</main></body></html>", {}))
    def no_extraction(*a, **k):
        raise AssertionError("a curated card must not be re-extracted")
    monkeypatch.setattr(pipeline.crawler, "collect_url", no_extraction)
    run = pipeline.Run({"id": uuid.uuid4(), "mode": "refresh", "source_ids": [str(row["source_id"])]})
    try:
        pipeline.refresh(run)
        assert run.checked == 1 and DESILTING in run.changed  # the change is flagged in the history for a person
    finally:
        with connection() as conn:
            conn.execute("UPDATE card_sources SET state = %s WHERE card_id = %s AND source_id = %s", (row["state"], DESILTING, row["source_id"]))
            conn.execute("DELETE FROM status_history WHERE card_id = %s AND id > %s", (DESILTING, last))
            conn.execute("UPDATE cards SET status_changed_at = %s WHERE id = %s", (changed_at, DESILTING))


@needs_db
def test_seeded_history_survives_a_fresh_database():
    """A card loaded for the first time (as after `down -v`) gets its history with the source's date, not today's."""
    from app.db import connection
    from app.seed import load_card
    card = json.loads((SEED / "lodz-pllum-letter-of-intent.json").read_text(encoding="utf-8"))
    card = copy.deepcopy(card)
    card["id"] = str(uuid.uuid4())
    with connection() as conn, conn.transaction():
        assert load_card(conn, card) == []      # nothing "changed": the card is new
        rows = conn.execute("SELECT at, field, to_value FROM status_history WHERE card_id = %s ORDER BY at", (card["id"],)).fetchall()
        assert [(r["at"].date().isoformat(), r["to_value"]) for r in rows] == [("2026-08-24", "pilot"), ("2026-11-22", "polish_ip_stated")]
        load_card(conn, card)                   # a re-seed adds nothing
        assert conn.execute("SELECT count(*) AS n FROM status_history WHERE card_id = %s", (card["id"],)).fetchone()["n"] == 2
        conn.execute("DELETE FROM cards WHERE id = %s", (card["id"],))


@needs_db
def test_project_dates_make_a_card_stale_and_are_not_scored():
    from fastapi.testclient import TestClient

    from app import score
    from app.db import connection
    from app.main import app
    with connection() as conn:
        card = conn.execute("SELECT * FROM cards WHERE id = %s", (ROTOMOLDING,)).fetchone()
        facts, _ = score.facts_for(conn, card)
        dates = conn.execute("SELECT count(*) AS n FROM evidence WHERE card_id = %s AND metric LIKE '%%\\_date'", (ROTOMOLDING,)).fetchone()["n"]
    assert dates == 2 and facts.source_evidence_count == 2  # polyethylene MFI and polylactide MFR, not the two dates
    c = TestClient(app)
    r = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"st-{uuid.uuid4().hex[:8]}",
                                               "email": "s@example.invalid", "role": "schools",
                                               "affiliation": {"name": "T", "type": "school"}, "interests": [], "acceptedTerms": True})
    h = {"Authorization": f"Bearer {r.json()['data']['token']}"}
    try:
        assert c.get(f"/api/v1/cards/{ROTOMOLDING}", headers=h).json()["data"]["stale"] is True   # ended 30.11.2019
        assert ROTOMOLDING not in {x["id"] for x in c.get("/api/v1/cards?includeStale=false&limit=100", headers=h).json()["data"]}
    finally:
        c.delete("/api/v1/me", headers=h)
