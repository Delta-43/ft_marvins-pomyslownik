"""Statistics. Usage stats arrive with task B8."""
from fastapi import APIRouter, Depends

from ..config import settings
from ..db import one, rows
from ..security import require_session
from ..services.cards import LEVELS, iso

router = APIRouter(tags=["Statistics"], dependencies=[Depends(require_session)])


@router.get("/stats/overview")
def overview():
    by_area = {r["area"]: r["n"] for r in rows("SELECT area, count(*) AS n FROM cards GROUP BY area")}
    by_level = {r["l"]: r["n"] for r in rows("SELECT implementation_level AS l, count(*) AS n FROM cards GROUP BY 1")}
    by_type = {r["type"]: r["n"] for r in rows("SELECT type, count(*) AS n FROM sources GROUP BY type")}
    c = one("""SELECT count(*) AS n, count(*) FILTER (WHERE polish_ip) AS pip,
                      count(*) FILTER (WHERE last_checked_at < now() - make_interval(days => %s)) AS stale
               FROM cards""", (settings.freshness_days,))
    # Assessed fields per card: implementation level, TRL, three scores, Oslo check. Share with basis "confirmed".
    f = one("""SELECT count(*) * 6 AS total,
                      COALESCE(sum((implementation_prov->>'basis' = 'confirmed')::int + (trl_prov->>'basis' = 'confirmed')::int
                        + (assessment->'innovativeness'->>'basis' = 'confirmed')::int
                        + (assessment->'applicationPotential'->>'basis' = 'confirmed')::int
                        + (assessment->'credibility'->>'basis' = 'confirmed')::int
                        + (oslo->>'basis' = 'confirmed')::int), 0) AS confirmed FROM cards""")
    last = one("SELECT max(finished_at) AS t FROM collect_runs WHERE status = 'succeeded'")["t"]
    n = c["n"]
    return {"data": {
        "cardCount": n,
        "byArea": {a: by_area.get(a, 0) for a in ("technological", "educational", "administrative")},
        "byImplementationLevel": {l: by_level.get(l, 0) for l in LEVELS},
        "sourceCount": sum(by_type.values()),
        "sourcesByType": {t: by_type.get(t, 0) for t in ("api", "crawl", "document")},
        "lastRefreshAt": iso(last),
        "staleShare": round(c["stale"] / n, 3) if n else 0,
        "confirmedFieldShare": round(f["confirmed"] / f["total"], 3) if f["total"] else 0,
        "polishIpCount": c["pip"],
    }}
