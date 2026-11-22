"""Language rule: the site is 100% Polish or 100% English. Every text a person sees needs both languages.

Source passages are the one exception. They are quotes, shown in the source's own language (passageLang).
"""
import re

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


MARKUP = re.compile(r"<[a-zA-Z/!]")


def _texts(card: dict):
    """Every person-facing text of a card, as (field, text) pairs."""
    for key in ("title", "summaryShort", "summary"):
        for lang, t in (card.get(key) or {}).items():
            yield f"{key}.{lang}", t
    for t in card.get("tags", []):
        for lang, v in (t.get("label") or {}).items():
            yield f"tags.{t.get('slug')}.{lang}", v
    for x in card.get("couldAlsoBeUsedIn", []):
        for lang, v in x.items():
            yield f"couldAlsoBeUsedIn.{lang}", v
    for lang, v in ((card.get("oslo") or {}).get("note") or {}).items():
        yield f"oslo.note.{lang}", v


def consistency_problems(card: dict) -> list[str]:
    """Rules a card must follow besides the language rule."""
    out: list[str] = []
    # G3: a link a person can follow is http(s) only, never javascript: or data:
    links = [("organisation.url", (card.get("organisation") or {}).get("url")), ("owner.url", (card.get("owner") or {}).get("url"))]
    links += [(f"sources.{s.get('id')}.url", s.get("url")) for s in card.get("sources", [])]
    out += [f"{name} must be an http(s) link" for name, url in links if url and not re.match(r"^https?://", url)]
    # G4: plain text only; the frontend renders text, never HTML
    out += [f"{name} contains markup" for name, t in _texts(card) if isinstance(t, str) and MARKUP.search(t)]
    o = card.get("oslo") or {}
    if o and bool(o.get("passed")) != bool(o.get("newOrImproved") and o.get("differsSignificantly") and o.get("availableOrInUse")):
        out.append("oslo.passed must be true exactly when all three Oslo conditions are true")
    status = card.get("polishIpStatus", "unknown")
    if status not in ("confirmed", "stated", "unknown"):
        out.append("polishIpStatus must be confirmed, stated or unknown")
    if bool(card.get("polishIp")) != (status == "confirmed"):
        out.append("polishIp must be true exactly when polishIpStatus is confirmed")
    for key in ("implementationLevelDetail", "trlDetail"):
        p = card.get(key) or {}
        if p.get("basis") == "confirmed" and not p.get("sourceIds"):
            out.append(f"{key} is confirmed but names no source")
        if p.get("basis") == "estimate" and not p.get("method"):
            out.append(f"{key} is an estimate without a method")
    return out


def sentence_case(text: str) -> str:
    """Tag labels start with a capital letter in both languages ("Odmulanie zbiorników", "E-administracja")."""
    t = (text or "").strip()
    return t[:1].upper() + t[1:] if t else t


# Units as the sources write them, with names in both languages. Symbols (%, dB, kg) are the same in both.
UNITS = {
    "ankiet": ("ankiet", "surveys"), "ankiety": ("ankiety", "surveys"), "osób": ("osób", "people"), "osoby": ("osoby", "people"),
    "szkół": ("szkół", "schools"), "szkoły": ("szkoły", "schools"), "szkoły podstawowe": ("szkoły podstawowe", "primary schools"),
    "uczniów": ("uczniów", "pupils"), "seniorów": ("seniorów", "seniors"), "warsztatów": ("warsztatów", "workshops"),
    "rozmów": ("rozmów", "calls"), "dni": ("dni", "days"), "lat": ("lat", "years"), "godzin": ("godzin", "hours"), "tys.": ("tys.", "thousand"),
    "mln": ("mln", "million"), "mln zł": ("mln zł", "PLN million"), "zł": ("zł", "PLN"), "PLN": ("zł", "PLN"), "tys. zł": ("tys. zł", "PLN thousand"),
    "works": ("prac", "works"), "count": ("szt.", "items"), "people": ("osób", "people"), "schools": ("szkół", "schools"),
    "pupils": ("uczniów", "pupils"), "TRL": ("TRL", "TRL"),
}


def unit_label(unit: str | None) -> dict | None:
    if not unit:
        return None
    pl, en = UNITS.get(unit.strip(), UNITS.get(unit.strip().lower(), (unit.strip(), unit.strip())))
    return {"pl": pl, "en": en}


