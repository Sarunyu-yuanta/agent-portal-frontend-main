"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import th, { type Dictionary } from "@/i18n/dictionaries/th";
import en from "@/i18n/dictionaries/en";
import { createFormat, type Format } from "./format";

/**
 * Both dictionaries ship in the bundle: they are small, and loading one
 * lazily would put a loading state in front of every label on the page.
 */
export const DICTIONARIES: Record<Locale, Dictionary> = { th, en };

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/**
 * Mounted once in `app/[lang]/layout.tsx` with the locale from the URL. The
 * locale is known on the server, so the first render — SSR included — is
 * already in the right language; nothing is detected after mount.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** The current locale — `"th"` or `"en"`. */
export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** The current language's strings: `const t = useT(); t.states.retry`. */
export function useT(): Dictionary {
  return DICTIONARIES[useLocale()];
}

/** Date/time/number formatters bound to the current language. */
export function useFormat(): Format {
  const locale = useLocale();
  return useMemo(() => createFormat(locale), [locale]);
}
