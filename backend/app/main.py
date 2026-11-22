"""Innovation Radar API. The contract is docs/api/openapi.yaml. Change the contract first."""
import re
import uuid
from contextlib import asynccontextmanager

import psycopg
from fastapi import FastAPI, Request, Response
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import errors
from .config import settings
from .db import check_database, close_pool, one
from .routers import admin, auth, cards, events, reference, stats
from .security import hash_token
from .services import lang as lang_service
from .services.cards import iso

REQUEST_ID = re.compile(r"[A-Za-z0-9._-]{1,64}")


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield
    close_pool()


app = FastAPI(title="Pomysłownik! API", version=settings.version, docs_url="/docs", redoc_url=None, lifespan=lifespan)
errors.install(app)

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
                   allow_headers=["*"], expose_headers=["X-Request-Id", "Retry-After", "Content-Language"])


def safe_request_id(value: str | None) -> str:
    """A client's X-Request-Id is reflected in the body, the header and the logs: only short plain ids are kept."""
    return value if value and REQUEST_ID.fullmatch(value) else str(uuid.uuid4())


@app.middleware("http")
async def request_id(request: Request, call_next):
    request.state.request_id = safe_request_id(request.headers.get("X-Request-Id"))
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response


@app.middleware("http")
async def language(request: Request, call_next):
    """B15: resolve every LocalizedText to the requested language, translate error messages, set the headers."""
    if not request.url.path.startswith("/api/v1"):
        return await call_next(request)
    query_lang = request.query_params.get("lang")
    if lang_service.bad_lang(query_lang):
        request.state.request_id = safe_request_id(request.headers.get("X-Request-Id"))
        body = errors.error_body(request, "validation_failed", "One or more fields are invalid.",
                                 [{"field": "lang", "issue": f"must be one of {', '.join(lang_service.supported())}"}])
        response = JSONResponse(body, status_code=422, headers={"X-Request-Id": request.state.request_id})
    else:
        response = await call_next(request)
    preferred = None
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer ") and not query_lang and not request.headers.get("accept-language"):
        preferred = await run_in_threadpool(preferred_language, auth_header[7:].strip())  # never block the event loop
    lang, named = lang_service.negotiate(None if lang_service.bad_lang(query_lang) else query_lang,
                                         request.headers.get("accept-language"), preferred)
    headers = dict(response.headers)
    served = lang
    if response.headers.get("content-type", "").startswith("application/json"):
        if hasattr(response, "body_iterator"):  # a streamed response from the router
            raw = b"".join([chunk async for chunk in response.body_iterator])
        else:  # a response built here (the 422 for a bad ?lang)
            raw = bytes(response.body)
        try:
            raw, served = await run_in_threadpool(lang_service.rewrite, raw, lang, named)
        except (ValueError, psycopg.Error):
            pass  # a body we cannot parse, or the database is down: send it unchanged
        headers.pop("content-length", None)
        response = Response(raw, status_code=response.status_code, headers=headers, media_type="application/json")
    response.headers["Content-Language"] = served
    response.headers["Vary"] = ", ".join(filter(None, [response.headers.get("vary"), "Accept-Language"]))
    if auth_header:  # G2: personal and IP-protected data must not sit in a shared cache
        response.headers["Cache-Control"] = "private, no-store"
    return response


def preferred_language(token: str) -> str | None:
    try:
        row = one("""SELECT u.preferred_language FROM sessions s JOIN users u ON u.id = s.user_id
                     WHERE s.token_hash = %s AND s.expires_at > now()""", (hash_token(token),))
    except psycopg.Error:
        return None
    return row["preferred_language"] if row else None


@app.get("/health")
def health():
    db_up = check_database()
    last = None
    if db_up:
        try:
            row = one("SELECT max(finished_at) AS t FROM collect_runs WHERE mode = 'refresh' AND status = 'succeeded'")
            last = iso(row["t"]) if row else None
        except psycopg.Error:
            last = None
    return {"status": "ok" if db_up else "degraded", "version": settings.version,
            "database": "up" if db_up else "down", "lastRefreshAt": last}


for router in (auth.router, cards.router, reference.router, stats.router, events.router, admin.router):
    app.include_router(router, prefix="/api/v1")
