"""Innovation Radar API. The contract is docs/api/openapi.yaml. Change the contract first."""
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from . import errors
from .config import settings
from .db import check_database
from .routers import admin, cards, events, reference, stats

app = FastAPI(title="Pomysłownik! API", version=settings.version, docs_url="/docs", redoc_url=None)
errors.install(app)

app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origin_list, allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["*"], expose_headers=["X-Request-Id", "Retry-After"])


@app.middleware("http")
async def request_id(request: Request, call_next):
    request.state.request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-Id"] = request.state.request_id
    return response


@app.get("/health")
def health():
    db_up = check_database()
    return {"status": "ok" if db_up else "degraded", "version": settings.version,
            "database": "up" if db_up else "down", "lastRefreshAt": None}


for router in (cards.router, reference.router, stats.router, events.router, admin.router):
    app.include_router(router, prefix="/api/v1")
