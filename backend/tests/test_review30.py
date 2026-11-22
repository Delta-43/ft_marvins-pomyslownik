"""Security fixes from Philip's review of PR #30: tokens, redirects, SSRF, robust registry, feed parsing."""
import gzip
import json
import os
import pathlib

import httpx
import jsonschema
import pytest
import yaml

from app import pipeline, registry
from app.collectors import fetch

SPEC = yaml.safe_load((pathlib.Path(__file__).resolve().parents[2] / "docs" / "api" / "openapi.yaml").read_text(encoding="utf-8"))


@pytest.fixture
def fast(monkeypatch, tmp_path):
    """No delays, no robots.txt calls, a private cache, and a fake network for fetch.get."""
    monkeypatch.setattr(fetch, "_wait", lambda url: None)
    monkeypatch.setattr(fetch.settings, "cache_dir", str(tmp_path))
    monkeypatch.setattr(fetch, "_robots_for", lambda url: type("R", (), {"can_fetch": lambda *a: True})())
    real = httpx.Client
    def network(handler, public=lambda url: None):
        monkeypatch.setattr(fetch.httpx, "Client", lambda **kw: real(transport=httpx.MockTransport(handler), **kw))
        monkeypatch.setattr(fetch, "check_public", public)
    return network


def test_a_query_token_never_reaches_errors_or_run_notes(fast, monkeypatch):
    monkeypatch.setenv("WEIRD_SOURCE_TOKEN", "tok-9f8e7d6c")
    src = {"id": "weird", "method": "api", "enabled": True, "baseUrl": "https://api.example.invalid/items",
           "tokenEnv": "WEIRD_SOURCE_TOKEN", "auth": {"in": "query", "name": "apiKey"}, "itemsPath": "$.d", "mapping": {"title": "$.t", "url": "$.u"}}
    fast(lambda request: httpx.Response(401, request=request))
    with pytest.raises(httpx.HTTPStatusError) as exc:
        registry.api_items(src)
    assert "tok-9f8e7d6c" not in str(exc.value) and "apiKey=REDACTED" in str(exc.value)
    run = pipeline.Run({"id": "r", "mode": "collect"})
    run.note(f"weird failed: {exc.value} (header was tok-9f8e7d6c)")
    assert "tok-9f8e7d6c" not in " ".join(run.lines)
    meta = list(pathlib.Path(fetch.settings.cache_dir).glob("*.json"))
    assert all("tok-9f8e7d6c" not in m.read_text() for m in meta)


def test_a_header_token_does_not_follow_a_redirect_to_another_host(fast):
    seen = []
    def handler(request):
        seen.append(request.url.host)
        if request.url.host == "api.example.invalid":
            return httpx.Response(302, headers={"location": "https://evil.example.invalid/steal"}, request=request)
        return httpx.Response(200, json={}, request=request)
    fast(handler)
    with pytest.raises(fetch.Unsafe):
        fetch.get("https://api.example.invalid/x", headers={"X-API-Key": "k"}, check_robots=False)
    assert seen == ["api.example.invalid"]                     # the token never went to evil.example.invalid
    seen.clear()
    def same_host(request):
        if request.url.path == "/x":
            return httpx.Response(301, headers={"location": "/y"}, request=request)
        return httpx.Response(200, content=b"ok", request=request)
    fast(same_host)
    assert fetch.get("https://api.example.invalid/x", headers={"X-API-Key": "k"}, check_robots=False)[0] == b"ok"


def test_private_addresses_are_refused_even_after_a_redirect(fast, monkeypatch):
    monkeypatch.setattr(fetch.settings, "fetch_allow_private", False)
    for url in ("http://127.0.0.1/", "http://169.254.169.254/latest/meta-data/", "http://10.1.2.3:5432/", "http://[::1]/"):
        with pytest.raises(fetch.Unsafe):
            fetch.check_public(url)
    fast(lambda request: httpx.Response(302, headers={"location": "http://169.254.169.254/latest/"}, request=request),
         public=fetch.check_public)
    monkeypatch.setattr(fetch.socket, "getaddrinfo", lambda host, *a, **k: [(0, 0, 0, "", ("93.184.216.34" if host == "feed.example" else host, 0))])
    with pytest.raises(fetch.Unsafe):
        fetch.get("https://feed.example/rss", check_robots=False)


