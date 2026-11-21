"""Sessions. The client sends `Authorization: Bearer <token>`. Only a SHA-256 hash of the token is stored."""
import hashlib
import secrets
import time
from collections import defaultdict, deque

from fastapi import Header, Request

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


class RateLimiter:
    """Sliding window per client and route, in memory. Enough for one API process."""

    def __init__(self, limit: int, window: int):
        self.limit, self.window, self.hits = limit, window, defaultdict(deque)

    def __call__(self, request: Request) -> None:
        # Behind the tunnel the peer is the proxy, so use the forwarded address when present.
        fwd = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        key = (fwd or (request.client.host if request.client else "?"), request.url.path)
        now, q = time.monotonic(), self.hits[key]
        while q and now - q[0] > self.window:
            q.popleft()
        if len(q) >= self.limit:
            raise ApiError(429, "rate_limited", "Too many attempts. Wait a moment and try again.",
                           {"Retry-After": str(int(self.window - (now - q[0])) + 1)})
        q.append(now)
