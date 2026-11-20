"use client";

import type { ReactNode } from "react";
import { ChartLineUpIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { FixedIncomeTab } from "@/features/catalog/fixed-income/components/FixedIncomeTab";
import { GlobalBondTab } from "@/features/catalog/global-bond/components/GlobalBondTab";
import { MutualFundTab } from "@/features/catalog/mutual-fund/components/MutualFundTab";
import { StockTab } from "@/features/catalog/stock/components/StockTab";
import { ProductTrendingTab } from "@/features/catalog/product-trending/components/ProductTrendingTab";
import { RoboAdvisoryTab } from "@/features/catalog/robo-advisory/components/RoboAdvisoryTab";
import { ThaiStructuredProductTable } from "@/features/catalog/structured-product/components/ThaiStructuredProductTable";
import type { useDragScroll } from "@/features/catalog/hooks/use-drag-scroll";
import { useT } from "@/i18n/I18nProvider";
import type { CatalogNavigation } from "./ProductCatalogTab";
import { ProductCatalogTabSkeleton } from "./ProductCatalogSkeletons";
import {
  InvestmentSolutionSection,
  StructuredProductGridSection,
  TopIdeaStrip,
  TopPickSection,
} from "./ProductCatalogSections";

/**
 * Tabs whose nav shape shipped ahead of their content — the catalog reads as
 * complete while the data behind them is still being built, the same bargain
 * the coming-soon sidebar pages make. Each renders nothing but an empty state;
 * drop the entry here once the tab has a real view to show.
 */
const EMPTY_CATALOG_TABS: Record<string, { icon: ReactNode }> = {
  // Title and body: `t.products.catalog.emptyTabs[id]`.
  tfex: {
    icon: <ChartLineUpIcon size={40} className="text-[var(--text-default-placeholder)]" />,
  },
};

/** The active category tab's content. */
export function ProductCatalogCategoryBody({
  activeProductTab,
  nav,
  isLoading,
  drag,
}: {
  activeProductTab: string;
  nav: CatalogNavigation;
  isLoading: boolean;
  drag: ReturnType<typeof useDragScroll>;
}) {
  const t = useT();
  const labels = t.products.catalog;
  return (
    <FadeIn key={activeProductTab} className="flex w-full flex-col">
      {/* Stock and Robo Advisory skip the catalog's shared loading
          skeleton: Stock reads its market through `useMarketCatalog` and
          renders its own (`StockTabSkeleton`); Robo Advisory's data is local
          mock content, but its cards open a client picker, so it shows its
          own skeleton until the client list is in. */}
      {activeProductTab === "stock" ? (
        <StockTab />
      ) : activeProductTab === "product-trending" ? (
        /* Renders its own skeleton (via `useProductTrendingGroups`), so it
           skips the catalog's shared one alongside Stock. */
        <ProductTrendingTab nav={nav} />
      ) : EMPTY_CATALOG_TABS[activeProductTab] ? (
        /* Sits in the no-skeleton branch because there is nothing to wait for. */
        <div className="w-full bg-white">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-12 lg:px-6">
            <EmptyState
              {...EMPTY_CATALOG_TABS[activeProductTab]}
              title={labels.emptyTabs[activeProductTab]?.title ?? ""}
              body={labels.emptyTabs[activeProductTab]?.body ?? ""}
            />
          </div>
        </div>
      ) : activeProductTab === "robo-advisory" ? (
        <RoboAdvisoryTab
          onRoboAdvisorySelect={nav.onRoboAdvisorySelect}
          onDefinitSelect={nav.onDefinitSelect}
        />
      ) : isLoading ? (
        <ProductCatalogTabSkeleton tab={activeProductTab} />
      ) : (
        <>
          {activeProductTab === "fixed-income" && (
            <FixedIncomeTab onBondSelect={nav.onFixedIncomeBondSelect} />
          )}

          {activeProductTab === "global-bond" && (
            <GlobalBondTab
              onIssuerSelect={nav.onGlobalBondIssuerSelect}
              onViewAll={nav.onAllGlobalBondsView}
            />
          )}

          {activeProductTab === "structured" && (
            <div className="flex w-full flex-col items-center gap-6" style={{ paddingTop: 24 }}>
              <TopIdeaStrip
                drag={drag}
                onTopIdeaSelect={nav.onTopIdeaSelect}
                onAllTopIdeasView={nav.onAllTopIdeasView}
              />
              <InvestmentSolutionSection
                onInvestmentSolutionSelect={nav.onInvestmentSolutionSelect}
              />
              <TopPickSection onProductSelect={nav.onProductSelect} />
              <StructuredProductGridSection
                title={labels.allGlobalStructured}
                onProductSelect={nav.onProductSelect}
                onAllProductsView={nav.onAllProductsView}
              />
            </div>
          )}

          {activeProductTab === "thai-structured" && (
            <div className="flex w-full flex-col items-center gap-6" style={{ paddingTop: 24 }}>
              <TopIdeaStrip
                drag={drag}
                onTopIdeaSelect={nav.onTopIdeaSelect}
                onAllTopIdeasView={nav.onAllTopIdeasView}
              />
              <InvestmentSolutionSection
                onInvestmentSolutionSelect={nav.onInvestmentSolutionSelect}
                bgImage="/products/structured-product/thai-structure-bg.webp"
              />
              <TopPickSection onProductSelect={nav.onProductSelect} />

              {/* ── Thai FCN Table ─────────────────────────────────────────────────── */}
              <div
                className="w-full"
                style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}
              >
                <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 lg:px-6">
                  <p
                    className="font-bold"
                    style={{ color: "#101828", fontSize: 22, lineHeight: "32px" }}
                  >
                    {labels.allThaiFcn}
                  </p>
                  <ThaiStructuredProductTable onRowClick={nav.onThaiProductSelect} />
                </div>
              </div>
            </div>
          )}

          {activeProductTab === "mutual-fund" && (
            <MutualFundTab
              onFundSelect={nav.onMutualFundSelect}
              onTopPerformersSeeAll={nav.onMutualFundTopPerformersSeeAll}
              onInsightsSeeAll={nav.onMutualFundInsightsSeeAll}
              onThemeSeeAll={nav.onMutualFundThemeSeeAll}
            />
          )}
        </>
      )}
    </FadeIn>
  );
}
