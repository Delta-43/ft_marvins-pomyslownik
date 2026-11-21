import { getLocale, getTranslations } from "next-intl/server";
import { setLocale } from "@/app/actions/locale";
import type { Locale } from "@/i18n/locale";

/** Round flags as inline SVG (flag emoji do not render on Windows). Decorative: the PL/EN text carries the meaning. */
function FlagPL() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="shrink-0 rounded-full ring-1 ring-atrament/15">
      <clipPath id="flag-pl-c"><circle cx="10" cy="10" r="10" /></clipPath>
      <g clipPath="url(#flag-pl-c)">
        <rect width="20" height="10" fill="#FFFFFF" />
        <rect y="10" width="20" height="10" fill="#DC143C" />
      </g>
    </svg>
  );
}

function FlagUK() {
  // Union Jack (60×30), centre square shown inside the circle.
  return (
    <svg viewBox="15 0 30 30" width="20" height="20" aria-hidden="true" className="shrink-0 rounded-full ring-1 ring-atrament/15">
      <clipPath id="flag-uk-c"><circle cx="30" cy="15" r="15" /></clipPath>
      <clipPath id="flag-uk-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#flag-uk-c)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#flag-uk-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

const OPTIONS: { value: Locale; code: string; Flag: () => React.JSX.Element }[] = [
  { value: "pl", code: "PL", Flag: FlagPL },
  { value: "en", code: "EN", Flag: FlagUK },
];

/** Language switch (footer, bottom right on every page). A plain form, so it also works without JavaScript.
 *  `dark` is for dark surfaces (the landing page footer). */
export async function LanguageSwitch({ dark = false }: { dark?: boolean } = {}) {
  const locale = await getLocale();
  const t = await getTranslations("language");
  return (
    <form
      action={setLocale}
      aria-label={t("label")}
      className={`flex items-center gap-1 rounded-full p-1 ring-1 ${dark ? "bg-white/10 ring-white/25" : "bg-white/50 ring-white/80"}`}
    >
      {OPTIONS.map(({ value, code, Flag }) => {
        const active = locale === value;
        return (
          <button
            key={value}
            type="submit"
            name="locale"
            value={value}
            aria-pressed={active}
            lang={value}
            title={t(value)}
            className={`flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition ${
              active
                ? "bg-white text-atrament shadow-sm ring-1 ring-atrament/10"
                : dark
                  ? "text-[#E4DDD2] hover:bg-white/15 hover:text-papier"
                  : "text-kamien hover:bg-white/70 hover:text-atrament"
            }`}
          >
            <Flag />
            <span>{code}</span>
            <span className="sr-only">{t(value)}</span>
          </button>
        );
      })}
    </form>
  );
}
