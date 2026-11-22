"""Task B6a (part 2). OpenAlex API (CC0 data, needs OPENALEX_API_KEY). Adds evidence, not cards.

For a technological card we count works by Polish institutions that match the card's English title words.
The count becomes an evidence row the innovativeness score can use. The number comes from the API, never from a model.
"""
import json
import re
import urllib.parse

from ..config import settings
from . import fetch

BASE = "https://api.openalex.org/works"
STOP = {"for", "the", "and", "with", "from", "into", "of", "a", "an", "in", "on", "to", "by", "using", "based", "new", "method", "system"}


def query_words(title_en: str, n: int = 6) -> str:
    words = [w for w in re.findall(r"[A-Za-z][A-Za-z\-]{2,}", title_en) if w.lower() not in STOP]
    return " ".join(words[:n])


def _count(q: str, offline: bool) -> tuple[int, str]:
    params = {"search": q, "filter": "institutions.country_code:PL,from_publication_date:2015-01-01", "per-page": "1", "select": "id"}
    public_url = BASE + "?" + urllib.parse.urlencode(params)
    raw, _ = fetch.get(public_url + "&api_key=" + urllib.parse.quote(settings.openalex_api_key), offline=offline,
                       check_robots=False, cache_tag="openalex")
    return int(json.loads(raw)["meta"]["count"]), public_url


def similar_polish_works(title_en: str, *, offline: bool = False) -> tuple[int, str] | None:
    """(count, the exact request URL without the key), or None when there is no key or no usable title.

    Six title words first. When they find nothing, three words: a long phrase often matches no work at all, and
    "0 similar works" would then read as high novelty. The URL that produced the number is returned, so it is visible.
    """
    q = query_words(title_en)
    if not q or not settings.openalex_api_key:
        return None
    count, url = _count(q, offline)
    short = query_words(title_en, 3)
    if count == 0 and short != q:
        count, url = _count(short, offline)
    return count, url
