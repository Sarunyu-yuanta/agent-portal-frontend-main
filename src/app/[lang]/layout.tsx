import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import "@sarunyu/system-one/styles.css";
// After the design system's stylesheet, always — it overrides that sheet's sizes.
import "@/app/typography.css";
import { Noto_Sans_Thai } from "next/font/google";
import { cn } from "@/lib/utils";
import { hasLocale, LOCALES } from "@/i18n/config";
import { I18nProvider } from "@/i18n/I18nProvider";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Yuanta Agent Portal",
  description: "AI-Powered Relationship Manager Platform for Wealth Management",
};

/** Both languages are known at build time. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

/**
 * The root layout — one per language, chosen by the first path segment.
 * `src/proxy.ts` guarantees every app URL arrives with a valid prefix; one that
 * still doesn't (a typo like `/fr/...`) is a 404.
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ lang: string }> }>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang} className={cn("h-full", "font-sans", notoSansThai.variable)}>
      <body className="h-full bg-background antialiased">
        <I18nProvider locale={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
