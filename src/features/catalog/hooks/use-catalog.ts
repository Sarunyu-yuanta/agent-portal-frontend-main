"use client";

/**
 * Resource hooks for the Product Catalog screens.
 *
 * Each hook reads one endpoint from `../api/catalog.api` and returns a
 * `Resource<T>`; every screen already renders its skeleton against
 * `isLoading`. Connecting the backend is adding an `http` implementation to
 * the endpoint — nothing here or in the screens changes.
 */

import { useMemo } from "react";
import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import { useOpenProducts } from "@/features/orders/hooks/use-order-books";
import type { TopIdeaSector } from "@/features/catalog/top-idea/lib/top-idea-data";
import {
  ALL_STRUCTURED_PRODUCTS_LIMIT,
  type StructuredProduct,
} from "@/features/catalog/structured-product/lib/structured-product-data";
import type { ThaiStructuredProduct } from "@/features/catalog/structured-product/lib/thai-structured-data";
import type {
  GlobalBondIssuer,
  GlobalBondRow,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import type {
  FixedIncomeBond,
  FixedIncomeCompany,
} from "@/features/catalog/fixed-income/lib/fixed-income-data";
import type { InvestmentSolution } from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import type { RoboAdvisoryPlan } from "@/features/catalog/robo-advisory/lib/robo-advisory-plan-data";
import type { DefinitPlan } from "@/features/catalog/robo-advisory/lib/definit-plan-data";
import type {
  MutualFund,
  MutualFundCatalog,
  MutualFundDetail,
  MutualFundTheme,
  MutualFundThemeId,
  getMutualFundInsightsPage,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import type { TrendingGroup } from "@/features/catalog/product-trending/lib/product-trending-data";
import type { MarketIndexPage } from "@/features/catalog/stock/lib/stock-index-data";
import type { IndustrySectorPage } from "@/features/catalog/stock/lib/stock-industry-sector-data";
import type {
  StockNoticeTab,
  StockProductDetail,
  StockRelatedProducts,
  StockTabNotice,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import type { StockCompanyEvents } from "@/features/catalog/stock/lib/stock-company-data";
import type {
  MarketCatalog,
  MarketId,
  StockCrossSellDetailConfig,
  StockCrossSellKind,
} from "@/features/catalog/stock/lib/stock-data";
import {
  definitPlansEndpoint,
  fixedIncomeBondEndpoint,
  fixedIncomeBondsEndpoint,
  fixedIncomeCompanyEndpoint,
  globalBondIssuerEndpoint,
  industrySectorPageEndpoint,
  investmentSolutionEndpoint,
  marketCatalogEndpoint,
  marketIndexPageEndpoint,
  mutualFundCatalogEndpoint,
  mutualFundEndpoint,
  mutualFundInsightsEndpoint,
  mutualFundThemeEndpoint,
  mutualFundUniverseEndpoint,
  overseasBondsEndpoint,
  productTrendingGroupsEndpoint,
  roboAdvisoryPlansEndpoint,
  stockCompanyEventsEndpoint,
  stockCrossSellDetailEndpoint,
  stockProductDetailEndpoint,
  stockRelatedProductsEndpoint,
  stockTabNoticeEndpoint,
  structuredProductEndpoint,
  structuredProductsEndpoint,
  thaiStructuredProductEndpoint,
  thaiStructuredProductsEndpoint,
  topIdeaProductsEndpoint,
  topIdeasEndpoint,
} from "@/features/catalog/api/catalog.api";

// Stable empty fallbacks: a fresh `[]` per render would defeat memoization downstream.
const NO_ITEMS: never[] = [];
const productId = (p: StructuredProduct) => p.id;

/** Keeps a resource's status but swaps its data. */
function withData<T, U>(resource: Resource<T>, data: U): Resource<U> {
  return { ...resource, data };
}

// ── Top ideas ─────────────────────────────────────────────────────────────────

export function useTopIdeas(): Resource<{ sector: TopIdeaSector }[]> {
  return useEndpoint(topIdeasEndpoint, [], { fallback: NO_ITEMS });
}

/** Products behind one sector, minus books that have closed. */
export function useTopIdeaProducts(sector: TopIdeaSector): Resource<StructuredProduct[]> {
  const resource = useEndpoint(topIdeaProductsEndpoint, [sector], { fallback: NO_ITEMS });
  return withData(resource, useOpenProducts(resource.data, productId));
}

// ── Structured products ───────────────────────────────────────────────────────

/** The shelf, minus books that have closed, capped at the listing size. */
export function useStructuredProducts(): Resource<StructuredProduct[]> {
  const resource = useEndpoint(structuredProductsEndpoint, [], { fallback: NO_ITEMS });
  return withData(
    resource,
    useOpenProducts(resource.data, productId, ALL_STRUCTURED_PRODUCTS_LIMIT),
  );
}

export function useStructuredProduct(id: string): Resource<StructuredProduct | undefined> {
  return useEndpoint(structuredProductEndpoint, [id], { fallback: undefined });
}

export function useThaiStructuredProducts(): Resource<ThaiStructuredProduct[]> {
  return useEndpoint(thaiStructuredProductsEndpoint, [], { fallback: NO_ITEMS });
}

export function useThaiStructuredProduct(theme: string): Resource<ThaiStructuredProduct | null> {
  return useEndpoint(thaiStructuredProductEndpoint, [theme], { fallback: null });
}

// ── Bonds ─────────────────────────────────────────────────────────────────────

export function useOverseasBonds(): Resource<GlobalBondRow[]> {
  return useEndpoint(overseasBondsEndpoint, [], { fallback: NO_ITEMS });
}

export function useGlobalBondIssuer(id: string): Resource<GlobalBondIssuer | undefined> {
  return useEndpoint(globalBondIssuerEndpoint, [id], { fallback: undefined });
}

export function useFixedIncomeBonds(): Resource<FixedIncomeBond[]> {
  return useEndpoint(fixedIncomeBondsEndpoint, [], { fallback: NO_ITEMS });
}

export function useFixedIncomeBond(id: string): Resource<FixedIncomeBond | undefined> {
  return useEndpoint(fixedIncomeBondEndpoint, [id], { fallback: undefined });
}

type FixedIncomeCompanyDetail = {
  company: FixedIncomeCompany | null;
  primaryBonds: FixedIncomeBond[];
  secondaryBonds: FixedIncomeBond[];
};
const NO_COMPANY: FixedIncomeCompanyDetail = {
  company: null,
  primaryBonds: NO_ITEMS,
  secondaryBonds: NO_ITEMS,
};

export function useFixedIncomeCompanyDetail(id: string): Resource<FixedIncomeCompanyDetail> {
  return useEndpoint(fixedIncomeCompanyEndpoint, [id], { fallback: NO_COMPANY });
}

// ── The catalog tab as a whole ────────────────────────────────────────────────

/** Whether any dataset the catalog landing page shows is still loading. */
export function useProductCatalogLoading(): boolean {
  const products = useStructuredProducts();
  const bonds = useOverseasBonds();
  const topIdeas = useTopIdeas();
  const fixedIncome = useFixedIncomeBonds();
  const thai = useThaiStructuredProducts();
  const mutualFunds = useMutualFundCatalog();
  return [products, bonds, topIdeas, fixedIncome, thai, mutualFunds].some((r) => r.isLoading);
}

// ── Advisory ──────────────────────────────────────────────────────────────────

export function useInvestmentSolution(id: string): Resource<InvestmentSolution | undefined> {
  return useEndpoint(investmentSolutionEndpoint, [id], { fallback: undefined });
}

export function useRoboAdvisoryPlans(): Resource<RoboAdvisoryPlan[]> {
  return useEndpoint(roboAdvisoryPlansEndpoint, [], { fallback: NO_ITEMS });
}

export function useDefinitPlans(): Resource<DefinitPlan[]> {
  return useEndpoint(definitPlansEndpoint, [], { fallback: NO_ITEMS });
}

// ── Mutual funds ──────────────────────────────────────────────────────────────

export function useMutualFundCatalog(): Resource<MutualFundCatalog | null> {
  return useEndpoint(mutualFundCatalogEndpoint, [], { fallback: null });
}

export function useMutualFund(id: string): Resource<MutualFundDetail | undefined> {
  return useEndpoint(mutualFundEndpoint, [id], { fallback: undefined });
}

/** Every fund — what the fund filter and search run over. */
export function useMutualFundUniverse(): Resource<MutualFund[]> {
  return useEndpoint(mutualFundUniverseEndpoint, [], { fallback: NO_ITEMS });
}

export function useMutualFundInsights(
  page: number,
): Resource<ReturnType<typeof getMutualFundInsightsPage> | null> {
  return useEndpoint(mutualFundInsightsEndpoint, [page], { fallback: null });
}

export function useMutualFundTheme(themeId: MutualFundThemeId): Resource<MutualFundTheme | null> {
  return useEndpoint(mutualFundThemeEndpoint, [themeId], { fallback: null });
}

// ── Stock ─────────────────────────────────────────────────────────────────────

export function useMarketCatalog(id: MarketId): Resource<MarketCatalog | null> {
  return useEndpoint(marketCatalogEndpoint, [id], { fallback: null });
}

export function useMarketIndexPage(slug: string): Resource<MarketIndexPage | null> {
  return useEndpoint(marketIndexPageEndpoint, [slug], { fallback: null });
}

export function useIndustrySectorPage(slug: string): Resource<IndustrySectorPage | null> {
  return useEndpoint(industrySectorPageEndpoint, [slug], { fallback: null });
}

export function useStockProductDetail(id: string): Resource<StockProductDetail | null> {
  return useEndpoint(stockProductDetailEndpoint, [id], { fallback: null });
}

export function useStockCrossSellDetail(
  kind: StockCrossSellKind,
): Resource<StockCrossSellDetailConfig | null> {
  return useEndpoint(stockCrossSellDetailEndpoint, [kind], { fallback: null });
}

// ── Stock ticker detail tabs ──────────────────────────────────────────────────
// Market Info renders off `useStockProductDetail` (the page resource). Every
// other tab has its own resource, so a slow feed for one tab skeletons that
// tab's body only. Each takes the symbol as `string | null` because the ticker
// screen calls them all before its quote has resolved; `null` in, `null` out.

function useBySymbol<T>(resource: Resource<T | null>, symbol: string | null): Resource<T | null> {
  return useMemo(() => (symbol ? resource : withData(resource, null)), [resource, symbol]);
}

function useStockTabNotice(
  symbol: string | null,
  tab: StockNoticeTab,
): Resource<StockTabNotice | null> {
  const resource = useEndpoint(stockTabNoticeEndpoint, [symbol ?? "", tab], {
    fallback: null,
    enabled: symbol !== null,
  });
  return useBySymbol(resource, symbol);
}

/** Related Product tab — also decides whether that tab is offered. */
export function useStockRelatedProducts(
  symbol: string | null,
): Resource<StockRelatedProducts | null> {
  const resource = useEndpoint(stockRelatedProductsEndpoint, [symbol ?? ""], {
    fallback: null,
    enabled: symbol !== null,
  });
  return useBySymbol(resource, symbol);
}

/** Company tab: the corporate-action calendar (Company Events sub-tab). */
export function useStockCompanyInfo(symbol: string | null): Resource<StockCompanyEvents | null> {
  const resource = useEndpoint(stockCompanyEventsEndpoint, [symbol ?? ""], {
    fallback: null,
    enabled: symbol !== null,
  });
  return useBySymbol(resource, symbol);
}

export function useStockResearch(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "Research");
}

export function useStockTechnical(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "Technical");
}

export function useStockNews(symbol: string | null): Resource<StockTabNotice | null> {
  return useStockTabNotice(symbol, "News");
}

// ── Recommended ───────────────────────────────────────────────────────────────

export function useProductTrendingGroups(): Resource<TrendingGroup[]> {
  return useEndpoint(productTrendingGroupsEndpoint, [], { fallback: NO_ITEMS });
}
