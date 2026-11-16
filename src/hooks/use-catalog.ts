"use client";

/**
 * Resource hooks for the Product Catalog and Insights screens.
 *
 * ─── Backend handoff: this is the only file you need to touch ────────────────
 * Every screen below reads its data as a `Resource<T>` — `{ data, isLoading }`
 * — and already renders a skeleton while `isLoading` is true. Today each hook
 * resolves from the bundled mock data via `useStatic`, so `isLoading` is
 * `false` and the pages paint instantly.
 *
 * To put one of these on a real endpoint, change that hook's body:
 *
 * ```diff
 * - export function useTopIdeas() {
 * -   return useStatic(ALL_TOP_IDEAS);
 * - }
 * + export function useTopIdeas() {
 * +   const fetcher = useCallback(() => fetchTopIdeas(), []);
 * +   return useResource("useTopIdeas", fetcher, ALL_TOP_IDEAS);
 * + }
 * ```
 *
 * The skeleton then starts appearing on its own, for exactly as long as the
 * request actually takes. No component changes, and nothing to switch on — the
 * loading state is a property of the data, so it follows the data.
 *
 * `useResource` also keeps the behaviour you want for a polled resource:
 * `isLoading` is true only until the *first* attempt settles, so background
 * refreshes swap data in without flashing the skeleton again.
 *
 * Keeping the mock value as `useResource`'s third argument is worth doing — it
 * is the fallback when a request fails, so a dead endpoint degrades to the
 * current behaviour instead of an empty screen.
 *
 * The lookup helpers these wrap (`findProductById`, `getGlobalBondIssuer`, …)
 * stay where they are. They are what a route resolver becomes once the real
 * endpoint is per-id rather than a whole collection.
 */

import { useMemo } from "react";
import { useStatic, type Resource } from "@/hooks/use-api";
import { mockHouseViewStrategies } from "@/lib/mock-data";
import { useOpenProducts } from "@/app/(dashboard)/orders/use-order-books";
import {
  ALL_TOP_IDEAS,
  type TopIdeaSector,
} from "@/app/(dashboard)/client/[id]/top-idea-data";
import {
  ALL_STRUCTURED_PRODUCTS_LIMIT,
  ALL_STRUCTURED_PRODUCTS_POOL,
  findProductById,
  TOP_IDEA_DETAIL_PRODUCTS,
  type StructuredProduct,
} from "@/app/(dashboard)/client/[id]/structured-product-data";
import {
  ALL_OVERSEAS_BONDS,
  getGlobalBondIssuer,
  type GlobalBondIssuer,
  type GlobalBondRow,
} from "@/app/(dashboard)/client/[id]/global-bond-data";
import {
  FIXED_INCOME_BONDS,
  getCompanyPrimaryBonds,
  getCompanySecondaryBonds,
  getFixedIncomeBond,
  resolveFixedIncomeCompany,
  type FixedIncomeBond,
  type FixedIncomeCompany,
} from "@/app/(dashboard)/client/[id]/fixed-income-data";
import {
  THAI_STRUCTURED_PRODUCTS,
  getThaiStructuredProduct,
  type ThaiStructuredProduct,
} from "@/app/(dashboard)/client/[id]/thai-structured-data";
import {
  getInvestmentSolution,
  type InvestmentSolution,
  type InvestmentSolutionId,
} from "@/app/(dashboard)/client/[id]/investment-solution-data";
import {
  MUTUAL_FUND_CATALOG,
  getMutualFund,
  type MutualFundCatalog,
  type MutualFundDetail,
} from "@/app/(dashboard)/client/[id]/mutual-fund-data";
import {
  PRODUCT_TRENDING_GROUPS,
  type TrendingGroup,
} from "@/app/(dashboard)/client/[id]/product-trending-data";
import {
  getMarketIndexPage,
  type MarketIndexPage,
} from "@/app/(dashboard)/client/[id]/stock-index-data";
import {
  getIndustrySectorPage,
  type IndustrySectorPage,
} from "@/app/(dashboard)/client/[id]/stock-industry-sector-data";
import {
  getRelatedProducts,
  getStockProductDetail,
  getStockTabNotice,
  type RelatedProducts,
  type StockNoticeTab,
  type StockProductDetail,
  type StockTabNotice,
} from "@/app/(dashboard)/client/[id]/stock-product-detail-data";
import {
  getStockCompanyEvents,
  type StockCompanyEvents,
} from "@/app/(dashboard)/client/[id]/stock-company-data";
import {
  STOCK_CROSS_SELL_DETAIL,
  type StockCrossSellDetailConfig,
  type StockCrossSellKind,
} from "@/app/(dashboard)/client/[id]/stock-data";
import {
  getAllMutualFunds,
  getMutualFundInsightsPage,
  getMutualFundTheme,
  type MutualFund,
  type MutualFundTheme,
  type MutualFundThemeId,
} from "@/app/(dashboard)/client/[id]/mutual-fund-data";
import {
  ROBO_ADVISORY_PLANS,
  type RoboAdvisoryPlan,
} from "@/app/(dashboard)/client/[id]/robo-advisory-plan-data";
import {
  DEFINIT_PLANS,
  type DefinitPlan,
} from "@/app/(dashboard)/client/[id]/definit-plan-data";
import {
  RESEARCH_FEED,
  type ResearchFeed,
} from "@/app/(dashboard)/insights/research-data";
import {
  MARKET_CATALOG,
  type MarketCatalog,
  type MarketId,
} from "@/app/(dashboard)/client/[id]/stock-data";

