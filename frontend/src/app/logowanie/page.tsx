import Link from "next/link";
import { Logo } from "@/components/Logo";
import { enterDemoMode, register, signIn } from "@/app/actions/auth";
import { api, errorMessage, t, type Schemas } from "@/lib/api";

const ORG_TYPES: [Schemas["OrganisationType"], string][] = [
  ["university", "Uczelnia"], ["research_institute", "Instytut badawczy"], ["school", "Szkoła"],
  ["local_government", "Samorząd"], ["public_institution", "Instytucja publiczna"], ["company", "Firma"],
  ["startup", "Startup"], ["incubator", "Inkubator"], ["investor", "Inwestor"], ["individual", "Osoba prywatna"], ["other", "Inne"],
];

const field = "h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-4 shadow-inner transition focus:border-granat focus:bg-white";

type Params = { next?: string; tryb?: string; blad?: string; id?: string };

// "Login Page" frame. Sign-in and registration with the sandbox provider ("test identity").
// Public endpoints only (/auth/providers, /audiences). No card data here.
export default async function LoginPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { next = "/szukaj", tryb, blad, id = "" } = await searchParams;
  const mode = tryb === "rejestracja" ? "rejestracja" : "logowanie";

  const [providers, audiences] = await Promise.all([
    api<{ data: Schemas["AuthProvider"][] }>("/api/v1/auth/providers").then((r) => r.data).catch(() => null),
    api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => null),
  ]);
  const sandbox = providers?.find((p) => p.id === "sandbox_id" && p.enabled);
  const apiDown = !providers || !audiences;

  const tab = (m: string, label: string) => (
    <Link
      href={`/logowanie?tryb=${m}&next=${encodeURIComponent(next)}`}
      aria-current={mode === m ? "page" : undefined}
      className={`flex-1 rounded-full px-4 py-2 text-center font-bold no-underline ${mode === m ? "btn-liquid" : "text-atrament hover:bg-white/60"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_520px]">
      <section className="glass flex items-center justify-center rounded-[2.5rem] px-6 py-12">
        <div className="w-full max-w-md space-y-5">
          <h1 style={{ fontSize: "2rem" }}>{mode === "logowanie" ? "Zaloguj się" : "Załóż konto"}</h1>
          <p className="text-kamien">Zaloguj się i wybierz rolę, aby zobaczyć karty innowacji. Chroni to własność intelektualną twórców.</p>

          <nav aria-label="Logowanie lub rejestracja" className="flex gap-1 rounded-full bg-white/50 p-1 ring-1 ring-white/80">
            {tab("logowanie", "Mam konto")}
            {tab("rejestracja", "Nowe konto")}
          </nav>

          {blad && (
            <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">
              <span aria-hidden="true">⚠ </span>{errorMessage(blad)}
            </p>
          )}
          {apiDown && (
            <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">
              Serwer jest chwilowo niedostępny. Spróbuj ponownie za chwilę.
            </p>
          )}

          <form action={enterDemoMode}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" disabled={!sandbox} className="h-12 w-full cursor-pointer rounded-full border-2 border-dashed border-atrament/60 bg-white/40 font-bold text-atrament transition hover:bg-iskra disabled:opacity-50">
              Wejdź w tryb demo
            </button>
            <p className="mt-2 text-center text-xs text-kamien">Jedno kliknięcie: wspólne konto testowe, prawdziwe dane.</p>
          </form>

          <div className="rounded-[var(--radius-card)] border border-white/80 bg-white/60 p-4 text-sm">
            <strong>{sandbox ? t(sandbox.label) : "Tożsamość testowa"}</strong>
            <span className="block text-kamien">
              Tryb demonstracyjny. Wpisz dowolny identyfikator (np. „demo-anna”). To nie jest weryfikacja przez login.gov.pl.
            </span>
          </div>

          {mode === "logowanie" ? (
            <form action={signIn} className="space-y-5">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="providerSubject" className="mb-1 block font-bold">Identyfikator testowy</label>
                <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
              </div>
              <button type="submit" disabled={!sandbox} className="btn-liquid h-12 w-full cursor-pointer rounded-full font-bold disabled:opacity-50">
                Zaloguj się
              </button>
            </form>
          ) : (
            <form action={register} className="space-y-5">
              <input type="hidden" name="next" value={next} />
              <div>
                <label htmlFor="providerSubject" className="mb-1 block font-bold">Identyfikator testowy</label>
                <input id="providerSubject" name="providerSubject" required minLength={3} maxLength={200} defaultValue={id} autoComplete="username" className={`${field} font-tech`} />
                <p className="mt-1 text-xs text-kamien">3–200 znaków. Nie podawaj numeru PESEL.</p>
              </div>
              <div>
                <label htmlFor="email" className="mb-1 block font-bold">E-mail</label>
                <input id="email" name="email" type="email" required autoComplete="email" className={field} />
              </div>
              <div>
                <label htmlFor="role" className="mb-1 block font-bold">Rola</label>
                <select id="role" name="role" required className={field}>
                  {(audiences ?? []).map((a) => <option key={a.id} value={a.id}>{t(a.label)}</option>)}
                </select>
                <p className="mt-1 text-xs text-kamien">Rola ustawia domyślne filtry wyszukiwania. Zmienisz ją w profilu.</p>
              </div>
              <fieldset className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <legend className="mb-1 font-bold">Organizacja</legend>
                <div>
                  <label htmlFor="affiliationName" className="sr-only">Nazwa organizacji</label>
                  <input id="affiliationName" name="affiliationName" required maxLength={200} placeholder="Nazwa" autoComplete="organization" className={field} />
                </div>
                <div>
                  <label htmlFor="affiliationType" className="sr-only">Typ organizacji</label>
                  <select id="affiliationType" name="affiliationType" defaultValue="other" className={field}>
                    {ORG_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-1 font-bold">Zainteresowania <span className="font-normal text-kamien">(opcjonalnie)</span></legend>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {[["technological", "Technologia"], ["educational", "Edukacja"], ["administrative", "Administracja"]].map(([v, l]) => (
                    <label key={v} className="flex items-center gap-2"><input type="checkbox" name="interests" value={v} className="accent-granat" /> {l}</label>
                  ))}
                </div>
              </fieldset>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="acceptedTerms" required className="mt-1 accent-granat" />
                <span>Akceptuję <a href="#">regulamin</a> (zakaz nadużywania własności intelektualnej) i <a href="#">informację o prywatności</a>.</span>
              </label>
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" name="consentToContact" className="mt-1 accent-granat" />
                <span>Zgadzam się na kontakt w sprawie pasujących innowacji (opcjonalnie).</span>
              </label>
              <button type="submit" disabled={!sandbox || !audiences} className="btn-liquid h-12 w-full cursor-pointer rounded-full font-bold disabled:opacity-50">
                Załóż konto
              </button>
            </form>
          )}
        </div>
      </section>

      <aside className="glass-dark relative hidden flex-col justify-between overflow-hidden rounded-[2.5rem] p-12 text-papier lg:flex">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-iskra/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-laboratoria/30 blur-3xl" />
        <Logo inverted />
        <div>
          <p className="font-display text-4xl font-bold leading-tight">
            Polskie innowacje<br />w <span className="bg-iskra px-1 text-atrament">jednym miejscu</span>.
          </p>
          <p className="mt-4 text-papier/80">Uczelnie, patenty, laboratoria i startupy z całej Polski. Ze źródłami.</p>
        </div>
        <svg viewBox="0 0 400 260" className="w-full opacity-80" aria-hidden="true">
          {[[40, 200, 140, 110], [140, 110, 260, 150], [260, 150, 350, 60], [140, 110, 200, 30], [260, 150, 300, 230]].map(([a, b, c, d], i) => (
            <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="#F7F2EB" strokeOpacity=".4" strokeWidth="2" />
          ))}
          {[[40, 200], [140, 110], [260, 150], [350, 60], [200, 30], [300, 230]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 2 ? 12 : 7} fill={i === 2 ? "#FFD93D" : "#F7F2EB"} />
          ))}
        </svg>
      </aside>
    </div>
  );
}
