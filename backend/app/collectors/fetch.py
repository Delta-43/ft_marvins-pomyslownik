"""Polite HTTP fetching for every collector: robots.txt, per-host delay, stored snapshots.

Snapshots go to CACHE_DIR (data/cache, not in git). With offline=True a collector reads only the cache,
so the demo never depends on a live site.
"""
import hashlib
import ipaddress
import json
import pathlib
import re
import socket
import threading
import time
import urllib.robotparser
from urllib.parse import urljoin, urlparse

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


class Unsafe(ValueError):
    """The URL points at a private, loopback or link-local address, or a token would leave its own host (PR #30 review)."""


MAX_REDIRECTS = 5
# Query parameters that carry credentials. Compared without case. A registry source adds its own auth.name.
SECRET_PARAMS = {"api_key", "apikey", "key", "token", "access_token", "accesstoken", "auth", "appid", "app_id", "client_id",
                 "clientid", "client_secret", "secret", "password", "signature", "sig", "x-api-key"}
_secrets: set[str] = set()  # token values read from the environment by the registry; scrubbed from every message


def register_secret(value: str) -> None:
    if value and len(value) >= 4:
        _secrets.add(value)


def scrub(text: str, params: set[str] | frozenset = frozenset()) -> str:
    """Remove credentials from a URL or a message: known parameter names (any case) and every registered token value."""
    names = "|".join(re.escape(n) for n in sorted(SECRET_PARAMS | {p.lower() for p in params}, key=len, reverse=True))
    out = re.sub(rf"([?&;])({names})=[^&#\s\"']*", r"\1\2=REDACTED", text or "", flags=re.IGNORECASE)
    for value in sorted(_secrets, key=len, reverse=True):
        out = out.replace(value, "REDACTED")
    return out


def check_public(url: str) -> None:
    """Refuse URLs that resolve to a private, loopback, link-local or reserved address (SSRF guard).

    A link in a third-party feed must never make the server read the cloud metadata service, the database or another
    container. Checked before robots.txt and again after every redirect. FETCH_ALLOW_PRIVATE=true turns it off locally.
    """
    if settings.fetch_allow_private:
        return
    p = urlparse(url)
    if p.scheme not in ("http", "https") or not p.hostname:
        raise Unsafe(f"not an http(s) URL: {scrub(url)}")
    try:
        infos = socket.getaddrinfo(p.hostname, p.port or (443 if p.scheme == "https" else 80), proto=socket.IPPROTO_TCP)
    except socket.gaierror as exc:
        raise Unsafe(f"cannot resolve {p.hostname}") from exc
    for info in infos:
        ip = ipaddress.ip_address(info[4][0])
        if (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified
                or (ip.version == 6 and ip.ipv4_mapped and not ip.ipv4_mapped.is_global)):
            raise Unsafe(f"{p.hostname} resolves to a non-public address")


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
        check_public(base + "/robots.txt")
        rp = urllib.robotparser.RobotFileParser()
        try:
            r = httpx.get(base + "/robots.txt", headers={"User-Agent": USER_AGENT}, timeout=15, follow_redirects=False)
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


def _without_secrets(url: str, params: set[str] | frozenset = frozenset()) -> str:
    """Never store or log a key: snapshots, error messages and run notes all go through this."""
    return scrub(url, params)


def _origin(url: str) -> tuple[str, str, int | None]:
    p = urlparse(url)
    return p.scheme, (p.hostname or "").lower(), p.port


def get(url: str, *, offline: bool = False, check_robots: bool = True, method: str = "GET",
        json_body: dict | None = None, headers: dict | None = None, cache_tag: str = "",
        secret_params: set[str] | frozenset = frozenset()) -> tuple[bytes, dict]:
    """Return (body, meta). meta has url, status, content_type, retrieved_at, from_cache.

    Every hop is checked against private addresses. When the call carries credentials (extra headers or a secret
    query parameter) a redirect may only stay on the same scheme, host and port, so a token never reaches another host.
    The body is capped at FETCH_MAX_BYTES.
    """
    key = _key(method + url + json.dumps(json_body, sort_keys=True) + cache_tag)
    body_path, meta_path = cache_dir() / f"{key}.bin", cache_dir() / f"{key}.json"
    if offline:
        if not body_path.exists():
            raise FileNotFoundError(f"no snapshot for {url}")
        return body_path.read_bytes(), {**json.loads(meta_path.read_text()), "from_cache": True}
    check_public(url)
    if check_robots and not _robots_for(url).can_fetch(USER_AGENT, url):
        raise Blocked(url)
    _wait(url)
    carries_secret = bool(headers) or any(f"{p.lower()}=" in url.lower() for p in secret_params | SECRET_PARAMS)
    start, current = _origin(url), url
    with httpx.Client(timeout=30, follow_redirects=False) as client:
        for _ in range(MAX_REDIRECTS + 1):
            with client.stream(method, current, json=json_body, headers={"User-Agent": USER_AGENT, **(headers or {})}) as r:
                if r.is_redirect:
                    nxt = urljoin(current, r.headers.get("location", ""))
                    if carries_secret and _origin(nxt) != start:
                        raise Unsafe(f"refused a redirect to another host while sending credentials: {_without_secrets(nxt, secret_params)}")
                    check_public(nxt)
                    current = nxt
                    continue
                if r.is_error:  # the message names the URL, so strip keys before anyone logs it
                    raise httpx.HTTPStatusError(f"{r.status_code} for {_without_secrets(str(r.url), secret_params)}",
                                                request=r.request, response=r)
                content = bytearray()
                for chunk in r.iter_bytes():
                    content += chunk
                    if len(content) > settings.fetch_max_bytes:
                        raise ValueError(f"response from {_without_secrets(current, secret_params)} is larger than {settings.fetch_max_bytes} bytes")
                meta = {"url": _without_secrets(str(r.url), secret_params), "status": r.status_code,
                        "content_type": r.headers.get("content-type", ""), "retrieved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
                break
        else:
            raise ValueError(f"too many redirects from {_without_secrets(url, secret_params)}")
    body = bytes(content)
    body_path.write_bytes(body)
    meta_path.write_text(json.dumps(meta))
    return body, {**meta, "from_cache": False}
