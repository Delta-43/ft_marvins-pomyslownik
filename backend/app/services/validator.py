"""Task B5. Reject model-written text that contains a number not present in the evidence rows."""
import re

NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def numbers_in(text: str) -> set[str]:
    return {m.replace(",", ".") for m in NUMBER.findall(text)}


def only_evidence_numbers(text: str, evidence_values: list[float | int | str]) -> bool:
    allowed = {str(v).replace(",", ".") for v in evidence_values}
    return numbers_in(text) <= allowed


def explanation_is_clean(explanation: dict | None, evidence_values: list, score: int | None) -> bool:
    """True when an explanation (pl and en) holds only numbers that are evidence values or the score itself.
    Counts such as '3 of 5' use values the engine stored, so 'of 5' and 'of 100' are allowed scale numbers."""
    if not explanation:
        return True
    allowed = list(evidence_values) + ([score] if score is not None else []) + [5, 100]
    return all(only_evidence_numbers(text, allowed) for text in explanation.values())
