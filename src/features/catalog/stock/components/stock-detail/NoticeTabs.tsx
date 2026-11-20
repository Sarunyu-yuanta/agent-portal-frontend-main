"use client";

import type { StockTabNotice } from "@/features/catalog/stock/lib/stock-product-detail-data";
import { StockTabBodySkeleton } from "@/features/catalog/stock/components/StockCatalogSkeletons";
import {
  useStockNews,
  useStockResearch,
  useStockTechnical,
} from "@/features/catalog/hooks/use-catalog";
import { useT } from "@/i18n/I18nProvider";

function NoticeTabBody({
  notice,
  isLoading,
}: {
  notice: StockTabNotice | null;
  isLoading: boolean;
}) {
  const t = useT();
  // Loading and "nothing to say" were the same `null`, so a tab with no
  // notice sat on its skeleton for good.
  if (isLoading) return <StockTabBodySkeleton />;
  if (!notice) {
    return (
      <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-neutral-500">
        {t.stock.detail.noTabData}
      </div>
    );
  }
  return (
    <div className="flex min-h-[240px] items-center justify-center py-10 text-sm text-neutral-500">
      {t.stock.detail.tabNotice(t.stock.detail.tabs[notice.tab] ?? notice.tab)}
    </div>
  );
}

/* Research / Technical / News: one component per tab so each calls only its
 * own resource, and only once that tab is open. */
export function StockResearchTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockResearch(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}

export function StockTechnicalTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockTechnical(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}

export function StockNewsTab({ symbol }: { symbol: string }) {
  const { data, isLoading } = useStockNews(symbol);
  return <NoticeTabBody notice={data} isLoading={isLoading} />;
}
