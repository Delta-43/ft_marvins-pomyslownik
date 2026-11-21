/** Search bar from the Search Page frame (800×80, pill). Plain GET form, so it works without JavaScript. */
export function SearchBar({ defaultValue = "", large = false }: { defaultValue?: string; large?: boolean }) {
  return (
    <form action="/wyniki" role="search" className="w-full">
      <label htmlFor="q" className="sr-only">Szukaj innowacji</label>
      <div className={`flex items-center gap-2 glass-strong rounded-full pl-6 pr-2 transition-shadow focus-within:shadow-[0_0_0_4px_rgb(27_63_143/0.25),0_10px_40px_-12px_rgb(27_63_143/0.35)] ${large ? "h-20" : "h-14"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
          <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
        <input
          id="q"
          name="q"
          defaultValue={defaultValue}
          placeholder="Szukaj zespołów, patentów, laboratoriów…"
          className={`flex-1 bg-transparent outline-none placeholder:text-kamien ${large ? "text-xl" : "text-base"}`}
        />
        <button type="submit" className="btn-liquid cursor-pointer rounded-full px-6 py-2.5 font-bold">
          Szukaj
        </button>
      </div>
    </form>
  );
}
