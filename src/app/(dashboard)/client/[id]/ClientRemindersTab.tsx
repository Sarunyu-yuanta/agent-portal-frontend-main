"use client";

import { useMemo } from "react";
import { CalendarBlankIcon, CalendarCheckIcon, CaretRightIcon } from "@phosphor-icons/react";
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from "@sarunyu/system-one";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { CompactList } from "@/components/ui/compact-list";
import { EmptyState } from "@/components/ui/empty-state";
import {
  dayFromKey,
  dayKey,
  dayLabel,
  dayOffset,
  dayRelation,
  relativeDayLabel,
  todayDateKey,
} from "../../calendar/calendar-grid";
import { groupDayItems, type DayItem } from "../../calendar/day-items";
import {
  bucketFor,
  bucketSortsDescending,
  BUCKET_TONE,
  REMINDER_BUCKETS,
  type ReminderBucket,
} from "../../calendar/reminder-buckets";
import { DONE_BADGE_TONE, SOURCE_BADGE, SourceBadgeIcon } from "../../calendar/source-badge";
import { useDayItemModals } from "../../calendar/use-day-item-modals";
import { formatDayOnly } from "../../notes/note-format";
import { snippet } from "../../notes/notes-grouping";

/**
 * What the desktop table's Status column reads off, in the order it matters
 * there. Not one flat chronological list: a reminder's date only means
 * something relative to today, and the thing that table opens to find out is
 * what has slipped — which a single run of dates ordered by day buries in the
 * middle.
 *
 * The buckets themselves, their order and their tones are shared with the
 * Dashboard's reminder list (`calendar/reminder-buckets`); only the English
 * wording below belongs to this tab.
 *
 * The card lists (mobile and the Client Hub's compact dialog) don't use the
 * buckets at all — see `daySections` below for why they're grouped by calendar
 * day instead.
 */
const BUCKET_LABEL: Record<ReminderBucket, string> = {
  overdue: "Overdue",
  today: "Today",
  upcoming: "Upcoming",
  done: "Done",
};

/** One row: an item, the day it was read off, which bucket it landed in, and
 *  that day's offset from today (negative = past) for the "in N days" line. */
type Row = { item: DayItem; day: Date; bucket: ReminderBucket; daysDiff: number };

/** One calendar day's worth of items, for the card lists. `isToday` is what
 *  lets the section render even when `items` is empty — every other day only
 *  exists here because `dayMap` already had something under it. */
type DaySection = { key: string; day: Date; isToday: boolean; items: DayItem[] };

/**
 * A client's reminders, on their own tab.
 *
 * The same rows the Calendar's day panel draws, for the same reason they look
 * that way there — but gathered by client instead of by day, and carrying both
 * sources: the reminders the user wrote on their own notes, and the alerts the
 * backend raised that name this client. Until now those two only met on the
 * Calendar, where finding one client's meant reading every day of the month.
 *
 * A note row opens `NoteEditModal` in place — the same editor `CalendarView`
 * opens its own note rows into — rather than hopping to the Notes tab, so
 * triaging reminders doesn't cost the place you were reading them from. An
 * alert row opens the read-only panel, since there is nothing on it for the
 * desk to edit.
 *
 * Two shapes off the same data: the desktop table keeps the bucket grouping
 * above (`rows`), each row still saying its own Overdue/Today/Upcoming/Done.
 * The card lists (mobile, and the Client Hub's compact dialog) are grouped by
 * calendar day instead (`daySections`) — a header per day rather than per
 * status, with Today pinned first and shown even when it's empty, so opening
 * the tab always answers "what's today" before anything else. Any other day
 * only appears because it already has something under it.
 */
