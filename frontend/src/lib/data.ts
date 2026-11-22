/** Typed reads from the API for the server components. Every call is authenticated; a 401 ends the session
 *  (see `authed`). Text fields arrive in the site language (`Accept-Language`), or as the older language map,
 *  so always render them through `text()`. */
import { cache } from "react";
import { ApiError, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";
import { toApi, type State } from "@/lib/results-url";

export const PAGE_SIZE = 10;

export type CardSummary = Schemas["CardSummary"];
export type Card = Schemas["Card"];
export type FacetOption = Schemas["FacetOption"];
export type Facets = { area: FacetOption[]; implementationLevel: FacetOption[]; region: FacetOption[]; tag: FacetOption[] };
export type CompareRow = Schemas["CompareRow"];
export type Compare = { cards: CardSummary[]; rows: CompareRow[] };
export type Similar = { card: CardSummary; similarity: number };
export type HistoryEntry = Schemas["StatusChange"];
export type Source = Schemas["SourceSummary"];
export type Audience = Schemas["Audience"];
export type TagItem = Schemas["Tag"];
export type User = Schemas["User"];

/** A failed read that the page can show in place: what went wrong and the id to quote to support. */
export type Failure = { failed: true; status: number; code: string; requestId?: string };
export const isFailure = (v: unknown): v is Failure => !!v && typeof v === "object" && "failed" in v;

/** Run a read; turn an API error into a value the page renders (a 401 has already redirected inside `authed`). */
export async function attempt<T>(read: Promise<T>): Promise<T | Failure> {
  try {
    return await read;
  } catch (e) {
    if (e instanceof ApiError) return { failed: true, status: e.status, code: e.code, requestId: e.requestId };
    // Network failure: the backend did not answer at all.
    if (e instanceof TypeError) return { failed: true, status: 503, code: "unavailable" };
    throw e;
  }
}

export async function listCards(s: State, page: number, path: string) {
  const u = toApi(s);
  u.set("sort", s.sort ?? (s.q ? "relevance" : "recent"));
  u.set("limit", String(PAGE_SIZE));
  u.set("offset", String((page - 1) * PAGE_SIZE));
  return authed<{ data: CardSummary[]; meta: Schemas["PageMeta"] }>(`/api/v1/cards?${u}`, path);
}

export async function getFacets(s: State, path: string) {
  const q = toApi(s).toString();
  return (await authed<{ data: Facets }>(`/api/v1/facets${q ? `?${q}` : ""}`, path)).data;
}

export const getCard = cache(async (id: string, path: string) => (await authed<{ data: Card }>(`/api/v1/cards/${encodeURIComponent(id)}`, path)).data);

export async function getSimilar(id: string, path: string) {
  return (await authed<{ data: Similar[] }>(`/api/v1/cards/${encodeURIComponent(id)}/similar?limit=3`, path)).data;
}

export async function getCompare(ids: string[], path: string) {
  return (await authed<{ data: Compare }>(`/api/v1/compare?ids=${ids.map(encodeURIComponent).join(",")}`, path)).data;
}

export async function getHistory(id: string, path: string) {
  return (await authed<{ data: HistoryEntry[] }>(`/api/v1/cards/${encodeURIComponent(id)}/history`, path)).data;
}

export const getAudiences = cache(async (path: string) => (await authed<{ data: Audience[] }>("/api/v1/audiences", path)).data);

export async function getLatestTags(path: string) {
  return (await authed<{ data: TagItem[] }>("/api/v1/tags?sort=recent&limit=6", path)).data;
}

export async function getSources(path: string) {
  return authed<{ data: Source[]; meta: Schemas["PageMeta"] }>("/api/v1/sources?limit=100", path);
}

export const getMe = cache(async (path: string) => (await authed<{ data: User }>("/api/v1/me", path)).data);
