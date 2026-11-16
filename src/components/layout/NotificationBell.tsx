"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BellIcon } from "@phosphor-icons/react";
import type { NotificationGroup, NotificationItem } from "@sarunyu/system-one";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * The header bell, in place of the DS `NavHeaderNotification`.
 *
 * Written here for one reason: the installed DS build declares
 * `NotificationGroup.label` but only ever uses it as a React key — it paints no
 * heading and no divider (checked its compiled source). Its panel is therefore
 * always one flat list, and the only way the app had to show which day a row
 * belongs to was to repeat the label inside every row's own `time` line, which
 * is where a timestamp goes and read as one.
 *
 * The trigger, panel and row shapes are kept to the DS's own measurements —
 * 24px glyph, 375px panel, 480px scroll cap, 40px icon column, `text-base`
 * title over `text-sm` description — so this reads as the same component with
 * the group headings the type always promised.
 *
 * ## One list, newest day first
 *
 * The panel lists what is already due and nothing else, dated by day: today,
 * then yesterday, then "2 วันก่อน" and back, running down the panel. Nothing
 * still ahead is shown. An earlier version put "กำลังจะถึง" and "เลยกำหนด"
 * behind counted rows above the list; "overdue" as one lump also hid how long
 * ago each thing was, which the day headings now say.
 */
export function NotificationBell({
  groups,
  emptyText,
  onItemClick,
  isLoading = false,
}: {
  /** One group per day, newest first — the panel prints them in this order. */
  groups: NotificationGroup[];
  emptyText: string;
  onItemClick?: (item: NotificationItem) => void;
  /**
   * The feeds behind `groups` haven't arrived. The panel shows skeleton rows,
   * the badge stays off (there is no count yet), and nothing is marked seen or
   * pruned — an empty feed mid-load must not read as "every alert cleared".
   */
  isLoading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const idsOf = (groups: NotificationGroup[]) =>
    groups.flatMap((g) => g.items.map((i) => i.id));

  const liveIds = useMemo(() => idsOf(groups), [groups]);

  /**
   * Which rows have already been looked at, kept in `localStorage` so it
   * survives a reload rather than resetting the badge every visit.
   *
   * By id, not by count: if one alert clears the same day another arrives the
   * count is unchanged, and a count-based check would call that "nothing new".
   * Ids also let a seen row stay in the list without its unread dot, instead of
   * the whole panel reading as new forever.
   *
   * `isKnown` prunes ids that are no longer raised, so the entry can't grow
   * without bound — and a client who becomes due again after a renewal comes
   * back as genuinely new.
   */
  const isKnown = useCallback(
    // Mid-load the live list is incomplete, so nothing can be judged gone.
    (id: string) => isLoading || liveIds.includes(id),
    [isLoading, liveIds],
  );
  const [seen, setSeen] = useStoredIds("notifications:seen", isKnown);

  /** The badge counts unseen rows — every row in the panel is already due. */
  const unseenCount = liveIds.filter((id) => !seen.has(id)).length;
  const showBadge = !isLoading && unseenCount > 0;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const hasRows = groups.some((g) => g.items.length > 0);
  const closePanel = () => setOpen(false);

  /**
   * The grouped rows. A row prints `item.time` only when it has one — the
   * shell sets it in the buckets that span several days, and leaves it empty
   * under "วันนี้"/"เมื่อวาน", where the heading is already the exact day.
   */
  const renderGroups = () =>
    groups.map((group, gi) => (
      <div key={group.label ?? gi}>
        {/* Sticky so the zone a row belongs to stays readable while its
            section scrolls past. `border-t` on every heading but the
            first is what separates one zone from the previous. */}
        <div
          className={`sticky top-0 z-[1] border-b border-border bg-[var(--bg-default-secondary)] px-4 py-1.5 ${
            gi > 0 ? "border-t" : ""
          }`}
        >
          <span className="text-xs leading-[20px] font-medium text-muted-foreground">
            {group.label}
          </span>
        </div>
        {group.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onItemClick?.(item);
              closePanel();
            }}
            className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
          >
            <span className="flex w-10 shrink-0 items-start justify-center py-0.5">
              {item.icon}
            </span>
            <span className="min-w-0 flex-1 space-y-1">
              <span className="flex items-start gap-2">
                <span className="line-clamp-2 min-w-0 flex-1 text-base leading-[28px] font-semibold text-foreground">
                  {item.title}
                </span>
                {item.time && (
                  <span className="shrink-0 whitespace-nowrap text-xs leading-[28px] text-muted-foreground">
                    {item.time}
                  </span>
                )}
              </span>
              <span className="line-clamp-3 block text-sm leading-[24px] text-muted-foreground">
                {item.description}
              </span>
            </span>
            {!seen.has(item.id) && (
              <span
                aria-hidden="true"
                className="mt-2 size-2 shrink-0 rounded-full bg-visual-red-default"
              />
            )}
          </button>
        ))}
      </div>
    ));

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={() => {
          // Opening is the acknowledgement — everything on screen at that
          // moment counts as seen, and only a row raised after this point
          // brings the badge back.
          if (!open && !isLoading) setSeen(new Set(liveIds));
          setOpen((v) => !v);
        }}
        className="relative flex size-6 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-0 text-icon-brand transition-colors hover:bg-hover-bg"
      >
        {/* Filled while something is waiting, outline once it isn't — the
            glyph and the count carry the same state, so they turn together
            rather than leaving a solid bell over an empty badge. */}
        <BellIcon size={24} weight={showBadge ? "fill" : "regular"} />
        {showBadge && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-0.5 -top-0.5 z-[1] flex h-3.5 min-h-3.5 min-w-3.5 items-center justify-center rounded-[60px] bg-visual-red-default px-[2.5px] text-on-visual-red"
          >
            <span className="text-xs leading-none font-normal tabular-nums">
              {unseenCount > 99 ? "99+" : unseenCount}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[375px] max-w-[calc(var(--vw)*100-2rem)] overflow-hidden rounded-xl border border-border bg-card shadow-lg"
        >
          <div className="max-h-[480px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {isLoading ? (
              <NotificationRowsSkeleton />
            ) : (
              <>
                {!hasRows && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</p>
                )}
                {renderGroups()}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Stands in for the panel's rows while the feeds load: same heading strip,
 *  icon column and title/time/description stack as a real row. */
function NotificationRowsSkeleton() {
  return (
    <div aria-busy="true">
      <div className="border-b border-border bg-[var(--bg-default-secondary)] px-4 py-1.5">
        <Skeleton className="h-4 w-12 my-0.5" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <span className="flex w-10 shrink-0 justify-center py-0.5">
            <Skeleton className="size-6 rounded-full" />
          </span>
          <div className="min-w-0 flex-1 space-y-2 py-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 flex-1 max-w-[160px]" />
              <Skeleton className="ml-auto h-4 w-14" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
