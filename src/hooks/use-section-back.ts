"use client";

import { useCallback } from "react";
import { useAppPathname, useLocalizedRouter } from "@/i18n/navigation";
import { catalogListUrl, crossSectionReferrer, parentTrailUrl } from "@/lib/nav-memory";
import {
  catalogCategoryForPath,
  catalogListHref,
  CATALOG_PATH,
} from "@/lib/product-catalog-routes";

/**
 * Where a page's back button lands when there's no trail behind it — a pasted
 * link, or a session restored straight onto a detail page.
 *
 * Derived from the route so no page has to declare it. Catalog routes that
 * belong to exactly one tab go back to that tab; the rest fall back to the
 * remembered list, which is the best available guess at where they came from.
 */
function sectionRoot(pathname: string): string {
  if (pathname.startsWith(`${CATALOG_PATH}/`)) {
    const category = catalogCategoryForPath(pathname);
    return category ? catalogListHref(category) : catalogListUrl();
  }
  if (pathname.startsWith("/insights/")) return "/insights";
  if (pathname.startsWith("/promotions/")) return "/promotions";
  if (pathname.startsWith("/client/")) return "/client-hub";
  return "/";
}

/**
 * The handler for an in-page back button: goes **up one level** along the
 * breadcrumb trail, not back through browser history.
 *
 * The two differ whenever the user reached this page from outside its section —
 * opening a bond detail from Client 360, or resuming into one from the sidebar.
 * `router.back()` would leave the section entirely; the trail keeps them inside
 * it, which is what a breadcrumb-shaped back button promises.
 *
 * Always pushes rather than rewinding through browser history: our own trail
 * is the source of truth for "one level up," and it can legitimately disagree
 * with the browser's real history stack — a sidebar smart-resume, a manual
 * browser back/forward, or a `replace()` elsewhere all change what's actually
 * behind this page without changing what our trail says is *above* it. Relying
 * on `router.back()` whenever the two happened to match previously meant a
 * single mismatch (say, a stale `previousVisit()`) could send the user
 * somewhere our own trail never pointed at — pushing our own computed target
 * is what makes the button keep the promise its breadcrumb makes.
 *
 * @param getFallback Overrides {@link sectionRoot} for the cold-entry case.
 *   Called at click time, since resolving it may read storage.
 */
export function useSectionBack(getFallback?: (pathname: string) => string) {
  const router = useLocalizedRouter();
  const pathname = useAppPathname();

  return useCallback(() => {
    // Cross-section entry — e.g. Product Catalog → House View insight detail.
    const referrer = crossSectionReferrer(pathname);
    if (referrer) {
      router.push(referrer);
      return;
    }

    const fallback = (getFallback ?? sectionRoot)(pathname);
    const parent = parentTrailUrl(pathname, fallback);
    router.push(parent);
  }, [router, pathname, getFallback]);
}
