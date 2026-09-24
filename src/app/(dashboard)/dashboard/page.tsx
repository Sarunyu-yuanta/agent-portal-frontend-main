"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@sarunyu/system-one";
import { useClientsResource, useNBAActions } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { usePrivacy } from "@/contexts/privacy-context";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { CALENDAR_ENABLED } from "@/lib/feature-flags";
import { NOTE_AUTHOR } from "../notes/note-constants";
import { getClientTotals } from "../client-hub/client-hub-data";
import { formatAumThb } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { Skeleton } from "@/components/ui/skeleton";
import { addMonths, dayFromKey, todayDateKey } from "../calendar/calendar-grid";
import { useDayItemModals } from "../calendar/use-day-item-modals";
import { CardHeader } from "./CardHeader";
import { StatTiles, type StatTile } from "./StatTiles";
import { MiniCalendar } from "./MiniCalendar";
import { RemindersPanel } from "./RemindersPanel";
import { NbaPanel } from "./NbaPanel";
import { HouseViewSpotlight } from "./HouseViewSpotlight";
import {
  buildDayQueue,
  buildMonthDots,
  buildNbaRows,
  buildQueue,
  groupQueueByBucket,
  houseViewSpotlight,
  isNbaId,
  isQueueId,
  HIDDEN_NBA_IDS_PREF,
  HIDDEN_QUEUE_IDS_PREF,
  NBA_ROW_LIMIT,
  type QueueGroup,
  type QueueItem,
} from "./dashboard-data";

