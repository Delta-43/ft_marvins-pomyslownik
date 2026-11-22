"""Task B16: the source registry. Owners add a source by editing data/sources/registry.json and .env, with no code change.

Format: data/sources/registry.example.json. Secrets never go in the registry: `tokenEnv` names the environment
variable that holds the token. The built-in sources (RAD-on, OpenAlex, PTT, pages, reports) keep their own collectors
and limits in targets.json; the registry adds generic ones:
- method "api":     GET baseUrl, take the items at `itemsPath`, map fields with `mapping` (a small JSONPath: $.a.b[0].c)
- method "feed":    RSS or Atom; every item link is read as a page
- method "sitemap": every <loc> is read as a page (optionally only URLs containing `filters.urlContains`)
- method "crawl":   the listed `urls` are read as pages
Every page and item goes through the same extraction, fact/estimate rule and robots.txt checks as the built-ins.
"""
import json
import os
import pathlib
import re

from .config import settings

BUILT_IN = {"radon", "openalex", "ptt", "school-and-council-pages", "reports", "gus-bdl"}
PROBLEMS = {
    "disabled": {"pl": "Źródło jest wyłączone w rejestrze.", "en": "The source is disabled in the registry."},
    "token": {"pl": "Brak tokenu: ustaw zmienną środowiskową wskazaną w tokenEnv.", "en": "Token missing: set the environment variable named in tokenEnv."},
    "robots": {"pl": "robots.txt nie pozwala nam czytać tej strony.", "en": "robots.txt does not allow us to read this site."},
    "mapping": {"pl": "Źródło API potrzebuje pól itemsPath i mapping (title, url).", "en": "An API source needs itemsPath and a mapping (title, url)."},
}


def path() -> pathlib.Path | None:
    root = pathlib.Path(settings.sources_dir)
    for name in ("registry.json", "registry.example.json"):
        if (root / name).exists():
            return root / name
    return None


def load() -> list[dict]:
    p = path()
    return json.loads(p.read_text(encoding="utf-8")).get("sources", []) if p else []


def token(name: str | None) -> str:
    """The token value, from the environment or from .env (via settings). Never logged, never returned by the API."""
    if not name:
        return ""
    return os.environ.get(name) or str(getattr(settings, name.lower(), "") or "")


def _probe_url(src: dict) -> str | None:
    if src.get("method") in ("crawl", "sitemap", "feed"):
        return src.get("baseUrl") or next(iter(src.get("urls") or []), None)
    return None


def robots_verdict(src: dict) -> str:
    url = _probe_url(src)
    if not url:
        return "not_applicable"
    try:
        from .collectors import fetch
        return "allowed" if fetch._robots_for(url).can_fetch(fetch.USER_AGENT, url) else "disallowed"
    except Exception:  # noqa: BLE001 - a readiness check must never fail the admin page
        return "not_checked"


def status(src: dict, *, check_robots: bool = True) -> dict:
    """SourceConfigStatus in the contract. `tokenPresent` says whether the variable is set; the value never leaves."""
    env = src.get("tokenEnv")
    optional = bool((src.get("auth") or {}).get("optional"))
    present = bool(token(env)) if env else None
    robots = robots_verdict(src) if check_robots else "not_checked"
    problem = None
    if not src.get("enabled"):
        problem = "disabled"
    elif env and not present and not optional:
        problem = "token"
    elif robots == "disallowed":
        problem = "robots"
    elif src.get("method") == "api" and src.get("id") not in BUILT_IN and not (src.get("itemsPath") and (src.get("mapping") or {}).get("url")):
        problem = "mapping"
    return {"id": src["id"], "name": src.get("name") or {"pl": src["id"], "en": src["id"]}, "method": src.get("method", "api"),
            "enabled": bool(src.get("enabled")), "tokenEnv": env, "tokenPresent": present, "robots": robots,
            "ready": problem is None, "problem": PROBLEMS.get(problem) if problem else None}


def jsonpath(obj, expr: str):
    """A small JSONPath: $.a.b, $.items[0].name. Returns None when a step is missing."""
    cur = obj
    for name, index in re.findall(r"\.?([^.\[\]]+)|\[(\d+)\]", (expr or "").removeprefix("$")):
        try:
            cur = cur[int(index)] if index else cur[name]
        except (KeyError, IndexError, TypeError):
            return None
    return cur


def _headers_and_url(src: dict) -> tuple[str, dict]:
    url, headers = src["baseUrl"], {}
    auth = src.get("auth") or {}
    value = token(src.get("tokenEnv"))
    if value and auth.get("in") == "header":
        headers[auth.get("name", "Authorization")] = f"{auth['scheme']} {value}" if auth.get("scheme") else value
    elif value and auth.get("in") == "query":
        url += ("&" if "?" in url else "?") + f"{auth.get('name', 'api_key')}={value}"
    return url, headers


def api_items(src: dict, *, offline: bool = False) -> list[dict]:
    """Items of a generic API source, each as {url, title, text}. The text holds only the mapped fields."""
    from .collectors import fetch
    url, headers = _headers_and_url(src)
    raw, _ = fetch.get(url, offline=offline, check_robots=False, headers=headers, cache_tag=f"registry:{src['id']}")
    items = jsonpath(json.loads(raw), src.get("itemsPath", "$")) or []
    out = []
    for item in items if isinstance(items, list) else []:
        fields = {k: jsonpath(item, p) for k, p in (src.get("mapping") or {}).items()}
        link = str(fields.get("url") or "")
        if not link.startswith("http") or not fields.get("title"):
            continue
        out.append({"url": link, "title": str(fields["title"]),
                    "text": "\n".join(f"{k}: {v}" for k, v in fields.items() if v not in (None, "", [], {}))})
    return out


def page_urls(src: dict, *, offline: bool = False) -> list[str]:
    """Links to read for feed, sitemap and crawl sources."""
    from .collectors import fetch
    if src.get("method") == "crawl":
        return [u for u in src.get("urls") or [] if u.startswith("http")]
    body, _ = fetch.get(src["baseUrl"], offline=offline)
    text = body.decode("utf-8", "ignore")
    if src.get("method") == "sitemap":
        urls = re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", text)
    else:  # RSS <link>…</link> or Atom <link href="…"/>
        urls = re.findall(r"<item\b.*?<link>\s*([^<\s]+)\s*</link>", text, re.DOTALL) or re.findall(r"<entry\b.*?<link[^>]*href=\"([^\"]+)\"", text, re.DOTALL)
    need = (src.get("filters") or {}).get("urlContains")
    return [u for u in urls if u.startswith("http") and (not need or need in u)]
