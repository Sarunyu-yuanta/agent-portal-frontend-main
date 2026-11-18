"use client";

import { XIcon } from "@phosphor-icons/react";
import type { FixedIncomeFilterChip } from "./fixed-income-data";

function AppliedFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="inline-flex h-8 shrink-0 items-center gap-1 overflow-hidden rounded-full border border-primary-action bg-primary-action pl-3 pr-1.5">
      <span className="whitespace-nowrap text-sm leading-[24px] text-on-primary-action">{label}</span>
      <button
        type="button"
        aria-label={`ลบ ${label}`}
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
    <AppliedFilterChip
      key={chip.id}
      label={chip.label}
      onRemove={() => onRemoveChip(chip)}
    />
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
      className={`overflow-x-auto hide-scrollbar ${className ?? "w-full"}`}
      style={{ scrollbarWidth: "none", ...style }}
    >
      <div className={`flex w-max flex-nowrap items-center gap-2 ${innerClassName ?? ""}`}>
        {chipElements}
      </div>
    </div>
  );
}
