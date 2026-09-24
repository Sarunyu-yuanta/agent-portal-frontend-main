"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { StockMiniChart } from "./StockMiniChart";
import {
  CatalogDetailBackHeader,
  CatalogDetailTextTabs,
  CATALOG_DETAIL_WIDTH,
  preserveTabStripScroll,
  useCatalogDetailScrollTop,
} from "./ProductCatalogTabbedDetailLayout";
import {
  getIndexStockBatch,
  getMarketIndexPage,
  INDEX_STOCK_PAGE_SIZE,
  marketIndexHref,
  type MarketIndexPage,
} from "./stock-index-data";
import { stockProductHref } from "./stock-product-detail-data";
import {
  HeroPercentPill,
  HERO_TREND_TEXT,
  navigateWithoutFlicker,
  StockDetailList,
} from "./stock-detail-list";

const NARROW = CATALOG_DETAIL_WIDTH.narrow;

/** Same band as the sector drill-in, with the index's own quote and 30-day
 *  sparkline where the sector page puts a glyph — it is the card the user
 *  clicked, opened up. */
function IndexHeroBand({ page }: { page: MarketIndexPage }) {
  const { index, description } = page;
  const trend = index.trend;
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
      <div className="relative z-[1] mx-auto flex max-w-[996px] flex-wrap items-center gap-6 px-4 py-10 md:px-8 lg:px-0">
        <Image
          src={index.icon}
          alt=""
          width={64}
          height={64}
          className="relative size-16 shrink-0 rounded-full"
        />
        <div className="relative flex min-w-0 flex-1 flex-col gap-2">
          <p className="truncate text-2xl font-bold leading-9 text-[#101828]">{index.code}</p>
          {description && (
            <p className="text-base leading-5 text-[#4a5565]">{description}</p>
          )}
        </div>
        <div className="relative flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-2xl font-bold leading-9 text-[#101828]">{index.price}</span>
            <span className="text-base leading-5" style={{ color: HERO_TREND_TEXT[trend] }}>
              {index.changeAmount}
            </span>
            <HeroPercentPill trend={trend} percentBody={index.changePercent} />
          </div>
          <StockMiniChart
            series={index.series}
            trend={trend}
            width={220}
            height={48}
            className="h-12 w-[220px]"
          />
        </div>
      </div>
    </div>
  );
}

/** Market-index drill-in: the board's indices as tabs, the clicked one as the
 *  hero, its members as the list. Shares every part below the hero with
 *  `SetIndustrySectorDetail` — see `stock-detail-list.tsx`. */
export function MarketIndexDetail({
  slug,
  onBack,
}: {
  slug: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const page = getMarketIndexPage(slug);

  useCatalogDetailScrollTop([slug]);

  if (!page) {
    return (
      <div className="flex min-h-full w-full flex-1 flex-col bg-white">
        <CatalogDetailBackHeader title="Market Index" onBack={onBack} className="!pt-8" />
        <p className={`text-center text-sm text-[#6a7282] ${NARROW}`}>ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#f9fafb]">
      {/* The header and the strip are siblings of the page root rather than
          sharing a wrapper: a sticky element can't travel outside its parent's
          box, and a two-row wrapper is only as tall as the two rows. */}
      <div className="bg-white pb-2">
        <CatalogDetailBackHeader title={page.title} onBack={onBack} className="!pt-8" />
      </div>
      <CatalogDetailTextTabs
        sticky
        items={page.indices.map((i) => ({
          id: i.code,
          label: i.code,
          icon: <Image src={i.icon} alt="" width={20} height={20} className="size-5 rounded-full" />,
        }))}
        activeId={page.index.code}
        onSelect={(code) => {
          if (code === page.index.code) return; // already there — nothing to swap
          // The strip is about to be torn down with the rest of the page; say
          // so, or it comes back at the default offset mid-click.
          preserveTabStripScroll();
          navigateWithoutFlicker(() => router.push(marketIndexHref(code, page.market)));
        }}
        // Unlike the sector strip's 8–11 long names, a board has 5–6 short
        // index codes, so they stretch to fill the row without shrinking
        // below their own text — no scroll arrows needed either.
      />

      <IndexHeroBand page={page} />

      <StockDetailList
        resetKey={slug}
        initialStocks={page.stocks}
        loadBatch={(offset) => getIndexStockBatch(offset, INDEX_STOCK_PAGE_SIZE, page.market)}
        totalCount={page.totalCount}
        updatedAt={page.updatedAt}
        onSelect={(row) => router.push(stockProductHref(row.symbol))}
      />
    </div>
  );
}
