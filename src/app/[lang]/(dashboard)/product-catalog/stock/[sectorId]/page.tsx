"use client";

import { Suspense, use } from "react";
import { notFound } from "next/navigation";
import { MarketIndexDetail } from "../../../client/[id]/MarketIndexDetail";
import { SetIndustrySectorDetail } from "../../../client/[id]/SetIndustrySectorDetail";
import { StockProductDetail } from "../../../client/[id]/StockProductDetail";
import {
  useIndustrySectorPage,
  useMarketIndexPage,
  useStockProductDetail,
} from "@/hooks/use-catalog";
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
  // All three unconditionally — hooks can't sit behind the branch they decide.
  const index = useMarketIndexPage(sectorId);
  const sector = useIndustrySectorPage(sectorId);
  const quote = useStockProductDetail(sectorId);

  if (STOCK_STATIC_ROUTES.has(sectorId)) {
    notFound();
  }

  // Index slugs are prefixed (`index-th-set`), so this can't shadow a sector id
  // or a ticker — check it first and fall through when it doesn't match.
  // The index and sector screens gate on their own hook and draw their own
  // skeleton; the ticker screen takes its detail as a prop, so it is gated here.
  if (index.data) {
    return <MarketIndexDetail slug={sectorId} onBack={goBack} />;
  }

  if (sector.data) {
    return <SetIndustrySectorDetail sectorId={sectorId} onBack={goBack} />;
  }

  // Above the not-found fall-through: while nothing has resolved yet there is
  // no telling which screen this id is, and a ticker is by far the most common
  // landing, so its loading view stands in rather than flashing a 404. The
  // ticker screen draws that loading view itself (whole page, tab strip
  // included); its tabs then gate their own bodies on their own resources.
  const loading = quote.isLoading || index.isLoading || sector.isLoading;
  if (loading || quote.data) {
    return (
      <Suspense fallback={null}>
        <StockProductDetail detail={quote.data} isLoading={loading} onBack={goBack} />
      </Suspense>
    );
  }

  notFound();
}