/**
 * The page an IC opens first.
 *
 * Its job is narrow on purpose: say what today asks for, who is worth a call,
 * and what the desk's view points at — then hand off. Nothing here is a place
 * to work for an hour; every card ends in a link into the section that owns the
 * subject.
 *
 * The shape is three counts in the work column beside a right rail for calendar
 * and reminders: the work on the left, the context on the right. What it deliberately does *not* carry is a wall of AUM and
 * revenue figures — Client 360 already summarises the book above the table
 * those numbers describe, and "how is the quarter going" is not the question
 * being asked at eight in the morning.
 *
 * See `dashboard-data` for what each block is derived from, and why the
 * derivations live there rather than in these components.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageInner />
    </Suspense>
  );
}

const PATH = "/dashboard";

function DashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clients, isLoading } = useClientsResource();
  const nbaActions = useNBAActions();
  const { notes, editNote } = useNotes();
  const { isPrivate } = usePrivacy();

  /**
   * Rows the user has cleared. Lasting, not session — a KYC alert dismissed on
   * Monday must not be back on Tuesday morning, which is exactly what session
   * memory would do. The id carries the checkpoint, so it does come back when
   * the expiry gets closer.
   */
  const [hiddenIds, setHiddenIds] = useStoredIds<string>(
    HIDDEN_QUEUE_IDS_PREF,
    isQueueId,
  );
  /** Dismissed Next Best Actions. Its own key — see `HIDDEN_NBA_IDS_PREF`. */
  const [dismissedNba, setDismissedNba] = useStoredIds<string>(
    HIDDEN_NBA_IDS_PREF,
    isNbaId,
  );

  // The modals a queue row opens — the same pair the bell and a client's
  // Reminders tab open, from the one definition. No `pinnedClientId`: this page
  // isn't standing on anyone's profile.
  const { open: openDayItem, modals } = useDayItemModals({ clients });

  // Anchored to the calendar day rather than a fresh `Date`, so the memos below
  // don't recompute on every render. Same pattern as the Overview tab's
  // reminders card.
  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const selectedKey = searchParams.get("day");
  const monthOffset = Number(searchParams.get("month")) || 0;
  const viewDate = useMemo(() => addMonths(today, monthOffset), [today, monthOffset]);

  const queue = useMemo(
    () => buildQueue({ clients, notes, today, isPrivate }),
    [clients, notes, today, isPrivate],
  );
  const live = useMemo(
    () => queue.filter((item) => !hiddenIds.has(item.id)),
    [queue, hiddenIds],
  );

  /**
   * What the list shows: the whole horizon, or one day's worth once the
   * calendar has been used. Either way it is sorted into the same four buckets
   * a client's own Reminders tab uses.
   *
   * The selected-day branch is built from the raw sources rather than filtered
   * out of `live`, because the calendar can point at days the 15-day horizon
   * does not reach — see `buildDayQueue`.
   */
  const groups: QueueGroup[] = useMemo(() => {
    const items = selectedKey
      ? buildDayQueue({ clients, notes, day: dayFromKey(selectedKey), today, isPrivate })
      : live;
    return groupQueueByBucket(
      items.filter((item) => !hiddenIds.has(item.id)),
      today,
    );
  }, [selectedKey, live, clients, notes, today, isPrivate, hiddenIds]);

  const monthDots = useMemo(
    () => buildMonthDots({ clients, notes, today, viewDate }),
    [clients, notes, today, viewDate],
  );

  const nbaRows = useMemo(
    () =>
      buildNbaRows(nbaActions, isPrivate).filter((row) => !dismissedNba.has(row.action.id)),
    [nbaActions, isPrivate, dismissedNba],
  );

  // Resolved once here rather than per row: the queue, not the row, is the
  // thing that knows every client it mentions.
  const clientNames = useMemo(
    () => new Map(clients.map((c) => [c.id, maskName(c.name, isPrivate)])),
    [clients, isPrivate],
  );

  const spotlight = useMemo(() => houseViewSpotlight(), []);

  // `replace`, not `push` — narrowing a list shouldn't fill history with
  // entries the user has to click back through to leave the page.
  const updateQuery = useCallback(
    (updates: Record<string, string | null>) =>
      setQueryState(withQuery(PATH, searchParams, updates), "replace"),
    [searchParams],
  );

  /**
   * A reminder or a desk alert opens where it lives — in the modal every other
   * surface opens it in. A KYC row has no such thing: the record, its countdown
   * and its forms are the client's own KYC tab, so the row navigates there,
   * exactly as the bell's KYC rows do.
   */
  const handleOpen = useCallback(
    (item: QueueItem) => {
      if (item.dayItem) openDayItem(item.dayItem, item.day);
      else if (item.href) router.push(item.href);
    },
    [openDayItem, router],
  );

  const handleDone = useCallback(
    (noteId: string) => {
      const note = notes.find((n) => n.id === noteId);
      if (note) void editNote({ ...note, reminderDone: true });
    },
    [notes, editNote],
  );

  const handleHide = useCallback(
    (id: string) => setHiddenIds(new Set([...hiddenIds, id])),
    [hiddenIds, setHiddenIds],
  );

  const handleDismissNba = useCallback(
    (id: string) => setDismissedNba(new Set([...dismissedNba, id])),
    [dismissedNba, setDismissedNba],
  );

  const { totalAum } = useMemo(
    () => getClientTotals(clients ?? []),
    [clients],
  );
  const kycSoon = useMemo(
    () => live.filter((i) => !i.done && i.source === "kyc").length,
    [live],
  );

  const tiles: StatTile[] = useMemo(
    () => [
    {
      id: "clients",
      label: "จำนวน Client",
      value: clients?.length ?? 0,
      tone: "brand",
      icon: "users",
    },
    {
      id: "aum",
      label: "AUM รวมทั้งหมด",
      value: totalAum,
      tone: "violet",
      icon: "coins",
      formatValue: formatAumThb,
    },
    {
      id: "kyc",
      label: "KYC ใกล้หมดอายุ",
      value: kycSoon,
      tone: "warning",
      icon: "kyc",
    },
    ],
    [clients, totalAum, kycSoon],
  );

  if (isLoading) return <DashboardSkeleton />;

  const reminderCount = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <div className="flex flex-col gap-4 xl:gap-5">
        {/* Main + right rail — greeting and stat tiles live in the work column
            only, so their width matches the NBA card below. The calendar sits
            at the top of the right rail, level with the greeting, like the
            fitness-dashboard reference. */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 xl:gap-5 xl:items-start">
          <div className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-1 xl:row-start-1 row-start-2">
            <Card
              variant="default"
              className="gap-1 bg-primary-action-light border-border"
            >
              <h2 className="type-h5 font-bold text-primary-action">
                Hello, {NOTE_AUTHOR}
              </h2>
              <p className="text-[12.5px] text-primary-action/70">{thaiFullDate(today)}</p>
            </Card>

            <StatTiles tiles={tiles} />

            <Card variant="default" className="gap-4">
              <CardHeader
                title="Next Best Actions"
                count={nbaRows.length}
                link={{ href: "/client-hub", label: "Client 360" }}
              />
              <NbaPanel rows={nbaRows} onDismiss={handleDismissNba} />
              {nbaRows.length > NBA_ROW_LIMIT && (
                <p className="text-[11px] text-muted-foreground">
                  แสดง {NBA_ROW_LIMIT} จาก {nbaRows.length} ข้อเสนอ
                </p>
              )}
            </Card>

            <Card variant="default" className="gap-4">
              <CardHeader
                title="มุมมองล่าสุดจากบ้าน"
                link={{ href: "/insights", label: "House View" }}
              />
              <HouseViewSpotlight
                strategy={spotlight.strategy}
                products={spotlight.products}
              />
            </Card>
          </div>

          <aside className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-2 xl:row-start-1 row-start-1">
            <Card variant="default" className="gap-4">
              <MiniCalendar
                viewDate={viewDate}
                today={today}
                dots={monthDots}
                selectedKey={selectedKey}
                onSelect={(key) => updateQuery({ day: key })}
                onMonthChange={(delta) =>
                  updateQuery({
                    month: monthOffset + delta === 0 ? null : String(monthOffset + delta),
                  })
                }
              />
            </Card>

            <Card variant="default" className="gap-4">
              <CardHeader
                title={
                  selectedKey
                    ? `Reminders · ${thaiShortDate(dayFromKey(selectedKey))}`
                    : "Reminders"
                }
                count={reminderCount}
                action={
                  selectedKey ? (
                    <button
                      type="button"
                      onClick={() => updateQuery({ day: null })}
                      className="cursor-pointer rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      ดูทั้งหมด
                    </button>
                  ) : undefined
                }
              />
              <RemindersPanel
                groups={groups}
                clientNames={clientNames}
                filtered={Boolean(selectedKey)}
                variant="sidebar"
                onOpen={handleOpen}
                onDone={handleDone}
                onHide={handleHide}
                onClearFilter={() => updateQuery({ day: null })}
                onViewAll={
                  CALENDAR_ENABLED ? () => router.push("/calendar") : undefined
                }
              />
            </Card>
          </aside>
        </div>
      </div>

      {modals}
    </>
  );
}

