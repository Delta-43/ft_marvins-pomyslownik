"""Compare, similar, history and the language rule on API output. Needs a seeded database."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
client = TestClient(app)


@pytest.fixture(scope="module")
def auth():
    sub = f"cmp-{uuid.uuid4().hex[:8]}"
    r = client.post("/api/v1/auth/register", json={
        "provider": "sandbox_id", "providerSubject": sub, "email": "c@example.invalid", "role": "inventors",
        "affiliation": {"name": "T", "type": "individual"}, "interests": [], "acceptedTerms": True}).json()["data"]
    yield {"Authorization": f"Bearer {r['token']}"}
    client.delete("/api/v1/me", headers={"Authorization": f"Bearer {r['token']}"})


def ids(auth, n):
    return [c["id"] for c in client.get(f"/api/v1/cards?limit={n}", headers=auth).json()["data"]]


def test_compare_rows_are_bilingual_and_aligned(auth):
    a, b, c = ids(auth, 3)
    r = client.get(f"/api/v1/compare?ids={a},{b},{c}", headers=auth)
    d = r.json()["data"]
    assert r.status_code == 200 and [x["id"] for x in d["cards"]] == [a, b, c]
    assert {x["key"] for x in d["rows"]} >= {"area", "implementationLevel", "trl", "credibility", "polishIp"}
    for row in d["rows"]:
        assert row["label"]["pl"] and row["label"]["en"]
        assert [x["cardId"] for x in row["cells"]] == [a, b, c]
        for cell in row["cells"]:
            assert cell["display"]["pl"] and cell["display"]["en"]


def test_compare_validation(auth):
    a = ids(auth, 1)[0]
    assert client.get(f"/api/v1/compare?ids={a}", headers=auth).status_code == 422
    assert client.get(f"/api/v1/compare?ids={a},{a}", headers=auth).status_code == 422
    assert client.get(f"/api/v1/compare?ids={a},{uuid.uuid4()}", headers=auth).status_code == 404
    assert client.get("/api/v1/compare?ids=x,y", headers=auth).status_code == 422


def test_similar_and_history(auth):
    a = ids(auth, 1)[0]
    s = client.get(f"/api/v1/cards/{a}/similar?limit=3", headers=auth).json()["data"]
    assert 1 <= len(s) <= 3 and all(x["card"]["id"] != a and 0 <= x["similarity"] <= 1 and x["basis"] == "estimate" for x in s)
    assert [x["similarity"] for x in s] == sorted((x["similarity"] for x in s), reverse=True)
    assert client.get(f"/api/v1/cards/{a}/history", headers=auth).json()["data"] == []
    assert client.get(f"/api/v1/cards/{uuid.uuid4()}/similar", headers=auth).status_code == 404


def test_typo_tolerant_search_and_region_labels(auth):
    hit = client.get("/api/v1/cards?q=tranzystory radiolokacja", headers=auth).json()
    assert hit["meta"]["total"] >= 1
    f = client.get("/api/v1/facets", headers=auth).json()["data"]
    assert all(o["label"]["pl"] and o["label"]["en"] for k in ("area", "implementationLevel", "tag", "region") for o in f[k])


def test_card_detail_is_bilingual(auth):
    card = client.get(f"/api/v1/cards/{ids(auth, 1)[0]}", headers=auth).json()["data"]
    assert card["title"]["pl"] and card["title"]["en"] and card["oslo"]["note"]["pl"]
    assert all(s["passageLang"] in ("pl", "en") for s in card["sources"] if s["passage"])
    assert all(e["label"]["pl"] and e["label"]["en"] for e in card["evidence"])
    provs = [card["implementationLevelDetail"], card["trlDetail"], *card["assessment"].values()]
    for prov in provs:
        if prov.get("method"):
            assert prov["methodText"]["pl"] and prov["methodText"]["en"]
        if prov.get("explanation"):
            assert prov["explanation"]["pl"] and prov["explanation"]["en"]


def test_compare_never_shows_none_as_text(auth):
    ids_all = [c["id"] for c in client.get("/api/v1/cards?limit=100", headers=auth).json()["data"]]
    for i in range(0, len(ids_all) - 1, 4):
        chunk = ids_all[i:i + 4]
        if len(chunk) < 2:
            continue
        d = client.get(f"/api/v1/compare?ids={','.join(chunk)}", headers=auth).json()["data"]
        for row in d["rows"]:
            for cell in row["cells"]:
                assert "None" not in (cell["display"]["pl"], cell["display"]["en"]), (row["key"], cell)
