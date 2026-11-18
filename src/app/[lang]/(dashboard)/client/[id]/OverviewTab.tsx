"use client";

import { useMemo, useState } from "react";
import { Card, Button } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { ReminderPreviewRow, RemindersPreviewEmpty } from "../../calendar/reminder-preview";
import { useClients } from "@/hooks/use-api";
import { useStickyRailTop } from "@/hooks/use-sticky-rail";
import {
  NBA_MESSAGE_CLIENT,
  NbaComingSoonCard,
} from "../../command-center/NbaComingSoonCard";
import { useNbaRows } from "../../command-center/use-nba-rows";
import { useNotes } from "@/contexts/notes-context";
import { REMINDERS_ENABLED } from "@/lib/feature-flags";
import { dayFromKey, dayOffset, todayDateKey } from "../../calendar/calendar-grid";
import { groupDayItems, type DayItem } from "../../calendar/day-items";
import { useDayItemModals } from "../../calendar/use-day-item-modals";
import { CurrentAllocationSection, TopHoldingsSection } from "./ClientSections";
import type { SortDir, HoldingsSortKey } from "./client-detail-data";
import type { ClientDetail } from "@/types/domain";

/** How far out the Reminders card looks — past this, a reminder only shows
 *  up once you open the full Reminders tab. */
const REMINDER_WINDOW_DAYS = 15;

/**
 * How many entries the Recent Activity card shows before "ดูทั้งหมด" is the
 * only way to see the rest. Every client in the mock data happens to have
 * exactly this many, so the card looks unchanged today — the cap is what keeps
 * it from growing without bound once the real feed has a client's whole
 * history in it.
 */
const RECENT_ACTIVITY_PREVIEW = 4;

