"""Turn an Extraction plus its source into a Card in the contract format, then store and score it.

The source text is the judge: a field is "confirmed" only when its quote is on the page. Everything else is an
estimate with a method in Polish and English.
"""
import datetime as dt
import json
import re
import uuid

from ..db import connection
from ..services.i18n import problems
from .extract import Extraction, level_supported, norm, number_in, on_page

ESTIMATE_BY_MODEL = {"pl": "Zaproponowane przez model na podstawie tekstu źródła; źródło nie podaje tego wprost. Wymaga weryfikacji.",
                     "en": "Proposed by the model from the source text; the source does not state it directly. Needs review."}
TRL_NOT_APPLICABLE = {"pl": "Nie dotyczy: skala TRL opisuje technologie, a to rozwiązanie edukacyjne lub administracyjne.",
                      "en": "Not applicable: TRL describes technologies. This is an educational or administrative solution."}
TRL_UNKNOWN = {"pl": "Źródło nie podaje poziomu gotowości technologicznej, a model nie znalazł podstaw do jego oceny.",
               "en": "The source gives no technology readiness level and the model found no basis to estimate one."}


def card_id_for(url: str) -> str:
    """Stable id: collecting the same URL again updates the same card."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, url))


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:60] or "other"


def _passage_lang(text: str) -> str:
    return "pl" if re.search(r"[ąćęłńóśźż]", text.lower()) or re.search(r"\b(oraz|jest|się|dla|który)\b", text.lower()) else "en"


def build_card(x: Extraction, *, text: str, url: str, source_name: str, source_type: str, retrieved_at: str,
               license: str | None = None, extra_evidence: list[dict] | None = None) -> dict:
    now = dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    sid = str(uuid.uuid5(uuid.NAMESPACE_URL, "source:" + url))
    quotes = [q for q in (x.key_quote, x.implementation_quote, x.trl_quote, x.region_quote, x.polish_patent_quote) if q and on_page(q, text)]
    passage = " … ".join(dict.fromkeys(norm(q) for q in quotes)) or None

    evidence = []
    for f in x.facts:
        if on_page(f.quote, text) and number_in(f.quote, f.value) and f.label.pl.strip() and f.label.en.strip():
            value = int(f.value) if float(f.value).is_integer() else f.value
            evidence.append({"id": str(uuid.uuid4()), "metric": _slug(f.metric).replace("-", "_"), "label": f.label.model_dump(),
                             "value": value, "unit": f.unit or None, "sourceId": sid,
                             "query": f'Read from {url}. Quoted text: "{norm(f.quote)}"', "retrievedAt": retrieved_at})
    if x.polish_patent_number and on_page(x.polish_patent_quote, text) and x.polish_patent_number in norm(x.polish_patent_quote):
        evidence.append({"id": str(uuid.uuid4()), "metric": "polish_patent_number_stated",
                         "label": {"pl": "Numer polskiego patentu lub zgłoszenia podany przez źródło", "en": "Polish patent or application number stated by the source"},
                         "value": x.polish_patent_number, "unit": None, "sourceId": sid,
                         "query": f'Read from {url}. Quoted text: "{norm(x.polish_patent_quote)}"', "retrievedAt": retrieved_at})
    for e in extra_evidence or []:
        evidence.append({**e, "id": str(uuid.uuid4())})

    def prov(quote: str, ok: bool, method: dict | None = None) -> dict:
        if ok:
            return {"basis": "confirmed", "sourceIds": [sid], "evidenceIds": [], "method": None, "methodText": None}
        m = method or ESTIMATE_BY_MODEL
        return {"basis": "estimate", "sourceIds": [sid], "evidenceIds": [], "method": m["en"], "methodText": m}

    level_ok = on_page(x.implementation_quote, text) and level_supported(x.implementation_level, x.implementation_quote)
    technological = x.area == "technological" and x.trl_applicable
    if not technological:
        trl_value, trl_prov = None, prov("", False, TRL_NOT_APPLICABLE)
    elif 1 <= x.trl <= 9:
        trl_value = x.trl
        trl_prov = prov(x.trl_quote, on_page(x.trl_quote, text) and number_in(x.trl_quote, x.trl))
    else:
        trl_value, trl_prov = None, prov("", False, TRL_UNKNOWN)
    region = x.region if x.region != "none" and on_page(x.region_quote, text) else None
    empty_score = {"value": None, "confidence": "low", "insufficientData": True, "sampleSize": 0, "basis": "estimate",
                   "sourceIds": [], "evidenceIds": [], "method": None, "methodText": None, "explanation": None}
    tags = {}
    for t in x.tags[:4]:
        if t.pl.strip() and t.en.strip():
            tags[_slug(t.slug)] = {"slug": _slug(t.slug), "label": {"pl": t.pl.strip(), "en": t.en.strip()}}
    card = {
        "id": card_id_for(url),
        "title": x.title.model_dump(), "summaryShort": x.summary_short.model_dump(), "summary": x.summary.model_dump(),
        "area": x.area, "tags": list(tags.values()),
        "organisation": {"name": x.organisation_name.strip(), "type": x.organisation_type, "url": x.organisation_url or None, "region": region},
        "implementationLevel": {"value": x.implementation_level, "basis": "confirmed" if level_ok else "estimate"},
        "trl": {"applicable": technological, "value": trl_value, "basis": trl_prov["basis"]},
        "scores": {"innovativeness": None, "applicationPotential": None, "credibility": None},
        "polishIp": False,  # set only after the number is verified in the UPRP register (not reachable without login)
        "lastCheckedAt": now, "stale": False, "sourceCount": 1, "relevance": None,
        "implementationLevelDetail": {"value": x.implementation_level, **prov(x.implementation_quote, level_ok)},
        "trlDetail": {"applicable": technological, "value": trl_value, **trl_prov},
        "assessment": {"innovativeness": dict(empty_score), "applicationPotential": dict(empty_score), "credibility": dict(empty_score)},
        "oslo": {"passed": x.oslo_new_or_improved and x.oslo_differs_significantly and x.oslo_available_or_in_use,
                 "newOrImproved": x.oslo_new_or_improved, "differsSignificantly": x.oslo_differs_significantly,
                 "availableOrInUse": x.oslo_available_or_in_use, "basis": "estimate", "note": x.oslo_note.model_dump()},
        "couldAlsoBeUsedIn": [c.model_dump() for c in x.could_also_be_used_in[:3] if c.pl.strip() and c.en.strip()],
        "owner": {"name": x.organisation_name.strip(), "url": x.organisation_url or url},
        "sources": [{"id": sid, "type": source_type, "name": source_name, "url": url, "retrievedAt": retrieved_at,
                     "passage": passage, "passageLang": _passage_lang(passage) if passage else None, "license": license}],
        "evidence": evidence, "firstSeenAt": now, "statusChangedAt": None,
    }
    bad = problems(card)
    if bad:
        raise ValueError(f"extracted card breaks the language rule: {', '.join(bad)}")
    return card


def store(card: dict) -> dict:
    """Insert or update the card, keep firstSeenAt and record a status change when the level moved. Returns a change note."""
    from ..seed import load_card
    with connection() as conn, conn.transaction():
        old = conn.execute("SELECT implementation_level, trl, first_seen_at, status_changed_at FROM cards WHERE id = %s", (card["id"],)).fetchone()
        if old:
            card["firstSeenAt"] = old["first_seen_at"].strftime("%Y-%m-%dT%H:%M:%SZ")
        load_card(conn, card)  # keeps the card's status history
        change = None
        if old and old["implementation_level"] != card["implementationLevel"]["value"]:
            change = ("implementationLevel", old["implementation_level"], card["implementationLevel"]["value"])
        elif old and old["trl"] != card["trl"]["value"] and card["trl"]["applicable"]:
            change = ("trl", None if old["trl"] is None else str(old["trl"]), None if card["trl"]["value"] is None else str(card["trl"]["value"]))
        if change:
            src = conn.execute("SELECT source_id FROM card_sources WHERE card_id = %s LIMIT 1", (card["id"],)).fetchone()
            conn.execute("INSERT INTO status_history (card_id, field, from_value, to_value, source_id) VALUES (%s,%s,%s,%s,%s)",
                         (card["id"], change[0], change[1], change[2], src["source_id"] if src else None))
            conn.execute("UPDATE cards SET status_changed_at = now() WHERE id = %s", (card["id"],))
    return {"cardId": card["id"], "added": old is None, "statusChange": change}


def save_snapshot_card(card: dict) -> None:
    """Keep a copy of every collected card next to the source snapshots, for an offline demo."""
    from .fetch import cache_dir
    d = cache_dir() / "cards"
    d.mkdir(exist_ok=True)
    (d / f"{card['id']}.json").write_text(json.dumps(card, ensure_ascii=False, indent=2), encoding="utf-8")
