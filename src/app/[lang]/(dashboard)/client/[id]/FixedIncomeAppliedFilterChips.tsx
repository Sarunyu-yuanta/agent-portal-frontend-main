"use client";

import { XIcon } from "@phosphor-icons/react";
import type { FixedIncomeFilterChip } from "./fixed-income-data";
import { useT } from "@/i18n/I18nProvider";

function AppliedFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const t = useT();
  return (
    <div className="border-primary-action bg-primary-action inline-flex h-8 shrink-0 items-center gap-1 overflow-hidden rounded-full border pr-1.5 pl-3">
      <span className="text-on-primary-action text-sm leading-[24px] whitespace-nowrap">
        {label}
      </span>
      <button
        type="button"
        aria-label={t.products.common.removeFilter(label)}
        onClick={onRemove}
        className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0"
      >
        <XIcon size={14} className="text-on-primary-action" />
      </button>
    </div>
  );
}

type FixedIncomeAppliedFilterChipsProps = {
  chips: FixedIncomeFilterChip[];
  onRemoveChip: (chip: FixedIncomeFilterChip) => void;
  className?: string;
  innerClassName?: string;
  style?: React.CSSProperties;
  wrap?: boolean;
};

export function FixedIncomeAppliedFilterChips({
  chips,
  onRemoveChip,
  className,
  innerClassName,
  style,
  wrap = false,
}: FixedIncomeAppliedFilterChipsProps) {
  if (chips.length === 0) return null;

  const chipElements = chips.map((chip) => (
    <AppliedFilterChip key={chip.id} label={chip.label} onRemove={() => onRemoveChip(chip)} />
  ));

  if (wrap) {
    return (
      <div className={`w-full ${className ?? ""}`} style={style}>
        <div className={`flex flex-wrap items-center gap-2 ${innerClassName ?? ""}`}>
          {chipElements}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`hide-scrollbar overflow-x-auto ${className ?? "w-full"}`}
      style={{ scrollbarWidth: "none", ...style }}
    >
      <div className={`flex w-max flex-nowrap items-center gap-2 ${innerClassName ?? ""}`}>
        {chipElements}
      </div>
    </div>
  );
}
