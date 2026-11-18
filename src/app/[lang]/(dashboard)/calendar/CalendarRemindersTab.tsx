"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BellIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react";
import type { Client, Note } from "@/types/domain";
import { EmptyState } from "@/components/ui/empty-state";
import { kycExpiry, kycExpiryLabelTh } from "../client/[id]/client-detail-data";
import { kycCheckpointTone } from "../use-kyc-notification-feed";
import { addDays, addMonths, dayFromKey, dayKey, dayOffset } from "./calendar-grid";
import { groupDayItems, type DayItem } from "./day-items";
import { HolderContactOverlay } from "./HolderContact";
import { ReminderDayStrip } from "./ReminderDayStrip";
import { ReminderPreviewRow } from "./reminder-preview";
import { useIsoLayoutEffect } from "@/hooks/use-iso-layout-effect";
import { pageZoom } from "@/lib/page-zoom";

/** How far either side of today this tab reaches — the same three months the
 *  mini calendar can point at. Notes ignore it (see `buildAllReminders`); it
 *  only decides how much of the market and desk feeds is here. */
const MONTHS_EITHER_SIDE = 1;

/** The scrolling list's own top padding (`p-4`), for parking a day inside it
 *  rather than against its edge. See `scrollToDay`. */
const SCROLL_PAD = 16;

type ReminderRowBase = {
  /** Unique across both sources — the React key. */
  id: string;
  title: string;
  /** The row's second line: who it concerns, or what is expiring. */
  meta?: string;
  day: Date;
  daysUntil: number;
};

/**
 * One row of the timeline.
 *
 * Two shapes rather than one, split on what a click does: a calendar row opens
 * its record in a modal, a KYC expiry opens the client's contact card. Exactly
 * the split `QueueItem` makes on the Dashboard with its `dayItem | href`, and
 * for the same reason — KYC has no calendar row of its own, it is derived from
 * the client's record, so there is nothing for a day modal to show.
 */
export type ReminderRow =
  | (ReminderRowBase & { source: "day"; item: DayItem })
  | (ReminderRowBase & { source: "kyc"; clientId: string; tone: string });

/** KYC first inside a day. It is the only deadline here with a rule behind it;
 *  the rest is the exchange's calendar and the desk's. Mirrors `SOURCE_WEIGHT`
 *  in `dashboard-data`, which puts `kyc` at 0 for the same reason. */
const SOURCE_RANK: Record<ReminderRow["source"], number> = { kyc: 0, day: 1 };

export type ReminderDay = { key: string; day: Date; daysUntil: number; items: ReminderRow[] };

/**
 * Every reminder this tab lists.
 *
 * ## Two sources, two different reaches
 *
 * `groupDayItems` treats its rows differently and the difference is the shape
 * of this list. A note carries its own `reminderAt`, so one call returns every
 * note reminder whatever month it is anchored to. The market and desk feeds are
 * asked for a month at a time (see `mock-market-feed`), so the anchor decides
 * how much of them comes back — hence the three passes, and hence notes being
 * passed only on the first, where they have already all arrived.
 *
 * An earlier version walked three months either way. It produced 224 rows for
 * 32 facts: the mock generates its seeds *into* whichever month it is asked
 * for, so "SET Outlook 2027" came back seven times under seven ids, and they
 * could not be deduplicated because they are genuinely different rows. Against
 * a real feed a wider window would be real history — but a screen that reads as
 * seven copies of itself is not something to ship on that promise.
 *
 * ## Nothing is filtered out
 *
 * A tempting rule is to keep only the rows that name a client, which would cut
 * this list by two thirds. It is the wrong rule: today's single row on the
 * Dashboard card is `XN : LHHOTEL`, which no one in the book holds, and a
 * "ดูทั้งหมด" that lands on a list missing the row you were looking at is worse
 * than a long list. The card and this tab read the same data, so they agree by
 * construction rather than by luck.
 *
 * Ticked-off reminders stay too. The card asks the narrower question, what is
 * still owed, so it drops them. This tab is the record: the reminder you
 * finished last week is the one you go looking for when someone asks whether it
 * was done, and a list that quietly omits it cannot answer that.
 *
 * ## KYC expiries are here, on their expiry day
 *
 * They are not calendar rows — `day-items` deliberately keeps its three sources
 * closed, and a KYC date is derived from the client's record rather than
 * written on a day. But on a list of dated things it is the same kind of thing:
 * a deadline that passes whether or not anyone looks. The header bell has
 * merged the two feeds for exactly that reason, and so does the Dashboard's
 * queue; this is the third surface to reach the same conclusion.
 *
 * Ungated, unlike the Dashboard's card. That one applies the bell's checkpoint
 * and its 15-day horizon, because it is asking "what is ringing this morning".
 * This tab asks "what falls on which day", and a date does not stop being a
 * date because it is still three weeks out — so client 110002, twenty-five days
 * away and invisible on the Dashboard, has a row here.
 */
