"""Task B6c. PDF text extraction plus AI extraction with source passages.

Two uses: a PDF becomes a new card (collect_pdf), or it adds a second source to an existing card (enrich_with_pdf).
When it enriches, the level becomes "confirmed" if the report states it, and a different level is a status change.
"""
import io
import json
import uuid

from pypdf import PdfReader

from ..db import connection
from . import fetch
from .build import _passage_lang, build_card
from .extract import NotAnInnovation, extract, level_supported, norm, number_in, on_page

MAX_CHARS = 1_200_000  # about 400k tokens, inside the 1M context. Longer documents are refused, not cut, so nothing is silently lost.


def pdf_text(data: bytes) -> str:
    reader = PdfReader(io.BytesIO(data))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _load(url: str, offline: bool) -> tuple[str, dict]:
    data, meta = fetch.get(url, offline=offline)
    if not data.startswith(b"%PDF"):
        raise ValueError(f"{url} is not a PDF")
    text = pdf_text(data)
    if len(text) < 500:
        raise ValueError(f"no text layer in {url} (scanned PDF?)")
    if len(text) > MAX_CHARS:
        raise ValueError(f"{url} has {len(text)} characters, above the limit of {MAX_CHARS}; split it first")
    return text, meta


def collect_pdf(url: str, *, title: str, offline: bool = False) -> dict:
    text, meta = _load(url, offline)
    name = f"Dokument PDF: {title}"
    x = extract(text, url=url, source_name=name, hint="This is a PDF report or project document.")
    if not x.is_innovation:
        raise NotAnInnovation(x.rejection_reason)
    return build_card(x, text=text, url=url, source_name=name, source_type="document", retrieved_at=meta["retrieved_at"])


def enrich_with_pdf(card_id: str, url: str, *, title: str, offline: bool = False) -> dict:
    """Attach a report to a card. Returns what changed."""
    text, meta = _load(url, offline)
    with connection() as conn:
        card = conn.execute("SELECT id, title_pl, title_en, implementation_level FROM cards WHERE id = %s", (card_id,)).fetchone()
    if not card:
        raise ValueError(f"no card {card_id}")
    hint = (f"This PDF is about the solution '{card['title_pl']}' / '{card['title_en']}'. "
            "Extract what the report states about this solution: its level today, results and numbers.")
    name = f"Dokument PDF: {title}"
    x = extract(text, url=url, source_name=name, hint=hint)
    sid = str(uuid.uuid5(uuid.NAMESPACE_URL, "source:" + url))
    quotes = [q for q in (x.key_quote, x.implementation_quote) if q and on_page(q, text)]
    passage = " … ".join(dict.fromkeys(norm(q) for q in quotes)) or None
    level_ok = on_page(x.implementation_quote, text) and level_supported(x.implementation_level, x.implementation_quote)
    out = {"cardId": card_id, "sourceId": sid, "levelConfirmed": level_ok, "facts": 0, "statusChange": None}
    with connection() as conn, conn.transaction():
        conn.execute("""INSERT INTO sources (id, type, name, url, last_collected_at) VALUES (%s,'document',%s,%s,%s)
                        ON CONFLICT (url) DO UPDATE SET last_collected_at = EXCLUDED.last_collected_at""",
                     (sid, name, url, meta["retrieved_at"]))
        sid = str(conn.execute("SELECT id FROM sources WHERE url = %s", (url,)).fetchone()["id"])
        conn.execute("""INSERT INTO card_sources (card_id, source_id, retrieved_at, passage, passage_lang) VALUES (%s,%s,%s,%s,%s)
                        ON CONFLICT (card_id, source_id) DO UPDATE SET passage = EXCLUDED.passage, retrieved_at = EXCLUDED.retrieved_at,
                          passage_lang = EXCLUDED.passage_lang""",
                     (card_id, sid, meta["retrieved_at"], passage, _passage_lang(passage) if passage else None))
        conn.execute("DELETE FROM evidence WHERE card_id = %s AND source_id = %s", (card_id, sid))
        for f in x.facts:
            if on_page(f.quote, text) and number_in(f.quote, f.value) and f.label.pl.strip() and f.label.en.strip():
                value = int(f.value) if float(f.value).is_integer() else f.value
                conn.execute("""INSERT INTO evidence (card_id, metric, label, value, unit, source_id, query) VALUES (%s,%s,%s,%s,%s,%s,%s)""",
                             (card_id, f.metric[:60], json.dumps(f.label.model_dump()), json.dumps(value), f.unit or None, sid,
                              f'Read from {url}. Quoted text: "{norm(f.quote)}"'))
                out["facts"] += 1
        if level_ok:
            prov = {"basis": "confirmed", "sourceIds": [sid], "evidenceIds": [], "method": None, "methodText": None}
            if x.implementation_level != card["implementation_level"]:
                conn.execute("""INSERT INTO status_history (card_id, field, from_value, to_value, source_id)
                                VALUES (%s,'implementationLevel',%s,%s,%s)""", (card_id, card["implementation_level"], x.implementation_level, sid))
                conn.execute("UPDATE cards SET status_changed_at = now() WHERE id = %s", (card_id,))
                out["statusChange"] = [card["implementation_level"], x.implementation_level]
            conn.execute("UPDATE cards SET implementation_level = %s, implementation_prov = %s, last_checked_at = now() WHERE id = %s",
                         (x.implementation_level, json.dumps(prov), card_id))
    return out