# Source names start with a fixed prefix that we wrote; the rest is the source's own title (kept as written, like a quote).
SOURCE_PREFIXES = [
    ("Platforma Transferu Technologii (ARP): ", "Platforma Transferu Technologii (ARP): ", "Technology Transfer Platform (ARP): "),
    ("Dokument PDF: ", "Dokument PDF: ", "PDF document: "),
    ("Urząd Patentowy RP, rejestr (sprawdzone ręcznie): ", "Urząd Patentowy RP, rejestr (sprawdzone ręcznie): ",
     "Patent Office of Poland, register (checked by hand): "),
    ("NASK PIB, aktualności: ", "NASK PIB, aktualności: ", "NASK PIB, news: "),
    ("Google Patents (dane UPRP): ", "Google Patents (dane UPRP): ", "Google Patents (Polish Patent Office data): "),
    ("RAD-on (OPI PIB), projekt badawczy: ", "RAD-on (OPI PIB), projekt badawczy: ", "RAD-on (OPI PIB), research project: "),
    ("OpenAlex: wyszukiwanie podobnych prac / similar works search", "OpenAlex: wyszukiwanie podobnych prac", "OpenAlex: similar works search"),
]


def source_name_text(name: str) -> dict:
    for prefix, pl, en in SOURCE_PREFIXES:
        if name.startswith(prefix):
            rest = name[len(prefix):]
            return {"pl": pl + rest, "en": en + rest}
    return {"pl": name, "en": name}


LICENCES = {
    "CC0": ({"pl": "CC0 (domena publiczna)", "en": "CC0 (public domain)"}, "https://creativecommons.org/publicdomain/zero/1.0/"),
    "CC BY-SA 4.0": ({"pl": "CC BY-SA 4.0 (uznanie autorstwa, na tych samych warunkach)", "en": "CC BY-SA 4.0 (attribution, share-alike)"},
                     "https://creativecommons.org/licenses/by-sa/4.0/deed.pl"),
    "RAD-on open data (OPI PIB). Terms: radon.nauka.gov.pl": (
        {"pl": "Otwarte dane RAD-on (OPI PIB), warunki na stronie serwisu", "en": "RAD-on open data (OPI PIB), terms on the service's site"},
        "https://radon.nauka.gov.pl"),
}


def licence_label(licence: str | None) -> tuple[dict | None, str | None]:
    if not licence:
        return None, None
    label, url = LICENCES.get(licence, ({"pl": licence, "en": licence}, None))
    return label, url


def split_organisation(name: str) -> tuple[str, str | None]:
    """'Politechnika Koszalińska; Wydział Mechaniczny' -> ('Politechnika Koszalińska', 'Wydział Mechaniczny')."""
    head, _, rest = (name or "").partition(";")
    return head.strip(), (rest.strip() or None)


# Evidence queries (issue #18). The stored `query` is a technical English line; people see `queryText` in their language.
_QUERY_RULES = [
    (re.compile(r"^Scoring engine (v[\d.]+): computed from this card's stored data on (\d{4}-\d{2}-\d{2})$"),
     lambda m: ({"pl": f"Obliczone przez Pomysłownik (moduł oceny {m[1]}) z danych zapisanych na karcie, {m[2]}. To nie jest liczba ze źródła.",
                 "en": f"Computed by Pomysłownik (scoring engine {m[1]}) from the card's stored data on {m[2]}. Not a number from the source."})),
    (re.compile(r"^Read from (?:the page )?(\S+?)\.? Quoted text: (.+)$", re.DOTALL),
     lambda m: ({"pl": f"Odczytane ze źródła {m[1]}. Cytat: {m[2]}", "en": f"Read from {m[1]}. Quoted text: {m[2]}"})),
    (re.compile(r"^GET (\S+) \(meta\.count\)$"),
     lambda m: ({"pl": f"Liczba wyników zapytania do OpenAlex: {m[1]}", "en": f"Result count of the OpenAlex query: {m[1]}"})),
    (re.compile(r"^Read from the RAD-on record (\S+): field (\w+)$"),
     lambda m: ({"pl": f"Odczytane z rekordu RAD-on {m[1]}, pole {m[2]}", "en": f"Read from the RAD-on record {m[1]}, field {m[2]}"})),
]


def evidence_origin(query: str) -> str:
    return "computed" if query.startswith("Scoring engine") else "source"


def query_text(query: str) -> dict:
    """The evidence query in Polish and English. Unknown forms (hand-written seed notes) are shown as written."""
    for rx, make in _QUERY_RULES:
        m = rx.match(query or "")
        if m:
            return make(m)
    return {"pl": query, "en": query}
