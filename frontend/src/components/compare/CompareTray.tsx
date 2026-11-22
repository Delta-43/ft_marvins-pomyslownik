"use client";

/** Header link to the comparison (F4): "Compare (3)". Shown once at least one card is chosen, on every app page.
 *  The count is also written out for screen readers ("3 cards chosen"). */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { compareHref, useCompareSelection, useHydrated } from "@/lib/compare-store";

export function CompareTray({ label, countLabel }: { label: string; countLabel: string }) {
  const hydrated = useHydrated();
  const selection = useCompareSelection();
  const pathname = usePathname();
  if (!hydrated || selection.length === 0) return null;

  const onComparePage = pathname === "/porownaj";
  return (
    <li>
      <Link
        href={compareHref(selection)}
        aria-current={onComparePage ? "page" : undefined}
        className="inline-flex items-center gap-1.5"
      >
        {label}
        <span aria-hidden="true" className="font-tech grid h-5 min-w-5 place-items-center rounded-full bg-granat px-1 text-xs font-semibold text-papier tabular-nums">
          {selection.length}
        </span>
        <span className="sr-only">{countLabel.replace("{count}", String(selection.length))}</span>
      </Link>
    </li>
  );
}
