"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import type { FilterChipOption } from "./stock-data";

function FilterChip({
  option,
  selected,
  onToggle,
}: {
  option: FilterChipOption;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className="flex w-full items-center gap-2 rounded-full border py-2 pl-2 pr-3 text-sm transition-colors"
      style={{
        backgroundColor: selected ? "#f3f8fe" : "#ffffff",
        borderColor: selected ? "#0a6ee7" : "rgba(0,0,0,0.1)",
        color: selected ? "#0a6ee7" : "#4a5565",
      }}
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
  const [draftIssuers, setDraftIssuers] = useState<Set<string>>(() => new Set(initialIssuerIds));
  const [draftCountries, setDraftCountries] = useState<Set<string>>(() => new Set(initialCountryIds));

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
          aria-label="Close"
          className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-black/20 text-white"
        >
          <XIcon size={14} weight="bold" />
        </button>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FunnelSimpleIcon size={20} style={{ color: "#101828" }} />
            <p className="font-bold text-lg" style={{ color: "#101828" }}>
              Filter ({count})
            </p>
          </div>

          {showIssuerFilter && (
            <div className="flex flex-col gap-4">
              <p className="font-bold text-base" style={{ color: "#101828" }}>
                Issuer
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
            <p className="font-bold text-base" style={{ color: "#101828" }}>
              Region / Country
            </p>
            <div className="grid grid-cols-3 gap-x-4 gap-y-3">
              {countries.map((opt) => (
                <FilterChip
                  key={opt.id}
                  option={opt}
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
            Clear All
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => onConfirm([...draftIssuers], [...draftCountries])}
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
