"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Pagination } from "@sarunyu/system-one";
import {
  HEADER_TEXT_CLS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  cellBorderStyle,
  headerBorderStyle,
} from "./fixed-income-shared";
import { THAI_STRUCTURED_PRODUCTS } from "./thai-structured-data";
import type { ThaiStructuredProduct } from "./thai-structured-data";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const MIN_WIDTH = "min-w-[1290px]";

/** Sticky first column — paints over scrolled content and reveals an edge
 *  shadow once the card body has scrolled horizontally (`data-scrolled`). */
const STICKY_COL =
  "sticky left-0 z-[1] bg-white group-data-[scrolled=true]/card:shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]";

type ColDef = {
  key: keyof ThaiStructuredProduct;
  label: string;
  width: string;
  /** Extra flex-alignment class, e.g. "justify-end" / "justify-center". */
  align: string;
  /** First column: pinned left. */
  sticky?: boolean;
  /** Emphasised value column (bold + accent blue), e.g. coupon. */
  accent?: boolean;
};

const COLS: ColDef[] = [
  { key: "theme",     label: "Investment Theme", width: "w-[160px]", align: "",               sticky: true },
  { key: "product",   label: "Product",          width: "w-[90px]",  align: "" },
  { key: "ccy",       label: "Ccy",              width: "w-[70px]",  align: "justify-center" },
  { key: "bbg1",      label: "BBG Code 1",       width: "w-[110px]", align: "" },
  { key: "bbg2",      label: "BBG Code 2",       width: "w-[110px]", align: "" },
  { key: "bbg3",      label: "BBG Code 3",       width: "w-[110px]", align: "" },
  { key: "couponPa",  label: "Coupon p.a. (%)",  width: "w-[130px]", align: "justify-end", accent: true },
  { key: "koType",    label: "KO Type",          width: "w-[110px]", align: "" },
  { key: "koBarrier", label: "KO Barrier (%)",   width: "w-[120px]", align: "justify-end" },
  { key: "strike",    label: "Strike (%)",       width: "w-[100px]", align: "justify-end" },
  { key: "kiBarrier", label: "KI Barrier",       width: "w-[100px]", align: "justify-end" },
  { key: "tenor",     label: "Tenor (m)",        width: "w-[90px]",  align: "justify-end" },
];

function TableHeader() {
  return (
    <div className={`flex h-11 items-stretch shrink-0 ${MIN_WIDTH} bg-white`}>
      {COLS.map((col, i) => (
        <div
          key={col.key}
          className={`flex ${col.width} shrink-0 items-center ${col.align} px-3 ${col.sticky ? STICKY_COL : ""}`}
          style={headerBorderStyle(i === COLS.length - 1 ? { right: false } : undefined)}
        >
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{col.label}</span>
        </div>
      ))}
    </div>
  );
}

function TableRow({
  row,
  isLast,
  onRowClick,
  href,
}: {
  row: ThaiStructuredProduct;
  isLast: boolean;
  onRowClick?: (row: ThaiStructuredProduct) => void;
  href?: string;
}) {
  const border = cellBorderStyle({ bottom: !isLast });
  const interactive = Boolean(onRowClick || href);
  const hoverHandlers = interactive
    ? {
        onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
          const el = e.currentTarget;
          el.style.backgroundColor = "#f9fafb";
          (el.firstElementChild as HTMLElement).style.backgroundColor = "#f9fafb";
        },
        onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
          const el = e.currentTarget;
          el.style.backgroundColor = "";
          (el.firstElementChild as HTMLElement).style.backgroundColor = "";
        },
      }
    : {};
  const className = `flex items-stretch shrink-0 ${MIN_WIDTH} bg-white ${interactive ? "cursor-pointer" : ""}`;
  const cells = COLS.map((col) => (
    <div
      key={col.key}
      className={`flex ${col.width} shrink-0 items-center ${col.align} px-3 py-3.5 ${col.sticky ? STICKY_COL : ""}`}
      style={border}
    >
      <span
        className={`text-sm ${col.sticky || col.accent ? "font-bold " : ""}leading-5 ${col.accent ? "text-[#0a6ee7]" : "text-[#101828]"} whitespace-nowrap`}
      >
        {row[col.key]}
      </span>
    </div>
  ));

  if (href) {
    return (
      <Link href={href} className={`${className} text-inherit no-underline`} {...hoverHandlers}>
        {cells}
      </Link>
    );
  }

  return (
    <div
      role={onRowClick ? "button" : undefined}
      tabIndex={onRowClick ? 0 : undefined}
      onClick={() => onRowClick?.(row)}
      onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); } } : undefined}
      className={className}
      {...hoverHandlers}
    >
      {cells}
    </div>
  );
}

export function ThaiStructuredProductTable({
  onRowClick,
  products = THAI_STRUCTURED_PRODUCTS,
  getRowHref,
}: {
  onRowClick?: (row: ThaiStructuredProduct) => void;
  products?: ThaiStructuredProduct[];
  getRowHref?: (row: ThaiStructuredProduct) => string;
} = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);

  const total = products.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = products.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={tableCardRef}
        className="group/card w-full rounded-xl bg-white"
        style={TABLE_CARD_STYLE}
      >
        {/* Sticky header */}
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
          <div className={`flex flex-col ${MIN_WIDTH}`}>
            {paged.map((row, i) => (
              <TableRow
                key={row.theme}
                row={row}
                isLast={i === paged.length - 1}
                onRowClick={onRowClick}
                href={getRowHref?.(row)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap-reverse items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <p className="text-[12px] text-muted-foreground whitespace-nowrap">Show per page</p>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="text-[12px] border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
          >
            {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">{(safePage - 1) * pageSize + 1}</span>
            {" – "}
            <span className="font-medium text-foreground">{Math.min(safePage * pageSize, total)}</span>
            {" of "}
            <span className="font-medium text-foreground">{total}</span>{" "}
            items
          </p>
          <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
}
