import Link from "next/link";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { signOut } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/locale";
import { DisplayControls } from "@/components/DisplayControls";
import { Icon } from "@/components/Icons";
import { Logo, Sygnet } from "@/components/Logo";
import { MenuCloser } from "@/components/MenuCloser";
import { RouteFocus } from "@/components/RouteFocus";
import { FlowClient } from "@/components/motion/FlowClient";
import { NavLinks } from "@/components/NavLinks";
import { LOCALES } from "@/i18n/locale";
import { api, type Schemas } from "@/lib/api";
import { DEMO_COOKIE, SESSION_COOKIE } from "@/lib/cookie";
import { helpHref } from "@/lib/help";
import { fitter, Reserve } from "@/components/Fit";

/** App shell from the flow prototype: Papier page, one white rounded nav card, no footer. Help, the text pages and the
 *  display settings live in the account menu. The text pages are public: without a session the card shows the logo,
 *  the language and a menu with the same help, display settings and text page links. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [store, t, tl, locale] = await Promise.all([cookies(), getTranslations("shell"), getTranslations("language"), getLocale()]);
  const ft = await fitter("shell");
  const token = store.get(SESSION_COOKIE)?.value;
  const demo = store.has(DEMO_COOKIE);
  const help = await helpHref();
  // The account name for the header. A failure here never breaks the page; the page's own call handles a 401.
  const me = token ? await api<{ data: Schemas["User"] }>("/api/v1/me", { token }).then((r) => r.data, () => null) : null;
  const name = me?.displayName?.trim() || me?.email?.split("@")[0] || "";
  const initials = (name.match(/[\p{L}\p{N}]+/gu) ?? []).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  // Display settings, help and the text pages: the account menu after sign-in, the plain menu before it.
  const menuBody = (
    <>
      <DisplayControls idPrefix="m" />
      <hr className="menu-sep" />
      <ul role="list">
        <li><a className="menu-item" href={help}>{ft("help")}</a></li>
        <li><Link className="menu-item" href="/regulamin">{ft("terms")}</Link></li>
        <li><Link className="menu-item" href="/dostepnosc">{ft("accessibility")}</Link></li>
        <li><Link className="menu-item" href="/metodologia">{ft("methodology")}</Link></li>
      </ul>
    </>
  );

  return (
    <div className="shell">
      <header className="nav">
        <Link href={token ? "/szukaj" : "/"} className="home" aria-label={token ? t("home") : t("homeLanding")}>
          <span className="word"><Logo size={22} /></span>
          <span className="mark"><Sygnet size={30} /></span>
        </Link>
        {token && <nav aria-label={t("navLabel")}>
          <NavLinks items={[{ href: "/szukaj", label: ft("search", undefined, false, true), match: ["/szukaj", "/wyniki"], types: ["to-search"] }, { href: "/zrodla", label: ft("sources", undefined, false, true), match: ["/zrodla"] }]} />
        </nav>}
        <div className="nav-right">
          <details className="menu" name="nav-menu">
            <summary className="lang-btn">
              <span className="sr-only">{t("language")}: </span><Reserve text={locale.toUpperCase()} others={LOCALES.filter((l) => l !== locale).map((l) => l.toUpperCase())} /><span className="sr-only"> ({tl(locale as "pl")})</span>
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
                  <span className="who"><b>{name}</b>{!me?.identityVerified && <><span className="badge b-test">{demo ? t("demoAccount") : t("testAccount")}</span><span className="who-reserve" aria-hidden="true">{demo ? ft("demoAccount") : ft("testAccount")}</span></>}</span>
                  <span className="sr-only">{ft("accountMenu")}</span>
                  <Icon name="chev" />
                </summary>
                <div className="menu-panel">
                  <ul role="list">
                    <li><Link className="menu-item" href="/profil">{ft("profile")}</Link></li>
                  </ul>
                  <hr className="menu-sep" />
                  {menuBody}
                </div>
              </details>
              <form action={signOut}><button type="submit" className="btn btn-text btn-sm">{ft("signOut")}</button></form>
            </>
          )}
          {/* Without a session the same menu, minus the profile, sits in the same place: help and the display
              settings are where they are after sign-in (WCAG 3.2.6). */}
          {!token && (
            <details className="menu" name="nav-menu">
              <summary className="lang-btn">{ft("guestMenu")}<span className="sr-only">: {t("guestMenuSr")}</span><Icon name="chev" /></summary>
              <div className="menu-panel">{menuBody}</div>
            </details>
          )}
        </div>
      </header>
      <Suspense fallback={null}><MenuCloser /><FlowClient /><RouteFocus /></Suspense>
      <main id="main">{children}</main>
    </div>
  );
}
