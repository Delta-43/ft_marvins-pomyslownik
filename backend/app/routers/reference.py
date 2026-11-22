"""Reference data: audiences, facets, sources."""
from fastapi import APIRouter, Depends, Query

from ..db import one, rows
from ..security import require_session
from ..services import cards as svc
from ..services.i18n import source_name_text

router = APIRouter(tags=["Reference"])


@router.get("/audiences")
def list_audiences():
    return {"data": svc.audiences()}


@router.get("/facets", dependencies=[Depends(require_session)])
def get_facets(q: str | None = Query(None, max_length=200), area: str | None = None, implementationLevel: str | None = None,
               trlMin: int | None = Query(None, ge=1, le=9), trlMax: int | None = Query(None, ge=1, le=9),
               tag: str | None = None, region: str | None = Query(None, max_length=10), audience: str | None = None,
               polishIp: bool | None = None, minCredibility: int | None = Query(None, ge=0, le=100), includeStale: bool = True,
               polishIpStatus: str | None = None):
    """Accepts every filter of /cards (not sort, limit, offset), so the counts always match the list."""
    f = svc.Filters(q=q, area=area, implementationLevel=implementationLevel, trlMin=trlMin, trlMax=trlMax, tag=tag, region=region,
                    audience=audience, polishIp=polishIp, minCredibility=minCredibility, includeStale=includeStale,
                    polishIpStatus=polishIpStatus)
    return {"data": svc.facets(f)}


@router.get("/tags", dependencies=[Depends(require_session)])
def list_tags(sort: str = Query("recent", pattern="^(recent|count)$"), limit: int = Query(12, ge=1, le=100)):
    """`recent`: tags of the newest cards first (for the chips under the search bar). `count`: most used first."""
    return {"data": svc.tags(sort, limit)}


@router.get("/sources", dependencies=[Depends(require_session)])
def list_sources(type: str | None = Query(None, pattern="^(api|crawl|document)$"),
                 limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0, le=10000)):
    total = one("SELECT count(*) AS n FROM sources WHERE (%(t)s::text IS NULL OR type = %(t)s)", {"t": type})["n"]
    data = rows("""SELECT s.id, s.type, s.name, s.url, s.license, s.last_collected_at,
                          (SELECT count(*) FROM card_sources cs WHERE cs.source_id = s.id) AS card_count
                   FROM sources s WHERE (%(t)s::text IS NULL OR s.type = %(t)s)
                   ORDER BY s.name LIMIT %(l)s OFFSET %(o)s""", {"t": type, "l": limit, "o": offset})
    return {"data": [{"id": str(r["id"]), "type": r["type"], "name": r["name"], "nameText": source_name_text(r["name"]), "url": r["url"],
                      "lastCollectedAt": svc.iso(r["last_collected_at"]), "cardCount": r["card_count"], "license": r["license"]}
                     for r in data], "meta": {"total": total, "limit": limit, "offset": offset}}
