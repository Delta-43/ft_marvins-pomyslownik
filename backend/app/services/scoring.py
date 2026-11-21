"""Task B5. Deterministic scoring from stored evidence. The model never produces a number.

Same input gives the same output. With too little evidence the answer is insufficientData = True, not a guess.
Every number a score uses is an evidence row (metric, value, unit, source, query, date), and every explanation
text is built from a template that only contains numbers from those rows (see validator.py).
The weights are indicative, not final (PLAN.md section 4). They are written down here and on the methodology page.
"""
import math
from dataclasses import dataclass, field
from urllib.parse import urlparse

VERSION = "v1"
# Hosts that belong to institutions (state, universities, cities). A listing on a platform such as PTT is not "official"
# even when the platform belongs to a state agency, because the listing is written by the offering party.
OFFICIAL_SUFFIXES = (".gov.pl", ".edu.pl", ".krakow.pl", ".wroclaw.pl", ".gdansk.pl", ".poznan.pl", ".lodz.pl", ".warszawa.pl")
LEVEL_INDEX = {"concept": 1, "prototype": 2, "testing": 3, "pilot": 4, "in_practice": 5}
MIN_POOL = 5  # smallest number of other cards we need before a "distance to similar records" means anything


def is_official(url: str) -> bool:
    host = (urlparse(url).hostname or "").lower()
    return any(host.endswith(s) or host == s[1:] for s in OFFICIAL_SUFFIXES)


@dataclass
class Facts:
    """Everything the scores may use. Each field is stored as an evidence row by the runner."""
    source_count: int
    official_source_count: int
    sources_with_passage: int
    implementation_level: str
    implementation_confirmed: bool
    check_age_days: int
    has_owner_contact: bool
    sector_count: int          # entries in couldAlsoBeUsedIn
    source_evidence_count: int  # evidence rows that came from the sources themselves (numbers the source states)
    pool_size: int             # other cards compared
    top_similarities: list[float] = field(default_factory=list)  # best matches among the pool, 0..1
    similar_publications: int | None = None  # OpenAlex count of similar works by Polish institutions, when known


@dataclass
class Result:
    value: int | None
    confidence: str
    insufficient: bool
    sample_size: int
    metrics: list[str]         # names of the evidence rows used
    method: dict               # {pl, en}
    explanation: dict | None   # {pl, en}


def _conf(n: int, low: int, high: int) -> str:
    return "high" if n >= high else "medium" if n >= low else "low"


def credibility(f: Facts) -> Result:
    method = {"en": "Sum of: independent sources (up to 35), an institutional source (25), implementation confirmed by a source (20), "
                    "every source quotes its passage (10), checked recently (10). Indicative weights.",
              "pl": "Suma: niezależne źródła (do 35), źródło instytucjonalne (25), wdrożenie potwierdzone przez źródło (20), "
                    "każde źródło z cytatem (10), niedawne sprawdzenie (10). Wagi orientacyjne."}
    metrics = ["source_count", "official_source_count", "implementation_confirmed", "sources_with_passage", "check_age_days"]
    if f.source_count == 0:
        return Result(None, "low", True, 0, metrics, method, None)
    pts = min(f.source_count, 3) / 3 * 35
    pts += 25 if f.official_source_count > 0 else 0
    pts += 20 if f.implementation_confirmed else 0
    pts += 10 if f.sources_with_passage == f.source_count else 0
    pts += 10 if f.check_age_days <= 30 else 5 if f.check_age_days <= 180 else 0
    v = round(pts)
    expl = {"en": f"{f.source_count} source(s), {f.official_source_count} institutional; implementation "
                  f"{'confirmed' if f.implementation_confirmed else 'not confirmed'} by a source; checked {f.check_age_days} day(s) ago. Score {v} of 100.",
            "pl": f"Źródeł: {f.source_count}, w tym instytucjonalnych: {f.official_source_count}; wdrożenie "
                  f"{'potwierdzone' if f.implementation_confirmed else 'niepotwierdzone'} przez źródło; sprawdzono {f.check_age_days} dni temu. Wynik {v} ze 100."}
    return Result(v, _conf(f.source_count, 2, 3), False, f.source_count, metrics, method, expl)


