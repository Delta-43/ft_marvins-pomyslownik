"use client";

/** A GET form that, with JavaScript, navigates in the app instead of reloading the page, carrying a transition type
 *  so the results list dips while the filters, sort or page change. Without JavaScript it is the plain form it wraps. */
import { useRouter } from "next/navigation";
import { canonicalResultsHref } from "@/lib/results-url";

export function NavForm({ action, transitionTypes, children, ...rest }: React.ComponentProps<"form"> & { action: string; transitionTypes: string[] }) {
  const router = useRouter();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(e.currentTarget)) if (typeof v === "string" && v !== "") params.append(k, v);
    const raw = params.toString() ? `${action}?${params}` : action;
    // The same clean URL the proxy would redirect to, so the address bar never shows an empty select.
    const href = action === "/wyniki" ? (canonicalResultsHref(params) ?? raw) : raw;
    router.push(href, { transitionTypes });
  };
  return (
    <form action={action} onSubmit={onSubmit} {...rest}>
      {children}
    </form>
  );
}
