"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowRightIcon, FileTextIcon } from "@phosphor-icons/react";
import { LocaleLink as Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import type { MarketFact } from "@/features/calendar/lib/market-feed";
import { actionKindName, actionKindTag, actionPalette } from "./market-taxonomy";
import { useT } from "@/i18n/I18nProvider";

/**
 * The sheet's own tag palette (Figma node 24635:107155).
 *
 * XD is the one kind the design draws, and its green is a shade brighter than
 * the same action's pill in a calendar grid — a tag on white at 14px carries a
 * lighter fill than a 9px chip on a day cell. Every other code falls through to
 * the shared resolver and takes its grid tint, which is both what the two kinds
 * beside XD were already doing and the only answer available for a code the
 * exchange adds tomorrow.
 */
const TAG_OVERRIDES: Record<string, { bg: string; text: string }> = {
  XD: { bg: "#effce1", text: "#47a240" },
};

function tagStyle(kind: string): { bg: string; text: string } {
  const override = TAG_OVERRIDES[kind];
  if (override) return override;
  const palette = actionPalette(kind);
  return { bg: palette.tint, text: palette.text };
}

/**
 * A corporate action's full record — what a pill in a month grid, or a chip in
 * a day's panel, opens into.
 *
 * Lives beside the Calendar rather than in the stock page that first drew it,
 * because both month grids reach it now: the Company Events tab on a stock and
 * the Calendar page itself. Its props are a record rather than that page's own
 * `CorporateCalendarMarker` for the same reason — two callers holding different
 * shapes, one dialog, and the dialog only ever needed four things.
 *
 * **No holders, deliberately.** A corporate action is a fact about a company.
 * The desk knows which clients hold the symbol (the feed carries them, see
 * `market-feed`) and uses it to decide whether to raise the action at all, but
 * a list of people has no place on the exchange's record of an event — the
 * question this sheet answers is "what exactly is happening to this security",
 * and every row in it is about the security.
 */
export function CorporateActionDetailModal({
  kind,
  symbol,
  companyName,
  rows,
  href,
  onClose,
}: {
  /** SET code — "XD", "XW", … Open-ended; see `market-taxonomy`. */
  kind: string;
  symbol: string;
  /** The issuer's legal name, printed beside the symbol. */
  companyName: string;
  /** Already grouped by the feed: a rule is drawn between groups and never
   *  inside one, which is the whole of the separator logic Figma shows. */
  rows: MarketFact[][];
  /** The product's page in the catalog — a bond, a note, a fund. Adds a link
   *  under the record; absent for a listed share's X-date. */
  href?: string | null;
  onClose: () => void;
}) {
  const t = useT();
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

  const tag = tagStyle(kind);
  const glyph = actionKindTag(kind);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 py-2.5 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={t.planner.calendar.alert.recordLabel(actionKindName(kind, t), symbol)}
    >
      {/* Figma fixes the panel at 704px and lets it hug its content. `max-h` and
          the scrolling card below are this implementation's own: fourteen rows
          plus the chrome overruns a laptop viewport, and a dialog you cannot
          reach the Close button of is worse than one that scrolls. */}
      <div className="flex max-h-full w-full max-w-[704px] flex-col items-center gap-6 overflow-hidden rounded-3xl bg-card p-4">
        <div className="flex min-h-0 w-full flex-col gap-4 overflow-y-auto rounded-2xl border border-black/10 p-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* A product event's tag spells its name out beside the glyph — a
                lone coin or flag would not say "coupon" or "maturity". */}
            <span
              className="flex items-center gap-1 rounded px-2 py-0.5 text-sm leading-[1.5] font-semibold [&>svg]:size-4"
              style={{ backgroundColor: tag.bg, color: tag.text }}
              title={actionKindName(kind, t)}
            >
              {glyph}
              {typeof glyph !== "string" && actionKindName(kind, t)}
            </span>
            {/* One line, not a stack: the symbol is the reader's anchor and the
                legal name only confirms it, so they belong on the same baseline.
                It wraps rather than truncating — a half-shown company name on a
                record sheet is the kind of thing people screenshot. */}
            <p className="min-w-0 text-sm leading-[24px] font-bold text-[rgba(0,0,0,0.85)]">
              {symbol} : {companyName}
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-[#f9f9f9] p-4">
            {rows.length === 0 && (
              <EmptyState
                size="compact"
                icon={
                  <FileTextIcon
                    size={32}
                    weight="duotone"
                    className="text-[var(--text-default-placeholder)]"
                  />
                }
                title={t.planner.calendar.alert.noDetails}
              />
            )}
            {rows.map((group, groupIndex) => (
              <div key={groupIndex} className="flex flex-col gap-3">
                {/* The rule leads each group but the first, so it never trails
                    the last row with nothing under it. */}
                {groupIndex > 0 && (
                  <div className="py-1">
                    <div className="h-px w-full bg-black/10" />
                  </div>
                )}
                {group.map((row) => (
                  <div key={row.label} className="flex items-center gap-4">
                    <span className="min-w-0 flex-1 text-sm leading-[1.5] text-[rgba(0,0,0,0.75)]">
                      {row.label}
                    </span>
                    <span className="shrink-0 text-right text-sm leading-[1.5] font-semibold text-[rgba(0,0,0,0.85)]">
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
        <div className="flex w-full flex-wrap justify-center gap-3">
          {href && (
            <Link href={href} className="w-[343px] max-w-full shrink-0" onClick={onClose}>
              <Button
                variant="outline"
                className="w-full"
                rightIcon={<ArrowRightIcon size={16} />}
                tabIndex={-1}
              >
                {t.planner.calendar.alert.viewProduct}
              </Button>
            </Link>
          )}
          <Button variant="primary" className="w-[343px] max-w-full shrink-0" onClick={onClose}>
            {t.common.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
