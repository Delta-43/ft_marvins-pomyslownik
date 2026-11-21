"""Task B6a (part 1). RAD-on open data API (Ministry of Science, run by OPI PIB). No key needed.

POST https://radon.nauka.gov.pl/opendata/project/search returns research projects. We keep recent projects that
have a Polish summary, and we never pass people's names on: personsInProject and authors are removed before
anything else sees the record (GDPR, REQUIREMENTS F17).
"""
import json

from . import fetch
from .build import build_card
from .extract import NotAnInnovation, extract

ENDPOINT = "https://radon.nauka.gov.pl/opendata/project/search"
LICENSE = "RAD-on open data (OPI PIB). Terms: radon.nauka.gov.pl"
DROP = {"personsInProject", "authors"}


def search(title_word: str, *, pages: int = 3, offline: bool = False) -> list[dict]:
    """Projects whose Polish title contains the word. Pages of 100."""
    out, token = [], None
    for _ in range(pages):
        body = {"resultNumbers": 100, "token": token, "body": {"titlePl": title_word}}
        raw, _ = fetch.get(ENDPOINT, method="POST", json_body=body, offline=offline, check_robots=False)
        data = json.loads(raw)
        out += [{k: v for k, v in r.items() if k not in DROP} for r in data.get("results", [])]
        token = (data.get("pagination") or {}).get("token")
        if not token or not data.get("results"):
            break
    return out


def usable(p: dict, since_year: int = 2018) -> bool:
    started = (p.get("dateStarted") or "0")[:4]
    return bool(p.get("summaryPl")) and len(p["summaryPl"]) > 300 and started.isdigit() and int(started) >= since_year


def record_text(p: dict) -> str:
    inst = "; ".join(i.get("namePl") or i.get("nameEn") or "" for i in p.get("institutionsInProject") or [])
    lines = [f"Tytuł: {p.get('titlePl') or ''}", f"Title: {p.get('titleEn') or ''}", f"Instytucje: {inst}",
             f"Okres realizacji: {p.get('dateStarted') or ''} – {p.get('dateCompleted') or ''}",
             f"Słowa kluczowe: {p.get('keywordsPl') or ''}", f"Streszczenie: {p.get('summaryPl') or ''}",
             f"Summary: {p.get('summaryEn') or ''}"]
    if p.get("financialFunds"):
        lines.append(f"Finansowanie: {p['financialFunds']} {p.get('financialFundsCurr') or ''}")
    return "\n".join(lines)


def record_url(p: dict) -> str:
    return f"{ENDPOINT}#uid={p['uid']}"


def collect_project(p: dict, retrieved_at: str) -> dict:
    text = record_text(p)
    url = record_url(p)
    name = f"RAD-on (OPI PIB), projekt badawczy: {(p.get('titlePl') or '')[:100]}"
    hint = ("This is a research project record from RAD-on, the Polish science ministry's open data API. "
            "A research project is usually at concept or prototype level unless the record says the result is used.")
    x = extract(text, url=url, source_name=name, hint=hint)
    if not x.is_innovation:
        raise NotAnInnovation(x.rejection_reason)
    return build_card(x, text=text, url=url, source_name=name, source_type="api", retrieved_at=retrieved_at, license=LICENSE)
