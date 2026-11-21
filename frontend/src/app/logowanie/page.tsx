import { Logo } from "@/components/Logo";
import { enterDemoMode } from "@/app/actions/auth";

const ROLES = [
  "Inwestorzy i firmy",
  "Instytucje publiczne",
  "Uczelnie",
  "Szkoły",
  "Startupy i przedsiębiorstwa",
  "Wynalazcy indywidualni",
];

// "Login Page" frame: content on the left, a 600px panel on the right (here: dark brand panel).
// Real sign-in (task F11) calls /api/v1/auth/* and sets the session cookie. Not wired yet.
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/szukaj" } = await searchParams;
  return (
    <div className="mx-auto grid min-h-[80vh] max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_520px]">
      <section className="glass flex items-center justify-center rounded-[2.5rem] px-6 py-12">
        <div className="w-full max-w-md space-y-5">
        <form className="space-y-5" action="/logowanie">
          <h1 style={{ fontSize: "2rem" }}>Zaloguj się</h1>
          <p className="text-kamien">Zaloguj się i wybierz rolę, aby zobaczyć karty innowacji. Chroni to własność intelektualną twórców.</p>

          <fieldset className="rounded-[var(--radius-card)] border border-white/80 bg-white/60 p-5">
            <legend className="px-1 font-bold">Dostawca tożsamości</legend>
            <label className="flex items-start gap-3">
              <input type="radio" name="provider" defaultChecked className="mt-1.5 accent-granat" />
              <span>
                <strong>Tożsamość testowa</strong>
                <span className="block text-sm text-kamien">Tryb demonstracyjny. To nie jest weryfikacja przez login.gov.pl.</span>
              </span>
            </label>
          </fieldset>

          <div>
            <label htmlFor="email" className="mb-1 block font-bold">E-mail</label>
            <input id="email" type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-4 shadow-inner transition focus:border-granat focus:bg-white" />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block font-bold">Rola</label>
            <select id="role" className="h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-3 shadow-inner transition focus:border-granat focus:bg-white">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-1 accent-granat" />
            <span>Akceptuję <a href="#">regulamin</a> (zakaz nadużywania własności intelektualnej) i <a href="#">informację o prywatności</a>.</span>
          </label>

          <button type="submit" className="btn-liquid h-12 w-full cursor-pointer rounded-full font-bold">
            Zaloguj się
          </button>
        </form>

        {/* TEMPORARY: demo mode for building without the backend. Remove before release (with DEMO_COOKIE). */}
        <form action={enterDemoMode} className="border-t border-dashed border-krawedz pt-5">
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="h-12 w-full cursor-pointer rounded-full border-2 border-dashed border-atrament/60 bg-white/40 font-bold text-atrament transition hover:bg-iskra">
            Wejdź w tryb demo
          </button>
          <p className="mt-2 text-center text-xs text-kamien">Tylko na czas budowy: pomija logowanie, dane przykładowe.</p>
        </form>
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
