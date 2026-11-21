import { deleteAccount, updateRole } from "@/app/actions/auth";
import { api, errorMessage, t, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";

// Profile: GET /me, change role (PATCH /me), delete account (DELETE /me, GDPR). Signed-in only.
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ blad?: string; zapisano?: string }> }) {
  const { blad, zapisano } = await searchParams;
  const [me, audiences] = await Promise.all([
    authed<{ data: Schemas["User"] }>("/api/v1/me", "/profil").then((r) => r.data),
    api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => []),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1 style={{ fontSize: "2rem" }}>Profil</h1>
      {blad && <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">⚠ {errorMessage(blad)}</p>}
      {zapisano && <p role="status" className="rounded-xl border-l-4 border-tak bg-white/80 px-4 py-3 text-sm">✓ Zapisano.</p>}

      <section className="glass space-y-2 rounded-[var(--radius-card)] p-6">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-kamien">E-mail</dt><dd>{me.email}</dd>
          <dt className="text-kamien">Organizacja</dt><dd>{me.affiliation.name}</dd>
          <dt className="text-kamien">Tożsamość</dt>
          <dd>{me.identityVerified ? "Zweryfikowana" : <><strong>Tożsamość testowa</strong> (niezweryfikowana)</>}</dd>
          <dt className="text-kamien">Konto od</dt><dd className="font-tech">{new Date(me.createdAt).toLocaleDateString("pl-PL")}</dd>
        </dl>
      </section>

      <form action={updateRole} className="glass space-y-3 rounded-[var(--radius-card)] p-6">
        <label htmlFor="role" className="block font-bold">Rola</label>
        <select id="role" name="role" defaultValue={me.role} className="h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-3">
          {audiences.map((a) => <option key={a.id} value={a.id}>{t(a.label)}</option>)}
        </select>
        <button type="submit" className="btn-liquid cursor-pointer rounded-full px-6 py-2 font-bold">Zapisz rolę</button>
      </form>

      <form action={deleteAccount} className="glass space-y-3 rounded-[var(--radius-card)] border-nie/40 p-6">
        <h2 style={{ fontSize: "1.25rem" }}>Usuń konto</h2>
        <p className="text-sm text-kamien">Usuwa konto i wszystkie Twoje dane osobowe. Tej operacji nie można cofnąć.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" required className="accent-granat" /> Rozumiem, usuń moje konto.</label>
        <button type="submit" className="cursor-pointer rounded-full bg-nie px-6 py-2 font-bold text-white">Usuń konto</button>
      </form>
    </div>
  );
}
