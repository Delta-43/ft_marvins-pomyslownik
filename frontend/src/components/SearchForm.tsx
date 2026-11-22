"use client";

/** The search form itself (client): intercepts the submit and navigates with a transition type, so the results
 *  page arrives with the right move (search → results from the search page; a list dip on the results page).
 *  Without JavaScript the GET form submits to /wyniki as before. */
import { usePathname, useRouter } from "next/navigation";
import { T } from "@/components/motion/Motion";

export function SearchForm({ label, placeholder, submit, defaultValue = "", large = false }: {
  label: string; placeholder: string; submit: string; defaultValue?: string; large?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (new FormData(e.currentTarget).get("q") as string).trim();
    const href = q ? `/wyniki?q=${encodeURIComponent(q)}` : "/wyniki";
    router.push(href, { transitionTypes: [pathname === "/wyniki" ? T.filter : T.search] });
  };
  return (
    <form action="/wyniki" role="search" onSubmit={onSubmit} className="w-full">
      <label htmlFor="q" className="sr-only">{label}</label>
      <div className={`flex items-center gap-2 glass-strong rounded-full py-2 pr-2 pl-4 transition-shadow duration-200 sm:pl-6 focus-within:shadow-[0_0_0_4px_rgb(0_133_204/0.22),0_10px_40px_-12px_rgb(0_133_204/0.35)] ${large ? "h-16 sm:h-20 sm:py-2.5 sm:pr-2.5" : "h-14"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0 text-kamien">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <input
          id="q"
          name="q"
          type="search"
          autoComplete="off"
          maxLength={200}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-kamien ${large ? "text-lg sm:text-xl" : "text-base"}`}
        />
        {/* The button fills the bar's height minus one even inset (py = pr above), so the gap to the edge is the same on top, right and bottom. */}
        <button type="submit" className={`btn-primary flex shrink-0 cursor-pointer items-center self-stretch rounded-full px-5 font-bold transition-transform active:scale-[0.97] sm:px-7 ${large ? "sm:text-lg" : ""}`}>
          {submit}
        </button>
      </div>
    </form>
  );
}
