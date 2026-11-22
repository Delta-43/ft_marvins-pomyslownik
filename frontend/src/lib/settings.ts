/** Display settings (DESIGN.md §1 contrast modes, §2 text size): kept in one cookie and rendered by the server as
 *  attributes on <html>, so there is never a flash of the wrong theme. `prefers-contrast` applies when the setting is
 *  "auto". */
export const SETTINGS_COOKIE = "pomyslownik_display";
export const TEXT_SIZES = ["100", "125", "150"] as const;
export const CONTRASTS = ["auto", "high", "low"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];
export type Contrast = (typeof CONTRASTS)[number];
export type DisplaySettings = { text: TextSize; contrast: Contrast };
export const DEFAULT_SETTINGS: DisplaySettings = { text: "100", contrast: "auto" };

export function parseSettings(raw: string | undefined): DisplaySettings {
  const [text, contrast] = (raw ?? "").split("|");
  return {
    text: (TEXT_SIZES as readonly string[]).includes(text) ? (text as TextSize) : "100",
    contrast: (CONTRASTS as readonly string[]).includes(contrast) ? (contrast as Contrast) : "auto",
  };
}
export const serializeSettings = (s: DisplaySettings) => `${s.text}|${s.contrast}`;
