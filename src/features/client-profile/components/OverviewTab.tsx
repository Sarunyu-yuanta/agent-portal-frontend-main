"use client";

import { useMemo, useState } from "react";
import { Card, Button } from "@sarunyu/system-one";
import { ClockCounterClockwiseIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ui/responsive-bottom-sheet-modal";
import {
  ReminderPreviewRow,
  RemindersPreviewEmpty,
} from "@/features/calendar/components/reminder-preview";
import { useClients } from "@/hooks/use-api";
import { useStickyRailTop } from "@/hooks/use-sticky-rail";
import {
  NBA_MESSAGE_CLIENT,
  NbaComingSoonCard,
} from "@/features/command-center/components/NbaComingSoonCard";
import { useNbaRows } from "@/features/command-center/hooks/use-nba-rows";
import { useNotes } from "@/features/notes/store/notes-context";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { REMINDERS_ENABLED } from "@/config/feature-flags";
import { dayFromKey, dayOffset, todayDateKey } from "@/features/calendar/lib/calendar-grid";
import { groupDayItems, type DayItem } from "@/features/calendar/lib/day-items";
import { useDayItemModals } from "@/features/calendar/hooks/use-day-item-modals";
import { CurrentAllocationSection, TopHoldingsSection } from "./ClientSections";
import type { HoldingsSortKey } from "@/features/client-profile/lib/client-detail-data";
import { useT } from "@/i18n/I18nProvider";
import type { ClientDetail } from "@/types/client";
import type { SortDir } from "@/types/table";

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
          <div className="flex w-3 shrink-0 flex-col items-center">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.dotColor}`} />
            {i < items.length - 1 && <div className="my-1.5 w-px flex-1 bg-border" />}
          </div>
          <div className={`flex flex-col gap-0.5 ${i < items.length - 1 ? "pb-5" : ""}`}>
            <p className="type-subtitle-2 leading-snug text-foreground">{item.label}</p>
            <p className="type-body-2 leading-snug text-muted-foreground">{item.description}</p>
            <p className="type-caption mt-0.5 text-muted-foreground">{item.date}</p>
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
  /** `undefined` when the client has no detail record; sections show empty states. */
  detail: ClientDetail | undefined;
  holdingsSortKey: HoldingsSortKey;
  holdingsSortDir: SortDir;
  onSort: (key: "value" | "pnlPct" | "pct", dir: SortDir) => void;
  onViewAllHoldings?: () => void;
  onViewReminders?: () => void;
}) {
  const t = useT();
  const clients = useClients();
  const { notes, isLoading: notesLoading, error: notesError, retry: retryNotes } = useNotes();
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
    detail?.assetSummary?.allocationSlices ??
    (detail?.allocationData ?? []).map((s) => ({ label: s.name, percent: s.value }));

  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const topHoldings = detail?.topHoldings ?? [];
  const recentActivity = detail?.recentActivity ?? [];

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
    const map = groupDayItems(notes, today, t, clientId);
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
  }, [notes, clientId, todayKey, t]);

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
      <div className="flex flex-col gap-6 pt-8 lg:flex-row lg:items-start lg:gap-8">
        {/* ── Left column (main) ── */}
        <div className="flex min-w-0 flex-[3] flex-col gap-6">
          {/* What to do about this client, before what they hold. The Dashboard
            answers "which client first"; standing on one profile that question
            is already settled, so the card leads with the move rather than the
            balances the identity bar above has just given. */}
          <NbaComingSoonCard rows={clientNbaRows} message={NBA_MESSAGE_CLIENT} />

          {/* Current Allocation */}
          <Card variant="default">
            <div className="flex flex-col gap-4">
              <h6 className="type-h6 text-foreground">{t.client.overview.currentAllocation}</h6>
              <CurrentAllocationSection slices={allocationSlices} />
            </div>
          </Card>

          {/* Top Holdings */}
          <Card variant="default">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h6 className="type-h6 text-foreground">{t.client.overview.topHoldings}</h6>
                {topHoldings.length > 0 && (
                  <Button variant="plain" size="sm" onClick={onViewAllHoldings}>
                    {t.client.overview.viewAll}
                  </Button>
                )}
              </div>
              <TopHoldingsSection
                holdings={topHoldings}
                sortKey={holdingsSortKey}
                sortDir={holdingsSortDir}
                onSort={onSort}
              />
            </div>
          </Card>
        </div>
        {/* end left column */}

        {/* ── Right column (sidebar) ── */}
        <div
          ref={railRef}
          style={{ top: railTop }}
          className="flex min-w-0 flex-[2] flex-col gap-5 lg:sticky"
        >
          {/* Reminders — out of the current delivery phase (see
            `lib/feature-flags`). Hiding the card rather than letting it render
            its empty state: "No reminders yet" invites the user to go and set
            one, and the surface that would take them there isn't shipping. */}
          {REMINDERS_ENABLED && (
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <h6 className="type-h6 text-foreground">{t.client.tabs.reminders}</h6>
                  {upcomingReminders.length > 0 && (
                    <Button variant="plain" size="sm" onClick={onViewReminders}>
                      {t.client.overview.viewAll}
                    </Button>
                  )}
                </div>
                {/* Loading and error before "none": an empty card while the notes
                are still coming would claim there is nothing due. */}
                {notesLoading ? (
                  <p className="type-body-2 py-6 text-center text-muted-foreground">
                    {t.common.loading}
                  </p>
                ) : notesError ? (
                  <ErrorState
                    size="compact"
                    title={t.client.overview.remindersLoadError}
                    onRetry={retryNotes}
                  />
                ) : upcomingReminders.length === 0 ? (
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
                <h6 className="type-h6 text-foreground">{t.client.overview.recentActivity}</h6>
                {recentActivity.length > 0 && (
                  <Button variant="plain" size="sm" onClick={() => setActivityModalOpen(true)}>
                    {t.client.overview.viewAll}
                  </Button>
                )}
              </div>
              {recentActivity.length === 0 ? (
                <EmptyState
                  size="compact"
                  icon={
                    <ClockCounterClockwiseIcon
                      size={32}
                      weight="duotone"
                      className="text-[var(--text-default-placeholder)]"
                    />
                  }
                  title={t.client.overview.noActivity}
                />
              ) : (
                <ActivityTimeline items={recentActivity.slice(0, RECENT_ACTIVITY_PREVIEW)} />
              )}
            </div>
          </Card>
        </div>
        {/* end right column */}
      </div>

      {REMINDERS_ENABLED && reminderModals}

      <ResponsiveBottomSheetModal
        open={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={t.client.overview.recentActivity}
        titleId="client-activity-modal-title"
      >
        {/* The timeline scrolls inside the modal rather than the modal growing:
          a client's full history is unbounded, and the sheet already caps its
          own height on both mobile and desktop. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <ActivityTimeline items={recentActivity} />
        </div>
      </ResponsiveBottomSheetModal>
    </>
  );
}
