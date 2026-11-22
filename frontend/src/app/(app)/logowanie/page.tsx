import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { enterDemoMode, register, signIn } from "@/app/actions/auth";
import { api, errorKey, pick, type Schemas } from "@/lib/api";

const ORG_TYPES: Schemas["OrganisationType"][] = [
  "university", "research_institute", "school", "local_government", "public_institution", "company",
  "startup", "incubator", "investor", "individual", "other",
];
const INTERESTS = ["technological", "educational", "administrative"] as const;

const field = "h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-4 shadow-inner transition focus:border-granat focus:bg-white";

type Params = { next?: string; tryb?: string; blad?: string; id?: string };

// "Login Page" frame. Sign-in and registration with the sandbox provider ("test identity").
// Public endpoints only (/auth/providers, /audiences). No card data here.
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
      className={`flex-1 rounded-full px-4 py-2 text-center font-bold no-underline ${mode === m ? "btn-primary" : "text-atrament hover:bg-white/60"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_520px]">
      <section className="glass flex items-center justify-center rounded-[2.5rem] px-6 py-12">
        <div className="w-full max-w-md space-y-5">
          <h1 style={{ fontSize: "2rem" }}>{mode === "logowanie" ? t("titleSignIn") : t("titleRegister")}</h1>
          <p className="text-kamien">{t("intro")}</p>

          <nav aria-label={t("tabsLabel")} className="flex gap-1 rounded-full bg-white/50 p-1 ring-1 ring-white/80">
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

          <form action={enterDemoMode}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" disabled={!sandbox} className="btn-secondary h-12 w-full cursor-pointer rounded-full font-bold disabled:opacity-50">
              {t("demoButton")}
            </button>
            <p className="mt-2 text-center text-xs text-kamien">{t("demoNote")}</p>
          </form>

          <div className="rounded-[var(--radius-card)] border border-white/80 bg-white/60 p-4 text-sm">
            <strong>{sandbox ? pick(sandbox.label, locale) : t("testIdentity")}</strong>
            <span className="block text-kamien">{t("testIdentityNote")}</span>
          </div>

          {mode === "logowanie" ? (
            <form action={signIn} className="space-y-5">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="providerSubject" className="mb-1 block font-bold">{t("subject")}</label>
                <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
              </div>
              <button type="submit" disabled={!sandbox} className="btn-primary h-12 w-full cursor-pointer rounded-full font-bold disabled:opacity-50">
                {t("submitSignIn")}
              </button>
            </form>
          ) : (
            <form action={register} className="space-y-5">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="providerSubject" className="mb-1 block font-bold">{t("subject")}</label>
                <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
                <p className="mt-1 text-xs text-kamien">{t("subjectHint")}</p>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block font-bold">{t("email")}</label>
                <input id="email" name="email" type="email" required autoComplete="email" className={field} />
              </div>
              <div>
                <label htmlFor="role" className="mb-1 block font-bold">{t("role")}</label>
                <select id="role" name="role" required className={field}>
                  {(audiences ?? []).map((a) => <option key={a.id} value={a.id}>{pick(a.label, locale)}</option>)}
                </select>
                <p className="mt-1 text-xs text-kamien">{t("roleHint")}</p>
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
              <button type="submit" disabled={!sandbox || !audiences} className="btn-primary h-12 w-full cursor-pointer rounded-full font-bold disabled:opacity-50">
                {t("submitRegister")}
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="glass-dark relative hidden flex-col justify-between overflow-hidden rounded-[2.5rem] p-12 text-papier lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iskra/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-laboratoria/30 blur-3xl" />
        <Logo inverted />
        <div>
          <p className="font-display text-4xl font-bold leading-tight">
            {t("heroLine1")}<br />{t.rich("heroLine2", { hl: (c) => <span className="bg-iskra px-1 text-atrament">{c}</span> })}
          </p>
          <p className="mt-4 text-papier/80">{t("heroLead")}</p>
        </div>
        <svg viewBox="0 0 400 260" className="w-full opacity-80" aria-hidden="true">
          {[[40, 200, 140, 110], [140, 110, 260, 150], [260, 150, 350, 60], [140, 110, 200, 30], [260, 150, 300, 230]].map(([a, b, c, d], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#F7F2EB" strokeOpacity=".4" strokeWidth="2" />
          ))}
          {[[40, 200], [140, 110], [260, 150], [350, 60], [200, 30], [300, 230]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 2 ? 12 : 7} fill={i === 2 ? "#FFD93D" : "#F7F2EB"} />
          ))}
        </svg>
      </aside>
    </div>
  );
}
