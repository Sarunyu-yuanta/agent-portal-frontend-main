import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, hasLocale, LOCALE_COOKIE, matchAcceptLanguage } from "@/i18n/config";
import { localeOf } from "@/i18n/locale-path";
import { utBasePath, utSegmentOf } from "@/lib/usability-test-path";

/**
 * Every app URL carries its language as the first segment. One that arrives
 * without it is redirected to the user's last choice (cookie), else the
 * browser's preference, else Thai — keeping the rest of the path and the query.
 * A URL that already has one passes through and refreshes the cookie, so the
 * next bare link opens in the same language.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const current = localeOf(pathname);

  if (current) {
    // USABILITY-TEST ONLY (temporary; revert after testing): `/…/ut-proposal`
    // and friends are an open modal over the page underneath (`markUtStep`).
    // Serve that page; the browser keeps the `/ut-*` URL.
    let response = NextResponse.next();
    if (utSegmentOf(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = utBasePath(pathname);
      response = NextResponse.rewrite(url);
    }
    if (request.cookies.get(LOCALE_COOKIE)?.value !== current) {
      response.cookies.set(LOCALE_COOKIE, current, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
    }
    return response;
  }

  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(cookie)
    ? cookie
    : (matchAcceptLanguage(request.headers.get("accept-language")) ?? DEFAULT_LOCALE);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, API routes and files with an extension
  // (`/icon.svg`, `/products/*.png`, `/insights/s1-*.svg` — the last shares a
  // prefix with the `/insights` route, which is why this goes by extension and
  // not by folder).
  matcher: ["/((?!_next/static|_next/image|api|.*\\..*).*)"],
};
