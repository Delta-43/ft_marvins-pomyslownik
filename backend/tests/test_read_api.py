"""Read endpoints against a seeded database. Skipped when DATABASE_URL is not set."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
client = TestClient(app)
_sub = f"reader-{uuid.uuid4().hex[:8]}"
_session = client.post("/api/v1/auth/register", json={
    "provider": "sandbox_id", "providerSubject": _sub, "email": "reader@example.invalid", "role": "inventors",
    "affiliation": {"name": "Test", "type": "individual"}, "interests": [], "acceptedTerms": True}).json()["data"] if os.environ.get("DATABASE_URL") else None
AUTH = {"Authorization": f"Bearer {_session['token']}"} if _session else {}


def test_audiences_are_public_and_six():
    r = client.get("/api/v1/audiences")
    assert r.status_code == 200 and len(r.json()["data"]) == 6


def test_cards_need_a_session():
    r = client.get("/api/v1/cards")
    assert r.status_code == 401 and r.json()["error"]["code"] == "unauthorized"


def test_list_filter_and_detail():
    r = client.get("/api/v1/cards?area=technological&sort=recent", headers=AUTH)
    body = r.json()
    assert r.status_code == 200 and body["meta"]["total"] == len(body["data"]) >= 1
    first = body["data"][0]
    assert first["relevance"] is None and first["scores"]["credibility"] is not None
    d = client.get(f"/api/v1/cards/{first['id']}", headers=AUTH).json()["data"]
    assert d["sources"] and d["trlDetail"]["basis"] in ("confirmed", "estimate")
    assert all(s["passage"] for s in d["sources"])


def test_search_without_diacritics_and_unknown_card():
    r = client.get("/api/v1/cards?q=tranzystorow radiolokacji", headers=AUTH).json()
    assert r["meta"]["total"] >= 1 and r["data"][0]["relevance"] is not None
    assert client.get(f"/api/v1/cards/{uuid.uuid4()}", headers=AUTH).status_code == 404
    assert client.get("/api/v1/cards?area=bogus", headers=AUTH).json()["error"]["code"] == "validation_failed"


def test_facets_sources_overview():
    f = client.get("/api/v1/facets", headers=AUTH).json()["data"]
    assert {o["value"] for o in f["area"]} == {"technological", "educational", "administrative"}
    s = client.get("/api/v1/sources?limit=100", headers=AUTH).json()
    assert s["meta"]["total"] == len(s["data"]) >= 1 and s["data"][0]["cardCount"] >= 1
    o = client.get("/api/v1/stats/overview", headers=AUTH).json()["data"]
    assert o["cardCount"] >= 1 and 0 <= o["confirmedFieldShare"] <= 1
