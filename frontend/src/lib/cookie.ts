/** Name of the httpOnly cookie that holds the API session token. Shared by proxy.ts and the server code. */
export const SESSION_COOKIE = "pomyslownik_session";
/** Marks a session started with the one-click demo button. Only drives the "Tryb demo" badge; the real session is SESSION_COOKIE. */
export const DEMO_COOKIE = "pomyslownik_demo";
/** Set at registration to the chosen role. The search form then sends it as the audience of the first search, with
 *  FIRST_SEARCH_PARAM as a marker; proxy.ts deletes the cookie when that search arrives. */
export const FIRST_AUDIENCE_COOKIE = "pomyslownik_first_audience";
export const FIRST_SEARCH_PARAM = "pierwsze";
