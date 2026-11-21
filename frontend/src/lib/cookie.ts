/** Name of the httpOnly cookie that holds the API session token. Shared by proxy.ts and the server code. */
export const SESSION_COOKIE = "pomyslownik_session";
/** Marks a session started with the one-click demo button. Only drives the "Tryb demo" badge; the real session is SESSION_COOKIE. */
export const DEMO_COOKIE = "pomyslownik_demo";