/** The dot-and-line activity list, shared by the card and its "see all" modal. */
function ActivityTimeline({ items }: { items: ClientDetail["recentActivity"] }) {
  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0 w-3">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ${item.dotColor}`} />
            {i < items.length - 1 && <div className="w-px flex-1 bg-border my-1.5" />}
          </div>
          <div className={`flex flex-col gap-0.5 ${i < items.length - 1 ? "pb-5" : ""}`}>
            <p className="type-subtitle-2 text-foreground leading-snug">{item.label}</p>
            <p className="type-body-2 text-muted-foreground leading-snug">{item.description}</p>
            <p className="type-caption text-muted-foreground mt-0.5">{item.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OverviewTab({
  clientId,
  detail,
  holdingsSortKey,
  holdingsSortDir,
  onSort,
  onViewAllHoldings,
  onViewReminders,
}: {
  clientId: string;
  detail: ClientDetail;
  holdingsSortKey: HoldingsSortKey;
  holdingsSortDir: SortDir;
  onSort: (key: "value" | "pnlPct" | "pct", dir: SortDir) => void;
  onViewAllHoldings?: () => void;
  onViewReminders?: () => void;
}) {
  const clients = useClients();
  const { notes } = useNotes();
  /** This client's slice of the Dashboard's list — same ranking, same
   *  dismissals. `dismiss` is unused: the card below is behind a blur and
   *  cannot be clicked, so there is nothing to write back. */
  const { rows: clientNbaRows } = useNbaRows(clientId);

  // `assetSummary.allocationSlices` only exists in the mock data for one
  // client — everyone else has it as `undefined`, and the old `?? []`
  // fallback rendered a chart with nothing in it rather than an actual
  // fallback. `allocationData` is a required field every client's record
  // does carry, so that's what a missing `allocationSlices` falls back to.
  const allocationSlices =
    detail.assetSummary?.allocationSlices ??
    detail.allocationData.map((s) => ({ label: s.name, percent: s.value }));

  const [activityModalOpen, setActivityModalOpen] = useState(false);

  // `todayKey` rather than the `Date`: a fresh object every render would make
  // the memo useless, and only the day is what either source is measured
  // against. Same trick `ClientRemindersTab` uses.
  const todayKey = todayDateKey();

  // Sourced from `groupDayItems`, not `notes` directly — the client's own
  // notes aren't the only thing with a date attached. A dividend ex-date the
  // backend raised is a reminder just as much as one the desk wrote, and
  // filtering `notes` alone silently dropped every one of those from this
  // card even though the full Reminders tab already shows them.
  const upcomingReminders = useMemo(() => {
    const today = new Date(todayKey);
    const map = groupDayItems(notes, today, clientId);
    const items: { item: DayItem; day: Date; daysUntil: number }[] = [];
    for (const [key, dayItems] of map) {
      const day = dayFromKey(key);
      const daysUntil = dayOffset(day, today);
      // Due today counts as "upcoming" too (`daysUntil === 0`); anything
      // already overdue is what the full Reminders tab is for, not this card.
      if (daysUntil < 0 || daysUntil > REMINDER_WINDOW_DAYS) continue;
      for (const item of dayItems) {
        if (item.done) continue;
        items.push({ item, day, daysUntil });
      }
    }
    items.sort((a, b) => a.day.getTime() - b.day.getTime());
    return items.slice(0, 3);
  }, [notes, clientId, todayKey]);

  // Opens the reminder's own note in place — see `useDayItemModals` — rather
  // than only handing off to the Reminders tab, which is all `onViewReminders`
  // can do since it doesn't know which row was clicked. A system-raised item
  // (no note behind it) opens the same read-only panel the Reminders tab and
  // the Calendar both use. No holder list: this whole page is one client, so
  // the panel would be listing the person whose profile you are standing in
  // — see `AlertDetail`.
  /**
   * Same treatment as the Dashboard's rail: the work column runs much longer
   * than this one, so left alone it scrolls away and leaves a tall empty
   * gutter. The hook clamps to the rail's own laid-out top, which on this page
   * is below the sticky identity bar — so it pins there rather than sliding
   * behind it, without either side having to know the other exists.
   *
   * `lg:items-start` on the row below is what makes this work at all: a flex
   * item stretches to the row's height by default, and an item as tall as its
   * own track has nowhere to stick to.
   */
  const { railRef, railTop } = useStickyRailTop<HTMLDivElement>();

  const { open: openReminder, modals: reminderModals } = useDayItemModals({
    clients,
    pinnedClientId: clientId,
    showHolders: false,
  });

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start pt-8">

      {/* ── Left column (main) ── */}
      <div className="flex-[3] min-w-0 flex flex-col gap-6">

        {/* What to do about this client, before what they hold. The Dashboard
            answers "which client first"; standing on one profile that question
            is already settled, so the card leads with the move rather than the
            balances the identity bar above has just given. */}
        <NbaComingSoonCard rows={clientNbaRows} message={NBA_MESSAGE_CLIENT} />

        {/* Current Allocation */}
        <Card variant="default">
          <div className="flex flex-col gap-4">
            <h6 className="type-h6 text-foreground">Current Allocation</h6>
            <CurrentAllocationSection slices={allocationSlices} />
          </div>
        </Card>

        {/* Top Holdings */}
        <Card variant="default">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h6 className="type-h6 text-foreground">Top Holdings</h6>
              <Button variant="plain" size="sm" onClick={onViewAllHoldings}>ดูทั้งหมด</Button>
            </div>
            <TopHoldingsSection
              holdings={detail.topHoldings}
              sortKey={holdingsSortKey}
              sortDir={holdingsSortDir}
              onSort={onSort}
            />
          </div>
        </Card>

      </div>{/* end left column */}

      {/* ── Right column (sidebar) ── */}
      <div
        ref={railRef}
        style={{ top: railTop }}
        className="flex-[2] min-w-0 flex flex-col gap-5 lg:sticky"
      >

        {/* Reminders — out of the current delivery phase (see
            `lib/feature-flags`). Hiding the card rather than letting it render
            its empty state: "No reminders yet" invites the user to go and set
            one, and the surface that would take them there isn't shipping. */}
        {REMINDERS_ENABLED && (
        <Card variant="default">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h6 className="type-h6 text-foreground">Reminders</h6>
              {upcomingReminders.length > 0 && (
                <Button variant="plain" size="sm" onClick={onViewReminders}>View all</Button>
              )}
            </div>
            {upcomingReminders.length === 0 ? (
              <RemindersPreviewEmpty />
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingReminders.map(({ item, day, daysUntil }) => (
                  // Only two states ever reach this card: everything overdue
                  // or done was already filtered out above, so "today" is the
                  // one date that needs to say more than just the date.
                  <ReminderPreviewRow
                    key={item.id}
                    title={item.title}
                    dayIso={day.toISOString()}
                    dueToday={daysUntil === 0}
                    onClick={() => openReminder(item, day)}
                  />
                ))}
              </div>
            )}
          </div>
        </Card>
        )}

        {/* Recent Activity */}
        <Card variant="default">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h6 className="type-h6 text-foreground">Recent Activity</h6>
              <Button variant="plain" size="sm" onClick={() => setActivityModalOpen(true)}>
                ดูทั้งหมด
              </Button>
            </div>
            <ActivityTimeline items={detail.recentActivity.slice(0, RECENT_ACTIVITY_PREVIEW)} />
          </div>
        </Card>

      </div>{/* end right column */}

    </div>

    {REMINDERS_ENABLED && reminderModals}

    <ResponsiveBottomSheetModal
      open={activityModalOpen}
      onClose={() => setActivityModalOpen(false)}
      title="Recent Activity"
      titleId="client-activity-modal-title"
    >
      {/* The timeline scrolls inside the modal rather than the modal growing:
          a client's full history is unbounded, and the sheet already caps its
          own height on both mobile and desktop. */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <ActivityTimeline items={detail.recentActivity} />
      </div>
    </ResponsiveBottomSheetModal>
    </>
  );
}
