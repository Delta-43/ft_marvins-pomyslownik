import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LandingHero } from "@/components/landing/Hero";
import { TransitionTrigger } from "@/components/motion/Motion";
import { enterDemoMode, register, signIn } from "@/app/actions/auth";
import { api, errorKey, pick, type Schemas } from "@/lib/api";

const ORG_TYPES: Schemas["OrganisationType"][] = [
  "university", "research_institute", "school", "local_government", "public_institution", "company",
  "startup", "incubator", "investor", "individual", "other",
];
const INTERESTS = ["technological", "educational", "administrative"] as const;

// Same controls as the sign-in panel on the landing page (components/landing/SignInForms.tsx).
const field = "h-14 w-full rounded-xl border-[1.5px] border-kamien bg-white px-4 text-[1.0625rem] shadow-inner outline-none transition-[border-color,box-shadow] duration-150 focus:border-granat focus:shadow-[0_0_0_3px_rgb(0_133_204/0.25)]";
const primary = "flex min-h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-granat px-6 text-[1.125rem] font-bold text-papier transition-[background-color,transform] duration-150 hover:bg-[#006BA3] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-16";
const secondary = "flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-atrament bg-white px-6 text-[1.0625rem] font-bold text-atrament transition-[background-color,transform] duration-150 hover:bg-papier active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50";

type Params = { next?: string; tryb?: string; blad?: string; id?: string };

// Sign-in and registration with the sandbox provider ("test identity"). Public endpoints only (/auth/providers,
// /audiences). No card data here. Same screen as the top of the landing page (components/landing/Hero.tsx): the
// dark half on the left, the form on the right, so going from "Zarejestruj się" on "/" to here keeps the form in place.
export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { next = "/szukaj", tryb, blad, id = "" } = await searchParams;
  const mode = tryb === "rejestracja" ? "rejestracja" : "logowanie";
  const [t, tOrg, tInterest, tErr, locale] = await Promise.all([
    getTranslations("login"), getTranslations("orgType"), getTranslations("interest"), getTranslations("errors"), getLocale(),
  ]);

  const [providers, audiences] = await Promise.all([
    api<{ data: Schemas["AuthProvider"][] }>("/api/v1/auth/providers").then((r) => r.data).catch(() => null),
    api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => null),
  ]);
  const sandbox = providers?.find((p) => p.id === "sandbox_id" && p.enabled);
  const apiDown = !providers || !audiences;

  const tab = (m: string, label: string) => (
    <Link
      href={`/logowanie?tryb=${m}&next=${encodeURIComponent(next)}`}
      aria-current={mode === m ? "page" : undefined}
      className={`flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-center font-bold no-underline ${mode === m ? "bg-atrament text-papier hover:text-papier" : "text-atrament hover:bg-papier"}`}
    >
      {label}
    </Link>
  );

  return (
    <>
    <TransitionTrigger />
    <div lang={locale} className="flex-1 bg-papier font-body text-[1.125rem] leading-[1.55] text-atrament antialiased">
    <main id="main" tabIndex={-1} className="outline-none">
    <LandingHero title="text" compact howHref="/#jak-to-dziala">
      <section
        aria-labelledby="h-logowanie"
        className="box-border flex w-full flex-col gap-6 rounded-3xl border border-krawedz bg-white p-[clamp(1.5rem,3vw,2.75rem)] text-atrament shadow-[0_24px_60px_-30px_rgb(20_20_20/0.35)]"
      >
        <div className="flex flex-col gap-1">
          <h1 id="h-logowanie" className="m-0 font-display text-[clamp(2rem,3.2vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.01em]">
            {mode === "logowanie" ? t("titleSignIn") : t("titleRegister")}
          </h1>
          <p className="m-0 text-kamien">{t("intro")}</p>
        </div>

        <nav aria-label={t("tabsLabel")} className="flex gap-1 rounded-full border-[1.5px] border-krawedz bg-white p-1">
          {tab("logowanie", t("tabSignIn"))}
          {tab("rejestracja", t("tabRegister"))}
        </nav>

        {blad && (
          <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">
            <span aria-hidden="true">⚠ </span>{tErr(errorKey(blad))}
          </p>
        )}
        {apiDown && (
          <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">
            {t("serverDown")}
          </p>
        )}

        <form action={enterDemoMode} className="flex flex-col gap-2">
          <input type="hidden" name="next" value={next} />
          <button type="submit" disabled={!sandbox} className={secondary}>
            {t("demoButton")}
          </button>
          <p className="m-0 text-center text-[0.9375rem] text-kamien">{t("demoNote")}</p>
        </form>

        <div className="rounded-2xl border-[1.5px] border-granat bg-[#E6F3FA] p-4 text-[1rem]">
          <strong>{sandbox ? pick(sandbox.label, locale) : t("testIdentity")}</strong>
          <span className="block text-kamien">{t("testIdentityNote")}</span>
        </div>

        {mode === "logowanie" ? (
          <form action={signIn} className="space-y-5">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="providerSubject" className="mb-1.5 block font-bold">{t("subject")}</label>
              <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
            </div>
            <button type="submit" disabled={!sandbox} className={primary}>
              {t("submitSignIn")}
            </button>
          </form>
        ) : (
          <form action={register} className="space-y-5">
            <input type="hidden" name="next" value={next} />
            <div>
              <label htmlFor="providerSubject" className="mb-1.5 block font-bold">{t("subject")}</label>
              <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
              <p className="mt-1 mb-0 text-[0.9375rem] text-kamien">{t("subjectHint")}</p>
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block font-bold">{t("email")}</label>
              <input id="email" name="email" type="email" required autoComplete="email" className={field} />
            </div>
            <div>
              <label htmlFor="role" className="mb-1.5 block font-bold">{t("role")}</label>
              <select id="role" name="role" required className={field}>
                {(audiences ?? []).map((a) => <option key={a.id} value={a.id}>{pick(a.label, locale)}</option>)}
              </select>
              <p className="mt-1 mb-0 text-[0.9375rem] text-kamien">{t("roleHint")}</p>
            </div>
            <fieldset className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <legend className="mb-1 font-bold">{t("organisation")}</legend>
              <div>
                <label htmlFor="affiliationName" className="sr-only">{t("organisationName")}</label>
                <input id="affiliationName" name="affiliationName" required maxLength={200} placeholder={t("organisationNamePlaceholder")} autoComplete="organization" className={field} />
              </div>
              <div>
                <label htmlFor="affiliationType" className="sr-only">{t("organisationType")}</label>
                <select id="affiliationType" name="affiliationType" defaultValue="other" className={field}>
                  {ORG_TYPES.map((v) => <option key={v} value={v}>{tOrg(v)}</option>)}
                </select>
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1 font-bold">{t("interests")} <span className="font-normal text-kamien">{t("optional")}</span></legend>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {INTERESTS.map((v) => (
                  <label key={v} className="flex items-center gap-2"><input type="checkbox" name="interests" value={v} className="accent-granat" /> {tInterest(v)}</label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="acceptedTerms" required className="mt-1 accent-granat" />
              <span>{t.rich("terms", { terms: (c) => <a href="#">{c}</a>, privacy: (c) => <a href="#">{c}</a> })}</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" name="consentToContact" className="mt-1 accent-granat" />
              <span>{t("contact")}</span>
            </label>
            <button type="submit" disabled={!sandbox || !audiences} className={primary}>
              {t("submitRegister")}
            </button>
          </form>
        )}
      </section>
    </LandingHero>
    </main>
    </div>
    </>
  );
}
