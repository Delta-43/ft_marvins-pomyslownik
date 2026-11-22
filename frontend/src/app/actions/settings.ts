"use server";

import { cookies } from "next/headers";
import { CONTRASTS, SETTINGS_COOKIE, serializeSettings, TEXT_SIZES, type Contrast, type TextSize } from "@/lib/settings";

/** Footer display settings. Saved for a year; the page re-renders with the new attributes on <html>. */
export async function setDisplaySettings(form: FormData) {
  const text = String(form.get("text") ?? "100");
  const contrast = String(form.get("contrast") ?? "auto");
  if (!(TEXT_SIZES as readonly string[]).includes(text) || !(CONTRASTS as readonly string[]).includes(contrast)) return;
  (await cookies()).set(SETTINGS_COOKIE, serializeSettings({ text: text as TextSize, contrast: contrast as Contrast }), {
    path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365,
  });
}
