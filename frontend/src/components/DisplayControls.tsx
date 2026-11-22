import { cookies } from "next/headers";
import { setDisplaySettings } from "@/app/actions/settings";
import { CONTRASTS, parseSettings, SETTINGS_COOKIE, TEXT_SIZES } from "@/lib/settings";
import { fitter } from "@/components/Fit";

/** Text size and contrast (DESIGN.md §8 rule 10): two segmented groups, each a small form posting to
 *  `setDisplaySettings`, so they work without JavaScript. Used in the account menu, in the signed-out menu of the text
 *  pages and under the sign-in card on the landing. Every label reserves its longest translation (`fitter`). */
export async function DisplayControls({ idPrefix }: { idPrefix: string }) {
  const [store, ft] = await Promise.all([cookies(), fitter("shell")]);
  const settings = parseSettings(store.get(SETTINGS_COOKIE)?.value);
  const contrastLabel = { auto: ft("contrastAuto"), high: ft("contrastHigh"), low: ft("contrastLow") };
  return (
    <>
      <p className="menu-head" id={`${idPrefix}-text`}>{ft("textSize")}</p>
      <form className="seg" role="group" aria-labelledby={`${idPrefix}-text`} action={setDisplaySettings}>
        <input type="hidden" name="contrast" value={settings.contrast} />
        {TEXT_SIZES.map((v) => <button key={v} type="submit" name="text" value={v} aria-pressed={settings.text === v}>{v}%</button>)}
      </form>
      <p className="menu-head" id={`${idPrefix}-contrast`}>{ft("contrast")}</p>
      <form className="seg" role="group" aria-labelledby={`${idPrefix}-contrast`} action={setDisplaySettings}>
        <input type="hidden" name="text" value={settings.text} />
        {CONTRASTS.map((v) => <button key={v} type="submit" name="contrast" value={v} aria-pressed={settings.contrast === v}>{contrastLabel[v]}</button>)}
      </form>
    </>
  );
}
