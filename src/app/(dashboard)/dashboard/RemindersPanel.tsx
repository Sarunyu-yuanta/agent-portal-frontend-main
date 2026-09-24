"use client";

import {
  CalendarCheckIcon,
  CheckIcon,
  IdentificationCardIcon,
  XIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ClientAvatarStack } from "@/components/ui/client-avatar-stack";
import { CompactList } from "@/components/ui/compact-list";
import { BUCKET_TONE } from "../calendar/reminder-buckets";
import { SOURCE_BADGE } from "../calendar/source-badge";
import { formatDayOnly } from "../notes/note-format";
import { snippet } from "../notes/notes-grouping";
import { RowIcon } from "./CardHeader";
import { BUCKET_LABEL_TH, type QueueGroup, type QueueItem } from "./dashboard-data";

/**
 * Every reminder that names any client, in the shape a client's own Reminders
 * tab already puts them in.
 *
 * Same four buckets, same badge tones, same source split, same "date plus how
 * long is left" line. The only differences are the ones the scope forces: this
 * list is every client rather than one, so a row says who it is about, and it
 * carries KYC expiries alongside notes and desk alerts, the way the header bell
 * merges those two feeds.
 *
 * Two choices worth stating, because they look like departures and aren't:
 *
 * - **The status is a pill on the row, not a heading above a group.** That is
 *   what the Reminders tab's own table does — a Status column per row — and in
 *   a column this narrow four headings would spend more height on labels than
 *   on reminders. The bucket still decides the order; it just isn't drawn as a
 *   divider.
 * - **`CompactList`, capped at the same height as the Client Hub's reminder
 *   dialog.** That dialog is almost exactly this width, and "four cards then
 *   scroll, with View All as the way out" is a decision already made there.
 */

/** The tint a KYC row wears. `SOURCE_BADGE` covers the two sources that have a
 *  calendar row behind them; KYC has none, and an entry there for something the
 *  Calendar can never raise would outlive the reason it was added. The ramp is
 *  the bell's, so one expiry looks the same in both places. */
function kycTone(daysLeft: number): string {
  if (daysLeft <= 0) return "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]";
  if (daysLeft <= 7) return "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]";
  return "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]";
}

const DONE_TONE = "bg-[var(--fill-gray-100)] text-[var(--fill-gray-400)]";

function RowBadge({ item }: { item: QueueItem }) {
  if (item.source === "kyc") {
    return (
      <RowIcon tone={kycTone(item.daysLeft)}>
        <IdentificationCardIcon size={16} />
      </RowIcon>
    );
  }
  const badge = SOURCE_BADGE[item.source];
  return <RowIcon tone={item.done ? DONE_TONE : badge.tone}>{badge.icon}</RowIcon>;
}

function QuietIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        // The whole row is the "open this" target; the control on its edge is
        // the one thing that is not that.
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-white hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
    >
      {children}
    </button>
  );
}

