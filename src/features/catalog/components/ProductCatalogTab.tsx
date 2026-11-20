"use client";

import { useEffect, type RefObject } from "react";
import type { FixedIncomeBond } from "@/features/catalog/fixed-income/lib/fixed-income-data";
import type { TrendingSort } from "@/features/catalog/product-trending/lib/product-trending-data";
import type {
  MobileFundGroupId,
  MutualFundThemeId,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import type { GlobalBondIssuerId } from "@/features/catalog/global-bond/lib/global-bond-data";
import type { ThaiStructuredProduct } from "@/features/catalog/structured-product/lib/thai-structured-data";
import type { TopIdeaSector } from "@/features/catalog/top-idea/lib/top-idea-data";
import type { StructuredProduct } from "@/features/catalog/structured-product/lib/structured-product-data";
import type { InvestmentSolutionId } from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import { useScrollThreshold } from "@/features/catalog/hooks/use-scroll-threshold";
import { useDragScroll } from "@/features/catalog/hooks/use-drag-scroll";
import { useProductCatalogLoading } from "@/features/catalog/hooks/use-catalog";
import { useCatalogDetailState } from "@/features/catalog/hooks/use-catalog-detail-state";
import { useProductCatalogSearch } from "@/features/catalog/hooks/use-product-catalog-search";
import { useHasLoaded } from "@/lib/api/resource";
import { renderCatalogStateDetail } from "./CatalogStateDetail";
import { ProductCatalogCategoryBody } from "./ProductCatalogCategoryBody";
import { ProductCatalogHeader } from "./ProductCatalogHeader";
import { ProductCatalogSearchOverlay } from "./ProductCatalogSearchOverlay";

export type CatalogNavigation = {
  onProductSelect: (product: StructuredProduct) => void;
  onAllProductsView: () => void;
  onTopIdeaSelect: (sector: TopIdeaSector) => void;
  onAllTopIdeasView: () => void;
  onInvestmentSolutionSelect: (id: InvestmentSolutionId) => void;
  onFixedIncomeBondSelect: (bond: FixedIncomeBond) => void;
  onGlobalBondIssuerSelect: (issuerId: GlobalBondIssuerId) => void;
  onAllGlobalBondsView: () => void;
  onThaiProductSelect: (product: ThaiStructuredProduct) => void;
  onMutualFundSelect: (fundId: string) => void;
  onMutualFundTopPerformersSeeAll: (groupId: MobileFundGroupId) => void;
  onMutualFundInsightsSeeAll: () => void;
  onMutualFundThemeSeeAll: (themeId: MutualFundThemeId) => void;
  onRoboAdvisorySelect: (clientId: string) => void;
  onDefinitSelect: (clientId: string) => void;
  onTrendingSeeAll: (groupId: string, sort: TrendingSort) => void;
};

export function ProductCatalogTab({
  searchValue: searchValueProp,
  onSearchChange,
  searchOpen: searchOpenProp,
  onSearchOpenChange,
  searchAnchorRef,
  onDetailViewChange,
  navigation,
  activeCategory,
  onCategoryChange,
}: {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** Overlay open state when the host owns it (e.g. it hosts its own search bar); uncontrolled otherwise. */
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  /**
   * A search bar rendered outside this component (the sticky header slot) that
   * the overlay should anchor to. Takes priority over the in-page bars, which
   * are collapsed away whenever that header bar is the visible one.
   */
  searchAnchorRef?: RefObject<HTMLDivElement | null>;
  onDetailViewChange?: (isDetail: boolean) => void;
  navigation?: CatalogNavigation;
  /** Category tab id when the host owns it (URL-driven); uncontrolled otherwise. */
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
} = {}) {
  const { activeProductTab, isDetailView, nav, handleProductTabChange, detail } =
    useCatalogDetailState({ navigation, activeCategory, onCategoryChange });

  const mobileScrolled = useScrollThreshold();
  const drag = useDragScroll();
  const isLoading = useProductCatalogLoading();
  const hasLoaded = useHasLoaded(isLoading);

  const search = useProductCatalogSearch({
    searchValue: searchValueProp,
    onSearchChange,
    searchOpen: searchOpenProp,
    onSearchOpenChange,
    searchAnchorRef,
    mobileScrolled,
    nav,
  });

  useEffect(() => {
    onDetailViewChange?.(isDetailView);
  }, [isDetailView, onDetailViewChange]);

  // ── State-based detail views ────────────────────────────────────────────────
  // Only used when URL navigation is not provided (e.g. client pages).
  const stateDetail = navigation ? null : renderCatalogStateDetail(detail);
  if (stateDetail) return stateDetail;

  return (
    // Root: full-bleed — negative margin + matching width expansion
    <div className="flex w-full flex-1 flex-col" style={{ backgroundColor: "white" }}>
      <ProductCatalogHeader
        search={search}
        isLoading={isLoading}
        hasLoaded={hasLoaded}
        activeProductTab={activeProductTab}
        onTabChange={handleProductTabChange}
        mobileScrolled={mobileScrolled}
      />

      {/* ── Search overlay: focusing either search bar above pops this open as a floating modal overlapping it ── */}
      <ProductCatalogSearchOverlay search={search} />

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <ProductCatalogCategoryBody
        activeProductTab={activeProductTab}
        nav={nav}
        isLoading={isLoading}
        drag={drag}
      />
    </div>
  );
}
