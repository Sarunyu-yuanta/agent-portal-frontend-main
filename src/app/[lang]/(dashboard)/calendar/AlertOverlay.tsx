"use client";

import { useState } from "react";
import { BottomSheet } from "@sarunyu/system-one";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AlertDetail } from "./AlertDetail";
import { CorporateActionDetailModal } from "./CorporateActionDetailModal";
import type { DayItem } from "./day-items";

/** An item plus the day it was read off — a `DayItem` carries no date of its
 * own, it is only ever pulled out of a map keyed by one. */
export type AlertTarget = { item: DayItem; day: Date };

/**
 * What a day item that isn't a note opens into, and the shell around it.
 *
 * Its own component because four places open these now — the Calendar grid, a
 * client's Reminders tab, their Overview card and the header bell — and the
 * last time a piece of this was written out twice, the two copies drifted (the
 * source badge stayed green in one after the other turned orange). One
 * definition, so there is nothing to keep in step.
 *
 * ## Two destinations, decided here
 *
 * - A **corporate action** opens the exchange's record sheet: the X-date, the
 *   dividend per share, the payment date. No holders — it is a fact about a
 *   company, and the desk's interest in who holds the symbol is what decided
 *   whether to raise it at all, not part of the record. Same dialog the Company
 *   Events tab on a stock opens, so one action reads identically wherever it is
 *   reached from.
 * - **Anything else** — a seminar, a campaign — opens `AlertDetail`: a sheet on
 *   a phone, a centred panel on a pointer device, with the clients it concerns
 *   spelled out. There the list is the point; "who is this for" is the question
 *   you open a desk event to answer.
 *
 * Deciding it here rather than at each call site is what keeps the four
 * surfaces honest: they all hand over a `DayItem` and get whichever surface
 * that item deserves.
 */
export function AlertOverlay({
  target,
  clients,
  onClose,
  showHolders = true,
}: {
  /** `null` closes it. The panel keeps drawing the last one while it leaves. */
  target: AlertTarget | null;
  clients: { id: string; name: string }[];
  onClose: () => void;
  /** Passed through to `AlertDetail` — off inside one client's own profile. */
  showHolders?: boolean;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const record = target && target.item.source === "corporate-action" ? target.item : null;

  /**
   * The item `AlertDetail` is *drawing*, which lags `target` by one slide.
   *
   * vaul keeps the sheet mounted while it animates out, so a panel rendered
   * straight off `target` would empty the moment you dismissed it and leave a
   * blank card sliding down. Same split, and the same reason, as `shown` inside
   * `AlertDetail`.
   *
   * Corporate actions never enter it. They don't use this panel at all, and
   * letting one in would mean the sheet spent its closing animation drawing a
   * row that had never been in it.
   */
  const [shown, setShown] = useState<AlertTarget | null>(null);
  if (target && target !== shown && !record) setShown(target);

  /** The record sheet has no exit animation to protect, so it is driven
   *  straight off `target` and simply unmounts. */
  const recordSheet = record && (
    <CorporateActionDetailModal
      kind={record.kind}
      symbol={record.symbol}
      companyName={record.symbolName || record.symbol}
      rows={record.facts}
      onClose={onClose}
    />
  );

  if (isMobile) {
    return (
      <>
        {recordSheet}
        {/* Mounted whenever the viewport is a phone rather than only while open
            — see `DayCell`. `px-0` so the provenance band and the row hovers
            reach the edges; the sheet's own `pb-6` stays, since this panel ends
            on a list and has no bottom padding of its own. `overflow-hidden`
            because it opens on a tinted band, whose square corners would
            otherwise sit proud of the sheet's rounded top. */}
        <BottomSheet
          open={target !== null && !record}
          onOpenChange={(next) => {
            if (!next) onClose();
          }}
          showHeader={false}
          title={shown?.item.title ?? "Alert"}
          className="px-0 overflow-hidden"
          contentClassName="pt-0"
        >
          {shown && (
            <AlertDetail
              item={shown.item}
              day={shown.day}
              clients={clients}
              variant="sheet"
              showHolders={showHolders}
              onClose={onClose}
            />
          )}
        </BottomSheet>
      </>
    );
  }

  if (recordSheet) return recordSheet;
  if (!target) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* `role`/`aria-modal` to match what `BottomSheet` already declares on the
          phone side — the same panel shouldn't be a dialog on one device and an
          anonymous div on the other. */}
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[calc(var(--vh)*75)] w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      >
        <AlertDetail
          item={target.item}
          day={target.day}
          clients={clients}
          showHolders={showHolders}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
