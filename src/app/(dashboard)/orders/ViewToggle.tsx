"use client";

/**
 * Card or table, as a segmented control.
 *
 * One track holding both options with the chosen one raised out of it, rather
 * than two loose buttons with the chosen one filled in. The difference matters
 * for what the control says about itself: a segmented control reads as "one of
 * these two", where a filled circle beside an empty one reads as a button that
 * happens to be on — and the second reading invites a click on something that
 * is already true.
 *
 * Icon-only. The two layouts are easier to recognise by shape than to tell
 * apart by name, and a label each would make this wider than the chip row it
 * shares a line with; the tooltip and `aria-label` carry the words.
 *
 * ── The `!`s ──────────────────────────────────────────────────────────────
 * The design system's stylesheet is unlayered, so its base utilities sit at our
 * specificity and win on source order — including over `hover:` (see
 * `card-class`, where the card's hover was silently dead). Every state here is
 * therefore marked, and verified with `getComputedStyle` rather than by reading
 * the class list back.
 */

import { Tooltip } from "@sarunyu/system-one";
import type { Icon } from "@phosphor-icons/react";

export type ViewOption = { id: string; label: string; Icon: Icon };

export function ViewToggle({
  options,
  value,
  onChange,
}: {
  options: ViewOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      role="group"
      className="inline-flex shrink-0 items-center gap-0.5 rounded-lg bg-[var(--fill-gray-100)] p-0.5"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <Tooltip key={option.id} content={option.label} side="top" delayDuration={400}>
            <button
              type="button"
              aria-pressed={selected}
              aria-label={option.label}
              onClick={() => onChange(option.id)}
              // `cursor-pointer` spelled out: a `<button>` gets the arrow, not
              // the hand, from the browser's own sheet — and Tailwind v4's
              // preflight no longer overrides it the way v3 did.
              className={`inline-flex h-7 w-9 cursor-pointer items-center justify-center rounded-[6px] transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] ${
                selected
                  ? // Raised out of the track: white, with the same hairline
                    // shadow the design system gives a resting card.
                    "bg-white! text-[#101828]! shadow-[0px_1px_2px_rgba(0,0,0,0.1)]!"
                  : "text-[#6a7282]! hover:text-[#101828]!"
              }`}
            >
              <option.Icon size={16} weight={selected ? "fill" : "regular"} />
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
