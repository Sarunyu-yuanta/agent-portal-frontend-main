"use client";

import { useState } from "react";
import { TOP_PICK_ROWS, getIssuerIdForBondRow, type GlobalBondIssuerId } from "./global-bond-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  TABLE_SHADOW_SM,
  headerBorderStyle,
  cellBorderStyle,
  BondLogo,
  TopPickTag,
  FactsheetButton,
} from "./fixed-income-shared";
import { GlobalBondListCta } from "./GlobalBondDetailBondList";
import { useT } from "@/i18n/I18nProvider";

const ROW_CELL_CLS = "cursor-pointer transition-colors";

export function GlobalBondTopPickTable({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  function rowCellProps(i: number, bottom?: boolean) {
    return {
      onClick: () => {
        const issuerId = getIssuerIdForBondRow(TOP_PICK_ROWS[i]);
        if (issuerId) onIssuerSelect?.(issuerId);
      },
      onMouseEnter: () => setHoveredRow(i),
      onMouseLeave: () => setHoveredRow(null),
      style: {
        ...cellBorderStyle({ bottom }),
        backgroundColor: hoveredRow === i ? "#f9fafb" : undefined,
      },
    };
  }

  const isLastRow = (i: number) => (i === TOP_PICK_ROWS.length - 1 ? false : undefined);

  return (
    <div
      className="table-scroll w-full overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW_SM }}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-[1305px] items-stretch">
          {/* Bond name */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div
              className="flex h-11 items-center px-4"
              style={headerBorderStyle({ right: false })}
            >
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.topPick}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] min-w-0 items-center gap-2 overflow-hidden px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <BondLogo src={row.logo} className="size-8 rounded" />
                <span className="min-w-0 flex-1 truncate text-sm leading-[24px] text-[#101828]">
                  {row.name}
                </span>
              </div>
            ))}
          </div>
          {/* Top Pick tag column */}
          <div className="flex w-[70px] shrink-0 flex-col">
            <div
              className="flex h-11 items-center justify-center px-4"
              style={headerBorderStyle()}
            />
            {TOP_PICK_ROWS.map((_row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-center px-4 py-3 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <TopPickTag />
              </div>
            ))}
          </div>
          {/* ISIN */}
          <div className="flex w-[154px] shrink-0 flex-col">
            <div className="flex h-11 items-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.isin}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.isin}</span>
              </div>
            ))}
          </div>
          {/* Currency */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.currency}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-center px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.currency}</span>
              </div>
            ))}
          </div>
          {/* Coupon Rate */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.couponRate}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.couponRate}</span>
              </div>
            ))}
          </div>
          {/* Price */}
          <div className="flex w-[81px] shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.price}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.price}</span>
              </div>
            ))}
          </div>
          {/* Yield */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.yield}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
              </div>
            ))}
          </div>
          {/* Maturity */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.maturity}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-center px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.maturity}</span>
              </div>
            ))}
          </div>
          {/* Duration */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.durationYears}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5 ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.duration}</span>
              </div>
            ))}
          </div>
          {/* Factsheet */}
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-center px-3" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.documents}</span>
            </div>
            {TOP_PICK_ROWS.map((_row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-center px-3 py-[11px] ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <FactsheetButton />
              </div>
            ))}
          </div>
          {/* Invest */}
          <div className="flex shrink-0 flex-col">
            <div
              className="flex h-11 items-center justify-center px-3"
              style={headerBorderStyle({ right: false })}
            >
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.order}</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex min-h-[52px] flex-1 items-center justify-center px-3 py-[11px] ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <GlobalBondListCta row={row} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
