"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CaretDownIcon, CircleNotchIcon, TrendUpIcon } from "@phosphor-icons/react";
import { StockLargeAssetCard } from "./StockLargeAssetCard";
import {
  CatalogDetailBackHeader,
  CatalogDetailTextTabs,
  CATALOG_DETAIL_WIDTH,
  useCatalogDetailScrollTop,
} from "./ProductCatalogTabbedDetailLayout";

const NARROW = CATALOG_DETAIL_WIDTH.narrow;
import {
  getIndustrySectorPage,
  getSectorStockBatch,
  industrySectorHref,
  SECTOR_STOCK_PAGE_SIZE,
  type IndustrySectorMarket,
  type IndustrySectorPage,
} from "./stock-industry-sector-data";
import { stockProductHref } from "./stock-product-detail-data";
import type { StockRow, Trend } from "./stock-data";
import { SectorGlyph, TREND_PILL_BG } from "./stock-ui";

/** Local on purpose — the hero band's neutral is lighter than the Stock tab's
 *  `TREND_TEXT` (#4a5565 there vs #6a7282 here), so these must not be merged.
 *  `TREND_PILL_BG` is identical, hence shared from `stock-ui`. */
const TREND_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#6a7282" };

function HeroPercentPill({ trend, percentBody }: { trend: Trend; percentBody: string }) {
  if (trend === "flat") return null;
  const sign = trend === "up" ? "+" : "-";
  const body = percentBody.replace(/^[+-]/, "");
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-sm leading-5"
      style={{ backgroundColor: TREND_PILL_BG[trend], color: TREND_TEXT[trend] }}
    >
      <span>{sign}</span>
      <span>{body}</span>
    </span>
  );
}

function SectorHeroBand({ page }: { page: IndustrySectorPage }) {
  const { sector, description } = page;
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
          <p className="text-base leading-5 text-[#4a5565]">{description}</p>
        </div>
        <div className="relative flex shrink-0 items-center gap-2 whitespace-nowrap">
          {trend === "flat" ? (
            <span className="text-base leading-5 text-[#6a7282]">{sector.changeAmount}</span>
          ) : (
            <>
              <span className="text-base leading-5" style={{ color: trend === "up" ? "#016630" : "#c10007" }}>
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

/**
 * Resolves once `target` next has a child added or removed — i.e. once
 * Next's router has actually swapped in the new sector's DOM, however long
 * that takes. `router.push()` returns `void` and completes on a later tick
 * (App Router remounts the whole dynamic-segment subtree — confirmed here:
 * Resources → Financials swaps `<main>`'s child node outright), so a fixed
 * delay would either fire before the real swap (capturing a no-op "after"
 * snapshot, which is what shipped first and still flickered) or add a
 * needless wait; watching for the mutation itself is exact either way.
 */
// No `requestAnimationFrame` wait after the mutation fires, on purpose —
// measured it adding ~700ms: the browser appears to withhold rAF's
// next-paint callback while a view-transition update callback is still
// pending, so awaiting rAF from inside that callback stalls on itself. The
// mutation firing is itself proof React already committed the new DOM.
function waitForDomSwap(target: Element): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      resolve();
    });
    observer.observe(target, { childList: true, subtree: true });
  });
}

/**
 * Next's App Router remounts a dynamic-segment page's whole subtree on every
 * param change, so switching sectors always tears down and rebuilds this
 * page's DOM rather than just re-rendering it. React's `<ViewTransition>`
 * (the documented fix, `node_modules/next/dist/docs/01-app/02-guides/view-
 * transitions.md`) isn't available in this project's React build, so this
 * calls the browser's native View Transitions API directly instead — same
 * effect (crossfade instead of a hard swap), feature-detected so it's a
 * no-op, not a crash, wherever the API is missing (older Safari/Firefox).
 */
function navigateWithoutFlicker(run: () => void) {
  if (typeof document === "undefined" || !("startViewTransition" in document)) {
    run();
    return;
  }
  const target = document.querySelector("main") ?? document.body;
  document.startViewTransition(async () => {
    // Races a timeout too — e.g. re-clicking the already-active tab pushes
    // the same href, which Next no-ops, so no mutation would ever arrive to
    // resolve `waitForDomSwap` on its own.
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 800));
    const swapped = waitForDomSwap(target);
    run();
    await Promise.race([swapped, timeout]);
  });
}

