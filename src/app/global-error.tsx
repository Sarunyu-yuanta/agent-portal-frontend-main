"use client";

import { useEffect } from "react";
import "./globals.css";
import "@sarunyu/system-one/styles.css";
import "./typography.css";
import { ErrorState } from "@/components/ui/empty-state";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { DICTIONARIES } from "@/i18n/I18nProvider";
import { localeOf } from "@/i18n/locale-path";

/**
 * An error in the root layout itself — the last line of defence. It replaces
 * the root layout, so it brings its own `<html>`/`<body>` and stylesheets.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  // Outside every layout, so no provider: read the language off the URL.
  const locale =
    (typeof window !== "undefined" && localeOf(window.location.pathname)) || DEFAULT_LOCALE;
  const t = DICTIONARIES[locale];

  return (
    <html lang={locale}>
      <body className="flex min-h-screen items-center justify-center bg-[var(--bg-default-secondary)] antialiased">
        <title>{`${t.globalError.title} · Yuanta Agent Portal`}</title>
        <ErrorState
          title={t.globalError.title}
          body={t.globalError.body}
          onRetry={() => unstable_retry()}
        />
      </body>
    </html>
  );
}
