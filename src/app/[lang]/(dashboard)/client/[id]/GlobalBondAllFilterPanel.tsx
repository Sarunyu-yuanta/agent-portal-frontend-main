"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import type {
  CouponFilter,
  MaturityFilter,
  TickerFilter,
  YieldFilter,
} from "./global-bond-data";

export const TICKER_OPTIONS: { id: TickerFilter; label: string }[] = [
  { id: "all", label: "All Ticker" },
  { id: "AAPL", label: "AAPL" },
  { id: "MSFT", label: "MSFT" },
  { id: "META", label: "META" },
  { id: "AMZN", label: "AMZN" },
];

export const COUPON_OPTIONS: { id: CouponFilter; label: string }[] = [
  { id: "all", label: "All Coupon Rate" },
  { id: "lt2", label: "< 2%" },
  { id: "2-3", label: "2–3%" },
  { id: "3-4", label: "3–4%" },
  { id: "gt4", label: "> 4%" },
];

export const YIELD_OPTIONS: { id: YieldFilter; label: string }[] = [
  { id: "all", label: "ผลตอบแทนโดยประมาณ" },
  { id: "lt2", label: "< 2%" },
  { id: "2-3", label: "2–3%" },
  { id: "3-4", label: "3–4%" },
  { id: "gt4", label: "> 4%" },
];

export const MATURITY_OPTIONS: { id: MaturityFilter; label: string }[] = [
  { id: "all", label: "ระยะเวลาครบกำหนด" },
  { id: "short", label: "ระยะสั้น (≤3 ปี)" },
  { id: "long", label: "ระยะยาว (> 3ปี)" },
];

export function FilterDropdown<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (id: T) => void;
}) {
  const selected = options.find((o) => o.id === value) ?? options[0];
  const isPlaceholder = value === "all";

  return (
    <div className="relative flex min-w-0 flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={selected.label}
        className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="flex w-full min-h-[32px] items-center gap-1.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2">
        <span
          className={`min-w-0 flex-1 truncate text-sm leading-[26px] ${
            isPlaceholder ? "text-[rgba(0,0,0,0.3)]" : "text-[#101828]"
          }`}
        >
          {selected.label}
        </span>
        <CaretDownIcon size={20} className="shrink-0 text-[#101828]" />
      </div>
    </div>
  );
}

export function GlobalBondAllFilterPanel({
  tickerFilter,
  couponFilter,
  yieldFilter,
  maturityFilter,
  onTickerChange,
  onCouponChange,
  onYieldChange,
  onMaturityChange,
  onClear,
}: {
  tickerFilter: TickerFilter;
  couponFilter: CouponFilter;
  yieldFilter: YieldFilter;
  maturityFilter: MaturityFilter;
  onTickerChange: (id: TickerFilter) => void;
  onCouponChange: (id: CouponFilter) => void;
  onYieldChange: (id: YieldFilter) => void;
  onMaturityChange: (id: MaturityFilter) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-3">
      <FilterDropdown value={tickerFilter} options={TICKER_OPTIONS} onChange={onTickerChange} />
      <FilterDropdown value={couponFilter} options={COUPON_OPTIONS} onChange={onCouponChange} />
      <FilterDropdown value={yieldFilter} options={YIELD_OPTIONS} onChange={onYieldChange} />
      <FilterDropdown value={maturityFilter} options={MATURITY_OPTIONS} onChange={onMaturityChange} />
      <button
        type="button"
        onClick={onClear}
        className="self-start cursor-pointer rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2 text-sm font-medium leading-[26px] text-[#0a6ee7] whitespace-nowrap"
      >
        ล้างตัวเลือกทั้งหมด
      </button>
    </div>
  );
}
