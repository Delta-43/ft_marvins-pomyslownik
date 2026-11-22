"""Sessions. The client sends `Authorization: Bearer <token>`. Only a SHA-256 hash of the token is stored."""
import hashlib
import ipaddress
import secrets
import time
from collections import defaultdict, deque

from fastapi import Header, Request

from .config import settings
from .db import one
from .errors import ApiError

SESSION_HOURS = 12


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def new_token() -> str:
    return secrets.token_urlsafe(32)


def current_user(authorization: str | None = Header(default=None)) -> dict:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise ApiError(401, "unauthorized", "Sign in to see this data.")
    user = one("""SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
                  WHERE s.token_hash = %s AND s.expires_at > now()""", (hash_token(token.strip()),))
    if not user:
        raise ApiError(401, "unauthorized", "Your session is missing or expired. Sign in again.")
    user["_token_hash"] = hash_token(token.strip())
    return user


# Kept under the old name so every protected router keeps working.
require_session = current_user


def _trusted(peer: str) -> bool:
    """True when the peer may set CF-Connecting-IP: any peer when TRUSTED_PROXIES is empty, else only the listed ones."""
    allowed = [x.strip() for x in settings.trusted_proxies.split(",") if x.strip()]
    if not allowed:
        return True
    try:
        ip = ipaddress.ip_address(peer)
        return any(ip in ipaddress.ip_network(a, strict=False) for a in allowed)
    except ValueError:
        return False


def client_address(request: Request) -> str:
    """The caller's address. Behind the Cloudflare tunnel, CF-Connecting-IP is set by Cloudflare itself and cannot be
    chosen by the client. X-Forwarded-For is never trusted: a client can put anything in it. With TRUSTED_PROXIES set,
    the header counts only from those peers, so a client on the LAN cannot dodge the rate limits (G8)."""
    peer = request.client.host if request.client else "?"
    header = request.headers.get("cf-connecting-ip")
    return header if header and _trusted(peer) else peer


class RateLimiter:
    """Sliding window, in memory (one API process). Old keys are pruned so memory stays bounded."""

    def __init__(self, limit: int, window: int):
        self.limit, self.window, self.hits = limit, window, defaultdict(deque)
        self._calls = 0

    def hit(self, key) -> None:
        now = time.monotonic()
        self._calls += 1
        if self._calls % 500 == 0 or len(self.hits) > 20_000:
            for k in [k for k, q in self.hits.items() if not q or now - q[-1] > self.window]:
                del self.hits[k]
        q = self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise ApiError(429, "rate_limited", "Too many attempts. Wait a moment and try again.",
                           {"Retry-After": str(int(self.window - (now - q[0])) + 1)})
        q.append(now)

    def __call__(self, request: Request) -> None:
        self.hit((client_address(request), request.url.path))
