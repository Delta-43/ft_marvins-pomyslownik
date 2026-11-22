/** Motion for the one flow of the app: landing → search → results → card, and back (DESIGN.md §7).
 *
 *  The browser's view transitions do the work. Pieces that move are named in CSS (`view-transition-name` in
 *  motion.css): the search bar and the logo are one object across screens; the open card grows from its tile.
 *  React starts a transition only when one of its <ViewTransition> boundaries enters or leaves, so every page renders
 *  a <PageMove /> marker: a one-pixel element inside a boundary. The boundary is neutral (class `vt-b`); the named
 *  pieces carry the motion. The marker is separate from the page's own elements on purpose: React writes its own
 *  transition name on a boundary's element, which would replace the names in motion.css. React also leaves the
 *  document root out of the new snapshot, so the two full-screen layers (`.landing`, `.shell`) are named too.
 *  A navigation can carry a type (Link `transitionTypes`, `router.push(url, { transitionTypes })`); the CSS picks the
 *  move with `:active-view-transition-type(...)`. Filter, sort and page changes start no transition. */
import { ViewTransition } from "react";

export const T = {
  /** landing → search, after sign-in: the app window sweeps open over the hero, the logo flies to the nav. */
  opening: "opening",
  /** search → results: the bar glides to the top, title and tags sink, filters and cards rise. */
  search: "search",
  /** results → search ("Szukaj" in the nav): the reverse. */
  toSearch: "to-search",
  /** results → card from a tile, and back with Esc or "Wróć": the measured grow and shrink. */
  cardOpen: "card-open",
  cardClose: "card-close",
} as const;

/** Marker for a page (or, with a `key`, for a branch of one): when it enters or leaves, a view transition starts. */
export function PageMove() {
  return <ViewTransition enter="vt-b" exit="vt-b" update="none" default="none"><span className="vt-pin" aria-hidden="true" /></ViewTransition>;
}
