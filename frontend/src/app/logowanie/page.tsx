import { Logo } from "@/components/Logo";

const ROLES = [
  "Inwestorzy i firmy",
  "Instytucje publiczne",
  "Uczelnie",
  "Szkoły",
  "Startupy i przedsiębiorstwa",
  "Wynalazcy indywidualni",
];

// "Login Page" frame: content on the left, a 600px panel on the right (here: dark brand panel).
// Visual preview only. Real sign-in (task F11) calls /api/v1/auth/*.
export default function LoginPage() {
  return (
    <div className="grid min-h-[80vh] lg:grid-cols-[1fr_600px]">
      <section className="flex items-center justify-center px-6 py-12">
        <form className="w-full max-w-md space-y-5" action="/">
          <h1 style={{ fontSize: "2rem" }}>Zaloguj się</h1>
          <p className="text-kamien">Zaloguj się i wybierz rolę, aby zobaczyć karty innowacji. Chroni to własność intelektualną twórców.</p>

          <fieldset className="rounded-[var(--radius-card)] border border-krawedz bg-white p-5">
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
            <input id="email" type="email" autoComplete="email" className="h-12 w-full rounded-xl border-2 border-atrament bg-white px-4" />
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block font-bold">Rola</label>
            <select id="role" className="h-12 w-full rounded-xl border-2 border-atrament bg-white px-3">
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required className="mt-1 accent-granat" />
            <span>Akceptuję <a href="#">regulamin</a> (zakaz nadużywania własności intelektualnej) i <a href="#">informację o prywatności</a>.</span>
          </label>

          <button type="submit" className="h-12 w-full rounded-full bg-granat font-bold text-white hover:bg-atrament">
            Zaloguj się
          </button>
        </form>
      </section>

      <aside className="relative hidden flex-col justify-between overflow-hidden bg-atrament p-12 text-papier lg:flex">
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
