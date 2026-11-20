"use client";

import { useAppPathname } from "@/i18n/navigation";
import {
  BrainIcon,
  AlarmIcon,
  CalendarBlankIcon,
  ChartBarIcon,
  ClipboardTextIcon,
  FunnelIcon,
  GaugeIcon,
  GraduationCapIcon,
  LayoutIcon,
  MegaphoneIcon,
  NotePencilIcon,
  ShieldCheckIcon,
  SquaresFourIcon,
  UsersIcon,
  UsersThreeIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useClients } from "@/hooks/use-api";
import { usePrivacy } from "@/contexts/privacy-context";
import { usePageBreadcrumb, type Crumb } from "./page-breadcrumbs";
import { useT } from "@/i18n/I18nProvider";

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
  /** Sidebar icon for the page title, when one is defined. */
  titleIcon: PhosphorIcon | null;
  breadcrumb: Crumb[] | null;
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
   * Page is one surface that runs to every edge of the content area at every
   * size: no shell padding and no 1280px cap. Unlike `isFullWidth` it keeps the
   * shell's own column sizing, so it combines with `isFullHeight`.
   */
  isEdgeToEdge: boolean;
  /** Page renders its own mobile breadcrumb; the layout must not add another. */
  ownsMobileBreadcrumb: boolean;
  /** Page content starts on white rather than `main`'s gray-50. */
  contentTopIsWhite: boolean;
};

const PAGE_TITLES: Record<string, string> = {
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
  "/yaa-team-head": "YAA/Team Head",
  "/product-catalog": "Product Catalog",
  "/orders": "Order Management",
  "/notes": "Notes",
  "/calendar": "Calendar",
  "/reminders": "Reminders",
};

/**
 * Mirrors the sidebar icon for routes that show a page title instead of a
 * breadcrumb. Non-sidebar routes pick the icon the page itself already leads
 * with, so the header stays recognisable even without a nav entry.
 */
const PAGE_ICONS = {
  "/command-center": LayoutIcon,
  "/client-hub": UsersIcon,
  "/pipeline": FunnelIcon,
  "/ai-insights": BrainIcon,
  "/promotions": MegaphoneIcon,
  "/performance": GaugeIcon,
  "/compliance": ShieldCheckIcon,
  "/insights": ChartBarIcon,
  "/ic-learning": GraduationCapIcon,
  "/yaa-team-head": UsersThreeIcon,
  "/product-catalog": SquaresFourIcon,
  "/orders": ClipboardTextIcon,
  "/notes": NotePencilIcon,
  "/calendar": CalendarBlankIcon,
  "/reminders": AlarmIcon,
} satisfies Record<keyof typeof PAGE_TITLES, PhosphorIcon>;

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
  /^\/product-catalog\/product-trending\//, // ProductTrendingAllTable
  /^\/product-catalog\/top-idea(\/|$)/, // TopIdeaAllPage, TopIdeaDetail
  /^\/product-catalog\/investment-solution\//, // InvestmentSolutionDetail
  /^\/product-catalog\/global-bond(\/|$)/, // GlobalBondAllPage, GlobalBondDetail
  /^\/product-catalog\/product$/, // StructuredProductAllPage
  /^\/product-catalog\/mutual-fund\//, // MutualFundDetail, top performers list
  /^\/product-catalog\/robo-advisory(\/|$)/, // RoboAdvisoryDetail
  /^\/product-catalog\/definit(\/|$)/, // DefinitDetail
];

export function usePageChrome(): PageChrome {
  const pathname = useAppPathname();
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const t = useT();

  const breadcrumb = usePageBreadcrumb(pathname, { clients, isPrivate });
  // Longest prefix wins, so `/client-hub` doesn't shadow a deeper entry.
  const titleKey = Object.keys(PAGE_TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname.startsWith(k));

  return {
    // A breadcrumb replaces the title — its leaf already names the page, and
    // the section name is the rung above it.
    title: breadcrumb
      ? null
      : titleKey
        ? (t.pageTitles[titleKey as keyof typeof t.pageTitles] ?? PAGE_TITLES[titleKey])
        : "",
    titleIcon:
      breadcrumb || !titleKey ? null : (PAGE_ICONS[titleKey as keyof typeof PAGE_ICONS] ?? null),
    breadcrumb,
    isPerformance: pathname.startsWith("/performance"),
    isFullWidth: pathname.startsWith("/product-catalog") || pathname.startsWith("/client-hub"),
    // Notes and Calendar: each is one surface rather than a document on a
    // background, which is exactly the shape that gains nothing from a frame
    // and a heading on a phone.
    isMobileFullBleed:
      pathname === "/notes" || pathname === "/calendar" || pathname === "/reminders",
    // Each owns the whole area below the top bar and never scrolls the page:
    // Notes is master/detail, Calendar's six weeks split the height between
    // them (each cell counts how many pills fit), and Reminders' timeline
    // scrolls inside itself.
    isFullHeight: pathname === "/notes" || pathname === "/calendar" || pathname === "/reminders",
    isEdgeToEdge: pathname === "/notes" || pathname === "/calendar" || pathname === "/reminders",
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
