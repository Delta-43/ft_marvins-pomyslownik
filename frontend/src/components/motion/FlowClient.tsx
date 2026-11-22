"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { authenticate } from "@/app/actions/auth";
import { T } from "@/components/motion/Motion";

/** With JavaScript, the two forms that move the reader between screens navigate in place, so the move can play:
 *  - the search bar: search → results with the bar gliding to the top (a new search from the results just loads);
 *  - the sign-in card: the button says it is working, then the app window sweeps open over the hero.
 *  Without JavaScript both are ordinary forms. */
export function FlowClient({ busyLabel }: { busyLabel?: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams().toString();
  // The search has arrived: clear its busy state.
  useEffect(() => {
    document.querySelectorAll(".search-form[aria-busy]").forEach((f) => f.removeAttribute("aria-busy"));
    document.querySelector(".results-area")?.removeAttribute("data-busy");
  }, [path, sp]);
  useEffect(() => {
    const onSubmit = async (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.matches(".search-form")) {
        e.preventDefault();
        const q = (new FormData(form).get("q") as string | null)?.trim() ?? "";
        // Start from the top ourselves; the router's own scroll would push the nav card off screen.
        window.scrollTo({ top: 0, behavior: "instant" });
        form.setAttribute("aria-busy", "true");
        document.querySelector(".results-area")?.setAttribute("data-busy", "");
        router.push(q ? `/wyniki?q=${encodeURIComponent(q)}` : "/wyniki", { scroll: false, transitionTypes: path === "/szukaj" ? [T.search] : undefined });
        return;
      }
      if (!form.matches("[data-signin]")) return;
      if (form.dataset.busy) { e.preventDefault(); return; }
      const submitter = e.submitter as HTMLButtonElement | null;
      const data = new FormData(form, submitter);
      if (data.get("mode") !== "demo" && ((data.get("providerSubject") as string | null) ?? "").trim().length < 3) return; // the server shows the field error
      e.preventDefault();
      form.dataset.busy = "";
      const html = submitter?.innerHTML ?? "";
      if (submitter) submitter.style.minWidth = `${submitter.offsetWidth}px`;
      const buttons = [...form.querySelectorAll<HTMLButtonElement>("button[type=submit]")];
      const live = document.getElementById("loginStatus");
      buttons.forEach((b) => b.setAttribute("aria-disabled", "true"));
      submitter?.setAttribute("aria-busy", "true");
      if (submitter && busyLabel) { submitter.innerHTML = '<span class="spin" aria-hidden="true"></span>'; submitter.append(busyLabel); if (live) live.textContent = busyLabel; }
      const restore = () => { submitter?.removeAttribute("aria-busy"); buttons.forEach((b) => b.removeAttribute("aria-disabled")); if (submitter) { submitter.innerHTML = html; submitter.style.minWidth = ""; } if (live) live.textContent = ""; delete form.dataset.busy; };
      const fail = (code: string) => {
        restore();
        const url = `/?blad=${encodeURIComponent(code)}&id=${encodeURIComponent((data.get("providerSubject") as string | null) ?? "")}`;
        // The same failure twice gives the same address; a plain assign would then not reload the page.
        if (location.pathname + location.search === url) location.reload(); else location.assign(`${url}#logowanie`);
      };
      try {
        const r = await authenticate(data);
        if ("error" in r) return fail(r.error);
        if (!r.opening) { window.location.assign(r.next); return; }
        window.scrollTo({ top: 0, behavior: "instant" });
        // The window opens from the hero's inner edge: its right edge side by side, its bottom edge when stacked.
        const hero = document.querySelector(".hero")?.getBoundingClientRect();
        if (hero) document.documentElement.style.setProperty("--sweep-from", hero.width > innerWidth * 0.9 ? `inset(${Math.max(0, Math.round(hero.bottom))}px 0 0 0)` : `inset(0 0 0 ${Math.round(hero.right)}px)`);
        router.push(r.next, { scroll: false, transitionTypes: [T.opening] });
        window.setTimeout(() => document.documentElement.style.removeProperty("--sweep-from"), 1500);
      } catch {
        fail("unavailable");
      }
    };
    // Capture phase: this runs before React's own form handling, which then sees the event as handled.
    document.addEventListener("submit", onSubmit, true);
    return () => document.removeEventListener("submit", onSubmit, true);
  }, [router, path, busyLabel]);
  return null;
}
