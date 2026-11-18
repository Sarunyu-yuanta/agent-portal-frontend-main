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

const ROW_CELL_CLS = "cursor-pointer transition-colors";

export function GlobalBondTopPickTable({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
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
      className="w-full rounded-xl overflow-hidden bg-white table-scroll"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW_SM }}
    >
      <div className="overflow-x-auto">
        <div className="flex items-stretch min-w-[1305px]">
          {/* Bond name */}
          <div className="flex flex-col flex-1 min-w-0">
            <div
              className="flex h-11 items-center px-4"
              style={headerBorderStyle({ right: false })}
            >
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Top pick</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 min-w-0 px-4 py-3.5 min-h-[52px] overflow-hidden ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <BondLogo src={row.logo} className="size-8 rounded" />
                <span className="flex-1 min-w-0 truncate text-sm leading-[24px] text-[#101828]">
                  {row.name}
                </span>
              </div>
            ))}
          </div>
          {/* Top Pick tag column */}
          <div className="flex flex-col w-[70px] shrink-0">
            <div
              className="flex h-11 items-center justify-center px-4"
              style={headerBorderStyle()}
            />
            {TOP_PICK_ROWS.map((_row, i) => (
              <div
                key={i}
                className={`flex flex-1 items-center justify-center px-4 py-3 min-h-[52px] ${ROW_CELL_CLS}`}
                {...rowCellProps(i, isLastRow(i))}
              >
                <TopPickTag />
              </div>
            ))}
          </div>
          {/* ISIN */}
          <div className="flex flex-col w-[154px] shrink-0">
            <div className="flex h-11 items-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ISIN</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.isin}</span>
              </div>
            ))}
          </div>
          {/* Currency */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Currency</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.currency}</span>
              </div>
            ))}
          </div>
          {/* Coupon Rate */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Coupon Rate</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.couponRate}</span>
              </div>
            ))}
          </div>
          {/* Price */}
          <div className="flex flex-col w-[81px] shrink-0">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Price</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.price}</span>
              </div>
            ))}
          </div>
          {/* Yield */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ผลตอบแทน</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
              </div>
            ))}
          </div>
          {/* Maturity */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>วันครบกำหนด</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.maturity}</span>
              </div>
            ))}
          </div>
          {/* Duration */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ระยะเวลา (ปี)</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <span className="text-sm leading-[24px] text-[#101828]">{row.duration}</span>
              </div>
            ))}
          </div>
          {/* Factsheet */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-center px-3" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>เอกสาร</span>
            </div>
            {TOP_PICK_ROWS.map((_row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-center px-3 py-[11px] min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <FactsheetButton />
              </div>
            ))}
          </div>
          {/* Invest */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-center px-3" style={headerBorderStyle({ right: false })}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>คำสั่งซื้อ</span>
            </div>
            {TOP_PICK_ROWS.map((row, i) => (
              <div key={i} className={`flex flex-1 items-center justify-center px-3 py-[11px] min-h-[52px] ${ROW_CELL_CLS}`} {...rowCellProps(i, isLastRow(i))}>
                <GlobalBondListCta row={row} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
