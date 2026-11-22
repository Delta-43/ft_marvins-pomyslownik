"""Compare, similar and history. Every shown text is Polish and English."""
from uuid import UUID

from fastapi import HTTPException

from ..db import one, rows
from .cards import SUMMARY_COLS, Filters, iso, stale_params, summary  # noqa: F401
from .i18n import NO, NO_DATA, NOT_APPLICABLE, YES, label

LEVELS_SET = {"concept", "prototype", "testing", "pilot", "in_practice"}


def _cards(ids: list[UUID]) -> list[dict]:
    found = rows(f"""SELECT {SUMMARY_COLS} FROM cards c JOIN organisations o ON o.id = c.organisation_id WHERE c.id = ANY(%(ids)s)""",
                 {"ids": ids, **stale_params()})
    by_id = {r["id"]: r for r in found}
    if len(by_id) != len(set(ids)):
        raise HTTPException(status_code=404, detail="One or more cards were not found.")
    return [summary(by_id[i]) for i in ids]


def compare(ids: list[UUID]) -> dict:
    if not 2 <= len(ids) <= 4 or len(set(ids)) != len(ids):
        raise HTTPException(status_code=422, detail="Send two to four different card ids.")
    cards = _cards(ids)

    def row(key: str, lab: tuple[str, str], cell, numeric: bool = False) -> dict:
        cells = []
        for c in cards:
            display, raw, basis = cell(c)
            cells.append({"cardId": c["id"], "display": display, "raw": raw, "basis": basis})
        if numeric:
            values = [x["raw"] for x in cells if isinstance(x["raw"], int | float)]
            best = max(values) if len(values) > 1 and len(set(values)) > 1 else None
            for x in cells:
                x["isBest"] = best is not None and x["raw"] == best
        return {"key": key, "label": {"pl": lab[0], "en": lab[1]}, "cells": cells}

    def score(name: str):
        def f(c):
            v = c["scores"][name]
            return (NO_DATA if v is None else {"pl": str(v), "en": str(v)}), v, ("estimate" if v is not None else None)
        return f

    def trl(c):
        t = c["trl"]
        if not t["applicable"]:
            return NOT_APPLICABLE, None, t["basis"]
        if t["value"] is None:  # a technology card whose TRL nobody could establish
            return NO_DATA, None, t["basis"]
        return {"pl": str(t["value"]), "en": str(t["value"])}, t["value"], t["basis"]

    rows_ = [
        row("area", ("Obszar", "Area"), lambda c: (label(c["area"]), c["area"], None)),
        row("organisation", ("Organizacja", "Organisation"), lambda c: ({"pl": c["organisation"]["name"], "en": c["organisation"]["name"]}, c["organisation"]["name"], None)),
        row("implementationLevel", ("Poziom wdrożenia", "Implementation level"),
            lambda c: (label(c["implementationLevel"]["value"]), c["implementationLevel"]["value"], c["implementationLevel"]["basis"])),
        row("trl", ("Poziom gotowości technologicznej (TRL)", "Technology readiness level (TRL)"), trl, numeric=True),
        row("innovativeness", ("Nowatorstwo", "Innovativeness"), score("innovativeness"), numeric=True),
        row("applicationPotential", ("Potencjał zastosowania", "Application potential"), score("applicationPotential"), numeric=True),
        row("credibility", ("Wiarygodność", "Credibility"), score("credibility"), numeric=True),
        row("polishIp", ("Polska własność intelektualna", "Polish intellectual property"), lambda c: (YES if c["polishIp"] else NO, c["polishIp"], None)),
        row("sourceCount", ("Liczba źródeł", "Number of sources"), lambda c: ({"pl": str(c["sourceCount"]), "en": str(c["sourceCount"])}, c["sourceCount"], None), numeric=True),
        row("lastCheckedAt", ("Ostatnio sprawdzono", "Last checked"), lambda c: ({"pl": c["lastCheckedAt"][:10], "en": c["lastCheckedAt"][:10]}, c["lastCheckedAt"], None)),
    ]
    return {"cards": cards, "rows": rows_}


def similar(card_id: UUID, limit: int) -> list[dict]:
    """Trigram similarity of the accent-free text, blended with shared tags. Computed, never model-written (basis: estimate).
    Task B10 can switch this to embeddings."""
    if not one("SELECT 1 FROM cards WHERE id = %s", (card_id,)):
        raise HTTPException(status_code=404, detail="Card not found.")
    data = rows(f"""
        WITH me AS (SELECT id, search_text, ARRAY(SELECT tag_slug FROM card_tags WHERE card_id = %(id)s) AS tags FROM cards WHERE id = %(id)s)
        SELECT {SUMMARY_COLS},
               (0.6 * similarity(c.search_text, me.search_text)
                + 0.4 * COALESCE((SELECT count(*)::float FROM card_tags ct WHERE ct.card_id = c.id AND ct.tag_slug = ANY(me.tags))
                                  / NULLIF(cardinality(me.tags) + (SELECT count(*) FROM card_tags ct2 WHERE ct2.card_id = c.id)
                                           - (SELECT count(*) FROM card_tags ct3 WHERE ct3.card_id = c.id AND ct3.tag_slug = ANY(me.tags)), 0), 0)) AS sim
        FROM cards c JOIN organisations o ON o.id = c.organisation_id, me
        WHERE c.id <> me.id ORDER BY sim DESC, c.id LIMIT %(limit)s""", {"id": card_id, "limit": limit, **stale_params()})
    return [{"card": summary(r), "similarity": round(min(max(float(r["sim"] or 0), 0.0), 1.0), 3), "basis": "estimate"} for r in data]


def history(card_id: UUID) -> list[dict]:
    if not one("SELECT 1 FROM cards WHERE id = %s", (card_id,)):
        raise HTTPException(status_code=404, detail="Card not found.")
    data = rows("SELECT at, field, from_value, to_value, source_id FROM status_history WHERE card_id = %s ORDER BY at DESC", (card_id,))
    return [{"at": iso(r["at"]), "field": r["field"], "from": r["from_value"], "to": r["to_value"],
             "fromLabel": change_label(r["field"], r["from_value"]), "toLabel": change_label(r["field"], r["to_value"]),
             "sourceId": str(r["source_id"]) if r["source_id"] else None} for r in data]


SOURCE_STATES = {
    "source_ok": {"pl": "źródło potwierdza opis", "en": "source confirms the description"},
    "source_changed": {"pl": "źródło zmieniło treść, wymaga przeglądu", "en": "source text changed, needs review"},
    "source_unavailable": {"pl": "źródło niedostępne", "en": "source unavailable"},
    # Polish IP status (field "other"), written by seed.record_changes
    "polish_ip_unknown": {"pl": "polska własność intelektualna: brak informacji", "en": "Polish IP: no information"},
    "polish_ip_stated": {"pl": "polska własność intelektualna: deklarowana przez źródło", "en": "Polish IP: stated by the source, not verified"},
    "polish_ip_confirmed": {"pl": "polska własność intelektualna: potwierdzona w rejestrze", "en": "Polish IP: confirmed in the register"},
}


def change_label(field: str, value: str | None) -> dict | None:
    if value is None:
        return None
    if field == "implementationLevel" and value in LEVELS_SET:
        return label(value)
    if field == "other" and value in SOURCE_STATES:
        return SOURCE_STATES[value]
    return {"pl": value, "en": value}
