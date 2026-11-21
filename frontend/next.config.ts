import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const config: NextConfig = {
  output: "standalone",
};

// Translations: messages/pl.json and messages/en.json, loaded by src/i18n/request.ts.
export default createNextIntlPlugin("./src/i18n/request.ts")(config);
