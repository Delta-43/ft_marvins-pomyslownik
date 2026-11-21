"""B11: every response of the live endpoints validates against docs/api/openapi.yaml (JSON Schema 2020-12).

Runs against the app with a seeded database. Set CONTRACT_BASE_URL to check a deployed server instead
(it then registers a throw-away sandbox user and deletes it at the end).
"""
import os
import pathlib
import uuid

import httpx
import jsonschema
import pytest
import yaml

SPEC = yaml.safe_load((pathlib.Path(__file__).resolve().parents[2] / "docs" / "api" / "openapi.yaml").read_text(encoding="utf-8"))
BASE = os.environ.get("CONTRACT_BASE_URL")
pytestmark = pytest.mark.skipif(not (BASE or os.environ.get("DATABASE_URL")), reason="needs a database or CONTRACT_BASE_URL")


def schema_for(path: str, method: str, status: str) -> dict:
    resp = SPEC["paths"][path][method]["responses"][status]
    if "$ref" in resp:
        resp = SPEC["components"]["responses"][resp["$ref"].split("/")[-1]]
    return {**resp["content"]["application/json"]["schema"], "components": SPEC["components"]}


def check(response, path: str, method: str = "get", status: int = 200) -> dict:
    assert response.status_code == status, (path, response.status_code, response.text[:300])
    body = response.json()
    errors = sorted(jsonschema.Draft202012Validator(schema_for(path, method, str(status))).iter_errors(body), key=str)
    assert not errors, f"{method.upper()} {path}: " + "; ".join(f"{list(e.absolute_path)}: {e.message[:160]}" for e in errors[:5])
    return body


@pytest.fixture(scope="module")
def client():
    if BASE:
        with httpx.Client(base_url=BASE, timeout=30) as c:
            yield c
    else:
        from fastapi.testclient import TestClient

        from app.main import app
        yield TestClient(app)


@pytest.fixture(scope="module")
def auth(client):
    body = {"provider": "sandbox_id", "providerSubject": f"contract-{uuid.uuid4().hex[:10]}", "email": "contract@example.invalid",
            "role": "universities", "affiliation": {"name": "Contract test", "type": "other"}, "interests": [], "acceptedTerms": True}
    session = check(client.post("/api/v1/auth/register", json=body), "/api/v1/auth/register", "post", 201)["data"]
    h = {"Authorization": f"Bearer {session['token']}"}
    yield h
    assert client.delete("/api/v1/me", headers=h).status_code == 204


def test_public_endpoints(client):
    check(client.get("/health"), "/health")
    check(client.get("/api/v1/audiences"), "/api/v1/audiences")
    check(client.get("/api/v1/auth/providers"), "/api/v1/auth/providers")


def test_errors_use_the_envelope(client, auth):
    check(client.get("/api/v1/cards"), "/api/v1/cards", status=401)
    check(client.get(f"/api/v1/cards/{uuid.uuid4()}", headers=auth), "/api/v1/cards/{cardId}", status=404)
    check(client.get("/api/v1/cards?area=bogus", headers=auth), "/api/v1/cards", status=422)


def test_every_read_endpoint(client, auth):
    cards = check(client.get("/api/v1/cards?limit=100", headers=auth), "/api/v1/cards")["data"]
    assert len(cards) >= 3
    check(client.get("/api/v1/cards?q=szkoła&sort=relevance", headers=auth), "/api/v1/cards")
    check(client.get("/api/v1/cards?audience=schools", headers=auth), "/api/v1/cards")
    for c in cards:  # every card, so one malformed card cannot hide
        check(client.get(f"/api/v1/cards/{c['id']}", headers=auth), "/api/v1/cards/{cardId}")
    first = cards[0]["id"]
    check(client.get(f"/api/v1/cards/{first}/similar", headers=auth), "/api/v1/cards/{cardId}/similar")
    check(client.get(f"/api/v1/cards/{first}/history", headers=auth), "/api/v1/cards/{cardId}/history")
    ids = ",".join(c["id"] for c in cards[:3])
    check(client.get(f"/api/v1/compare?ids={ids}", headers=auth), "/api/v1/compare")
    check(client.get("/api/v1/facets", headers=auth), "/api/v1/facets")
    check(client.get("/api/v1/facets?trlMin=3&minCredibility=10&includeStale=false&polishIpStatus=stated", headers=auth), "/api/v1/facets")
    check(client.get("/api/v1/tags", headers=auth), "/api/v1/tags")
    check(client.get("/api/v1/tags?sort=count&limit=5", headers=auth), "/api/v1/tags")
    check(client.get("/api/v1/cards?polishIpStatus=stated,confirmed", headers=auth), "/api/v1/cards")
    check(client.get("/api/v1/sources?limit=100", headers=auth), "/api/v1/sources")
    check(client.get("/api/v1/stats/overview", headers=auth), "/api/v1/stats/overview")
    check(client.get("/api/v1/stats/usage", headers=auth), "/api/v1/stats/usage")
    check(client.get("/api/v1/me", headers=auth), "/api/v1/me")
    check(client.patch("/api/v1/me", json={"interests": ["energy"]}, headers=auth), "/api/v1/me", "patch")
