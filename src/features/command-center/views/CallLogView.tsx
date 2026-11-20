"use client";

import { useMemo, useState } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import {
  Button,
  Card,
  Dropdown,
  Pagination,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { CardCount } from "@/features/command-center/components/CardHeader";
import { CallDetailModal } from "@/features/command-center/components/CallLogPanel";
import { buildCallLog, type CallLogRow } from "@/features/command-center/lib/call-log-feed";
import { useT } from "@/i18n/I18nProvider";
import { relativeCallDate } from "@/features/clients/lib/call-log-format";
import { useClientsResource } from "@/features/clients/hooks/use-clients";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";
import { pageCount, pageSlice } from "@/lib/pagination";
import { ROUTES, clientPath } from "@/lib/routes";

/**
 * Every logged call across the book, in full.
 *
 * The Dashboard card shows the newest handful; this is where "ดูทั้งหมด" lands.
 * A page rather than the sheet it used to open: thirteen calls, each with a
 * record behind it, is somewhere you go and come back from — a sheet over the
 * dashboard made the list a thing you had to dismiss before you could read
 * anything else, and it could not be linked to or reopened.
 *
 * Drawn as the same table the client's own Call Log tab uses
 * (`CallLogTable` in `client/[id]/ClientSections`), with one column that table
 * has no need for: whose call it was. That extra column, and rows that open a
 * record, are why this is its own table rather than that one reused — teaching
 * the shared component an optional client column and an optional row action
 * would have put both variants' concerns into the component every client page
 * renders.
 */
/** Sentinel for "no filter". Not `""`, which `Dropdown` would read as nothing
 *  selected and fall back to its placeholder. */
const ALL_CLIENTS = "all";

/** Matches Client 360's table, so the two pages page the same way. */

export function CallLogView() {
  const { data: clients, isLoading } = useClientsResource();
  const { isPrivate } = usePrivacy();
  const router = useLocalizedRouter();
  const t = useT();
  // Falls back to the Dashboard on a cold entry — a pasted link, or a session
  // restored straight onto this page, where there is no trail to walk up.
  const goBack = useSectionBack(() => ROUTES.commandCenter);

  // Same in reverse: opened from a Dashboard that was scrolled down.
  useScrollTopOnChange([]);

  const rows = useMemo(() => buildCallLog(clients ?? [], isPrivate), [clients, isPrivate]);
  const [detail, setDetail] = useState<CallLogRow | null>(null);
  const [clientId, setClientId] = useState(ALL_CLIENTS);

  /**
   * The whole book, not only the clients who happen to have a logged call.
   *
   * Three of the eight have none, so picking one of those lands on an empty
   * table. That is the honest answer — "nothing has been logged for this
   * client" is information — and it beats a filter that silently omits five
   * eighths of the desk and leaves the reader wondering where they went.
   */
  const options = useMemo(
    () => [
      { value: ALL_CLIENTS, label: t.commandCenter.callLog.allClients(rows.length) },
      ...(clients ?? []).map((client) => ({
        value: client.id,
        label: maskName(client.name, isPrivate),
      })),
    ],
    [clients, rows.length, isPrivate, t],
  );

  const visible = useMemo(
    () => (clientId === ALL_CLIENTS ? rows : rows.filter((row) => row.clientId === clientId)),
    [rows, clientId],
  );

  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = pageCount(visible.length, pageSize);
  /** Clamped rather than reset: narrowing the filter while on page 3 leaves the
   *  stored page out of range, and snapping to the last page that still exists
   *  keeps the reader where they were rather than throwing them to the top. */
  const safePage = Math.min(currentPage, totalPages);
  const paged = useMemo(
    () => pageSlice(visible, safePage, pageSize),
    [visible, safePage, pageSize],
  );

  // Whole page, client filter included: its options are this log's clients.
  if (isLoading) return <CallLogSkeleton />;

  return (
    /* `xl:pb-20` clears the floating "New note" button, which the shell pins at
       `bottom-8 right-8` and renders from `xl` up (`FloatingNoteButton`). Without
       it the button sits on top of the pager, which is the one control at the
       bottom-right of this page. Tied to the same breakpoint as the button, so
       a phone does not carry 80px of empty space for something it never shows. */
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={goBack}
          aria-label={t.commandCenter.backToDashboard}
          className="shrink-0"
        >
          <ArrowLeftIcon size={18} />
        </Button>
        <h1 className="type-h6 text-foreground">{t.commandCenter.callLog.title}</h1>
        {/* The count follows the filter — a page showing four rows under a "13"
            reads as though nine went missing. */}
        {visible.length > 0 && <CardCount value={visible.length} />}
        <span className="flex-1" />
        {rows.length > 0 && (
          <Dropdown
            value={clientId}
            onChange={(next) => {
              setClientId(next);
              setCurrentPage(1);
            }}
            options={options}
            // The component defaults this to the literal string "Text label",
            // which it floats above the value. There is nothing to label here —
            // the chosen client reads for itself beside a page called Call Log.
            placeholder=""
            // `placeholder=""` empties the floating label but the element stays,
            // so a blank 16px line sits above the value and pushes it off centre.
            // The trigger renders it as the first `<p>` in its text stack.
            className="w-[220px] shrink-0 [&_p:first-of-type]:hidden"
          />
        )}
      </div>

      <Card variant="default" className="gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={
              <PhoneIcon
                size={40}
                weight="duotone"
                className="text-[var(--text-default-placeholder)]"
              />
            }
            title={t.commandCenter.callLog.emptyTitle}
            // Whose log is empty is the useful half of the message, so the
            // filtered case says so rather than repeating the global copy.
            body={
              clientId === ALL_CLIENTS
                ? t.commandCenter.callLog.emptyBodyAll
                : t.commandCenter.callLog.emptyBodyClient
            }
            action={
              clientId === ALL_CLIENTS
                ? undefined
                : {
                    label: t.states.clearFilters,
                    onClick: () => {
                      setClientId(ALL_CLIENTS);
                      setCurrentPage(1);
                    },
                  }
            }
          />
        ) : (
          <>
            <CallLogBookTable rows={paged} onOpen={setDetail} />

            {/* The same footer Client 360's table carries — page size on the
                left, range and pager on the right. `flex-wrap-reverse` so the
                pager stays on the top line when the two cannot share one. */}
            <div className="flex flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-label whitespace-nowrap text-muted-foreground">
                  {t.commandCenter.callLog.perPage}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="focus:ring-primary-action cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-label text-foreground focus:ring-1 focus:outline-none"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-label text-muted-foreground">
                  {t.commandCenter.callLog.showingRange(
                    <span key="from" className="font-medium text-foreground">
                      {(safePage - 1) * pageSize + 1}
                    </span>,
                    <span key="to" className="font-medium text-foreground">
                      {Math.min(safePage * pageSize, visible.length)}
                    </span>,
                    <span key="total" className="font-medium text-foreground">
                      {visible.length}
                    </span>,
                  )}
                </p>
                <Pagination
                  totalPages={totalPages}
                  currentPage={safePage}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </>
        )}
      </Card>

      <CallDetailModal
        row={detail}
        onClose={() => setDetail(null)}
        onViewClient={(clientId) => {
          setDetail(null);
          router.push(clientPath(clientId, "call-log"));
        }}
      />
    </div>
  );
}

