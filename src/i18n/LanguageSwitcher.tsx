"use client";

import { Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LOCALE_COOKIE, LOCALES, type Locale } from "./config";
import { useLocale, useT } from "./I18nProvider";
import { localizePath } from "./locale-path";

const LABEL: Record<Locale, string> = { th: "TH", en: "EN" };

function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

/**
 * TH | EN. Swaps the language prefix of the current URL and keeps everything
 * else — path, query string, open panel — so switching language never loses
 * the IC's place. Also writes the cookie the proxy reads, so a bare link
 * opened later lands in the same language.
 *
 * Uses Next's own router (not `useLocalizedRouter`), because the whole point
 * is to go to a *different* locale than the current one.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  // `useSearchParams` needs a Suspense boundary, or the page it sits on can't
  // be prerendered. The fallback is empty for the instant before hydration.
  return (
    <Suspense fallback={null}>
      <Switcher className={className} />
    </Suspense>
  );
}

function Switcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useT();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const search = useSearchParams()?.toString();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    rememberLocale(next);
    const target = localizePath(pathname, next);
    router.replace(search ? `${target}?${search}` : target, { scroll: false });
  };

  return (
    <div
      role="group"
      aria-label={t.nav.language}
      className={`inline-flex items-center rounded-lg bg-[var(--bg-default-secondary)] p-0.5 ${className ?? ""}`}
    >
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === locale}
          onClick={() => switchTo(l)}
          className={`min-w-9 cursor-pointer rounded-md px-2 py-1 text-[length:12px] font-semibold transition-colors ${
            l === locale
              ? "bg-card text-[var(--text-brand-primary)] shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LABEL[l]}
        </button>
      ))}
    </div>
  );
}
