"""AI extraction (tasks B6b, B6c). Claude reads the source text and proposes the card fields.

Rules that keep the fact/estimate line honest:
- The model returns a quoted passage for every field it says the source states. Code checks that the quote is
  an exact substring of the source text. If it is not, the field becomes an estimate.
- Numbers reach evidence rows only from quotes that are on the page and contain the number.
- Every text a person sees comes back in Polish and English.
"""
import re
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from ..config import settings

MODEL = "claude-opus-5-5"

Area = Literal["technological", "educational", "administrative"]
Level = Literal["concept", "prototype", "testing", "pilot", "in_practice"]
OrgType = Literal["university", "research_institute", "school", "local_government", "public_institution", "company",
                  "startup", "incubator", "investor", "individual", "other"]
Region = Literal["DS", "KP", "LU", "LB", "LD", "MA", "MZ", "OP", "PK", "PD", "PM", "SL", "SK", "WN", "WP", "ZP", "none"]


class NotAnInnovation(ValueError):
    """The model judged the source not to describe a solution (news, grant call, service catalogue). Skipped, not an error."""


class Bilingual(BaseModel):
    pl: str
    en: str


class Tag(BaseModel):
    slug: str = Field(description="lower-case-with-hyphens, English, for example soil-remediation")
    pl: str
    en: str


class Fact(BaseModel):
    metric: str = Field(description="snake_case machine name, for example gain_s_band")
    label: Bilingual = Field(description="Name of the measure in Polish and English")
    value: float
    unit: str = Field(description="Unit as written, or empty")
    quote: str = Field(description="The exact words from the source that state this number, copied character for character")


class Extraction(BaseModel):
    is_innovation: bool = Field(description="False for news without a solution, grant calls, job offers, or implausible claims")
    rejection_reason: str = Field(description="Why it is not an innovation card, in English, or empty")
    title: Bilingual
    summary_short: Bilingual = Field(description="One or two sentences")
    summary: Bilingual = Field(description="Three to five sentences. Say it was written by the model from the source.")
    area: Area
    organisation_name: str = Field(description="As written in the source")
    organisation_type: OrgType
    organisation_url: str = Field(description="Homepage given in the source, or empty")
    region: Region = Field(description="Voivodeship code only when the source names the place, else none")
    region_quote: str = Field(description="Exact words naming the place, or empty")
    implementation_level: Level
    implementation_quote: str = Field(description="Exact words that show the level, or empty if you inferred it")
    trl_applicable: bool = Field(description="True only for technological items")
    trl: int = Field(description="1 to 9, or 0 when not applicable or unknown")
    trl_quote: str = Field(description="Exact words that state the TRL, or empty if you inferred it")
    tags: list[Tag] = Field(description="Two to four topic tags")
    could_also_be_used_in: list[Bilingual] = Field(description="Up to three other sectors or institutions")
    oslo_new_or_improved: bool
    oslo_differs_significantly: bool
    oslo_available_or_in_use: bool
    oslo_note: Bilingual
    polish_patent_number: str = Field(description="A Polish patent or application number the source states, such as P.441974, or empty")
    polish_patent_quote: str = Field(description="Exact words with that number, or empty")
    key_quote: str = Field(description="One to three exact sentences from the source that best describe the solution")
    facts: list[Fact] = Field(description="Numbers the source itself states about the solution. Never compute or estimate a number.")


SYSTEM = """You turn one public web page or document about a Polish solution into an innovation card.
You never invent facts and never produce a number that the source does not state. Every *_quote field must be
copied character for character from the source text, or left empty. When you infer a value, leave its quote empty.
Write every text for people in natural Polish and natural English, never a mix. Keep names of places and
organisations as they are. Keep the card about organisations and solutions; do not name private persons."""


def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=settings.anthropic_api_key or None)


def extract(text: str, *, url: str, source_name: str, hint: str = "") -> Extraction:
    """One structured call. Raises RuntimeError on a refusal or a cut-off answer."""
    if len(text) > 1_200_000:
        raise ValueError(f"source text of {url} is too long ({len(text)} characters); split it first")
    prompt = f"Source: {source_name}\nURL: {url}\n{hint}\n\n<source_text>\n{text}\n</source_text>"
    # Server-side fallbacks: if a safety classifier declines, the API re-runs the request on a fallback model
    # inside the same call ("default" routes by refusal category). A refusal that survives the chain is an error.
    response = _client().beta.messages.parse(
        model=MODEL, max_tokens=16000, system=SYSTEM, output_config={"effort": "medium"},
        betas=["server-side-fallback-2026-07-01"], fallbacks="default",
        messages=[{"role": "user", "content": prompt}], output_format=Extraction)
    if response.stop_reason == "refusal":
        raise RuntimeError(f"model declined to extract {url}")
    if response.stop_reason == "max_tokens" or response.parsed_output is None:
        raise RuntimeError(f"extraction of {url} was cut off")
    return response.parsed_output


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s or "").strip()


def on_page(quote: str, text: str) -> bool:
    """True when a non-trivial quote appears in the source text (whitespace-insensitive)."""
    q = norm(quote)
    return len(q) >= 3 and q in norm(text)


def number_in(quote: str, value: float) -> bool:
    """True when the value is written in the quote (accepts 3.5 and 3,5, and whole numbers with spaces as separators)."""
    q = norm(quote).replace(" ", " ")
    found = {m.replace(" ", "").replace(",", ".") for m in re.findall(r"\d[\d ]*(?:[.,]\d+)?", q)}
    v = f"{value:f}".rstrip("0").rstrip(".")
    return v in {f.rstrip("0").rstrip(".") if "." in f else f for f in found}


# "The model proposes, the rules confirm" (PLAN.md section 4). A level counts as stated by the source only when the
# quoted words contain a word that signals that level. Otherwise the level stays an estimate.
LEVEL_WORDS = {
    "concept": r"koncepc|pomys|założe|concept|idea",
    "prototype": r"prototyp|demonstrator|model funkcjonaln|wykonano|zbudowan|prototype|built",
    "testing": r"\btest|testow|walidac|weryfikac|badania? (?:w warunkach|terenow|pilota)|validat|tested",
    "pilot": r"pilota|pilot",
    "in_practice": r"wdroż|wdroz|stosowan|używa|uzywa|działa|funkcjonuje|w użyciu|eksploatac|uruchomi|dostępn|korzysta|in use|deployed|operat|launched|available",
}


def level_supported(level: str, quote: str) -> bool:
    return bool(re.search(LEVEL_WORDS[level], norm(quote).lower()))
