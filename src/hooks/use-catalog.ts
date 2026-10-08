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
  getCompanyPrimaryBonds,
  getCompanySecondaryBonds,
  getFixedIncomeBond,
  resolveFixedIncomeCompany,
  type FixedIncomeBond,
  type FixedIncomeCompany,
} from "@/app/(dashboard)/client/[id]/fixed-income-data";
import {
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
  return products.isLoading || bonds.isLoading || topIdeas.isLoading;
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
