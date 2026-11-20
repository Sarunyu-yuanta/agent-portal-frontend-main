"use client";

import { CaretDownIcon } from "@phosphor-icons/react";
import type {
  CouponFilter,
  MaturityFilter,
  TickerFilter,
  YieldFilter,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

/** The four dropdowns' options, labelled in the reader's language. */
export function globalBondFilterOptions(t: Dictionary) {
  const labels = t.products.globalBond.filter;
  const ticker: { id: TickerFilter; label: string }[] = [
    { id: "all", label: labels.allTickers },
    { id: "AAPL", label: "AAPL" },
    { id: "MSFT", label: "MSFT" },
    { id: "META", label: "META" },
    { id: "AMZN", label: "AMZN" },
  ];
  const coupon: { id: CouponFilter; label: string }[] = [
    { id: "all", label: labels.allCouponRates },
    { id: "lt2", label: "< 2%" },
    { id: "2-3", label: "2–3%" },
    { id: "3-4", label: "3–4%" },
    { id: "gt4", label: "> 4%" },
  ];
  const yieldOptions: { id: YieldFilter; label: string }[] = [
    { id: "all", label: labels.estimatedYield },
    { id: "lt2", label: "< 2%" },
    { id: "2-3", label: "2–3%" },
    { id: "3-4", label: "3–4%" },
    { id: "gt4", label: "> 4%" },
  ];
  const maturity: { id: MaturityFilter; label: string }[] = [
    { id: "all", label: labels.timeToMaturity },
    { id: "short", label: labels.short },
    { id: "long", label: labels.long },
  ];
  return { ticker, coupon, yield: yieldOptions, maturity };
}

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
      <div className="flex min-h-[32px] w-full items-center gap-1.5 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3 py-2">
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
  const t = useT();
  const options = globalBondFilterOptions(t);
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-[rgba(0,0,0,0.08)] bg-white p-3">
      <FilterDropdown value={tickerFilter} options={options.ticker} onChange={onTickerChange} />
      <FilterDropdown value={couponFilter} options={options.coupon} onChange={onCouponChange} />
      <FilterDropdown value={yieldFilter} options={options.yield} onChange={onYieldChange} />
      <FilterDropdown
        value={maturityFilter}
        options={options.maturity}
        onChange={onMaturityChange}
      />
      <button
        type="button"
        onClick={onClear}
        className="cursor-pointer self-start rounded-lg border border-[rgba(0,0,0,0.08)] bg-white px-3.5 py-2 text-sm leading-[26px] font-medium whitespace-nowrap text-[#0a6ee7]"
      >
        {t.products.common.clearAllSelection}
      </button>
    </div>
  );
}
