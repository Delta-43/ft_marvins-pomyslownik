/** Motion helpers for the one flow of the app: landing → opening → search → results → card, and back.
 *
 *  How it works. Every navigation carries a transition type (Link `transitionTypes`, or `router.push(...,
 *  { transitionTypes })`). React starts a browser view transition for the page change and hands it the type, and
 *  the CSS in globals.css ("Motion") picks the move for each piece with `:active-view-transition-type(...)`.
 *  Pieces are named with plain `view-transition-name` styles (not React <ViewTransition> boundaries): the browser
 *  captures every named element in the old and the new page by itself, which stays reliable under Next's
 *  streamed route segments. A name present on both pages makes one object that moves (the logo, the search bar,
 *  a card); a name present on one page only fades, rises or sinks according to the type.
 *
 *    opening   landing → search (sign-in)        closing    search → landing (the logo in the header)
 *    search    search → results (the search bar) to-search  results → search ("Szukaj" in the header)
 *    open-card results → card                    nav-back   card → results ("← Wyniki")
 *    filter    results → results (filters, sort, paging, a new search from the results)
 *
 *  Only <AppPage> is a React boundary: it makes sure a view transition starts for every page change. */
import { ViewTransition } from "react";

export const T = {
  opening: "opening",
  closing: "closing",
  search: "search",
  toSearch: "to-search",
  openCard: "open-card",
  back: "nav-back",
  filter: "filter",
} as const;

/** Inline style that names an element for the view transition, with optional classes for the CSS. */
export function vt(name: string, className?: string): React.CSSProperties {
  return { viewTransitionName: name, viewTransitionClass: className } as React.CSSProperties;
}

/** The body of an app page (search, results, card). On the opening it sweeps in over the landing hero as the
 *  "window" of the app; when the header logo closes it, the window slides shut again. Full width, so the sweep
 *  covers the hero. The boundary takes part in every page change, so a transition always starts. */
export function AppPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    // The outer boundary only makes React start a transition when the page changes in place (filters, paging);
    // the inner, plainly named div is what the CSS moves.
    <ViewTransition enter="page-boundary" exit="page-boundary" update="page-boundary" default="page-boundary">
      {/* scroll-mt: when Next scrolls a new page into view, its top stays clear of the sticky header. */}
      <div className="w-full scroll-mt-20">
        <div style={vt("app-page")} className={`w-full ${className}`}>{children}</div>
      </div>
    </ViewTransition>
  );
}

/** Makes sure a view transition starts when a screen is entered or left: React starts one only when a boundary of
 *  its own takes part in the commit, and Next's route segments keep page boundaries out of reach for the first
 *  commit of a new layout. One in the app layout and one on the landing page cover the opening and the closing.
 *  The element is a pixel in the corner: nothing to see, nothing to click. */
export function TransitionTrigger() {
  return (
    <ViewTransition enter="trigger" exit="trigger" default="none">
      <div aria-hidden="true" className="pointer-events-none fixed top-0 left-0 h-px w-px opacity-0" />
    </ViewTransition>
  );
}

/** A piece of a page (a block of content). `name` must be unique on its page; `i` (1–8) sets the stagger.
 *  New pieces rise in order, old pieces sink or fade, and a piece that stays keeps its place. */
export function Piece({ name, i, id, className, children }: { name: string; i: number; id?: string; className?: string; children: React.ReactNode }) {
  return (
    <div id={id} style={vt(`piece-${name}`, `piece piece-${Math.min(Math.max(i, 1), 8)}`)} className={className}>
      {children}
    </div>
  );
}

/** Style for a card: the same name on the results tile and on the card page header, so one grows into the other.
 *  `i` staggers the tiles when a list arrives. */
export const cardStyle = (id: string, i?: number) => vt(`karta-${id}`, i === undefined ? "card" : `card card-${Math.min(Math.max(i, 1), 8)}`);
