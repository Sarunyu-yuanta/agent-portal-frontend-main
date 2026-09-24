"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { MarketIndexDetail } from "../../../client/[id]/MarketIndexDetail";
import { SetIndustrySectorDetail } from "../../../client/[id]/SetIndustrySectorDetail";
import { StockProductDetail } from "../../../client/[id]/StockProductDetail";
import { getIndustrySectorPage } from "../../../client/[id]/stock-industry-sector-data";
import { getMarketIndexPage } from "../../../client/[id]/stock-index-data";
import { getStockProductDetail } from "../../../client/[id]/stock-product-detail-data";
import { useSectionBack } from "@/hooks/use-section-back";

const STOCK_STATIC_ROUTES = new Set(["dr", "etf"]);

export default function StockCatalogDetailPage({
  params,
}: {
  params: Promise<{ sectorId: string }>;
}) {
  const { sectorId: raw } = use(params);
  const sectorId = decodeURIComponent(raw);
  const goBack = useSectionBack();

  if (STOCK_STATIC_ROUTES.has(sectorId)) {
    notFound();
  }

  // Index slugs are prefixed (`index-th-set`), so this can't shadow a sector id
  // or a ticker — check it first and fall through when it doesn't match.
  if (getMarketIndexPage(sectorId)) {
    return <MarketIndexDetail slug={sectorId} onBack={goBack} />;
  }

  const sector = getIndustrySectorPage(sectorId);
  if (sector) {
    return <SetIndustrySectorDetail sectorId={sectorId} onBack={goBack} />;
  }

  const quote = getStockProductDetail(sectorId);
  if (quote) {
    return (
      <Suspense fallback={null}>
        <StockProductDetail detail={quote} onBack={goBack} />
      </Suspense>
    );
  }

  notFound();
}
