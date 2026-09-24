"use client";

/**
 * The parts a Stock drill-in page is built from, shared by the two that exist:
 * the industry-sector page (`SetIndustrySectorDetail`) and the market-index one
 * (`MarketIndexDetail`). Both are the same page with a different hero — a tab
 * strip, a hero band, then "N Lists" over an infinitely scrolling grid of
 * instruments — so the list half lives here rather than being copied.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  CaretDownIcon,
  CircleNotchIcon,
  SquaresFourIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { Popover } from "@sarunyu/system-one";
import { StockLargeAssetCard } from "./StockLargeAssetCard";
import { CATALOG_DETAIL_WIDTH } from "./ProductCatalogTabbedDetailLayout";
import type { StockRow, Trend } from "./stock-data";
import { TREND_PILL_BG } from "./stock-ui";

const NARROW = CATALOG_DETAIL_WIDTH.narrow;

/** Local on purpose — the hero band's neutral is lighter than the Stock tab's
 *  `TREND_TEXT` (#4a5565 there vs #6a7282 here), so these must not be merged.
 *  `TREND_PILL_BG` is identical, hence shared from `stock-ui`. */
export const HERO_TREND_TEXT: Record<Trend, string> = {
  up: "#008236",
  down: "#c10007",
  flat: "#6a7282",
};

export function HeroPercentPill({
  trend,
  percentBody,
}: {
  trend: Trend;
  percentBody: string;
}) {
  if (trend === "flat") return null;
  const sign = trend === "up" ? "+" : "-";
  const body = percentBody.replace(/^[+-]/, "");
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-sm leading-5"
      style={{ backgroundColor: TREND_PILL_BG[trend], color: HERO_TREND_TEXT[trend] }}
    >
      <span>{sign}</span>
      <span>{body}</span>
    </span>
  );
}

/** Figma node 21182:54066 — the list's sort control. Icons double as the
 *  trigger's leading glyph, so a closed dropdown still says how the list is
 *  ordered without reading the label. */
