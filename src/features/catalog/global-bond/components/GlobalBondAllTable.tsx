"use client";

import type { GlobalBondRow } from "@/features/catalog/global-bond/lib/global-bond-data";
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
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { useSyncedTableScroll } from "@/features/catalog/hooks/use-synced-table-scroll";
import { GlobalBondListCta } from "./GlobalBondDetailBondList";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

const BONDS_COL_MIN_CLS = "min-w-[400px]";
const INVEST_URL = "https://placeholder.example.com/create-order";

function IssuerLogo({ src }: { src: string }) {
  return (
    <div className="flex shrink-0 items-center py-0.5">
      <BondLogo src={src} className="size-8 rounded" />
    </div>
  );
}

export function GlobalBondAllTable({
  bonds,
  onClearFilters,
}: {
  bonds: GlobalBondRow[];
  /** Given only while a filter is narrowing a non-empty list — see `GlobalBondAllPage`. */
  onClearFilters?: () => void;
}) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const { isScrolled, headerScrollRef, bodyScrollRef, onBodyScroll } = useSyncedTableScroll();

  if (bonds.length === 0) {
    return (
      <div
        className="w-full overflow-hidden rounded-xl bg-white px-4"
        style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_CARD_STYLE.boxShadow }}
      >
        <CatalogSectionEmpty
          title={t.products.states.noGlobalBonds}
          onClearFilters={onClearFilters}
        />
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
          <div
            className={`flex h-11 w-[400px] shrink-0 items-center ${BONDS_COL_MIN_CLS} px-4 ${stickyColCls}`}
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.bonds}</span>
          </div>
          <div
            className="flex h-11 w-[138px] shrink-0 items-center px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.isin}</span>
          </div>
          <div
            className="flex h-11 w-[80px] shrink-0 items-center justify-center px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.currency}</span>
          </div>
          <div
            className="flex h-11 w-[128px] shrink-0 items-center justify-end px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.couponRate}</span>
          </div>
          <div
            className="flex h-11 w-[81px] shrink-0 items-center justify-end px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.price}</span>
          </div>
          <div
            className="flex h-11 w-[180px] shrink-0 items-center justify-end px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.estimatedYield}</span>
          </div>
          <div
            className="flex h-11 w-[122px] shrink-0 items-center justify-center px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.maturity}</span>
          </div>
          <div
            className="flex h-11 w-[112px] shrink-0 items-center justify-end px-4"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.durationYears}</span>
          </div>
          <div
            className="flex h-11 w-[122px] shrink-0 items-center justify-center px-3"
            style={headerBorderStyle()}
          >
            <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{cols.documents}</span>
          </div>
          <div
            className="flex h-11 w-[138px] shrink-0 items-center justify-center px-4"
            style={headerBorderStyle({ right: false })}
          />
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
                  className={`flex w-[400px] min-w-0 items-center gap-2 ${BONDS_COL_MIN_CLS} h-[65px] shrink-0 overflow-hidden px-4 py-3.5 ${stickyColCls}`}
                  style={border}
                >
                  <IssuerLogo src={row.logo} />
                  <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
                    <span className="min-w-0 truncate text-sm leading-[24px] text-[#101828]">
                      {row.name}
                    </span>
                    {row.topPick && <TopPickTag />}
                  </div>
                </div>
                <div
                  className="flex h-[65px] w-[138px] shrink-0 items-center px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.isin}</span>
                </div>
                <div
                  className="flex h-[65px] w-[80px] shrink-0 items-center justify-center px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.currency}</span>
                </div>
                <div
                  className="flex h-[65px] w-[128px] shrink-0 items-center justify-end px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.couponRate}</span>
                </div>
                <div
                  className="flex h-[65px] w-[81px] shrink-0 items-center justify-end px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.price}</span>
                </div>
                <div
                  className="flex h-[65px] w-[180px] shrink-0 items-center justify-end px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
                </div>
                <div
                  className="flex h-[65px] w-[122px] shrink-0 items-center justify-center px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.maturity}</span>
                </div>
                <div
                  className="flex h-[65px] w-[112px] shrink-0 items-center justify-end px-4 py-3.5"
                  style={border}
                >
                  <span className="text-sm leading-[24px] text-[#101828]">{row.duration}</span>
                </div>
                <div
                  className="flex h-[65px] w-[122px] shrink-0 items-center justify-center px-3 py-[11px]"
                  style={border}
                >
                  <FactsheetButton />
                </div>
                <div
                  className="flex h-[65px] w-[138px] shrink-0 items-center justify-center px-4 py-3"
                  style={border}
                >
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
