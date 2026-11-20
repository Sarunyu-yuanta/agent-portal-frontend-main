"use client";

import { useFixedIncomeBonds } from "@/features/catalog/hooks/use-catalog";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Pagination, Tag } from "@sarunyu/system-one";
import type { TagVariant } from "@sarunyu/system-one";
import { BuildingsIcon, HandshakeIcon } from "@phosphor-icons/react";
import {
  BOND_LOGOS,
  EMPTY_FIXED_INCOME_FILTERS,
  countFixedIncomeFilters,
  filterFixedIncomeBonds,
  fixedIncomeBookableId,
  fixedIncomeToBookableProduct,
  getBookingLabel,
  getFixedIncomeFilterChips,
  getRiskNumber,
  removeFixedIncomeFilterChip,
  type FixedIncomeBond,
  type FixedIncomeFilters,
} from "@/features/catalog/fixed-income/lib/fixed-income-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  headerBorderStyle,
  cellBorderStyle,
  StatusTag,
  BondLogo,
} from "./fixed-income-shared";
import { FixedIncomeFilterModal } from "./FixedIncomeFilterModal";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import type { BookableProduct } from "@/features/orders/lib/bookable-products";
import { useOpenProducts } from "@/features/orders/hooks/use-order-books";
import { QuotaBookButton, useQuotaBooking } from "@/features/orders/hooks/use-quota-booking";

/** Opens the booking modal for a bond — see `useQuotaBooking`. */
type OnBook = (product: BookableProduct) => void;

/** Only a bond open for subscription can be booked; the rest keep their follow action. */
const bookable = (bond: FixedIncomeBond) => ORDER_BOOKING_ENABLED && bond.action === "invest";
import { FixedIncomeAppliedFilterChips } from "./FixedIncomeAppliedFilterChips";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { pageCount, pageSlice } from "@/lib/pagination";

function offerTypeVariant(type: string): TagVariant {
  if (type === "PO") return "blue";
  if (type === "UHNW") return "yellow";
  return "green";
}

function OfferTypeTag({ offerType }: { offerType: string }) {
  const parts = offerType.split("/");
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((part) => (
        <Tag key={part} text={part} size="small" variant={offerTypeVariant(part)} />
      ))}
    </div>
  );
}

const TAB_SHADOW = "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)";

function MarketSwitcher({
  market,
  onChange,
}: {
  market: "primary" | "secondary";
  onChange: (market: "primary" | "secondary") => void;
}) {
  const t = useT();
  return (
    <div
      className="flex max-w-[604px] min-w-0 flex-1 gap-0 rounded-full p-1"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      <button
        type="button"
        onClick={() => onChange("primary")}
        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-none px-2.5 py-1.5 transition-all"
        style={{
          backgroundColor: market === "primary" ? "white" : "transparent",
          boxShadow: market === "primary" ? TAB_SHADOW : "none",
        }}
      >
        {market === "primary" && <BuildingsIcon size={20} weight="fill" color="#101828" />}
        <span
          className="text-sm leading-[24px] whitespace-nowrap"
          style={{
            fontWeight: market === "primary" ? 700 : 400,
            color: market === "primary" ? "#101828" : "#6a7282",
          }}
        >
          {t.products.fixedIncome.category.primary}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("secondary")}
        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full border-none px-2.5 py-1.5 transition-all"
        style={{
          backgroundColor: market === "secondary" ? "white" : "transparent",
          boxShadow: market === "secondary" ? TAB_SHADOW : "none",
        }}
      >
        {market === "secondary" && <HandshakeIcon size={20} weight="fill" color="#101828" />}
        <span
          className="text-sm leading-[24px] whitespace-nowrap"
          style={{
            fontWeight: market === "secondary" ? 700 : 400,
            color: market === "secondary" ? "#101828" : "#6a7282",
          }}
        >
          {t.products.fixedIncome.category.secondary}
        </span>
      </button>
    </div>
  );
}

