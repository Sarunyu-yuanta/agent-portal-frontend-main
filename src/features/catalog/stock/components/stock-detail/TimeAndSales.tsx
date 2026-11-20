"use client";

import { useState } from "react";
import { Chip } from "@sarunyu/system-one";
import { DOWN, UP } from "@/features/catalog/stock/lib/stock-detail-constants";
import type {
  StockProductDetail,
  TimeSalesRow,
  VolumeAnalysisData,
  VolumeAnalysisRow,
  VolumeAnalysisSegmentKind,
} from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useT } from "@/i18n/I18nProvider";

const TONE: Record<"up" | "down", string> = { up: UP, down: DOWN };
const VOL_BUY = "#b7eb8f";
const VOL_SELL = "#ffa39e";
const VOL_NEUTRAL = "#595959";
const VOL_SEGMENT: Record<VolumeAnalysisSegmentKind, string> = {
  buy: VOL_BUY,
  neutral: VOL_NEUTRAL,
  sell: VOL_SELL,
};

function VolumeAnalysisBar({
  segments,
  maxVolumeM,
}: {
  segments: VolumeAnalysisRow["segments"];
  maxVolumeM: number;
}) {
  return (
    <div className="flex h-3.5 min-w-0 flex-1 items-center">
      {segments.map((segment, index) => {
        const widthPct = maxVolumeM > 0 ? (segment.volumeM / maxVolumeM) * 100 : 0;
        const isLast = index === segments.length - 1;
        return (
          <div
            key={`${segment.kind}-${index}`}
            className={`h-full shrink-0 ${isLast ? "rounded-tr rounded-br" : ""}`}
            style={{
              width: `${widthPct}%`,
              backgroundColor: VOL_SEGMENT[segment.kind],
            }}
          />
        );
      })}
    </div>
  );
}

function VolumeAnalysisChart({ data }: { data: VolumeAnalysisData }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10 px-4 py-6">
      <div className="relative w-full">
        <div className="flex flex-col gap-[11px]">
          {data.rows.map((row, index) => (
            <div key={`${row.price}-${index}`} className="flex h-3.5 w-full items-center gap-1">
              <span className="w-9 shrink-0 text-xs leading-[20px] text-[rgba(0,0,0,0.85)]">
                {row.showPrice ? row.price : ""}
              </span>
              <div className="relative min-w-0 flex-1 border-l border-black/10 pl-1">
                <VolumeAnalysisBar segments={row.segments} maxVolumeM={data.maxVolumeM} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex w-full items-start gap-1">
          <span className="w-9 shrink-0" aria-hidden />
          <div className="flex min-w-0 flex-1 items-center justify-between border-t border-black/10 pt-1 pl-1">
            {data.axisTicks.map((tick) => (
              <span key={tick} className="text-xs leading-[20px] text-black/40">
                {tick}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const TIME_SALES_COLS = ["time", "price", "volume", "side"] as const;

function TimeSalesTable({ rows }: { rows: TimeSalesRow[] }) {
  const t = useT();
  const ts = t.stock.detail.timeSales;
  return (
    <div className="flex max-h-[418px] w-full flex-col overflow-hidden rounded-xl border border-black/10">
      <div className="flex w-full items-center">
        {TIME_SALES_COLS.map((col) => (
          <div
            key={col}
            className={`flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-3 text-sm leading-[24px] text-black/40 ${
              col === "side" ? "justify-center" : col === "time" ? "justify-start" : "justify-end"
            }`}
          >
            {ts.cols[col]}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {rows.map((row, i) => (
          <div key={`${row.time}-${row.price}-${i}`} className="flex w-full items-center">
            <div className="flex min-w-0 flex-1 items-center border-b border-black/10 px-4 py-2 text-sm leading-[26px] text-[rgba(0,0,0,0.75)]">
              {row.time}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: TONE[row.priceTone] }}
            >
              {row.price}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-end border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: TONE[row.volumeTone] }}
            >
              {row.volume}
            </div>
            <div
              className="flex min-w-0 flex-1 items-center justify-center border-b border-black/10 px-4 py-2 text-sm leading-[26px]"
              style={{ color: row.side === "Buy" ? UP : DOWN }}
            >
              {ts.side[row.side]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TimeAndSales({ detail }: { detail: StockProductDetail }) {
  const t = useT();
  const ts = t.stock.detail.timeSales;
  const [mode, setMode] = useState<"tick" | "volume">("tick");
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="flex w-full items-end justify-between gap-2">
        <h2 className="text-lg leading-[28px] font-bold text-[rgba(0,0,0,0.85)]">{ts.title}</h2>
        <div className="flex items-center gap-2">
          <Chip
            type="single"
            size="small"
            label={ts.tick}
            selected={mode === "tick"}
            onClick={() => setMode("tick")}
          />
          <Chip
            type="single"
            size="small"
            label={ts.volumeAnalysis}
            selected={mode === "volume"}
            onClick={() => setMode("volume")}
          />
        </div>
      </div>
      {mode === "tick" ? (
        <TimeSalesTable rows={detail.trades} />
      ) : (
        <VolumeAnalysisChart data={detail.volumeAnalysis} />
      )}
    </section>
  );
}
