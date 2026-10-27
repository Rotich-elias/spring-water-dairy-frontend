import { createI18n } from "vue-i18n";

import en from "@/locales/en.json";
import sw from "@/locales/sw.json";

export const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: { en, sw },
  missingWarn: false,
  fallbackWarn: false,
});
