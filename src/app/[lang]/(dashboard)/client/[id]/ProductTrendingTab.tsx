"use client";

import { useSearchParams } from "next/navigation";
import { useAppPathname, useLocalizedRouter } from "@/i18n/navigation";
import { Button } from "@sarunyu/system-one";
import { FireIcon } from "@phosphor-icons/react";
import { formatAumThb } from "@/lib/client-utils";
import type { OrderBook } from "@/types/domain";
import { CARD_SHADOW, PercentPill } from "./stock-ui";
import { stockProductHref } from "./stock-product-detail-data";
import { RankBadge, TrendingFill, TrendingSortChips } from "./ProductTrendingAllTable";
import { bookForItem, trendingRows, useTrendingBooks } from "./use-trending-books";
import { setQueryState, withQuery } from "@/lib/query-state";
import {
  productTrendingUpdatedAt,
  DEFAULT_TRENDING_SORT,
  emptyTrendingMessage,
  isRankedSort,
  normalizeTrendingSort,
  TRENDING_CARD_ROWS,
  TRENDING_SORT_PARAM,
  type TrendingSort,
  type TrendingGroup,
  type TrendingItem,
  type TrendingTarget,
} from "./product-trending-data";
import type { CatalogNavigation } from "./ProductCatalogTab";
import { useProductTrendingGroups } from "@/hooks/use-catalog";
import { Skeleton } from "@/components/ui/skeleton";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