function ActionButton({ bond, onBook }: { bond: FixedIncomeBond; onBook: OnBook }) {
  const t = useT();
  if (bookable(bond)) {
    return (
      <QuotaBookButton
        product={fixedIncomeToBookableProduct(bond)}
        onBook={onBook}
        label={t.products.common.createOrder}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-[343px] items-center justify-center rounded px-1.5 py-1 text-xs leading-[22px] font-medium whitespace-nowrap"
      style={{ backgroundColor: "#0a6ee7", color: "white", cursor: "pointer" }}
    >
      {t.products.common.createOrder}
    </button>
  );
}

function CardActionButton({ bond, onBook }: { bond: FixedIncomeBond; onBook: OnBook }) {
  const t = useT();
  const action = bond.action;
  if (bookable(bond)) {
    return (
      <QuotaBookButton
        product={fixedIncomeToBookableProduct(bond)}
        onBook={onBook}
        size="lg"
        className="max-w-[343px] shrink-0"
        label={t.products.fixedIncome.action[action]}
      />
    );
  }
  const isFollowed = action === "followed";
  return (
    <Button
      variant="primary"
      size="lg"
      disabled={isFollowed}
      className="max-w-[343px] shrink-0"
      onClick={(e) => e.stopPropagation()}
    >
      {t.products.fixedIncome.action[action]}
    </Button>
  );
}

function FixedIncomeCard({
  bond,
  onSelect,
  onBook,
}: {
  bond: FixedIncomeBond;
  onSelect: (bond: FixedIncomeBond) => void;
  onBook: OnBook;
}) {
  const t = useT();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(bond)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(bond);
        }
      }}
      className="flex w-full cursor-pointer flex-col items-start gap-2 rounded-xl bg-white p-3"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex w-full items-start gap-2">
          <StatusTag status={bond.status} label={bond.statusLabel} />
          <span className="min-w-0 flex-1 truncate text-base leading-[28px] font-bold text-[#101828]">
            {bond.symbol}
          </span>
          <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
            <span className="text-base leading-[28px] font-bold text-[#101828]">{bond.ytm}</span>
            <span className="text-xs leading-[20px] text-[#6a7282]">YTM</span>
          </div>
        </div>
        <div className="flex w-full items-center gap-2 text-xs leading-[20px] text-[#101828]">
          <span className="min-w-0 flex-1">{bond.companyRating}</span>
          <span className="shrink-0 whitespace-nowrap">{bond.couponPeriod}</span>
        </div>
        <div className="flex w-full items-center gap-2 text-xs leading-[20px] text-[#101828]">
          <span className="min-w-0 flex-1">{t.products.fixedIncome.maturesOn(bond.maturity)}</span>
          <span className="shrink-0 whitespace-nowrap">{bond.tenor}</span>
        </div>
        <div className="flex w-full items-center gap-2 text-xs leading-[20px] text-[#101828]">
          <OfferTypeTag offerType={bond.offerType} />
          <span className="shrink-0 whitespace-nowrap">{getBookingLabel(bond, t)}</span>
        </div>
      </div>
      <hr className="m-0 w-full border-0" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
      <div className="flex w-full items-center gap-3">
        <BondLogo
          src={BOND_LOGOS[bond.logoIdx]}
          logoCrop={bond.logoCrop}
          className="size-8 rounded"
        />
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
          <span className="shrink-0 truncate text-xs leading-[20px] font-bold text-[#101828]">
            {bond.companyName}
          </span>
          <span className="shrink-0 text-xs leading-[20px] whitespace-nowrap text-[#4a5565]">
            {t.products.fixedIncome.ratingAndRisk(bond.bondRating, getRiskNumber(bond.risk))}
          </span>
        </div>
        <CardActionButton bond={bond} onBook={onBook} />
      </div>
    </div>
  );
}

function TableHeader() {
  const t = useT();
  const cols = t.products.fixedIncome.columns;
  return (
    <div className="flex h-11 min-w-[1440px] shrink-0 items-stretch bg-white">
      <div
        className="sticky left-0 z-[1] flex w-[160px] shrink-0 items-center bg-white px-3 group-data-[scrolled=true]/card:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.bond}</span>
      </div>
      <div className="flex w-20 items-center justify-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.status}</span>
      </div>
      <div className="flex w-[136px] items-center justify-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.couponRate}</span>
      </div>
      <div className="flex w-[120px] items-center justify-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.couponPeriod}</span>
      </div>
      <div className="flex w-32 items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.tenor}</span>
      </div>
      <div className="flex w-[120px] items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.maturity}</span>
      </div>
      <div className="flex w-[212px] shrink-0 flex-col overflow-hidden" style={headerBorderStyle()}>
        <div
          className="flex flex-1 items-center justify-center px-3"
          style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
        >
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Ratings</span>
        </div>
        <div className="flex flex-1 items-stretch">
          <div
            className="flex flex-1 items-center justify-center px-3"
            style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.company}</span>
          </div>
          <div className="flex flex-1 items-center justify-center px-3">
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.bond}</span>
          </div>
        </div>
      </div>
      <div className="flex w-[112px] items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.risk}</span>
      </div>
      <div className="flex w-[140px] items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.offerType}</span>
      </div>
      <div className="flex min-w-[140px] flex-1 items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.expectedOpen}</span>
      </div>
      <div
        className="flex w-[92px] items-center justify-center px-3"
        style={headerBorderStyle({ right: false })}
      />
    </div>
  );
}

