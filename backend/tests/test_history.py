"""Issue #17: a correction to a card (seed or collector) leaves a status-history row with labels in both languages."""
import copy
import json
import os
import pathlib
import uuid

import pytest
from fastapi.testclient import TestClient

needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
SEED = pathlib.Path(__file__).resolve().parents[2] / "data" / "seed" / "cards"


@needs_db
def test_corrected_card_records_level_trl_and_polish_ip_changes():
    from app.db import connection
    from app.main import app
    from app.seed import load_card

    card = json.loads((SEED / "ptt-pswietokrzyska-vibration-damper.json").read_text(encoding="utf-8"))
    cid = card["id"]
    changed = copy.deepcopy(card)
    changed["implementationLevel"]["value"] = changed["implementationLevelDetail"]["value"] = "pilot"
    changed["trl"]["value"] = changed["trlDetail"]["value"] = 6
    changed["polishIpStatus"], changed["polishIp"] = "confirmed", True

    with connection() as conn:
        start = conn.execute("SELECT coalesce(max(id), 0) AS m FROM status_history WHERE card_id = %s", (cid,)).fetchone()["m"]
    try:
        with connection() as conn, conn.transaction():
            assert load_card(conn, card) == []            # loading the same card again changes nothing
            changes = load_card(conn, changed)
        assert {c[0] for c in changes} == {"implementationLevel", "trl", "other"}
        assert ("other", f"polish_ip_{card['polishIpStatus']}", "polish_ip_confirmed") in changes
        with connection() as conn, conn.transaction():
            assert load_card(conn, changed) == []          # idempotent: a re-seed writes no second row

        c = TestClient(app)
        r = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"hist-{uuid.uuid4().hex[:8]}",
                                                   "email": "h@example.invalid", "role": "schools",
                                                   "affiliation": {"name": "T", "type": "school"}, "interests": [], "acceptedTerms": True})
        h = {"Authorization": f"Bearer {r.json()['data']['token']}"}
        try:
            rows = c.get(f"/api/v1/cards/{cid}/history", headers=h).json()["data"]
            ip = next(x for x in rows if x["to"] == "polish_ip_confirmed")
            assert ip["toLabel"]["en"] == "Polish IP: confirmed in the register" and ip["toLabel"]["pl"]
            lvl = next(x for x in rows if x["field"] == "implementationLevel")
            assert lvl["toLabel"] == {"pl": "Pilotaż", "en": "Pilot"}
            assert c.get(f"/api/v1/cards/{cid}", headers=h).json()["data"]["statusChangedAt"] is not None
        finally:
            c.delete("/api/v1/me", headers=h)
    finally:
        with connection() as conn, conn.transaction():
            load_card(conn, card)
            conn.execute("DELETE FROM status_history WHERE card_id = %s AND id > %s", (cid, start))


def test_evidence_origin_and_query_text():
    from app.services.i18n import evidence_origin, query_text
    q = "Scoring engine v1: computed from this card's stored data on 2026-11-21"
    assert evidence_origin(q) == "computed" and query_text(q)["pl"].startswith("Obliczone przez Pomysłownik")
    r = query_text('Read from the page https://example.invalid/a. Quoted text: "Masa 8 kg"')
    assert r["pl"] == 'Odczytane ze źródła https://example.invalid/a. Cytat: "Masa 8 kg"' and evidence_origin('Read from x') == "source"
    assert query_text("GET https://api.openalex.org/works?search=x (meta.count)")["en"].startswith("Result count of the OpenAlex query")
