"use client";

/**
 * Locale-aware stand-ins for `next/link` and `next/navigation`.
 *
 * App code keeps writing unprefixed paths (`/client-hub`, `catalogListHref(…)`)
 * and reading unprefixed paths; these add and remove the `/th` · `/en` prefix
 * at the edge. Import them instead of the Next originals:
 *
 * - `LocaleLink` for `next/link`'s `Link`
 * - `useLocalizedRouter` for `useRouter`
 * - `useAppPathname` for `usePathname`
 */

import { forwardRef, useMemo, type ComponentProps } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "./I18nProvider";
import { localizePath, stripLocale } from "./locale-path";

/** `usePathname()` without the locale prefix — `/en/client-hub` → `/client-hub`. */
export function useAppPathname(): string {
  return stripLocale(usePathname() ?? "/");
}

/** `useRouter()` whose `push`/`replace`/`prefetch` add the current locale. */
export function useLocalizedRouter(): ReturnType<typeof useRouter> {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(
    () => ({
      ...router,
      push: (href, options) => router.push(localizePath(href, locale), options),
      replace: (href, options) => router.replace(localizePath(href, locale), options),
      prefetch: (href, options) => router.prefetch(localizePath(href, locale), options),
    }),
    [router, locale],
  );
}

type LinkProps = ComponentProps<typeof NextLink>;

/** `next/link` with the current locale added to a string `href`. */
export const LocaleLink = forwardRef<HTMLAnchorElement, LinkProps>(function LocaleLink(
  { href, ...rest },
  ref,
) {
  const locale = useLocale();
  const localized = typeof href === "string" ? localizePath(href, locale) : href;
  return <NextLink ref={ref} href={localized} {...rest} />;
});
