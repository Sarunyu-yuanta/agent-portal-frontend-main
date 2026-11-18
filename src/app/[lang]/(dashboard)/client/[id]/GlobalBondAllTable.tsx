"use client";

import type { GlobalBondRow } from "./global-bond-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  SCROLLABLE_TABLE_BODY_CLS,
  TABLE_CARD_STYLE,
  BondLogo,
  FactsheetButton,
  TopPickTag,
  cellBorderStyle,
  headerBorderStyle,
} from "./fixed-income-shared";
import { useSyncedTableScroll } from "./use-synced-table-scroll";
import { GlobalBondListCta } from "./GlobalBondDetailBondList";

const BONDS_COL_MIN_CLS = "min-w-[400px]";
const INVEST_URL = "https://placeholder.example.com/create-order";

function IssuerLogo({ src }: { src: string }) {
  return (
    <div className="flex shrink-0 items-center py-0.5">
      <BondLogo src={src} className="size-8 rounded" />
    </div>
  );
}

export function GlobalBondAllTable({ bonds }: { bonds: GlobalBondRow[] }) {
  const { isScrolled, headerScrollRef, bodyScrollRef, onBodyScroll } = useSyncedTableScroll();

  if (bonds.length === 0) {
    return (
      <div
        className="w-full rounded-xl overflow-hidden bg-white px-4 py-10 text-center text-sm text-[#6a7282]"
        style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_CARD_STYLE.boxShadow }}
      >
        ไม่พบรายการที่ตรงกับตัวกรอง
      </div>
    );
  }

  const stickyColCls = `sticky left-0 z-[1] bg-white${isScrolled ? " shadow-[2px_0_4px_rgba(0,0,0,0.06)]" : ""}`;

  return (
    <div className="w-full rounded-xl bg-white" style={TABLE_CARD_STYLE}>
      {/* Sticky header — pinned to the top of the page scroll; its own
          horizontal scroll is hidden and driven programmatically to stay in
          sync with the body below. */}
      <div
        ref={headerScrollRef}
        className="sticky top-0 z-10 overflow-x-hidden bg-white"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex items-stretch">
          <div className={`flex h-11 shrink-0 items-center w-[400px] ${BONDS_COL_MIN_CLS} px-4 ${stickyColCls}`} style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Bonds</span>
          </div>
          <div className="flex h-11 shrink-0 items-center w-[138px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ISIN</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-center w-[80px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Currency</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-end w-[128px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Coupon Rate</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-end w-[81px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Price</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-end w-[180px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ผลตอบแทนโดยประมาณ</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-center w-[122px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>วันครบกำหนด</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-end w-[112px] px-4" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>ระยะเวลา (ปี)</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-center w-[122px] px-3" style={headerBorderStyle()}>
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>เอกสาร</span>
          </div>
          <div className="flex h-11 shrink-0 items-center justify-center w-[138px] px-4" style={headerBorderStyle({ right: false })} />
        </div>
      </div>

      {/* Scrollable body — the only element that shows a (default-styled)
          native horizontal scrollbar, spanning the full width of the table. */}
      <div ref={bodyScrollRef} className={SCROLLABLE_TABLE_BODY_CLS} onScroll={onBodyScroll}>
        <div className="flex flex-col">
          {bonds.map((row, i) => {
            const border = cellBorderStyle({ bottom: i === bonds.length - 1 ? false : undefined });
            return (
              <div key={row.id} className="flex items-stretch">
                <div
                  className={`flex items-center gap-2 min-w-0 w-[400px] ${BONDS_COL_MIN_CLS} shrink-0 px-4 py-3.5 h-[65px] overflow-hidden ${stickyColCls}`}
                  style={border}
                >
                  <IssuerLogo src={row.logo} />
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <span className="min-w-0 truncate text-sm leading-[24px] text-[#101828]">{row.name}</span>
                    {row.topPick && <TopPickTag />}
                  </div>
                </div>
                <div className="flex items-center w-[138px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.isin}</span>
                </div>
                <div className="flex items-center justify-center w-[80px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.currency}</span>
                </div>
                <div className="flex items-center justify-end w-[128px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.couponRate}</span>
                </div>
                <div className="flex items-center justify-end w-[81px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.price}</span>
                </div>
                <div className="flex items-center justify-end w-[180px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
                </div>
                <div className="flex items-center justify-center w-[122px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.maturity}</span>
                </div>
                <div className="flex items-center justify-end w-[112px] shrink-0 px-4 py-3.5 h-[65px]" style={border}>
                  <span className="text-sm leading-[24px] text-[#101828]">{row.duration}</span>
                </div>
                <div className="flex items-center justify-center w-[122px] shrink-0 px-3 py-[11px] h-[65px]" style={border}>
                  <FactsheetButton />
                </div>
                <div className="flex items-center justify-center w-[138px] shrink-0 px-4 py-3 h-[65px]" style={border}>
                  <GlobalBondListCta row={row} href={INVEST_URL} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
