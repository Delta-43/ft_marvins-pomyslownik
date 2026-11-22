import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { register, signIn } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/locale";
import { LOCALES } from "@/i18n/locale";
import { HeroPanels } from "@/components/HeroPanels";
import { FlowClient } from "@/components/motion/FlowClient";
import { PageMove } from "@/components/motion/Motion";
import { Icon } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { api, errorKey, text, type Schemas } from "@/lib/api";

const ORG_TYPES = ["university", "research_institute", "school", "local_government", "public_institution", "company", "startup", "incubator", "investor", "individual", "other"] as const;

type Params = { blad?: string; id?: string; next?: string; konto?: string; email?: string; rola?: string; org?: string; typ?: string };

/** Landing: the Navy hero with four panels on the left, the floating sign-in card on the right. One screen.
 *  `?konto=nowe` shows the registration form in the same card (the only way to register; the site is gated). */
export default async function Landing({ searchParams }: { searchParams: Promise<Params> }) {
  const { blad, id, next, konto, email, rola, org, typ } = await searchParams;
  const [tl, t, ta, th, ts, te, to, locale] = await Promise.all([
    getTranslations("language"), getTranslations("login"), getTranslations("auth"), getTranslations("hero"), getTranslations("shell"), getTranslations("errors"), getTranslations("orgType"), getLocale(),
  ]);
  const registering = konto === "nowe";
  const invalid = blad === "validation_failed" && !registering;
  const failed = !!blad && !invalid;
  const describedBy = ["idHint", invalid && "idErr", failed && "loginErr"].filter(Boolean).join(" ");
  // Roles for the registration form, with their names from the API (public endpoint).
  const roles = registering ? await api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data, () => []) : [];
  const panels = ([1, 2, 3, 4] as const).map((n) => ({ kicker: th(`k${n}`), title: th(`t${n}`), lead: th(`l${n}`) }));

  return (
    <>
    <PageMove />
    <div className="landing">
      <FlowClient busyLabel={ta("busy")} />
      <header className="hero on-dark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-art" src="/landing/konstelacja.webp" alt="" />
        <div className="hero-logo"><Logo inverted size={46} title={ts("homeLanding")} /></div>
        <HeroPanels panels={panels} labels={{ group: th("group"), show: panels.map((p, i) => th("showN", { n: i + 1, total: panels.length, name: p.kicker })), pause: th("pause"), play: th("play") }} />
      </header>

      <main id="main" className="login">
        <div className="login-wrap">
          <div role="status">{konto === "usuniete" && <div className="msg msg-ok"><Icon name="ok" /><p>{t("deleted")}</p></div>}</div>
          <p className="sr-only" role="status" id="loginStatus" />
          {registering ? (
            <form className="login-card" id="logowanie" action={register}>
              <h2>{ta("registerTitle")}</h2>
              <p className="lead">{t("allRequired")}</p>
              {next && <input type="hidden" name="next" value={next} />}
              {failed && <div className="msg msg-err" role="alert" id="loginErr"><Icon name="alert" /><p><b>{t("errorLead")}</b> {te(errorKey(blad))}</p></div>}
              <div className="field">
                <label htmlFor="providerSubject">{ta("idLabel")}</label>
                <span className="hint" id="idHint">{t("idHint")}</span>
                <input className="input" id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} autoComplete="username" autoCapitalize="none" spellCheck={false}
                  defaultValue={id ?? ""} aria-describedby={failed ? "idHint loginErr" : "idHint"} autoFocus={failed} />
              </div>
              <div className="field">
                <label htmlFor="email">{ta("email")}</label>
                <span className="hint" id="emailHint">{ta("emailHint")}</span>
                <input className="input" id="email" name="email" type="email" required autoComplete="email" aria-describedby="emailHint" defaultValue={email ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="role">{ta("role")}</label>
                <span className="hint" id="roleHint">{t("roleHint")}</span>
                <select className="input" id="role" name="role" required aria-describedby="roleHint" defaultValue={rola ?? ""}>
                  <option value="" disabled>{t("chooseRole")}</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{text(r.label, locale)}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="affiliationName">{ta("organisationName")}</label>
                <input className="input" id="affiliationName" name="affiliationName" required autoComplete="organization" defaultValue={org ?? ""} />
              </div>
              <div className="field">
                <label htmlFor="affiliationType">{ta("organisationType")}</label>
                <select className="input" id="affiliationType" name="affiliationType" defaultValue={typ || "other"}>
                  {ORG_TYPES.map((o) => <option key={o} value={o}>{to(o)}</option>)}
                </select>
              </div>
              <label className="check"><input type="checkbox" name="acceptedTerms" required />
                <span>{ta.rich("terms", { terms: (c) => <Link href="/regulamin" target="_blank" rel="noopener">{c}<span className="sr-only"> {ts("newTab")}</span></Link> })}</span>
              </label>
              <label className="check"><input type="checkbox" name="consentToContact" /><span>{ta("contact")} {ta("optional")}</span></label>
              <div className="login-actions">
                <button className="btn btn-primary btn-lg" type="submit">{ta("submitRegister")}</button>
                <p className="small-row">{ta("haveAccount")} <Link href="/#logowanie">{ta("backToSignIn")}</Link></p>
              </div>
            </form>
          ) : (
            <form className="login-card" id="logowanie" action={signIn} noValidate data-signin>
              <h2>{t("title")}</h2>
              <p className="lead">{t("lead")}</p>
              {next && <input type="hidden" name="next" value={next} />}

              <fieldset className="prov">
                <legend className="legend">{t("method")}</legend>
                <label className="radio"><input type="radio" name="provider" value="sandbox_id" defaultChecked /> {t("sandbox")}</label>
                <label className="radio">
                  <input type="radio" name="provider" value="login_gov_pl" disabled />
                  <span>{t("gov")}<span className="sub">{t("govMethods")}</span></span>
                </label>
              </fieldset>

              <div className="field">
                <label htmlFor="providerSubject">{ta("idLabel")}</label>
                <span className="hint" id="idHint">{t("idHint")}</span>
                <input className="input" id="providerSubject" name="providerSubject" autoComplete="username" autoCapitalize="none" spellCheck={false}
                  defaultValue={id ?? ""} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoFocus={!!blad} />
                {invalid && <p className="err" id="idErr"><Icon name="alert" />{t("idError")}</p>}
              </div>

              {failed && <div className="msg msg-err" role="alert" id="loginErr"><Icon name="alert" /><p><b>{t("errorLead")}</b> {te(errorKey(blad))}</p></div>}

              <div className="login-actions">
                <button className="btn btn-primary btn-lg" type="submit">{ta("signIn")}</button>
                <button className="btn btn-secondary" type="submit" name="mode" value="demo">{ta("demo")}</button>
                <p className="small-row">{ta("noAccount")} <Link href="/?konto=nowe#logowanie">{ta("register")}</Link></p>
              </div>
            </form>
          )}

          <form className="lang-row" action={setLocale} aria-label={ts("language")}>
            {LOCALES.map((l) => <button key={l} type="submit" name="locale" value={l} lang={l} className="lang-pick" aria-current={l === locale ? "true" : undefined}>{tl(l)}</button>)}
          </form>
          <nav aria-label={ts("info")}>
            <ul className="login-links" role="list">
              <li><Link href="/regulamin">{ts("terms")}</Link></li>
              <li><Link href="/dostepnosc">{ts("accessibility")}</Link></li>
              <li><Link href="/metodologia">{ts("methodology")}</Link></li>
              <li><a href={ts("helpUrl")}>{ts("help")}</a></li>
            </ul>
          </nav>
        </div>
      </main>
    </div>
    </>
  );
}
