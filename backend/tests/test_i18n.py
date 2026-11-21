"""The language rule, checked on the seed files themselves. No database needed."""
import glob
import json
import pathlib

import pytest

from app.services.i18n import REGIONS, problems, region_label

SEED = pathlib.Path(__file__).resolve().parents[2] / "data" / "seed" / "cards"
FILES = sorted(glob.glob(str(SEED / "*.json")))


@pytest.mark.parametrize("path", FILES, ids=[pathlib.Path(f).stem for f in FILES])
def test_seed_card_is_fully_bilingual(path):
    assert problems(json.loads(pathlib.Path(path).read_text(encoding="utf-8"))) == []


def test_rule_catches_english_only_text():
    card = {"title": {"pl": "Tytuł", "en": "Title"}, "summaryShort": {"en": "Only English"}, "summary": {"pl": "a", "en": "b"},
            "tags": [{"slug": "x", "label": {"en": "Energy"}}], "oslo": {"note": {"en": "note"}},
            "implementationLevelDetail": {"method": "by rule"}}
    found = problems(card)
    assert "summaryShort" in found and "tags.x.label" in found and "oslo.note" in found
    assert "implementationLevelDetail.methodText" in found


def test_all_sixteen_regions_have_both_names():
    assert len(REGIONS) == 16 and region_label("DS") == {"pl": "Dolnośląskie", "en": "Lower Silesian"}
