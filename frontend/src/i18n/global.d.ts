// Type-checks every translation key against the Polish dictionary (the source of truth).
import type pl from "../../messages/pl.json";
import type { Locale } from "./locale";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof pl;
  }
}
