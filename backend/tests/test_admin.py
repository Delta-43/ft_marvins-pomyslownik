import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import connection
from app.main import app

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL") or not settings.admin_token, reason="needs a database and ADMIN_TOKEN")
client = TestClient(app)


def test_admin_token_rules_and_idempotency():
    with connection() as c:
        c.execute("DELETE FROM collect_runs")
    assert client.get("/api/v1/admin/collect-runs").status_code == 401
    assert client.get("/api/v1/admin/collect-runs", headers={"Authorization": "Bearer wrong"}).status_code == 403
    h = {"Authorization": f"Bearer {settings.admin_token}"}
    key = {"Idempotency-Key": f"key-{uuid.uuid4().hex}", **h}
    a = client.post("/api/v1/admin/collect-runs", json={"mode": "refresh"}, headers=key)
    assert a.status_code == 202 and a.json()["data"]["status"] == "queued"
    b = client.post("/api/v1/admin/collect-runs", json={"mode": "refresh"}, headers=key)
    assert b.json()["data"]["id"] == a.json()["data"]["id"]
    assert client.post("/api/v1/admin/collect-runs", json={"mode": "collect"}, headers=key).json()["error"]["code"] == "idempotency_conflict"
    other = {"Idempotency-Key": f"key-{uuid.uuid4().hex}", **h}
    assert client.post("/api/v1/admin/collect-runs", json={"mode": "refresh"}, headers=other).json()["error"]["code"] == "run_in_progress"
    assert client.get(f"/api/v1/admin/collect-runs/{a.json()['data']['id']}", headers=h).status_code == 200
    with connection() as c:
        c.execute("DELETE FROM collect_runs")
