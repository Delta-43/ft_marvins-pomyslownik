import { getTranslations } from "next-intl/server";

/** The one help address for every page (WCAG 3.2.6): `HELP_URL` from the environment, else the `shell.helpUrl`
 *  message. The message is still a placeholder; the real address comes from the team (TASKS.md A5). */
export async function helpHref(): Promise<string> {
  return process.env.HELP_URL?.trim() || (await getTranslations("shell"))("helpUrl");
}
