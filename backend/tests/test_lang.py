"""B15: the server picks the language; LocalizedText becomes one string; Ukrainian comes from the translation table."""
import os
import pathlib
import uuid

import jsonschema
import pytest
import yaml
from fastapi.testclient import TestClient

from app.services import lang

needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
SPEC = yaml.safe_load((pathlib.Path(__file__).resolve().parents[2] / "docs" / "api" / "openapi.yaml").read_text(encoding="utf-8"))


def test_accept_language_edge_cases():
    f = lang.from_accept_language
    assert f("uk;q=0, en;q=0.5") == "en"              # q=0 means "not this one"
    assert f("uk;q=abc, en;q=0.5") == "en"            # a malformed q is ignored, not ranked first
    assert f("*") == "pl" and f("de, *;q=0.1") == "pl"  # "*" is the default language
    assert f("en, uk") == "en" and f("uk;q=0.8, en;q=0.8") == "uk"  # ties keep the header order
    assert f("EN-gb") == "en" and f("") is None and f("de, fr") is None


def test_negotiation_order():
    assert lang.negotiate("uk", "en", "pl") == ("uk", True)                # ?lang wins
    assert lang.negotiate(None, "de, en;q=0.8, uk;q=0.9", None) == ("uk", True)
    assert lang.negotiate(None, "de", None) == ("pl", True)                # named, nothing supported: default
    assert lang.negotiate(None, None, "en") == ("en", False)               # preferredLanguage, object form
    assert lang.negotiate("xx", "", None) == ("pl", False)


def test_localize_without_database_for_pl_and_en():
    body = {"data": {"title": {"pl": "Tytuł", "en": "Title"}, "polishIp": {"true": 1, "false": 2}, "n": 3}}
    assert lang.localize(body, "en", True) == {"data": {"title": "Title", "polishIp": {"true": 1, "false": 2}, "n": 3}}
    assert lang.localize(body, "pl", True)["data"]["title"] == "Tytuł"


@pytest.fixture(scope="module")
def client():
    from app.main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def auth(client):
    r = client.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"lang-{uuid.uuid4().hex[:8]}",
                                                    "email": "l@example.invalid", "role": "schools", "preferredLanguage": "en",
                                                    "affiliation": {"name": "T", "type": "school"}, "interests": [], "acceptedTerms": True})
    assert r.status_code == 201 and r.json()["data"]["user"]["preferredLanguage"] == "en"
    h = {"Authorization": f"Bearer {r.json()['data']['token']}"}
    yield h
    client.delete("/api/v1/me", headers=h)


def schema(path: str) -> dict:
    return {**SPEC["paths"][path]["get"]["responses"]["200"]["content"]["application/json"]["schema"], "components": SPEC["components"]}


@needs_db
def test_same_call_answers_in_each_language(client, auth):
    from app.db import connection
    card = client.get("/api/v1/cards?limit=1", headers=auth).json()["data"][0]
    title = card["title"]
    src = lang.source_of(title)
    key = lang.key_for(*src)
    with connection() as conn:
        conn.execute("""INSERT INTO translations (source_hash, target_lang, source_lang, source_text, text) VALUES (%s,'uk',%s,%s,%s)
                        ON CONFLICT (source_hash, target_lang) DO UPDATE SET text = EXCLUDED.text""", (key, *src, "Тестова назва"))
    try:
        uk = client.get(f"/api/v1/cards/{card['id']}?lang=uk", headers=auth)
        assert uk.json()["data"]["title"] == "Тестова назва"
        assert uk.headers["content-language"] == "uk, en"  # the title is Ukrainian, the untranslated rest is English
        assert uk.json()["data"]["machineTranslated"] == ["uk"]
        assert "Accept-Language" in uk.headers["vary"] and uk.headers["cache-control"] == "private, no-store"
        en = client.get(f"/api/v1/cards/{card['id']}", headers={**auth, "Accept-Language": "en-GB,en;q=0.9"})
        assert en.json()["data"]["title"] == title["en"] and isinstance(en.json()["data"]["area"], str)
        legacy = client.get(f"/api/v1/cards/{card['id']}", headers=auth).json()["data"]
        assert legacy["title"] == {**title, "uk": "Тестова назва"}          # object form, uk added
        for lg in ("pl", "en", "uk"):                                        # string form still matches the contract
            body = client.get(f"/api/v1/cards?limit=5&lang={lg}", headers=auth).json()
            assert not list(jsonschema.Draft202012Validator(schema("/api/v1/cards")).iter_errors(body))
        with connection() as conn:  # texts with no translation were queued for the worker
            assert conn.execute("SELECT count(*) AS n FROM translations WHERE target_lang = 'uk' AND text IS NULL").fetchone()["n"] > 0
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM translations WHERE source_hash = %s", (key,))