export function buildAllReminders(
  notes: Note[],
  clients: Client[],
  clientNames: Map<string, string>,
  today: Date,
): ReminderRow[] {
  const rows: ReminderRow[] = [];

  for (let offset = -MONTHS_EITHER_SIDE; offset <= MONTHS_EITHER_SIDE; offset += 1) {
    const map = groupDayItems(
      offset === -MONTHS_EITHER_SIDE ? notes : [],
      addMonths(today, offset),
    );
    for (const [key, items] of map) {
      const day = dayFromKey(key);
      const daysUntil = dayOffset(day, today);
      for (const item of items) {
        rows.push({
          source: "day",
          id: `${item.id}:${key}`,
          title: item.title,
          meta: clientLine(item, clientNames),
          day,
          daysUntil,
          item,
        });
      }
    }
  }

  for (const client of clients) {
    const expiry = kycExpiry(client.id);
    // No record at all (the roster carries one such client), or a `nextReview`
    // that would not parse — either way there is no day to put a row on.
    if (!expiry || expiry.daysLeft === null) continue;
    // Held to the same window as the feeds above. A KYC date carries itself the
    // way a note does and needs no month anchor, but this list says it covers
    // three months around today, and one row eleven weeks below the last one
    // would be a different promise.
    if (Math.abs(expiry.daysLeft) > MONTHS_EITHER_SIDE * 31) continue;

    rows.push({
      source: "kyc",
      id: `kyc:${client.id}`,
      // The name leads, because that is what a KYC row is about; the sentence
      // under it is the same `kycExpiryLabelTh` the Dashboard card prints, so
      // the two surfaces word the same deadline the same way.
      title: clientNames.get(client.id) ?? client.id,
      meta: kycExpiryLabelTh(client.id) ?? undefined,
      day: addDays(today, expiry.daysLeft),
      daysUntil: expiry.daysLeft,
      clientId: client.id,
      tone: kycCheckpointTone(expiry.daysLeft),
    });
  }

  return rows;
}

/**
 * The rows cut into the days they fall on, oldest first.
 *
 * One unbroken run rather than the four buckets an earlier version grouped by.
 * Buckets answer "what is late"; this screen is a timeline you walk, and today
 * is a position in it rather than a category — which is what makes scrolling up
 * into last month and down into next month one continuous gesture.
 *
 * Today is always in the result, empty if nothing falls on it. It is the thing
 * the view is anchored to and the thing the jump button returns to, and a
 * landmark that disappears on the quiet days is not a landmark. It also gives
 * the reader the one answer a list of other days cannot: nothing today.
 */
function byDay(rows: ReminderRow[], today: Date): ReminderDay[] {
  // Stable sort, so calendar rows sharing a day keep the order `groupDayItems`
  // put them in — exchange facts, then desk events, then the user's own notes.
  // `SOURCE_RANK` only has to lift KYC above all three.
  const sorted = [...rows].sort(
    (a, b) =>
      a.day.getTime() - b.day.getTime() || SOURCE_RANK[a.source] - SOURCE_RANK[b.source],
  );

  const days: ReminderDay[] = [];
  for (const row of sorted) {
    const key = dayKey(row.day);
    const last = days[days.length - 1];
    if (last && last.key === key) last.items.push(row);
    else days.push({ key, day: row.day, daysUntil: row.daysUntil, items: [row] });
  }

  const todayKey = dayKey(today);
  if (!days.some((d) => d.key === todayKey)) {
    const at = days.findIndex((d) => d.day.getTime() > today.getTime());
    const entry: ReminderDay = { key: todayKey, day: today, daysUntil: 0, items: [] };
    if (at === -1) days.push(entry);
    else days.splice(at, 0, entry);
  }

  return days;
}

