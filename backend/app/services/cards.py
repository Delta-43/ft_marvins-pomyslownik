"""Card reads: filters, summaries, detail, facets. Task B4 improves ranking on top of this."""
import datetime as dt
import json
import pathlib
import re
from uuid import UUID

from fastapi import HTTPException

from ..config import settings
from ..db import one, rows
from .i18n import (
    REGIONS,
    evidence_origin,
    licence_label,
    query_text,
    region_label,
    source_name_text,
    split_organisation,
    unit_label,
)
from .i18n import REGIONS as REGION_CODES
from .i18n import label as fixed_label

# Stale (#22): not checked within FRESHNESS_DAYS, or the project the card describes ended more than
# STALE_PROJECT_YEARS ago (evidence project_end_date, from RAD-on). Uses the alias c and the parameters fresh and old.
STALE_SQL = """(c.last_checked_at < now() - make_interval(days => %(fresh)s)
  OR EXISTS (SELECT 1 FROM evidence e WHERE e.card_id = c.id AND e.metric = 'project_end_date'
             AND (e.value #>> '{}') < to_char(now() - make_interval(years => %(old)s), 'YYYY-MM-DD')))"""


def stale_params() -> dict:
    return {"fresh": settings.freshness_days, "old": settings.stale_project_years}


AREAS = {"technological", "educational", "administrative"}
LEVELS = ["concept", "prototype", "testing", "pilot", "in_practice"]
SORTS = {"relevance", "recent", "innovativeness", "applicationPotential", "credibility"}


