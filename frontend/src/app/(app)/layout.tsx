import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/locale";
import { setDisplaySettings } from "@/app/actions/settings";
import { Icon } from "@/components/Icons";
import { Logo, Sygnet } from "@/components/Logo";
import { MenuCloser } from "@/components/MenuCloser";
import { RouteFocus } from "@/components/RouteFocus";
import { FlowClient } from "@/components/motion/FlowClient";
import { NavLinks } from "@/components/NavLinks";
import { LOCALES } from "@/i18n/locale";
import { api, type Schemas } from "@/lib/api";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";
import { CONTRASTS, parseSettings, SETTINGS_COOKIE, TEXT_SIZES } from "@/lib/settings";

/** App shell from the flow prototype: Papier page, one white rounded nav card, no footer. Help, the text pages and the
 *  display settings live in the account menu. The text pages are public: without a session the card shows the logo
 *  and the language only. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [store, t, tl, locale] = await Promise.all([cookies(), getTranslations("shell"), getTranslations("language"), getLocale()]);
  const token = store.get(SESSION_COOKIE)?.value;
  const demo = store.has(DEMO_COOKIE);
  const settings = parseSettings(store.get(SETTINGS_COOKIE)?.value);
  // The account name for the header. A failure here never breaks the page; the page's own call handles a 401.
  const me = token ? await api<{ data: Schemas["User"] }>("/api/v1/me", { token }).then((r) => r.data, () => null) : null;
  const name = me?.displayName?.trim() || me?.email?.split("@")[0] || "";
  const initials = (name.match(/[\p{L}\p{N}]+/gu) ?? []).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const contrastLabel = { auto: t("contrastAuto"), high: t("contrastHigh"), low: t("contrastLow") };

  return (
    <div className="shell">
      <header className="nav">
        <Link href={token ? "/szukaj" : "/"} className="home" aria-label={token ? t("home") : t("homeLanding")}>
          <span className="word"><Logo size={22} /></span>
          <span className="mark"><Sygnet size={30} /></span>
        </Link>
        {token && <nav aria-label={t("navLabel")}>
          <NavLinks items={[{ href: "/szukaj", label: t("search"), match: ["/szukaj", "/wyniki"], types: ["to-search"] }, { href: "/zrodla", label: t("sources"), match: ["/zrodla"] }]} />
        </nav>}
        <div className="nav-right">
          <details className="menu" name="nav-menu">
            <summary className="lang-btn">
              <span className="sr-only">{t("language")}: </span>{locale.toUpperCase()}<span className="sr-only"> ({tl(locale as "pl")})</span>
              <Icon name="chev" />
            </summary>
            <form className="menu-panel menu-panel-sm" action={setLocale}>
              {LOCALES.map((l) => (
                <button key={l} type="submit" name="locale" value={l} lang={l} className="menu-item" aria-current={l === locale ? "true" : undefined}>{tl(l)}</button>
              ))}
            </form>
          </details>

          {token && (
            <>
              <details className="menu" name="nav-menu">
                <summary className="account">
                  <span className="avatar" aria-hidden="true">{initials}</span>
                  <span className="who"><b>{name}</b>{!me?.identityVerified && <span className="badge b-test">{demo ? t("demoAccount") : t("testAccount")}</span>}</span>
                  <span className="sr-only">{t("accountMenu")}</span>
                  <Icon name="chev" />
                </summary>
                <div className="menu-panel">
                  <ul role="list">
                    <li><Link className="menu-item" href="/profil">{t("profile")}</Link></li>
                  </ul>
                  <hr className="menu-sep" />
                  <p className="menu-head" id="m-text">{t("textSize")}</p>
                  <form className="seg" role="group" aria-labelledby="m-text" action={setDisplaySettings}>
                    <input type="hidden" name="contrast" value={settings.contrast} />
                    {TEXT_SIZES.map((v) => <button key={v} type="submit" name="text" value={v} aria-pressed={settings.text === v}>{v}%</button>)}
                  </form>
                  <p className="menu-head" id="m-contrast">{t("contrast")}</p>
                  <form className="seg" role="group" aria-labelledby="m-contrast" action={setDisplaySettings}>
                    <input type="hidden" name="text" value={settings.text} />
                    {CONTRASTS.map((v) => <button key={v} type="submit" name="contrast" value={v} aria-pressed={settings.contrast === v}>{contrastLabel[v]}</button>)}
                  </form>
                  <hr className="menu-sep" />
                  <ul role="list">
                    <li><a className="menu-item" href={t("helpUrl")}>{t("help")}</a></li>
                    <li><Link className="menu-item" href="/regulamin">{t("terms")}</Link></li>
                    <li><Link className="menu-item" href="/dostepnosc">{t("accessibility")}</Link></li>
                    <li><Link className="menu-item" href="/metodologia">{t("methodology")}</Link></li>
                  </ul>
                </div>
              </details>
              <form action={signOut}><button type="submit" className="btn btn-text btn-sm">{t("signOut")}</button></form>
            </>
          )}
        </div>
      </header>
      <Suspense fallback={null}><MenuCloser /><FlowClient /><RouteFocus /></Suspense>
      <main id="main">{children}</main>
    </div>
  );
}
