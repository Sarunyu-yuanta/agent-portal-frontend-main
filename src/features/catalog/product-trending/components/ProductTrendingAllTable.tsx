"use client";

import { useEffect, useState } from "react";
import { Button, LinearProgress, Pagination } from "@sarunyu/system-one";
import { ArrowLeftIcon, FireIcon } from "@phosphor-icons/react";
import { formatAumThb } from "@/lib/client-utils";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { bookFill } from "@/features/orders/lib/order-book";
import {
  bookForItem,
  trendingRows,
  useTrendingBooks,
} from "@/features/catalog/product-trending/hooks/use-trending-books";
import { PercentPill } from "@/features/catalog/stock/components/stock-ui";
import { TagFilterChip } from "@/features/catalog/mutual-fund/components/MutualFundCard";
import { MF_ASSETS } from "@/features/catalog/mutual-fund/lib/mutual-fund-assets";
import { PaginationSkeleton, Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import {
  HEADER_TEXT_CLS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  cellBorderStyle,
  headerBorderStyle,
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import {
  emptyTrendingMessage,
  isRankedSort,
  TRENDING_SORTS,
  type TrendingSort,
  type TrendingGroup,
  type TrendingItem,
  type TrendingTarget,
} from "@/features/catalog/product-trending/lib/product-trending-data";
import { useT } from "@/i18n/I18nProvider";
import type { OrderBook } from "@/types/order";
import { formatInteger } from "@/lib/format/number";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { pageCount, pageSlice } from "@/lib/pagination";

const MIN_WIDTH = "min-w-[760px]";

/** The podium reads at a glance; everything below it is just a number. */
const RANK_STYLE: Record<number, { bg: string; text: string }> = {
  1: { bg: "#fef3c6", text: "#a16207" },
  2: { bg: "#e5e7eb", text: "#4a5565" },
  3: { bg: "#ffedd4", text: "#9f4a09" },
};
const RANK_DEFAULT = { bg: "#f3f4f6", text: "#6a7282" };

/** Shared with the cards, so a rank looks the same on both. */
export function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLE[rank] ?? RANK_DEFAULT;
  return (
    <span
      className="flex size-6 shrink-0 items-center justify-center rounded-full text-label font-bold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {rank}
    </span>
  );
}

/**
 * How much of a product's book is taken — the shelf's own progress bar.
 *
 * One component for both booking modes, because from the shelf they are the
 * same question: how much of this window is gone. What fills the bar differs —
 * a basket collects toward its notional, a bond draws down an issue quota —
 * and `headlineRound` is what keeps the basket side honest: `bookedAmount`
 * counts only bookings no order has carried, so a collected basket would read
 * 0% at the very moment it is fullest.
 *
 * Shared with the cards, so a fill looks the same on both.
 */
export function TrendingFill({ book }: { book: OrderBook }) {
  const fill = bookFill(book);
  const taken = fill.taken;
  // Rounded once, for the bar and the figure both: `LinearProgress` publishes
  // what it is given as `aria-valuenow`, so an unrounded `pct` had a screen
  // reader announcing 33.33333333333333 beside a printed "33%".
  const pct = Math.round(fill.pct);
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <LinearProgress value={pct} className="min-w-[40px] flex-1" />
      <span className="type-caption whitespace-nowrap text-muted-foreground">
        {formatInteger(taken)} / {formatInteger(book.targetAmount)} {book.currency}
      </span>
      {/* Bold and last, where the eye lands after the bar — the bar is the
          shape of the answer, this is the answer. */}
      <span className="type-caption font-bold whitespace-nowrap text-foreground tabular-nums">
        {pct}%
      </span>
    </span>
  );
}

/**
 * Whether this group's rows carry a fill bar.
 *
 * The measure answers it — `"fill"` groups are precisely the ones with books.
 * Still gated on the flag: with booking off there are no books to read.
 */
export function showsFill(group: TrendingGroup): boolean {
  return ORDER_BOOKING_ENABLED && group.measure === "fill";
}

