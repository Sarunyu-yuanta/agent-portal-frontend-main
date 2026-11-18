"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { BottomSheet, Button, Toaster } from "@sarunyu/system-one";
import { CaretLeftIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { useNotes } from "@/contexts/notes-context";
import { useClients } from "@/hooks/use-api";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToasts } from "@/hooks/use-toasts";
import {
  dayFromKey,
  dayKey,
  isSameMonth,
  monthGrid,
  weeksOf,
  WEEKDAY_LABELS,
} from "../calendar/calendar-grid";
import type { DayItem } from "../calendar/day-items";
import { ReminderPreviewRow, RemindersPreviewEmpty } from "../calendar/reminder-preview";
import { NOTE_AUTHOR } from "../notes/note-constants";
import { NoteDetailPane } from "../notes/NoteDetailPane";
import { NoteModalShell } from "../notes/note-modal-shell";
import { reminderAtFromDate } from "../notes/note-format";
import type { DatedReminder } from "./dashboard-data";
/**
 * The month, small.
 *
 * A day with anything on it carries one primary dot — a hint, not a count.
 * Clicking that day opens the day's reminders in a popover. It does not
 * rewrite the Reminders card above; that card stays on today.
 */
const WEEKDAY_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function monthLabelTh(date: Date): string {
  return date.toLocaleDateString("th-TH", { month: "long", year: "numeric" });
}

function dayLabelTh(date: Date): string {
  return date.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
}

