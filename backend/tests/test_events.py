import datetime as dt
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.db import connection
from app.main import app

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a database")
client = TestClient(app)


@pytest.fixture(scope="module")
def auth():
    r = client.post("/api/v1/auth/register", json={
        "provider": "sandbox_id", "providerSubject": f"ev-{uuid.uuid4().hex[:8]}", "email": "e@example.invalid", "role": "schools",
        "affiliation": {"name": "T", "type": "school"}, "interests": [], "acceptedTerms": True}).json()["data"]
    h = {"Authorization": f"Bearer {r['token']}"}
    yield h
    client.delete("/api/v1/me", headers=h)


def ev(**over):
    return {"eventId": str(uuid.uuid4()), "type": "search_performed", "occurredAt": dt.datetime.now(dt.UTC).isoformat(), **over}


def test_event_is_stored_once_with_role_and_no_user_id(auth):
    e = ev(area="educational", tags=["stem"], resultCount=3)
    assert client.post("/api/v1/events", json=e, headers=auth).status_code == 202
    assert client.post("/api/v1/events", json=e, headers=auth).status_code == 202  # retry is safe
    with connection() as c:
        rows = c.execute("SELECT * FROM events WHERE event_id = %s", (e["eventId"],)).fetchall()
        assert len(rows) == 1 and rows[0]["role"] == "schools"
        assert not any("user" in k for k in rows[0])
        c.execute("DELETE FROM events WHERE event_id = %s", (e["eventId"],))


def test_event_rules(auth):
    assert client.post("/api/v1/events", json=ev(), headers={}).status_code == 401
    assert client.post("/api/v1/events", json=ev(query="free text"), headers=auth).status_code == 422  # closed shape
    assert client.post("/api/v1/events", json=ev(type="other"), headers=auth).status_code == 422
    assert client.post("/api/v1/events", json=ev(tags=["x"] * 11), headers=auth).status_code == 422
    assert client.post("/api/v1/events", json=ev(cardId=str(uuid.uuid4())), headers=auth).status_code == 422
    future = (dt.datetime.now(dt.UTC) + dt.timedelta(days=1)).isoformat()
    assert client.post("/api/v1/events", json=ev(occurredAt=future), headers=auth).status_code == 422


def test_usage_hides_small_counts_and_labels_values(auth):
    ids = []
    for _ in range(6):
        e = ev(area="technological", tags=["energy"], audience="schools")
        ids.append(e["eventId"])
        client.post("/api/v1/events", json=e, headers=auth)
    lone = ev(area="educational")
    client.post("/api/v1/events", json=lone, headers=auth)
    d = client.get("/api/v1/stats/usage", headers=auth).json()["data"]
    assert d["totalSearches"] >= 7
    values = {x["value"] for x in d["topAreas"]}
    assert "technological" in values and "educational" not in values  # 1 event is below the minimum
    assert all(x["label"]["pl"] and x["label"]["en"] for x in d["topAreas"] + d["searchesByAudience"])
    assert client.get("/api/v1/stats/usage?from=2026-12-01&to=2026-11-01", headers=auth).status_code == 422
    with connection() as c:
        c.execute("DELETE FROM events WHERE event_id = ANY(%s::uuid[]) OR event_id = %s", (ids, lone["eventId"]))
