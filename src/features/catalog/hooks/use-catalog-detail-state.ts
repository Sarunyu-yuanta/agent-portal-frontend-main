"use client";

import { useState } from "react";
import type { FixedIncomeBond } from "@/features/catalog/fixed-income/lib/fixed-income-data";
import type { GlobalBondIssuerId } from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  mutualFundGroupHref,
  mutualFundInsightsHref,
  mutualFundThemeHref,
  type MobileFundGroupId,
  type MutualFundThemeId,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import {
  trendingGroupHref,
  type TrendingSort,
} from "@/features/catalog/product-trending/lib/product-trending-data";
import type { InvestmentSolutionId } from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import type { StructuredProduct } from "@/features/catalog/structured-product/lib/structured-product-data";
import type { ThaiStructuredProduct } from "@/features/catalog/structured-product/lib/thai-structured-data";
import type { TopIdeaSector } from "@/features/catalog/top-idea/lib/top-idea-data";
import { advisoryDetailHref } from "@/features/catalog/lib/product-catalog-routes";
import type { CatalogNavigation } from "@/features/catalog/components/ProductCatalogTab";
import { useLocalizedRouter } from "@/i18n/navigation";

/**
 * The catalog's active category tab and its state-based detail views, plus the
 * navigation handlers that open them — the host's URL-based `navigation` when
 * provided, else this internal state.
 */
