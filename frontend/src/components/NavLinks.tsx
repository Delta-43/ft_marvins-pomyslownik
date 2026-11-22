"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Main navigation links. Client-side only to mark the current page with `aria-current`. */
export function NavLinks({ items }: { items: { href: string; label: string; match: string[]; types?: string[] }[] }) {
  const path = usePathname();
  return (
    <ul className="navlinks" role="list">
      {items.map((it) => (
        <li key={it.href}>
          <Link href={it.href} className="navlink" transitionTypes={it.types} aria-current={it.match.some((m) => path === m || path.startsWith(m + "/")) ? "page" : undefined}>{it.label}</Link>
        </li>
      ))}
    </ul>
  );
}
