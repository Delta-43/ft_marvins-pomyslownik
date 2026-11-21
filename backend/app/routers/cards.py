"""Cards: list/search, one card. Similar and history come with tasks B4 and B7."""
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from ..security import require_session
from ..services import cards as svc

router = APIRouter(tags=["Cards"], dependencies=[Depends(require_session)])


@router.get("/cards")
def search_cards(q: str | None = Query(None, max_length=200), area: str | None = None,
                 implementationLevel: str | None = None, trlMin: int | None = Query(None, ge=1, le=9),
                 trlMax: int | None = Query(None, ge=1, le=9), tag: str | None = None, region: str | None = Query(None, max_length=10),
                 audience: str | None = None, polishIp: bool | None = None, minCredibility: int | None = Query(None, ge=0, le=100),
                 includeStale: bool = True, sort: str | None = None,
                 limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    f = svc.Filters(q, area, implementationLevel, trlMin, trlMax, tag, region, audience, polishIp, minCredibility, includeStale)
    data, total = svc.search_cards(f, sort, limit, offset)
    return {"data": data, "meta": {"total": total, "limit": limit, "offset": offset}}


@router.get("/cards/{cardId}")
def get_card(cardId: UUID):
    return {"data": svc.get_card(cardId)}
