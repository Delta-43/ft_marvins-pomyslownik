"""Admin: start and read collection runs. Needs the admin token (ADMIN_TOKEN), which is separate from user sessions.
The worker (task B7) picks up queued runs. Here we only create and read them."""
import hashlib
import hmac
import json
from typing import Literal
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, Header, Query, Response
from pydantic import BaseModel, ConfigDict

from ..config import settings
from ..db import connection, one, rows
from ..errors import ApiError
from ..services.cards import iso


def require_admin(authorization: str | None = Header(default=None)) -> None:
    scheme, _, token = (authorization or "").partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise ApiError(401, "unauthorized", "The admin token is required.")
    if not settings.admin_token or not hmac.compare_digest(token.strip(), settings.admin_token):
        raise ApiError(403, "forbidden", "This token is not allowed to use the admin endpoints.")


router = APIRouter(tags=["Admin"], dependencies=[Depends(require_admin)])


class StartRun(BaseModel):
    model_config = ConfigDict(extra="forbid")
    mode: Literal["collect", "refresh"]
    sourceIds: list[UUID] | None = None


def run_json(r: dict) -> dict:
    return {"id": str(r["id"]), "mode": r["mode"], "status": r["status"], "startedAt": iso(r["started_at"]),
            "finishedAt": iso(r["finished_at"]),
            "summary": {"cardsAdded": r["cards_added"], "cardsUpdated": r["cards_updated"],
                        "statusChanges": r["status_changes"], "errors": r["errors"], "cardsChecked": r["cards_checked"]},
            "changedCardIds": [str(i) for i in r["changed_card_ids"]]}


@router.post("/admin/collect-runs", status_code=202)
def start_run(body: StartRun, response: Response, idempotency_key: str = Header(min_length=8, max_length=80)):
    digest = hashlib.sha256(json.dumps(body.model_dump(mode="json"), sort_keys=True).encode()).hexdigest()
    existing = one("SELECT * FROM collect_runs WHERE idempotency_key = %s", (idempotency_key,))
    if existing:
        if existing["request_hash"] != digest:
            raise ApiError(409, "idempotency_conflict", "This Idempotency-Key was already used with a different request.")
        return {"data": run_json(existing)}
    try:
        with connection() as conn:
            run = conn.execute("""INSERT INTO collect_runs (mode, idempotency_key, request_hash, source_ids)
                                  VALUES (%s,%s,%s,%s) RETURNING *""",
                               (body.mode, idempotency_key, digest, [str(i) for i in body.sourceIds] if body.sourceIds else None)).fetchone()
    except psycopg.errors.UniqueViolation as exc:
        # Either the same key raced in a moment earlier (replay it), or the single-flight index: a run is already active.
        again = one("SELECT * FROM collect_runs WHERE idempotency_key = %s", (idempotency_key,))
        if again:
            if again["request_hash"] != digest:
                raise ApiError(409, "idempotency_conflict", "This Idempotency-Key was already used with a different request.") from exc
            return {"data": run_json(again)}
        raise ApiError(409, "run_in_progress", "A run is already queued or running. Wait for it to finish.") from exc
    return {"data": run_json(run)}


@router.get("/admin/collect-runs")
def list_runs(limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    total = one("SELECT count(*) AS n FROM collect_runs")["n"]
    data = rows("SELECT * FROM collect_runs ORDER BY requested_at DESC LIMIT %s OFFSET %s", (limit, offset))
    return {"data": [run_json(r) for r in data], "meta": {"total": total, "limit": limit, "offset": offset}}


@router.get("/admin/source-config")
def source_config():
    """B16: readiness of every registry source. Token values never leave the server, only tokenPresent."""
    from .. import registry
    return {"data": registry.statuses()}


@router.get("/admin/collect-runs/{runId}")
def get_run(runId: UUID):
    r = one("SELECT * FROM collect_runs WHERE id = %s", (runId,))
    if not r:
        raise ApiError(404, "not_found", "Run not found.")
    return {"data": run_json(r)}
