"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import type { StockAdvanceData } from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useT } from "@/i18n/I18nProvider";

function DaysRangeMeter({ data }: { data: StockAdvanceData }) {
  const t = useT();
  const adv = t.stock.detail.advance;
  const left = data.dayBarLeftPct;
  const width = data.dayBarWidthPct;
  const right = left + width;

  return (
    <div className="relative h-[91px] w-full overflow-hidden rounded-lg border border-black/10 px-2">
      <p className="pt-[7px] text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{adv.daysRange}</p>
      <div className="mt-1 flex items-start gap-1">
        <div className="flex w-10 shrink-0 flex-col">
          <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{data.rangeLow}</span>
          <span className="text-xs leading-[20px] text-black/40">{adv.week52}</span>
        </div>
        <div className="relative mt-1.5 min-h-[40px] min-w-0 flex-1">
          <div className="h-2 overflow-hidden rounded-lg bg-[#f3f3f3]">
            <div
              className="h-full bg-brand-600"
              style={{ marginLeft: `${left}%`, width: `${width}%` }}
            />
          </div>
          <span
            className="absolute -top-3.5 text-micro leading-[18px] text-brand-600"
            style={{ left: `${right}%` }}
          >
            {data.dayMarkHigh}
          </span>
          <span
            className="absolute top-3 text-micro leading-[18px] text-brand-600"
            style={{ left: `${left}%` }}
          >
            {data.dayMarkLow}
          </span>
          <span
            className="absolute top-[5px] -translate-x-1/2 text-xs leading-[20px] text-black/40"
            style={{ left: `${left + width / 2}%` }}
          >
            1D
          </span>
          <span
            className="absolute top-[-3px] h-5 w-px bg-brand-600"
            style={{ left: `${left}%` }}
          />
          <span
            className="absolute top-[-3px] h-5 w-px bg-brand-600"
            style={{ left: `${right}%` }}
          />
        </div>
        <div className="flex w-10 shrink-0 flex-col items-end">
          <span className="text-xs leading-[20px] text-[rgba(0,0,0,0.75)]">{data.rangeHigh}</span>
          <span className="text-xs leading-[20px] text-black/40">{adv.week52}</span>
        </div>
      </div>
    </div>
  );
}

function AdvanceStatColumn({ rows }: { rows: StockAdvanceData["left"] }) {
  const t = useT();
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      {rows.map((row) => (
        <div
          key={row.key}
          className="flex w-full items-start justify-between border-b border-black/10 py-1.5 text-sm leading-[24px]"
        >
          <span className="text-black/40">{t.stock.detail.advance.stats[row.key] ?? row.key}</span>
          <span className="text-right text-[rgba(0,0,0,0.75)]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function StockAdvanceDataModal({
  data,
  onClose,
}: {
  data: StockAdvanceData;
  onClose: () => void;
}) {
  const t = useT();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-6 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal
        aria-labelledby="stock-advance-data-title"
        className="flex max-h-[calc(var(--vh)*90)] w-full max-w-[528px] flex-col items-center gap-6 overflow-y-auto rounded-3xl bg-white p-4"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex w-full flex-col gap-2">
          <h2
            id="stock-advance-data-title"
            className="text-lg leading-[28px] font-bold text-[rgba(0,0,0,0.85)]"
          >
            {t.stock.detail.advance.title}
          </h2>
          <div className="flex w-full flex-col gap-4">
            <DaysRangeMeter data={data} />
            <div className="flex w-full items-start gap-3 px-1">
              <AdvanceStatColumn rows={data.left} />
              <AdvanceStatColumn rows={data.right} />
            </div>
          </div>
        </div>
        <Button variant="primary" className="w-full max-w-[343px]" onClick={onClose}>
          {t.stock.detail.advance.close}
        </Button>
      </div>
    </div>
  );
}
