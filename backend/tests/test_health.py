from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_has_contract_fields():
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert {"status", "version", "database"} <= set(body)


def test_unknown_route_uses_error_envelope():
    r = client.get("/api/v1/does-not-exist")
    assert r.status_code == 404
    err = r.json()["error"]
    assert err["code"] == "not_found" and "requestId" in err
