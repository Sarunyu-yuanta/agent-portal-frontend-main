"use client";

import { CircleNotchIcon } from "@phosphor-icons/react";
import { SearchInput } from "@sarunyu/system-one";

/**
 * A `SearchInput` paired with the spinner that marks "typed, not yet applied" —
 * i.e. `value` has moved on but the debounced value the list actually filters
 * on hasn't caught up yet.
 */
export function DebouncedSearchField({
  className,
  inputClassName,
  placeholder,
  value,
  debouncedValue,
  onChange,
  onClear,
}: {
  className: string;
  inputClassName?: string;
  placeholder: string;
  value: string;
  debouncedValue: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="min-w-0 flex-1">
        <SearchInput
          size="sm"
          className={inputClassName}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onClear={onClear}
        />
      </div>
      {value !== debouncedValue && (
        <CircleNotchIcon size={16} className="shrink-0 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
