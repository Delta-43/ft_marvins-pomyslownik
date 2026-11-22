"""Add API evidence to stored cards (task B6a). Today: OpenAlex counts of similar Polish publications.

    python -m app.enrich        (then python -m app.score)

Safe to repeat: it replaces its own rows. Without OPENALEX_API_KEY it does nothing and says so.
"""
import json
import sys
import uuid

import httpx
import psycopg

from .collectors import openalex
from .config import settings
from .db import close_pool, connection

METRIC = "similar_polish_publications_count"
LABEL = {"pl": "Liczba podobnych publikacji polskich instytucji (OpenAlex, od 2015)",
         "en": "Similar publications by Polish institutions (OpenAlex, since 2015)"}


def enrich_card(conn, card: dict, *, offline: bool = False) -> int | None:
    if card["area"] != "technological" or not card["title_en"]:
        return None
    found = openalex.similar_polish_works(card["title_en"], offline=offline)
    if not found:
        return None
    count, url = found
    src = conn.execute("""INSERT INTO sources (id, type, name, url, license, last_collected_at) VALUES (%s,'api',%s,%s,'CC0',now())
                          ON CONFLICT (url) DO UPDATE SET last_collected_at = now() RETURNING id""",
                       (str(uuid.uuid5(uuid.NAMESPACE_URL, url)), "OpenAlex: wyszukiwanie podobnych prac / similar works search", url)).fetchone()["id"]
    conn.execute("INSERT INTO card_sources (card_id, source_id, passage) VALUES (%s,%s,NULL) ON CONFLICT DO NOTHING", (card["id"], src))
    # An older OpenAlex query for this card is no longer the basis of the number: detach it, so the card lists one.
    conn.execute("""DELETE FROM card_sources cs USING sources s WHERE cs.card_id = %s AND cs.source_id = s.id
                      AND s.name LIKE 'OpenAlex:%%' AND s.id <> %s""", (card["id"], src))
    conn.execute("DELETE FROM evidence WHERE card_id = %s AND metric = %s", (card["id"], METRIC))
    conn.execute("""INSERT INTO evidence (card_id, metric, label, value, unit, source_id, query) VALUES (%s,%s,%s,%s,'works',%s,%s)""",
                 (card["id"], METRIC, json.dumps(LABEL), json.dumps(count), src, f"GET {url} (meta.count)"))
    return count


def main(offline: bool = False, close: bool = True) -> int:
    if not settings.openalex_api_key:
        print("OPENALEX_API_KEY is not set: no enrichment")
        return 0
    done = 0
    with connection() as conn:
        for card in conn.execute("SELECT id, area, title_en FROM cards WHERE area = 'technological' ORDER BY id").fetchall():
            try:
                with conn.transaction():
                    if enrich_card(conn, card, offline=offline) is not None:
                        done += 1
            except (httpx.HTTPError, ValueError, KeyError, psycopg.Error) as exc:  # one failing call must not stop the rest
                print("enrich failed for", card["id"], type(exc).__name__, exc)
    print(f"enriched {done} technological cards from OpenAlex")
    if close:
        close_pool()
    return 0


if __name__ == "__main__":
    sys.exit(main())
