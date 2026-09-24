"use client";

import { usePathname } from "next/navigation";
import { useClients } from "@/hooks/use-api";
import { usePrivacy } from "@/contexts/privacy-context";
import { usePageBreadcrumb, type Crumb } from "./page-breadcrumbs";

/**
 * Everything the dashboard shell needs to know about the page inside it, all
 * derived from the route.
 *
 * Kept out of `layout.tsx` so that file stays structure — these are facts about
 * pages, and they grow every time a page is added.
 */
export type PageChrome = {
  /** Header title, or `null` when a breadcrumb takes its place. */
  title: string | null;
  breadcrumb: Crumb[] | null;
  isCommandCenter: boolean;
  isPerformance: boolean;
  /** Page paints its own padding and bleeds to the edges. */
  isFullWidth: boolean;
  /**
   * Below `xl`: no page title above the content, and no padding around it —
   * the page runs edge to edge.
   *
   * Separate from `isFullWidth`, which does the same thing at every size. This
   * is for a page that *is* a single full-height surface rather than a document
   * on a background: on a phone the frame around it costs real estate and the
   * heading repeats what the surface already makes obvious, while on a desktop
   * both still earn their place.
   */
  isMobileFullBleed: boolean;
  /** Page fills the viewport below the top bar and scrolls inside itself. */
  isFullHeight: boolean;
  /**
   * Uses the full content width (no `max-w-[1280px]`) while keeping the
   * standard page padding — for layouts that carry their own right rail.
   */
  isWideContent: boolean;
  /** Page renders its own mobile breadcrumb; the layout must not add another. */
  ownsMobileBreadcrumb: boolean;
  /** Page content starts on white rather than `main`'s gray-50. */
  contentTopIsWhite: boolean;
};

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/command-center": "Command Center",
  "/client-hub": "Client 360",
  "/pipeline": "Pipeline",
  "/ai-insights": "AI Insights",
  "/promotions": "Promotion/Events",
  // Was "Performance & Targets" while the built dashboard was live — restore
  // that alongside `performance/page.tsx` when it comes back off hold.
  "/performance": "Performance",
  "/compliance": "Compliance & Risk",
  "/insights": "Insights",
  "/ic-learning": "IC Learning",
  "/product-catalog": "Product Catalog",
  "/notes": "Notes",
  "/calendar": "Calendar",
};

/**
 * Routes whose content starts on white instead of `main`'s own gray-50.
 *
 * The mobile breadcrumb leads straight into that content, so it takes the same
 * surface rather than showing up as a band above it. Everything not listed here
 * already starts on gray-50 (`--bg-default-secondary`), which is exactly what
 * `main` paints — so the strip needs no background of its own there.
 *
 * Each entry mirrors the top-level background of the component that renders the
 * route; keep them in step.
 */
const WHITE_CONTENT_TOP = [
  /^\/product-catalog\/top-idea(\/|$)/, // TopIdeaAllPage, TopIdeaDetail
  /^\/product-catalog\/investment-solution\//, // InvestmentSolutionDetail
  /^\/product-catalog\/global-bond(\/|$)/, // GlobalBondAllPage, GlobalBondDetail
  /^\/product-catalog\/product$/, // StructuredProductAllPage
  /^\/product-catalog\/mutual-fund\//, // MutualFundDetail, top performers list
  /^\/product-catalog\/robo-advisory(\/|$)/, // RoboAdvisoryDetail
  /^\/product-catalog\/definit(\/|$)/, // DefinitDetail
];

export function usePageChrome(): PageChrome {
  const pathname = usePathname();
  const clients = useClients();
  const { isPrivate } = usePrivacy();

  const breadcrumb = usePageBreadcrumb(pathname, { clients, isPrivate });
  // Longest prefix wins, so `/client-hub` doesn't shadow a deeper entry.
  const titleKey = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));

  return {
    // A breadcrumb replaces the title — its leaf already names the page, and
    // the section name is the rung above it.
    title: breadcrumb ? null : titleKey ? PAGE_TITLES[titleKey] : "",
    breadcrumb,
    isCommandCenter: pathname.startsWith("/command-center"),
    isPerformance: pathname.startsWith("/performance"),
    isFullWidth:
      pathname.startsWith("/product-catalog") ||
      pathname.startsWith("/client-hub"),
    // The same two pages `isFullHeight` covers: each is one full-height surface
    // rather than a document on a background, which is exactly the shape that
    // gains nothing from a frame and a heading on a phone.
    isMobileFullBleed: pathname === "/notes" || pathname === "/calendar",
    // Notes and Calendar are both master/detail-style surfaces, not documents —
    // they own the whole area below the top bar and scroll internally.
    isFullHeight: pathname === "/notes" || pathname === "/calendar",
    isWideContent: pathname === "/dashboard",
    // Full Profile puts the breadcrumb inside its own sticky identity bar (and
    // pulls itself up over the layout's padding to do it), so a second one
    // above would overlap.
    ownsMobileBreadcrumb:
      pathname.startsWith("/client/") ||
      pathname === "/product-catalog/robo-advisory" ||
      pathname === "/product-catalog/definit",
    contentTopIsWhite: WHITE_CONTENT_TOP.some((re) => re.test(pathname)),
  };
}
