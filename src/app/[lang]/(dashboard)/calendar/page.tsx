"use client";

import { Suspense, useMemo } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { usePrivacy } from "@/contexts/privacy-context";
import { CALENDAR_ENABLED } from "@/lib/feature-flags";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { todayDateKey } from "./calendar-grid";
import { useDayItemModals } from "./use-day-item-modals";
import { CalendarView } from "./CalendarView";
import { CalendarRemindersTab } from "./CalendarRemindersTab";

const PATH = "/calendar";

/** The two readings of the same data: placed on days, or listed. */
const TABS = [
  { id: "calendar", title: "Calendar" },
  { id: "reminder", title: "Reminder" },
] as const;

type CalendarTab = (typeof TABS)[number]["id"];

/**
 * Month calendar of every note carrying a reminder — the same data as the
 * Notes hub's "Reminders" filter, laid out by day instead of by list so
 * upcoming ones read at a glance.
 *
 * Plus a Reminder tab, which is that same set read as one list: the grid
 * answers "what is on the 14th", the list answers "what have I got", and the
 * Dashboard's Reminders card links straight at the second one.
 */
export default function CalendarPage() {
  // Out of the current delivery phase — same guard, and the same reasoning, as
  // `/notes` (see `lib/feature-flags`). The page body is a separate component
  // so the guard sits above every hook rather than in front of them.
  if (!CALENDAR_ENABLED) redirect("/client-hub");
  return (
    // `useSearchParams` suspends, and the tab lives in the URL so the Dashboard
    // card can link to one of them and a reload keeps it.
    <Suspense fallback={<CalendarLoading />}>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarLoading() {
  return <p className="type-body-2 text-muted-foreground text-center py-10">Loading calendar…</p>;
}

function CalendarPageInner() {
  const clients = useClients();
  const { notes, isLoading } = useNotes();
  const { isPrivate } = usePrivacy();
  const searchParams = useSearchParams();

  const tab: CalendarTab = searchParams.get("tab") === "reminder" ? "reminder" : "calendar";

  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const clientNames = useMemo(
    () => new Map(clients.map((c) => [c.id, maskName(c.name, isPrivate)])),
    [clients, isPrivate],
  );

  // The same pair of modals a day cell opens, so a row in the list and a pill
  // in the grid lead to the same place.
  const { open: openDayItem, modals } = useDayItemModals({ clients });

  if (isLoading) return <CalendarLoading />;

  // The shell does not give `/calendar` a viewport-height column (it is not
  // `isFullHeight` in `page-chrome`), so the Calendar tab grows to its natural
  // height and the whole page scrolls. The Reminder tab's timeline scrolls
  // internally, which needs a bounded height, so it takes the viewport below
  // the 60px top bar (and `xl`'s 1.5rem of padding top and bottom) itself.
  return (
    <div
      className={`flex flex-col gap-3 ${
        tab === "reminder" ? "h-[calc(var(--vh)*100-60px)] xl:h-[calc(var(--vh)*100-60px-3rem)]" : ""
      }`}
    >
      {/* Sticky against the shell's `main`, which is what scrolls on the
          Calendar tab. It needs its own surface (the page's grey) or the grid
          reads through it, and `z-20` keeps it above the cells' popovers'
          anchors while staying under the top bar (`z-40`). `xl:-top-6` cancels
          `main`'s `xl:p-6`: sticky offsets are measured from inside the
          padding, so a plain `top-0` would park the strip 24px below the bar. */}
      <div className="sticky max-xl:top-0 xl:-top-6 z-20 shrink-0 bg-[var(--bg-default-secondary)] px-1 xl:px-0">
        <TabGroup
          items={TABS.map((t) => ({ id: t.id, title: t.title }))}
          activeId={tab}
          size="md"
          // The component paints every tab `bg-background`, which draws a white
          // strip over the page's own grey. Two rules rather than one so the
          // hover the component gives its inactive tabs survives: the first
          // stands down whenever a tab is hovered, and the second puts the
          // active tab — which has no hover state of its own to fall back to —
          // back to transparent for that case.
          className="[&_[role=tab]:not(:hover)]:bg-transparent! [&_[role=tab][aria-selected=true]:hover]:bg-transparent!"
          onChange={(id) =>
            // `replace`: switching view is not a step you should have to click
            // back through to leave the page.
            setQueryState(
              withQuery(PATH, searchParams, { tab: id === "calendar" ? null : id }),
              "replace",
            )
          }
        />
      </div>

      {tab === "calendar" ? (
        // The grid is its own height (see `CalendarView`) and simply runs past
        // the fold when the month plus its legend is taller than the screen —
        // the shell's `main` scrolls the whole page, not this card.
        // The Reminder tab below is the opposite: its timeline scrolls
        // internally and is parked on today, which only means something against
        // a bounded height — see the root's height above.
        <CalendarView notes={notes} clients={clients} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card max-xl:rounded-none! max-xl:border-0!">
          <CalendarRemindersTab
            notes={notes}
            clients={clients}
            today={today}
            clientNames={clientNames}
            onOpen={openDayItem}
          />
        </div>
      )}

      {modals}
    </div>
  );
}
