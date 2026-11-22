import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { vt } from "@/components/motion/Motion";

export const MONO = "font-['Atkinson_Hyperlegible_Mono',ui-monospace,monospace]";

/** Film grain over the dark surfaces of the landing page. */
export function Grain({ id }: { id: string }) {
  return (
    <svg width="100%" height="100%" className="pointer-events-none absolute inset-0 opacity-5 mix-blend-screen">
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} aria-hidden="true">
      <path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="#F7F2EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** The two halves of the landing page: the dark half (logo, title, constellation) on the left and the Papier half
 *  on the right, which holds a form. Shared by "/" (sign-in) and "/logowanie" (sign-in and registration), so the
 *  form is always on the right and moving between the two pages keeps the screen in place.
 *
 *  - `title`: "heading" makes the hero title the page's h1 (the landing page). "text" keeps the same look without a
 *    heading, for pages whose h1 is the form's title.
 *  - `compact`: on phones and tablets (one column) show only the logo row, so the form comes first. Wide screens
 *    always show the full dark half.
 *  - `howHref`: where "Jak to działa" points ("#jak-to-dziala" on the landing page, "/#jak-to-dziala" elsewhere). */
export async function LandingHero({
  children,
  title = "heading",
  compact = false,
  howHref = "#jak-to-dziala",
}: {
  children: React.ReactNode;
  title?: "heading" | "text";
  compact?: boolean;
  howHref?: string;
}) {
  const t = await getTranslations("landing");
  const Title = title === "heading" ? "h1" : "p";
  const wide = compact ? "hidden min-[1080px]:flex" : "flex";

  return (
    <section
      aria-labelledby={title === "heading" ? "h1" : undefined}
      className="relative isolate grid min-h-svh grid-cols-1 min-[1080px]:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]"
    >
      {/* Sticky on wide screens: when the form is taller than the screen (registration), the title stays in view. */}
      <div
        style={vt("landing-hero")}
        className={`landing-dark relative isolate flex flex-col justify-between overflow-hidden bg-atrament px-[clamp(1.25rem,4vw,3.5rem)] pt-[clamp(1.25rem,3vw,2.5rem)] pb-[clamp(2rem,5vw,4rem)] text-papier min-[1080px]:sticky min-[1080px]:top-0 min-[1080px]:h-svh min-[1080px]:min-h-svh ${compact ? "" : "min-h-[70svh]"}`}
      >
        {/* Constellation render, held to the right so the text keeps its own dark ground. */}
        <picture aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <source srcSet="/landing/konstelacja.avif" type="image/avif" />
          <img src="/landing/konstelacja.webp" alt="" width={2000} height={1000} className="h-full w-full object-cover object-[72%_50%] max-[1079px]:object-[80%_30%] max-[1079px]:opacity-60" />
        </picture>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgb(20_20_20/0.97)_0%,rgb(20_20_20/0.78)_42%,rgb(20_20_20/0.1)_78%)] max-[1079px]:bg-[linear-gradient(180deg,rgb(20_20_20/0.25)_0%,rgb(20_20_20/0.85)_45%,rgb(20_20_20/0.98)_100%)]" />
        <Grain id="grain-hero" />
        {/* wrap-reverse: on a narrow phone the switch takes its own line above the logo, still at the right. */}
        <div className="flex flex-wrap-reverse items-center justify-between gap-4">
          {/* The logo: twice the header size. It is the thread between this screen and the app. */}
          <div style={vt("brand-logo")} className="shrink-0 py-1"><Logo inverted size={48} title={t("logo")} /></div>
          {/* Phones and tablets: one column, so the dark half's top right is the page's top right. */}
          <div className="ml-auto min-[1080px]:hidden"><LanguageSwitch dark /></div>
        </div>
        <div className={`${wide} mt-[clamp(3rem,8vh,6rem)] max-w-[34rem] flex-col`}>
          <p className="m-0 text-sm font-bold tracking-[0.18em] text-[#E4DDD2]">{t("eyebrow")}</p>
          <Title id={title === "heading" ? "h1" : undefined} className="mt-5 mb-0 font-display text-[clamp(2.75rem,6vw,5.5rem)] leading-[1.08] font-bold tracking-[-0.01em] text-papier [text-wrap:balance]">
            {t("heroTitle")}
          </Title>
          <p className="mt-6 mb-0 max-w-[48ch] text-[clamp(1.0625rem,1.3vw,1.25rem)] leading-[1.55] text-[#E4DDD2] [text-wrap:pretty]">
            {t("heroLead")}
          </p>
          <a href={howHref} className="mt-8 inline-flex min-h-11 w-fit items-center gap-3 rounded-full border-[1.5px] border-papier/60 pr-5 pl-4 font-bold text-papier no-underline transition-colors hover:border-papier hover:bg-white/10 hover:text-papier">
            {t("howTitle")}
            <Arrow />
          </a>
        </div>
        <p aria-hidden="true" className={`absolute top-1/2 right-3 m-0 hidden -translate-y-1/2 rotate-180 text-xs tracking-[0.2em] whitespace-nowrap text-[#E4DDD2]/70 [writing-mode:vertical-rl] min-[1080px]:block ${MONO}`}>
          {t("sideNote")}
        </p>
      </div>
      <div style={vt("landing-panel")} className="relative flex flex-col bg-papier px-[clamp(1rem,4vw,3.5rem)] py-[clamp(2rem,5vw,4rem)] min-[1080px]:pt-[clamp(1.25rem,3vw,2.5rem)]">
        <div className="aurora aurora-hero" aria-hidden="true"><span /><span /><span /></div>
        {/* Wide screens: top right corner of the page, level with the logo. In the flow, so the form never covers it. */}
        <div className="relative z-10 mt-2.5 mb-6 hidden self-end min-[1080px]:block">
          <LanguageSwitch />
        </div>
        <div className="relative mx-auto my-auto w-full max-w-[34rem]">{children}</div>
      </div>
    </section>
  );
}
