"""Anonymous usage events. No free text, no IP address and no user id is stored. The role comes from the session."""
import datetime as dt
from typing import Literal
from uuid import UUID

import psycopg
from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, ConfigDict, Field

from ..db import connection
from ..errors import ApiError
from ..security import RateLimiter, current_user

router = APIRouter(tags=["Events"])
limited = Depends(RateLimiter(limit=240, window=60))
session = Depends(current_user)

Audience = Literal["investors_business", "public_bodies", "universities", "schools", "startups_enterprises", "inventors"]
Area = Literal["technological", "educational", "administrative"]


class UsageEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")  # closed on purpose: nothing else can be sent
    eventId: UUID
    type: Literal["search_performed", "card_viewed", "compare_opened", "filter_used"]
    occurredAt: dt.datetime
    audience: Audience | None = None
    area: Area | None = None
    tags: list[str] = Field(default_factory=list, max_length=10)
    cardId: UUID | None = None
    resultCount: int | None = Field(default=None, ge=0)


@router.post("/events", status_code=202, dependencies=[limited])
def record_event(body: UsageEvent, user: dict = session):
    now = dt.datetime.now(dt.UTC)
    when = body.occurredAt if body.occurredAt.tzinfo else body.occurredAt.replace(tzinfo=dt.UTC)
    if when > now + dt.timedelta(minutes=5) or when < now - dt.timedelta(days=2):
        raise ApiError(422, "validation_failed", "occurredAt must be within the last two days and not in the future.")
    if any(len(t) > 60 for t in body.tags):
        raise ApiError(422, "validation_failed", "A tag is longer than 60 characters.")
    try:
        with connection() as conn:
            conn.execute(
                """INSERT INTO events (event_id, type, occurred_at, role, audience, area, tags, card_id, result_count)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (event_id) DO NOTHING""",
                (body.eventId, body.type, when, user["role"], body.audience, body.area, body.tags, body.cardId, body.resultCount))
    except psycopg.errors.ForeignKeyViolation as exc:
        raise ApiError(422, "validation_failed", "cardId does not match any card.") from exc
    return Response(status_code=202)