def iso(d: dt.datetime | None) -> str | None:
    return d.astimezone(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ") if d else None


def loc(pl: str | None, en: str | None) -> dict:
    return {k: v for k, v in (("pl", pl), ("en", en)) if v}


def audiences() -> list[dict]:
    return json.loads((pathlib.Path(settings.seed_dir) / "audiences.json").read_text(encoding="utf-8"))


def _csv(name: str, value: str | None, allowed: set[str] | None = None) -> list[str]:
    items = [v.strip() for v in (value or "").split(",") if v.strip()]
    if allowed is not None and not set(items) <= allowed:
        raise HTTPException(status_code=422, detail=f"Unknown value in '{name}'.")
    return items


class Filters:
    """Parsed filter parameters shared by /cards and /facets. An explicit filter overrides the audience preset."""

    def __init__(self, q=None, area=None, implementationLevel=None, trlMin=None, trlMax=None, tag=None, region=None,
                 audience=None, polishIp=None, minCredibility=None, includeStale=True, polishIpStatus=None):
        preset: dict = {}
        if audience:
            found = next((a for a in audiences() if a["id"] == audience), None)
            if not found:
                raise HTTPException(status_code=422, detail="Unknown audience.")
            preset = found["defaultFilters"]
        self.q = (q or "").strip() or None
        self.area = _csv("area", area, AREAS) or preset.get("area", [])
        self.level = _csv("implementationLevel", implementationLevel, set(LEVELS)) or preset.get("implementationLevel", [])
        self.trl_min = trlMin if trlMin is not None else preset.get("trlMin")
        self.trl_max = trlMax if trlMax is not None else preset.get("trlMax")
        self.tag = _csv("tag", tag) or preset.get("tag", [])
        if len(self.tag) > 20 or any(not re.fullmatch(r"[a-z0-9][a-z0-9-]{0,63}", t) for t in self.tag):
            raise HTTPException(status_code=422, detail="tag takes up to 20 tag slugs.")
        self.region = region or preset.get("region")
        if self.region and self.region not in REGIONS:
            raise HTTPException(status_code=422, detail="Unknown region.")
        self.polish_ip = polishIp if polishIp is not None else preset.get("polishIp")
        self.min_cred = minCredibility if minCredibility is not None else preset.get("minCredibility")
        self.include_stale = includeStale
        self.ip_status = _csv("polishIpStatus", polishIpStatus, {"confirmed", "stated", "unknown"})
        if self.trl_min is not None and self.trl_max is not None and self.trl_min > self.trl_max:
            raise HTTPException(status_code=422, detail="trlMin must not be above trlMax.")

    def where(self, skip: str | None = None) -> tuple[str, dict]:
        c, p = ["TRUE"], stale_params()
        if self.area and skip != "area":
            c.append("c.area = ANY(%(area)s)"); p["area"] = self.area
        if self.level and skip != "level":
            c.append("c.implementation_level = ANY(%(level)s)"); p["level"] = self.level
        if self.trl_min is not None:
            c.append("c.trl >= %(trl_min)s"); p["trl_min"] = self.trl_min
        if self.trl_max is not None:
            c.append("c.trl <= %(trl_max)s"); p["trl_max"] = self.trl_max
        if self.tag and skip != "tag":
            c.append("EXISTS (SELECT 1 FROM card_tags ct WHERE ct.card_id = c.id AND ct.tag_slug = ANY(%(tag)s))"); p["tag"] = self.tag
        if self.region and skip != "region":
            c.append("c.region = %(region)s"); p["region"] = self.region
        if self.polish_ip is not None and skip != "polish":
            c.append("c.polish_ip = %(pip)s"); p["pip"] = self.polish_ip
        if self.ip_status and skip != "ipstatus":
            c.append("c.polish_ip_status = ANY(%(ips)s)"); p["ips"] = self.ip_status
        if self.min_cred is not None:
            c.append("c.score_credibility >= %(min_cred)s"); p["min_cred"] = self.min_cred
        if not self.include_stale:
            c.append(f"NOT {STALE_SQL}")
        if self.q:
            # Basic text match: every word must appear in the accent-free text. Task B4 adds ranking and typo tolerance.
            for i, word in enumerate(self.q.split()[:8]):
                w = word.lower().replace("%", "").replace("_", "")
                # A word matches when it appears in the accent-free text or is close to a word in it (typos).
                c.append(f"(c.search_text LIKE '%%' || lower(public.immutable_unaccent(%(v{i})s)) || '%%' "
                         f"OR word_similarity(lower(public.immutable_unaccent(%(v{i})s)), c.search_text) > 0.55)")
                p[f"v{i}"] = w  # accents are removed in SQL, the same way search_text was built
            p["q"] = self.q
        return " AND ".join(c), p


SUMMARY_COLS = """
  c.id, c.title_pl, c.title_en, c.summary_short_pl, c.summary_short_en, c.area, c.polish_ip, c.polish_ip_status, c.last_checked_at,
  c.implementation_level, c.implementation_prov->>'basis' AS level_basis,
  c.trl_applicable, c.trl, c.trl_prov->>'basis' AS trl_basis,
  c.score_innovativeness, c.score_application, c.score_credibility,
  o.name AS org_name, o.type AS org_type, o.url AS org_url, o.region AS org_region,
  {STALE_SQL} AS stale,
  (SELECT count(*) FROM card_sources cs WHERE cs.card_id = c.id) AS source_count,
  COALESCE((SELECT jsonb_agg(jsonb_build_object('slug', t.slug, 'label_pl', t.label_pl, 'label_en', t.label_en) ORDER BY t.slug)
            FROM card_tags ct JOIN tags t ON t.slug = ct.tag_slug WHERE ct.card_id = c.id), '[]'::jsonb) AS tags
"""
SUMMARY_COLS = SUMMARY_COLS.replace("{STALE_SQL}", STALE_SQL)


def _organisation(r: dict) -> dict:
    name, unit = split_organisation(r["org_name"])
    return {"name": name, "unit": unit, "type": r["org_type"], "url": r["org_url"], "region": r["org_region"]}


def summary(r: dict, relevance: float | None = None) -> dict:
    return {
        "id": str(r["id"]),
        "title": loc(r["title_pl"], r["title_en"]),
        "summaryShort": loc(r["summary_short_pl"], r["summary_short_en"]),
        "area": r["area"],
        "tags": [{"slug": t["slug"], "label": loc(t["label_pl"], t["label_en"])} for t in r["tags"]],
        "organisation": _organisation(r),
        "implementationLevel": {"value": r["implementation_level"], "basis": r["level_basis"]},
        "trl": {"applicable": r["trl_applicable"], "value": r["trl"], "basis": r["trl_basis"]},
        "scores": {"innovativeness": r["score_innovativeness"], "applicationPotential": r["score_application"],
                   "credibility": r["score_credibility"]},
        "polishIp": r["polish_ip"],
        "polishIpStatus": r["polish_ip_status"],
        "lastCheckedAt": iso(r["last_checked_at"]),
        "stale": r["stale"],
        "sourceCount": r["source_count"],
        "relevance": relevance,
    }


def search_cards(f: Filters, sort: str | None, limit: int, offset: int) -> tuple[list[dict], int]:
    if sort and sort not in SORTS:
        raise HTTPException(status_code=422, detail="Unknown sort.")
    sort = sort or ("relevance" if f.q else "recent")
    where, p = f.where()
    total = one(f"SELECT count(*) AS n FROM cards c WHERE {where}", p)["n"]
    rel = "word_similarity(lower(public.immutable_unaccent(%(q)s)), c.search_text)" if f.q else "NULL::float"
    order = {"relevance": "relevance DESC NULLS LAST, c.last_checked_at DESC",
             "recent": "c.last_checked_at DESC",
             "innovativeness": "c.score_innovativeness DESC NULLS LAST",
             "applicationPotential": "c.score_application DESC NULLS LAST",
             "credibility": "c.score_credibility DESC NULLS LAST"}[sort]
    data = rows(f"""SELECT {SUMMARY_COLS}, {rel} AS relevance FROM cards c JOIN organisations o ON o.id = c.organisation_id
                    WHERE {where} ORDER BY {order}, c.id LIMIT %(limit)s OFFSET %(offset)s""",
                {**p, "limit": limit, "offset": offset})
    return [summary(r, r["relevance"]) for r in data], total


def get_card(card_id: UUID) -> dict:
    r = one(f"""SELECT {SUMMARY_COLS}, c.summary_pl, c.summary_en, c.implementation_prov, c.trl_prov, c.assessment, c.oslo,
                       c.could_also_be_used_in, c.owner_name, c.owner_url, c.first_seen_at, c.status_changed_at
                FROM cards c JOIN organisations o ON o.id = c.organisation_id WHERE c.id = %(id)s""",
            {"id": card_id, **stale_params()})
    if not r:
        raise HTTPException(status_code=404, detail="Card not found.")
    sources = rows("""SELECT s.id, s.type, s.name, s.url, s.license, cs.retrieved_at, cs.passage, cs.passage_lang
                      FROM card_sources cs JOIN sources s ON s.id = cs.source_id WHERE cs.card_id = %s ORDER BY s.name""", (card_id,))
    evidence = rows("SELECT id, metric, label, value, unit, source_id, query, retrieved_at FROM evidence WHERE card_id = %s ORDER BY metric", (card_id,))
    card = summary(r)
    card.update({
        "summary": loc(r["summary_pl"], r["summary_en"]),
        "implementationLevelDetail": {"value": r["implementation_level"], **r["implementation_prov"]},
        "trlDetail": {"applicable": r["trl_applicable"], "value": r["trl"], **r["trl_prov"]},
        "assessment": r["assessment"],
        "oslo": r["oslo"],
        "couldAlsoBeUsedIn": r["could_also_be_used_in"],
        "owner": {"name": r["owner_name"], "url": r["owner_url"]},
        "sources": [{"id": str(s["id"]), "type": s["type"], "name": s["name"], "nameText": source_name_text(s["name"]), "url": s["url"],
                     "retrievedAt": iso(s["retrieved_at"]), "passage": s["passage"], "passageLang": s["passage_lang"],
                     "license": s["license"], "licenseLabel": licence_label(s["license"])[0], "licenseUrl": licence_label(s["license"])[1]}
                    for s in sources],
        "evidence": [{"id": str(e["id"]), "metric": e["metric"], "label": e["label"], "value": e["value"], "unit": e["unit"], "unitLabel": unit_label(e["unit"]),
                      "sourceId": str(e["source_id"]), "query": e["query"], "retrievedAt": iso(e["retrieved_at"]),
                      "origin": evidence_origin(e["query"]), "queryText": query_text(e["query"])} for e in evidence],
        "firstSeenAt": iso(r["first_seen_at"]),
        "statusChangedAt": iso(r["status_changed_at"]),
        # A related card's title follows the requested language; an outside work keeps its own title (titleLang).
        "relatedWork": [{"kind": w["kind"], "cardId": str(w["card_ref"]) if w["card_ref"] else None,
                         "title": loc(w["ref_pl"], w["ref_en"]) if w["card_ref"] else w["title"],
                         "titleLang": None if w["card_ref"] else w["title_lang"], "url": w["url"],
                         "organisation": {"name": w["org_name"], "region": w["org_region"], "contactUrl": w["contact_url"]} if w["org_name"] else None,
                         "year": w["year"], "similarity": float(w["similarity"]), "sharedTags": list(w["shared_tags"]),
                         "basis": "estimate", "source": w["source"], "foundAt": iso(w["found_at"])}
                        for w in rows("""SELECT rw.*, c.title_pl AS ref_pl, c.title_en AS ref_en FROM related_work rw
                                         LEFT JOIN cards c ON c.id = rw.card_ref WHERE rw.card_id = %s
                                         ORDER BY rw.similarity DESC, rw.id""", (card_id,))],
    })
    return card


def facets(f: Filters) -> dict:
    def count(col_sql: str, skip: str, extra_join: str = "") -> list[dict]:
        where, p = f.where(skip=skip)
        return rows(f"SELECT {col_sql} AS value, count(DISTINCT c.id) AS count FROM cards c {extra_join} WHERE {where} GROUP BY 1 ORDER BY 2 DESC, 1", p)

    area = {r["value"]: r["count"] for r in count("c.area", "area")}
    level = {r["value"]: r["count"] for r in count("c.implementation_level", "level")}
    tags = rows(f"""SELECT t.slug AS value, t.label_pl, t.label_en, count(DISTINCT c.id) AS count FROM cards c
                    JOIN card_tags ct ON ct.card_id = c.id JOIN tags t ON t.slug = ct.tag_slug
                    WHERE {f.where(skip='tag')[0]} GROUP BY t.slug, t.label_pl, t.label_en ORDER BY 4 DESC, 1 LIMIT 50""", f.where(skip="tag")[1])
    regions = [r for r in count("c.region", "region") if r["value"]][:50]
    pip = {r["value"]: r["count"] for r in count("c.polish_ip", "polish")}
    ips = {r["value"]: r["count"] for r in count("c.polish_ip_status", "ipstatus")}
    ips_labels = {"confirmed": {"pl": "Potwierdzona", "en": "Confirmed"},
                  "stated": {"pl": "Deklarowana przez źródło, niezweryfikowana", "en": "Declared by the source, not verified"},
                  "unknown": {"pl": "Brak informacji", "en": "No information"}}
    opt = lambda k, n: {"value": k, "label": fixed_label(k), "count": n}
    # B18: every selected value comes back with its label, even at count 0, so the frontend never invents a label.
    tag_list = [{"value": t["value"], "label": loc(t["label_pl"], t["label_en"]), "count": t["count"]} for t in tags]
    missing = [s for s in f.tag if s not in {t["value"] for t in tag_list}]
    if missing:  # selected but outside the top 50, or with no match: count them directly, with the same filters
        where, p = f.where(skip="tag")
        counted = {r["slug"]: r["count"] for r in rows(f"""SELECT ct.tag_slug AS slug, count(DISTINCT c.id) AS count FROM cards c
                    JOIN card_tags ct ON ct.card_id = c.id WHERE {where} AND ct.tag_slug = ANY(%(missing)s) GROUP BY 1""",
                                                         {**p, "missing": missing})}
        known = {r["slug"]: r for r in rows("SELECT slug, label_pl, label_en FROM tags WHERE slug = ANY(%s)", (missing,))}
        tag_list += [{"value": s, "label": loc(known[s]["label_pl"], known[s]["label_en"]), "count": counted.get(s, 0)}
                     for s in missing if s in known]
    region_list = [{"value": r["value"], "label": region_label(r["value"]), "count": r["count"]} for r in regions]
    if f.region and f.region in REGION_CODES and f.region not in {r["value"] for r in region_list}:
        region_list.append({"value": f.region, "label": region_label(f.region), "count": 0})
    return {
        "area": [opt(k, area.get(k, 0)) for k in ("technological", "educational", "administrative")],
        "implementationLevel": [opt(k, level.get(k, 0)) for k in LEVELS],
        "tag": tag_list,
        "region": region_list,
        "polishIp": {"true": pip.get(True, 0), "false": pip.get(False, 0)},
        "polishIpStatus": [{"value": k, "label": ips_labels[k], "count": ips.get(k, 0)} for k in ("confirmed", "stated", "unknown")],
    }


def tags(sort: str, limit: int) -> list[dict]:
    """Tags with the number of cards and when the newest card with that tag was first seen."""
    order = "last_seen DESC, count DESC, t.slug" if sort == "recent" else "count DESC, last_seen DESC, t.slug"
    data = rows(f"""SELECT t.slug, t.label_pl, t.label_en, count(c.id) AS count, max(c.first_seen_at) AS last_seen
                    FROM tags t JOIN card_tags ct ON ct.tag_slug = t.slug JOIN cards c ON c.id = ct.card_id
                    GROUP BY t.slug, t.label_pl, t.label_en ORDER BY {order} LIMIT %(limit)s""", {"limit": limit})
    return [{"slug": r["slug"], "label": loc(r["label_pl"], r["label_en"]), "count": r["count"], "lastSeenAt": iso(r["last_seen"])}
            for r in data]
