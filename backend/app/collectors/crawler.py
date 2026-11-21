"""Task B6b. Web crawler: robots check and Crawl-delay (fetch.py), stored snapshots, HTML to text, AI extraction.

First target: PTT, the technology transfer platform of ARP (ptt.arp.pl). robots.txt allows /bazy/ with Crawl-delay 5.
Generic pages (a school, council or university page) go through page_text().
"""
import re

from selectolax.lexbor import LexborHTMLParser as HTMLParser

from . import fetch
from .build import build_card
from .extract import NotAnInnovation, extract

PTT_SITEMAP = "http://ptt.arp.pl/sitemap.xml"


def page_text(html: bytes | str) -> str:
    tree = HTMLParser(html if isinstance(html, str) else html.decode("utf-8", "ignore"))
    for sel in ("script", "style", "noscript", "nav", "header", "footer", "form", "svg"):
        for n in tree.css(sel):
            n.decompose()
    root = tree.css_first("main") or tree.css_first("article") or tree.body
    text = root.text(separator="\n") if root else ""
    return re.sub(r"\n\s*\n+", "\n", re.sub(r"[ \t\xa0]+", " ", text)).strip()


def full_text(html: bytes | str) -> str:
    """Every visible text on the page (only scripts and styles removed). Used to verify quotes, where nothing may be missed."""
    tree = HTMLParser(html if isinstance(html, str) else html.decode("utf-8", "ignore"))
    for sel in ("script", "style", "noscript", "template"):
        for n in tree.css(sel):
            n.decompose()
    return (tree.body or tree.root).text(separator=" ") if (tree.body or tree.root) else ""


def ptt_listing_text(html: bytes) -> str:
    """The listing itself: from its title (after the contact form) to the 'back' link. Drops the glossaries."""
    text = page_text(html)
    start = text.find("WYŚLIJ")
    end = text.find("Wróć na stronę")
    return text[start + 6 if start >= 0 else 0: end if end > 0 else None].strip()


def ptt_listing_urls(offline: bool = False) -> list[str]:
    body, _ = fetch.get(PTT_SITEMAP, offline=offline)
    return [u for u in re.findall(r"<loc>([^<]+)</loc>", body.decode("utf-8", "ignore")) if "/bazy/" in u and not u.rstrip("/").endswith("/bazy")]


def ptt_owner_type(text: str) -> str | None:
    m = re.search(r"Typ podmiotu:\s*(.+)", text)
    return m.group(1).strip() if m else None


def collect_url(url: str, *, offline: bool = False, kind: str = "page", html: bytes | None = None, retrieved_at: str | None = None) -> dict:
    """Fetch one page (or use html already fetched) and turn it into a card. kind is 'ptt' or 'page'."""
    if html is None:
        html, meta = fetch.get(url, offline=offline)
    else:
        meta = {"retrieved_at": retrieved_at or fetch.now_iso()}
    text = ptt_listing_text(html) if kind == "ptt" else page_text(html)
    if len(text) < 200:
        raise ValueError(f"too little text on {url}")
    name = ("Platforma Transferu Technologii (ARP): " if kind == "ptt" else "") + (text.split("\n", 1)[0][:120])
    hint = "This is a listing on PTT, the technology transfer platform of the Polish Industrial Development Agency (ARP)." if kind == "ptt" else ""
    x = extract(text, url=url, source_name=name, hint=hint)
    if not x.is_innovation:
        raise NotAnInnovation(x.rejection_reason)
    return build_card(x, text=text, url=url, source_name=name, source_type="crawl", retrieved_at=meta["retrieved_at"])