function useInfiniteSectorStocks(
  sectorId: string,
  initial: StockRow[],
  market: IndustrySectorMarket,
) {
  const [stocks, setStocks] = useState(initial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prevSectorId, setPrevSectorId] = useState(sectorId);
  if (prevSectorId !== sectorId) {
    setPrevSectorId(sectorId);
    setStocks(initial);
    setIsLoadingMore(false);
  }

  const loadingRef = useRef(false);
  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setStocks((current) => [
        ...current,
        ...getSectorStockBatch(current.length, SECTOR_STOCK_PAGE_SIZE, market),
      ]);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }, 800);
  }, [market]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || isLoadingMore) return;
    const root = document.querySelector("main");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { root },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore, stocks.length, isLoadingMore]);

  return { stocks, isLoadingMore, sentinelRef };
}

/** Figma node 21191:58954 — SET Industry Sector drill-in (Resource desktop). */
export function SetIndustrySectorDetail({
  sectorId,
  onBack,
}: {
  sectorId: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const page = getIndustrySectorPage(sectorId);
  const { stocks, isLoadingMore, sentinelRef } = useInfiniteSectorStocks(
    sectorId,
    page?.stocks ?? [],
    page?.market ?? "th",
  );

  useCatalogDetailScrollTop([sectorId]);

  if (!page) {
    return (
      <div className="flex min-h-full w-full flex-1 flex-col bg-white">
        <CatalogDetailBackHeader title="SET Industry Sector" onBack={onBack} className="!pt-8" />
        <p className={`text-center text-sm text-[#6a7282] ${NARROW}`}>ไม่พบข้อมูล</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#f9fafb]">
      <div className="flex flex-col gap-2 bg-white">
        <CatalogDetailBackHeader title={page.title} onBack={onBack} className="!pt-8" />
        <CatalogDetailTextTabs
          items={page.sectors.map((s) => ({
            id: s.id,
            label: s.name,
            icon: <SectorGlyph id={s.id} size={20} />,
          }))}
          activeId={page.sector.id}
          onSelect={(id) => {
            if (id === page.sector.id) return; // already there — nothing to swap
            navigateWithoutFlicker(() => router.push(industrySectorHref(id, page.market)));
          }}
          fill={false}
          scrollButtons
        />
      </div>

      <SectorHeroBand page={page} />

      <div className="w-full flex-1 pb-16">
        <div className={`flex flex-col gap-6 pt-4 ${NARROW}`}>
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full items-center gap-2 border-b border-black/10 px-3 py-3">
              <p className="min-w-0 flex-1 text-base leading-5 text-[#4a5565]">
                {page.totalCount} Lists
              </p>
              <button
                type="button"
                className="flex w-[136px] shrink-0 items-center justify-center gap-1 rounded-lg border border-black/10 bg-white p-2"
              >
                <TrendUpIcon size={20} className="shrink-0 text-[#4a5565]" />
                <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5 text-[#4a5565]">
                  Top Gain
                </span>
                <CaretDownIcon size={16} className="shrink-0 text-[#4a5565]" />
              </button>
            </div>
            <p className="w-full px-3 text-xs leading-4 text-[#6a7282]">{page.updatedAt}</p>
          </div>
          <div className="grid w-full grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-2">
            {stocks.map((row, index) => (
              <div key={`${row.symbol}-${index}`} className="min-w-0">
                <StockLargeAssetCard
                  symbol={row.symbol}
                  subtitle={row.name}
                  price={row.price}
                  changeAmount={row.changeAmount}
                  changePercent={row.changePercent}
                  trend={row.trend}
                  series={row.series}
                  figmaSectorAmountColors
                  onSelect={() => router.push(stockProductHref(row.symbol))}
                />
              </div>
            ))}
          </div>
          {isLoadingMore ? (
            <div className="flex w-full items-center justify-center gap-1 py-2.5 px-3">
              <CircleNotchIcon size={20} className="animate-spin text-[#6a7282]" />
              <span className="text-sm font-bold leading-5 text-[#6a7282]">กำลังโหลดข้อมูล</span>
            </div>
          ) : (
            <div ref={sentinelRef} aria-hidden className="h-px w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
