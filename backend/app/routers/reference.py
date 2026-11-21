"""Reference data: audiences, facets, sources."""
from fastapi import APIRouter, Depends, Query

from ..db import one, rows
from ..security import require_session
from ..services import cards as svc

router = APIRouter(tags=["Reference"])


@router.get("/audiences")
def list_audiences():
    return {"data": svc.audiences()}


@router.get("/facets", dependencies=[Depends(require_session)])
def get_facets(q: str | None = Query(None, max_length=200), area: str | None = None, implementationLevel: str | None = None,
               tag: str | None = None, region: str | None = Query(None, max_length=10), audience: str | None = None,
               polishIp: bool | None = None):
    f = svc.Filters(q=q, area=area, implementationLevel=implementationLevel, tag=tag, region=region, audience=audience, polishIp=polishIp)
    return {"data": svc.facets(f)}


@router.get("/sources", dependencies=[Depends(require_session)])
def list_sources(type: str | None = Query(None, pattern="^(api|crawl|document)$"),
                 limit: int = Query(20, ge=1, le=100), offset: int = Query(0, ge=0)):
    total = one("SELECT count(*) AS n FROM sources WHERE (%(t)s::text IS NULL OR type = %(t)s)", {"t": type})["n"]
    data = rows("""SELECT s.id, s.type, s.name, s.url, s.license, s.last_collected_at,
                          (SELECT count(*) FROM card_sources cs WHERE cs.source_id = s.id) AS card_count
                   FROM sources s WHERE (%(t)s::text IS NULL OR s.type = %(t)s)
                   ORDER BY s.name LIMIT %(l)s OFFSET %(o)s""", {"t": type, "l": limit, "o": offset})
    return {"data": [{"id": str(r["id"]), "type": r["type"], "name": r["name"], "url": r["url"],
                      "lastCollectedAt": svc.iso(r["last_collected_at"]), "cardCount": r["card_count"], "license": r["license"]}
                     for r in data], "meta": {"total": total, "limit": limit, "offset": offset}}
