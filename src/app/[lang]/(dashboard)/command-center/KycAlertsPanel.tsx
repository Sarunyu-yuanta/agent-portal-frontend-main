"use client";

import { useState } from "react";
import {
  CaretRightIcon,
  IdentificationCardIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { SlideSteps } from "@/components/ui/slide-steps";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { HolderContact, HolderContactOverlay } from "../calendar/HolderContact";
import {
  kycCheckpointTextTone,
  kycCheckpointTone,
} from "../use-kyc-notification-feed";
import { CardCount, RowIcon } from "./CardHeader";
import { groupQueueByBucket, type QueueItem } from "./dashboard-data";

/**
 * Whose KYC is about to lapse.
 *
 * The page has carried this as a bare count for a while — a tile saying "3"
 * with no way to learn which three. A number is enough to feel behind and not
 * enough to act, which is the one thing a morning page should never be.
 *
 * The rows are not derived here. They are `buildQueue`'s KYC rows, the same
 * array the tile counts, filtered by source — so the tile and the list cannot
 * disagree about how many there are, because they are the same objects.
 *
 * Only KYC. The requirement says "KYC and renewal alerts", but no document,
 * suitability test or form in this codebase carries an expiry date — the only
 * "renewal" anywhere is one hard-coded Thai sentence in the Command Center. A
 * card that invented those dates would be reporting fiction as compliance, so
 * the second half waits for a feed that has it.
 */
export function KycAlertsPanel({
  rows,
  inlineDays,
  allOpen: allOpenProp,
  onAllOpenChange,
  showInline = true,
}: {
  rows: QueueItem[];
  /** Expiries this many days out or nearer get a row of their own; the rest are
   *  counted by {@link MoreRow}. See `KYC_INLINE_DAYS`. */
  inlineDays: number;
  /** Controlled open state — the stat tile opens the same sheet as {@link MoreRow}. */
  allOpen?: boolean;
  onAllOpenChange?: (open: boolean) => void;
  /** When false, only the sheet/contact overlays render — inline card hidden. */
  showInline?: boolean;
}) {
  const [allOpenInternal, setAllOpenInternal] = useState(false);
  const allOpen = allOpenProp ?? allOpenInternal;
  const setAllOpen = (open: boolean) => {
    onAllOpenChange?.(open);
    if (allOpenProp === undefined) setAllOpenInternal(open);
  };
  /** The client whose contact card is open. A row opens the person, not the
   *  record: the row already says what the deadline is, and what it does not
   *  say is how to reach them about it. The KYC tab is a button further on. */
  const [contact, setContact] = useState<{
    clientId: string;
    name: string;
  } | null>(null);

  /** A KYC row is always about exactly one client — `buildQueue` builds it from
   *  that client's own expiry — so the first id is the only id. */
  const openContact = (row: QueueItem) =>
    setContact({ clientId: row.clientIds[0], name: row.title });

  /**
   * The same drill-in, inside the "ดูทั้งหมด" sheet.
   *
   * Kept apart from `contact` above: that one is a panel of its own, opened from
   * a card row with nothing behind it. This is a second step *within* the sheet,
   * and Back has to land on the list exactly as it was.
   *
   * `sheetShown` lags `sheetContact` on purpose — both panes stay mounted so
   * they can slide past each other, so on the way back the contact pane still
   * needs someone to be about for the ~200ms it takes to leave. Same split
   * `AlertDetail` makes, which is where this whole track comes from.
   */
  const [sheetContact, setSheetContact] = useState<{
    clientId: string;
    name: string;
  } | null>(null);
  const [sheetShown, setSheetShown] = useState<{
    clientId: string;
    name: string;
  } | null>(null);
  const atSheetContact = sheetContact !== null;

  const openSheetContact = (row: QueueItem) => {
    const next = { clientId: row.clientIds[0], name: row.title };
    setSheetShown(next);
    setSheetContact(next);
  };
  const closeSheet = () => {
    setAllOpen(false);
    setSheetContact(null);
  };

  if (rows.length === 0) {
    if (!showInline) return null;
    return (
      <div className="flex flex-col gap-4">
        <Header count={0} />
        <EmptyState
          icon={
            <ShieldCheckIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title="ไม่มี KYC ใกล้หมดอายุ"
          body="ลูกค้าทุกรายมี KYC ที่ยังไม่เข้าช่วงเตือน"
        />
      </div>
    );
  }

  /**
   * The fortnight cut. A partition rather than a search, because `buildQueue`
   * has already ordered these by urgency: everything before the cut is inside
   * the window in the order it should be read, and the first row past it is the
   * nearest of the ones `MoreRow` speaks for.
   */
  const cut = rows.findIndex((row) => row.daysLeft > inlineDays);
  const visible = cut === -1 ? rows : rows.slice(0, cut);
  const hidden = cut === -1 ? [] : rows.slice(cut);

  return (
    <>
      {showInline ? (
        <div className="flex flex-col gap-4">
          <Header count={rows.length} />

          {/* One surface with rules inside, matching the Call Log card across the
              page: the border and fill belong to the list, a row only hovers. */}
          <div className="overflow-hidden rounded-xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
            {visible.map((row) => (
              <KycRow key={row.id} row={row} onOpen={() => openContact(row)} />
            ))}
            {hidden.length > 0 && (
              <MoreRow
                rows={hidden}
                sole={visible.length === 0}
                onOpen={() => setAllOpen(true)}
              />
            )}
          </div>
        </div>
      ) : null}

      {/* Buckets belong here, not in the card. Five rows under three headings in
          a ~350px rail is more chrome than content; a full-height sheet has the
          room the headings need — and it finally gives `groupQueueByBucket` the
          caller it was written for. */}
      <ResponsiveBottomSheetModal
        open={allOpen}
        onClose={closeSheet}
        title="KYC ใกล้หมดอายุ"
        titleId="dashboard-kyc-all"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          {/* A two-pane track rather than a second overlay: picking a name here
              is a drill-in, not a different surface, and Back has to land on the
              list exactly as it was. Lifted from `AlertDetail`, which does the
              same thing with the same `HolderContact` on the other side. */}
          <SlideSteps index={atSheetContact ? 1 : 0} className="relative">
            <div className="px-4 py-4">
              <div className="flex flex-col gap-5">
                {groupQueueByBucket(rows, new Date()).map((group) => (
                  <div key={group.bucket} className="flex flex-col gap-2">
                    <p className="type-caption font-semibold text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="overflow-hidden rounded-xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05]">
                      {group.items.map((row) => (
                        <KycRow
                          key={row.id}
                          row={row}
                          onOpen={() => openSheetContact(row)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="py-2">
              {sheetShown && (
                /* `variant="sheet"` even on a pointer device: it is what drops
                   the pane's own close button, and the modal this sits in
                   already has one. Two X's stacked in one corner is two
                   answers to the same question. */
                <HolderContact
                  clientId={sheetShown.clientId}
                  name={sheetShown.name}
                  variant="sheet"
                  onBack={() => setSheetContact(null)}
                  onClose={closeSheet}
                />
              )}
            </div>
          </SlideSteps>
        </div>
      </ResponsiveBottomSheetModal>

      {/* A sheet on a phone and a centred panel on a pointer device — the same
          split `AlertOverlay` makes, and for the same reason: a floating card
          is fine where there is room around it and wrong where there isn't.
          The desktop panel is portalled for the reason `ResponsiveBottomSheetModal`
          documents: this card lives in the sticky rail, and a sticky ancestor
          is a stacking context its `fixed` descendants cannot climb out of. */}
      {contact && (
        <HolderContactOverlay
          clientId={contact.clientId}
          name={contact.name}
          onClose={() => setContact(null)}
        />
      )}
    </>
  );
}

/**
 * Title and count, and no way out of the card.
 *
 * It carried a "ดูทั้งหมด" until the list grew its own last row, and the two
 * were one control twice: both opened the same sheet, and the link only ever
 * appeared when the list was cut short — which is exactly when that row appears
 * too. Never one without the other, never leading anywhere different.
 *
 * Of the two, the row is the one worth keeping. It says how many are behind it
 * and how close the nearest is, where the link said only that more existed, and
 * it sits where the reader runs out of list, which is where the question comes
 * up. The other cards in this rail keep their header links because theirs lead
 * somewhere no row of theirs does — the Calendar, the Call Log page.
 */
function Header({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-2">
      <h6 className="type-h6 text-foreground">KYC ใกล้หมดอายุ</h6>
      {count > 0 && <CardCount value={count} />}
    </div>
  );
}

/** The countdown, as the pill on the right of a row. Signed, because "เลยมา 10
 *  วัน" and "อีก 10 วัน" are opposite situations and a bare `10` is neither. */
export function countdownLabel(daysLeft: number): string {
  if (daysLeft === 0) return "วันนี้";
  if (daysLeft < 0) return `เลยมา ${Math.abs(daysLeft)} วัน`;
  return `อีก ${daysLeft} วัน`;
}

/**
 * The last row, when something is past the fortnight: what is behind the cut,
 * said in words rather than left to the count in the heading.
 *
 * A row rather than a link, and in the list rather than under it, because this
 * is where the reader arrives — they read down the names, reach the bottom, and
 * the question they have at that moment is "is that all?". The heading's count
 * answers it too, but from four inches away and before they had the question.
 *
 * It carries the nearest hidden deadline because that is what decides whether
 * to open it now. The rows are ordered by urgency, so the first one cut is the
 * most pressing of them — and by construction it is more than two weeks out,
 * which is the row's whole claim: nothing behind here needs today.
 *
 * `sole` is the quiet-month case, where every expiry in the book is past the
 * fortnight and this row is the only one in the list. "ดูอีก" presupposes names
 * above it to be *more* than, so with none it says "ดูทั้ง N รายการ" instead.
 *
 * One line, and no icon square. It had one, carrying the count — and a tinted
 * rounded square at the head of a row is precisely what a person's row wears
 * here, so the eye read it as a fourth client before it read the words. What
 * marks this row is that it is *unlike* the others: no face, no second line,
 * text starting where their faces start.
 *
 * A caret, not a countdown pill: every other row's right-hand side is a
 * deadline, and this row is a door. The deadline moves into the sentence
 * instead, in the same colour the pills above use — grey read as "nothing much
 * down here", which is a claim this row is not in a position to make. Against
 * today's data the two on show are ten days over and due today, and the first
 * one cut is due *tomorrow*. Urgency does not stop at the fold.
 */
function MoreRow({
  rows,
  sole,
  onOpen,
}: {
  rows: QueueItem[];
  sole: boolean;
  onOpen: () => void;
}) {
  const next = rows[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer items-center gap-2 p-3 text-left transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <p className="min-w-0 flex-1 truncate text-body-sm text-foreground">
        <span className="font-bold">
          {sole ? "ดูทั้ง" : "ดูอีก"} {rows.length} รายการ
        </span>
        <span className="text-muted-foreground"> · ใกล้สุด </span>
        <span
          className={`font-semibold ${kycCheckpointTextTone(next.daysLeft)}`}
        >
          {countdownLabel(next.daysLeft)}
        </span>
      </p>

      <CaretRightIcon
        size={16}
        className="shrink-0 text-[var(--text-default-placeholder)]"
      />
    </button>
  );
}

export function KycRow({
  row,
  onOpen,
  showBadge = true,
}: {
  row: QueueItem;
  onOpen: () => void;
  /** Off in the Reminders card — the card already says "วันนี้" once up top. */
  showBadge?: boolean;
}) {
  const tone = kycCheckpointTone(row.daysLeft);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <RowIcon tone={tone}>
        <IdentificationCardIcon size={18} weight="duotone" />
      </RowIcon>

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="truncate text-body font-bold text-foreground">
          {row.title}
        </p>
        <p className="truncate text-meta text-muted-foreground">
          {row.detail}
        </p>
      </div>

      {showBadge ? (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-meta font-semibold tabular-nums ${tone}`}
        >
          {countdownLabel(row.daysLeft)}
        </span>
      ) : null}
    </div>
  );
}
