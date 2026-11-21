"""Load data/seed/cards/*.json into the database. Idempotent: run it as often as you like.

    python -m app.seed

Each file is one Card (see components.schemas.Card in docs/api/openapi.yaml).
Sources are matched by URL, so a card file can be regenerated without duplicating sources.
"""
import json
import pathlib
import sys

from .config import settings
from .db import connection
from .services.i18n import consistency_problems, problems


def _prov(detail: dict) -> dict:
    return {k: detail.get(k) for k in ("basis", "sourceIds", "evidenceIds", "method", "methodText")}


def load_card(conn, card: dict) -> None:
    bad = problems(card)
    if bad:
        raise ValueError(f"card {card.get('id')} breaks the language rule (needs Polish and English): {', '.join(bad)}")
    bad = consistency_problems(card)
    if bad:
        raise ValueError(f"card {card.get('id')} is inconsistent: {'; '.join(bad)}")
    org = card["organisation"]
    org_id = conn.execute(
        """INSERT INTO organisations (name, type, url, region) VALUES (%s,%s,%s,%s)
           ON CONFLICT (name, type) DO UPDATE SET url = EXCLUDED.url, region = EXCLUDED.region RETURNING id""",
        (org["name"], org["type"], org.get("url"), org.get("region"))).fetchone()["id"]

    # Match sources by URL. Keep the id already in the database and remap references in this card.
    remap: dict[str, str] = {}
    for s in card["sources"]:
        row = conn.execute(
            """INSERT INTO sources (id, type, name, url, license, last_collected_at) VALUES (%s,%s,%s,%s,%s,%s)
               ON CONFLICT (url) DO UPDATE SET name = EXCLUDED.name, license = EXCLUDED.license,
                 last_collected_at = EXCLUDED.last_collected_at RETURNING id""",
            (s["id"], s["type"], s["name"], s["url"], s.get("license"), s["retrievedAt"])).fetchone()
        remap[s["id"]] = str(row["id"])

    def fix(prov: dict) -> dict:
        return {**prov, "sourceIds": [remap.get(i, i) for i in prov.get("sourceIds", [])]}

    impl, trl = card["implementationLevelDetail"], card["trlDetail"]
    assessment = card["assessment"]
    for score in assessment.values():
        score["sourceIds"] = [remap.get(i, i) for i in score.get("sourceIds", [])]
    scores = {k: assessment.get(k, {}).get("value") for k in ("innovativeness", "applicationPotential", "credibility")}
    tags = card["tags"]
    summary = card.get("summary") or {}
    short = card["summaryShort"]
    title = card["title"]

    search_text = " ".join(filter(None, [title.get("pl"), title.get("en"), short.get("pl"), short.get("en"),
                                         summary.get("pl"), summary.get("en"), org["name"]]
                                        + [f"{t['label'].get('pl', '')} {t['label'].get('en', '')}" for t in tags]))
    # Upsert, never delete: usage events, status history, refresh results and sources that other steps attached
    # (PDF reports, OpenAlex) all hang off the card row and must survive a re-load.
    params = {"id": card["id"], "t_pl": title.get("pl"), "t_en": title.get("en"), "ss_pl": short.get("pl"), "ss_en": short.get("en"),
              "s_pl": summary.get("pl"), "s_en": summary.get("en"), "area": card["area"], "org_id": org_id,
              "own_n": card["owner"]["name"], "own_u": card["owner"]["url"], "region": org.get("region"),
              "lvl": impl["value"], "lvl_p": json.dumps(fix(_prov(impl))), "trl_ok": trl["applicable"], "trl": trl["value"],
              "trl_p": json.dumps(fix(_prov(trl))), "assess": json.dumps(assessment),
              "si": scores["innovativeness"], "sa": scores["applicationPotential"], "sc": scores["credibility"],
              "oslo": json.dumps(card["oslo"]), "could": json.dumps(card["couldAlsoBeUsedIn"]), "pip": card["polishIp"], "pips": card.get("polishIpStatus", "unknown"),
              "first": card["firstSeenAt"], "checked": card["lastCheckedAt"], "changed": card.get("statusChangedAt"),
              "search": search_text}
    conn.execute(
        """INSERT INTO cards (id, title_pl, title_en, summary_short_pl, summary_short_en, summary_pl, summary_en, area,
             organisation_id, owner_name, owner_url, region, implementation_level, implementation_prov,
             trl_applicable, trl, trl_prov, assessment, score_innovativeness, score_application, score_credibility,
             oslo, could_also_be_used_in, polish_ip, polish_ip_status, first_seen_at, last_checked_at, status_changed_at, search_text)
           VALUES (%(id)s,%(t_pl)s,%(t_en)s,%(ss_pl)s,%(ss_en)s,%(s_pl)s,%(s_en)s,%(area)s,%(org_id)s,%(own_n)s,%(own_u)s,
             %(region)s,%(lvl)s,%(lvl_p)s,%(trl_ok)s,%(trl)s,%(trl_p)s,%(assess)s,%(si)s,%(sa)s,%(sc)s,%(oslo)s,%(could)s,
             %(pip)s,%(pips)s,%(first)s,%(checked)s,%(changed)s, lower(public.immutable_unaccent(%(search)s::text)))
           ON CONFLICT (id) DO UPDATE SET
             title_pl = EXCLUDED.title_pl, title_en = EXCLUDED.title_en, summary_short_pl = EXCLUDED.summary_short_pl,
             summary_short_en = EXCLUDED.summary_short_en, summary_pl = EXCLUDED.summary_pl, summary_en = EXCLUDED.summary_en,
             area = EXCLUDED.area, organisation_id = EXCLUDED.organisation_id, owner_name = EXCLUDED.owner_name,
             owner_url = EXCLUDED.owner_url, region = EXCLUDED.region, implementation_level = EXCLUDED.implementation_level,
             implementation_prov = EXCLUDED.implementation_prov, trl_applicable = EXCLUDED.trl_applicable, trl = EXCLUDED.trl,
             trl_prov = EXCLUDED.trl_prov, oslo = EXCLUDED.oslo, could_also_be_used_in = EXCLUDED.could_also_be_used_in,
             polish_ip = EXCLUDED.polish_ip, polish_ip_status = EXCLUDED.polish_ip_status, search_text = EXCLUDED.search_text,
             last_checked_at = GREATEST(cards.last_checked_at, EXCLUDED.last_checked_at),
             status_changed_at = COALESCE(cards.status_changed_at, EXCLUDED.status_changed_at)""", params)
    # first_seen_at and the scores stay as they are on an update (score.py recomputes the scores).

    own = list(remap.values())
    conn.execute("DELETE FROM card_tags WHERE card_id = %s", (card["id"],))
    conn.execute("DELETE FROM evidence WHERE card_id = %s AND source_id = ANY(%s::uuid[]) AND query NOT LIKE 'Scoring engine%%'",
                 (card["id"], own))
    for t in tags:
        conn.execute("""INSERT INTO tags (slug, label_pl, label_en) VALUES (%s,%s,%s)
                        ON CONFLICT (slug) DO UPDATE SET label_pl = EXCLUDED.label_pl, label_en = EXCLUDED.label_en""",
                     (t["slug"], t["label"].get("pl"), t["label"].get("en")))
        conn.execute("INSERT INTO card_tags (card_id, tag_slug) VALUES (%s,%s) ON CONFLICT DO NOTHING", (card["id"], t["slug"]))
    for s in card["sources"]:
        conn.execute("""INSERT INTO card_sources (card_id, source_id, retrieved_at, passage, passage_lang) VALUES (%s,%s,%s,%s,%s)
                        ON CONFLICT (card_id, source_id) DO UPDATE SET retrieved_at = EXCLUDED.retrieved_at,
                          passage = EXCLUDED.passage, passage_lang = EXCLUDED.passage_lang""",
                     (card["id"], remap[s["id"]], s["retrievedAt"], s.get("passage"), s.get("passageLang")))
    for e in card["evidence"]:
        conn.execute("""INSERT INTO evidence (id, card_id, metric, label, value, unit, source_id, query, retrieved_at)
                        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                        ON CONFLICT (id) DO UPDATE SET metric = EXCLUDED.metric, label = EXCLUDED.label, value = EXCLUDED.value,
                          unit = EXCLUDED.unit, source_id = EXCLUDED.source_id, query = EXCLUDED.query""",
                     (e["id"], card["id"], e["metric"], json.dumps(e["label"]), json.dumps(e["value"]), e.get("unit"),
                      remap.get(e["sourceId"], e["sourceId"]), e["query"], e["retrievedAt"]))


def main() -> int:
    root = pathlib.Path(settings.seed_dir)
    files = sorted((root / "cards").glob("*.json"))
    if not files:
        print(f"No card files in {root / 'cards'}")
        return 1
    with connection() as conn, conn.transaction():
        for f in files:
            load_card(conn, json.loads(f.read_text(encoding="utf-8")))
            print("loaded", f.name)
    print(f"{len(files)} cards loaded")
    from . import enrich, score
    enrich.main(close=False)  # OpenAlex evidence for technological cards (skipped without a key)
    score.main()
    return 0


if __name__ == "__main__":
    sys.exit(main())
