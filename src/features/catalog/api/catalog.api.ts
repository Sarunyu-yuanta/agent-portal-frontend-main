/**
 * Product Catalog reads.
 *
 * Every endpoint answers from the catalog fixtures today. The lookup helpers
 * they wrap (`findProductById`, `getGlobalBondIssuer`, …) are what a per-id
 * endpoint replaces — see docs/api-by-page.md.
 */

import { defineEndpoint } from "@/lib/api/endpoint";
import { ALL_TOP_IDEAS } from "@/features/catalog/top-idea/lib/top-idea-data";
import {
  ALL_STRUCTURED_PRODUCTS_POOL,
  TOP_IDEA_DETAIL_PRODUCTS,
  findProductById,
} from "@/features/catalog/structured-product/lib/structured-product-data";
import {
  THAI_STRUCTURED_PRODUCTS,
  getThaiStructuredProduct,
} from "@/features/catalog/structured-product/lib/thai-structured-data";
import {
  ALL_OVERSEAS_BONDS,
  getGlobalBondIssuer,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  FIXED_INCOME_BONDS,
  getCompanyPrimaryBonds,
  getCompanySecondaryBonds,
  getFixedIncomeBond,
  resolveFixedIncomeCompany,
} from "@/features/catalog/fixed-income/lib/fixed-income-data";
import { getInvestmentSolution } from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import { ROBO_ADVISORY_PLANS } from "@/features/catalog/robo-advisory/lib/robo-advisory-plan-data";
import { DEFINIT_PLANS } from "@/features/catalog/robo-advisory/lib/definit-plan-data";
import {
  MUTUAL_FUND_CATALOG,
  getAllMutualFunds,
  getMutualFund,
  getMutualFundInsightsPage,
  getMutualFundTheme,
  type MutualFundThemeId,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { PRODUCT_TRENDING_GROUPS } from "@/features/catalog/product-trending/lib/product-trending-data";
import { getMarketIndexPage } from "@/features/catalog/stock/lib/stock-index-data";
import { getIndustrySectorPage } from "@/features/catalog/stock/lib/stock-industry-sector-data";
import {
  getRelatedProducts,
  getStockProductDetail,
  getStockTabNotice,
  type StockNoticeTab,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import { getStockCompanyEvents } from "@/features/catalog/stock/lib/stock-company-data";
import {
  MARKET_CATALOG,
  STOCK_CROSS_SELL_DETAIL,
  type MarketId,
  type StockCrossSellKind,
} from "@/features/catalog/stock/lib/stock-data";

// ── Top ideas & structured products ──────────────────────────────────────────

export const topIdeasEndpoint = defineEndpoint("top-ideas", { mock: () => ALL_TOP_IDEAS });

/** Products behind a top-idea sector (one shared list in the mock). */
export const topIdeaProductsEndpoint = defineEndpoint("top-idea-products", {
  mock: (_sector: string) => TOP_IDEA_DETAIL_PRODUCTS,
});

/** The full structured-product shelf, before closed books are filtered out. */
export const structuredProductsEndpoint = defineEndpoint("structured-products", {
  mock: () => ALL_STRUCTURED_PRODUCTS_POOL,
});

export const structuredProductEndpoint = defineEndpoint("structured-product", {
  mock: (id: string) => findProductById(id),
});

export const thaiStructuredProductsEndpoint = defineEndpoint("thai-structured-products", {
  mock: () => THAI_STRUCTURED_PRODUCTS,
});

export const thaiStructuredProductEndpoint = defineEndpoint("thai-structured-product", {
  mock: (theme: string) => getThaiStructuredProduct(theme),
});

// ── Bonds ────────────────────────────────────────────────────────────────────

export const overseasBondsEndpoint = defineEndpoint("overseas-bonds", {
  mock: () => ALL_OVERSEAS_BONDS,
});

export const globalBondIssuerEndpoint = defineEndpoint("global-bond-issuer", {
  mock: (id: string) => getGlobalBondIssuer(id),
});

export const fixedIncomeBondsEndpoint = defineEndpoint("fixed-income-bonds", {
  mock: () => FIXED_INCOME_BONDS,
});

export const fixedIncomeBondEndpoint = defineEndpoint("fixed-income-bond", {
  mock: (id: string) => getFixedIncomeBond(id),
});

export const fixedIncomeCompanyEndpoint = defineEndpoint("fixed-income-company", {
  mock: (id: string) => ({
    company: resolveFixedIncomeCompany(id),
    primaryBonds: getCompanyPrimaryBonds(id),
    secondaryBonds: getCompanySecondaryBonds(id),
  }),
});

// ── Advisory ─────────────────────────────────────────────────────────────────

export const investmentSolutionEndpoint = defineEndpoint("investment-solution", {
  mock: (id: string) => getInvestmentSolution(id),
});

export const roboAdvisoryPlansEndpoint = defineEndpoint("robo-advisory-plans", {
  mock: () => ROBO_ADVISORY_PLANS,
});

export const definitPlansEndpoint = defineEndpoint("definit-plans", { mock: () => DEFINIT_PLANS });

// ── Mutual funds ─────────────────────────────────────────────────────────────

export const mutualFundCatalogEndpoint = defineEndpoint("mutual-fund-catalog", {
  mock: () => MUTUAL_FUND_CATALOG,
});

export const mutualFundEndpoint = defineEndpoint("mutual-fund", {
  mock: (id: string) => getMutualFund(id),
});

const ALL_MUTUAL_FUNDS = getAllMutualFunds();

/** Every fund — what the fund filter and search run over. */
export const mutualFundUniverseEndpoint = defineEndpoint("mutual-fund-universe", {
  mock: () => ALL_MUTUAL_FUNDS,
});

export const mutualFundInsightsEndpoint = defineEndpoint("mutual-fund-insights", {
  mock: (page: number) => getMutualFundInsightsPage(page),
});

export const mutualFundThemeEndpoint = defineEndpoint("mutual-fund-theme", {
  mock: (themeId: MutualFundThemeId) => getMutualFundTheme(themeId),
});

// ── Stock ────────────────────────────────────────────────────────────────────

export const marketCatalogEndpoint = defineEndpoint("market-catalog", {
  mock: (id: MarketId) => MARKET_CATALOG[id],
});

export const marketIndexPageEndpoint = defineEndpoint("market-index-page", {
  mock: (slug: string) => getMarketIndexPage(slug),
});

export const industrySectorPageEndpoint = defineEndpoint("industry-sector-page", {
  mock: (slug: string) => getIndustrySectorPage(slug),
});

export const stockProductDetailEndpoint = defineEndpoint("stock-product-detail", {
  mock: (id: string) => getStockProductDetail(id),
});

export const stockCrossSellDetailEndpoint = defineEndpoint("stock-cross-sell-detail", {
  mock: (kind: StockCrossSellKind) => STOCK_CROSS_SELL_DETAIL[kind],
});

export const stockTabNoticeEndpoint = defineEndpoint("stock-tab-notice", {
  mock: (symbol: string, tab: StockNoticeTab) => getStockTabNotice(symbol, tab),
});

export const stockRelatedProductsEndpoint = defineEndpoint("stock-related-products", {
  mock: (symbol: string) => getRelatedProducts(symbol),
});

export const stockCompanyEventsEndpoint = defineEndpoint("stock-company-events", {
  mock: (symbol: string) => getStockCompanyEvents(symbol),
});

// ── Recommended ──────────────────────────────────────────────────────────────

export const productTrendingGroupsEndpoint = defineEndpoint("product-trending-groups", {
  mock: () => PRODUCT_TRENDING_GROUPS,
});
