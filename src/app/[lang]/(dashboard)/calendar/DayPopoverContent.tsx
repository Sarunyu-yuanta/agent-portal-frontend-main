"use client";

import {
  CalendarBlankIcon,
  CaretRightIcon,
  PlusIcon,
} from "@phosphor-icons/react";
import { ClientAvatarStack } from "@/components/ui/client-avatar-stack";
import { dayLabel, weekdayLabel, type DayRelation } from "./calendar-grid";
import { splitDayItems, type ActionGroup, type DayItem } from "./day-items";
import type { MarketHoliday } from "./market-feed";
import { actionKindName, actionPalette, HOLIDAY_PALETTE, HolidayIcon } from "./market-taxonomy";
import { SourceBadgeIcon } from "./source-badge";
import { snippet } from "../notes/notes-grouping";

/**
 * Header badge per relation, or `null` where the date line already says it.
 *
 * Only two of the three earn one. "Overdue" is the fact the header can't show —
 * the date alone doesn't say it has slipped — and "Today" is worth calling out
 * because it's the one day being looked at from the inside. A future day would
 * get "Upcoming", which is exactly what the date already told you.
 */
const RELATION_BADGE: Record<DayRelation, { label: string; className: string } | null> = {
  past: {
    label: "Overdue",
    className: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
  },
  today: { label: "Today", className: "bg-primary-action text-white" },
  future: null,
};

/**
 * A day's corporate actions of one kind, as one card: a bar in the kind's
 * colour, the code, and a chip per security.
 *
 * Why a card and not rows. A single date routinely carries six symbols going
 * XD, two calling meetings and one returning capital — the exchange publishes
 * per security, not per event. As rows that is nine lines, six of which say
 * "XD" and differ only in the last word, and the reader's actual question
 * ("what is happening today, and does it touch anything I hold?") is answered
 * by the shape of the day rather than by any one line. Grouped, the same nine
 * become three things to look at.
 *
 * The chips are the click targets, not the card: the group is a heading, and a
 * symbol is what has a record behind it.
 */
