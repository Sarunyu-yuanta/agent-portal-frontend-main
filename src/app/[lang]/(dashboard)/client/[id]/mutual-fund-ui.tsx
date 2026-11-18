"use client";

import { Button } from "@sarunyu/system-one";
import { CaretLeftIcon, CaretRightIcon, InfoIcon } from "@phosphor-icons/react";
import { TagFilterChip } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MOBILE_PERFORMANCE_PERIODS,
  type MobilePerformancePeriod,
} from "./mutual-fund-data";

/**
 * Controls shared by every mutual-fund list surface, following the same
 * "one module per catalog area" shape as `stock-ui` and `portfolio-advisory-ui`.
 *
 * These were not extracted for tidiness. The tag legend below existed five
 * times — once in each of the three desktop list pages and once in each of the
 * two mobile ones, the mobile pair under the name `MobileTagLegend` — and all
 * five were byte-identical apart from that name. Five copies of one control is
 * five places a chip has to be restyled and four places it can be forgotten.
 */

/**
 * The View/Highlight tag filters, with the link to what the tags mean.
 *
 * Not mobile-specific despite the name it carried on two of its five call
 * sites: the markup never branched on width, so the phone and the desktop were
 * already rendering the same component under different names.
 */
export function MutualFundTagLegend({
  viewActive,
  highlightActive,
  onToggleView,
  onToggleHighlight,
  onShowLegend,
  trailing,
}: {
  viewActive: boolean;
  highlightActive: boolean;
  onToggleView: () => void;
  onToggleHighlight: () => void;
  onShowLegend: () => void;
  /**
   * Controls pinned to the row's right edge (the filter-results page puts search + filter here).
   * When set, "ดูคำอธิบาย" moves left next to the chips; on mobile the trailing controls wrap
   * onto their own full-width line.
   */
  trailing?: React.ReactNode;
}) {
  const legendLink = (
    <Button
      variant="plain"
      size="xs"
      onClick={onShowLegend}
      leftIcon={<InfoIcon size={16} />}
      className="shrink-0 !px-0"
    >
      ดูคำอธิบาย
    </Button>
  );

  if (trailing) {
    return (
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-3 px-3">
        <div className="flex items-center gap-2">
          <TagFilterChip
            icon={MF_ASSETS.performersTagView}
            label="View"
            active={viewActive}
            onClick={onToggleView}
          />
          <TagFilterChip
            icon={MF_ASSETS.performersTagHighlight}
            label="Highlight"
            active={highlightActive}
            onClick={onToggleHighlight}
          />
          <span className="ml-2">{legendLink}</span>
        </div>
        <div className="flex w-full items-center gap-2 lg:ml-auto lg:w-auto">{trailing}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-between gap-2 px-3">
      <div className="flex items-center gap-2">
        <TagFilterChip
          icon={MF_ASSETS.performersTagView}
          label="View"
          active={viewActive}
          onClick={onToggleView}
        />
        <TagFilterChip
          icon={MF_ASSETS.performersTagHighlight}
          label="Highlight"
          active={highlightActive}
          onClick={onToggleHighlight}
        />
      </div>
      {legendLink}
    </div>
  );
}

/**
 * The performance-period pills, as the phone draws them: a scrollable pill row
 * between two carets.
 *
 * Stays `Mobile`-named because this one earns it — the desktop pages draw the
 * same periods as their own `PerformancePeriodTabs`, and those two are *not*
 * interchangeable with this (different chrome, and they differ from each other
 * too). Only the phone's copy was duplicated, across both mobile pages.
 */
export function MobilePeriodTabs({
  active,
  onChange,
}: {
  active: MobilePerformancePeriod;
  onChange: (period: MobilePerformancePeriod) => void;
}) {
  return (
    <div className="flex h-10 w-full items-center gap-1 px-3">
      <Button variant="plain" size="icon-xs" aria-label="ช่วงเวลาก่อนหน้า" className="shrink-0">
        <CaretLeftIcon size={16} />
      </Button>
      <div className="min-w-0 flex-1 overflow-x-auto rounded-full bg-[#f3f3f3] p-1">
        <div className="flex w-max min-w-full">
          {MOBILE_PERFORMANCE_PERIODS.map((period) => {
            const selected = period === active;
            return (
              <button
                key={period}
                type="button"
                onClick={() => onChange(period)}
                className={`flex min-h-8 shrink-0 items-center justify-center rounded-full px-3 py-1.5 text-xs font-semibold leading-[20px] ${
                  selected
                    ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                    : "text-[#4a5565]"
                }`}
              >
                {period}
              </button>
            );
          })}
        </div>
      </div>
      <Button variant="plain" size="icon-xs" aria-label="ช่วงเวลาถัดไป" className="shrink-0">
        <CaretRightIcon size={16} />
      </Button>
    </div>
  );
}
