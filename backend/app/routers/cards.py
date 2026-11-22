"""Cards: list/search, one card. Similar and history come with tasks B4 and B7."""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from ..security import require_session
from ..services import cards as svc
from ..services import compare as cmp

router = APIRouter(tags=["Cards"], dependencies=[Depends(require_session)])


@router.get("/cards")
def search_cards(q: str | None = Query(None, max_length=200), area: str | None = None,
                 implementationLevel: str | None = None, trlMin: int | None = Query(None, ge=1, le=9),
                 trlMax: int | None = Query(None, ge=1, le=9), tag: str | None = None, region: str | None = Query(None, max_length=10),
                 audience: str | None = None, polishIp: bool | None = None, minCredibility: int | None = Query(None, ge=0, le=100),
                 includeStale: bool = True, polishIpStatus: str | None = None, sort: str | None = None,
                 limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0, le=10000)):
    f = svc.Filters(q, area, implementationLevel, trlMin, trlMax, tag, region, audience, polishIp, minCredibility, includeStale,
                    polishIpStatus)
    data, total = svc.search_cards(f, sort, limit, offset)
    return {"data": data, "meta": {"total": total, "limit": limit, "offset": offset}}


@router.get("/cards/{cardId}")
def get_card(cardId: UUID):
    return {"data": svc.get_card(cardId)}


@router.get("/cards/{cardId}/similar")
def similar(cardId: UUID, limit: int = Query(5, ge=1, le=20)):
    return {"data": cmp.similar(cardId, limit)}


@router.get("/cards/{cardId}/history")
def history(cardId: UUID):
    return {"data": cmp.history(cardId)}


@router.get("/compare")
def compare(ids: str = Query(...)):
    try:
        parsed = [UUID(i.strip()) for i in ids.split(",") if i.strip()]
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="ids must be comma separated card ids.") from exc
    return {"data": cmp.compare(parsed)}
