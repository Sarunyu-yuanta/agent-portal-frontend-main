"use client";

import { useState } from "react";
import Link from "next/link";
import { BellIcon, CaretRightIcon } from "@phosphor-icons/react";
import type { DayItem } from "../calendar/day-items";
import { HolderContactOverlay } from "../calendar/HolderContact";
import { RemindersPreviewEmpty } from "../calendar/reminder-preview";
import { RowIcon } from "./CardHeader";
import { KycRow } from "./KycAlertsPanel";
import { REMINDER_ROW_LIMIT, type QueueItem } from "./dashboard-data";

const REMINDERS_PAGE = "/calendar?tab=reminder";

/** A reminder already placed on its calendar day, ready for the preview row. */
export type PreviewReminder = {
  item: DayItem;
  day: Date;
  /** Whole days from today. `0` is the row that says "Due today". */
  daysUntil: number;
};

/**
 * The Dashboard's reminder card.
 *
 * The same rows the Client 360 Overview card draws, gathered across every
 * client instead of one — so each row also says who it is about. The card
 * itself only ever shows the day the calendar is pointing at; "ดูทั้งหมด"
 * is the way out to the rest.
 *
 * That way out is the Calendar's Reminder tab, not a sheet over this page. The
 * rest is everything from a quarter back to a quarter ahead, ticked-off ones
 * included — a list that long is somewhere you go, and it is already the
 * Calendar's own second view rather than a copy kept here.
 *
 * KYC expiries land here too, but only the ones dated today. A record lapsing
 * this morning is a thing due today whatever produced the date, and the
 * Calendar's Reminder tab lists them for the same reason. It stops at today
 * because the KYC card two rows down this rail already owns the fortnight
 * ahead, and a card that repeated it would be asking the reader to notice the
 * same five names twice.
 */
export function RemindersPanel({
  dayItems,
  kycItems,
  clientNames,
  onOpen,
}: {
  dayItems: PreviewReminder[];
  /** Expiring today, and only today — see above. `buildQueue`'s own rows, so
   *  this card and the KYC card cannot word the same deadline differently. */
  kycItems: QueueItem[];
  clientNames: Map<string, string>;
  onOpen: (item: DayItem, day: Date) => void;
}) {
  /** Opened by a KYC row: the person, not the record. Same call the KYC card
   *  and the Calendar's Reminder tab make. */
  const [contact, setContact] = useState<{ clientId: string; name: string } | null>(null);

  const kycShown = kycItems.slice(0, REMINDER_ROW_LIMIT);
  const dayShown = dayItems.slice(0, Math.max(0, REMINDER_ROW_LIMIT - kycShown.length));
  const hiddenCount =
    kycItems.length + dayItems.length - kycShown.length - dayShown.length;

  return (
    <div className="flex flex-col gap-4">
      <h6 className="type-h6 text-foreground">Reminders</h6>

      {/* The card is always today, so the label is the word and nothing else —
          no date, no badge. The rows used to carry "Due today · 29 Sept 2026"
          one by one, which said the same thing as many times as there were rows
          and still left the card without a heading; said once up here, the rows
          are free to say only what is on the day. The Calendar's Reminder tab
          prints real dates over its groups because it has three months of them
          to tell apart — this has one. */}
      <p className="type-caption font-semibold text-muted-foreground">วันนี้</p>

      {/* One surface with rules inside it, matching the other lists on this
          page. The rows go `flush` so the list owns the radius and fill. */}
      {dayItems.length === 0 && kycItems.length === 0 ? (
        <RemindersPreviewEmpty />
      ) : (
        <div className="overflow-hidden rounded-xl bg-[var(--bg-default-secondary)] divide-y divide-black/[0.05] flex flex-col">
          {/* KYC first: it is the only deadline in here with a rule behind it,
              which is the order `SOURCE_WEIGHT` in `dashboard-data` puts the
              same sources in. A card, not a bell — nobody set an alarm on a KYC
              record, it expires on its own. */}
          {kycShown.map((row) => (
            <KycRow
              key={row.id}
              row={row}
              showBadge={false}
              onOpen={() =>
                setContact({ clientId: row.clientIds[0], name: row.title })
              }
            />
          ))}
          {dayShown.map((row) => (
            <ReminderRow
              key={row.item.id}
              title={row.item.title}
              meta={clientLine(row.item, clientNames)}
              onOpen={() => onOpen(row.item, row.day)}
            />
          ))}
          {hiddenCount > 0 && <MoreRow count={hiddenCount} />}
        </div>
      )}

      {contact && (
        <HolderContactOverlay
          clientId={contact.clientId}
          name={contact.name}
          onClose={() => setContact(null)}
        />
      )}
    </div>
  );
}

/** Same row chrome as {@link KycRow} — icon square and two-line body, no pill. */
function ReminderRow({
  title,
  meta,
  onOpen,
}: {
  title: string;
  meta?: string;
  onOpen: () => void;
}) {
  const tone = "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]";

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
      className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <RowIcon tone={tone}>
        <BellIcon size={18} weight="fill" />
      </RowIcon>

      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <p className="truncate text-body font-bold text-foreground">{title}</p>
        {meta ? (
          <p className="truncate text-meta text-muted-foreground">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}

function MoreRow({ count }: { count: number }) {
  return (
    <Link
      href={REMINDERS_PAGE}
      className="flex w-full items-center gap-2 p-3 text-left no-underline transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <p className="min-w-0 flex-1 truncate text-body-sm font-bold text-foreground">
        ดูอีก {count} รายการ
      </p>
      <CaretRightIcon
        size={16}
        className="shrink-0 text-[var(--text-default-placeholder)]"
      />
    </Link>
  );
}

function clientLine(item: DayItem, clientNames: Map<string, string>): string | undefined {
  const names = item.clientIds
    .map((id) => clientNames.get(id))
    .filter((name): name is string => Boolean(name));
  return names.length > 0 ? names.join(", ") : undefined;
}
