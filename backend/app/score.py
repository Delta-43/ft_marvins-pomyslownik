"""Compute scores for every card and store them. Run after loading or collecting:  python -m app.score

Writes: the assessment JSON, the three score columns, and one evidence row per number a score uses
(source: the card's first source; query: describes the computation). Safe to run again: it replaces its own rows.
"""
import datetime as dt
import json
import sys

from .db import close_pool, connection
from .services import scoring
from .services.validator import explanation_is_clean

QUERY_PREFIX = f"Scoring engine {scoring.VERSION}"


def facts_for(conn, card: dict) -> tuple[scoring.Facts, str | None]:
    cid = card["id"]
    # Only sources that state something about the solution count as sources here. API look-ups that add a number
    # (OpenAlex counts) are evidence, not independent confirmation, so they do not raise credibility.
    srcs = conn.execute("""SELECT s.id, s.url, cs.passage FROM card_sources cs JOIN sources s ON s.id = cs.source_id
                           WHERE cs.card_id = %s AND cs.passage IS NOT NULL ORDER BY s.name""", (cid,)).fetchall()
    pubs = conn.execute("SELECT value FROM evidence WHERE card_id = %s AND metric = 'similar_polish_publications_count'", (cid,)).fetchone()
    ev = conn.execute("""SELECT count(*) AS n FROM evidence WHERE card_id = %s AND query NOT LIKE %s
                         AND metric <> 'similar_polish_publications_count'""", (cid, QUERY_PREFIX + "%")).fetchone()["n"]
    pool = conn.execute("""SELECT similarity(c.search_text, me.search_text) AS s FROM cards c, cards me
                           WHERE me.id = %s AND c.id <> me.id ORDER BY s DESC""", (cid,)).fetchall()
    age = (dt.datetime.now(dt.UTC) - card["last_checked_at"]).days
    facts = scoring.Facts(
        source_count=len(srcs), official_source_count=sum(scoring.is_official(s["url"]) for s in srcs),
        sources_with_passage=sum(1 for s in srcs if s["passage"]), implementation_level=card["implementation_level"],
        implementation_confirmed=card["implementation_prov"].get("basis") == "confirmed", check_age_days=max(age, 0),
        has_owner_contact=bool(card["owner_url"]), sector_count=len(card["could_also_be_used_in"]), source_evidence_count=ev,
        pool_size=len(pool), top_similarities=[float(p["s"]) for p in pool[:3]],
        similar_publications=int(pubs["value"]) if pubs else None)
    return facts, (str(srcs[0]["id"]) if srcs else None)


def score_card(conn, card: dict) -> None:
    facts, first_source = facts_for(conn, card)
    results = scoring.score_all(facts)
    values = scoring.metric_values(facts)
    conn.execute("DELETE FROM evidence WHERE card_id = %s AND query LIKE %s", (card["id"], QUERY_PREFIX + "%"))
    ids: dict[str, str] = {}
    pubs_row = conn.execute("SELECT id, source_id FROM evidence WHERE card_id = %s AND metric = 'similar_polish_publications_count'",
                            (card["id"],)).fetchone()
    if pubs_row:
        ids["similar_polish_publications_count"] = str(pubs_row["id"])
    if first_source:
        for name, value in values.items():
            if name == "similar_polish_publications_count":
                continue  # already stored by app.enrich with its OpenAlex source
            pl, en = scoring.METRIC_LABELS[name]
            ids[name] = str(conn.execute(
                """INSERT INTO evidence (card_id, metric, label, value, unit, source_id, query) VALUES (%s,%s,%s,%s,NULL,%s,%s) RETURNING id""",
                (card["id"], name, json.dumps({"pl": pl, "en": en}), json.dumps(value), first_source,
                 f"{QUERY_PREFIX}: computed from this card's stored data on {dt.date.today().isoformat()}")).fetchone()["id"])
    assessment, columns = {}, {}
    for key, r in results.items():
        if r.explanation and not explanation_is_clean(r.explanation, [values[m] for m in r.metrics], r.value):
            raise ValueError(f"explanation of {key} on card {card['id']} contains a number that is not evidence")
        assessment[key] = {
            "value": r.value, "confidence": r.confidence, "insufficientData": r.insufficient, "sampleSize": r.sample_size,
            "basis": "estimate",
            "sourceIds": ([first_source] if first_source and not r.insufficient else [])
                         + ([str(pubs_row["source_id"])] if pubs_row and "similar_polish_publications_count" in r.metrics and not r.insufficient else []),
            "evidenceIds": [ids[m] for m in r.metrics if m in ids] if not r.insufficient else [],
            "method": r.method["en"], "methodText": r.method, "explanation": r.explanation}
        columns[key] = r.value
    conn.execute("""UPDATE cards SET assessment = %s, score_innovativeness = %s, score_application = %s, score_credibility = %s WHERE id = %s""",
                 (json.dumps(assessment), columns["innovativeness"], columns["applicationPotential"], columns["credibility"], card["id"]))


def main(close: bool = True) -> int:
    with connection() as conn:
        with conn.transaction():
            cards = conn.execute("SELECT * FROM cards ORDER BY id").fetchall()
            for card in cards:
                score_card(conn, card)
        out = conn.execute("SELECT count(*) FILTER (WHERE score_credibility IS NOT NULL) AS c, count(*) FILTER (WHERE score_innovativeness IS NOT NULL) AS i, count(*) AS n FROM cards").fetchone()
    print(f"scored {out['n']} cards (credibility {out['c']}, innovativeness {out['i']})")
    if close:
        close_pool()
    return 0


if __name__ == "__main__":
    sys.exit(main())