type HouseViewStrategy = (typeof mockHouseViewStrategies)[number];

// ── Insights ──────────────────────────────────────────────────────────────────

/** Every published insight — the Insights list. */
export function useInsightStrategies(): Resource<HouseViewStrategy[]> {
  return useStatic(mockHouseViewStrategies);
}

/**
 * One insight by id, or `undefined` when the id matches nothing.
 *
 * `undefined` and "still loading" are deliberately separate: a caller must show
 * its skeleton while `isLoading`, and only treat a missing value as not-found
 * once loading has finished. Collapsing the two would flash "ไม่พบบทวิเคราะห์นี้"
 * during every fetch the moment this hook goes async.
 */
export function useInsightStrategy(id: string): Resource<HouseViewStrategy | undefined> {
  return useStatic(mockHouseViewStrategies.find((s) => s.id === id));
}

// ── Top ideas ─────────────────────────────────────────────────────────────────

/** Every top idea — the "all top ideas" list. A sector *is* the idea's identity. */
export function useTopIdeas(): Resource<{ sector: TopIdeaSector }[]> {
  return useStatic(ALL_TOP_IDEAS);
}

/** The products shown on a single sector's top-idea detail page. */
export function useTopIdeaProducts(_sector: TopIdeaSector): Resource<StructuredProduct[]> {
  return useStatic(useOpenProducts(TOP_IDEA_DETAIL_PRODUCTS, (p) => p.id));
}

// ── Structured products ───────────────────────────────────────────────────────

/**
 * Every structured product still open to booking — the "all products" list.
 * Drawn from the longer pool, so a product closed by its order going out is
 * replaced rather than leaving the page a card short.
 */
export function useStructuredProducts(): Resource<StructuredProduct[]> {
  return useStatic(
    useOpenProducts(ALL_STRUCTURED_PRODUCTS_POOL, (p) => p.id, ALL_STRUCTURED_PRODUCTS_LIMIT),
  );
}

/** One structured product by id, or `undefined` — see {@link useInsightStrategy}. */
export function useStructuredProduct(id: string): Resource<StructuredProduct | undefined> {
  return useStatic(findProductById(id));
}

/** One Thai structured product by theme, or `null` (its lookup returns `null`, not `undefined`). */
export function useThaiStructuredProduct(
  theme: string,
): Resource<ThaiStructuredProduct | null> {
  return useStatic(getThaiStructuredProduct(theme));
}

// ── Global bonds ──────────────────────────────────────────────────────────────

/** Every overseas bond — the "all overseas bonds" list. */
export function useOverseasBonds(): Resource<GlobalBondRow[]> {
  return useStatic(ALL_OVERSEAS_BONDS);
}

/** One global-bond issuer by id, or `undefined`. */
export function useGlobalBondIssuer(id: string): Resource<GlobalBondIssuer | undefined> {
  return useStatic(getGlobalBondIssuer(id));
}

// ── Fixed income ──────────────────────────────────────────────────────────────

/** One bond by id, or `undefined`. */
export function useFixedIncomeBond(id: string): Resource<FixedIncomeBond | undefined> {
  return useStatic(getFixedIncomeBond(id));
}

