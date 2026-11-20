"use client";

import { useState, type ReactNode } from "react";
import { CaretRightIcon, InfoIcon } from "@phosphor-icons/react";
import { NetValueSummaryModal } from "./NetValueSummaryModal";
import { ASSET_CLASS, displayAssetLabel } from "@/lib/client-utils";
import {
  AllocationDonut,
  AllocationDonutWithTiles,
  AllocationEmptyState,
  hasAllocation,
} from "@/components/charts/AllocationDonut";
import { useT } from "@/i18n/I18nProvider";
import type { AssetAllocationSlice, AssetHeroSummary } from "@/types/portfolio";

const DEFAULT_HERO: AssetHeroSummary = {
  netValue: "0.00",
  changeAmount: "+0.00",
  changePercent: "0.00",
  changePositive: true,
  lineAvailable: "0.00",
  cash: "0.00",
  lastUpdatedDate: "—",
  lastUpdatedTime: "—",
};

export const ALLOCATION_SLICES: AssetAllocationSlice[] = [
  { label: ASSET_CLASS.cash, percent: 35, statusIcon: "/asset-allocation/status-0.svg" },
  { label: ASSET_CLASS.thaiStock, percent: 20, statusIcon: "/asset-allocation/status-1.svg" },
  { label: ASSET_CLASS.foreignStock, percent: 20, statusIcon: "/asset-allocation/status-2.svg" },
  { label: ASSET_CLASS.structuredBond, percent: 10, statusIcon: "/asset-allocation/status-3.svg" },
  { label: ASSET_CLASS.mutualFund, percent: 8, statusIcon: "/asset-allocation/status-4.svg" },
  { label: ASSET_CLASS.bond, percent: 6, statusIcon: "/asset-allocation/status-5.svg" },
  { label: ASSET_CLASS.derivatives, percent: 3, statusIcon: "/asset-allocation/status-6.svg" },
  { label: ASSET_CLASS.foreignBond, percent: 1, statusIcon: "/asset-allocation/status-7.svg" },
];

function AllocationBreakdownHeader() {
  const t = useT();
  return (
    <div className="flex w-full shrink-0 justify-start">
      <p className="type-body-2 leading-5 !font-bold whitespace-nowrap text-[var(--text-default-secondary)]">
        {t.client.assets.allocationBreakdown}
      </p>
    </div>
  );
}

function AllocationBreakdownCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex w-full flex-col items-start justify-center gap-3 rounded-lg border border-black/10 bg-white p-4 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * One card at every width. It used to be three — a desktop row-legend, a
 * one-column mobile legend and a two-column tablet split of the same rows —
 * because the legend arrangement was the only thing that changed. The KPI
 * tiles from the Client 360 overview replace all three: the tile grid is
 * already two columns that stack under the donut below `sm`, so the
 * breakpoint variants had nothing left to vary.
 *
 * The donut stays 96px until `lg` and goes to 130px there — the wide card has
 * the room, a phone doesn't.
 */
export function AllocationBreakdown({ slices }: { slices: AssetAllocationSlice[] }) {
  return (
    <AllocationBreakdownCard>
      <AllocationBreakdownHeader />
      <AllocationDonutWithTiles slices={slices} donutClassName="size-24 lg:size-[130px]" />
    </AllocationBreakdownCard>
  );
}

function AllocationLegendItemCompact({ slice }: { slice: AssetAllocationSlice }) {
  const t = useT();
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-1 px-2 py-1">
        <span className="relative size-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- 12px SVG status dot; the image optimizer rejects SVG */}
          <img alt="" className="block size-full max-w-none" src={slice.statusIcon} />
        </span>
        <p className="type-body-2 leading-5 whitespace-nowrap text-[var(--text-default-tertiary)]">
          {displayAssetLabel(slice.label, t)}
        </p>
      </div>
      <p className="type-body-2 shrink-0 leading-5 text-[var(--text-default-tertiary)]">
        {slice.percent}%
      </p>
    </div>
  );
}

/**
 * Sidebar keeps the row legend. The KPI tiles the standalone card uses need
 * two columns of real width, and the asset panel only ever renders in a narrow
 * one — tiles there truncate the longer Thai labels ("หุ้นกู้ที่มีอนุพันธ์แฝง")
 * mid-word, which a full-width row states outright.
 */
