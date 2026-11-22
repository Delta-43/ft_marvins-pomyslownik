"""B16: a source added in the registry and .env is collected with no code change; tokens never leave the server."""
import json
import os

import pytest

from app import registry

API = {"id": "example-api", "name": {"pl": "Przykład", "en": "Example"}, "method": "api", "enabled": True,
       "baseUrl": "https://api.example.invalid/v1/innovations", "tokenEnv": "EXAMPLE_SOURCE_TOKEN",
       "auth": {"in": "header", "name": "Authorization", "scheme": "Bearer"}, "itemsPath": "$.data",
       "mapping": {"title": "$.name", "summary": "$.description", "organisation": "$.owner.name", "url": "$.link"}}
BODY = {"data": [{"name": "Robot do sortowania odpadów", "description": "Wdrożony w 2025 r. w sortowni.", "owner": {"name": "Firma X"},
                  "link": "https://example.invalid/robot"},
                 {"name": "Bez linku", "link": "javascript:alert(1)"}]}


def test_status_reports_token_presence_never_the_value(monkeypatch):
    monkeypatch.delenv("EXAMPLE_SOURCE_TOKEN", raising=False)
    s = registry.status(API, check_robots=False)
    assert s["tokenPresent"] is False and not s["ready"] and s["problem"]["en"].startswith("Token missing")
    monkeypatch.setenv("EXAMPLE_SOURCE_TOKEN", "secret-value-123")
    s = registry.status(API, check_robots=False)
    assert s["tokenPresent"] is True and s["ready"] and "secret-value-123" not in json.dumps(s)


def test_jsonpath_and_api_items_map_fields_and_drop_bad_links(monkeypatch):
    assert registry.jsonpath({"a": {"b": [{"c": 5}]}}, "$.a.b[0].c") == 5 and registry.jsonpath({}, "$.x.y") is None
    monkeypatch.setenv("EXAMPLE_SOURCE_TOKEN", "t0k")
    seen = {}
    def fake_get(url, **kw):
        seen.update(url=url, headers=kw.get("headers"))
        return json.dumps(BODY).encode(), {}
    monkeypatch.setattr("app.collectors.fetch.get", fake_get)
    items = registry.api_items(API)
    assert [i["url"] for i in items] == ["https://example.invalid/robot"]
    assert seen["headers"] == {"Authorization": "Bearer t0k"} and "organisation: Firma X" in items[0]["text"]


def test_feed_and_sitemap_links(monkeypatch):
    rss = b"<rss><channel><item><title>A</title><link>https://example.invalid/a</link></item></channel></rss>"
    monkeypatch.setattr("app.collectors.fetch.get", lambda url, **kw: (rss, {}))
    assert registry.page_urls({"method": "feed", "baseUrl": "https://example.invalid/feed"}) == ["https://example.invalid/a"]
    sm = b"<urlset><url><loc>https://example.invalid/x/1</loc></url><url><loc>https://example.invalid/y/2</loc></url></urlset>"
    monkeypatch.setattr("app.collectors.fetch.get", lambda url, **kw: (sm, {}))
    assert registry.page_urls({"method": "sitemap", "baseUrl": "https://example.invalid/s.xml", "filters": {"urlContains": "/x/"}}) == ["https://example.invalid/x/1"]


@pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a database")
def test_admin_source_config_endpoint():
    from fastapi.testclient import TestClient

    from app.main import app
    c = TestClient(app)
    r = c.get("/api/v1/admin/source-config", headers={"Authorization": f"Bearer {os.environ['ADMIN_TOKEN']}"})
    assert r.status_code == 200 and {s["id"] for s in r.json()["data"]} >= {"radon", "openalex"}
    assert c.get("/api/v1/admin/source-config").status_code == 401
