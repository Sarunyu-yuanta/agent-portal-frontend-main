"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import type { FilterChipOption } from "./stock-data";
import { useT } from "@/i18n/I18nProvider";

function FilterChip({
  option,
  selected,
  onToggle,
}: {
  option: FilterChipOption;
  selected: boolean;
  onToggle: () => void;
}) {
  // Colors are classes rather than inline `style` so they can carry `hover:`
  // variants — an inline style wins over any stylesheet rule, hover included.
  // Trailing `!` because system-one ships its base utilities unlayered, where
  // they outrank a plain `hover:` variant.
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-full border py-2 pr-3 pl-2 text-sm transition-colors ${
        selected
          ? "border-[#0a6ee7] bg-[#f3f8fe] text-[#0a6ee7] hover:bg-[#e4eefb]!"
          : "border-black/10 bg-white text-[#4a5565] hover:border-[#0a6ee7]/40! hover:bg-[#f9fafb]!"
      }`}
    >
      <span className="relative size-6 shrink-0 overflow-hidden rounded-full bg-[#f3f4f6]">
        <Image src={option.icon} alt="" fill sizes="24px" className="object-cover" />
      </span>
      <span className="truncate">{option.label}</span>
    </button>
  );
}

/**
 * Figma "Modal/filer_Market" (node 23051:51385) — the Issuer / Region+Country
 * filter sheet opened from the DR and ETF detail pages' "Filter" button.
 * The caller only mounts this while open (`{filterOpen && <...>}`), so each
 * open is a fresh mount that seeds its draft straight from the page's
 * last-confirmed selection — the X / backdrop can then discard in-progress
 * changes just by unmounting, and Clear All only resets the draft.
 *
 * This is a faithful, fully interactive recreation of the Figma control —
 * the DR/ETF asset cards it filters carry no issuer/country field yet, so
 * selecting chips here doesn't (yet) narrow the list below.
 */
export function StockCrossSellFilterModal({
  showIssuerFilter,
  issuers,
  countries,
  initialIssuerIds,
  initialCountryIds,
  onClose,
  onConfirm,
}: {
  showIssuerFilter: boolean;
  issuers: FilterChipOption[];
  countries: FilterChipOption[];
  initialIssuerIds: string[];
  initialCountryIds: string[];
  onClose: () => void;
  onConfirm: (issuerIds: string[], countryIds: string[]) => void;
}) {
  const t = useT();
  const [draftIssuers, setDraftIssuers] = useState<Set<string>>(() => new Set(initialIssuerIds));
  const [draftCountries, setDraftCountries] = useState<Set<string>>(
    () => new Set(initialCountryIds),
  );

  const toggle = (set: Set<string>, setSet: (next: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  };

  const count = draftIssuers.size + draftCountries.size;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      style={{ backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-[614px] flex-col gap-6 rounded-3xl bg-white p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.stock.crossSell.close}
          className="absolute top-3 right-3 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/40!"
        >
          <XIcon size={14} weight="bold" />
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FunnelSimpleIcon size={20} style={{ color: "#101828" }} />
            <p className="text-lg font-bold" style={{ color: "#101828" }}>
              {t.stock.crossSell.filterTitle(count)}
            </p>
          </div>

          {showIssuerFilter && (
            <div className="flex flex-col gap-4">
              <p className="text-base font-bold" style={{ color: "#101828" }}>
                {t.stock.crossSell.issuer}
              </p>
              <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                {issuers.map((opt) => (
                  <FilterChip
                    key={opt.id}
                    option={opt}
                    selected={draftIssuers.has(opt.id)}
                    onToggle={() => toggle(draftIssuers, setDraftIssuers, opt.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <p className="text-base font-bold" style={{ color: "#101828" }}>
              {t.stock.crossSell.region}
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {countries.map((opt) => (
                <FilterChip
                  key={opt.id}
                  option={{ ...opt, label: t.stock.crossSell.countries[opt.id] ?? opt.label }}
                  selected={draftCountries.has(opt.id)}
                  onToggle={() => toggle(draftCountries, setDraftCountries, opt.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setDraftIssuers(new Set());
              setDraftCountries(new Set());
            }}
          >
            {t.stock.crossSell.clearAll}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onConfirm([...draftIssuers], [...draftCountries])}
          >
            {t.stock.crossSell.confirm}
          </Button>
        </div>
      </div>
    </div>
  );
}
