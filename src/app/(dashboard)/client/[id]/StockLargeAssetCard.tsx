"use client";

import { HeartIcon } from "@phosphor-icons/react";
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
  favoriteIcon = true,
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
  favoriteIcon?: boolean;
  onSelect?: () => void;
}) {
  const amountColor =
    trend === "flat"
      ? "#6a7282"
      : figmaSectorAmountColors
        ? "#008236"
        : TREND_TEXT[trend];

  const card = (
    <div className="flex min-w-[343px] w-full items-center gap-6 rounded-lg border-b border-black/10 bg-white p-6">
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
      {favoriteIcon ? (
        <HeartIcon size={22} weight="regular" className="shrink-0 text-[#6a7282]" aria-hidden />
      ) : null}
    </div>
  );

  if (!onSelect) return card;

  return (
    <button type="button" onClick={onSelect} className="w-full text-left">
      {card}
    </button>
  );
}