function TrendingRow({
  item,
  book,
  showBorder,
  ranked,
  onSelect,
}: {
  item: TrendingItem;
  /** Whether to show the rank badge — not on the unranked editorial views. */
  ranked: boolean;
  /** This product's order book, or `null` on a desk that keeps none. */
  book: OrderBook | null;
  showBorder: boolean;
  onSelect: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-2 py-3 px-3 w-full text-left cursor-pointer transition-colors hover:bg-black/[0.02] ${
        showBorder ? "border-b border-black/10" : ""
      }`}
    >
      <span className="flex gap-3 items-center w-full">
        {ranked && <RankBadge rank={item.rank} />}
        <span className="flex flex-col min-w-0 flex-1">
          <span className="text-body font-bold text-foreground truncate">{item.title}</span>
          <span className="type-caption text-muted-foreground truncate">{item.subtitle}</span>
        </span>
        {/* Sales figures only where there are sales — on a booked desk the
            fill line below is the whole of the right-hand side. */}
        {item.salesThb !== undefined && (
          <span className="flex flex-col items-end shrink-0 gap-0.5">
            <span className="text-body font-bold text-foreground whitespace-nowrap">
              {formatAumThb(item.salesThb)}
            </span>
            <span className="flex items-center gap-1.5">
              {item.orders !== undefined && (
                <span className="type-caption text-muted-foreground whitespace-nowrap">
                  {t.products.trending.orderCount(item.orders)}
                </span>
              )}
              {item.trend && item.changePct && (
                <PercentPill trend={item.trend} value={item.changePct} size="sm" />
              )}
            </span>
          </span>
        )}
      </span>
      {/* Its own line under the row, indented past the rank badge so the bars
          down a card line up with each other rather than with the titles. */}
      {book && (
        <span className={`flex w-full ${ranked ? "pl-9" : ""}`}>
          <TrendingFill book={book} />
        </span>
      )}
    </button>
  );
}

function TrendingGroupCard({
  group,
  items,
  books,
  sort,
  onSelect,
  onViewAll,
}: {
  group: TrendingGroup;
  /** The group's rows in the active sort's order. */
  items: TrendingItem[];
  sort: TrendingSort;
  books: Map<string, OrderBook>;
  onSelect: (target: TrendingTarget) => void;
  onViewAll: () => void;
}) {
  const t = useT();
  const shown = items.slice(0, TRENDING_CARD_ROWS);
  return (
    <div className={`flex flex-col bg-white rounded-lg overflow-hidden ${CARD_SHADOW}`}>
      <div
        className="flex gap-2 items-center justify-between px-6 h-12 shrink-0"
        style={{ backgroundColor: "#f9f9f9" }}
      >
        <p className="font-bold text-base truncate" style={{ color: "rgba(0,0,0,0.75)" }}>
          {group.title}
        </p>
        {items.length > TRENDING_CARD_ROWS && (
          <Button variant="plain" size="sm" onClick={onViewAll}>
            {t.products.common.viewAll}
          </Button>
        )}
      </div>
      <div className="flex flex-col p-3 w-full">
        {shown.length === 0 && (
          <p className="type-caption text-muted-foreground text-center py-8">
            {emptyTrendingMessage(sort, t)}
          </p>
        )}
        {shown.map((item, i) => (
          <TrendingRow
            key={`${group.id}-${item.rank}`}
            item={item}
            book={bookForItem(item, books)}
            showBorder={i < shown.length - 1}
            ranked={isRankedSort(sort)}
            onSelect={() => onSelect(item.target)}
          />
        ))}
      </div>
    </div>
  );
}

type TrendingNav = Pick<
  CatalogNavigation,
  | "onMutualFundSelect"
  | "onFixedIncomeBondSelect"
  | "onThaiProductSelect"
  | "onProductSelect"
  | "onGlobalBondIssuerSelect"
>;

/**
 * Opens a trending row's product. Shared by the cards and the "ดูทั้งหมด"
 * sub-page so both hand each kind to the same place.
 *
 * Takes the catalog's own navigation callbacks rather than routing on its own:
 * the catalog falls back to opening details inline when it has no URL
 * navigation. Stock is the exception — it has no callback in
 * `CatalogNavigation` because `StockTab` routes to `stockProductHref` directly,
 * and this does the same.
 */
export function useTrendingSelect(nav: TrendingNav) {
  const router = useLocalizedRouter();
  return (target: TrendingTarget) => {
    switch (target.kind) {
      case "stock":
        return router.push(stockProductHref(target.symbol));
      case "mutual-fund":
        return nav.onMutualFundSelect(target.fundId);
      case "fixed-income":
        return nav.onFixedIncomeBondSelect(target.bond);
      case "thai-structured":
        return nav.onThaiProductSelect(target.product);
      case "structured":
        return nav.onProductSelect(target.product);
      case "global-bond":
        return nav.onGlobalBondIssuerSelect(target.issuerId);
    }
  };
}

/**
 * Best sellers across every asset class that sells units, ranked within each.
 *
 * IC-only: unlike the asset tabs beside it, which show what a client would
 * see, this lists every product the desk can sell — so an IC can find one
 * here and then point the client to it in that client-facing tab.
 */
export function ProductTrendingTab({
  nav,
}: {
  nav: TrendingNav & Pick<CatalogNavigation, "onTrendingSeeAll">;
}) {
  const t = useT();
  const select = useTrendingSelect(nav);
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const sort = normalizeTrendingSort(searchParams.get(TRENDING_SORT_PARAM));
  const setSort = (next: TrendingSort) =>
    setQueryState(
      withQuery(pathname, searchParams, {
        [TRENDING_SORT_PARAM]: next === DEFAULT_TRENDING_SORT ? null : next,
      }),
    );
  const books = useTrendingBooks();
  const { data: trendingGroups, isLoading } = useProductTrendingGroups();
  if (isLoading) return <ProductTrendingTabSkeleton />;
  const groups = trendingGroups.map((group) => ({
    group,
    items: trendingRows(group, books, sort),
  }));

  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }}>
      <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2">
            <FireIcon size={20} weight="fill" style={{ color: "#f54a00" }} />
            <p className="font-bold text-title leading-[28px]" style={{ color: "rgba(0,0,0,0.75)" }}>
              {t.products.trending.title}
            </p>
          </div>
          {/* Two sentences because there are two rankings here, and one of
              them used to be described as the other: a note or a bond has no
              weekly turnover, so those cards rank by how full the book is. */}
          <p className="text-sm" style={{ color: "rgba(0,0,0,0.6)" }}>
            {t.products.trending.intro}
          </p>
        </div>

        <TrendingSortChips value={sort} onChange={setSort} />

        {groups.length === 0 ? (
          <CatalogSectionEmpty title={t.products.states.noTrendingGroups} />
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {groups.map(({ group, items }) => (
            <TrendingGroupCard
              key={group.id}
              group={group}
              items={items}
              books={books}
              sort={sort}
              onSelect={select}
              onViewAll={() => nav.onTrendingSeeAll(group.id, sort)}
            />
          ))}
        </div>
        )}

        <p className="type-caption text-muted-foreground text-center">
          {productTrendingUpdatedAt(t)}
        </p>
      </div>
    </div>
  );
}

/** One `TrendingGroupCard`: grey header strip, then ranked rows. */
function TrendingGroupCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-lg overflow-hidden border border-black/5">
      <div className="flex items-center justify-between px-6 h-12" style={{ backgroundColor: "#f9f9f9" }}>
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-16" />
      </div>
      <div className="flex flex-col p-3">
        {Array.from({ length: TRENDING_CARD_ROWS }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-4 ${i < TRENDING_CARD_ROWS - 1 ? "border-b border-black/10" : ""}`}
          >
            <Skeleton className="size-7 rounded-full shrink-0" />
            <div className="flex flex-col gap-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-full max-w-[240px]" />
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Stands in for the Recommended tab while its groups load: heading, the sort
 * chips (as bars — nothing to re-sort yet) and four group cards.
 */
function ProductTrendingTabSkeleton() {
  return (
    <div className="w-full bg-white" style={{ paddingTop: 24, paddingBottom: 40 }} aria-busy="true">
      <div className="flex flex-col gap-6 max-w-[1280px] mx-auto px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-5 w-full max-w-[640px]" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <TrendingGroupCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