@needs_db
def test_error_messages_follow_the_language(client):
    from app.db import connection
    msg = "Sign in to see this data."
    key = lang.key_for("en", msg)
    with connection() as conn:
        conn.execute("""INSERT INTO translations (source_hash, target_lang, source_lang, source_text, text) VALUES (%s,'pl','en',%s,%s)
                        ON CONFLICT (source_hash, target_lang) DO UPDATE SET text = EXCLUDED.text""", (key, msg, "Zaloguj się, aby zobaczyć te dane."))
    try:
        r = client.get("/api/v1/cards", headers={"Authorization": "Bearer nope", "Accept-Language": "pl"})
        assert r.status_code == 401 and r.json()["error"]["code"] == "unauthorized"
        r = client.get("/api/v1/cards", headers={"Accept-Language": "pl"})
        assert r.json()["error"]["message"] == "Zaloguj się, aby zobaczyć te dane." and r.headers["content-language"] == "pl"
        r = client.get("/api/v1/cards", headers={"Accept-Language": "uk"})   # no uk translation: English, and said so
        assert r.json()["error"]["message"] == msg and r.headers["content-language"] == "en"
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM translations WHERE source_hash = %s", (key,))


@needs_db
def test_worker_translates_the_queue(monkeypatch):
    from app import translate
    from app.db import connection
    text = f"Tekst testowy {uuid.uuid4().hex[:6]}"
    key = lang.key_for("pl", text)
    with connection() as conn:
        conn.execute("INSERT INTO translations (source_hash, target_lang, source_lang, source_text) VALUES (%s,'uk','pl',%s)", (key, text))
    monkeypatch.setattr(translate.settings, "anthropic_api_key", "test")
    monkeypatch.setattr(translate, "translate_batch", lambda target, texts: [f"[{target}] {t}" for t in texts])
    try:
        assert translate.translate_pending(only=[key]) == 1  # never touches the rest of the queue
        with connection() as conn:
            row = conn.execute("SELECT text, machine FROM translations WHERE source_hash = %s", (key,)).fetchone()
        assert row["text"] == f"[uk] {text}" and row["machine"] is True
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM translations WHERE source_hash = %s", (key,))


@needs_db
def test_bad_lang_is_422_and_headers_merge(client, auth):
    r = client.get("/api/v1/cards?lang=UK", headers=auth)
    assert r.status_code == 422 and r.json()["error"]["details"][0]["field"] == "lang" and r.json()["error"]["requestId"]
    assert client.get("/api/v1/cards?lang=xx", headers=auth).status_code == 422
    r = client.get("/api/v1/cards?limit=1", headers={**auth, "Origin": "http://localhost:3000", "Accept-Language": "en"})
    vary = {v.strip() for v in r.headers["vary"].split(",")}
    assert {"Origin", "Accept-Language"} <= vary                       # CORS's Vary is kept, ours is added
    r = client.get("/api/v1/cards", headers={"Accept-Language": "en"})
    assert r.status_code == 401 and r.headers["content-language"] == "en" and "cache-control" not in r.headers


@needs_db
def test_untranslated_ukrainian_is_labelled_as_english(client, auth):
    """Without translations a uk response is English, and Content-Language says so (Philip's review of #29)."""
    from app.db import connection
    with connection() as conn:
        translated = conn.execute("SELECT count(*) AS n FROM translations WHERE target_lang = 'uk' AND text IS NOT NULL").fetchone()["n"]
    r = client.get("/api/v1/facets?lang=uk", headers=auth)
    if translated == 0:
        assert r.headers["content-language"] == "en"
    else:
        assert r.headers["content-language"] in ("uk", "uk, en", "en")


@needs_db
def test_patch_me_sets_and_clears_the_language(client, auth):
    me = client.patch("/api/v1/me", json={"preferredLanguage": "uk"}, headers=auth).json()["data"]
    assert me["preferredLanguage"] == "uk"
    r = client.get("/api/v1/stats/overview", headers=auth)            # no lang named: the preference is used
    assert r.headers["content-language"] == "uk"
    me = client.patch("/api/v1/me", json={"preferredLanguage": None}, headers=auth).json()["data"]
    assert "preferredLanguage" not in me
    client.patch("/api/v1/me", json={"preferredLanguage": "en"}, headers=auth)


@needs_db
def test_related_work_object_form_matches_the_contract(client, auth):
    """No language named: a related card's title is the object form, which Card.relatedWork[].title allows (draft 5)."""
    from app import related
    from app.db import connection
    cid = "e7ddd917-2546-5e40-9d13-d47ba47930ea"
    with connection() as conn, conn.transaction():
        related.build(conn, cid)
    body = client.get(f"/api/v1/cards/{cid}", headers={k: v for k, v in auth.items()}).json()
    cards = [w for w in body["data"]["relatedWork"] if w["kind"] == "card"]
    assert cards and isinstance(cards[0]["title"], dict) and cards[0]["titleLang"] is None
    s = {**SPEC["paths"]["/api/v1/cards/{cardId}"]["get"]["responses"]["200"]["content"]["application/json"]["schema"],
         "components": SPEC["components"]}
    assert not list(jsonschema.Draft202012Validator(s).iter_errors(body))
