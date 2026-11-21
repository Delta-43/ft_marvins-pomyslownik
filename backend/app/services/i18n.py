"""Language rule: the site is 100% Polish or 100% English. Every text a person sees needs both languages.

Source passages are the one exception. They are quotes, shown in the source's own language (passageLang).
"""

REGIONS = {  # ISO 3166-2:PL
    "DS": ("Dolnośląskie", "Lower Silesian"), "KP": ("Kujawsko-pomorskie", "Kuyavian-Pomeranian"),
    "LU": ("Lubelskie", "Lublin"), "LB": ("Lubuskie", "Lubusz"), "LD": ("Łódzkie", "Łódź"),
    "MA": ("Małopolskie", "Lesser Poland"), "MZ": ("Mazowieckie", "Masovian"), "OP": ("Opolskie", "Opole"),
    "PK": ("Podkarpackie", "Subcarpathian"), "PD": ("Podlaskie", "Podlaskie"), "PM": ("Pomorskie", "Pomeranian"),
    "SL": ("Śląskie", "Silesian"), "SK": ("Świętokrzyskie", "Świętokrzyskie"), "WN": ("Warmińsko-mazurskie", "Warmian-Masurian"),
    "WP": ("Wielkopolskie", "Greater Poland"), "ZP": ("Zachodniopomorskie", "West Pomeranian"),
}


def region_label(code: str) -> dict:
    pl, en = REGIONS.get(code, (code, code))
    return {"pl": pl, "en": en}


def _both(value, where: str, out: list[str]) -> None:
    if not isinstance(value, dict) or not str(value.get("pl") or "").strip() or not str(value.get("en") or "").strip():
        out.append(where)


def problems(card: dict) -> list[str]:
    """Names of the fields that lack Polish or English. An empty list means the card follows the rule."""
    out: list[str] = []
    for key in ("title", "summaryShort", "summary"):
        _both(card.get(key), key, out)
    for t in card.get("tags", []):
        _both(t.get("label"), f"tags.{t.get('slug')}.label", out)
    for i, x in enumerate(card.get("couldAlsoBeUsedIn", [])):
        _both(x, f"couldAlsoBeUsedIn[{i}]", out)
    if card.get("oslo", {}).get("note") is not None:
        _both(card["oslo"]["note"], "oslo.note", out)
    provs = {"implementationLevelDetail": card.get("implementationLevelDetail", {}), "trlDetail": card.get("trlDetail", {})}
    provs.update({f"assessment.{k}": v for k, v in card.get("assessment", {}).items()})
    for name, p in provs.items():
        if p.get("method"):
            _both(p.get("methodText"), f"{name}.methodText", out)
        if p.get("explanation") is not None:
            _both(p["explanation"], f"{name}.explanation", out)
    for e in card.get("evidence", []):
        _both(e.get("label"), f"evidence.{e.get('metric')}.label", out)
    for s in card.get("sources", []):
        if s.get("passage") and s.get("passageLang") not in ("pl", "en"):
            out.append(f"sources.{s.get('name', '?')[:30]}.passageLang")
    return out


# Labels for fixed values. The frontend gets them from the API, so it never has to translate an id.
LABELS = {
    "technological": ("Technologiczne", "Technological"), "educational": ("Edukacyjne", "Educational"),
    "administrative": ("Administracyjne", "Administrative"),
    "concept": ("Koncepcja", "Concept"), "prototype": ("Prototyp", "Prototype"), "testing": ("Testy", "Testing"),
    "pilot": ("Pilotaż", "Pilot"), "in_practice": ("W praktyce", "In practice"),
}


def label(key: str) -> dict:
    pl, en = LABELS[key]
    return {"pl": pl, "en": en}


YES = {"pl": "tak", "en": "yes"}
NO = {"pl": "nie", "en": "no"}
NO_DATA = {"pl": "brak danych", "en": "not enough data"}
NOT_APPLICABLE = {"pl": "nie dotyczy", "en": "not applicable"}