export function useCatalogDetailState({
  navigation,
  activeCategory,
  onCategoryChange,
}: {
  navigation?: CatalogNavigation;
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
}) {
  const router = useLocalizedRouter();
  const [activeTabInternal, setActiveTabInternal] = useState("structured");
  const activeProductTab = activeCategory ?? activeTabInternal;
  const [selectedFixedIncomeBond, setSelectedFixedIncomeBond] = useState<FixedIncomeBond | null>(
    null,
  );
  const [selectedFixedIncomeCompany, setSelectedFixedIncomeCompany] = useState<string | null>(null);
  const [fixedIncomeView, setFixedIncomeView] = useState<"bond" | "company" | null>(null);
  const [selectedGlobalBondIssuer, setSelectedGlobalBondIssuer] =
    useState<GlobalBondIssuerId | null>(null);
  const [showAllGlobalBonds, setShowAllGlobalBonds] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [selectedTopIdea, setSelectedTopIdea] = useState<TopIdeaSector | null>(null);
  const [selectedInvestmentSolution, setSelectedInvestmentSolution] =
    useState<InvestmentSolutionId | null>(null);
  const [showAllTopIdeas, setShowAllTopIdeas] = useState(false);
  const [showAllStructuredProducts, setShowAllStructuredProducts] = useState(false);
  const [selectedThaiProduct, setSelectedThaiProduct] = useState<ThaiStructuredProduct | null>(
    null,
  );
  const [selectedMutualFundId, setSelectedMutualFundId] = useState<string | null>(null);

  const isDetailView = !!(
    showAllGlobalBonds ||
    selectedGlobalBondIssuer ||
    (fixedIncomeView === "bond" && selectedFixedIncomeBond) ||
    (fixedIncomeView === "company" && selectedFixedIncomeCompany) ||
    selectedProduct ||
    selectedTopIdea ||
    selectedInvestmentSolution ||
    showAllTopIdeas ||
    showAllStructuredProducts ||
    selectedThaiProduct ||
    selectedMutualFundId
  );

  // Unified navigation handlers — use URL-based navigation when provided, else internal state
  const nav = {
    onProductSelect: navigation?.onProductSelect ?? setSelectedProduct,
    onAllProductsView: navigation?.onAllProductsView ?? (() => setShowAllStructuredProducts(true)),
    onTopIdeaSelect: navigation?.onTopIdeaSelect ?? setSelectedTopIdea,
    onAllTopIdeasView: navigation?.onAllTopIdeasView ?? (() => setShowAllTopIdeas(true)),
    onInvestmentSolutionSelect:
      navigation?.onInvestmentSolutionSelect ?? setSelectedInvestmentSolution,
    onFixedIncomeBondSelect:
      navigation?.onFixedIncomeBondSelect ??
      ((bond: FixedIncomeBond) => {
        setSelectedFixedIncomeBond(bond);
        setFixedIncomeView("bond");
      }),
    onGlobalBondIssuerSelect: navigation?.onGlobalBondIssuerSelect ?? setSelectedGlobalBondIssuer,
    onAllGlobalBondsView: navigation?.onAllGlobalBondsView ?? (() => setShowAllGlobalBonds(true)),
    onThaiProductSelect: navigation?.onThaiProductSelect ?? setSelectedThaiProduct,
    onMutualFundSelect:
      navigation?.onMutualFundSelect ?? ((fundId: string) => setSelectedMutualFundId(fundId)),
    onMutualFundTopPerformersSeeAll:
      navigation?.onMutualFundTopPerformersSeeAll ??
      ((groupId: MobileFundGroupId) => router.push(mutualFundGroupHref(groupId))),
    onMutualFundInsightsSeeAll:
      navigation?.onMutualFundInsightsSeeAll ?? (() => router.push(mutualFundInsightsHref())),
    onMutualFundThemeSeeAll:
      navigation?.onMutualFundThemeSeeAll ??
      ((themeId: MutualFundThemeId) => router.push(mutualFundThemeHref(themeId))),
    onTrendingSeeAll:
      navigation?.onTrendingSeeAll ??
      ((groupId: string, sort: TrendingSort) => router.push(trendingGroupHref(groupId, sort))),
    onRoboAdvisorySelect:
      navigation?.onRoboAdvisorySelect ??
      ((clientId) => router.push(advisoryDetailHref("/product-catalog/robo-advisory", clientId))),
    onDefinitSelect:
      navigation?.onDefinitSelect ??
      ((clientId) => router.push(advisoryDetailHref("/product-catalog/definit", clientId))),
  };

  const resetFixedIncomeNav = () => {
    setSelectedFixedIncomeBond(null);
    setSelectedFixedIncomeCompany(null);
    setFixedIncomeView(null);
  };

  const handleProductTabChange = (id: string) => {
    if (onCategoryChange) onCategoryChange(id);
    else setActiveTabInternal(id);
    setSelectedProduct(null);
    setShowAllTopIdeas(false);
    setSelectedTopIdea(null);
    setSelectedInvestmentSolution(null);
    setShowAllStructuredProducts(false);
    resetFixedIncomeNav();
    setSelectedGlobalBondIssuer(null);
    setShowAllGlobalBonds(false);
    setSelectedThaiProduct(null);
    setSelectedMutualFundId(null);
  };

  return {
    activeProductTab,
    isDetailView,
    nav,
    handleProductTabChange,
    detail: {
      selectedMutualFundId,
      setSelectedMutualFundId,
      selectedThaiProduct,
      setSelectedThaiProduct,
      showAllGlobalBonds,
      setShowAllGlobalBonds,
      selectedGlobalBondIssuer,
      setSelectedGlobalBondIssuer,
      fixedIncomeView,
      setFixedIncomeView,
      selectedFixedIncomeBond,
      setSelectedFixedIncomeBond,
      selectedFixedIncomeCompany,
      setSelectedFixedIncomeCompany,
      resetFixedIncomeNav,
      selectedProduct,
      setSelectedProduct,
      selectedTopIdea,
      setSelectedTopIdea,
      selectedInvestmentSolution,
      setSelectedInvestmentSolution,
      showAllTopIdeas,
      setShowAllTopIdeas,
      showAllStructuredProducts,
      setShowAllStructuredProducts,
    },
  };
}

/** The state-based detail selection, as `renderCatalogStateDetail` reads it. */
export type CatalogDetailState = ReturnType<typeof useCatalogDetailState>["detail"];
