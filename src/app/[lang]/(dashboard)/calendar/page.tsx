"use client";

import { useLocale } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

import { Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { useNotes } from "@/features/notes/store/notes-context";
import { CALENDAR_ENABLED } from "@/config/feature-flags";
import { CalendarView } from "@/features/calendar/components/CalendarView";
import { CalendarPageSkeleton } from "@/features/calendar/components/CalendarPageSkeleton";
import { useClients } from "@/features/clients/hooks/use-clients";
import { ROUTES } from "@/lib/routes";

/**
 * Month calendar of every note carrying a reminder — the same data as the
 * Notes hub's "Reminders" filter, laid out by day instead of by list so
 * upcoming ones read at a glance.
 *
 * The list reading of the same set used to be a second tab here; it is now
 * its own sidebar page (`/reminders`) so this grid can own the whole screen.
 * The page is `isFullHeight` + `isUncappedWidth` in `page-chrome`: it never
 * scrolls, and the six weeks split the viewport between them.
 */
export default function CalendarPage() {
  const locale = useLocale();
  // Out of the current delivery phase — same guard, and the same reasoning, as
  // `/notes` (see `lib/feature-flags`). The page body is a separate component
  // so the guard sits above every hook rather than in front of them.
  if (!CALENDAR_ENABLED) redirect(localizePath(ROUTES.clientHub, locale));
  return (
    <Suspense fallback={<CalendarPageSkeleton />}>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarPageInner() {
  const locale = useLocale();
  // Old links (bookmarks, the pre-split Dashboard card) pointed the list at
  // `?tab=reminder`; send them to where it lives now.
  if (useSearchParams().get("tab") === "reminder") redirect(localizePath(ROUTES.reminders, locale));

  const clients = useClients();
  const { notes, isLoading } = useNotes();

  if (isLoading) return <CalendarPageSkeleton />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CalendarView notes={notes} clients={clients} />
    </div>
  );
}
