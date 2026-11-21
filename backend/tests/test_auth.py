"""Sign-in flow against a real database. Skipped when DATABASE_URL is not set."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a database")
client = TestClient(app)


def body(subject, **over):
    b = {"provider": "sandbox_id", "providerSubject": subject, "email": "test.user@example.invalid", "role": "schools",
         "affiliation": {"name": "Test school", "type": "school"}, "interests": ["robotics"], "acceptedTerms": True}
    return {**b, **over}


def test_full_lifecycle():
    sub = f"test-{uuid.uuid4().hex[:10]}"
    r = client.post("/api/v1/auth/register", json=body(sub))
    assert r.status_code == 201
    s = r.json()["data"]
    assert s["user"]["identityVerified"] is False and s["user"]["role"] == "schools"
    h = {"Authorization": f"Bearer {s['token']}"}

    assert client.get("/api/v1/cards", headers=h).status_code == 200
    assert client.post("/api/v1/auth/register", json=body(sub)).json()["error"]["code"] == "account_exists"
    me = client.patch("/api/v1/me", json={"role": "inventors", "interests": []}, headers=h).json()["data"]
    assert me["role"] == "inventors" and me["interests"] == []
    assert client.patch("/api/v1/me", json={}, headers=h).status_code == 422

    again = client.post("/api/v1/auth/login", json={"provider": "sandbox_id", "providerSubject": sub.upper()}).json()["data"]
    h2 = {"Authorization": f"Bearer {again['token']}"}
    assert client.post("/api/v1/auth/logout", headers=h2).status_code == 204
    assert client.get("/api/v1/me", headers=h2).status_code == 401

    assert client.delete("/api/v1/me", headers=h).status_code == 204
    assert client.get("/api/v1/me", headers=h).status_code == 401
    assert client.post("/api/v1/auth/login", json={"provider": "sandbox_id", "providerSubject": sub}).json()["error"]["code"] == "registration_required"


def test_terms_and_validation_and_bad_token():
    sub = f"test-{uuid.uuid4().hex[:10]}"
    assert client.post("/api/v1/auth/register", json=body(sub, acceptedTerms=False)).json()["error"]["code"] == "terms_not_accepted"
    assert client.post("/api/v1/auth/register", json=body(sub, role="king")).json()["error"]["code"] == "validation_failed"
    assert client.post("/api/v1/auth/register", content="{nope", headers={"Content-Type": "application/json"}).status_code == 400
    assert client.get("/api/v1/cards", headers={"Authorization": "Bearer not-a-real-token"}).status_code == 401
    assert client.get("/api/v1/auth/providers").json()["data"][0]["id"] == "sandbox_id"
