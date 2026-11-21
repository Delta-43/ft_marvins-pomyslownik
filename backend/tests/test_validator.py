from app.services.validator import only_evidence_numbers


def test_number_in_evidence_is_allowed():
    assert only_evidence_numbers("Found 3 similar patents.", [3])


def test_number_not_in_evidence_is_rejected():
    assert not only_evidence_numbers("Found 7 similar patents.", [3])