export function AllocationBreakdownSidebar({ slices }: { slices: AssetAllocationSlice[] }) {
  return (
    <AllocationBreakdownCard>
      <AllocationBreakdownHeader />
      {hasAllocation(slices) ? (
        <div className="flex w-full shrink-0 items-center gap-3">
          <AllocationDonut slices={slices} size={96} />
          <div className="flex min-w-0 flex-1 flex-col items-start">
            {slices.map((slice) => (
              <AllocationLegendItemCompact key={slice.label} slice={slice} />
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full">
          <AllocationEmptyState />
        </div>
      )}
    </AllocationBreakdownCard>
  );
}

export function LiabilitiesBar({ amount, onClick }: { amount: string; onClick?: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-black/10 bg-white py-2 pr-4 pl-5 transition-colors hover:bg-[var(--bg-default-secondary)]"
      onClick={onClick}
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        <p className="type-caption shrink-0 leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
          {t.client.assets.liabilities}
        </p>
        <p className="type-body-2 min-w-0 flex-1 text-right leading-5 font-bold text-destructive">
          {amount}
        </p>
      </div>
      <CaretRightIcon size={16} className="shrink-0 text-[var(--text-default-tertiary)]" />
    </button>
  );
}

export function HeroCard({ summary }: { summary: AssetHeroSummary }) {
  const t = useT();
  const [infoOpen, setInfoOpen] = useState(false);
  const changePrefix = summary.changePositive ? "+" : "";

  return (
    <>
      <div className="w-full overflow-hidden rounded-lg border border-black/10 bg-white">
        <div className="flex w-full flex-col items-center py-3">
          <div className="flex w-full items-start justify-center">
            <div className="flex items-center justify-center gap-1">
              <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
                {t.client.assets.netValue}
              </p>
              <button
                type="button"
                onClick={() => setInfoOpen(true)}
                className="cursor-pointer text-[var(--text-default-tertiary)] transition-colors hover:text-[var(--text-default-secondary)]"
                aria-label={t.client.assets.netValueInfoAria}
              >
                <InfoIcon size={16} className="shrink-0" />
              </button>
            </div>
          </div>
          <p className="type-h4 leading-9 whitespace-nowrap text-[var(--text-default-primary)]">
            {summary.netValue}
          </p>
          <div className="flex items-center justify-end gap-1">
            <p
              className={`type-caption leading-4 whitespace-nowrap ${
                summary.changePositive ? "text-[var(--text-success-primary)]" : "text-destructive"
              }`}
            >
              {summary.changeAmount}
            </p>
            <div
              className={`type-caption flex items-center rounded px-1.5 py-0.5 leading-4 ${
                summary.changePositive
                  ? "bg-[var(--bg-success-soft)] text-[var(--text-success-primary)]"
                  : "bg-[var(--bg-danger-light)] text-destructive"
              }`}
            >
              <span>{changePrefix}</span>
              <span>{summary.changePercent}%</span>
            </div>
          </div>
        </div>

        <div className="relative h-px w-full shrink-0">
          <svg
            className="absolute inset-0 block h-px w-full max-w-none"
            viewBox="0 0 996 1"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <line
              y1="0.5"
              x2="996"
              y2="0.5"
              stroke="black"
              strokeOpacity="0.1"
              strokeDasharray="2 2"
            />
          </svg>
        </div>

        <div className="flex w-full items-center">
          <div className="flex min-w-0 flex-[1_0_0] flex-col items-center pt-1.5 pb-3">
            <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
              {t.client.assets.lineAvailable}
            </p>
            <p className="type-subtitle-1 leading-6 font-bold whitespace-nowrap text-[var(--text-default-secondary)]">
              {summary.lineAvailable}
            </p>
          </div>
          <div className="flex min-w-0 flex-[1_0_0] flex-col items-center pt-1.5 pb-3">
            <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
              {t.client.assets.cash}
            </p>
            <p className="type-subtitle-1 leading-6 font-bold whitespace-nowrap text-[var(--text-default-secondary)]">
              {summary.cash}
            </p>
          </div>
        </div>
      </div>
      <NetValueSummaryModal open={infoOpen} onClose={() => setInfoOpen(false)} />
    </>
  );
}

export function LastUpdated({ summary }: { summary: AssetHeroSummary }) {
  const t = useT();
  return (
    <div className="type-caption flex w-full items-center justify-center gap-1 leading-4 whitespace-nowrap text-[var(--text-default-placeholder)]">
      <span>{t.client.assets.lastUpdated}</span>
      <span>{summary.lastUpdatedDate}</span>
      <span>-</span>
      <span>{summary.lastUpdatedTime}</span>
    </div>
  );
}

export function AssetSummarySection({ heroSummary }: { heroSummary?: AssetHeroSummary }) {
  const summary = heroSummary ?? DEFAULT_HERO;

  return (
    <section className="flex w-full flex-col">
      <div className="mx-auto flex w-full max-w-[996px] flex-col items-center gap-2">
        <HeroCard summary={summary} />
        <LastUpdated summary={summary} />

        {/* One allocation card — it handles its own widths, so there's no
            longer a per-breakpoint variant to switch between here. */}
        <div className="flex w-full">
          <AllocationBreakdown slices={ALLOCATION_SLICES} />
        </div>
      </div>
    </section>
  );
}