/** Mutual Fund's View/Highlight artwork for the two editorial filters; best
 *  sellers have none, so they take the tab's own flame. */
const SORT_ICON: Record<TrendingSort, string | React.ReactNode> = {
  "best-seller": <FireIcon size={16} weight="fill" color="#f54a00" />,
  highlight: MF_ASSETS.performersTagHighlight,
  "cio-view": MF_ASSETS.performersTagView,
};

/** Pick-one sort row — Mutual Fund's tag chips, used as a segmented control. */
export function TrendingSortChips({
  value,
  onChange,
}: {
  value: TrendingSort;
  onChange: (sort: TrendingSort) => void;
}) {
  const t = useT();
  return (
    <div
      role="group"
      aria-labelledby="trending-sort-label"
      className="flex flex-wrap items-center gap-2"
    >
      <span id="trending-sort-label" className="text-sm whitespace-nowrap text-muted-foreground">
        {t.products.trending.sortBy}
      </span>
      {TRENDING_SORTS.map((id) => (
        <TagFilterChip
          key={id}
          icon={SORT_ICON[id]}
          label={t.products.trending.sorts[id]}
          active={value === id}
          onClick={() => onChange(id)}
          selectedBadge={false}
        />
      ))}
    </div>
  );
}

type ColDef = {
  /** Also the column's header key in `t.products.trending.columns`. */
  key: "rank" | "product" | "fill" | "sales" | "orders" | "change";
  width: string;
  align: string;
};

const COLS: ColDef[] = [
  { key: "rank", width: "w-[80px]", align: "justify-center" },
  { key: "product", width: "flex-1 min-w-[300px]", align: "" },
  { key: "fill", width: "w-[280px]", align: "" },
  { key: "sales", width: "w-[140px]", align: "justify-end" },
  { key: "orders", width: "w-[120px]", align: "justify-end" },
  { key: "change", width: "w-[150px]", align: "justify-end" },
];

