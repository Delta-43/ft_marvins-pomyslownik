import os

import pytest

from app.services import scoring
from app.services.validator import explanation_is_clean


def facts(**over):
    base = {"source_count": 2, "official_source_count": 1, "sources_with_passage": 2, "implementation_level": "pilot",
                "implementation_confirmed": True, "check_age_days": 3, "has_owner_contact": True, "sector_count": 2,
                "source_evidence_count": 3, "pool_size": 12, "top_similarities": [0.2, 0.1, 0.05]}
    return scoring.Facts(**{**base, **over})


def test_same_input_same_scores():
    a, b = scoring.score_all(facts()), scoring.score_all(facts())
    assert {k: v.value for k, v in a.items()} == {k: v.value for k, v in b.items()}


def test_no_sources_means_insufficient_data_not_a_guess():
    r = scoring.score_all(facts(source_count=0, official_source_count=0, sources_with_passage=0))
    assert r["credibility"].insufficient and r["credibility"].value is None
    assert r["applicationPotential"].insufficient and r["applicationPotential"].value is None


def test_innovativeness_needs_a_big_enough_pool():
    assert scoring.score_all(facts(pool_size=3))["innovativeness"].insufficient
    ok = scoring.score_all(facts())["innovativeness"]
    assert not ok.insufficient and ok.value == 88  # 100 - round(mean(20,10,5) %)


def test_more_independent_evidence_never_lowers_credibility():
    low = scoring.credibility(facts(source_count=1, official_source_count=0, sources_with_passage=1)).value
    high = scoring.credibility(facts()).value
    assert high > low


def test_every_explanation_uses_only_evidence_numbers():
    f = facts()
    values = scoring.metric_values(f)
    for r in scoring.score_all(f).values():
        assert explanation_is_clean(r.explanation, [values[m] for m in r.metrics], r.value)
        assert r.explanation["pl"] and r.explanation["en"] and r.method["pl"] and r.method["en"]
        assert all(m in scoring.METRIC_LABELS and m in values for m in r.metrics)


def test_validator_rejects_a_number_that_is_not_evidence():
    assert not explanation_is_clean({"en": "Found 99 similar patents.", "pl": "Znaleziono 99."}, [3], 50)


def test_institutional_hosts():
    assert scoring.is_official("https://www.gov.pl/web/edukacja/x") and scoring.is_official("https://tu.kielce.pl".replace("tu.kielce.pl", "x.edu.pl"))
    assert not scoring.is_official("http://ptt.arp.pl/bazy/x/")


@pytest.mark.skipif(not os.environ.get("DATABASE_URL"), reason="needs a seeded database")
def test_scores_are_stored_with_evidence():
    from app import score
    from app.db import one, rows
    score.main()
    row = one("SELECT assessment, score_credibility FROM cards WHERE score_credibility IS NOT NULL LIMIT 1")
    cred = row["assessment"]["credibility"]
    assert cred["basis"] == "estimate" and cred["evidenceIds"] and cred["explanation"]["pl"] and cred["methodText"]["en"]
    ids = [r["id"] for r in rows("SELECT id FROM evidence WHERE query LIKE 'Scoring engine%'")]
    assert set(cred["evidenceIds"]) <= {str(i) for i in ids}
    before = one("SELECT sum(score_credibility) AS s FROM cards")["s"]
    score.main()
    assert one("SELECT sum(score_credibility) AS s FROM cards")["s"] == before  # same input, same scores