def test_feed_and_sitemap_parsing(fast):
    atom = b'<feed><entry><title>A</title><link rel="alternate" href="https://news.example/a?x=1&amp;y=2"/></entry>' \
           b'<entry><link href="https://other.example/b"/></entry></feed>'
    fast(lambda request: httpx.Response(200, content=atom, request=request))
    assert registry.page_urls({"method": "feed", "baseUrl": "https://news.example/atom"}) == ["https://news.example/a?x=1&y=2"]
    rss = b"<rss><channel><item><title>A</title><link><![CDATA[https://news.example/c]]></link></item></channel></rss>"
    fast(lambda request: httpx.Response(200, content=rss, request=request))
    assert registry.page_urls({"method": "feed", "baseUrl": "https://news.example/rss"}) == ["https://news.example/c"]
    index = b"<sitemapindex><sitemap><loc>https://site.example/s1.xml.gz</loc></sitemap></sitemapindex>"
    child = gzip.compress(b"<urlset><url><loc>https://site.example/p/1</loc></url><url><loc>http://10.0.0.1/x</loc></url></urlset>")
    fast(lambda request: httpx.Response(200, content=index if request.url.path == "/sitemap.xml" else child, request=request))
    assert registry.page_urls({"method": "sitemap", "baseUrl": "https://site.example/sitemap.xml"}) == ["https://site.example/p/1"]


def test_bad_registry_entries_are_reported_not_fatal(monkeypatch, tmp_path):
    monkeypatch.setattr(registry.settings, "sources_dir", str(tmp_path))
    (tmp_path / "registry.json").write_text(json.dumps({"sources": [
        {"method": "api"},                                                         # no id
        {"id": "leak", "method": "api", "baseUrl": "https://x.example", "tokenEnv": "ADMIN_TOKEN"},
        {"id": "ok", "method": "crawl", "enabled": True, "urls": []}]}))
    good, bad = registry.load_checked()
    assert [s["id"] for s in good] == ["ok"] and {b["id"] for b in bad} == {"entry-1", "leak"}
    assert next(b for b in bad if b["id"] == "leak")["problem"]["en"].startswith("tokenEnv may only")
    assert registry.token("ADMIN_TOKEN") == "" and registry.token("DATABASE_URL") == ""
    (tmp_path / "registry.json").write_text("{not json")
    good, bad = registry.load_checked()
    assert good == [] and bad[0]["problem"]["en"] == "The registry file is not valid JSON."
    run = pipeline.Run({"id": "r", "mode": "collect"})
    assert pipeline.collect_registry(run, 5, set(), set()) == 5               # nothing breaks, nothing collected


def test_robots_disallowed_source_is_not_ready(monkeypatch):
    monkeypatch.setattr(fetch, "_robots_for", lambda url: type("R", (), {"can_fetch": lambda *a: False})())
    s = registry.status({"id": "blocked", "method": "sitemap", "enabled": True, "baseUrl": "https://blocked.example/sitemap.xml"})
    assert s["robots"] == "disallowed" and not s["ready"] and s["problem"]["en"].startswith("robots.txt")


@pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a database")
def test_source_config_matches_the_contract_and_the_language(monkeypatch):
    from fastapi.testclient import TestClient

    from app.main import app
    monkeypatch.setattr(fetch, "_robots_for", lambda url: type("R", (), {"can_fetch": lambda *a: True})())
    c = TestClient(app)
    h = {"Authorization": f"Bearer {os.environ['ADMIN_TOKEN']}"}
    resp = SPEC["paths"]["/api/v1/admin/source-config"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]
    for lang in (None, "en"):
        body = c.get("/api/v1/admin/source-config" + (f"?lang={lang}" if lang else ""), headers=h).json()
        assert not list(jsonschema.Draft202012Validator({**resp, "components": SPEC["components"]}).iter_errors(body))
    en = c.get("/api/v1/admin/source-config?lang=en", headers=h).json()["data"]
    assert all(isinstance(s["name"], str) for s in en)
