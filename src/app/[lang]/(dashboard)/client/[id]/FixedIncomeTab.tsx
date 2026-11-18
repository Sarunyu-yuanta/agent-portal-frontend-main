"use client";

import { useFixedIncomeBonds } from "@/hooks/use-catalog";
import { useMemo, useRef, useState } from "react";
import { Badge, Button, Pagination, Tag } from "@sarunyu/system-one";
import type { TagVariant } from "@sarunyu/system-one";
import {
  BuildingsIcon,
  HandshakeIcon,
} from "@phosphor-icons/react";
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
} from "./fixed-income-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  PAGE_SIZE_OPTIONS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  headerBorderStyle,
  cellBorderStyle,
  ACTION_LABELS,
  StatusTag,
  BondLogo,
} from "./fixed-income-shared";
import { FixedIncomeFilterModal } from "./FixedIncomeFilterModal";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import type { BookableProduct } from "@/app/(dashboard)/orders/bookable-products";
import { useOpenProducts } from "@/app/(dashboard)/orders/use-order-books";
import { QuotaBookButton, useQuotaBooking } from "@/app/(dashboard)/orders/useQuotaBooking";

/** Opens the booking modal for a bond — see `useQuotaBooking`. */
type OnBook = (product: BookableProduct) => void;

/** Only a bond open for subscription can be booked; the rest keep their follow action. */
const bookable = (bond: FixedIncomeBond) => ORDER_BOOKING_ENABLED && bond.action === "invest";
import { FixedIncomeAppliedFilterChips } from "./FixedIncomeAppliedFilterChips";

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

const TAB_SHADOW =
  "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)";

function MarketSwitcher({
  market,
  onChange,
}: {
  market: "primary" | "secondary";
  onChange: (market: "primary" | "secondary") => void;
}) {
  return (
    <div
      className="flex flex-1 min-w-0 max-w-[604px] gap-0 p-1 rounded-full"
      style={{ backgroundColor: "#f3f4f6" }}
    >
      <button
        type="button"
        onClick={() => onChange("primary")}
        className="flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer border-none"
        style={{
          backgroundColor: market === "primary" ? "white" : "transparent",
          boxShadow: market === "primary" ? TAB_SHADOW : "none",
        }}
      >
        {market === "primary" && (
          <BuildingsIcon size={20} weight="fill" color="#101828" />
        )}
        <span
          className="text-sm leading-[24px] whitespace-nowrap"
          style={{
            fontWeight: market === "primary" ? 700 : 400,
            color: market === "primary" ? "#101828" : "#6a7282",
          }}
        >
          หุ้นกู้ตลาดแรก
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("secondary")}
        className="flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all cursor-pointer border-none"
        style={{
          backgroundColor: market === "secondary" ? "white" : "transparent",
          boxShadow: market === "secondary" ? TAB_SHADOW : "none",
        }}
      >
        {market === "secondary" && (
          <HandshakeIcon size={20} weight="fill" color="#101828" />
        )}
        <span
          className="text-sm leading-[24px] whitespace-nowrap"
          style={{
            fontWeight: market === "secondary" ? 700 : 400,
            color: market === "secondary" ? "#101828" : "#6a7282",
          }}
        >
          หุ้นกู้ตลาดรอง
        </span>
      </button>
    </div>
  );
}

