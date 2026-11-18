"use client";

import { useMemo } from "react";
import Image from "next/image";
import { useLocalizedRouter } from "@/i18n/navigation";
import { useIndustrySectorPage } from "@/hooks/use-catalog";
import { SetIndustrySectorDetailSkeleton } from "./StockCatalogSkeletons";
import {
  CatalogDetailBackHeader,
  CatalogDetailTextTabs,
  CATALOG_DETAIL_WIDTH,
  preserveTabStripScroll,
  useCatalogDetailScrollTop,
} from "./ProductCatalogTabbedDetailLayout";

const NARROW = CATALOG_DETAIL_WIDTH.narrow;
import {
  getSectorStockBatch,
  industrySectorHref,
  localizeSector,
  SECTOR_STOCK_PAGE_SIZE,
  type IndustrySectorPage,
} from "./stock-industry-sector-data";
import { stockProductHref } from "./stock-product-detail-data";
import { SectorGlyph } from "./stock-ui";
import {
  HeroPercentPill,
  navigateWithoutFlicker,
  StockDetailList,
} from "./stock-detail-list";
import { useT } from "@/i18n/I18nProvider";

function SectorHeroBand({ page, sector }: { page: IndustrySectorPage; sector: IndustrySectorPage["sector"] }) {
  const { description } = page;
  const trend = sector.trend;
  return (
    <div className="relative w-full overflow-hidden">
      <Image
        src="/products/stock/sector-hero-bg.png"
        alt=""
        fill
        className="object-cover pointer-events-none"
        sizes="100vw"
        priority
      />
      <div className="relative z-[1] mx-auto flex max-w-[996px] items-center gap-6 px-4 py-10 md:px-8 lg:px-0">
        <span className="relative shrink-0 text-[#0a6ee7]">
          <SectorGlyph id={sector.id} size={64} color="#0a6ee7" />
        </span>
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate text-2xl font-bold leading-9 text-[#101828]">{sector.name}</p>
          <p className="text-base leading-[24px] text-[#4a5565]">{description}</p>
        </div>
        <div className="relative flex shrink-0 items-center gap-2 whitespace-nowrap">
          {trend === "flat" ? (
            <span className="text-base leading-[24px] text-[#6a7282]">{sector.changeAmount}</span>
          ) : (
            <>
              <span className="text-base leading-[24px]" style={{ color: trend === "up" ? "#016630" : "#c10007" }}>
                {sector.changeAmount}
              </span>
              <HeroPercentPill trend={trend} percentBody={sector.changePercent} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Figma node 21191:58954 — SET Industry Sector drill-in (Resource desktop). */
export function SetIndustrySectorDetail({
  sectorId,
  onBack,
}: {
  sectorId: string;
  onBack: () => void;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  const { data: page, isLoading } = useIndustrySectorPage(sectorId);
  const sectors = useMemo(
    () => (page ? page.sectors.map((s) => localizeSector(t, page.market, s)) : []),
    [page, t],
  );

  useCatalogDetailScrollTop([sectorId]);

  // Above the not-found branch, or every visit flashes "ไม่พบข้อมูล" first.
  // The whole page, tab strip included: picking another sector is a
  // navigation to that sector's own page, so every load here is a first load.
  if (isLoading) return <SetIndustrySectorDetailSkeleton />;

  if (!page) {
    return (
      <div className="flex min-h-full w-full flex-1 flex-col bg-white">
        <CatalogDetailBackHeader title={t.stock.sectorSection.title} onBack={onBack} className="!pt-8" />
        <p className={`text-center text-sm text-[#6a7282] ${NARROW}`}>{t.stock.notFound}</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#f9fafb]">
      {/* The header and the strip are siblings of the page root rather than
          sharing a wrapper: a sticky element can't travel outside its parent's
          box, and a two-row wrapper is only as tall as the two rows. */}
      <div className="bg-white pb-2">
        <CatalogDetailBackHeader title={t.stock.sectorSection.title} onBack={onBack} className="!pt-8" />
      </div>
      <CatalogDetailTextTabs
        sticky
        items={sectors.map((s) => ({
          id: s.id,
          label: s.name,
          icon: <SectorGlyph id={s.id} size={20} />,
        }))}
        activeId={page.sector.id}
        onSelect={(id) => {
          if (id === page.sector.id) return; // already there — nothing to swap
          // The strip is about to be torn down with the rest of the page; say
          // so, or it comes back at the default offset mid-click.
          preserveTabStripScroll();
          navigateWithoutFlicker(() => router.push(industrySectorHref(id, page.market)));
        }}
        fill={false}
        scrollButtons
      />

      <SectorHeroBand page={page} sector={localizeSector(t, page.market, page.sector)} />

      <StockDetailList
        resetKey={sectorId}
        initialStocks={page.stocks}
        loadBatch={(offset) => getSectorStockBatch(offset, SECTOR_STOCK_PAGE_SIZE, page.market)}
        totalCount={page.totalCount}
        updatedAt={t.stock.latestUpdate(page.updatedAt)}
        onSelect={(row) => router.push(stockProductHref(row.symbol))}
      />
    </div>
  );
}
