"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { SetIndustrySectorDetail } from "../../../client/[id]/SetIndustrySectorDetail";
import { StockProductDetail } from "../../../client/[id]/StockProductDetail";
import { getSetIndustrySectorPage } from "../../../client/[id]/stock-industry-sector-data";
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

  const sector = getSetIndustrySectorPage(sectorId);
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
