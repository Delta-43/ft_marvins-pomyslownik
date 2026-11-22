import { getLocale, getTranslations } from "next-intl/server";
import { AppPage } from "@/components/motion/Motion";
import { deleteAccount, updateRole } from "@/app/actions/auth";
import { api, errorKey, pick, type Schemas } from "@/lib/api";
import { authed } from "@/lib/session";
import { DateValue } from "@/components/CardBits";

// Profile: GET /me, change role (PATCH /me), delete account (DELETE /me, GDPR). Signed-in only.
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ blad?: string; zapisano?: string }> }) {
  const { blad, zapisano } = await searchParams;
  const [t, tErr, locale] = await Promise.all([getTranslations("profile"), getTranslations("errors"), getLocale()]);
  const [me, audiences] = await Promise.all([
    authed<{ data: Schemas["User"] }>("/api/v1/me", "/profil").then((r) => r.data),
    api<{ data: Schemas["Audience"][] }>("/api/v1/audiences").then((r) => r.data).catch(() => []),
  ]);

  return (
    <AppPage>
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-10">
      <h1 style={{ fontSize: "2rem" }}>{t("title")}</h1>
      {blad && <p role="alert" className="rounded-xl border-l-4 border-nie bg-white/80 px-4 py-3 text-sm">⚠ {tErr(errorKey(blad))}</p>}
      {zapisano && <p role="status" className="rounded-xl border-l-4 border-tak bg-white/80 px-4 py-3 text-sm">{t("saved")}</p>}

      <section className="glass space-y-2 rounded-[var(--radius-card)] p-6">
        <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
          <dt className="text-kamien">{t("email")}</dt><dd>{me.email}</dd>
          <dt className="text-kamien">{t("organisation")}</dt><dd>{me.affiliation.name}</dd>
          <dt className="text-kamien">{t("identity")}</dt>
          <dd>{me.identityVerified ? t("verified") : <><strong>{t("testIdentity")}</strong> {t("unverified")}</>}</dd>
          <dt className="text-kamien">{t("memberSince")}</dt><dd><DateValue iso={me.createdAt} /></dd>
        </dl>
      </section>

      <form action={updateRole} className="glass space-y-3 rounded-[var(--radius-card)] p-6">
        <label htmlFor="role" className="block font-bold">{t("role")}</label>
        <select id="role" name="role" defaultValue={me.role} className="h-12 w-full rounded-xl border border-atrament/30 bg-white/75 px-3">
          {audiences.map((a) => <option key={a.id} value={a.id}>{pick(a.label, locale)}</option>)}
        </select>
        <button type="submit" className="btn-primary cursor-pointer rounded-full px-6 py-2 font-bold">{t("saveRole")}</button>
      </form>

      <form action={deleteAccount} className="glass space-y-3 rounded-[var(--radius-card)] border-nie/40 p-6">
        <h2 style={{ fontSize: "1.25rem" }}>{t("deleteTitle")}</h2>
        <p className="text-sm text-kamien">{t("deleteText")}</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" required className="accent-granat" /> {t("deleteConfirm")}</label>
        <button type="submit" className="cursor-pointer rounded-full bg-nie px-6 py-2 font-bold text-white">{t("deleteButton")}</button>
      </form>
    </div>
    </AppPage>
  );
}
