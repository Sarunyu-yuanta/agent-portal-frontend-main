"use client";

import { useSyncExternalStore } from "react";
import { mockHouseViewStrategies } from "@/lib/mock-data";
import { maskName } from "@/lib/mask-name";
import type { Client } from "@/types/domain";
import {
  crossSectionTrail,
  navVisitSnapshot,
  sectionForPath,
  sectionTrail,
  subscribeNavVisits,
  urlPathname,
  type NavSectionKey,
} from "@/lib/nav-memory";
import { findProductById } from "./client/[id]/structured-product-data";
import {
  TOP_IDEA_THEMES,
  type TopIdeaSector,
} from "./client/[id]/top-idea-data";
import {
  getInvestmentSolution,
  type InvestmentSolutionId,
} from "./client/[id]/investment-solution-data";
import {
  getFixedIncomeBond,
  resolveFixedIncomeCompany,
} from "./client/[id]/fixed-income-data";
import { getGlobalBondIssuer } from "./client/[id]/global-bond-data";
import {
  getMutualFundSymbol,
  MUTUAL_FUND_CATEGORIES,
  normalizeMutualFundCategoryId,
} from "./client/[id]/mutual-fund-data";
import { getThaiStructuredProduct } from "./client/[id]/thai-structured-data";
import { getIndustrySectorPage } from "./client/[id]/stock-industry-sector-data";
import { getStockProductDetail } from "./client/[id]/stock-product-detail-data";
import {
  catalogCategoryForPath,
  catalogListHref,
  categoryOfUrl,
  CATALOG_PATH,
  normalizeProductCategory,
  productCategoryTitle,
} from "@/lib/product-catalog-routes";

export type Crumb = { label: string; href?: string };
export type BreadcrumbContext = { clients: Client[]; isPrivate: boolean };

const SECTION_ROOT: Record<NavSectionKey, { path: string; label: string }> = {
  "client-hub": { path: "/client-hub", label: "Client 360" },
  "product-catalog": { path: "/product-catalog", label: "Product Catalog" },
  // Insight articles all come from the House View tab, which is what this
  // breadcrumb has always called the level above them.
  insights: { path: "/insights", label: "House View" },
  notes: { path: "/notes", label: "Notes" },
  calendar: { path: "/calendar", label: "Calendar" },
};

/**
 * Page breadcrumb, built from the **navigation trail** — the pages the user
 * actually walked through — so drilling deeper keeps extending it:
 * `Product Catalog / Top idea / สงครามน้ำมันแพง / AAPL - AMZN - NFLX`.
 *
 * The trail lives in sessionStorage, which the server can't see, so the first
 * paint renders the route-derived shape (section root + this page) and the
 * trail version takes over once mounted. That also covers a refresh, where the
 * trail is deliberately empty: the breadcrumb degrades to two rungs rather than
 * losing its parent link.
 *
 * Section roots get no breadcrumb — they keep their plain page title.
 *
 * Rendered in the top bar on desktop, and at the top of the content area on
 * mobile where the bar has no room for it beside the logo.
 */
export function usePageBreadcrumb(
  pathname: string,
  ctx: BreadcrumbContext,
): Crumb[] | null {
  const hydrated = useSyncExternalStore(subscribeNever, onClient, onServer);
  // Re-read session trail once recordVisit lands — otherwise the first paint
  // after a cross-section jump can stick on the route fallback (House View).
  useSyncExternalStore(subscribeNavVisits, navVisitSnapshot, () => "");
  return breadcrumbFor(pathname, ctx, hydrated);
}

/**
 * @param fromTrail Whether the navigation trail is readable — false while
 *   server-rendering and hydrating, where sessionStorage doesn't exist.
 */
export function breadcrumbFor(
  pathname: string,
  ctx: BreadcrumbContext,
  fromTrail: boolean,
): Crumb[] | null {
  const route = routeBreadcrumb(pathname, ctx);
  return fromTrail ? (trailBreadcrumb(pathname, ctx) ?? route) : route;
}

// Hydration-safe "am I on the client yet": the server snapshot is what gets
// rendered into the HTML, the client one takes over right after hydration.
// Nothing to subscribe to — the trail only changes on navigation, which
// re-renders this anyway.
const subscribeNever = () => () => {};
const onClient = () => true;
const onServer = () => false;

// ── Assembly ────────────────────────────────────────────────────────────────

