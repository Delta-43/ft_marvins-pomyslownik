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
  const demo = store.has(DEMO_COOKIE);
  return (
    <div className="page page-narrow">
      <header className="page-head"><h1 tabIndex={-1}>{t("title")}</h1></header>
      <div role="status">{zapisano && <div className="msg msg-ok"><Icon name="ok" /><p>{t("saved")}</p></div>}</div>
      {blad && <div className="msg msg-err" role="alert"><Icon name="alert" /><p><b>{tp("errorLead")}</b> {te(errorKey(blad))}</p></div>}

      <section className="box" aria-labelledby="p-data">
        <h2 id="p-data">{tp("dataTitle")}</h2>
        <dl className="kv">
          {me.displayName && <div><dt>{tp("name")}</dt><dd>{me.displayName}</dd></div>}
          <div><dt>{t("email")}</dt><dd>{me.email}</dd></div>
          <div><dt>{t("organisation")}</dt><dd>{me.affiliation.name} ({to(me.affiliation.type)})</dd></div>
          <div><dt>{t("identity")}</dt><dd>{me.identityVerified ? t("verified") : t("testIdentity")}</dd></div>
          <div><dt>{t("memberSince")}</dt><dd className="mono">{formatDate(me.createdAt, locale as Locale)}</dd></div>
        </dl>
      </section>

      <form className="box" action={updateProfile} aria-labelledby="p-set" aria-describedby={demo ? "demoNote" : undefined}>
        <h2 id="p-set">{tp("settingsTitle")}</h2>
        {demo && <div className="msg msg-info" id="demoNote"><Icon name="info" /><p>{t("sharedDemo")}</p></div>}
        <div className="field">
          <label htmlFor="role">{t("role")}</label>
          <select className="input" id="role" name="role" defaultValue={me.role} disabled={demo}>
            {roles.map((r) => <option key={r.id} value={r.id}>{text(r.label, locale)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="preferredLanguage">{t("language")}</label>
          <select className="input" id="preferredLanguage" name="preferredLanguage" defaultValue={me.preferredLanguage ?? locale} disabled={demo}>
            {LOCALES.map((l) => <option key={l} value={l} lang={l}>{tl(l)}</option>)}
          </select>
        </div>
        <label className="check"><input type="checkbox" name="consentToContact" defaultChecked={me.consentToContact} disabled={demo} aria-describedby="consentHint" /><span>{t("contact")}<span className="hint block" id="consentHint">{tp("consentHint")}</span></span></label>
        {!demo && <div><button className="btn btn-primary" type="submit">{t("save")}</button></div>}
      </form>

      {!demo && (
        <form className="box" action={deleteAccount} aria-labelledby="p-del">
          <h2 id="p-del">{t("deleteTitle")}</h2>
          <p>{t("deleteText")}</p>
          <label className="check"><input type="checkbox" name="confirm" required /><span>{t("deleteConfirm")}</span></label>
          <div><button className="btn btn-danger" type="submit">{t("deleteButton")}</button></div>
        </form>
      )}
    </div>
  );
}