const SORT_OPTIONS = [
  { id: "all", label: "All Lists", Icon: SquaresFourIcon },
  { id: "gain", label: "Top Gain", Icon: TrendUpIcon },
  { id: "loss", label: "Top Loss", Icon: TrendDownIcon },
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

/** `changePercent` carries its own sign ("+0.61%", "-20.00%", "0.00"), so the
 *  string parses straight to a comparable number — `trend` is a second reading
 *  of the same fact and sorting by it would only lose the magnitude. */
function percentValue(changePercent: string): number {
  const n = Number.parseFloat(changePercent.replace(/[^0-9.+-]/g, ""));
  return Number.isNaN(n) ? 0 : n;
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortId;
  onChange: (id: SortId) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = SORT_OPTIONS.find((o) => o.id === value) ?? SORT_OPTIONS[0];
  const SelectedIcon = selected.Icon;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      align="end"
      sideOffset={8}
      // `p-2` over the bubble's own padding: Figma pads the panel by 8px and
      // lets each row run full width, so a row's selected fill and hover reach
      // the panel's inner edges.
      className="p-2"
      contentStyle={{ width: 200 }}
      content={
        <div className="flex flex-col">
          {SORT_OPTIONS.map(({ id, label, Icon }) => {
            const active = id === value;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onChange(id);
                  setOpen(false);
                }}
                className={`flex h-12 w-full shrink-0 cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors ${
                  active ? "bg-[#eff6ff]" : "hover:bg-black/[0.02]"
                }`}
              >
                <Icon size={24} className="shrink-0 text-[#4a5565]" />
                <span className="min-w-0 flex-1 truncate text-sm leading-5 text-[#101828]">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      }
    >
      <button
        type="button"
        aria-label={`Sort: ${selected.label}`}
        className="flex w-[136px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg border border-black/10 bg-white p-2 transition-colors hover:bg-black/[0.02]"
      >
        <SelectedIcon size={20} className="shrink-0 text-[#4a5565]" />
        <span className="min-w-0 flex-1 truncate text-left text-sm font-semibold leading-5 text-[#4a5565]">
          {selected.label}
        </span>
        <CaretDownIcon
          size={16}
          className={`shrink-0 text-[#4a5565] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
    </Popover>
  );
}

/**
 * Resolves once `target` next has a child added or removed — i.e. once
 * Next's router has actually swapped in the new page's DOM, however long
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
 * param change, so switching tabs always tears down and rebuilds the page's
 * DOM rather than just re-rendering it. React's `<ViewTransition>`
 * (the documented fix, `node_modules/next/dist/docs/01-app/02-guides/view-
 * transitions.md`) isn't available in this project's React build, so this
 * calls the browser's native View Transitions API directly instead — same
 * effect (crossfade instead of a hard swap), feature-detected so it's a
 * no-op, not a crash, wherever the API is missing (older Safari/Firefox).
 */
export function navigateWithoutFlicker(run: () => void) {
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

function useInfiniteStockRows(
  resetKey: string,
  initial: StockRow[],
  loadBatch: (offset: number) => StockRow[],
): { rows: StockRow[]; isLoadingMore: boolean; sentinelRef: RefObject<HTMLDivElement | null> } {
  const [rows, setRows] = useState(initial);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [prevKey, setPrevKey] = useState(resetKey);
  if (prevKey !== resetKey) {
    setPrevKey(resetKey);
    setRows(initial);
    setIsLoadingMore(false);
  }

  // Held in a ref so a caller passing an inline closure doesn't re-create
  // `loadMore` and restart the observer on every render. Only ever read from a
  // scroll-driven timeout, long after this commit's effects have run.
  const loadBatchRef = useRef(loadBatch);
  useEffect(() => {
    loadBatchRef.current = loadBatch;
  });

  const loadingRef = useRef(false);
  const loadMore = useCallback(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    window.setTimeout(() => {
      setRows((current) => [...current, ...loadBatchRef.current(current.length)]);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }, 800);
  }, []);

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
  }, [loadMore, rows.length, isLoadingMore]);

  return { rows, isLoadingMore, sentinelRef };
}

/**
 * "N Lists" header, sort control, and the instrument grid that pages itself in
 * as the user scrolls — the lower half of every Stock drill-in page.
 */
export function StockDetailList({
  resetKey,
  initialStocks,
  loadBatch,
  totalCount,
  updatedAt,
  onSelect,
}: {
  /** Changing this discards the paged-in rows — the page is showing a different
   *  sector / index now, so the old tail doesn't belong to it. */
  resetKey: string;
  initialStocks: StockRow[];
  loadBatch: (offset: number) => StockRow[];
  totalCount: number;
  updatedAt: string;
  onSelect: (row: StockRow) => void;
}) {
  const { rows, isLoadingMore, sentinelRef } = useInfiniteStockRows(
    resetKey,
    initialStocks,
    loadBatch,
  );
  const [sort, setSort] = useState<SortId>("all");
  /** Sorted for display only — `rows` keeps its load order, so paging in the
   *  next batch appends where the feed put it rather than where a sort left off. */
  const sortedStocks = useMemo(() => {
    if (sort === "all") return rows;
    const direction = sort === "gain" ? -1 : 1;
    return [...rows].sort(
      (a, b) => direction * (percentValue(a.changePercent) - percentValue(b.changePercent)),
    );
  }, [rows, sort]);

  return (
    <div className="w-full flex-1 pb-16">
      <div className={`flex flex-col gap-6 pt-4 ${NARROW}`}>
        <div className="flex w-full flex-col gap-3">
          <div className="flex w-full items-center gap-2 border-b border-black/10 px-3 py-3">
            <p className="min-w-0 flex-1 text-base leading-5 text-[#4a5565]">
              {totalCount} Lists
            </p>
            <SortDropdown value={sort} onChange={setSort} />
          </div>
          <p className="w-full px-3 text-xs leading-4 text-[#6a7282]">{updatedAt}</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-x-4 gap-y-6 lg:grid-cols-2">
          {sortedStocks.map((row, index) => (
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
                onSelect={() => onSelect(row)}
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
  );
}
