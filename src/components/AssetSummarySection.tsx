"use client";

import { useState, type ReactNode } from "react";
import { CaretRightIcon, InfoIcon } from "@phosphor-icons/react";
import { NetValueSummaryModal } from "@/components/NetValueSummaryModal";
import { ASSET_CLASS, displayAssetLabel } from "@/lib/client-utils";
import {
  AllocationDonut,
  AllocationDonutWithTiles,
  AllocationEmptyState,
  hasAllocation,
} from "@/components/allocation-donut";
import { useT } from "@/i18n/I18nProvider";

export type AssetHeroSummary = {
  netValue: string;
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
  lineAvailable: string;
  cash: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
};

export type AssetAllocationSlice = {
  label: string;
  percent: number;
  statusIcon: string;
};

export type AssetSummary = AssetHeroSummary & {
  allocationSlices: AssetAllocationSlice[];
};

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
      <p className="type-body-2 !font-bold text-[var(--text-default-secondary)] whitespace-nowrap leading-5">
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
      className={`bg-white border border-[rgba(0,0,0,0.1)] rounded-lg flex flex-col gap-3 items-start justify-center p-4 w-full ${className}`}
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
    <div className="flex gap-2 items-center w-full justify-between">
      <div className="flex gap-1 items-center px-2 py-1">
        <span className="relative shrink-0 size-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- 12px SVG status dot; the image optimizer rejects SVG */}
          <img alt="" className="block size-full max-w-none" src={slice.statusIcon} />
        </span>
        <p className="type-body-2 text-[var(--text-default-tertiary)] leading-5 whitespace-nowrap">
          {displayAssetLabel(slice.label, t)}
        </p>
      </div>
      <p className="type-body-2 text-[var(--text-default-tertiary)] leading-5 shrink-0">
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
        <div className="flex gap-3 items-center shrink-0 w-full">
          <AllocationDonut slices={slices} size={96} />
          <div className="flex flex-1 flex-col items-start min-w-0">
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

export function LiabilitiesBar({
  amount,
  onClick,
}: {
  amount: string;
  onClick?: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg flex items-center gap-2 pl-5 pr-4 py-2 w-full cursor-pointer hover:bg-[var(--bg-default-secondary)] transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-1 gap-0.5 items-center min-w-0">
        <p className="type-caption text-[var(--text-default-tertiary)] whitespace-nowrap leading-4 shrink-0">
          {t.client.assets.liabilities}
        </p>
        <p className="flex-1 type-body-2 font-bold text-destructive text-right leading-5 min-w-0">
          {amount}
        </p>
      </div>
      <CaretRightIcon size={16} className="text-[var(--text-default-tertiary)] shrink-0" />
    </button>
  );
}

export function HeroCard({ summary }: { summary: AssetHeroSummary }) {
  const t = useT();
  const [infoOpen, setInfoOpen] = useState(false);
  const changePrefix = summary.changePositive ? "+" : "";

  return (
    <>
    <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden w-full">
      <div className="flex flex-col items-center py-3 w-full">
        <div className="flex items-start justify-center w-full">
          <div className="flex gap-1 items-center justify-center">
            <p className="type-caption text-[var(--text-default-tertiary)] whitespace-nowrap leading-4">
              {t.client.assets.netValue}
            </p>
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              className="text-[var(--text-default-tertiary)] hover:text-[var(--text-default-secondary)] transition-colors cursor-pointer"
              aria-label={t.client.assets.netValueInfoAria}
            >
              <InfoIcon size={16} className="shrink-0" />
            </button>
          </div>
        </div>
        <p className="type-h4 text-[var(--text-default-primary)] whitespace-nowrap leading-9">
          {summary.netValue}
        </p>
        <div className="flex gap-1 items-center justify-end">
          <p
            className={`type-caption whitespace-nowrap leading-4 ${
              summary.changePositive ? "text-[var(--text-success-primary)]" : "text-destructive"
            }`}
          >
            {summary.changeAmount}
          </p>
          <div
            className={`flex items-center px-1.5 py-0.5 rounded type-caption leading-4 ${
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

      <div className="relative h-px shrink-0 w-full">
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

      <div className="flex items-center w-full">
        <div className="flex flex-[1_0_0] flex-col items-center min-w-0 pt-1.5 pb-3">
          <p className="type-caption text-[var(--text-default-tertiary)] whitespace-nowrap leading-4">
            {t.client.assets.lineAvailable}
          </p>
          <p className="type-subtitle-1 font-bold text-[var(--text-default-secondary)] whitespace-nowrap leading-6">
            {summary.lineAvailable}
          </p>
        </div>
        <div className="flex flex-[1_0_0] flex-col items-center min-w-0 pt-1.5 pb-3">
          <p className="type-caption text-[var(--text-default-tertiary)] whitespace-nowrap leading-4">
            {t.client.assets.cash}
          </p>
          <p className="type-subtitle-1 font-bold text-[var(--text-default-secondary)] whitespace-nowrap leading-6">
            {summary.cash}
          </p>
        </div>
      </div>
    </div>
    <NetValueSummaryModal
      open={infoOpen}
      onClose={() => setInfoOpen(false)}
    />
    </>
  );
}

export function LastUpdated({ summary }: { summary: AssetHeroSummary }) {
  const t = useT();
  return (
    <div className="flex gap-1 items-center justify-center w-full type-caption text-[var(--text-default-placeholder)] whitespace-nowrap leading-4">
      <span>{t.client.assets.lastUpdated}</span>
      <span>{summary.lastUpdatedDate}</span>
      <span>-</span>
      <span>{summary.lastUpdatedTime}</span>
    </div>
  );
}

export function AssetSummarySection({
  heroSummary,
}: {
  heroSummary?: AssetHeroSummary;
}) {
  const summary = heroSummary ?? DEFAULT_HERO;

  return (
    <section className="flex flex-col w-full">
      <div className="flex flex-col gap-2 items-center w-full max-w-[996px] mx-auto">
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
