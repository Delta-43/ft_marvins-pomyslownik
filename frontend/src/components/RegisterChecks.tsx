"use client";

import { useEffect } from "react";

/** Field id → the error message key the check gives (same keys and texts as the server, lib/draft.ts). */
type Msg = Record<"errId" | "errRequired" | "errEmail" | "errChoice" | "errTerms", string>;

/** The same e-mail rule as the API and the server action (`^[^@\s]+@[^@\s]+\.[^@\s]+$`). */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Checks the registration card before it is sent: required fields and the e-mail format, with the same inline
 *  errors the server renders (`p.err#<field>Err` under each field, `aria-invalid`, `aria-describedby`), then focuses
 *  the first invalid field. It never blocks typing or paste: it runs only on submit. Without JavaScript the server
 *  action runs the same checks. */
export function RegisterChecks({ formId, messages }: { formId: string; messages: Msg }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const value = (name: string) => ((form.elements.namedItem(name) as HTMLInputElement | null)?.value ?? "").trim();
    const onSubmit = (e: SubmitEvent) => {
      const errs: [string, keyof Msg | null][] = [
        ["providerSubject", value("providerSubject").length < 3 ? "errId" : null],
        ["email", !value("email") ? "errRequired" : !EMAIL_RE.test(value("email")) ? "errEmail" : null],
        ["role", !value("role") ? "errChoice" : null],
        ["affiliationName", !value("affiliationName") ? "errRequired" : null],
        ["acceptedTerms", (form.elements.namedItem("acceptedTerms") as HTMLInputElement | null)?.checked ? null : "errTerms"],
      ];
      let first: HTMLElement | null = null;
      for (const [id, key] of errs) {
        const input = document.getElementById(id);
        const slot = document.getElementById(`${id}Err`);
        if (!input || !slot) continue;
        const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter((x) => x && x !== slot.id);
        if (key) {
          const span = slot.querySelector("span");
          if (span) span.textContent = messages[key];
          slot.hidden = false;
          input.setAttribute("aria-invalid", "true");
          input.setAttribute("aria-describedby", [...ids, slot.id].join(" "));
          first ??= input;
        } else {
          slot.hidden = true;
          input.removeAttribute("aria-invalid");
          if (ids.length) input.setAttribute("aria-describedby", ids.join(" ")); else input.removeAttribute("aria-describedby");
        }
      }
      if (first) {
        e.preventDefault();
        e.stopPropagation();
        first.focus();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId, messages]);
  return null;
}
