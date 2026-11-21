"""Polite HTTP fetching for every collector: robots.txt, per-host delay, stored snapshots.

Snapshots go to CACHE_DIR (data/cache, not in git). With offline=True a collector reads only the cache,
so the demo never depends on a live site.
"""
import hashlib
import json
import pathlib
import re
import threading
import time
import urllib.robotparser
from urllib.parse import urlparse

import httpx

from ..config import settings

USER_AGENT = "PomyslownikBot/0.1 (+https://pomyslownik.delta43.net; research prototype, low rate)"
DEFAULT_DELAY = 5.0  # seconds between requests to one host when robots.txt sets no Crawl-delay
_robots: dict[str, urllib.robotparser.RobotFileParser] = {}
_last: dict[str, float] = {}
_lock = threading.Lock()


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class Blocked(Exception):
    """robots.txt forbids this URL for us. Never fetch it."""


def cache_dir() -> pathlib.Path:
    d = pathlib.Path(settings.cache_dir)
    d.mkdir(parents=True, exist_ok=True)
    return d


def _key(url: str) -> str:
    return hashlib.sha256(url.encode()).hexdigest()[:32]


def _robots_for(url: str) -> urllib.robotparser.RobotFileParser:
    p = urlparse(url)
    base = f"{p.scheme}://{p.netloc}"
    if base not in _robots:
        rp = urllib.robotparser.RobotFileParser()
        try:
            r = httpx.get(base + "/robots.txt", headers={"User-Agent": USER_AGENT}, timeout=15, follow_redirects=True)
            rp.parse(r.text.splitlines() if r.status_code == 200 else [])
        except httpx.HTTPError:
            rp.parse([])  # robots.txt unreachable: treat as no rules, but keep the default delay
        _robots[base] = rp
    return _robots[base]


def _wait(url: str) -> None:
    host = urlparse(url).netloc
    delay = _robots_for(url).crawl_delay(USER_AGENT) or DEFAULT_DELAY
    with _lock:
        wait = _last.get(host, 0) + float(delay) - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last[host] = time.monotonic()


def _without_secrets(url: str) -> str:
    """Never store a key in a snapshot."""
    return re.sub(r"([?&])(api_key|apikey|key|token)=[^&]*", r"\1\2=REDACTED", url)


def get(url: str, *, offline: bool = False, check_robots: bool = True, method: str = "GET",
        json_body: dict | None = None, headers: dict | None = None, cache_tag: str = "") -> tuple[bytes, dict]:
    """Return (body, meta). meta has url, status, content_type, retrieved_at, from_cache."""
    key = _key(method + url + json.dumps(json_body, sort_keys=True) + cache_tag)
    body_path, meta_path = cache_dir() / f"{key}.bin", cache_dir() / f"{key}.json"
    if offline:
        if not body_path.exists():
            raise FileNotFoundError(f"no snapshot for {url}")
        return body_path.read_bytes(), {**json.loads(meta_path.read_text()), "from_cache": True}
    if check_robots and not _robots_for(url).can_fetch(USER_AGENT, url):
        raise Blocked(url)
    _wait(url)
    r = httpx.request(method, url, json=json_body, headers={"User-Agent": USER_AGENT, **(headers or {})},
                      timeout=30, follow_redirects=True)
    if r.is_error:  # the message names the URL, so strip keys before anyone logs it
        raise httpx.HTTPStatusError(f"{r.status_code} for {_without_secrets(str(r.url))}", request=r.request, response=r)
    meta = {"url": _without_secrets(str(r.url)), "status": r.status_code, "content_type": r.headers.get("content-type", ""),
            "retrieved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    body_path.write_bytes(r.content)
    meta_path.write_text(json.dumps(meta))
    return r.content, {**meta, "from_cache": False}
