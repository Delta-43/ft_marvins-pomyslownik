"""Task B5. Reject model-written text that contains a number not present in the evidence rows."""
import re

NUMBER = re.compile(r"\d+(?:[.,]\d+)?")


def numbers_in(text: str) -> set[str]:
    return {m.replace(",", ".") for m in NUMBER.findall(text)}


def only_evidence_numbers(text: str, evidence_values: list[float | int | str]) -> bool:
    allowed = {str(v).replace(",", ".") for v in evidence_values}
    return numbers_in(text) <= allowed
