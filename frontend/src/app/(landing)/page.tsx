import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { register, signIn } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/locale";
import { LOCALES } from "@/i18n/locale";
import { HeroArt } from "@/components/HeroArt";
import { HeroPanels } from "@/components/HeroPanels";
import { FlowClient } from "@/components/motion/FlowClient";
import { PageMove } from "@/components/motion/Motion";
import { Icon } from "@/components/Icons";
import { Logo } from "@/components/Logo";
import { api, errorKey, text, type Schemas } from "@/lib/api";
import { fitter } from "@/components/Fit";
import { DisplayControls } from "@/components/DisplayControls";
import { RegisterChecks } from "@/components/RegisterChecks";
import { readDraft, type DraftField } from "@/lib/draft";
import { helpHref } from "@/lib/help";

const ORG_TYPES = ["university", "research_institute", "school", "local_government", "public_institution", "company", "startup", "incubator", "investor", "individual", "other"] as const;

type Params = { blad?: string; next?: string; konto?: string };

/** Registration fields in page order: the first one with an error gets the focus. */
const REG_FIELDS: DraftField[] = ["providerSubject", "email", "role", "affiliationName", "affiliationType", "acceptedTerms"];

/** Landing: the Navy hero with four panels on the left, the floating sign-in card on the right. One screen.
 *  `?konto=nowe` shows the registration form in the same card (the only way to register; the site is gated).
 *  After a rejected attempt the typed values and the field errors come from the draft cookie (lib/draft.ts), never
 *  from the URL. */
