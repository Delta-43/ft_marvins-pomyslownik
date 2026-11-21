"""Data the design review asked for: latest tags, matching facet filters, labels in both languages."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.services.i18n import (
    licence_label,
    sentence_case,
    source_name_text,
    split_organisation,
    unit_label,
)


def test_labels_and_splits():
    assert sentence_case("odmulanie zbiorników") == "Odmulanie zbiorników"
    assert unit_label("ankiet") == {"pl": "ankiet", "en": "surveys"} and unit_label("dB") == {"pl": "dB", "en": "dB"}
    assert source_name_text("Dokument PDF: Raport")["en"] == "PDF document: Raport"
    assert source_name_text("OpenAlex: wyszukiwanie podobnych prac / similar works search") == {
        "pl": "OpenAlex: wyszukiwanie podobnych prac", "en": "OpenAlex: similar works search"}
    assert licence_label("CC0")[1].startswith("https://creativecommons.org") and licence_label(None) == (None, None)
    assert split_organisation("Politechnika Koszalińska; Wydział Mechaniczny") == ("Politechnika Koszalińska", "Wydział Mechaniczny")


@pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
def test_tags_facets_and_ip_status():
    from app.main import app
    c = TestClient(app)
    s = c.post("/api/v1/auth/register", json={"provider": "sandbox_id", "providerSubject": f"dr-{uuid.uuid4().hex[:8]}",
                                               "email": "d@example.invalid", "role": "schools", "affiliation": {"name": "T", "type": "school"},
                                               "interests": [], "acceptedTerms": True}).json()["data"]
    h = {"Authorization": f"Bearer {s['token']}"}
    try:
        recent = c.get("/api/v1/tags?sort=recent", headers=h).json()["data"]
        assert recent and [t["lastSeenAt"] for t in recent] == sorted((t["lastSeenAt"] for t in recent), reverse=True)
        assert all(t["label"]["pl"][0].isupper() and t["label"]["en"][0].isupper() for t in recent)
        by_count = c.get("/api/v1/tags?sort=count", headers=h).json()["data"]
        assert [t["count"] for t in by_count] == sorted((t["count"] for t in by_count), reverse=True)
        # facets with the same filter as the list give the same total
        q = "trlMin=3&minCredibility=20"
        total = c.get(f"/api/v1/cards?{q}&limit=100", headers=h).json()["meta"]["total"]
        assert sum(o["count"] for o in c.get(f"/api/v1/facets?{q}", headers=h).json()["data"]["area"]) == total
        stated = c.get("/api/v1/cards?polishIpStatus=stated&limit=100", headers=h).json()
        assert stated["meta"]["total"] >= 1 and all(x["polishIpStatus"] == "stated" for x in stated["data"])
        card = c.get(f"/api/v1/cards/{stated['data'][0]['id']}", headers=h).json()["data"]
        assert all(src["nameText"]["en"] for src in card["sources"])
        assert all((e["unitLabel"] is None) == (e["unit"] is None) for e in card["evidence"])
    finally:
        c.delete("/api/v1/me", headers=h)
