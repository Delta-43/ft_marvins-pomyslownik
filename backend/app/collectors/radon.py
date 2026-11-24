"""Task B6a (part 1). RAD-on open data API (Ministry of Science, run by OPI PIB). No key needed.

POST https://radon.nauka.gov.pl/opendata/project/search returns research projects. We keep recent projects that
have a Polish summary, and we never pass people's names on: personsInProject and authors are removed before
anything else sees the record (GDPR).
"""
import datetime as dt
import json
import re
import uuid

from . import fetch
from .build import build_card
from .extract import NotAnInnovation, extract

ENDPOINT = "https://radon.nauka.gov.pl/opendata/project/search"
LICENSE = "RAD-on open data (OPI PIB). Terms: radon.nauka.gov.pl"
PORTAL = "https://radon.nauka.gov.pl/"
# The search endpoint is POST-only, so a link to it opens nothing (#22). Cards link the public project browser instead;
# the uid after '#' keeps every record's URL unique. LEGACY is the old form, still used to recognise known records.
BROWSER = "https://radon.nauka.gov.pl/dane/projekty-badawcze"
LEGACY = f"{ENDPOINT}#uid="
MIN_DAYS = 60  # shorter projects are almost always commissioned tests or services (#22: a 5-day paint test)
# Commissioned work for a company: "Przeprowadzenie badań ... dla firmy X", "na zlecenie", "usługa badawcza".
COMMISSIONED = re.compile(r"^(?:przeprowadzenie|wykonanie|realizacja) (?:badań|bada[nń]|analiz|pomiarów|testów)|na zlecenie|zleceniodawc|usług[ai] badawcz",
                          re.IGNORECASE)
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


def _date(s: str | None) -> dt.date | None:
    try:
        return dt.date.fromisoformat((s or "")[:10])
    except ValueError:
        return None


def commissioned(p: dict) -> bool:
    """A short project, or one that describes itself as work commissioned by a company: a service, not an innovation."""
    start, end = _date(p.get("dateStarted")), _date(p.get("dateCompleted"))
    if start and end and (end - start).days < MIN_DAYS:
        return True
    return bool(COMMISSIONED.search(p.get("titlePl") or "") or COMMISSIONED.search(p.get("summaryPl") or ""))


def usable(p: dict, since_year: int = 2018) -> bool:
    started = (p.get("dateStarted") or "0")[:4]
    return (bool(p.get("summaryPl")) and len(p["summaryPl"]) > 300 and started.isdigit() and int(started) >= since_year
            and not commissioned(p))


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
    return f"{BROWSER}#uid={p['uid']}"


def known_urls(p: dict) -> tuple[str, str]:
    """The record's URL now and in the old form, for the known-card and skip checks."""
    return record_url(p), f"{LEGACY}{p['uid']}"


def collect_project(p: dict, retrieved_at: str) -> dict:
    text = record_text(p)
    url = record_url(p)
    name = f"RAD-on (OPI PIB), projekt badawczy: {(p.get('titlePl') or '')[:100]}"
    hint = ("This is a research project record from RAD-on, the Polish science ministry's open data API. "
            "A research project is usually at concept or prototype level unless the record says the result is used.")
    x = extract(text, url=url, source_name=name, hint=hint)
    if not x.is_innovation:
        raise NotAnInnovation(x.rejection_reason)
    card = build_card(x, text=text, url=url, source_name=name, source_type="api", retrieved_at=retrieved_at, license=LICENSE)
    return with_project_dates(card, p, url, retrieved_at)


def with_project_dates(card: dict, p: dict, url: str, retrieved_at: str) -> dict:
    """Old projects must not look current (#22): the dates go into the summary and into evidence rows from the record."""
    start, end = _date(p.get("dateStarted")), _date(p.get("dateCompleted"))
    if start and end:
        card["summary"]["pl"] += f" Projekt realizowano od {start:%d.%m.%Y} do {end:%d.%m.%Y}."
        card["summary"]["en"] += f" The project ran from {start:%d.%m.%Y} to {end:%d.%m.%Y}."
    for metric, value, pl, en in (("project_start_date", start, "Początek projektu", "Project start"),
                                  ("project_end_date", end, "Koniec projektu", "Project end")):
        if value:
            card["evidence"].append({"id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"{url}#{metric}")),
                                     "metric": metric, "label": {"pl": pl, "en": en}, "value": value.isoformat(), "unit": None,
                                     "sourceId": card["sources"][0]["id"], "retrievedAt": retrieved_at,
                                     "query": f"Read from the RAD-on record {url}: field {'dateStarted' if metric.endswith('start_date') else 'dateCompleted'}"})
    if card["owner"]["url"] == url:
        card["owner"]["url"] = PORTAL
    return card
