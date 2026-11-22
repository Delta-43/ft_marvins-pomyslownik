"use client";

/** Remembers the results the reader came from, so "← Wyniki" on a card goes back to the same list (same query,
 *  filters and page) and the card can shrink back into its place. Kept in sessionStorage: this tab only. */
import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { T } from "@/components/motion/Motion";

const KEY = "pomyslownik:results";

export function RememberResults() {
  useEffect(() => {
    try { sessionStorage.setItem(KEY, location.pathname + location.search); } catch {}
  }, []);
  return null;
}

const subscribe = () => () => {};
const read = () => { try { return sessionStorage.getItem(KEY) ?? "/wyniki"; } catch { return "/wyniki"; } };

export function BackToResults({ children, className }: { children: React.ReactNode; className?: string }) {
  const href = useSyncExternalStore(subscribe, read, () => "/wyniki");
  return <Link href={href} transitionTypes={[T.back]} className={className}>{children}</Link>;
}