function BondTableRow({
  bond,
  isLast,
  onSelect,
  onBook,
}: {
  bond: FixedIncomeBond;
  isLast?: boolean;
  onSelect: (bond: FixedIncomeBond) => void;
  onBook: OnBook;
}) {
  const t = useT();
  const border = () => cellBorderStyle({ bottom: !isLast });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(bond)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(bond);
        }
      }}
      className="group flex min-w-[1440px] shrink-0 cursor-pointer items-stretch bg-white transition-colors hover:bg-[#f9fafb]"
    >
      <div
        className="sticky left-0 z-[1] flex w-[160px] shrink-0 items-center gap-2 bg-white px-3 py-3.5 transition-colors group-hover:bg-[#f9fafb] group-data-[scrolled=true]/card:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]"
        style={border()}
      >
        <BondLogo
          src={BOND_LOGOS[bond.logoIdx]}
          logoCrop={bond.logoCrop}
          className="size-8 rounded"
        />
        <span className="min-w-0 flex-1 text-sm leading-[24px] font-bold text-[#101828]">
          {bond.symbol}
        </span>
      </div>
      <div className="flex w-20 items-center justify-center p-3" style={border()}>
        <StatusTag
          status={bond.status}
          label={
            bond.status === "open" ? t.products.fixedIncome.active : t.products.fixedIncome.inactive
          }
        />
      </div>
      <div className="flex w-[136px] items-center justify-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] font-bold whitespace-nowrap text-[#101828]">
          {bond.ytm}
        </span>
      </div>
      <div className="flex w-[120px] items-center justify-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.couponPeriod}
        </span>
      </div>
      <div className="flex w-32 items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.tenor}
        </span>
      </div>
      <div className="flex w-[120px] items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.maturity}</span>
      </div>
      <div className="flex w-[106px] items-center justify-center px-3 py-3.5" style={border()}>
        <span className="text-center text-sm leading-[24px] text-[#101828]">
          {bond.companyRating}
        </span>
      </div>
      <div className="flex w-[106px] items-center justify-center px-3 py-3.5" style={border()}>
        <span className="text-center text-sm leading-[24px] text-[#101828]">{bond.bondRating}</span>
      </div>
      <div className="flex w-[112px] items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.risk}</span>
      </div>
      <div className="flex w-[140px] items-center px-3 py-3.5" style={border()}>
        <OfferTypeTag offerType={bond.offerType} />
      </div>
      <div className="flex min-w-[140px] flex-1 items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.subscriptionPeriod}</span>
      </div>
      <div className="flex w-[92px] items-center justify-center px-3 py-[11px]" style={border()}>
        <ActionButton bond={bond} onBook={onBook} />
      </div>
    </div>
  );
}

