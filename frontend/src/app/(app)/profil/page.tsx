import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { deleteAccount, updateProfile } from "@/app/actions/auth";
import { formatDate } from "@/components/Cards";
import { Icon } from "@/components/Icons";
import { LOCALES, type Locale } from "@/i18n/locale";
import { errorKey, text } from "@/lib/api";
import { DEMO_COOKIE } from "@/lib/cookie";
import { getAudiences, getMe } from "@/lib/data";
import { fitter } from "@/components/Fit";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("profile"))("title") };
}

/** Profile: what is stored about the account, the few settings, and deleting the account (GDPR). */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ zapisano?: string; blad?: string }> }) {
  const { zapisano, blad } = await searchParams;
  const [t, tp, tl, to, te, locale, me, roles, store] = await Promise.all([
    getTranslations("profile"), getTranslations("prof"), getTranslations("language"), getTranslations("orgType"), getTranslations("errors"),
    getLocale(), getMe("/profil"), getAudiences("/profil"), cookies(),
  ]);
  const [ft, ftp] = await Promise.all([fitter("profile"), fitter("prof")]);
  const demo = store.has(DEMO_COOKIE);
  return (
    <div className="page page-narrow">
      <header className="page-head"><h1 tabIndex={-1}>{ft("title")}</h1></header>
      <div role="status">{zapisano && <div className="msg msg-ok"><Icon name="ok" /><p>{ft("saved")}</p></div>}</div>
      {blad && <div className="msg msg-err" role="alert"><Icon name="alert" /><p><b>{ftp("errorLead")}</b> {te(errorKey(blad))}</p></div>}

      <section className="box" aria-labelledby="p-data">
        <h2 id="p-data">{ftp("dataTitle")}</h2>
        <dl className="kv">
          {me.displayName && <div><dt>{ftp("name")}</dt><dd>{me.displayName}</dd></div>}
          <div><dt>{ft("email")}</dt><dd>{me.email}</dd></div>
          <div><dt>{ft("organisation")}</dt><dd>{me.affiliation.name} ({to(me.affiliation.type)})</dd></div>
          <div><dt>{ft("identity")}</dt><dd>{me.identityVerified ? t("verified") : t("testIdentity")}</dd></div>
          <div><dt>{ft("memberSince")}</dt><dd className="mono">{formatDate(me.createdAt, locale as Locale)}</dd></div>
        </dl>
      </section>

      <form className="box" action={updateProfile} aria-labelledby="p-set" aria-describedby={demo ? "demoNote" : undefined}>
        <h2 id="p-set">{ftp("settingsTitle")}</h2>
        {demo && <div className="msg msg-info" id="demoNote"><Icon name="info" /><p>{ft("sharedDemo")}</p></div>}
        <div className="field">
          <label htmlFor="role">{ft("role")}</label>
          <select className="input" id="role" name="role" defaultValue={me.role} disabled={demo}>
            {roles.map((r) => <option key={r.id} value={r.id}>{text(r.label, locale)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="preferredLanguage">{ft("language")}</label>
          <select className="input" id="preferredLanguage" name="preferredLanguage" defaultValue={me.preferredLanguage ?? locale} disabled={demo}>
            {LOCALES.map((l) => <option key={l} value={l} lang={l}>{tl(l)}</option>)}
          </select>
        </div>
        <label className="check"><input type="checkbox" name="consentToContact" defaultChecked={me.consentToContact} disabled={demo} aria-describedby="consentHint" /><span>{ft("contact")}<span className="hint block" id="consentHint">{ftp("consentHint")}</span></span></label>
        {!demo && <div><button className="btn btn-primary" type="submit">{ft("save")}</button></div>}
      </form>

      {!demo && (
        <form className="box" action={deleteAccount} aria-labelledby="p-del">
          <h2 id="p-del">{ft("deleteTitle")}</h2>
          <p>{ft("deleteText")}</p>
          <label className="check"><input type="checkbox" name="confirm" required /><span>{ft("deleteConfirm")}</span></label>
          <div><button className="btn btn-danger" type="submit">{ft("deleteButton")}</button></div>
        </form>
      )}
    </div>
  );
}
