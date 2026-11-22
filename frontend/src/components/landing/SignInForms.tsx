"use client";

/** Sign-in on the landing page: the test identity and the one-click demo account.
 *
 *  Without JavaScript both forms post to their server actions, which redirect to the search.
 *  With JavaScript the submit is taken over: the action returns its result, the button shows "Sprawdzamy
 *  tożsamość…", a field error shows in place (nothing moves, focus returns to the field), and on success the
 *  page navigates with the "opening" transition type, which plays the opening move (globals.css "Motion"). */
import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, enterDemoMode, signIn } from "@/app/actions/auth";
import { T } from "@/components/motion/Motion";

export type SignInTexts = {
  idLabel: string;
  idHint: string;
  submit: string;
  busy: string;
  done: string;
  demo: string;
  demoNote: string;
  errorLead: string;
  errors: Record<string, string>;
};

const NEXT = "/szukaj";

export function SignInForms({ t, defaultId = "" }: { t: SignInTexts; defaultId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"id" | "demo" | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const errId = useId();

  const submit = async (e: React.FormEvent<HTMLFormElement>, mode: "id" | "demo") => {
    e.preventDefault();
    if (busy) return;
    const form = new FormData(e.currentTarget);
    if (mode === "id" && (form.get("providerSubject") as string).trim().length < 3) {
      setError(t.errors.validation_failed);
      input.current?.focus();
      return;
    }
    setError(null);
    setBusy(mode);
    setStatus(t.busy);
    let result: Awaited<ReturnType<typeof authenticate>>;
    try {
      result = await authenticate(form);
    } catch {
      result = { error: "unknown" };
    }
    if ("error" in result) {
      setBusy(null);
      setStatus("");
      setError(t.errors[result.error] ?? t.errors.unknown);
      if (mode === "id") input.current?.focus();
      return;
    }
    setStatus(t.done);
    router.push(result.next, { transitionTypes: [result.opening ? T.opening : "forward"] });
  };

  const field = `h-14 w-full rounded-xl border bg-white px-4 font-tech text-[1.0625rem] shadow-inner outline-none transition-[border-color,box-shadow] duration-150 focus:border-granat focus:shadow-[0_0_0_3px_rgb(0_133_204/0.25)] ${
    error ? "border-2 border-nie" : "border-[1.5px] border-kamien"
  }`;

  return (
    <div className="flex flex-col gap-5">
      <form action={signIn} onSubmit={(e) => submit(e, "id")} noValidate className="flex flex-col gap-3">
        <input type="hidden" name="next" value={NEXT} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="landing-id" className="font-bold">{t.idLabel}</label>
          <input
            ref={input}
            id="landing-id"
            name="providerSubject"
            defaultValue={defaultId}
            autoComplete="username"
            required
            minLength={3}
            maxLength={200}
            aria-describedby={error ? `${hintId} ${errId}` : hintId}
            aria-invalid={error ? true : undefined}
            className={field}
          />
          <p id={hintId} className="m-0 text-[0.9375rem] text-kamien">{t.idHint}</p>
          {error && (
            <p id={errId} className="m-0 flex items-start gap-2 text-[0.9375rem] font-bold text-nie">
              <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="mt-0.5 flex-none">
                <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10 5.5v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><circle cx="10" cy="14.2" r="1.2" fill="currentColor" />
              </svg>
              <span>{t.errorLead} {error}</span>
            </p>
          )}
        </div>
        <button
          id="sandbox-btn"
          type="submit"
          aria-disabled={busy ? true : undefined}
          className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-granat px-6 text-[1.125rem] font-bold text-papier transition-[background-color,transform] duration-150 hover:bg-[#006BA3] active:scale-[0.985] aria-disabled:cursor-progress sm:min-h-16"
        >
          {busy === "id" ? (
            <>
              <span aria-hidden="true" className="spin" />
              {t.busy}
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="flex-none">
                <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.9-3.8 3.6-5.8 7-5.8s6.1 2 7 5.8" /></g>
              </svg>
              {t.submit}
            </>
          )}
        </button>
      </form>

      <form action={enterDemoMode} onSubmit={(e) => submit(e, "demo")} className="flex flex-col gap-2">
        <input type="hidden" name="next" value={NEXT} />
        <input type="hidden" name="mode" value="demo" />
        <button
          type="submit"
          aria-disabled={busy ? true : undefined}
          className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-atrament bg-white px-6 text-[1.0625rem] font-bold text-atrament transition-[background-color,transform] duration-150 hover:bg-papier active:scale-[0.985] aria-disabled:cursor-progress"
        >
          {busy === "demo" ? <><span aria-hidden="true" className="spin" />{t.busy}</> : t.demo}
        </button>
        <p className="m-0 text-center text-[0.9375rem] text-kamien">{t.demoNote}</p>
      </form>

      <p role="status" aria-live="polite" className={status === t.done ? "m-0 rounded-2xl border-[1.5px] border-tak bg-[#EDF5EF] px-4 py-3 font-bold" : "sr-only"}>
        {status}
      </p>
    </div>
  );
}
