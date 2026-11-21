import Link from "next/link";
import { getTranslations } from "next-intl/server";

// Landing page ("/"). PLACEHOLDER: Alban is designing the creative for this page.
// Replace the visuals freely, but keep the message (search needs an account) and the link to /logowanie.
export default async function LandingPage() {
  const t = await getTranslations("landing");
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      <div className="glass flex w-full flex-col items-center gap-7 rounded-[2.5rem] px-8 py-16 sm:px-16">
      <span className="rounded-full border border-white/80 bg-white/60 px-4 py-1 text-sm font-bold text-granat backdrop-blur-md">{t("badge")}</span>
      <h1 className="text-5xl sm:text-6xl">
        {t.rich("title", { hl: (c) => <span className="bg-gradient-to-r from-granat to-[#6B4FC8] bg-clip-text text-transparent">{c}</span> })}
      </h1>
      <p className="max-w-xl text-lg text-kamien">{t("lead")}</p>
      <p className="max-w-xl">{t("loginNote")}</p>
      <Link
        href="/logowanie"
        className="btn-primary inline-flex h-14 items-center rounded-full px-10 text-lg font-bold no-underline"
      >
        {t("cta")}
      </Link>
      </div>
    </section>
  );
}
