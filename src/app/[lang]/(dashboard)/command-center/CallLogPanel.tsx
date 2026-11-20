"use client";

import { useState } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { Button } from "@sarunyu/system-one";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CaretRightIcon,
  PhoneIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { LocaleLink as Link } from "@/i18n/navigation";
import { ContactFields } from "../calendar/HolderContact";
import { CardHeader } from "./CardHeader";
import { useT } from "@/i18n/I18nProvider";
import type { CallLogRow } from "./call-log-feed";

/** Outbound is the desk reaching out, inbound is the client. One glyph and one
 *  hue each — a bare arrow rather than a tinted square, since the direction is
 *  a property of the row, not a thing in its own right. The word stays as the
 *  icon's accessible name: an arrow is unambiguous to look at and says nothing
 *  to a screen reader. */
/** The same two directions, as a filled badge — the list shows a bare arrow
 *  beside 14px text, the record shows a 40px disc beside the client's name. */
const DIRECTION_BADGE = {
  outbound: {
    tone: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
    Icon: ArrowUpRightIcon,
  },
  inbound: {
    tone: "bg-[var(--fill-emerald-100)] text-[var(--fill-emerald-600)]",
    Icon: ArrowDownLeftIcon,
  },
} as const;

const DIRECTION = {
  outbound: {
    color: "text-[var(--fill-p1-600)]",
    Icon: ArrowUpRightIcon,
  },
  inbound: {
    color: "text-[var(--fill-emerald-600)]",
    Icon: ArrowDownLeftIcon,
  },
} as const;

/**
 * Every call the desk has logged, across all clients, newest first.
 *
 * A plain history — no ranking, no score, nothing to dismiss. The card shows
 * the most recent few; "ดูทั้งหมด" opens the rest in the same sheet the
 * Reminders and KYC cards use.
 */
export function CallLogPanel({ rows, limit }: { rows: CallLogRow[]; limit: number }) {
  const router = useLocalizedRouter();
  const t = useT();
  /** The call whose record is open. A row opens the call, not the client — the
   *  summary in the list is clipped to one line, and the thing you wanted when
   *  you clicked was the rest of that sentence. The client's full history is
   *  one button further on. */
  const [detail, setDetail] = useState<CallLogRow | null>(null);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <CardHeader title={t.commandCenter.callLog.title} />
        <EmptyState
          icon={
            <PhoneIcon
              size={40}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title={t.commandCenter.callLog.emptyTitle}
          body={t.commandCenter.callLog.emptyBodyAll}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CardHeader
        title={t.commandCenter.callLog.title}
        count={rows.length}
        link={{ href: CALL_LOG_PAGE, label: t.commandCenter.viewAll }}
      />

      {/* One surface with rules inside it, rather than a stack of separate
          boxes: a log is a continuous record, and five outlined cards in a
          column made each call look like its own object. The container carries
          the border and the fill; a row only draws its own hover. */}
      <div className="divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)]">
        {rows.slice(0, limit).map((row) => (
          <CallRow key={row.id} row={row} onOpen={() => setDetail(row)} />
        ))}
        {rows.length > limit && <MoreRow count={rows.length - limit} />}
      </div>

      <CallDetailModal
        row={detail}
        onClose={() => setDetail(null)}
        onViewClient={(clientId) => {
          setDetail(null);
          router.push(callLogHref(clientId));
        }}
      />
    </div>
  );
}

/**
 * One call, in full.
 *
 * Everything the list had to clip: the whole summary, the exact date rather
 * than "2 months ago", and whose call it was said plainly rather than implied
 * by a row's position.
 */
export function CallDetailModal({
  row,
  onClose,
  onViewClient,
}: {
  row: CallLogRow | null;
  onClose: () => void;
  onViewClient: (clientId: string) => void;
}) {
  const t = useT();
  if (!row) return null;
  const { tone, Icon } = DIRECTION_BADGE[row.entry.direction];
  const label = t.commandCenter.callLog.direction[row.entry.direction];

  return (
    <ResponsiveBottomSheetModal
      open
      onClose={onClose}
      title={t.commandCenter.callLog.detailTitle}
      titleId="dashboard-call-detail"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}
          >
            <Icon size={20} weight="bold" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="type-body-1 font-semibold text-foreground">{row.clientName}</p>
            <p className="type-caption text-muted-foreground">
              {label} · {row.entry.date} · {row.entry.time} · {row.entry.duration}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[var(--bg-default-secondary)] p-4">
          <p className="type-body-2 leading-relaxed text-foreground">{row.entry.summary}</p>
        </div>

        {/* The same contact block a KYC row opens, under the summary rather than
            behind a second tap. What a record of a call leaves you wanting is a
            way to make the next one, and this record already knows whose call it
            was — so the number belongs on it, not one step further on.

            Captioned because the summary above it wears the same soft fill:
            unlabelled, two grey boxes in a column read as one continuing block
            rather than the call and the client. */}
        <div className="flex flex-col gap-2">
          <p className="type-caption font-semibold text-muted-foreground">
            {t.commandCenter.contactChannels}
          </p>
          <ContactFields clientId={row.clientId} />
        </div>
      </div>

      <div className="flex shrink-0 justify-center border-t border-border px-4 py-3">
        <Button variant="plain" size="sm" onClick={() => onViewClient(row.clientId)}>
          {t.commandCenter.callLog.viewClientHistory}
        </Button>
      </div>
    </ResponsiveBottomSheetModal>
  );
}

/** The whole book's log, as its own page. */
export const CALL_LOG_PAGE = "/command-center/call-log";

function callLogHref(clientId: string): string {
  return `/client/${clientId}?tab=call-log`;
}

function MoreRow({ count }: { count: number }) {
  const t = useT();
  return (
    <Link
      href={CALL_LOG_PAGE}
      className="flex w-full items-center gap-2 p-3 text-left no-underline transition-colors hover:bg-[var(--fill-p1-100)]"
    >
      <p className="min-w-0 flex-1 truncate text-body-sm font-bold text-foreground">
        {t.commandCenter.moreItems(count)}
      </p>
      <CaretRightIcon size={16} className="shrink-0 text-[var(--text-default-placeholder)]" />
    </Link>
  );
}

export function CallRow({ row, onOpen }: { row: CallLogRow; onOpen: () => void }) {
  const t = useT();
  const { color, Icon } = DIRECTION[row.entry.direction];
  const label = t.commandCenter.callLog.direction[row.entry.direction];

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
      <Icon size={18} weight="bold" role="img" aria-label={label} className={`shrink-0 ${color}`} />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body font-bold text-foreground">{row.clientName}</p>
        {/* One line. It does cut most summaries mid-sentence, so the full text
            is on the row's tooltip and the whole row opens the client's own
            Call Log tab, where it is not cut at all. */}
        <p className="truncate text-meta text-muted-foreground" title={row.entry.summary}>
          {row.entry.summary}
        </p>
      </div>
    </div>
  );
}