function ReminderRow({
  item,
  bucketLabel,
  bucketTone,
  clientNames,
  onOpen,
  onDone,
  onHide,
}: {
  item: QueueItem;
  bucketLabel: string;
  bucketTone: string;
  clientNames: Map<string, string>;
  onOpen: (item: QueueItem) => void;
  onDone: (noteId: string) => void;
  onHide: (id: string) => void;
}) {
  const names = item.clientIds
    .map((id) => clientNames.get(id))
    .filter((n): n is string => Boolean(n));
  const noteId = item.dayItem?.noteId ?? null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      // The clear/tick control appears on hover, so a list of six is six
      // sentences rather than six sentences and six buttons. It stays on for
      // keyboard users, who have no hover and would otherwise be tabbing into
      // something invisible.
      className="group flex items-start gap-3 rounded-2xl border border-border p-3 cursor-pointer transition-colors hover:border-primary-action/40 hover:bg-[var(--fill-p1-100)] focus-within:bg-[var(--fill-p1-100)]"
    >
      <RowBadge item={item} />

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p
          className={`text-[13px] font-semibold leading-snug truncate ${
            item.done ? "text-muted-foreground line-through" : "text-foreground"
          }`}
        >
          {item.title}
        </p>
        <p className="text-[11.5px] text-muted-foreground leading-snug truncate">
          {item.detail ? snippet(item.detail, 48) : "ไม่มีรายละเอียดเพิ่มเติม"}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-[var(--text-default-placeholder)]">
            {formatDayOnly(item.day.toISOString())}
          </span>
          {names.length > 0 && <ClientAvatarStack names={names} size="small" slots={3} />}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${bucketTone}`}
        >
          {bucketLabel}
        </span>
        {/* A note is settled by its own `reminderDone`, which the Calendar and
            the client's Reminders tab read too — so ticking it here settles it
            everywhere and lands it in that tab's Done bucket, which nothing in
            the app could reach before. The other two sources have nothing to
            write back to, so the honest verb for them is "hide", and the row
            returns at the expiry's next checkpoint. */}
        {noteId ? (
          !item.done && (
            <QuietIconButton label="ทำเสร็จแล้ว" onClick={() => onDone(noteId)}>
              <CheckIcon size={14} weight="bold" />
            </QuietIconButton>
          )
        ) : (
          <QuietIconButton label="ซ่อนรายการนี้" onClick={() => onHide(item.id)}>
            <XIcon size={14} weight="bold" />
          </QuietIconButton>
        )}
      </div>
    </div>
  );
}

export function RemindersPanel({
  groups,
  clientNames,
  filtered,
  variant = "default",
  onOpen,
  onDone,
  onHide,
  onClearFilter,
  onViewAll,
}: {
  /** Still grouped, so the bucket order holds — it is only drawn per row. */
  groups: QueueGroup[];
  /** Client id → display name, already masked by the caller. */
  clientNames: Map<string, string>;
  /** Whether a day is selected on the calendar — changes what "empty" means. */
  filtered: boolean;
  /** Taller scroll in the dashboard's dedicated right rail. */
  variant?: "default" | "sidebar";
  onOpen: (item: QueueItem) => void;
  onDone: (noteId: string) => void;
  onHide: (id: string) => void;
  onClearFilter: () => void;
  /** Where the capped list's "View all" goes — the Calendar, which is the only
   *  surface that holds every reminder across every client. */
  onViewAll?: () => void;
}) {
  if (groups.length === 0) {
    return (
      <EmptyState
        icon={<CalendarCheckIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title={filtered ? "วันนี้ไม่มีรายการ" : "เคลียร์หมดแล้ว"}
        body={
          filtered
            ? "ไม่มีอะไรครบกำหนดในวันที่เลือก"
            : "ไม่มี KYC ใกล้หมดอายุ การแจ้งเตือน หรือ reminder ใน 15 วันข้างหน้า"
        }
        action={filtered ? { label: "ดูทั้งหมด", onClick: onClearFilter } : undefined}
      />
    );
  }

  return (
    // The same cap the Client Hub's reminder dialog uses — about four cards'
    // worth before it scrolls, which is enough to read as "here's what's
    // coming" without the card outgrowing the column beside it.
    <CompactList
      onViewAll={onViewAll}
      contentClassName={`gap-2 overflow-y-auto pr-1 -mr-1 ${
        variant === "sidebar" ? "max-h-[min(520px,calc(100vh-22rem))]" : "max-h-[380px]"
      }`}
    >
      {groups.flatMap(({ bucket, items }) =>
        items.map((item) => (
          <ReminderRow
            key={item.id}
            item={item}
            bucketLabel={BUCKET_LABEL_TH[bucket]}
            bucketTone={BUCKET_TONE[bucket]}
            clientNames={clientNames}
            onOpen={onOpen}
            onDone={onDone}
            onHide={onHide}
          />
        )),
      )}
    </CompactList>
  );
}
