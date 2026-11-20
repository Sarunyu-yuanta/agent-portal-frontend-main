"use client";

import { useState } from "react";
import { RECOMMENDED_ISSUER_ROWS, type GlobalBondIssuerId } from "./global-bond-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  TABLE_SHADOW_SM,
  headerBorderStyle,
  cellBorderStyle,
  BondLogo,
} from "./fixed-income-shared";
import { useT } from "@/i18n/I18nProvider";

export function GlobalBondRecommendedTable({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const cols = t.products.globalBond.columns;
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
      className="table-scroll w-full overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW_SM }}
    >
      <div className="overflow-x-auto">
        <div className="flex items-stretch">
          {/* Issuer */}
          <div className="flex w-[296px] shrink-0 flex-col">
            <div className="flex h-11 items-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.issuer}</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex min-h-[52px] min-w-0 flex-1 cursor-pointer items-center gap-2 overflow-hidden px-4 py-3.5 transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <BondLogo src={row.logo} className="size-8 rounded" />
                <span className="min-w-0 flex-1 truncate text-sm leading-[24px] font-bold text-[#101828]">
                  {row.issuer}
                </span>
              </div>
            ))}
          </div>
          {/* Coupon Rate */}
          <div className="flex w-[120px] shrink-0 flex-col">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.couponRate}</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-center px-4 py-3.5 transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-center text-sm leading-[24px] text-[#101828]">
                  {row.couponRate}
                </span>
              </div>
            ))}
          </div>
          {/* Maturity */}
          <div className="flex min-w-[100px] flex-1 flex-col">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorderStyle()}>
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.maturity}</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-center px-4 py-3.5 transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-center text-sm leading-[24px] text-[#101828]">
                  {row.maturity}
                </span>
              </div>
            ))}
          </div>
          {/* Credit Rating — nested header */}
          <div className="flex w-[210px] shrink-0 flex-col">
            <div className="flex h-11 flex-col overflow-hidden" style={headerBorderStyle()}>
              <div
                className="flex flex-1 items-center justify-center px-4"
                style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
              >
                <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.creditRating}</span>
              </div>
              <div className="flex flex-1 items-stretch">
                <div
                  className="flex flex-1 items-center justify-center px-4"
                  style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
                >
                  <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>S&P</span>
                </div>
                <div
                  className="flex flex-1 items-center justify-center px-4"
                  style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
                >
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
                className="flex min-h-[52px] flex-1 cursor-pointer items-stretch transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-center text-sm leading-[24px] text-[#101828]">
                    {row.sp}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-center text-sm leading-[24px] text-[#101828]">
                    {row.moodys}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 py-3.5">
                  <span className="text-center text-sm leading-[24px] text-[#101828]">
                    {row.fitch}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {/* Yield */}
          <div className="flex shrink-0 flex-col">
            <div
              className="flex h-11 items-center justify-center px-4"
              style={headerBorderStyle({ right: false })}
            >
              <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.estimatedYield}</span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.map((row, i) => (
              <div
                key={i}
                className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-end px-4 py-3.5 transition-colors"
                {...rowCellProps(i, isLastRow(i))}
              >
                <span className="text-center text-sm leading-[24px] text-[#101828]">
                  {row.estimatedYield}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
