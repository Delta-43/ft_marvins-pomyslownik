"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Filters apply at once when JavaScript runs: a change in the filter form (or in the sort select tied to it) moves to
 *  the new URL without a full page load, so the changed control keeps focus and the phone sheet stays open. Selects
 *  wait 400 ms, because a closed select fires `change` on every arrow key. Without JavaScript the submit buttons in
 *  the form do the same with a normal GET. */
export function FilterAuto({ formId }: { formId: string }) {
  const router = useRouter();
  const sp = useSearchParams().toString();
  const [pending, start] = useTransition();
  const waiting = useRef(false); // a select change is waiting out its 400 ms
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    form.dataset.js = "";
    let timer = 0;
    waiting.current = false;
    const go = (keepSheet: boolean) => {
      const u = new URLSearchParams();
      new FormData(form).forEach((v, k) => { if (typeof v === "string" && v) u.append(k, v); });
      if (keepSheet && form.closest('[data-sheet="open"]')) u.set("filtry", "1");
      start(() => router.replace(`/wyniki?${u}`, { scroll: false }));
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLSelectElement;
      if (el.form !== form) return;
      window.clearTimeout(timer);
      waiting.current = true;
      timer = window.setTimeout(() => { waiting.current = false; go(true); }, el instanceof HTMLSelectElement ? 400 : 0);
    };
    // "Pokaż wyniki" / "Filtruj": apply and close the sheet.
    const onSubmit = (e: Event) => { e.preventDefault(); form.closest(".results-area")?.removeAttribute("data-sheet"); window.clearTimeout(timer); go(false); };
    // Pager, removable chips and "Wyczyść filtry" are links: navigate them in the same transition so the list dips too.
    const onLink = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>(".active-chips a, .pager a, .fhead a.btn-text") : null;
      if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const href = a.getAttribute("href");
      if (href) start(() => router.push(href, { scroll: !!a.closest(".pager") }));
    };
    document.addEventListener("click", onLink, true);
    document.addEventListener("change", onChange);
    form.addEventListener("submit", onSubmit);
    return () => { window.clearTimeout(timer); document.removeEventListener("click", onLink, true); document.removeEventListener("change", onChange); form.removeEventListener("submit", onSubmit); };
  }, [formId, router]);
  // The list dips while the server answers.
  useEffect(() => { document.getElementById(formId)?.closest(".results-area")?.toggleAttribute("data-busy", pending); }, [formId, pending]);
  // Inputs the reader touched ignore new default values; a reset re-syncs them with the URL after "Wyczyść filtry" or
  // a removed chip, without moving focus.
  useEffect(() => { if (!waiting.current) (document.getElementById(formId) as HTMLFormElement | null)?.reset(); }, [formId, sp]);
  return null;
}
