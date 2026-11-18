"use client";

import { Chip } from "@sarunyu/system-one";

/** One axis of the filter dialog: "ทั้งหมด" and its options, single choice. */
export function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label font-semibold text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Chip
          label="ทั้งหมด"
          type="single"
          selected={value === null}
          onClick={() => onChange(null)}
        />
        {options.map((o) => (
          <Chip
            key={o.value}
            label={o.label}
            type="single"
            selected={value === o.value}
            onClick={() => onChange(value === o.value ? null : o.value)}
          />
        ))}
      </div>
    </div>
  );
}
