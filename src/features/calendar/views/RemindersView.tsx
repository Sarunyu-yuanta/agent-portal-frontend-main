"use client";

import { useLocale } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

import { useMemo } from "react";
import { redirect } from "next/navigation";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/features/notes/store/notes-context";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { CALENDAR_ENABLED } from "@/config/feature-flags";
import { maskName } from "@/lib/mask-name";
import { Skeleton } from "@/components/ui/skeleton";
import { todayDateKey } from "@/features/calendar/lib/calendar-grid";
import { useDayItemModals } from "@/features/calendar/hooks/use-day-item-modals";
import { CalendarRemindersTab } from "@/features/calendar/components/CalendarRemindersTab";

/**
 * Every reminder as one list — the same set the Calendar lays out by day. The
 * grid answers "what is on the 14th", this answers "what have I got", and the
 * Command Center's Reminders card links straight here.
 *
 * Rides the Calendar's flag: it is that feature's second view, split out to
 * its own sidebar entry so the month grid could take the full screen.
 * `isFullHeight` in `page-chrome` gives it a bounded column, which the
 * timeline needs to scroll internally and park on today.
 */
export function RemindersView() {
  const locale = useLocale();
  if (!CALENDAR_ENABLED) redirect(localizePath("/client-hub", locale));
  return <RemindersPageInner />;
}

function RemindersPageInner() {
  const clients = useClients();
  const { notes, isLoading } = useNotes();
  const { isPrivate } = usePrivacy();

  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const clientNames = useMemo(
    () => new Map(clients.map((c) => [c.id, maskName(c.name, isPrivate)])),
    [clients, isPrivate],
  );

  // The same pair of modals a calendar day cell opens, so a row here and a
  // pill there lead to the same place.
  const { open: openDayItem, modals } = useDayItemModals({ clients });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-card">
      {isLoading ? (
        <RemindersSkeleton />
      ) : (
        <CalendarRemindersTab
          notes={notes}
          clients={clients}
          today={today}
          clientNames={clientNames}
          onOpen={openDayItem}
        />
      )}
      {modals}
    </div>
  );
}

/**
 * Mirrors `CalendarRemindersTab`: the day strip (weekday, date disc, dot), then
 * day sections — a date heading over a card of rows (36px icon disc, title,
 * meta) — with the same side padding as the real list.
 */
function RemindersSkeleton() {
  const sections = [2, 2, 3];
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 overflow-hidden border-b border-border px-3">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className="flex min-w-12 flex-1 flex-col items-center gap-1.5 py-4">
            <Skeleton className="h-4 w-7" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-1 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-5 overflow-hidden px-6 py-4 lg:px-10!">
        {sections.map((rows, s) => (
          <div key={s} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-44" />
            <div className="flex flex-col divide-y divide-black/[0.05] overflow-hidden rounded-xl bg-[var(--bg-default-secondary)]">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-3 p-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-5 w-56" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
