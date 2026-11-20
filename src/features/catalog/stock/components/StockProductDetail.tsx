"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { SendProposalButton } from "@/features/orders/components/SendProposalButton";
import { offeredProductId } from "@/features/orders/lib/offered-products";
import {
  relatedProductKinds,
  STOCK_DETAIL_TABS,
  type StockDetailTab,
  type StockProductDetail,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import {
  CATALOG_DETAIL_WIDTH,
  useCatalogDetailScrollTop,
} from "@/features/catalog/components/ProductCatalogTabbedDetailLayout";
import { StockCompanyTab } from "./StockCompanyTab";
import { StockRelatedProductTab } from "./StockRelatedProductTab";
import {
  StockDetailHeaderSkeleton,
  StockMarketInfoBodySkeleton,
  StockProposalButtonSkeleton,
  StockQuoteBlockSkeleton,
  StockTabBodySkeleton,
} from "./StockCatalogSkeletons";
import { MarketInfoBody } from "./stock-detail/MarketInfoBody";
import { StockNewsTab, StockResearchTab, StockTechnicalTab } from "./stock-detail/NoticeTabs";
import { QuoteBlock } from "./stock-detail/QuoteBlock";
import { StockDetailHeader } from "./stock-detail/StockDetailHeader";
import { setQueryState, withQuery } from "@/lib/query-state";
import { TabsSkeleton } from "@/components/ui/skeleton";
import { useStockRelatedProducts } from "@/features/catalog/hooks/use-catalog";
import { useT } from "@/i18n/I18nProvider";

function tabQueryValue(tab: StockDetailTab): string | null {
  if (tab === "Market Info") return null;
  if (tab === "Related Product") return "related";
  return tab.toLowerCase();
}

function tabFromQuery(value: string | null): StockDetailTab {
  if (value === "related") return "Related Product";
  const match = STOCK_DETAIL_TABS.find((tab) => tab.toLowerCase() === value);
  return match ?? "Market Info";
}

/**
 * The ticker screen, loading included — two levels:
 *
 * 1. First load (`isLoading`, the page resource): the whole screen is skeleton,
 *    tab strip included, so nothing can be pressed before there is a quote.
 *    The body skeleton still follows `?tab=` so a deep link lands on the
 *    right shape.
 * 2. Once the quote is in, the real tabs are live and every tab but Market Info
 *    reads its own resource: a tab whose data is still loading skeletons its
 *    body only. "Related Product" is offered while its resource loads, and
 *    dropped once it resolves with nothing in it.
 */
export function StockProductDetail({
  detail: resolved,
  isLoading,
  onBack,
}: {
  detail: StockProductDetail | null;
  isLoading: boolean;
  onBack: () => void;
}) {
  const t = useT();
  const detail = isLoading ? null : resolved;
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const symbol = detail?.symbol ?? null;
  const relatedResource = useStockRelatedProducts(symbol);
  const related = relatedResource.isLoading ? null : relatedResource.data;
  const tabs = useMemo<readonly StockDetailTab[]>(
    () =>
      !related || relatedProductKinds(related).length > 0
        ? STOCK_DETAIL_TABS
        : STOCK_DETAIL_TABS.filter((tab) => tab !== "Related Product"),
    [related],
  );
  // The URL is the source of truth; `setQueryState` keeps `useSearchParams` in sync.
  const requestedTab = tabFromQuery(searchParams.get("tab"));
  const activeTab: StockDetailTab = tabs.includes(requestedTab) ? requestedTab : "Market Info";

  useCatalogDetailScrollTop([symbol]);

  function selectTab(tab: StockDetailTab) {
    setQueryState(
      withQuery(pathname, searchParams, {
        tab: tabQueryValue(tab),
        related: tab === "Related Product" ? searchParams.get("related") : null,
      }),
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-neutral-50 pt-4 pb-20 md:pt-6 lg:pt-8">
      <div className={`flex flex-col gap-2 ${CATALOG_DETAIL_WIDTH.narrow}`}>
        {!detail ? (
          <StockDetailHeaderSkeleton />
        ) : (
          <StockDetailHeader detail={detail} onBack={onBack} />
        )}

        <div className="flex w-full flex-col gap-6 rounded-2xl bg-white px-4 py-8 shadow-[0px_0px_4px_rgba(0,0,0,0.02)] md:px-8 lg:px-14">
          {detail ? <QuoteBlock detail={detail} /> : <StockQuoteBlockSkeleton />}
          {/* Sticky against `<main>`, which is the page's scroller (see
              `useCatalogDetailScrollTop`). `top-0` pins it directly under the
              app header — the header is a flex sibling above the scrollport
              rather than an overlay, so there is no height to offset for.

              A direct child of the card, not of a wrapper shared with
              `QuoteBlock` as before: a sticky element can only travel inside its
              own parent's box, and that wrapper ended a few pixels below the
              tabs — the bar would have unstuck before it had moved. The card is
              the box the tabs should stay with, so the card has to be the
              parent, and `-mt-6` cancels the `gap-6` that promotion introduced
              so the bar still sits flush under the quote.

              `bg-white` earns its keep only once pinned: the tab row is
              transparent in flow and the body would otherwise scroll through
              it. */}
          {!detail ? (
            <TabsSkeleton count={tabs.length} className="-mt-6 w-full border-b border-black/10" />
          ) : (
            <div
              className="sticky top-0 z-20 -mt-6 flex w-full overflow-x-auto border-b border-black/10 bg-white"
              style={{ scrollbarWidth: "none" }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => selectTab(tab)}
                    // Matches `CatalogDetailTextTabs`: hover paint on the inactive
                    // tabs only. Trailing `!` because system-one ships its base
                    // utilities unlayered, where they outrank a `hover:` variant.
                    className={`flex shrink-0 cursor-pointer items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm leading-[24px] font-bold whitespace-nowrap transition-colors lg:min-w-[80px] lg:flex-1 ${
                      active
                        ? "border-brand-600 text-brand-600"
                        : "border-black/10 text-black/60 hover:bg-black/[0.03]! hover:text-neutral-900!"
                    }`}
                  >
                    {t.stock.detail.tabs[tab] ?? tab}
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 1 gate is `!detail` (the page resource); each branch below
              it gates on its own tab's resource. */}
          {!detail ? (
            activeTab === "Market Info" ? (
              <StockMarketInfoBodySkeleton />
            ) : (
              <StockTabBodySkeleton />
            )
          ) : activeTab === "Market Info" ? (
            <MarketInfoBody detail={detail} />
          ) : activeTab === "Related Product" ? (
            relatedResource.isLoading ? (
              <StockTabBodySkeleton />
            ) : related ? (
              <StockRelatedProductTab related={related} />
            ) : (
              <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-neutral-500">
                {t.stock.detail.noRelated}
              </div>
            )
          ) : activeTab === "Company" ? (
            <StockCompanyTab symbol={detail.symbol} companyName={detail.name} />
          ) : activeTab === "Research" ? (
            <StockResearchTab symbol={detail.symbol} />
          ) : activeTab === "Technical" ? (
            <StockTechnicalTab symbol={detail.symbol} />
          ) : (
            <StockNewsTab symbol={detail.symbol} />
          )}

          {/* Offered, never booked — see `SendProposalButton`. */}
          {detail ? (
            <SendProposalButton
              subject={{
                id: offeredProductId("stock", detail.symbol),
                underlying: detail.symbol,
                documents: t.stock.detail.proposalDocuments,
              }}
            />
          ) : (
            <StockProposalButtonSkeleton />
          )}
        </div>
      </div>
    </div>
  );
}