/** "Fri, 09 Oct 2026" — the same `en-GB` the rest of the app dates things in
 *  (`formatDayOnly`), plus the weekday, which is what makes a heading scannable
 *  when twenty of them are stacked. An explicit locale, not the reader's: the
 *  server renders this too, and a heading that disagreed between the two
 *  renders would be a hydration error. */
function dayHeading(day: Date): string {
  return day.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * How far off, in words.
 *
 * `relativeDayLabel` in `calendar-grid` says "3 days overdue", which is the
 * Dashboard's reading and the wrong one here. Nothing on this screen is late:
 * half these rows are exchange facts, and an XD that has already gone has not
 * slipped, it has happened. This is a record of what fell on which day.
 */
function relativeDay(daysUntil: number): string {
  if (daysUntil === 1) return "พรุ่งนี้";
  if (daysUntil === -1) return "เมื่อวาน";
  return daysUntil > 0 ? `อีก ${daysUntil} วัน` : `${-daysUntil} วันที่แล้ว`;
}

/**
 * The line above a day's rows: its date, and how far off it is.
 *
 * Today reads in the primary colour with a filled badge rather than the muted
 * caption every other day gets: on a timeline of three months of dates, that is
 * what marks the reader's position. The Dashboard's Reminders card wants none of
 * this — it is always one day, so it writes "วันนี้" and stops.
 */
function ReminderDayHeading({ day, daysUntil }: { day: Date; daysUntil: number }) {
  const isToday = daysUntil === 0;
  return (
    <div className="flex items-baseline gap-2">
      <p
        className={
          isToday
            ? "type-body-2 font-bold text-primary-action"
            : "type-caption font-semibold text-muted-foreground"
        }
      >
        {dayHeading(day)}
      </p>
      {isToday ? (
        <span className="rounded-md bg-primary-action px-1.5 py-0.5 text-meta font-semibold leading-[20px] text-on-primary-action">
          วันนี้
        </span>
      ) : (
        <span className="type-caption text-[var(--text-default-placeholder)]">
          {relativeDay(daysUntil)}
        </span>
      )}
    </div>
  );
}

/**
 * The Calendar page's second view: the same reminders the grid places on days,
 * read as one list instead.
 *
 * A month grid answers "what is on the 14th"; this answers "what have I got",
 * which is a different question and the reason both are here.
 *
 * ## Today is the origin, not the top
 *
 * The list holds three months and opens parked on today, with last month
 * sitting above the fold for anyone who scrolls up to it. Two things follow
 * from that and neither is optional. It re-parks on every entry, because a
 * timeline that reopened wherever it was left would need reading before it
 * could be used. And once today has scrolled out of the viewport a button
 * offers the way back — placed above or below according to which way today
 * went, so the button points where it will take you.
 */
export function CalendarRemindersTab({
  notes,
  clients,
  today,
  clientNames,
  onOpen,
}: {
  notes: Note[];
  /** For the KYC expiries, which are read off each client's own record. */
  clients: Client[];
  today: Date;
  clientNames: Map<string, string>;
  onOpen: (item: DayItem, day: Date) => void;
}) {
  const days = useMemo(
    () => byDay(buildAllReminders(notes, clients, clientNames, today), today),
    [notes, clients, clientNames, today],
  );

  /** The client whose contact card is open, from a KYC row. A row opens the
   *  person, not the record — same call the Dashboard's KYC card makes, with
   *  the same reasoning: the row already says what the deadline is, and what it
   *  does not say is how to reach them about it. */
  const [contact, setContact] = useState<{ clientId: string; name: string } | null>(null);
  const total = useMemo(() => days.reduce((n, d) => n + d.items.length, 0), [days]);

  const scrollRef = useRef<HTMLDivElement>(null);
  /** Every day block by key, so the strip above can send the reader to any of
   *  them and the jump button can find today among them. */
  const dayRefs = useRef(new Map<string, HTMLDivElement>());
  /** Which way today went, or `null` while it is on screen. */
  const [jump, setJump] = useState<"up" | "down" | null>(null);
  /** The day at the top of the view, which the strip marks. */
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const todayKey = dayKey(today);

  const scrollToDay = useCallback(
    (key: string, behavior: ScrollBehavior) => {
      const scroller = scrollRef.current;
      const el = dayRefs.current.get(key);
      if (!scroller || !el) return;

      // Measured rather than read off `offsetTop`, which is relative to the
      // nearest *positioned* ancestor — the wrapper, not the scroller.
      // Screen pixels, converted to the page's own for `scrollTop` (see `pageZoom`).
      const delta =
        (el.getBoundingClientRect().top - scroller.getBoundingClientRect().top) / pageZoom();

      // How far down to leave it, and the answer differs by day. Today's block
      // paints its own band with its own padding inside, so it parks against
      // the edge and the colour starts at the top of the view — a gap above it
      // showed a strip of the previous day's white and read as not quite at the
      // top. Every other day is bare type on the page, and the scroller's `p-4`
      // is the only thing between its heading and the strip above; park those
      // flush and the heading sits on the border.
      const pad = key === todayKey ? 0 : SCROLL_PAD;
      scroller.scrollTo({ top: scroller.scrollTop + delta - pad, behavior });
    },
    [todayKey],
  );

  /**
   * Bumped every time the reader is *sent* to today rather than scrolling
   * there, so the strip above can centre the day instead of nudging it just
   * into view. A nonce rather than a boolean: two presses in a row are two
   * jumps, and a flag that was already `true` would only arm the first.
   */
  const [jumpNonce, setJumpNonce] = useState(0);
  const jumpToToday = useCallback(() => {
    scrollToDay(todayKey, "smooth");
    setJumpNonce((n) => n + 1);
  }, [scrollToDay, todayKey]);

  /**
   * Park on today, once, before the first paint.
   *
   * Keyed on `days` rather than `[]` because the notes context can arrive after
   * mount, and anchoring to a list that is about to grow above today would put
   * the reader in the wrong place. The ref then stops it firing again, so the
   * next re-render does not yank a reader who has scrolled away.
   */
  const anchored = useRef(false);
  useIsoLayoutEffect(() => {
    if (anchored.current || !dayRefs.current.has(todayKey)) return;
    anchored.current = true;
    scrollToDay(todayKey, "auto");
  }, [days, todayKey, scrollToDay]);

  /**
   * Which day is at the top, for the strip to mark.
   *
   * `rootMargin` shrinks the observer's view to the top fifth of the list, so
   * "in view" means "at the top" rather than "on screen at all" — otherwise
   * eight days qualify at once and the strip picks whichever the browser
   * reported last. The first of the remaining entries wins, since they arrive
   * in document order.
   */
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const observer = new IntersectionObserver(
      () => {
        const top = scroller.getBoundingClientRect().top;
        let best: { key: string; distance: number } | null = null;
        for (const [key, el] of dayRefs.current) {
          const rect = el.getBoundingClientRect();
          // Blocks that have already scrolled past still count while their
          // bottom is below the fold — that is the one still being read.
          if (rect.bottom <= top) continue;
          const distance = rect.top - top;
          if (!best || distance < best.distance) best = { key, distance };
        }
        setActiveKey(best?.key ?? null);
      },
      { root: scroller, threshold: 0, rootMargin: "0px 0px -80% 0px" },
    );
    for (const el of dayRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [days]);

  useEffect(() => {
    const scroller = scrollRef.current;
    const el = dayRefs.current.get(todayKey);
    if (!scroller || !el) return;
    // Fires once on `observe`, so the button's first state comes from the
    // observer rather than from a `setState` during the effect itself.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setJump(null);
          return;
        }
        const rootTop = entry.rootBounds?.top ?? scroller.getBoundingClientRect().top;
        setJump(entry.boundingClientRect.top < rootTop ? "up" : "down");
      },
      { root: scroller, threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [days, todayKey]);

  if (total === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <EmptyState
          icon={<BellIcon size={40} weight="duotone" className="text-[var(--text-default-placeholder)]" />}
          title="ยังไม่มีรายการเตือน"
          body="รายการเตือนจากโน้ต ปฏิทินตลาด และกิจกรรมของเดสก์จะมารวมกันที่นี่"
        />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <ReminderDayStrip
        days={days}
        today={today}
        activeKey={activeKey}
        centreKey={todayKey}
        centreNonce={jumpNonce}
        onSelect={(key) => scrollToDay(key, "smooth")}
      />

      {/* Its own positioning context. The button is placed against the list
          it scrolls; anchored to the outer box instead, `top-3` measured from
          the top of the day strip and put the button on top of the dates. */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          {days.map((d) => {
            const isToday = d.daysUntil === 0;
            return (
              <div
                key={d.key}
                ref={(el) => {
                  const map = dayRefs.current;
                  if (el) map.set(d.key, el);
                  else map.delete(d.key);
                }}
                // A band across the full width, heading included, rather than a
                // tinted card: the highlight is the day, and the date is part of
                // the day. `-mx-4` cancels the scroller's own padding so the
                // colour reaches both edges, `px-4` puts the content back where
                // every other day's is, so nothing shifts as you scroll past it.
                className={`flex flex-col gap-2 ${
                  isToday ? "-mx-4 bg-[var(--fill-p1-100)] px-4 py-3" : ""
                }`}
              >
                <ReminderDayHeading day={d.day} daysUntil={d.daysUntil} />
                {/* White on the band, where every other day is grey on white.
                    The grey would all but vanish against the tint, and the point
                    of a card is that the rows sit on something. */}
                <div
                  className={`flex flex-col divide-y divide-black/[0.05] overflow-hidden rounded-xl ${
                    isToday ? "bg-card" : "bg-[var(--bg-default-secondary)]"
                  }`}
                >
                  {d.items.length === 0 ? (
                    <p className="type-caption p-3 text-muted-foreground">ไม่มีรายการวันนี้</p>
                  ) : (
                    d.items.map((row) => (
                      <ReminderPreviewRow
                        key={row.id}
                        title={row.title}
                        meta={row.meta}
                        dayIso={row.day.toISOString()}
                        dueToday={isToday}
                        onClick={() =>
                          row.source === "day"
                            ? onOpen(row.item, row.day)
                            : setContact({ clientId: row.clientId, name: row.title })
                        }
                        // A card, not a bell: nobody set an alarm on a KYC
                        // record, it expires on its own. Tinted off the same ramp
                        // the header bell and the Dashboard card use for the same
                        // countdown, so one deadline is one colour everywhere.
                        icon={
                          row.source === "kyc" ? (
                            <IdentificationCardIcon size={18} weight="duotone" />
                          ) : undefined
                        }
                        iconToneClassName={row.source === "kyc" ? row.tone : undefined}
                        flush
                        // The heading above says which day. Repeating it on every
                        // row under it is the noise the heading removed.
                        showDate={false}
                        // One step past the band rather than back toward it: at
                        // `p1-100` the hover would land on exactly the band's own
                        // colour and the card would vanish under the cursor. Grey
                        // is out for the same reason it is out of the band —
                        // a different family on a tinted surface.
                        hoverClassName={
                          isToday
                            ? "hover:bg-[var(--fill-p1-200)]!"
                            : "hover:bg-[var(--fill-gray-200)]!"
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {jump && (
          <button
            type="button"
            onClick={jumpToToday}
            className={`absolute left-1/2 z-10 -translate-x-1/2 ${
              jump === "up" ? "top-3" : "bottom-3"
            } inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-primary-action px-3 py-1.5 text-label font-semibold text-on-primary-action shadow-[0px_4px_12px_rgba(0,0,0,0.18)] transition-colors hover:bg-primary-action-hover`}
          >
            {jump === "up" ? (
              <ArrowUpIcon size={14} weight="bold" />
            ) : (
              <ArrowDownIcon size={14} weight="bold" />
            )}
            ไปยังวันปัจจุบัน
          </button>
        )}
      </div>

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

/** Whose reminder it is — the one thing a cross-client list has to say that a
 *  single client's own tab never does. */
function clientLine(item: DayItem, clientNames: Map<string, string>): string | undefined {
  if (item.clientIds.length === 0) return undefined;
  return item.clientIds.map((id) => clientNames.get(id) ?? id).join(", ");
}
