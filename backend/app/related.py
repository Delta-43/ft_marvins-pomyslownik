"""Task B17: keep the similarity hits and the research hits on the card ("who else works on this").

    python -m app.related      (runs after scoring in the seed, in every collect or refresh run, and by hand)

Two kinds today: similar catalogue cards (trigram text similarity plus shared tags, the same numbers as /similar) and
works by Polish institutions from OpenAlex. Every similarity is computed by code, never by the model. The card shows
organisations and public pages only: no person names, no messaging (FAQ section 6).
"""
import sys

import httpx
import psycopg

from .collectors import openalex
from .config import settings
from .db import close_pool, connection

MIN_SIMILARITY = 0.12   # weaker catalogue matches are noise
MAX_CARDS = 4


def build(conn, card_id: str, *, offline: bool = False) -> int:
    conn.execute("DELETE FROM related_work WHERE card_id = %s", (card_id,))
    me = conn.execute("""SELECT c.id, c.title_en, c.area, c.search_text, ARRAY(SELECT tag_slug FROM card_tags WHERE card_id = c.id) AS tags
                         FROM cards c WHERE c.id = %s""", (card_id,)).fetchone()
    if not me:
        return 0
    hits = conn.execute("""
        SELECT c.id, c.title_pl, c.owner_url, c.region, o.name AS org,
               ARRAY(SELECT tag_slug FROM card_tags ct WHERE ct.card_id = c.id AND ct.tag_slug = ANY(%(tags)s) ORDER BY 1) AS shared,
               (0.6 * similarity(c.search_text, %(text)s)
                + 0.4 * COALESCE((SELECT count(*)::float FROM card_tags ct WHERE ct.card_id = c.id AND ct.tag_slug = ANY(%(tags)s))
                    / NULLIF(cardinality(%(tags)s::text[]) + (SELECT count(*) FROM card_tags ct2 WHERE ct2.card_id = c.id)
                             - (SELECT count(*) FROM card_tags ct3 WHERE ct3.card_id = c.id AND ct3.tag_slug = ANY(%(tags)s)), 0), 0)) AS sim
        FROM cards c JOIN organisations o ON o.id = c.organisation_id
        WHERE c.id <> %(id)s ORDER BY sim DESC, c.id LIMIT %(n)s""",
        {"id": card_id, "text": me["search_text"], "tags": list(me["tags"]), "n": MAX_CARDS}).fetchall()
    n = 0
    for h in hits:
        sim = round(min(max(float(h["sim"] or 0), 0.0), 1.0), 3)
        if sim < MIN_SIMILARITY:
            continue
        conn.execute("""INSERT INTO related_work (card_id, kind, card_ref, title, title_lang, url, org_name, org_region, contact_url,
                          similarity, shared_tags, source) VALUES (%s,'card',%s,%s,'pl',%s,%s,%s,%s,%s,%s,'catalogue')""",
                     (card_id, h["id"], h["title_pl"], f"{settings.public_web_url.rstrip('/')}/karta/{h['id']}", h["org"], h["region"],
                      h["owner_url"] if (h["owner_url"] or "").startswith("http") else None, sim, list(h["shared"])))
        n += 1
    if me["area"] == "technological" and me["title_en"]:
        for w in openalex.top_polish_works(me["title_en"], offline=offline):
            sim = conn.execute("SELECT similarity(lower(public.immutable_unaccent(%s::text)), lower(public.immutable_unaccent(%s::text))) AS s",
                               (me["title_en"], w["title"])).fetchone()["s"]
            conn.execute("""INSERT INTO related_work (card_id, kind, title, title_lang, url, org_name, contact_url, year, similarity, source)
                            VALUES (%s,'publication',%s,NULL,%s,%s,%s,%s,%s,'openalex')""",
                         (card_id, w["title"], w["url"], w["org_name"], w["contact_url"], w["year"], round(float(sim or 0), 3)))
            n += 1
    return n


def main(close: bool = True, offline: bool = False) -> int:
    total = 0
    with connection() as conn:
        for r in conn.execute("SELECT id FROM cards ORDER BY id").fetchall():
            try:
                with conn.transaction():
                    total += build(conn, str(r["id"]), offline=offline)
            except (httpx.HTTPError, ValueError, KeyError, psycopg.Error) as exc:  # one card must not stop the rest
                print("related work failed for", r["id"], type(exc).__name__, exc)
    print(f"related work: {total} items stored")
    if close:
        close_pool()
    return 0


if __name__ == "__main__":
    sys.exit(main())