export default async function Landing({ searchParams }: { searchParams: Promise<Params> }) {
  const { blad, next, konto } = await searchParams;
  const [tl, t, ta, th, ts, te, to, locale, help] = await Promise.all([
    getTranslations("language"), getTranslations("login"), getTranslations("auth"), getTranslations("hero"), getTranslations("shell"), getTranslations("errors"), getTranslations("orgType"), getLocale(), helpHref(),
  ]);
  const [ft, fta, fts] = await Promise.all([fitter("login"), fitter("auth"), fitter("shell")]);
  const draft = blad ? await readDraft() : {};
  const id = draft.id;
  const registering = konto === "nowe";
  const invalid = blad === "validation_failed" && !registering;
  // Registration: errors that belong to a field show under it; the alert at the top is only for the others.
  const fe = registering ? (draft.fields ?? {}) : {};
  const firstInvalid = REG_FIELDS.find((f) => fe[f]);
  const failed = !!blad && !invalid && !firstInvalid;
  const regDesc = (f: DraftField, hint?: string) => [hint, fe[f] && `${f}Err`, failed && f === "providerSubject" && "loginErr"].filter(Boolean).join(" ") || undefined;
  const regErr = (f: DraftField) => (
    <p className="err" id={`${f}Err`} hidden={!fe[f]}><Icon name="alert" /><span>{fe[f] ? ta(fe[f]) : ""}</span></p>
  );
  const regInvalid = (f: DraftField) => ({ "aria-invalid": fe[f] ? (true as const) : undefined, "aria-describedby": regDesc(f, f === "providerSubject" ? "idHint" : f === "email" ? "emailHint" : f === "role" ? "roleHint" : undefined), autoFocus: firstInvalid ? firstInvalid === f : f === "providerSubject" && failed });
  const describedBy = ["idHint", invalid && "idErr", failed && "loginErr"].filter(Boolean).join(" ");
  // Roles for the registration form, with their names from the API (public endpoint).
  const roles = registering ? await api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data, () => []) : [];
  const fth = await fitter("hero");
  const panels = ([1, 2, 3, 4] as const).map((n) => ({ kicker: fth(`k${n}`), title: fth(`t${n}`, undefined, true), lead: fth(`l${n}`, undefined, true) }));
  const kickers = ([1, 2, 3, 4] as const).map((n) => th(`k${n}`));

  return (
    <>
    <PageMove />
    <div className="landing">
      <FlowClient busyLabel={ta("busy")} />
      <header className="hero on-dark">
        <div className="hero-logo"><Logo inverted size={46} title={ts("homeLanding")} /></div>
        <HeroArt />
        <HeroPanels panels={panels} labels={{ group: th("group"), show: kickers.map((k, i) => th("showN", { n: i + 1, total: kickers.length, name: k })), pause: fth("pause"), play: fth("play") }} />
      </header>

      <main id="main" className="login">
        <div className="login-wrap">
          <div role="status">{konto === "usuniete" && <div className="msg msg-ok"><Icon name="ok" /><p>{ft("deleted")}</p></div>}</div>
          <p className="sr-only" role="status" id="loginStatus" />
          {registering ? (
            <form className="login-card" id="logowanie" action={register} noValidate data-register>
              <RegisterChecks formId="logowanie" messages={{ errId: ta("errId"), errRequired: ta("errRequired"), errEmail: ta("errEmail"), errChoice: ta("errChoice"), errTerms: ta("errTerms") }} />
              <h2>{fta("registerTitle")}</h2>
              <p className="lead">{ft("allRequired", undefined, true)}</p>
              {next && <input type="hidden" name="next" value={next} />}
              {failed && <div className="msg msg-err" role="alert" id="loginErr"><Icon name="alert" /><p><b>{ft("errorLead")}</b> {te(errorKey(blad))}</p></div>}
              <div className="field">
                <label htmlFor="providerSubject">{fta("idLabel")}</label>
                <span className="hint" id="idHint">{ft("idHint")}</span>
                <input className="input" id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} autoComplete="username" autoCapitalize="none" spellCheck={false}
                  defaultValue={id ?? ""} {...regInvalid("providerSubject")} />
                {regErr("providerSubject")}
              </div>
              <div className="field">
                <label htmlFor="email">{fta("email")}</label>
                <span className="hint" id="emailHint">{fta("emailHint")}</span>
                <input className="input" id="email" name="email" type="email" required autoComplete="email" defaultValue={draft.email ?? ""} {...regInvalid("email")} />
                {regErr("email")}
              </div>
              <div className="field">
                <label htmlFor="role">{fta("role")}</label>
                <span className="hint" id="roleHint">{ft("roleHint")}</span>
                <select className="input" id="role" name="role" required defaultValue={draft.role ?? ""} {...regInvalid("role")}>
                  <option value="" disabled>{t("chooseRole")}</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{text(r.label, locale)}</option>)}
                </select>
                {regErr("role")}
              </div>
              <div className="field">
                <label htmlFor="affiliationName">{fta("organisationName")}</label>
                <input className="input" id="affiliationName" name="affiliationName" required autoComplete="organization" defaultValue={draft.org ?? ""} {...regInvalid("affiliationName")} />
                {regErr("affiliationName")}
              </div>
              <div className="field">
                <label htmlFor="affiliationType">{fta("organisationType")}</label>
                <select className="input" id="affiliationType" name="affiliationType" defaultValue={draft.type || "other"} {...regInvalid("affiliationType")}>
                  {ORG_TYPES.map((o) => <option key={o} value={o}>{to(o)}</option>)}
                </select>
                {regErr("affiliationType")}
              </div>
              <div className="field">
                <label className="check"><input type="checkbox" id="acceptedTerms" name="acceptedTerms" required {...regInvalid("acceptedTerms")} />
                  <span>{ta.rich("terms", { terms: (c) => <Link href="/regulamin" target="_blank" rel="noopener">{c}<span className="sr-only"> {fts("newTab")}</span></Link> })}</span>
                </label>
                {regErr("acceptedTerms")}
              </div>
              <label className="check"><input type="checkbox" name="consentToContact" /><span>{fta("contact")} {fta("optional")}</span></label>
              <div className="login-actions">
                <button className="btn btn-primary btn-lg" type="submit">{fta("submitRegister")}</button>
                <p className="small-row">{fta("haveAccount")} <Link href="/#logowanie">{fta("backToSignIn")}</Link></p>
              </div>
            </form>
          ) : (
            <form className="login-card" id="logowanie" action={signIn} noValidate data-signin>
              <h2>{ft("title")}</h2>
              <p className="lead">{ft("lead", undefined, true)}</p>
              {next && <input type="hidden" name="next" value={next} />}

              <fieldset className="prov">
                <legend className="legend">{ft("method")}</legend>
                <label className="radio"><input type="radio" name="provider" value="sandbox_id" defaultChecked /> {ft("sandbox")}</label>
                <label className="radio">
                  <input type="radio" name="provider" value="login_gov_pl" disabled />
                  <span>{ft("gov")}<span className="sub">{ft("govMethods")}</span></span>
                </label>
              </fieldset>

              <div className="field">
                <label htmlFor="providerSubject">{fta("idLabel")}</label>
                <span className="hint" id="idHint">{ft("idHint")}</span>
                <input className="input" id="providerSubject" name="providerSubject" autoComplete="username" autoCapitalize="none" spellCheck={false}
                  defaultValue={id ?? ""} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoFocus={!!blad} />
                {invalid && <p className="err" id="idErr"><Icon name="alert" />{ft("idError")}</p>}
              </div>

              {failed && <div className="msg msg-err" role="alert" id="loginErr"><Icon name="alert" /><p><b>{ft("errorLead")}</b> {te(errorKey(blad))}</p></div>}

              <div className="login-actions">
                <button className="btn btn-primary btn-lg" type="submit">{fta("signIn")}</button>
                <button className="btn btn-secondary" type="submit" name="mode" value="demo">{fta("demo")}</button>
                <p className="small-row">{fta("noAccount")} <Link href="/?konto=nowe#logowanie">{fta("register")}</Link></p>
              </div>
            </form>
          )}

          <form className="lang-row" action={setLocale} aria-label={ts("language")}>
            {LOCALES.map((l) => <button key={l} type="submit" name="locale" value={l} lang={l} className="lang-pick" aria-current={l === locale ? "true" : undefined}>{tl(l)}</button>)}
          </form>
          <nav aria-label={ts("info")}>
            <ul className="login-links" role="list">
              <li><Link href="/regulamin">{fts("terms")}</Link></li>
              <li><Link href="/dostepnosc">{fts("accessibility")}</Link></li>
              <li><Link href="/metodologia">{fts("methodology")}</Link></li>
              <li><a href={help}>{fts("help")}</a></li>
            </ul>
          </nav>
          <div className="disp">
            <DisplayControls idPrefix="d" />
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