function ActionButton({ bond, onBook }: { bond: FixedIncomeBond; onBook: OnBook }) {
  if (bookable(bond)) {
    return (
      <QuotaBookButton
        product={fixedIncomeToBookableProduct(bond)}
        onBook={onBook}
        label="สร้างคำสั่งซื้อ"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center justify-center px-1.5 py-1 rounded text-xs font-medium leading-[22px] whitespace-nowrap max-w-[343px]"
      style={{ backgroundColor: "#0a6ee7", color: "white", cursor: "pointer" }}
    >
      สร้างคำสั่งซื้อ
    </button>
  );
}

function CardActionButton({ bond, onBook }: { bond: FixedIncomeBond; onBook: OnBook }) {
  const action = bond.action;
  if (bookable(bond)) {
    return (
      <QuotaBookButton
        product={fixedIncomeToBookableProduct(bond)}
        onBook={onBook}
        size="lg"
        className="shrink-0 max-w-[343px]"
        label={ACTION_LABELS[action]}
      />
    );
  }
  const isFollowed = action === "followed";
  return (
    <Button
      variant="primary"
      size="lg"
      disabled={isFollowed}
      className="shrink-0 max-w-[343px]"
      onClick={(e) => e.stopPropagation()}
    >
      {ACTION_LABELS[action]}
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
      className="flex flex-col gap-2 items-start p-3 rounded-xl w-full bg-white cursor-pointer"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      <div className="flex flex-col gap-2 w-full">
        <div className="flex gap-2 items-start w-full">
          <StatusTag status={bond.status} label={bond.statusLabel} />
          <span className="flex-1 min-w-0 text-base font-bold leading-[28px] text-[#101828] truncate">
            {bond.symbol}
          </span>
          <div className="flex gap-1 items-center shrink-0 whitespace-nowrap">
            <span className="text-base font-bold leading-[28px] text-[#101828]">
              {bond.ytm}
            </span>
            <span className="text-xs leading-[20px] text-[#6a7282]">YTM</span>
          </div>
        </div>
        <div className="flex gap-2 items-center w-full text-xs leading-[20px] text-[#101828]">
          <span className="flex-1 min-w-0">{bond.companyRating}</span>
          <span className="shrink-0 whitespace-nowrap">
            {bond.couponPeriod}
          </span>
        </div>
        <div className="flex gap-2 items-center w-full text-xs leading-[20px] text-[#101828]">
          <span className="flex-1 min-w-0">ครบกำหนด: {bond.maturity}</span>
          <span className="shrink-0 whitespace-nowrap">{bond.tenor}</span>
        </div>
        <div className="flex gap-2 items-center w-full text-xs leading-[20px] text-[#101828]">
          <OfferTypeTag offerType={bond.offerType} />
          <span className="shrink-0 whitespace-nowrap">
            {getBookingLabel(bond)}
          </span>
        </div>
      </div>
      <hr
        className="w-full border-0 m-0"
        style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
      />
      <div className="flex gap-3 items-center w-full">
        <BondLogo
          src={BOND_LOGOS[bond.logoIdx]}
          logoCrop={bond.logoCrop}
          className="size-8 rounded"
        />
        <div className="flex flex-1 min-w-0 gap-3 items-center overflow-hidden">
          <span className="text-xs font-bold leading-[20px] text-[#101828] truncate shrink-0">
            {bond.companyName}
          </span>
          <span className="text-xs leading-[20px] text-[#4a5565] whitespace-nowrap shrink-0">
            {bond.bondRating} / Risk {getRiskNumber(bond.risk)}
          </span>
        </div>
        <CardActionButton bond={bond} onBook={onBook} />
      </div>
    </div>
  );
}

function TableHeader() {
  return (
    <div className="flex h-11 items-stretch shrink-0 min-w-[1440px] bg-white">
      <div
        className="sticky left-0 z-[1] flex w-[160px] shrink-0 items-center px-3 bg-white group-data-[scrolled=true]/card:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>หุ้นกู้</span>
      </div>
      <div
        className="flex w-20 items-center justify-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>สถานะ</span>
      </div>
      <div
        className="flex w-[136px] items-center justify-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          อัตราดอกเบี้ย
        </span>
      </div>
      <div
        className="flex w-[120px] items-center justify-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          งวดดอกเบี้ย
        </span>
      </div>
      <div className="flex w-32 items-center px-3" style={headerBorderStyle()}>
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>อายุ</span>
      </div>
      <div
        className="flex w-[120px] items-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          วันครบกำหนด
        </span>
      </div>
      <div
        className="flex flex-col w-[212px] shrink-0 overflow-hidden"
        style={headerBorderStyle()}
      >
        <div
          className="flex flex-1 items-center justify-center px-3"
          style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
        >
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
            Ratings
          </span>
        </div>
        <div className="flex flex-1 items-stretch">
          <div
            className="flex flex-1 items-center justify-center px-3"
            style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
              บริษัท
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center px-3">
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
              หุ้นกู้
            </span>
          </div>
        </div>
      </div>
      <div
        className="flex w-[112px] items-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          ความเสี่ยง
        </span>
      </div>
      <div
        className="flex w-[140px] items-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          ประเภทเสนอขาย
        </span>
      </div>
      <div
        className="flex flex-1 min-w-[140px] items-center px-3"
        style={headerBorderStyle()}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
          คาดว่าเปิดขาย
        </span>
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
      className="group flex items-stretch shrink-0 min-w-[1440px] bg-white cursor-pointer hover:bg-[#f9fafb] transition-colors"
    >
      <div
        className="sticky left-0 z-[1] flex w-[160px] shrink-0 items-center gap-2 px-3 py-3.5 bg-white group-hover:bg-[#f9fafb] transition-colors group-data-[scrolled=true]/card:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]"
        style={border()}
      >
        <BondLogo src={BOND_LOGOS[bond.logoIdx]} logoCrop={bond.logoCrop} className="size-8 rounded" />
        <span className="flex-1 min-w-0 text-sm font-bold leading-[24px] text-[#101828]">
          {bond.symbol}
        </span>
      </div>
      <div className="flex w-20 items-center justify-center p-3" style={border()}>
        <StatusTag status={bond.status} label={bond.status === "open" ? "Active" : "Inactive"} />
      </div>
      <div
        className="flex w-[136px] items-center justify-center px-3 py-3.5"
        style={border()}
      >
        <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">
          {bond.ytm}
        </span>
      </div>
      <div className="flex w-[120px] items-center justify-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">
          {bond.couponPeriod}
        </span>
      </div>
      <div className="flex w-32 items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">
          {bond.tenor}
        </span>
      </div>
      <div className="flex w-[120px] items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">
          {bond.maturity}
        </span>
      </div>
      <div
        className="flex w-[106px] items-center justify-center px-3 py-3.5"
        style={border()}
      >
        <span className="text-sm leading-[24px] text-[#101828] text-center">
          {bond.companyRating}
        </span>
      </div>
      <div
        className="flex w-[106px] items-center justify-center px-3 py-3.5"
        style={border()}
      >
        <span className="text-sm leading-[24px] text-[#101828] text-center">
          {bond.bondRating}
        </span>
      </div>
      <div className="flex w-[112px] items-center px-3 py-3.5" style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.risk}</span>
      </div>
      <div className="flex w-[140px] items-center px-3 py-3.5" style={border()}>
        <OfferTypeTag offerType={bond.offerType} />
      </div>
      <div
        className="flex flex-1 min-w-[140px] items-center px-3 py-3.5"
        style={border()}
      >
        <span className="text-sm leading-[24px] text-[#101828]">
          {bond.subscriptionPeriod}
        </span>
      </div>
      <div
        className="flex w-[92px] items-center justify-center px-3 py-[11px]"
        style={border()}
      >
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedBonds = filteredBonds.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilterCount = countFixedIncomeFilters(appliedFilters);
  const appliedFilterChips = useMemo(
    () => getFixedIncomeFilterChips(appliedFilters),
    [appliedFilters],
  );

  const openFilters = () => setFiltersOpen(true);

  const removeFilterChip = (chip: (typeof appliedFilterChips)[number]) => {
    setAppliedFilters((current) => removeFixedIncomeFilterChip(current, chip));
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-6 pt-6 pb-10">
      {/* ── Mobile/Tablet: sticky filter bar ── */}
      <div className="sticky top-9 z-[9] w-full py-3 bg-white lg:hidden">
        <div className="flex w-full max-w-[704px] flex-col gap-3">
          <div className="flex w-full flex-row items-center gap-3 md:gap-4">
            <MarketSwitcher market={market} onChange={setMarket} />
            <Badge
              variant="button"
              iconOnly
              label="Filter"
              count={activeFilterCount}
              onClick={openFilters}
              className="shrink-0 md:hidden"
            />
            <Badge
              variant="button"
              label="Filter"
              count={activeFilterCount}
              onClick={openFilters}
              className="shrink-0 hidden md:flex"
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
      <div className="hidden lg:flex flex-col gap-3 w-full">
        <div className="flex w-full justify-center">
          <div className="flex w-full max-w-[704px] flex-col items-start gap-3">
            <div className="flex w-full flex-row items-center gap-3 md:gap-4">
              <MarketSwitcher market={market} onChange={setMarket} />
              <Badge
                variant="button"
                label="Filter"
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
        <div className="flex items-center justify-end w-full px-1 text-sm leading-[24px] text-[#6a7282] whitespace-nowrap">
          <span>อัปเดตล่าสุด 25 August 2026 - 9:00</span>
        </div>
      </div>

      {/* ── Mobile/Tablet: count text ── */}
      <div className="flex items-center justify-between w-full px-1 text-xs leading-[20px] text-[#6a7282] whitespace-nowrap lg:hidden">
        <span>อัปเดตล่าสุด 25 Aug 2026 - 9:00</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:hidden">
        {pagedBonds.map((bond) => (
          <FixedIncomeCard
            key={bond.id}
            bond={bond}
            onSelect={onBondSelect}
            onBook={booking.book}
          />
        ))}
      </div>

      <div
        ref={tableCardRef}
        className="group/card hidden lg:block w-full rounded-xl bg-white"
        style={TABLE_CARD_STYLE}
      >
        <div
          ref={headerScrollRef}
          className="sticky top-[60px] z-20 overflow-x-hidden bg-white rounded-t-xl"
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
          <div className="flex flex-col min-w-[1440px]">
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
        </div>
      </div>

      {/* Pagination bar */}
      <div className="flex flex-wrap-reverse items-center justify-end gap-3 w-full">
        <div className="flex items-center gap-2">
          <p className="text-label text-muted-foreground whitespace-nowrap">Show per page</p>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-label border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-label text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {(safePage - 1) * pageSize + 1}
            </span>
            {" – "}
            <span className="font-medium text-foreground">
              {Math.min(safePage * pageSize, total)}
            </span>
            {" of "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            items
          </p>
          <Pagination
            totalPages={totalPages}
            currentPage={safePage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

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
