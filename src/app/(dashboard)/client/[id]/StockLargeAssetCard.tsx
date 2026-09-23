"use client";

import { StockMiniChart } from "./StockMiniChart";
import type { Trend } from "./stock-data";

const TREND_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#6a7282" };
const TREND_PILL_BG: Record<Trend, string> = { up: "#dbfce7", down: "#fef2f2", flat: "#f3f4f6" };

function AssetPercentPill({ trend, value }: { trend: Trend; value: string }) {
  if (trend === "flat") return null;
  const sign = trend === "up" ? "+" : "-";
  const body = value.replace(/^[+-]/, "");
  return (
    <span
      className="inline-flex shrink-0 items-center gap-0 rounded px-1.5 py-0.5 text-xs"
      style={{ backgroundColor: TREND_PILL_BG[trend], color: TREND_TEXT[trend] }}
    >
      <span>{sign}</span>
      <span>{body}</span>
    </span>
  );
}

/** Figma "Asset Card" size Large (node 23087:34560) — SET sector list, DR/ETF detail grids. */
export function StockLargeAssetCard({
  symbol,
  subtitle,
  price,
  currency = "THB",
  changeAmount,
  changePercent,
  trend,
  series,
  /** Figma sector grid keeps gain green on the amount even when the pill is red. */
  figmaSectorAmountColors = false,
  onSelect,
}: {
  symbol: string;
  subtitle: string;
  price: string;
  currency?: string;
  changeAmount: string;
  changePercent: string;
  trend: Trend;
  series: number[];
  figmaSectorAmountColors?: boolean;
  onSelect?: () => void;
}) {
  const amountColor =
    trend === "flat"
      ? "#6a7282"
      : figmaSectorAmountColors
        ? "#008236"
        : TREND_TEXT[trend];

  // `group-hover:` rather than `hover:` — the hover belongs to the whole card
  // but the button below is the element that receives it, and the fill has to
  // land on this div because it is the one carrying `bg-white`. The `!` is this
  // repo's standing fix for that cascade: `@sarunyu/system-one` ships a plain
  // `.bg-white` and loads after `globals.css`, so it takes the specificity tie
  // from a Tailwind variant (see `SELECTED_TITLE` in `NotesSidebarList`).
  // Nothing fires when the card is not clickable — there is no `group` ancestor
  // then.
  const card = (
    <div className="flex min-w-[343px] w-full items-center gap-6 rounded-lg border-b border-black/10 bg-white p-6 transition-[background-color,box-shadow] group-hover:bg-[#fafafa]! group-hover:shadow-[0px_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="max-w-[119px] truncate text-sm font-bold leading-5 text-[#101828]">{symbol}</p>
          <p className="truncate text-sm leading-5 text-[#6a7282]">{subtitle}</p>
        </div>
        <StockMiniChart series={series} trend={trend} width={96} height={42} className="h-[42px] w-24 shrink-0" />
        <div className="flex w-[120px] max-w-[170px] shrink-0 flex-col items-end gap-0.5">
          <div className="flex items-center gap-1 text-sm font-bold leading-5 text-[#101828]">
            <span>{price}</span>
            <span>{currency}</span>
          </div>
          {trend === "flat" ? (
            <span className="text-sm leading-5 text-[#6a7282]">{changeAmount}</span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm leading-5" style={{ color: amountColor }}>
                {changeAmount}
              </span>
              <AssetPercentPill trend={trend} value={changePercent} />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!onSelect) return card;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full cursor-pointer rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fill-p1-600)]"
    >
      {card}
    </button>
  );
}
