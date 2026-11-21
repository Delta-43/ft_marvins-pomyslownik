"""Collector pipeline without network or model calls: card building, the fact/estimate rule, refresh and the worker."""
import datetime as dt
import os
import uuid

import pytest

from app.collectors import build, extract, fetch
from app.collectors.extract import Bilingual, Extraction, Fact, Tag

TEXT = ("Urządzenie PANTERA jest stosowane w kopalniach od 2021 roku. Masa urządzenia wynosi 8 kg. "
        "Poziom gotowości technologicznej TRL 7. Siedziba: Katowice, woj. śląskie.")


def fake(**over) -> Extraction:
    b = Bilingual
    base = {"is_innovation": True, "rejection_reason": "", "title": b(pl="Rejestrator", en="Recorder"),
                "summary_short": b(pl="Krótko.", en="Short."), "summary": b(pl="Opis modelu.", en="Model summary."),
                "area": "technological", "organisation_name": "Instytut X", "organisation_type": "research_institute",
                "organisation_url": "", "region": "SL", "region_quote": "Katowice, woj. śląskie",
                "implementation_level": "in_practice", "implementation_quote": "jest stosowane w kopalniach od 2021 roku",
                "trl_applicable": True, "trl": 7, "trl_quote": "TRL 7", "tags": [Tag(slug="Mining Safety", pl="Bezpieczeństwo górnicze", en="Mining safety")],
                "could_also_be_used_in": [b(pl="Budownictwo", en="Construction")], "oslo_new_or_improved": True,
                "oslo_differs_significantly": True, "oslo_available_or_in_use": True, "oslo_note": b(pl="Uwaga.", en="Note."),
                "polish_patent_number": "", "polish_patent_quote": "", "key_quote": "Urządzenie PANTERA jest stosowane w kopalniach od 2021 roku.",
                "facts": [Fact(metric="device_mass", label=b(pl="Masa", en="Mass"), value=8, unit="kg", quote="Masa urządzenia wynosi 8 kg"),
                       Fact(metric="made_up", label=b(pl="Zmyślone", en="Made up"), value=99, unit="", quote="Masa urządzenia wynosi 8 kg")]}
    return Extraction(**{**base, **over})


def make(x: Extraction) -> dict:
    return build.build_card(x, text=TEXT, url="https://example.invalid/pantera", source_name="Test", source_type="crawl",
                            retrieved_at="2026-11-21T20:00:00Z")


def test_quotes_on_the_page_become_confirmed_facts():
    c = make(fake())
    assert c["implementationLevelDetail"]["basis"] == "confirmed" and c["trlDetail"]["basis"] == "confirmed"
    assert c["organisation"]["region"] == "SL" and c["tags"][0]["slug"] == "mining-safety"
    assert [e["metric"] for e in c["evidence"]] == ["device_mass"]  # 99 is not in its quote, so it is dropped
    assert c["id"] == build.card_id_for("https://example.invalid/pantera") and c["polishIp"] is False


def test_invented_quotes_turn_into_estimates():
    c = make(fake(implementation_quote="wdrożone w 300 szpitalach", trl=8, trl_quote="TRL 8", region_quote="Gdańsk"))
    assert c["implementationLevelDetail"]["basis"] == "estimate" and c["implementationLevelDetail"]["methodText"]["pl"]
    assert c["trlDetail"]["basis"] == "estimate" and c["organisation"]["region"] is None


def test_level_needs_words_that_signal_it():
    c = make(fake(implementation_level="pilot"))  # the quote says "stosowane", not "pilotaż"
    assert c["implementationLevelDetail"]["basis"] == "estimate"


def test_non_technological_has_no_trl_and_rule_is_bilingual():
    c = make(fake(area="educational"))
    assert c["trl"] == {"applicable": False, "value": None, "basis": "estimate"}
    assert c["trlDetail"]["methodText"]["en"].startswith("Not applicable")


def test_number_matching():
    assert extract.number_in("koszt 100 000 zł", 100000) and extract.number_in("3,5 µm", 3.5)
    assert not extract.number_in("TRL 4", 5) and not extract.on_page("ab", TEXT)


def test_snapshots_never_keep_keys():
    assert "secret" not in fetch._without_secrets("https://api.x/works?search=a&api_key=secret&x=1")


needs_db = pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a database")


@needs_db
def test_store_and_refresh_detect_a_changed_source(monkeypatch):
    from app import pipeline
    from app.db import connection
    card = make(fake())
    card["id"] = build.card_id_for(f"https://example.invalid/{uuid.uuid4()}")
    url = card["sources"][0]["url"] = f"https://example.invalid/{card['id']}"
    card["sources"][0]["id"] = str(uuid.uuid5(uuid.NAMESPACE_URL, url))
    for e in card["evidence"]:
        e["sourceId"] = card["sources"][0]["id"]
    for k in ("implementationLevelDetail", "trlDetail"):
        card[k]["sourceIds"] = [card["sources"][0]["id"]]
    assert build.store(card)["added"]
    pages = {"text": TEXT}
    monkeypatch.setattr(fetch, "get", lambda u, **kw: (pages["text"].encode(), {"retrieved_at": "x"}))
    monkeypatch.setattr(pipeline, "card_id_for", lambda u: "not-collected")  # behave like a curated card: no re-extraction
    with connection() as conn:
        run_row = conn.execute("INSERT INTO collect_runs (mode, source_ids) VALUES ('refresh', %s) RETURNING *",
                               ([card["sources"][0]["id"]],)).fetchone()
    try:
        run = pipeline.Run(run_row)
        pipeline.refresh(run)
        assert run.checked == 1 and run.changes == 0
        pages["text"] = "Strona została przebudowana."
        run2 = pipeline.Run(run_row)
        pipeline.refresh(run2)
        assert run2.changes == 1 and card["id"] in run2.changed
        with connection() as conn:
            h = conn.execute("SELECT field, from_value, to_value FROM status_history WHERE card_id = %s", (card["id"],)).fetchall()
        assert [(r["field"], r["from_value"], r["to_value"]) for r in h] == [("other", "source_ok", "source_changed")]
        from app.services.compare import history
        assert history(uuid.UUID(card["id"]))[0]["toLabel"]["pl"].startswith("źródło zmieniło")
    finally:
        with connection() as conn:
            conn.execute("DELETE FROM collect_runs WHERE id = %s", (run_row["id"],))
            conn.execute("DELETE FROM cards WHERE id = %s", (card["id"],))


@needs_db
def test_worker_claims_once_and_recovers_stuck_runs():
    from app import worker
    from app.db import connection
    with connection() as conn:
        conn.execute("DELETE FROM collect_runs")
        conn.execute("INSERT INTO collect_runs (mode, status, started_at) VALUES ('refresh', 'running', now())")
    worker.recover()
    with connection() as conn:
        assert conn.execute("SELECT status FROM collect_runs").fetchone()["status"] == "failed"
        conn.execute("INSERT INTO collect_runs (mode) VALUES ('collect')")
    first, second = worker.claim(), worker.claim()
    assert first["status"] == "running" and second is None
    with connection() as conn:
        conn.execute("DELETE FROM collect_runs")
    assert dt.datetime.now(dt.UTC)


def test_full_text_keeps_header_content():
    from app.collectors import crawler
    html = b"<html><body><header><h1>Warsztaty w Centrum</h1><p>Tylko po rezerwacji</p></header><main>x</main><script>var a</script></body></html>"
    assert "Tylko po rezerwacji" in crawler.full_text(html) and "var a" not in crawler.full_text(html)
