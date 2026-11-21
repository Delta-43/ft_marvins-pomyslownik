"""Common shape for collectors (tasks B6a to B6c).

A collector turns one source into candidate items. Every extracted field keeps the quoted passage and the URL.
Respect robots.txt, rate limits and licences. Cache snapshots so the demo never depends on a live call.
"""
from dataclasses import dataclass, field


@dataclass
class SourceRef:
    url: str
    name: str
    type: str  # api | crawl | document
    passage: str | None = None
    license: str | None = None


@dataclass
class Candidate:
    title: str
    area: str  # technological | educational | administrative
    summary: str
    organisation: str
    sources: list[SourceRef] = field(default_factory=list)
    raw: dict = field(default_factory=dict)


class Collector:
    name = "base"

    def collect(self) -> list[Candidate]:
        raise NotImplementedError