/** "วันพฤหัสบดีที่ 24 กันยายน 2569" — Buddhist era, matching the dates House
 *  View and the asset summaries are authored in. */
function thaiFullDate(day: Date): string {
  return day.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** The same date where it has to share a line — "24 ก.ย. 2569". */
function thaiShortDate(day: Date): string {
  return day.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Mirrors the shape above, so the page doesn't jump when the data arrives.
 * Bound to `useClientsResource().isLoading`, which is `false` today and starts
 * going `true` the moment that hook is given a real endpoint — see
 * `@/hooks/use-api`.
 */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4 xl:gap-5">
        <div className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-1 xl:row-start-1 row-start-2">
          <Skeleton className="h-[76px] rounded-2xl" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[96px] rounded-2xl" />
            ))}
          </div>
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-52" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[168px] rounded-xl" />
            ))}
          </Card>
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-[116px] rounded-2xl" />
          </Card>
        </div>
        <aside className="min-w-0 flex flex-col gap-4 xl:gap-5 xl:col-start-2 xl:row-start-1 row-start-1">
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-[248px] rounded-xl" />
          </Card>
          <Card variant="default" className="gap-4">
            <Skeleton className="h-7 w-40" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[74px] rounded-xl" />
            ))}
          </Card>
        </aside>
      </div>
    </div>
  );
}