function DirectionCell({ direction }: { direction: CallLogRow["entry"]["direction"] }) {
  const t = useT();
  return (
    <div className="flex items-center gap-1.5">
      {direction === "outbound" ? (
        <PhoneOutgoingIcon size={16} className="text-[var(--text-brand-primary)]" />
      ) : (
        <PhoneIncomingIcon size={16} className="text-[var(--icon-success)]" />
      )}
      <span className="type-body-2 text-foreground">
        {t.commandCenter.callLog.direction[direction]}
      </span>
    </div>
  );
}

function CallLogBookTable({
  rows,
  onOpen,
}: {
  rows: CallLogRow[];
  onOpen: (row: CallLogRow) => void;
}) {
  const t = useT();
  return (
    <>
      {/* Mobile / tablet — stacked cards. A table's columns cannot shrink below
          their own content width, which is the same reason the client's Call
          Log tab splits at this breakpoint. */}
      <div className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onOpen(row)}
            className="flex cursor-pointer flex-col gap-1.5 rounded-xl border border-border p-3 text-left transition-colors hover:bg-[var(--fill-p1-100)]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="type-body-2 font-semibold text-foreground">{row.clientName}</span>
              <DirectionCell direction={row.entry.direction} />
            </div>
            <p className="type-caption text-muted-foreground">
              {row.entry.date} · {row.entry.time} · {row.entry.duration}
            </p>
            <p className="type-body-2 mt-1 text-foreground">{row.entry.summary}</p>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.commandCenter.callLog.columns.client}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.commandCenter.callLog.columns.date}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.commandCenter.callLog.columns.direction}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.commandCenter.callLog.columns.duration}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0">
                {t.commandCenter.callLog.columns.summary}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} onClick={() => onOpen(row)} className="cursor-pointer">
                <TableCell className="min-w-0 whitespace-nowrap">
                  <span className="type-body-2 font-medium text-foreground">{row.clientName}</span>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="type-body-2 font-medium text-foreground">
                      {row.entry.date} · {row.entry.time}
                    </span>
                    <span className="type-caption text-muted-foreground">
                      {relativeCallDate(row.entry.date, t)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <DirectionCell direction={row.entry.direction} />
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <span className="type-body-2 text-foreground">{row.entry.duration}</span>
                </TableCell>
                <TableCell className="min-w-0">
                  <span className="type-body-2 text-foreground">{row.entry.summary}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/** Title row (back, title, client filter) and the list card, as bars. */
function CallLogSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20" aria-busy="true">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-40" />
        <span className="flex-1" />
        <Skeleton className="h-10 w-[220px] shrink-0 rounded-lg" />
      </div>
      <Card variant="default" className="gap-4">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      </Card>
    </div>
  );
}
