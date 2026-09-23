"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import type { CorporateActionKind, CorporateCalendarMarker } from "./stock-company-data";

/**
 * The sheet's own tag palette (Figma node 24635:107155).
 *
 * XD is the one kind the design draws, and its green is a shade brighter than
 * the same action's pill in the grid — a tag on white at 14px carries a lighter
 * fill than a 9px chip on a calendar cell. The other two kinds have no sheet of
 * their own drawn yet, so they take their grid tints rather than a guess at what
 * the brighter version would be.
 */
const TAG_STYLE: Record<CorporateActionKind, { bg: string; text: string }> = {
  XD: { bg: "#effce1", text: "#47a240" },
  XT: { bg: "#fee6c9", text: "#8d3a01" },
  XW: { bg: "#ccecf7", text: "#006182" },
};

/**
 * A corporate action's full record — what a pill in the grid, or a card in a
 * day's panel, opens into.
 *
 * Rows arrive already grouped (see `CorporateCalendarMarker.detail`); a rule is
 * drawn between groups and never inside one, which is the whole of the
 * separator logic Figma shows.
 */
export function CorporateActionDetailModal({
  marker,
  symbol,
  companyName,
  onClose,
}: {
  marker: CorporateCalendarMarker;
  symbol: string;
  companyName: string;
  onClose: () => void;
}) {
  // Escape closes, as it does for every other dismissible layer in the app.
  // Bound on the document rather than the panel so it works before anything
  // inside has been focused.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const tag = TAG_STYLE[marker.kind];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 py-2.5 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${marker.kind} detail for ${symbol}`}
    >
      {/* Figma fixes the panel at 704px and lets it hug its content. `max-h` and
          the scrolling card below are this implementation's own: fourteen rows
          plus the chrome overruns a laptop viewport, and a dialog you cannot
          reach the Close button of is worse than one that scrolls. */}
      <div className="flex max-h-full w-full max-w-[704px] flex-col items-center gap-6 overflow-hidden rounded-3xl bg-card p-4">
        <div className="flex min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-[rgba(0,0,0,0.1)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-sm font-semibold leading-[1.5]"
              style={{ backgroundColor: tag.bg, color: tag.text }}
            >
              {marker.kind}
            </span>
            {/* One line, not a stack: the symbol is the reader's anchor and the
                legal name only confirms it, so they belong on the same baseline.
                It wraps rather than truncating — a half-shown company name on a
                record sheet is the kind of thing people screenshot. */}
            <p className="min-w-0 text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">
              {symbol} : {companyName}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-[#f9f9f9] p-4">
            {marker.detail.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-3">
                {/* The rule leads each group but the first, so it never trails
                    the last row with nothing under it. */}
                {groupIndex > 0 && (
                  <div className="py-1">
                    <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
                  </div>
                )}
                {group.map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="min-w-0 flex-1 text-sm leading-[1.5] text-[rgba(0,0,0,0.75)]">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-right text-sm font-semibold leading-[1.5] text-[rgba(0,0,0,0.85)]">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Figma's 343px, but capped at the panel: on a phone-width viewport a
            fixed 343 would push past the 16px gutter the overlay sets. */}
        <Button variant="primary" className="w-[343px] max-w-full shrink-0" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