function trailBreadcrumb(
  pathname: string,
  ctx: BreadcrumbContext,
): Crumb[] | null {
  const section = sectionForPath(pathname);
  if (!section || pathname === SECTION_ROOT[section].path) return null;

  // `pathname` as the current URL: the last rung never links anywhere, so its
  // query string would go unused.
  const crossTrail = crossSectionTrail(pathname, pathname);
  const trail = crossTrail ?? sectionTrail(pathname, pathname);
  const rungs: Crumb[] = [];

  for (const [i, url] of trail.entries()) {
    const isCurrent = i === trail.length - 1;
    // The catalog list is one trail entry but two rungs — the section and the
    // category tab it was left on — since `?category=` is where the tab lives.
    // A bare `/product-catalog` still *shows* a tab (the first one), so
    // normalize rather than treating a missing param as "tab unknown".
    if (!isCurrent && isCatalogList(urlPathname(url))) {
      rungs.push(
        ...catalogRootCrumbs(normalizeProductCategory(categoryOfUrl(url))),
      );
      continue;
    }
    const label = labelFor(urlPathname(url), ctx);
    if (!label) continue;
    rungs.push(isCurrent ? { label } : { label, href: url });
  }

  // The current page must be the leaf; if it has no label there is no crumb.
  if (!rungs.length || rungs[rungs.length - 1].href) return null;

  // Entering a section straight on a detail page leaves no root in the trail.
  // Cross-section entries already carry the referrer section's rungs — don't
  // prepend this section's root on top of them.
  //
  // Category is taken from the *origin* of the trail, not the current page —
  // opening a Thai / FI / bond detail from a stock related-product list should
  // keep "Stock" in the crumb, not jump to that product's native catalog tab.
  if (
    !crossTrail &&
    rungs[0].label !== SECTION_ROOT[section].label
  ) {
    rungs.unshift(...rootCrumbs(section, urlPathname(trail[0])));
  }
  return rungs.length > 1 ? finish(rungs) : null;
}

/** Section root + this page. Deterministic, so it is safe to server-render. */
function routeBreadcrumb(
  pathname: string,
  ctx: BreadcrumbContext,
): Crumb[] | null {
  const section = sectionForPath(pathname);
  if (!section || pathname === SECTION_ROOT[section].path) return null;
  const leaf = labelFor(pathname, ctx);
  return leaf
    ? finish([...rootCrumbs(section, pathname), { label: leaf }])
    : null;
}

const isCatalogList = (pathname: string) => pathname === CATALOG_PATH;

/** `Product Catalog`, plus the tab rung when the category is known. */
function catalogRootCrumbs(category: string | null): Crumb[] {
  const root: Crumb = {
    label: SECTION_ROOT["product-catalog"].label,
    href: CATALOG_PATH,
  };
  const tab = productCategoryTitle(category);
  return tab ? [root, { label: tab, href: catalogListHref(category) }] : [root];
}

/**
 * Opening rungs for a page whose trail has no section root — a pasted link or a
 * session restore. Only the catalog routes that belong to exactly one tab can
 * name it; the rest fall back to the section alone.
 */
function rootCrumbs(section: NavSectionKey, pathname: string): Crumb[] {
  if (section === "product-catalog") {
    return catalogRootCrumbs(catalogCategoryForPath(pathname));
  }
  const { path, label } = SECTION_ROOT[section];
  return [{ label, href: path }];
}

/** Intermediate rungs are context, so they get less room than the leaf. */
function finish(rungs: Crumb[]): Crumb[] {
  const sized = rungs.map((crumb, i) => ({
    ...crumb,
    label: truncate(crumb.label, i === rungs.length - 1 ? 28 : 26),
  }));
  if (sized.length <= MAX_RUNGS) return sized;
  // Keep where they are (section + tab) and where they are now — the rungs in
  // between are the ones a user is least likely to jump back to.
  return [sized[0], sized[1], { label: "…" }, ...sized.slice(-2)];
}

// Section, tab, and up to three levels of drill-in — deeper than that elides.
const MAX_RUNGS = 5;

/**
 * The two shapes a breadcrumb may take: everything, or `head / … / leaf`.
 *
 * Which one fits can only be decided by measuring — a character count says
 * nothing about how wide "สงครามน้ำมันแพง" is next to "Global Structured
 * Product" — so `ResponsiveBreadcrumb` measures both and renders the richer one
 * whenever it fits.
 *
 * It stops there on purpose. Below this the rungs stop disappearing and the
 * *labels* shrink instead (`.breadcrumb-fit` in globals.css), so a narrow phone
 * gets `Product Cata… / … / การขนส่งล่าช้าแ…` rather than losing the section
 * and the path down to a bare page name.
 *
 * The ellipsis links one level up, so collapsing never costs the way back.
 */
export function crumbVariants(crumbs: Crumb[]): Crumb[][] {
  if (crumbs.length < 4) return [crumbs];
  return [
    crumbs,
    [
      crumbs[0],
      { label: "…", href: crumbs[crumbs.length - 2].href },
      crumbs[crumbs.length - 1],
    ],
  ];
}

const truncate = (label: string, max: number) =>
  label.length > max ? `${label.slice(0, max)}…` : label;

// ── Labels ──────────────────────────────────────────────────────────────────