/**
 * Everything the company detail page renders: the company plus its primary and
 * secondary bond lists.
 *
 * Grouped into one resource because that is one screen and would be one
 * request — three separate hooks would mean three independent `isLoading`
 * flags for a page with a single skeleton.
 *
 * Wraps `resolveFixedIncomeCompany`, not `getFixedIncomeCompany`: the former
 * also synthesizes a company from its bonds when there is no company record,
 * which is what this page has always displayed.
 *
 * The `useMemo` matters. `useStatic` hands back whatever it is given, so
 * building this object inline would make `data` a fresh reference on every
 * render and invalidate any `useMemo` downstream that depends on it.
 */
export function useFixedIncomeCompanyDetail(id: string): Resource<{
  company: FixedIncomeCompany | null;
  primaryBonds: FixedIncomeBond[];
  secondaryBonds: FixedIncomeBond[];
}> {
  const detail = useMemo(
    () => ({
      company: resolveFixedIncomeCompany(id),
      primaryBonds: getCompanyPrimaryBonds(id),
      secondaryBonds: getCompanySecondaryBonds(id),
    }),
    [id],
  );
  return useStatic(detail);
}

// ── The catalog tab as a whole ────────────────────────────────────────────────

/**
 * Whether the Product Catalog tab is still waiting on anything.
 *
 * The odd one out: a bare boolean rather than a `Resource<T>`, because this
 * screen renders no data of its own — it puts one skeleton in front of several
 * product families whose own components fetch what they show. So the only
 * thing to report upward is "is any of them still loading".
 *
 * When those families get endpoints, the better shape is for each sub-tab to
 * own its own skeleton, and for this aggregate to be deleted — one spinner over
 * the whole tab means the slowest family decides when any of them appear. Until
 * then this keeps the existing single-skeleton behaviour intact while still
 * being sourced from the data rather than from a timer.
 */
export function useProductCatalogLoading(): boolean {
  const products = useStructuredProducts();
  const bonds = useOverseasBonds();
  const topIdeas = useTopIdeas();
  const fixedIncome = useFixedIncomeBonds();
  const thai = useThaiStructuredProducts();
  const mutualFunds = useMutualFundCatalog();
  return (
    products.isLoading ||
    bonds.isLoading ||
    topIdeas.isLoading ||
    fixedIncome.isLoading ||
    thai.isLoading ||
    mutualFunds.isLoading
  );
}

/** Every listed fixed-income bond — the Fixed Income tab's table. */
export function useFixedIncomeBonds(): Resource<FixedIncomeBond[]> {
  return useStatic(FIXED_INCOME_BONDS);
}

/** Every Thai structured note — the Thai Structured tab's FCN table. */
export function useThaiStructuredProducts(): Resource<ThaiStructuredProduct[]> {
  return useStatic(THAI_STRUCTURED_PRODUCTS);
}

// ── Investment solutions ──────────────────────────────────────────────────────

/**
 * One investment solution by id.
 *
 * Non-optional unlike its neighbours: `getInvestmentSolution` falls back to a
 * default solution rather than returning `undefined`, so its route has no
 * not-found branch to preserve.
 */
export function useInvestmentSolution(id: InvestmentSolutionId): Resource<InvestmentSolution> {
  return useStatic(getInvestmentSolution(id));
}

// ── Mutual funds ──────────────────────────────────────────────────────────────

/** Mutual fund catalog — top performers, insights, and theme cards. */
export function useMutualFundCatalog(): Resource<MutualFundCatalog> {
  return useStatic(MUTUAL_FUND_CATALOG);
}

/** One mutual fund by id, or `undefined`. */
export function useMutualFund(id: string): Resource<MutualFundDetail | undefined> {
  return useStatic(getMutualFund(id));
}

// ── Stock ─────────────────────────────────────────────────────────────────────

/**
 * One market's slice of the Stock tab — index boards, recommendations,
 * cross-sell and sector heatmap. Keyed by market because a real feed would be:
 * switching Thai ⇄ US is a new request, and its own loading state.
 */
export function useMarketCatalog(id: MarketId): Resource<MarketCatalog> {
  return useStatic(MARKET_CATALOG[id]);
}

// ── Recommended (product trending) ────────────────────────────────────────────

/**
 * The Recommended tab's ranked groups (Stock, Mutual Fund, structured notes…),
 * before they're re-ordered by the active sort and joined with order books.
 */
export function useProductTrendingGroups(): Resource<TrendingGroup[]> {
  return useStatic(PRODUCT_TRENDING_GROUPS);
}

// ── Research ──────────────────────────────────────────────────────────────────