function ActionGroupCard({
  group,
  onOpen,
}: {
  group: ActionGroup;
  onOpen: (item: DayItem) => void;
}) {
  const palette = actionPalette(group.kind);

  return (
    <div className="flex overflow-hidden rounded-lg border border-black/10 bg-card">
      {/* The one saturated use of the kind's hue. Everything else on the card is
          the pale end of it, which is what keeps a day holding four kinds from
          reading as four warnings. */}
      <span
        aria-hidden
        className="w-1 shrink-0 self-stretch"
        style={{ backgroundColor: palette.accent }}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 px-2.5 py-2">
        {/* The code in plain foreground, not in its own hue: the bar beside it
            has already said which colour this group is, and a coloured heading
            over coloured chips leaves nothing at full contrast to read. The
            exchange's name for it goes in the tooltip — "XD" is the label
            everyone here works in, and spelling it out on the card would push
            the chips, which are the point, onto a third line. */}
        <span className="type-caption font-semibold text-foreground" title={actionKindName(group.kind)}>
          {group.kind}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {group.items.map((item) => {
            const held = item.clientIds.length;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpen(item)}
                // A dot, not a number and not a list. The record sheet this
                // chip opens is about the company and says nothing about who
                // holds it (see `AlertOverlay`); the one thing worth saying at
                // chip size is whether the action touches the book at all.
                title={
                  held > 0
                    ? `${item.symbol} · held in ${held} client portfolio${held > 1 ? "s" : ""}`
                    : item.symbol
                }
                className="flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 type-caption cursor-pointer transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--fill-p1-600)]"
                style={{ backgroundColor: palette.tint, color: palette.text }}
              >
                {held > 0 && (
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: palette.accent }}
                  />
                )}
                <span className="truncate">{item.symbol}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * What a day cell opens into: everything landing on that day — the exchange's
 * corporate actions, the desk's own events, reminders the user wrote — plus a
 * "New reminder" action that hands off to the caller's own flow (a modal at the
 * Calendar page level, see `CalendarView`, rather than anything owned by this
 * panel).
 *
 * Laid out as header / scrolling body / footer action, with the popover's own
 * padding turned off by the caller so the section rules and the row hover run
 * edge to edge. A day with seven reminders is the case this has to survive, and
 * inset rows in a padded box leave it looking like a stack of loose cards.
 *
 * The body has two halves and they are shaped differently on purpose. Corporate
 * actions come first, as cards grouped by kind, because they are the part of a
 * day nobody chose and they arrive many-at-once. Everything else follows as a
 * plain list, because an event and a reminder are one thing each.
 */
export function DayPopoverContent({
  day,
  items,
  clients,
  relation,
  holiday,
  onOpenNote,
  onOpenAlert,
  onNewReminder,
  variant = "popover",
}: {
  day: Date;
  /** This day's rows, already filtered and sorted by the caller. */
  items: DayItem[];
  clients: { id: string; name: string }[];
  /** Where `day` sits against today, resolved by the cell. Drives the header
   * badge only: the rows carry no status mark of their own, since a single-day
   * list would repeat the same one down every row. */
  relation: DayRelation;
  /** The market closure on this day, if there is one. Not a row — see the note
   *  on `DayItemSource` in `day-items`. */
  holiday?: MarketHoliday | null;
  onOpenNote: (noteId: string) => void;
  /** Opens a row that has no note behind it — a corporate action or a desk
   *  event — in its own read-only panel. */
  onOpenAlert: (item: DayItem) => void;
  onNewReminder: () => void;
  /**
   * Which shell is holding this. `popover` sizes itself; `sheet` takes the width
   * it is given and spends the room on taller rows, because on a phone every one
   * of them is a touch target rather than a mouse target.
   */
  variant?: "popover" | "sheet";
}) {
  const isSheet = variant === "sheet";
  // An "Overdue" badge on a day whose reminders are all ticked off would be
  // wrong: nothing is outstanding. The badge describes work still owed, so a
  // fully-cleared past day gets none.
  const badge =
    relation === "past" && items.every((i) => i.done) ? null : RELATION_BADGE[relation];

  const { actionGroups, others } = splitDayItems(items);

  return (
    <div className={`flex min-h-0 flex-col ${isSheet ? "w-full" : "w-80"}`}>
      <header
        className={`flex shrink-0 items-start justify-between gap-3 px-3.5 ${
          isSheet ? "pb-3 pt-1" : "pb-2.5 pt-3"
        }`}
      >
        <div className="min-w-0">
          <p className="type-body-1 font-semibold text-foreground">{dayLabel(day)}</p>
          {/* Weekday and count share a line: both are context for the list below,
              and stacking them would push the first reminder out of view. */}
          {/* The count is dropped when there is nothing — "Nothing scheduled"
              is already about to say so, in bigger type, right below. */}
          <p className="type-caption text-muted-foreground">
            {weekdayLabel(day)}
            {items.length > 0 && ` · ${items.length} item${items.length > 1 ? "s" : ""}`}
          </p>
        </div>
        {badge && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 type-caption font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </header>

      {/* Above the scroller, not in it: a closed market changes how everything
          below it should be read — an X-date that lands on a non-trading day is
          the exchange's problem, not a typo — and a fact that reframes the list
          has to stay on screen while the list is scrolled. */}
      {holiday && (
        <p
          className="flex shrink-0 items-center gap-1.5 px-3.5 py-2 type-caption"
          style={{ backgroundColor: HOLIDAY_PALETTE.tint, color: HOLIDAY_PALETTE.text }}
        >
          <HolidayIcon size={14} weight="fill" className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">{holiday.name}</span>
          <span className="shrink-0 font-medium">{holiday.market} closed</span>
        </p>
      )}

      {items.length === 0 ? (
        // `border-y` matches the list's, so the footer below sits under exactly
        // one rule whichever branch renders.
        <div className="flex flex-col items-center gap-2 border-y border-border/60 px-3.5 py-8 text-center">
          <CalendarBlankIcon size={28} className="text-muted-foreground/40" />
          <p className="type-body-2 text-muted-foreground">Nothing scheduled</p>
        </div>
      ) : (
        <div
          className={`flex flex-col overflow-y-auto border-y border-border/60 ${
            // The sheet is already capped at 75vh and flexes; a second cap here
            // would leave dead space under a short list.
            isSheet ? "min-h-0 flex-1" : "max-h-80"
          }`}
        >
          {actionGroups.length > 0 && (
            <div className="flex shrink-0 flex-col gap-2 px-3 py-2.5">
              {actionGroups.map((group) => (
                <ActionGroupCard key={group.kind} group={group} onOpen={onOpenAlert} />
              ))}
            </div>
          )}

          {others.length > 0 && (
            <ul
              className={`flex shrink-0 flex-col divide-y divide-border/60 ${
                // Only when something is above it. The scroller's own `border-y`
                // already closes the top edge when this list leads.
                actionGroups.length > 0 ? "border-t border-border/60" : ""
              }`}
            >
              {others.map((item) => {
                // No per-row state word. Every row in this list falls on the same
                // day, so "Overdue" would have printed identically on all of them —
                // the same noise the repeated "Reminder" chip was. It moved to the
                // header, which is where a fact about the day belongs.
                const clientNames = item.clientIds.map(
                  (id) => clients.find((c) => c.id === id)?.name ?? id,
                );
                // Every row opens something — a note goes to its editor,
                // anything else to a read-only panel listing who it lands on.
                const open = item.noteId ? () => onOpenNote(item.noteId!) : () => onOpenAlert(item);

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={open}
                      className={`group flex w-full items-start gap-2.5 px-3.5 text-left transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! ${
                        isSheet ? "py-3.5" : "py-2.5"
                      }`}
                    >
                      {/* `self-center`, like the caret: the badge stands for the
                          row rather than for its title line. */}
                      <SourceBadgeIcon item={item} size={isSheet ? "default" : "small"} selfCenter />

                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span
                          className={`type-body-2 font-medium truncate ${
                            item.done ? "text-muted-foreground line-through" : "text-foreground"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="type-caption text-muted-foreground truncate">
                          {item.detail ? snippet(item.detail, 44) : "No additional text"}
                        </span>
                      </span>

                      {clientNames.length > 0 && (
                        <span className="mt-0.5 shrink-0">
                          <ClientAvatarStack names={clientNames} slots={3} size="small" />
                        </span>
                      )}
                      {/* `self-center`: the caret stands for the whole row, so it
                          centres against both lines. Sits in the layout at all times so
                          a row does not reflow on hover; only its opacity changes.
                          Always on in the sheet — there is no hover on a phone, so a
                          hover-only affordance is one nobody ever sees. */}
                      <CaretRightIcon
                        size={14}
                        className={`self-center shrink-0 text-muted-foreground transition-opacity ${
                          isSheet ? "opacity-40" : "opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onNewReminder}
        className={`flex shrink-0 items-center gap-1.5 px-3.5 type-body-2 font-medium text-primary-action transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! ${
          // Extra bottom room in the sheet clears the home indicator on a
          // gesture-navigation phone, where the last few pixels aren't tappable.
          isSheet ? "pt-3.5 pb-[max(1rem,env(safe-area-inset-bottom))]" : "py-2.5"
        }`}
      >
        <PlusIcon size={15} weight="bold" />
        New reminder
      </button>
    </div>
  );
}
