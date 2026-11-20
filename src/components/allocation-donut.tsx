"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { ChartPieSliceIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { displayAssetLabel } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";

/**
 * Donut + legend palette, in slice order. Taken from the "Allocation
 * breakdown" card's original artwork (`public/asset-allocation/status-*.svg`,
 * still what its legend dots render) so the same allocation reads the same
 * colour wherever it's drawn. Positional, matching how `ALLOCATION_SLICES` is
 * ordered — a client whose slices come from `allocationData` instead has its
 * own label set and gets the palette by index.
 */
export const ALLOCATION_COLORS = [
  "#074EA4",
  "#51A2FF",
  "#FDC700",
  "#A684FF",
  "#A3B3FF",
  "#FB64B6",
  "#FF8904",
  "#00D492",
] as const;

/** `color` overrides the palette — liabilities carry their own red/pink set. */
export type AllocationDonutSlice = { label: string; percent: number; color?: string };

function AllocationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-sm">
      <p className="text-meta font-semibold text-muted-foreground">{name}</p>
      <p className="type-subtitle-2 font-bold text-foreground">{value}%</p>
    </div>
  );
}

/**
 * The one allocation donut. Radii are percentages of the box rather than
 * pixels so the same ring proportions hold at every size it's rendered at
 * (180px on the Client 360 overview, 96–130px beside the breakdown legend).
 *
 * `className` sizes the box in CSS instead of `size`, which is what a donut
 * that changes size per breakpoint needs — a numeric prop can't read the
 * viewport, and picking one at render time would mean measuring it.
 */
export function AllocationDonut({
  slices,
  size = 180,
  className,
}: {
  slices: AllocationDonutSlice[];
  size?: number;
  className?: string;
}) {
  const t = useT();
  const data = slices.map((s, i) => ({
    name: displayAssetLabel(s.label, t),
    value: s.percent,
    color: s.color ?? ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));
  // Keyed on the actual values so the chart remounts — and replays its entry
  // animation — whenever the allocation itself changes, not just on first mount.
  const chartKey = slices.map((s) => `${s.label}:${s.percent}`).join("|");

  return (
    <div
      key={chartKey}
      className={`shrink-0 ${className ?? ""}`}
      style={className ? undefined : { width: size, height: size }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="56%"
            outerRadius="89%"
            paddingAngle={1}
            stroke="none"
            animationDuration={350}
            animationEasing="ease-out"
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
          {/* The 96px donut is smaller than its own tooltip, so let the tooltip
              out of the chart box instead of having it clipped to a sliver. */}
          <Tooltip content={<AllocationTooltip />} allowEscapeViewBox={{ x: true, y: true }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * The legend, as KPI tiles rather than a label/percent row per slice: the
 * percentage is the number an RM is reading, so it gets the tile's own line at
 * subtitle size with the asset name above it in muted small caps.
 */
export function AllocationTiles({
  slices,
  /** Column classes for the grid. Two by default, which is what a legend beside
   *  a donut has room for; a caller that gives the tiles a whole row can widen
   *  it. Only the column count is meant to be passed here. */
  columnsClassName = "grid-cols-2",
}: {
  slices: AllocationDonutSlice[];
  columnsClassName?: string;
}) {
  const t = useT();
  return (
    <div className={`grid min-w-0 flex-1 gap-2 ${columnsClassName}`}>
      {slices.map((s, i) => (
        <div
          key={s.label}
          className="flex flex-col gap-1 rounded-xl bg-[var(--bg-default-secondary)] p-3"
        >
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: s.color ?? ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
              }}
            />
            <p className="truncate text-meta font-semibold text-muted-foreground">
              {displayAssetLabel(s.label, t)}
            </p>
          </div>
          <p className="type-subtitle-1 leading-none font-bold text-foreground">{s.percent}%</p>
        </div>
      ))}
    </div>
  );
}

/** Whether there is anything to draw — a donut of no slices (or all zeros) is a
 *  blank box, which reads as "still loading" rather than "nothing here". */
export function hasAllocation(slices: { percent: number }[]): boolean {
  return slices.some((s) => s.percent > 0);
}

/** What an allocation card shows in place of an empty donut. */
export function AllocationEmptyState() {
  const t = useT();
  return (
    <EmptyState
      size="compact"
      icon={
        <ChartPieSliceIcon
          size={32}
          weight="duotone"
          className="text-[var(--text-default-placeholder)]"
        />
      }
      title={t.client.assets.noAllocation}
    />
  );
}

/**
 * Donut + tile legend — the whole allocation block, shared by the Client 360
 * overview card and the "Allocation breakdown" card. Stacks below `sm`, where
 * two tile columns beside the donut would leave neither enough width.
 */
export function AllocationDonutWithTiles({
  slices,
  donutSize,
  donutClassName,
}: {
  slices: AllocationDonutSlice[];
  donutSize?: number;
  donutClassName?: string;
}) {
  if (!hasAllocation(slices)) return <AllocationEmptyState />;
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="mx-auto sm:mx-0">
        <AllocationDonut slices={slices} size={donutSize} className={donutClassName} />
      </div>
      <AllocationTiles slices={slices} />
    </div>
  );
}