export function ClientRemindersTab({
  clientId,
  compact = false,
  onViewAll,
}: {
  clientId: string;
  /**
   * Always the card list, never the table — for the Client Hub's quick-view
   * dialog, which sits at Call Log's width and reuses Call Log's own card
   * shape. `md:` there would still read the *page's* viewport, not the
   * dialog's, so the table would never actually give way on its own.
   */
  compact?: boolean;
  /**
   * "View all" for the compact list — the full Reminders tab, which is where
   * the cut-off past the scroll cap actually lives. Ignored outside `compact`:
   * the full table already *is* all of them.
   */
  onViewAll?: () => void;
}) {
  const clients = useClients();
  const { notes, isLoading } = useNotes();
  // No holder list: this whole page is one client, so the panel would be
  // listing the person whose profile you are standing in — see `AlertDetail`.
  const { open: openItem, modals: reminderModals } = useDayItemModals({
    clients,
    pinnedClientId: clientId,
    showHolders: false,
  });

  // `todayKey` rather than the `Date`: a fresh object every render would make
  // the memos useless, and only the day is what either source is measured
  // against. Same trick `CalendarView` uses.
  const todayKey = todayDateKey();

  // Computed once and read by both `rows` and `daySections` below — the two
  // are different regroupings of the same items, not two different fetches.
  const dayMap = useMemo(
    () => groupDayItems(notes, new Date(todayKey), clientId),
    [notes, clientId, todayKey],
  );

  const rows = useMemo(() => {
    const today = new Date(todayKey);
    const all: Row[] = [];
    for (const [key, items] of dayMap) {
      // `dayFromKey`, not `new Date(key)` — see the note on it. A key's month is
      // zero-based and the string parser isn't.
      const day = dayFromKey(key);
      const relation = dayRelation(day, today);
      const daysDiff = dayOffset(day, today);
      for (const item of items) {
        all.push({ item, day, bucket: bucketFor(item.done, relation), daysDiff });
      }
    }

    // Grouped bucket by bucket rather than one global sort, so the buckets keep
    // their order instead of interleaving by date. Which way each one sorts is
    // the bucket's own property — see `bucketSortsDescending`.
    return REMINDER_BUCKETS.flatMap((bucket) => {
      const group = all.filter((row) => row.bucket === bucket);
      group.sort((a, b) =>
        bucketSortsDescending(bucket)
          ? b.day.getTime() - a.day.getTime()
          : a.day.getTime() - b.day.getTime(),
      );
      return group;
    });
  }, [dayMap, todayKey]);

  const daySections = useMemo<DaySection[]>(() => {
    const today = new Date(todayKey);
    const todayKeyStr = dayKey(today);
    const keys = new Set(dayMap.keys());
    // Today's key goes in even when `dayMap` never got one — that's the whole
    // point of pinning it: an empty Today still has to render, with its own
    // empty state, rather than the day silently not showing up.
    keys.add(todayKeyStr);
    return [...keys]
      .sort((a, b) => dayFromKey(a).getTime() - dayFromKey(b).getTime())
      .map((key) => ({
        key,
        day: dayFromKey(key),
        isToday: key === todayKeyStr,
        items: dayMap.get(key) ?? [],
      }));
  }, [dayMap, todayKey]);

  if (isLoading) {
    return (
      <p className="type-body-2 text-muted-foreground text-center py-10">Loading reminders…</p>
    );
  }

  return (
    <>
      {compact ? (
        // ~4 cards' worth before it scrolls — enough to read as "here's what's
        // coming" without the dialog outgrowing the screen the way an
        // unbounded list would. Past that, View All is the way out rather
        // than more scrolling.
        <CompactList onViewAll={onViewAll} contentClassName="gap-4 max-h-[380px] overflow-y-auto pr-1 -mr-1">
          <DaySectionedList sections={daySections} onOpen={openItem} />
        </CompactList>
      ) : (
        <>
          {/* Mobile / tablet — day-sectioned cards */}
          <div className="md:hidden">
            <DaySectionedList sections={daySections} onOpen={openItem} />
          </div>

          {/* Desktop — table, still bucketed by status rather than by day: a
              Status column already says Overdue/Today/Upcoming/Done per row,
              so a day header above each group would be repeating the Date
              column rather than adding anything the table doesn't already say. */}
          <div className="hidden md:block">
            {rows.length === 0 ? (
              <EmptyState
                icon={<CalendarBlankIcon size={40} className="text-[var(--text-default-placeholder)]" />}
                title="No reminders"
                // Says where they come from, because there is nothing on this tab
                // that makes one — a reminder is an attribute of a note.
                body="Set one from a note on the Notes tab."
              />
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Status</TableHeaderCell>
                    <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Date</TableHeaderCell>
                    <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Source</TableHeaderCell>
                    <TableHeaderCell sortable={false} className="min-w-0">Reminder</TableHeaderCell>
                    <TableHeaderCell sortable={false} className="min-w-0">Detail</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <ReminderRow key={row.item.id} row={row} onOpen={() => openItem(row.item, row.day)} />
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </>
      )}

      {reminderModals}
    </>
  );
}

function DaySectionedList({
  sections,
  onOpen,
}: {
  sections: DaySection[];
  onOpen: (item: DayItem, day: Date) => void;
}) {
  return (
    <div className="flex flex-col gap-7">
      {sections.map((section) => (
        <div key={section.key} className="flex flex-col gap-2">
          <p className="type-subtitle-2 text-muted-foreground">
            {section.isToday ? "Today" : dayLabel(section.day)} · {section.items.length}
          </p>
          {section.items.length === 0 ? (
            // Only Today can ever land here — every other key in `daySections`
            // exists because `dayMap` already had at least one item under it.
            // The check mark rather than `CalendarBlankIcon` (the whole-page
            // empty state's icon): blank reads as "nothing has ever been set",
            // checked reads as "today specifically is clear" — the actual news
            // here, since other days already have things in them.
            <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border py-6 text-center">
              <CalendarCheckIcon size={22} className="text-muted-foreground/40" />
              <p className="type-body-2 text-muted-foreground/60">Nothing due today</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {section.items.map((item) => (
                <ReminderCard key={item.id} item={item} onOpen={() => onOpen(item, section.day)} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReminderCard({ item, onOpen }: { item: DayItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-start gap-3 rounded-xl border border-border p-3 text-left cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
    >
      {/* The circle carries where the row came from — primary for the user's
          own handwriting, orange for anything the system raised. Read from the
          shared lookup rather than restated here; a local copy is how the
          alert panel stayed green after the Calendar's pills turned orange. */}
      <SourceBadgeIcon item={item} size="default" label={item.source === "note" ? "Note" : "System"} />
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <span
          className={`type-body-2 font-semibold truncate ${
            item.done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {item.title}
        </span>
        <span className="type-caption text-muted-foreground truncate">
          {item.detail ? snippet(item.detail, 60) : "No additional text"}
        </span>
      </div>
      <CaretRightIcon size={14} className="shrink-0 self-center text-muted-foreground/60" />
    </button>
  );
}

function ReminderRow({ row, onOpen }: { row: Row; onOpen: () => void }) {
  const { item, day, bucket, daysDiff } = row;
  const badge = SOURCE_BADGE[item.source];

  return (
    <TableRow
      hoverable
      className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
      onClick={onOpen}
    >
      <TableCell className="min-w-0 whitespace-nowrap">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 type-caption font-medium ${BUCKET_TONE[bucket]}`}
        >
          {BUCKET_LABEL[bucket]}
        </span>
      </TableCell>

      <TableCell className="min-w-0 whitespace-nowrap">
        <div className="flex flex-col">
          <span className="type-body-2 text-foreground font-medium">{formatDayOnly(day.toISOString())}</span>
          <span className="type-caption text-muted-foreground">{relativeDayLabel(daysDiff)}</span>
        </div>
      </TableCell>

      <TableCell className="min-w-0 whitespace-nowrap">
        {/* Same lookup the Reminder cell's icon used to carry inline — now its
            own column, so "note" vs "system" reads as a fact about the row
            rather than something to infer from an icon shape. */}
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 type-caption font-medium ${
            item.done ? DONE_BADGE_TONE : badge.tone
          }`}
        >
          {badge.icon}
          {item.source === "note" ? "Note" : "System"}
        </span>
      </TableCell>

      <TableCell className="min-w-0">
        <span
          className={`type-body-2 font-medium ${
            item.done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {item.title}
        </span>
      </TableCell>

      <TableCell className="min-w-0">
        <span className="type-body-2 text-foreground">
          {item.detail ? snippet(item.detail, 60) : "No additional text"}
        </span>
      </TableCell>
    </TableRow>
  );
}