function Cell({ item, col, book }: { item: TrendingItem; col: ColDef; book: OrderBook | null }) {
  switch (col.key) {
    case "rank":
      return <RankBadge rank={item.rank} />;
    case "fill":
      // A dash, not an empty cell: the column is there because the desk has
      // books, and a blank reads as "0%" rather than "this row has none".
      return book ? (
        <TrendingFill book={book} />
      ) : (
        <span className="type-caption text-muted-foreground">—</span>
      );
    case "product":
      return (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm leading-[24px] font-bold text-[#101828]">
            {item.title}
          </span>
          <span className="type-caption truncate text-muted-foreground">{item.subtitle}</span>
        </span>
      );
    // The three sales columns are only mounted on a `"sales"` group (see
    // `cols` below), so reaching one with nothing to print would be a column
    // list and a measure that disagree — render nothing rather than a zero.
    case "sales":
      return item.salesThb === undefined ? null : (
        <span className="text-sm leading-[24px] font-bold whitespace-nowrap text-[#101828]">
          {formatAumThb(item.salesThb)}
        </span>
      );
    case "orders":
      return item.orders === undefined ? null : (
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {item.orders.toLocaleString("en-US")}
        </span>
      );
    case "change":
      return item.trend && item.changePct ? (
        <PercentPill trend={item.trend} value={item.changePct} size="sm" />
      ) : null;
  }
}

/**
 * One asset class's whole ranking, opened from its card's "ดูทั้งหมด".
 *
 * Same table chrome as the catalog's other full lists (`fixed-income-shared`),
 * and the same row → detail hand-off as the cards, via `onSelect`.
 */
export function ProductTrendingAllTable({
  group,
  updatedAt,
  sort,
  onSortChange,
  onBack,
  onSelect,
}: {
  group: TrendingGroup;
  updatedAt: string;
  sort: TrendingSort;
  onSortChange: (sort: TrendingSort) => void;
  onBack: () => void;
  onSelect: (target: TrendingTarget) => void;
}) {
  const t = useT();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Opened from partway down the card grid — start the table at its top.
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, []);

  const books = useTrendingBooks();
  const items = trendingRows(group, books, sort);
  const fill = showsFill(group);
  /** A column per figure the group actually has — see `TrendingMeasure`. */
  const cols = COLS.filter((c) =>
    c.key === "rank"
      ? isRankedSort(sort)
      : c.key === "fill"
        ? fill
        : group.measure === "sales" ||
          (c.key !== "sales" && c.key !== "orders" && c.key !== "change"),
  );
  // Wider when the fill column is in: the bar needs room to be a bar, and the
  // table scrolls sideways rather than crushing it.
  const minWidth = fill ? "min-w-[860px]" : MIN_WIDTH;
  const total = items.length;
  const totalPages = pageCount(total, pageSize);
  const safePage = Math.min(currentPage, totalPages);
  const paged = pageSlice(items, safePage, pageSize);

  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 lg:px-6">
        <div className="flex w-full flex-col gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label={t.products.common.back}
              className="shrink-0"
            >
              <ArrowLeftIcon size={20} />
            </Button>
            <p
              className="min-w-0 flex-1 truncate text-title leading-[28px] font-bold"
              style={{ color: "rgba(0,0,0,0.75)" }}
            >
              {group.title}
            </p>
          </div>
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            {updatedAt}
          </p>
        </div>

        <TrendingSortChips
          value={sort}
          onChange={(next) => {
            onSortChange(next);
            setCurrentPage(1);
          }}
        />

        <div className="flex flex-col gap-3">
          {/* No order count for desks that open a single round — see `showsOrderCount`. */}
          <div className="w-full rounded-xl bg-white" style={TABLE_CARD_STYLE}>
            <div className={SCROLLABLE_TABLE_BODY_CLS}>
              <div className={`flex h-11 items-stretch ${minWidth}`}>
                {cols.map((col, i) => (
                  <div
                    key={col.key}
                    className={`flex ${col.width} shrink-0 items-center ${col.align} px-3`}
                    style={headerBorderStyle(i === cols.length - 1 ? { right: false } : undefined)}
                  >
                    <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
                      {t.products.trending.columns[col.key]}
                    </span>
                  </div>
                ))}
              </div>
              <div className={`flex flex-col ${minWidth}`}>
                {paged.length === 0 && (
                  <p className="type-caption py-10 text-center text-muted-foreground">
                    {emptyTrendingMessage(sort, t)}
                  </p>
                )}
                {paged.map((item, i) => (
                  <button
                    key={item.rank}
                    type="button"
                    onClick={() => onSelect(item.target)}
                    className="flex w-full cursor-pointer items-stretch bg-white text-left transition-colors hover:bg-[#f9fafb]"
                  >
                    {cols.map((col) => (
                      <div
                        key={col.key}
                        className={`flex ${col.width} shrink-0 items-center ${col.align} min-w-0 px-3 py-3`}
                        style={cellBorderStyle({ bottom: i < paged.length - 1 })}
                      >
                        <Cell item={item} col={col} book={bookForItem(item, books)} />
                      </div>
                    ))}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hidden with no rows, as on GlobalBondAllPage */}
          {total > 0 && (
            <div className="flex flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-label whitespace-nowrap text-muted-foreground">
                  {t.products.pagination.perPage}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="focus:ring-primary-action cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-label text-foreground focus:ring-1 focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-label text-muted-foreground">
                  {t.products.pagination.showing(
                    {
                      from: (safePage - 1) * pageSize + 1,
                      to: Math.min(safePage * pageSize, total),
                      total,
                    },
                    (n) => (
                      <span className="font-medium text-foreground">{n}</span>
                    ),
                  )}
                </p>
                <Pagination
                  totalPages={totalPages}
                  currentPage={safePage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** The whole page while the ranking loads: title, updated line, sort chips
 *  (as bars — nothing to re-sort yet), the table and its pagination. */
export function ProductTrendingAllTableSkeleton() {
  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }} aria-busy="true">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <Skeleton className="h-7 w-40" />
          </div>
          <Skeleton className="h-5 w-80 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <TableSkeleton columns={5} rows={10} />
        <PaginationSkeleton />
      </div>
    </div>
  );
}
