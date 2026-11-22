"""Statistics: database overview and anonymous usage trends."""
import datetime as dt

from fastapi import APIRouter, Depends, Query

from ..db import one, rows
from ..errors import ApiError
from ..security import require_session
from ..services.cards import LEVELS, STALE_SQL, iso, loc, stale_params
from ..services.cards import audiences as audience_list
from ..services.i18n import label as fixed_label

MIN_COUNT = 5  # buckets below this are not shown, so nobody can be singled out
FROM_DATE = Query(None, alias="from", description="Start of period.")

router = APIRouter(tags=["Statistics"], dependencies=[Depends(require_session)])


@router.get("/stats/overview")
def overview():
    by_area = {r["area"]: r["n"] for r in rows("SELECT area, count(*) AS n FROM cards GROUP BY area")}
    by_level = {r["l"]: r["n"] for r in rows("SELECT implementation_level AS l, count(*) AS n FROM cards GROUP BY 1")}
    by_type = {r["type"]: r["n"] for r in rows("SELECT type, count(*) AS n FROM sources GROUP BY type")}
    c = one(f"""SELECT count(*) AS n, count(*) FILTER (WHERE polish_ip) AS pip,
                       count(*) FILTER (WHERE {STALE_SQL}) AS stale
                FROM cards c""", stale_params())
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


@router.get("/stats/usage")
def usage(from_: dt.date | None = FROM_DATE, to: dt.date | None = None):
    end = to or dt.date.today()
    start = from_ or end - dt.timedelta(days=29)
    if start > end:
        raise ApiError(422, "validation_failed", "`from` must not be after `to`.")
    p = {"a": start, "b": end}
    inside = "occurred_at >= %(a)s AND occurred_at < %(b)s::date + 1"

    def top(sql: str, limit: int) -> list[dict]:
        return [r for r in rows(sql, {**p, "limit": limit}) if r["count"] >= MIN_COUNT]

    totals = one(f"""SELECT count(*) FILTER (WHERE type = 'search_performed') AS s, count(*) FILTER (WHERE type = 'card_viewed') AS v
                     FROM events WHERE {inside}""", p)
    areas = top(f"SELECT area AS value, count(*) AS count FROM events WHERE {inside} AND area IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT %(limit)s", 5)
    tags = top(f"""SELECT t AS value, count(*) AS count FROM events, unnest(tags) AS t WHERE {inside} GROUP BY 1 ORDER BY 2 DESC LIMIT %(limit)s""", 10)
    tag_labels = {r["slug"]: loc(r["label_pl"], r["label_en"]) for r in rows("SELECT slug, label_pl, label_en FROM tags")}
    aud = top(f"""SELECT COALESCE(audience, role) AS value, count(*) AS count FROM events
                  WHERE {inside} AND type = 'search_performed' AND COALESCE(audience, role) IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT %(limit)s""", 6)
    aud_labels = {a["id"]: a["label"] for a in audience_list()}
    viewed = [r for r in rows(f"""SELECT c.id, c.title_pl, c.title_en, count(*) AS views FROM events e JOIN cards c ON c.id = e.card_id
                                  WHERE {inside.replace('occurred_at', 'e.occurred_at')} AND e.type = 'card_viewed'
                                  GROUP BY c.id ORDER BY views DESC LIMIT 5""", p) if r["views"] >= MIN_COUNT]
    return {"data": {
        "period": {"from": start.isoformat(), "to": end.isoformat()},
        "totalSearches": totals["s"], "totalCardViews": totals["v"],
        "topAreas": [{"value": r["value"], "label": fixed_label(r["value"]), "count": r["count"]} for r in areas],
        "topTags": [{"value": r["value"], "label": tag_labels.get(r["value"]), "count": r["count"]} for r in tags],
        "mostViewedCards": [{"cardId": str(r["id"]), "title": loc(r["title_pl"], r["title_en"]), "views": r["views"]} for r in viewed],
        "searchesByAudience": [{"value": r["value"], "label": aud_labels.get(r["value"]), "count": r["count"]} for r in aud],
    }}
