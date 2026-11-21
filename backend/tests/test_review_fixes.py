"""Regression tests for the code-review findings of 2026-11-21."""
import json
import os
import pathlib
import uuid

import pytest
from fastapi.testclient import TestClient

from app.errors import ApiError
from app.security import RateLimiter, client_address

needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
SEED = pathlib.Path(__file__).resolve().parents[2] / "data" / "seed" / "cards"


class Req:
    def __init__(self, headers, host="10.0.0.1"):
        self.headers, self.client = headers, type("C", (), {"host": host})()


def test_forwarded_for_is_not_trusted_but_cloudflare_header_is():
    assert client_address(Req({"x-forwarded-for": "1.2.3.4"})) == "10.0.0.1"
    assert client_address(Req({"cf-connecting-ip": "5.6.7.8", "x-forwarded-for": "1.2.3.4"})) == "5.6.7.8"


def test_limiter_blocks_and_prunes():
    lim = RateLimiter(limit=2, window=60)
    lim.hit("a")
    lim.hit("a")
    with pytest.raises(ApiError):
        lim.hit("a")
    lim.window = 0  # everything is old now
    for i in range(600):
        lim.hit(f"k{i}")
    assert len(lim.hits) < 600


@needs_db
def test_reseed_keeps_events_history_and_attached_sources():
    from app.db import connection
    from app.seed import load_card
    card = json.loads((SEED / "gov-men-szkola-dla-innowatora.json").read_text(encoding="utf-8"))
    cid = card["id"]
    extra_url = f"https://example.invalid/report-{uuid.uuid4()}.pdf"
    with connection() as conn, conn.transaction():
        load_card(conn, card)
        src = conn.execute("INSERT INTO sources (type, name, url) VALUES ('document','Test PDF',%s) RETURNING id", (extra_url,)).fetchone()["id"]
        conn.execute("INSERT INTO card_sources (card_id, source_id, passage, passage_lang) VALUES (%s,%s,'cytat','pl')", (cid, src))
        conn.execute("INSERT INTO evidence (card_id, metric, label, value, source_id, query) VALUES (%s,'x','{}','1',%s,'q')", (cid, src))
        ev = conn.execute("INSERT INTO events (event_id, type, occurred_at, card_id) VALUES (%s,'card_viewed',now(),%s) RETURNING event_id",
                          (str(uuid.uuid4()), cid)).fetchone()["event_id"]
        conn.execute("INSERT INTO status_history (card_id, field, from_value, to_value) VALUES (%s,'other','source_ok','source_changed')", (cid,))
    try:
        with connection() as conn, conn.transaction():
            load_card(conn, card)  # the re-seed
            assert conn.execute("SELECT card_id FROM events WHERE event_id = %s", (ev,)).fetchone()["card_id"] is not None
            assert conn.execute("SELECT count(*) AS n FROM card_sources WHERE card_id = %s AND source_id = %s", (cid, src)).fetchone()["n"] == 1
            assert conn.execute("SELECT count(*) AS n FROM evidence WHERE card_id = %s AND source_id = %s", (cid, src)).fetchone()["n"] == 1
            assert conn.execute("SELECT count(*) AS n FROM status_history WHERE card_id = %s AND to_value = 'source_changed'", (cid,)).fetchone()["n"] >= 1
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM events WHERE event_id = %s", (ev,))
            conn.execute("DELETE FROM status_history WHERE card_id = %s AND to_value = 'source_changed'", (cid,))
            conn.execute("DELETE FROM card_sources WHERE source_id = %s", (src,))
            conn.execute("DELETE FROM evidence WHERE source_id = %s", (src,))
            conn.execute("DELETE FROM sources WHERE id = %s", (src,))


@needs_db
def test_skipped_sources_are_remembered():
    from app import pipeline
    url = f"https://example.invalid/{uuid.uuid4()}"
    pipeline.remember_skip(url, "not an innovation")
    assert url in pipeline.skipped()


@needs_db
def test_accented_query_matches_through_like():
    from app.main import app
    c = TestClient(app)
    r = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"acc-{uuid.uuid4().hex[:8]}",
                                               "email": "a@example.invalid", "role": "schools", "affiliation": {"name": "T", "type": "school"},
                                               "interests": [], "acceptedTerms": True}).json()["data"]
    h = {"Authorization": f"Bearer {r['token']}"}
    try:
        assert c.get("/api/v1/cards?q=szkoła", headers=h).json()["meta"]["total"] >= 1
        assert c.get("/api/v1/cards?q=Łódź", headers=h).json()["meta"]["total"] >= 1
    finally:
        c.delete("/api/v1/me", headers=h)


@needs_db
def test_identity_limit_does_not_block_other_identities():
    from app.main import app
    c = TestClient(app)
    sub = f"lim-{uuid.uuid4().hex[:8]}"
    codes = [c.post("/api/v1/auth/login", json={"provider": "sandbox_id", "providerSubject": sub}).status_code for _ in range(11)]
    assert codes[:10] == [404] * 10 and codes[10] == 429
    assert c.post("/api/v1/auth/login", json={"provider": "sandbox_id", "providerSubject": sub + "x"}).status_code == 404
