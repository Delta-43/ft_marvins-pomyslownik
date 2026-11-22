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


def top_polish_works(title_en: str, n: int = 3, *, offline: bool = False) -> list[dict]:
    """The best-matching works by Polish institutions, for "who else works on this" (B17).

    Only institutions are kept: author names (people) are dropped here and never stored (GDPR, F17).
    """
    q = query_words(title_en)
    if not q or not settings.openalex_api_key:
        return []
    params = {"search": q, "filter": "institutions.country_code:PL,from_publication_date:2015-01-01", "per-page": str(n),
              "select": "id,display_name,publication_year,doi,authorships"}
    url = BASE + "?" + urllib.parse.urlencode(params)
    raw, _ = fetch.get(url + "&api_key=" + urllib.parse.quote(settings.openalex_api_key), offline=offline,
                       check_robots=False, cache_tag="openalex")
    out = []
    for w in json.loads(raw).get("results", []):
        insts = [i for a in w.get("authorships") or [] for i in a.get("institutions") or [] if i.get("country_code") == "PL"]
        inst = insts[0] if insts else {}
        link = w.get("doi") or w.get("id")
        if not w.get("display_name") or not link or not str(link).startswith("http"):
            continue
        out.append({"title": w["display_name"], "year": w.get("publication_year"), "url": link,
                    "org_name": inst.get("display_name"), "contact_url": inst.get("ror") if str(inst.get("ror", "")).startswith("http") else None,
                    "query_url": url})
    return out
