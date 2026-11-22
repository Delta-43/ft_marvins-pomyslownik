/** Results page URL (F2): parse and validate /wyniki search params, and build our URL and the API query from them.
 *  Shared by the page and proxy.ts (which redirects to the canonical URL before the page streams). No runtime imports,
 *  so it is safe in the proxy. */
import type { Schemas } from "@/lib/api";

export type Param = string | string[] | undefined;
export type Search = Record<string, Param>;

// Values the API accepts (type-checked against the contract). Anything else in our URL is dropped, so a stale or
// hand-edited link never turns into a 422 from the backend.
export const AREAS = ["technological", "educational", "administrative"] as const satisfies readonly Schemas["Area"][];
export const LEVELS = ["concept", "prototype", "testing", "pilot", "in_practice"] as const satisfies readonly Schemas["ImplementationLevel"][];
export const AUDIENCES = [
  "investors_business", "public_bodies", "universities", "schools", "startups_enterprises", "inventors",
] as const satisfies readonly Schemas["AudienceId"][];
// "unknown" is not offered as a filter: it means "no information", which nobody searches for.
export const PIP_STATUSES = ["confirmed", "stated"] as const satisfies readonly NonNullable<Schemas["CardSummary"]["polishIpStatus"]>[];
export const SORTS = ["relevance", "recent", "innovativeness", "applicationPotential", "credibility"] as const;
export type Sort = (typeof SORTS)[number];

/** Raw values of a param: repeated params (`area=a&area=b`, what an HTML form sends) and comma lists (`area=a,b`). */
const raw = (v: Param) => (Array.isArray(v) ? v : v ? [v] : []).flatMap((s) => s.split(",")).map((s) => s.trim()).filter(Boolean);
/** Allowed values only, without duplicates, in a stable order. */
const list = <T extends string>(v: Param, allowed: readonly T[]): T[] => allowed.filter((a) => raw(v).includes(a));
export const first = (v: Param) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
const trlParam = (v: Param) => {
  const n = Number(first(v));
  return Number.isInteger(n) && n >= 1 && n <= 9 ? n : undefined;
};

/** Everything the results page can filter or sort by, parsed and validated from our URL. */
export type State = {
  q: string;
  areas: Schemas["Area"][];
  levels: Schemas["ImplementationLevel"][];
  trlMin?: number;
  trlMax?: number;
  pip: (typeof PIP_STATUSES)[number][];
  region?: string;
  tags: string[];
  audience?: Schemas["AudienceId"];
  sort?: Sort;
};

export function parse(sp: Search): State {
  const q = (first(sp.q) ?? "").slice(0, 200);
  let trlMin = trlParam(sp.trlMin);
  let trlMax = trlParam(sp.trlMax);
  if (trlMin && trlMax && trlMin > trlMax) [trlMin, trlMax] = [trlMax, trlMin];
  const region = first(sp.region);
  const sort = list(sp.sort, SORTS)[0];
  return {
    q,
    areas: list(sp.area, AREAS),
    levels: list(sp.implementationLevel, LEVELS),
    trlMin,
    trlMax,
    pip: list(sp.polishIpStatus, PIP_STATUSES),
    region: region && /^[A-Z0-9]{1,10}$/.test(region) ? region : undefined,
    tags: [...new Set(raw(sp.tag).filter((s) => /^[a-z0-9][a-z0-9-]{0,63}$/.test(s)))].slice(0, 20),
    audience: list(sp.audience, AUDIENCES)[0],
    // "Relevance" only means something for a text search. The default sort (relevance with a search, otherwise
    // recent) is left out of the URL, so links stay short and the select's default isn't written into every link.
    sort: sort === "relevance" && !q ? undefined : sort === (q ? "relevance" : "recent") ? undefined : sort,
  };
}

/** Our own URL: repeated params, as the filter form submits them without JavaScript. */
export function toUrl(s: State): URLSearchParams {
  const u = new URLSearchParams();
  if (s.q) u.set("q", s.q);
  s.areas.forEach((v) => u.append("area", v));
  s.levels.forEach((v) => u.append("implementationLevel", v));
  if (s.trlMin) u.set("trlMin", String(s.trlMin));
  if (s.trlMax) u.set("trlMax", String(s.trlMax));
  s.pip.forEach((v) => u.append("polishIpStatus", v));
  if (s.region) u.set("region", s.region);
  s.tags.forEach((v) => u.append("tag", v));
  if (s.audience) u.set("audience", s.audience);
  if (s.sort) u.set("sort", s.sort);
  return u;
}

/** The same filters for the API (/cards and /facets). The contract uses comma-separated lists (explode: false); the
 *  backend reads a repeated param as its last value only, so lists must be joined here. /facets takes the same
 *  filters, so its counts match the results (the backend leaves out a facet's own filter when counting it). */
export function toApi(s: State): URLSearchParams {
  const u = new URLSearchParams();
  if (s.q) u.set("q", s.q);
  if (s.areas.length) u.set("area", s.areas.join(","));
  if (s.levels.length) u.set("implementationLevel", s.levels.join(","));
  if (s.trlMin) u.set("trlMin", String(s.trlMin));
  if (s.trlMax) u.set("trlMax", String(s.trlMax));
  if (s.pip.length) u.set("polishIpStatus", s.pip.join(","));
  if (s.region) u.set("region", s.region);
  if (s.tags.length) u.set("tag", s.tags.join(","));
  if (s.audience) u.set("audience", s.audience);
  return u;
}

/** Page number from `strona` (1 when missing or invalid). */
export const pageOf = (sp: Search) => Math.max(1, Math.floor(Number(first(sp.strona))) || 1);

/** Our URL for these results and page: `/wyniki?…` without empty, default or invalid params. */
export function resultsHref(s: State, page = 1): string {
  const u = toUrl(s);
  if (page > 1) u.set("strona", String(page));
  return u.toString() ? `/wyniki?${u}` : "/wyniki";
}

/** URLSearchParams (proxy) to the same shape Next.js gives the page as searchParams. */
export function toSearch(params: URLSearchParams): Search {
  const out: Search = {};
  for (const key of new Set(params.keys())) {
    const all = params.getAll(key);
    out[key] = all.length > 1 ? all : all[0];
  }
  return out;
}

/** The canonical URL when `params` differ from it (empty selects from a form submit, the default sort, invalid or
 *  unknown values), else null. Param order alone is not a difference, so there is never a redirect loop. */
export function canonicalResultsHref(params: URLSearchParams): string | null {
  const sp = toSearch(params);
  const href = resultsHref(parse(sp), pageOf(sp));
  const key = (u: URLSearchParams) => [...u].map(([k, v]) => `${k}=${v}`).sort().join("&");
  return key(params) === key(new URL(href, "http://x").searchParams) ? null : href;
}