def innovativeness(f: Facts) -> Result:
    """Distance to the closest cards in the database; when OpenAlex data exists, also how crowded the field is."""
    pubs_known = f.similar_publications is not None
    method = {"en": "100 minus the mean similarity (as a percentage) of the three closest other cards in the database. "
                    "Needs at least 5 other cards to compare with. "
                    + ("When OpenAlex counts similar publications by Polish institutions, 60% of the score comes from the distance and 40% from "
                       "how few such publications exist (0 works gives 100, 1000 or more gives 0, on a log scale). " if pubs_known else "")
                    + "Indicative.",
              "pl": "100 minus średnie podobieństwo (w procentach) trzech najbliższych innych kart w bazie. "
                    "Wymaga co najmniej 5 innych kart do porównania. "
                    + ("Gdy OpenAlex podaje liczbę podobnych publikacji polskich instytucji, 60% wyniku to odległość, a 40% to rzadkość takich "
                       "publikacji (0 prac daje 100, 1000 lub więcej daje 0, w skali logarytmicznej). " if pubs_known else "")
                    + "Wynik orientacyjny."}
    metrics = ["compared_cards", "mean_top3_similarity_pct"] + (["similar_polish_publications_count"] if pubs_known else [])
    if f.pool_size < MIN_POOL or not f.top_similarities:
        return Result(None, "low", True, f.pool_size, metrics, method, None)
    top = sorted(f.top_similarities, reverse=True)[:3]
    mean_pct = round(sum(top) / len(top) * 100)
    distance = max(0, min(100, 100 - mean_pct))
    if pubs_known:
        rarity = 100 * (1 - min(math.log10(1 + f.similar_publications) / 3, 1))
        v = round(0.6 * distance + 0.4 * rarity)
        expl = {"en": f"Compared with {f.pool_size} other cards; the three closest are on average {mean_pct}% similar. "
                      f"OpenAlex finds {f.similar_publications} similar works by Polish institutions. Score {v} of 100.",
                "pl": f"Porównano z {f.pool_size} innymi kartami; trzy najbliższe są średnio podobne w {mean_pct}%. "
                      f"OpenAlex znajduje {f.similar_publications} podobnych prac polskich instytucji. Wynik {v} ze 100."}
    else:
        v = distance
        expl = {"en": f"Compared with {f.pool_size} other cards; the three closest are on average {mean_pct}% similar. Score {v} of 100.",
                "pl": f"Porównano z {f.pool_size} innymi kartami; trzy najbliższe są średnio podobne w {mean_pct}%. Wynik {v} ze 100."}
    return Result(v, _conf(f.pool_size + (10 if pubs_known else 0), 10, 30), False, f.pool_size, metrics, method, expl)


def application_potential(f: Facts) -> Result:
    method = {"en": "Sum of: implementation level (up to 40), documentation (sources, quoted numbers, owner contact; up to 30), "
                    "other sectors named (up to 20), a source states numbers (10). Indicative weights.",
              "pl": "Suma: poziom wdrożenia (do 40), dokumentacja (źródła, cytowane liczby, kontakt do właściciela; do 30), "
                    "wskazane inne sektory (do 20), źródło podaje liczby (10). Wagi orientacyjne."}
    metrics = ["implementation_level_index", "source_count", "has_owner_contact", "sector_count", "source_evidence_count"]
    if f.source_count == 0:
        return Result(None, "low", True, 0, metrics, method, None)
    lvl = LEVEL_INDEX[f.implementation_level]
    pts = lvl / 5 * 40
    pts += min(f.source_count, 2) / 2 * 15 + (10 if f.has_owner_contact else 0) + (5 if f.sources_with_passage else 0)
    pts += min(f.sector_count, 2) / 2 * 20
    pts += 10 if f.source_evidence_count > 0 else 0
    v = round(pts)
    expl = {"en": f"Implementation level {lvl} of 5, {f.source_count} source(s), {f.sector_count} other sector(s) named. Score {v} of 100.",
            "pl": f"Poziom wdrożenia {lvl} z 5, źródeł: {f.source_count}, wskazanych innych sektorów: {f.sector_count}. Wynik {v} ze 100."}
    return Result(v, _conf(f.source_count, 2, 3), False, f.source_count, metrics, method, expl)


def metric_values(f: Facts) -> dict[str, float | int | bool]:
    """The evidence rows this engine writes. Names must match the `metrics` lists above."""
    top = sorted(f.top_similarities, reverse=True)[:3]
    return {
        "source_count": f.source_count, "official_source_count": f.official_source_count,
        "implementation_confirmed": f.implementation_confirmed, "sources_with_passage": f.sources_with_passage,
        "check_age_days": f.check_age_days, "implementation_level_index": LEVEL_INDEX[f.implementation_level],
        "has_owner_contact": f.has_owner_contact, "sector_count": f.sector_count,
        "source_evidence_count": f.source_evidence_count, "compared_cards": f.pool_size,
        "mean_top3_similarity_pct": round(sum(top) / len(top) * 100) if top else 0,
        **({"similar_polish_publications_count": f.similar_publications} if f.similar_publications is not None else {}),
    }


METRIC_LABELS = {
    "source_count": ("Liczba źródeł", "Number of sources"),
    "official_source_count": ("Liczba źródeł instytucjonalnych", "Number of institutional sources"),
    "implementation_confirmed": ("Wdrożenie potwierdzone przez źródło", "Implementation confirmed by a source"),
    "sources_with_passage": ("Źródła z cytatem", "Sources with a quoted passage"),
    "check_age_days": ("Dni od ostatniego sprawdzenia", "Days since the last check"),
    "implementation_level_index": ("Indeks poziomu wdrożenia (1 do 5)", "Implementation level index (1 to 5)"),
    "has_owner_contact": ("Jest kontakt do właściciela", "Owner contact present"),
    "sector_count": ("Liczba wskazanych sektorów", "Number of sectors named"),
    "source_evidence_count": ("Liczby podane przez źródło", "Numbers stated by the source"),
    "compared_cards": ("Liczba porównanych kart", "Number of cards compared"),
    "mean_top3_similarity_pct": ("Średnie podobieństwo trzech najbliższych kart (%)", "Mean similarity of the three closest cards (%)"),
    "similar_polish_publications_count": ("Liczba podobnych publikacji polskich instytucji (OpenAlex)", "Similar publications by Polish institutions (OpenAlex)"),
}


def score_all(f: Facts) -> dict[str, Result]:
    return {"innovativeness": innovativeness(f), "applicationPotential": application_potential(f), "credibility": credibility(f)}