/** Name for one rung, or `null` when the path isn't a page worth showing. */
function labelFor(pathname: string, ctx: BreadcrumbContext): string | null {
  const section = sectionForPath(pathname);
  if (section && pathname === SECTION_ROOT[section].path) {
    return SECTION_ROOT[section].label;
  }

  const client = /^\/client\/([^/]+)/.exec(pathname);
  if (client) {
    const found = ctx.clients.find((c) => c.id === client[1]);
    return maskName(found?.name ?? "Client", ctx.isPrivate);
  }

  const insight = /^\/insights\/([^/]+)/.exec(pathname);
  if (insight) {
    const strategy = mockHouseViewStrategies.find((s) => s.id === insight[1]);
    return strategy?.name ?? "Insight";
  }

  return catalogLabel(pathname);
}

const PRODUCT = /^\/product-catalog\/product\/(.+)$/;
const TOP_IDEA = /^\/product-catalog\/top-idea\/(.+)$/;
const SOLUTION = /^\/product-catalog\/investment-solution\/(.+)$/;
const FI_BOND = /^\/product-catalog\/fixed-income\/bond\/(.+)$/;
const FI_COMPANY = /^\/product-catalog\/fixed-income\/company\/(.+)$/;
const GLOBAL_BOND = /^\/product-catalog\/global-bond\/(.+)$/;
const THAI = /^\/product-catalog\/thai-structured\/(.+)$/;
const MUTUAL_FUND_TOP_PERFORMERS = /^\/product-catalog\/mutual-fund\/top-performers\/(.+)$/;
const MUTUAL_FUND_INSIGHTS = /^\/product-catalog\/mutual-fund\/insights(\/|$)/;
const MUTUAL_FUND = /^\/product-catalog\/mutual-fund\/(.+)$/;
const STOCK_SECTOR = /^\/product-catalog\/stock\/([^/]+)$/;
const STOCK_SECTOR_STATIC = new Set(["dr", "etf"]);

function catalogLabel(pathname: string): string | null {
  const segment = (re: RegExp) => {
    const found = re.exec(pathname);
    return found ? decodeURIComponent(found[1]) : null;
  };

  const productId = segment(PRODUCT);
  if (productId) {
    return findProductById(productId)?.underlying ?? "Structured Product";
  }
  if (pathname === "/product-catalog/product") {
    return "Structured Products ทั้งหมด";
  }

  const sector = segment(TOP_IDEA);
  if (sector) return TOP_IDEA_THEMES[sector as TopIdeaSector] ?? sector;
  if (pathname === "/product-catalog/top-idea") return "Top idea";

  const solutionId = segment(SOLUTION);
  if (solutionId) {
    const solution = getInvestmentSolution(solutionId as InvestmentSolutionId);
    return solution?.name ?? "Investment Solution";
  }

  const bondId = segment(FI_BOND);
  if (bondId) return getFixedIncomeBond(bondId)?.symbol ?? "Fixed Income";

  const companyId = segment(FI_COMPANY);
  if (companyId) {
    return resolveFixedIncomeCompany(companyId)?.fullName ?? companyId;
  }

  const issuerId = segment(GLOBAL_BOND);
  if (issuerId) return getGlobalBondIssuer(issuerId)?.title ?? "Global Bond";
  if (pathname === "/product-catalog/global-bond") return "All Overseas Bonds";

  const theme = segment(THAI);
  if (theme) {
    const product = getThaiStructuredProduct(theme);
    // Matches the detail page's own heading, which names the underlyings.
    return product
      ? [product.bbg1, product.bbg2, product.bbg3].filter(Boolean).join(" - ")
      : theme;
  }

  const performersCategory = segment(MUTUAL_FUND_TOP_PERFORMERS);
  if (performersCategory) {
    const id = normalizeMutualFundCategoryId(decodeURIComponent(performersCategory));
    return MUTUAL_FUND_CATEGORIES.find((c) => c.id === id)?.label ?? "กองทุนผลตอบแทนเด่น";
  }

  if (MUTUAL_FUND_INSIGHTS.test(pathname)) return "บทวิเคราะห์ทั้งหมด";

  const fundId = segment(MUTUAL_FUND);
  if (fundId) return getMutualFundSymbol(fundId) ?? "Mutual Fund";

  const stockSectorId = segment(STOCK_SECTOR);
  if (stockSectorId && !STOCK_SECTOR_STATIC.has(stockSectorId)) {
    const decoded = decodeURIComponent(stockSectorId);
    return (
      getIndustrySectorPage(decoded)?.sector.name ??
      getStockProductDetail(decoded)?.symbol ??
      "SET Industry Sector"
    );
  }

  if (pathname === "/product-catalog/stock/dr") return "DR (Depositary Receipt)";
  if (pathname === "/product-catalog/stock/etf") return "ETF (Exchange Traded Fund)";

  if (pathname === "/product-catalog/robo-advisory") return "Robo Advisory";
  if (pathname === "/product-catalog/definit") return "Definit x Yuanta";

  return null;
}