/** The Insights › Research tab: published reports and the analyst directory. */
export function useResearch(): Resource<ResearchFeed> {
  return useStatic(RESEARCH_FEED);
}

// ── Product catalog sub-pages ─────────────────────────────────────────────────
// One resource per page-level dataset. Each detail page early-returns its
// skeleton on `isLoading` — above its not-found branch. Lists that page in
// more rows as you scroll (index/sector batches, fund grids) still compute
// those batches locally; what waits is the page they hang off.

/** A market index's page (SET, SET50…) by slug, or `null`. */
export function useMarketIndexPage(slug: string): Resource<MarketIndexPage | null> {
  const page = useMemo(() => getMarketIndexPage(slug), [slug]);
  return useStatic(page);
}

/** An industry sector's page by slug, or `null`. */
export function useIndustrySectorPage(slug: string): Resource<IndustrySectorPage | null> {
  const page = useMemo(() => getIndustrySectorPage(slug), [slug]);
  return useStatic(page);
}

/** One stock's detail by ticker id, or `null`. */
export function useStockProductDetail(id: string): Resource<StockProductDetail | null> {
  const detail = useMemo(() => getStockProductDetail(id), [id]);
  return useStatic(detail);
}

/** The DR or ETF "view all" page's config. */
export function useStockCrossSellDetail(
  kind: StockCrossSellKind,
): Resource<StockCrossSellDetailConfig> {
  return useStatic(STOCK_CROSS_SELL_DETAIL[kind]);
}

const ALL_MUTUAL_FUNDS = getAllMutualFunds();

/**
 * The whole fund universe. Gates every mutual-fund list page (filter results,
 * tax planning, top performers, themes) — their grids are slices of it.
 */
export function useMutualFundUniverse(): Resource<MutualFund[]> {
  return useStatic(ALL_MUTUAL_FUNDS);
}

/** One page of the mutual-fund insights list. */
export function useMutualFundInsights(page: number): Resource<ReturnType<typeof getMutualFundInsightsPage>> {
  const data = useMemo(() => getMutualFundInsightsPage(page), [page]);
  return useStatic(data);
}

/** One mutual-fund theme by id. */
export function useMutualFundTheme(themeId: MutualFundThemeId): Resource<MutualFundTheme> {
  const theme = useMemo(() => getMutualFundTheme(themeId), [themeId]);
  return useStatic(theme);
}

/** Robo Advisory model plans. */
export function useRoboAdvisoryPlans(): Resource<RoboAdvisoryPlan[]> {
  return useStatic(ROBO_ADVISORY_PLANS);
}

/** Definit model plans. */
export function useDefinitPlans(): Resource<DefinitPlan[]> {
  return useStatic(DEFINIT_PLANS);
}

// ── Stock ticker detail tabs ──────────────────────────────────────────────────
// Market Info renders off `useStockProductDetail` (the page resource). Every
// other tab has its own resource, so a slow feed for one tab skeletons that
// tab's body only — header, quote and tab strip stay up. Each takes the symbol
// as `string | null` because the ticker screen calls them all unconditionally,
// before its quote has resolved; `null` in, `null` out.

function useStockTabNotice(
  symbol: string | null,
  tab: StockNoticeTab,
): Resource<StockTabNotice | null> {
  const notice = useMemo(() => (symbol ? getStockTabNotice(symbol, tab) : null), [symbol, tab]);
  return useStatic(notice);
}

/** Related Product tab: the DR / derivative / structured / bond / fund slices
 *  that reference this ticker. Also decides whether that tab is offered. */
export function useStockRelatedProducts(symbol: string | null): Resource<RelatedProducts | null> {
  const related = useMemo(() => (symbol ? getRelatedProducts(symbol) : null), [symbol]);
  return useStatic(related);
}

/** Company tab: the corporate-action calendar (Company Events sub-tab). */
export function useStockCompanyInfo(symbol: string | null): Resource<StockCompanyEvents | null> {
  const events = useMemo(() => (symbol ? getStockCompanyEvents(symbol) : null), [symbol]);
  return useStatic(events);
}

/** Research tab — static "coming soon" copy for now; the seam is for the feed. */
export function useStockResearch(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "Research");
}

/** Technical tab — static "coming soon" copy for now; the seam is for the feed. */
export function useStockTechnical(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "Technical");
}

/** News tab — static "coming soon" copy for now; the seam is for the feed. */
export function useStockNews(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "News");
}
