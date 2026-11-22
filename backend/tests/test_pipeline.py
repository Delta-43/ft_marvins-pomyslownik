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


# ---- Issue #22: collector patterns found in the R5 review ----

def test_generic_made_word_no_longer_confirms_a_prototype():
    t = "W projekcie wykonano wielu serii materiałów kompozytowych."
    c = build.build_card(fake(implementation_level="prototype", implementation_quote="wykonano wielu serii materiałów kompozytowych",
                              key_quote=t), text=t, url="https://example.invalid/x", source_name="T", source_type="api",
                         retrieved_at="2026-11-21T20:00:00Z")
    assert c["implementationLevelDetail"]["basis"] == "estimate"
    assert extract.level_supported("prototype", "zbudowano prototyp urządzenia")


def test_sectors_the_source_never_names_are_dropped():
    c = make(fake(could_also_be_used_in=[Bilingual(pl="Kopalnie węgla", en="Coal mines"), Bilingual(pl="Meble ogrodowe", en="Garden furniture")]))
    assert [x["en"] for x in c["couldAlsoBeUsedIn"]] == ["Coal mines"]  # "kopalniach" is in the text, furniture is not


def test_radon_skips_short_and_commissioned_projects_and_adds_dates():
    from app.collectors import radon
    long_text = "x" * 400
    base = {"summaryPl": long_text, "dateStarted": "2019-02-20", "dateCompleted": "2019-02-25", "titlePl": "Badania jakości powłok"}
    assert not radon.usable(base, 2019)                                        # five days: a service
    assert not radon.usable({**base, "dateCompleted": "2020-01-01", "titlePl": "Przeprowadzenie badań przyczepności dla firmy"}, 2019)
    assert radon.usable({**base, "dateCompleted": "2020-01-01"}, 2019)
    url = "https://radon.nauka.gov.pl/opendata/project/search#uid=ABC"
    c = make(fake())
    c["owner"]["url"] = url
    c = radon.with_project_dates(c, {"dateStarted": "2019-06-24", "dateCompleted": "2019-11-30"}, url, "2026-11-21T20:00:00Z")
    assert "24.06.2019" in c["summary"]["pl"] and "30.11.2019" in c["summary"]["en"]
    assert {e["metric"]: e["value"] for e in c["evidence"]}["project_end_date"] == "2019-11-30"
    assert c["owner"]["url"] == radon.PORTAL


def test_openalex_falls_back_to_a_plainer_query(monkeypatch):
    from app.collectors import openalex
    monkeypatch.setattr(openalex.settings, "openalex_api_key", "k")
    asked = []
    def fake_count(q, offline):
        asked.append(q)
        return (0 if len(q.split()) > 3 else 12), f"https://api.openalex.org/works?search={q}"
    monkeypatch.setattr(openalex, "_count", fake_count)
    count, _url = openalex.similar_polish_works("Continuous desilting of water reservoirs with separation of selected sediment fractions")
    assert count == 12 and asked == ["Continuous desilting water reservoirs separation selected", "Continuous desilting water"]
