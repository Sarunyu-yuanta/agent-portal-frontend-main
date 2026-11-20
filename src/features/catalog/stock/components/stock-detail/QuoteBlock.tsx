"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, ClockIcon } from "@phosphor-icons/react";
import type { Trend } from "@/features/catalog/stock/lib/stock-data";
import { ASSETS } from "@/features/catalog/stock/lib/stock-detail-constants";
import type { StockProductDetail } from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useT } from "@/i18n/I18nProvider";
import { StockAdvanceDataModal } from "./StockAdvanceDataModal";

function PriceIcon({ trend }: { trend: Trend }) {
  if (trend === "up") {
    return <CaretUpIcon size={24} weight="fill" className="shrink-0 text-[#2f952a]" aria-hidden />;
  }
  if (trend === "flat") {
    return <span className="inline-block size-6 shrink-0" aria-hidden />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={ASSETS.priceDown} alt="" width={24} height={24} className="shrink-0" />
  );
}

export function QuoteBlock({ detail }: { detail: StockProductDetail }) {
  const t = useT();
  const q = t.stock.detail.quote;
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const changeColor =
    detail.trend === "up" ? "#2f952a" : detail.trend === "down" ? "#cf1421" : "#6a7282";
  const pillBg =
    detail.trend === "up" ? "#dbfce7" : detail.trend === "down" ? "#fff0f0" : "#f3f4f6";
  const sign = detail.trend === "up" ? "+" : detail.trend === "down" ? "-" : "";

  return (
    <div className="flex w-full flex-col gap-4 pt-3 pb-4">
      <div className="flex w-full items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-1">
            <PriceIcon trend={detail.trend} />
            <span className="text-[40px] leading-[60px] font-bold text-[rgba(0,0,0,0.85)]">
              {detail.price}
            </span>
            <span className="text-sm leading-[24px] text-black/40">{detail.currency}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: changeColor }}>
            <span className="text-base leading-[24px]">{detail.changeAmount}</span>
            {detail.trend !== "flat" ? (
              <span
                className="inline-flex items-center overflow-hidden rounded px-1.5 py-0.5 text-sm leading-[24px]"
                style={{ backgroundColor: pillBg, color: changeColor }}
              >
                <span className="w-[9px] text-center">{sign}</span>
                <span>{detail.changePercent}</span>
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <ClockIcon size={16} className="shrink-0 text-[#666]" />
            <span className="text-xs leading-[20px] text-[#666]">
              {t.stock.detail.lastUpdated(detail.lastUpdated)}
            </span>
          </div>
        </div>
        <div className="flex h-full shrink-0 flex-col items-end justify-end gap-4">
          <span className="inline-flex items-center justify-center gap-1 rounded-[80px] border border-black/10 bg-white py-0.5 pr-0.5 pl-1.5">
            <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{detail.market}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={detail.marketIcon}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0 rounded-full"
            />
          </span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm leading-[24px] text-[rgba(0,0,0,0.75)]">{q.daysRange}</span>
            <span className="inline-flex items-center gap-1 rounded-[34px] border border-black/10 px-2 py-0.5 text-sm leading-[24px] text-[rgba(0,0,0,0.75)]">
              {detail.dayLow}
              <span className="inline-block h-px w-5 bg-black/20" aria-hidden />
              {detail.dayHigh}
            </span>
          </div>
        </div>
      </div>
      <button
        type="button"
        aria-expanded={advanceOpen}
        aria-haspopup="dialog"
        onClick={() => setAdvanceOpen(true)}
        className="inline-flex w-fit cursor-pointer items-center gap-4 rounded-2xl bg-[#f9f9f9] py-1.5 pr-2 pl-3 transition-colors hover:bg-[#ececec] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none active:bg-[#e4e4e4] aria-expanded:bg-[#ececec]"
      >
        <div className="flex items-center gap-[13px] text-sm leading-[24px]">
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.volume}</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.volume}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.value}</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.value}</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-black/40">{q.mktCap}</span>
            <span className="text-[rgba(0,0,0,0.85)]">{detail.marketCap}</span>
          </span>
        </div>
        <CaretDownIcon
          size={16}
          className={`shrink-0 text-neutral-500 transition-transform ${advanceOpen ? "rotate-180" : ""}`}
        />
      </button>
      {advanceOpen ? (
        <StockAdvanceDataModal data={detail.advance} onClose={() => setAdvanceOpen(false)} />
      ) : null}
    </div>
  );
}
