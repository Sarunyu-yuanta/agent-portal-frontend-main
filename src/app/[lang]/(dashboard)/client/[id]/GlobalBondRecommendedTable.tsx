"use client";

import { useState } from "react";
import {
  RECOMMENDED_ISSUER_ROWS,
  type GlobalBondIssuerId,
} from "./global-bond-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  TABLE_SHADOW_SM,
  headerBorderStyle,
  cellBorderStyle,
  BondLogo,
} from "./fixed-income-shared";

export function GlobalBondRecommendedTable({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  function rowCellProps(i: number, bottom?: boolean) {
    const row = RECOMMENDED_ISSUER_ROWS[i];
    return {
      onClick: () => onIssuerSelect?.(row.id),
      onMouseEnter: () => setHoveredRow(i),
      onMouseLeave: () => setHoveredRow(null),
      style: {
        ...cellBorderStyle({ bottom }),
        backgroundColor: hoveredRow === i ? "#f3f4f6" : row.alt ? "#f9fafb" : "white",
      },
    };
  }

  const isLastRow = (i: number) => (i === RECOMMENDED_ISSUER_ROWS.length - 1 ? false : undefined);

  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-white table-scroll"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW_SM }}
    >
      <div className="overflow-x-auto">
        <div className="flex items-stretch">
          {/* Issuer */}
          <div className="flex flex-col w-[296px] shrink-0">
            <div className="flex h-11 items-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ผู้ออกตราสาร</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex flex-1 items-center gap-2 min-w-0 px-4 py-3.5 min-h-[52px] overflow-hidden cursor-pointer transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <BondLogo src={row.logo} className="size-8 rounded" />
                <span className="flex-1 min-w-0 text-sm font-bold leading-[24px] text-[#101828] truncate">{row.issuer}</span>
              </div>
            ))}
          </div>
          {/* Coupon Rate */}
          <div className="flex flex-col w-[120px] shrink-0">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Coupon Rate</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px] cursor-pointer transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828] text-center">{row.couponRate}</span>
              </div>
            ))}
          </div>
          {/* Maturity */}
          <div className="flex flex-col flex-1 min-w-[100px]">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>วันครบกำหนด</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px] cursor-pointer transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828] text-center">{row.maturity}</span>
              </div>
            ))}
          </div>
          {/* Credit Rating — nested header */}
          <div className="flex flex-col w-[210px] shrink-0">
            <div className="flex flex-col h-11 overflow-hidden" style={headerBorderStyle()}>
              <div className="flex flex-1 items-center justify-center px-4" style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}>
                <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Credit Rating</span>
              </div>
              <div className="flex flex-1 items-stretch">
                <div className="flex flex-1 items-center justify-center px-4" style={{ borderRight: `1px solid ${BORDER_COLOR}` }}>
                  <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>S&P</span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4" style={{ borderRight: `1px solid ${BORDER_COLOR}` }}>
                  <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Moody&apos;s</span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4">
                  <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Fitch</span>
                </div>
              </div>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex flex-1 items-stretch min-h-[52px] cursor-pointer transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-sm leading-[24px] text-[#101828] text-center">{row.sp}</span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-sm leading-[24px] text-[#101828] text-center">{row.moodys}</span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-sm leading-[24px] text-[#101828] text-center">{row.fitch}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Yield */}
          <div className="flex flex-col shrink-0">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle({ right: false })}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ผลตอบแทนโดยประมาณ</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px] cursor-pointer transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-sm leading-[24px] text-[#101828] text-center">{row.estimatedYield}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