export function MiniCalendar({
  viewDate,
  today,
  remindersByDay,
  clientNames,
  onOpen,
  onMonthChange,
}: {
  /** Any day inside the month being shown. */
  viewDate: Date;
  today: Date;
  remindersByDay: Map<string, DatedReminder[]>;
  clientNames: Map<string, string>;
  onOpen: (item: DayItem, day: Date) => void;
  /** `+1` / `-1`, relative to the month on screen. */
  onMonthChange: (delta: number) => void;
}) {
  const weeks = weeksOf(monthGrid(viewDate));
  const todayKey = dayKey(today);
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const clients = useClients();
  const { addNote } = useNotes();
  const { toasts, addToast, removeToast } = useToasts();
  const attributesOpenRef = useRef(false);
  const modalValuesRef = useRef<{ title: string; body: string } | null>(null);
  const [blank, setBlank] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftCreatedAt, setDraftCreatedAt] = useState(() => new Date().toISOString());
  const [draftAttrs, setDraftAttrs] = useState<{
    clientIds: string[];
    reminderAt: string | null;
    reminderDone: boolean;
  }>({ clientIds: [], reminderAt: null, reminderDone: false });

  const openDay = openKey ? dayFromOpenKey(openKey, remindersByDay) : null;

  const draftNote = useMemo(
    () => ({
      id: "__draft__",
      title: null,
      body: "",
      author: NOTE_AUTHOR,
      createdAt: draftCreatedAt,
      updatedAt: draftCreatedAt,
      ...draftAttrs,
    }),
    [draftAttrs, draftCreatedAt],
  );

  const openCreate = (day: Date) => {
    setDraftCreatedAt(new Date().toISOString());
    setDraftAttrs({ clientIds: [], reminderAt: reminderAtFromDate(day), reminderDone: false });
    modalValuesRef.current = { title: "", body: "" };
    setBlank(true);
    setOpenKey(null);
    setCreateOpen(true);
  };

  const handleCreateSave = async () => {
    const values = modalValuesRef.current ?? { title: "", body: "" };
    if (saving || blank) return;
    setSaving(true);
    try {
      await addNote({
        clientIds: draftAttrs.clientIds,
        title: values.title.trim() || null,
        body: values.body,
        author: NOTE_AUTHOR,
        reminderAt: draftAttrs.reminderAt,
        reminderDone: draftAttrs.reminderDone,
      });
      addToast({ status: "success", message: "Reminder added" });
      setCreateOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <PopoverPrimitive.Root
      open={!isMobile && openDay !== null}
      onOpenChange={(next) => {
        if (!next) setOpenKey(null);
      }}
    >
    <PopoverPrimitive.Anchor asChild>
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="type-subtitle-1 font-bold text-foreground">
          {monthLabelTh(viewDate)}
        </p>
        <div className="flex items-center gap-0.5">
          <MonthNavButton label="เดือนก่อนหน้า" onClick={() => onMonthChange(-1)}>
            <CaretLeftIcon size={14} weight="bold" />
          </MonthNavButton>
          <MonthNavButton label="เดือนถัดไป" onClick={() => onMonthChange(1)}>
            <CaretRightIcon size={14} weight="bold" />
          </MonthNavButton>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-7">
          {WEEKDAY_TH.map((label, i) => (
            <div
              key={WEEKDAY_LABELS[i]}
              className="pb-1.5 text-center text-meta font-semibold text-[var(--text-default-placeholder)]"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          {weeks.map((week) => {
            const currentWeek = week.some((day) => dayKey(day) === todayKey);
            return (
              <div
                key={dayKey(week[0])}
                className={`grid grid-cols-7 rounded-lg ${
                  currentWeek ? "bg-primary-action-light py-1.5" : ""
                }`}
              >
                {week.map((day) => {
                  const key = dayKey(day);
                  const items = remindersByDay.get(key) ?? [];
                  return (
                    <DayCell
                      key={key}
                      day={day}
                      outside={!isSameMonth(day, viewDate)}
                      isToday={key === todayKey}
                      hasReminder={items.length > 0}
                      open={openKey === key}
                      onTint={currentWeek}
                      onSelect={() => setOpenKey(openKey === key ? null : key)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

    </div>
    </PopoverPrimitive.Anchor>

    {/* Sits on the side of the calendar card, not over the days. The card
        pads its content by 16px, so the offset clears that plus a small gap. */}
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        side="left"
        align="start"
        alignOffset={-16}
        sideOffset={28}
        collisionPadding={16}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest("[data-cal-day]")) {
            event.preventDefault();
          }
        }}
        className="z-50 w-[280px] rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-popover outline-none"
      >
        {openDay && (
          <DayPopoverBody
            day={openDay.day}
            items={openDay.items}
            today={today}
            clientNames={clientNames}
            onOpenItem={(item) => {
              const day = openDay.day;
              setOpenKey(null);
              onOpen(item, day);
            }}
            onAddReminder={openCreate}
          />
        )}
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>

    {isMobile && (
      <BottomSheet
        open={openKey !== null}
        onOpenChange={(next) => {
          if (!next) setOpenKey(null);
        }}
        title={openDay ? dayLabelTh(openDay.day) : "Reminders"}
        showHandle
      >
        {openDay && (
          <DayPopoverBody
            day={openDay.day}
            items={openDay.items}
            today={today}
            clientNames={clientNames}
            onOpenItem={(item) => {
              const day = openDay.day;
              setOpenKey(null);
              onOpen(item, day);
            }}
            onAddReminder={openCreate}
          />
        )}
      </BottomSheet>
    )}
    </PopoverPrimitive.Root>

    <NoteModalShell
      open={createOpen}
      onBackdropDismiss={() => {
        if (attributesOpenRef.current) return;
        setCreateOpen(false);
      }}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCreateSave}
            disabled={blank || saving}
          >
            Add note
          </Button>
        </>
      }
    >
      <NoteDetailPane
        key="__draft__"
        note={draftNote}
        clients={clients}
        onSave={(patch) => setDraftAttrs((prev) => ({ ...prev, ...patch }))}
        onEmptyChange={setBlank}
        onValuesChange={(values) => {
          modalValuesRef.current = values;
        }}
        manualSave
        layout="side"
        autoFocusTitle
        onAttributesOpenChange={(open) => {
          attributesOpenRef.current = open;
        }}
      />
    </NoteModalShell>
    <Toaster items={toasts} onRemove={removeToast} />
    </>
  );
}

function dayFromOpenKey(
  key: string,
  remindersByDay: Map<string, DatedReminder[]>,
): { day: Date; items: DatedReminder[] } {
  return { day: dayFromKey(key), items: remindersByDay.get(key) ?? [] };
}

/** A day the reminder can still be set for. Today is already the day itself. */
function isFutureDay(day: Date, today: Date): boolean {
  const date = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return date.getTime() > start.getTime();
}

function DayCell({
  day,
  outside,
  isToday,
  hasReminder,
  open,
  onTint,
  onSelect,
}: {
  day: Date;
  outside: boolean;
  isToday: boolean;
  hasReminder: boolean;
  open: boolean;
  /** This day sits on the current-week wash, so hover has to read on that blue. */
  onTint: boolean;
  onSelect: () => void;
}) {
  const hoverFill = onTint
    ? "group-hover:bg-white! group-hover:text-primary-action"
    : "group-hover:bg-[rgba(10,110,231,0.14)]! group-hover:text-primary-action";

  return (
    <button
      type="button"
      data-cal-day=""
      aria-current={isToday ? "date" : undefined}
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onSelect}
      className="group flex w-full flex-col items-center gap-0.5 py-0.5 cursor-pointer"
    >
      {/* `size-6`, not the 28px this started at. The dot below reads as
          belonging to the number, and what separated them was mostly the disc's
          own empty bottom — a 12px digit centred in a 28px circle leaves ~8px of
          fill under it before the 2px gap even begins. Taking the circle down to
          24px closes that without moving the dot into the disc, which is the one
          thing the gap cannot give up: on today both are solid primary, and they
          would read as a single blob the moment they touched. 24px is also the
          day number's size in both full calendars (`DayCell`). */}
      <span
        className={`flex size-6 items-center justify-center rounded-full text-label tabular-nums transition-colors ${
          isToday
            ? "bg-primary-action font-bold text-white group-hover:bg-[var(--primary-action-hover)]!"
            : open
              ? "bg-[rgba(10,110,231,0.16)] font-semibold text-primary-action"
              : outside
                ? `text-[var(--text-default-placeholder)] ${hoverFill}`
                : `text-foreground ${hoverFill}`
        }`}
      >
        {day.getDate()}
      </span>
      <span className="flex h-1.5 items-center justify-center">
        {hasReminder && (
          <span
            className={`size-1.5 rounded-full bg-primary-action ${outside ? "opacity-40" : ""}`}
          />
        )}
      </span>
    </button>
  );
}

function DayPopoverBody({
  day,
  items,
  today,
  clientNames,
  onOpenItem,
  onAddReminder,
}: {
  day: Date;
  items: DatedReminder[];
  today: Date;
  clientNames: Map<string, string>;
  onOpenItem: (item: DayItem) => void;
  onAddReminder: (day: Date) => void;
}) {
  const future = isFutureDay(day, today);

  return (
    <div className="flex flex-col gap-2">
      {items.length === 0 ? (
        <RemindersPreviewEmpty hint={future ? null : undefined} />
      ) : (
        <DayReminderList items={items} clientNames={clientNames} onOpenItem={onOpenItem} />
      )}
      {future && (
        <Button
          variant="primary"
          size="sm"
          className="w-full"
          leftIcon={<PlusIcon size={15} weight="bold" />}
          onClick={() => onAddReminder(day)}
        >
          Add reminder
        </Button>
      )}
    </div>
  );
}

function DayReminderList({
  items,
  clientNames,
  onOpenItem,
}: {
  items: DatedReminder[];
  clientNames: Map<string, string>;
  onOpenItem: (item: DayItem) => void;
}) {
  return (
    <div className="flex max-h-[280px] flex-col gap-2 overflow-y-auto">
      {items.map((row) => (
        <ReminderPreviewRow
          key={row.item.id}
          title={row.item.title}
          meta={clientLine(row, clientNames)}
          dayIso={row.day.toISOString()}
          dueToday={row.daysUntil === 0}
          onClick={() => onOpenItem(row.item)}
        />
      ))}
    </div>
  );
}

function clientLine(row: DatedReminder, clientNames: Map<string, string>): string | undefined {
  const names = row.item.clientIds
    .map((id) => clientNames.get(id))
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : undefined;
}

function MonthNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="cursor-pointer rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </button>
  );
}
