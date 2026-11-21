/** Session cookie names, shared by proxy.ts, the layout and the auth server actions.
 *  SESSION_COOKIE: real session (task F11 sets it after /api/v1/auth/login, httpOnly).
 *  DEMO_COOKIE: TEMPORARY "demo mode" for building without a backend. Remove before release. */
export const SESSION_COOKIE = "pomyslownik_session";
export const DEMO_COOKIE = "pomyslownik_demo";

/** Routes that need a signed-in user (or demo mode). Card data never shows without one. */
export const PROTECTED_PATHS = ["/szukaj", "/wyniki"];