export function FixedIncomeTab({
  onBondSelect,
}: {
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  const [market, setMarket] = useState<"primary" | "secondary">("primary");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FixedIncomeFilters>(
    EMPTY_FIXED_INCOME_FILTERS,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);

  const booking = useQuotaBooking();
  // A bond whose quota is used up has nothing left to sell — gone from the list,
  // the same way a structured product leaves once its order is answered.
  // Loading is the catalog's to show (`ProductCatalogTabSkeleton`, gated on
  // `useProductCatalogLoading`, which includes this resource).
  const { data: bonds } = useFixedIncomeBonds();
  const openBonds = useOpenProducts(bonds, fixedIncomeBookableId);
  const filteredBonds = useMemo(
    () => filterFixedIncomeBonds(openBonds, appliedFilters),
    [openBonds, appliedFilters],
  );

  const total = filteredBonds.length;
  const totalPages = pageCount(total, pageSize);
  const safePage = Math.min(currentPage, totalPages);
  const pagedBonds = pageSlice(filteredBonds, safePage, pageSize);

  const activeFilterCount = countFixedIncomeFilters(appliedFilters);
  const appliedFilterChips = useMemo(
    () => getFixedIncomeFilterChips(appliedFilters, t),
    [appliedFilters, t],
  );

  const openFilters = () => setFiltersOpen(true);

  // No bonds at all, versus filters that matched none of them.
  const clearFilters = () => {
    setAppliedFilters(EMPTY_FIXED_INCOME_FILTERS);
    setCurrentPage(1);
  };
  const emptyState =
    total > 0 ? null : (
      <CatalogSectionEmpty
        title={t.products.states.noBonds}
        onClearFilters={openBonds.length > 0 ? clearFilters : undefined}
      />
    );

  const removeFilterChip = (chip: (typeof appliedFilterChips)[number]) => {
    setAppliedFilters((current) => removeFixedIncomeFilterChip(current, chip));
  };

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8 lg:px-6">
      {/* ── Mobile/Tablet: sticky filter bar ── */}
      <div className="sticky top-9 z-[9] w-full bg-white py-3 lg:hidden">
        <div className="flex w-full max-w-[704px] flex-col gap-3">
          <div className="flex w-full flex-row items-center gap-3 md:gap-4">
            <MarketSwitcher market={market} onChange={setMarket} />
            <Badge
              variant="button"
              iconOnly
              label={t.products.common.filter}
              count={activeFilterCount}
              onClick={openFilters}
              className="shrink-0 md:hidden"
            />
            <Badge
              variant="button"
              label={t.products.common.filter}
              count={activeFilterCount}
              onClick={openFilters}
              className="hidden shrink-0 md:flex"
            />
          </div>
          {activeFilterCount > 0 && (
            <FixedIncomeAppliedFilterChips
              chips={appliedFilterChips}
              onRemoveChip={removeFilterChip}
              className="-mx-4 md:-mx-8"
              innerClassName="px-4 md:px-8"
            />
          )}
        </div>
      </div>

      {/* ── Desktop: static filter bar + count ── */}
      <div className="hidden w-full flex-col gap-3 lg:flex">
        <div className="flex w-full justify-center">
          <div className="flex w-full max-w-[704px] flex-col items-start gap-3">
            <div className="flex w-full flex-row items-center gap-3 md:gap-4">
              <MarketSwitcher market={market} onChange={setMarket} />
              <Badge
                variant="button"
                label={t.products.common.filter}
                count={activeFilterCount}
                onClick={openFilters}
                className="shrink-0"
              />
            </div>
            {activeFilterCount > 0 && (
              <FixedIncomeAppliedFilterChips
                chips={appliedFilterChips}
                onRemoveChip={removeFilterChip}
                wrap
              />
            )}
          </div>
        </div>
        <div className="flex w-full items-center justify-end px-1 text-sm leading-[24px] whitespace-nowrap text-[#6a7282]">
          <span>{t.products.common.updatedAt("25 August 2026 - 9:00")}</span>
        </div>
      </div>

      {/* ── Mobile/Tablet: count text ── */}
      <div className="flex w-full items-center justify-between px-1 text-xs leading-[20px] whitespace-nowrap text-[#6a7282] lg:hidden">
        <span>{t.products.common.updatedAt("25 Aug 2026 - 9:00")}</span>
      </div>

      {emptyState ? (
        <div className="w-full lg:hidden">{emptyState}</div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:hidden">
          {pagedBonds.map((bond) => (
            <FixedIncomeCard
              key={bond.id}
              bond={bond}
              onSelect={onBondSelect}
              onBook={booking.book}
            />
          ))}
        </div>
      )}

      <div
        ref={tableCardRef}
        className="group/card hidden w-full rounded-xl bg-white lg:block"
        style={TABLE_CARD_STYLE}
      >
        <div
          ref={headerScrollRef}
          className="sticky top-[60px] z-20 overflow-x-hidden rounded-t-xl bg-white"
          style={{ scrollbarWidth: "none" }}
        >
          <TableHeader />
        </div>
        {/* Scrollable body */}
        <div
          ref={bodyScrollRef}
          className={SCROLLABLE_TABLE_BODY_CLS}
          onScroll={() => {
            const body = bodyScrollRef.current;
            const header = headerScrollRef.current;
            if (header && body) header.scrollLeft = body.scrollLeft;
            if (tableCardRef.current)
              tableCardRef.current.dataset.scrolled = String((body?.scrollLeft ?? 0) > 0);
          }}
        >
          {emptyState ?? (
            <div className="flex min-w-[1440px] flex-col">
              {pagedBonds.map((bond, i) => (
                <BondTableRow
                  key={bond.id}
                  bond={bond}
                  isLast={i === pagedBonds.length - 1}
                  onSelect={onBondSelect}
                  onBook={booking.book}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination bar — hidden with no rows, as on GlobalBondAllPage */}
      {total > 0 && (
        <div className="flex w-full flex-wrap-reverse items-center justify-end gap-3">
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

      {booking.ui}

      <FixedIncomeFilterModal
        open={filtersOpen}
        filters={appliedFilters}
        onClose={() => setFiltersOpen(false)}
        onApply={(filters) => {
          setAppliedFilters(filters);
          setCurrentPage(1);
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}
