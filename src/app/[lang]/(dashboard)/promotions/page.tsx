"use client";

import { Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Chip, TabGroup } from "@sarunyu/system-one";
import { MegaphoneIcon } from "@phosphor-icons/react";
import { FadeIn } from "@/components/ui/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { useCampaigns } from "@/hooks/use-campaigns";
import { useCampaignStore } from "@/contexts/campaigns-context";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { setQueryState, withQuery } from "@/lib/query-state";
import { todayDateKey } from "../calendar/calendar-grid";
import { CampaignCard } from "./CampaignCard";
import { CampaignFilters, type DropdownFilters } from "./CampaignFilters";
import { PromotionsSkeleton } from "./PromotionsSkeleton";
import { PROMOTIONS_GRID_CSS } from "./promotions-grid-css";
import {
  filterCampaigns,
  hasActiveFilters,
  isNewCampaign,
  campaignStatus,
  SEAT_STATE_LABEL,
  SEAT_STATES,
  STATUS_LABEL,
  seatState,
  sortByEndingSoonest,
  type SeatState,
  type CampaignFilters as Filters,
  type CampaignTab,
} from "./campaign-data";
import type {
  CampaignFormat,
  CampaignProduct,
  CampaignStatus,
  ClientSegment,
} from "@/types/domain";

/**
 * Promotions & Events — what the firm is running, and who of this IC's clients
 * it is for.
 *
 * One column, full width, and short: a strip of counts, a tab per campaign
 * type, search beside a filter button, then the grid. No side rail and no
 * featured hero — both were here and both went, each for its own reason
 * recorded where it was removed.
 *
 * The grid is sorted ending-soonest-first, which is the only place a deadline
 * is expressed now that the cards are the design system's own and carry no
 * countdown of their own. Worth knowing before changing the sort.
 *
 * Every campaign's status and eligible count is derived in `campaign-data`
 * rather than here; see that module for why.
 *
 * ## View state
 *
 * Tab and filters live in the query string, per the app's convention: the tab
 * is `push`ed (it is a destination the back button should walk out of) and the
 * refinements are `replace`d (they would otherwise pile up history entries the
 * IC has to click through to leave the page). That also makes a filtered list a
 * shareable link, which a promotions desk asks for more than most.
 */
export default function PromotionsPage() {
  return (
    <Suspense fallback={<PromotionsSkeleton />}>
      <PromotionsPageInner />
    </Suspense>
  );
}

const PATH = "/promotions";

/**
 * Two tabs, one per campaign type, with no combined view — see `CampaignTab`
 * for why. Promotions lead because they are the larger half of the book and
 * the first word in the section's own name.
 */
const TABS: { id: CampaignTab; title: string }[] = [
  { id: "promotion", title: "โปรโมชัน" },
  { id: "event", title: "สัมมนา/อีเว้นท์" },
];

const DEFAULT_TAB: CampaignTab = "promotion";

/** Running first: it is what an IC can act on today. */
const PROMOTION_STATUSES: CampaignStatus[] = ["active", "upcoming", "ended"];

/** The default tab carries no `?tab=`, so a bare `/promotions` is canonical. */
function normalizeTab(value: string | null): CampaignTab {
  return TABS.some((t) => t.id === value) ? (value as CampaignTab) : DEFAULT_TAB;
}

function PromotionsPageInner() {
  const searchParams = useSearchParams();
  const { data: campaigns, isLoading } = useCampaigns();
  // Only the seat count reaches this page now — everything else the store
  // holds is read on a campaign's own detail page.
  const { seatsLeft } = useCampaignStore();

  // Anchored to the calendar day rather than a fresh `Date`, so the memos below
  // don't recompute on every render — same as the Dashboard.
  const todayKey = todayDateKey();
  const today = useMemo(() => new Date(todayKey), [todayKey]);

  const tab = normalizeTab(searchParams.get("tab"));

  /** The "ใหม่" chip — either tab, one of the same single-select row. */
  const newOnly = searchParams.get("new") === "1";

  /** Event tab only; a stray `?seats=` on the promotion tab is ignored. */
  const seats: SeatState | null =
    tab === "event" && SEAT_STATES.includes(searchParams.get("seats") as SeatState)
      ? (searchParams.get("seats") as SeatState)
      : null;

  const filters: Filters = useMemo(
    () => ({
      product: (searchParams.get("product") as CampaignProduct | null) ?? null,
      // Each tab reads only the axes its dialog offers, so a stale param from
      // the other tab can't narrow the list with no chip to show for it.
      status:
        tab === "promotion"
          ? ((searchParams.get("status") as Filters["status"]) ?? null)
          : null,
      segment: (searchParams.get("segment") as ClientSegment | null) ?? null,
      format:
        tab === "event"
          ? ((searchParams.get("format") as CampaignFormat | null) ?? null)
          : null,
      search: searchParams.get("q") ?? "",
    }),
    [searchParams, tab],
  );

  const updateQuery = useCallback(
    (updates: Record<string, string | null>, mode: "push" | "replace" = "replace") =>
      setQueryState(withQuery(PATH, searchParams, updates), mode),
    [searchParams],
  );

  const setFilters = useCallback(
    (next: Partial<Filters>) =>
      updateQuery({
        ...("product" in next ? { product: next.product ?? null } : {}),
        ...("status" in next ? { status: next.status ?? null } : {}),
        ...("segment" in next ? { segment: next.segment ?? null } : {}),
        ...("format" in next ? { format: next.format ?? null } : {}),
        // An empty search is the absence of one, not a `?q=` with nothing in it.
        ...("search" in next ? { q: next.search?.trim() ? next.search : null } : {}),
      }),
    [updateQuery],
  );

  const clearFilters = useCallback(
    () =>
      updateQuery({
        product: null,
        status: null,
        segment: null,
        format: null,
        q: null,
        seats: null,
        new: null,
      }),
    [updateQuery],
  );

  // ── Derivations ───────────────────────────────────────────────────────────

  /**
   * Everything the tab, search and dialog leave — before the status chips.
   * `status` is held back here because it is one of those chips now, and the
   * chip counts need the list it would be applied to.
   */
  const filtered = useMemo(
    () =>
      sortByEndingSoonest(
        filterCampaigns(campaigns, { tab, filters: { ...filters, status: null }, today }),
        today,
      ),
    [campaigns, tab, filters, today],
  );

  /**
   * The chip row over the grid: campaign status on the promotion tab, seat
   * state on the event tab. Each carries its count, so an empty bucket is
   * visible before it is clicked.
   */
  const statusChips = useMemo(() => {
    if (tab === "promotion") {
      return PROMOTION_STATUSES.map((value) => ({
        key: value,
        label: STATUS_LABEL[value],
        count: filtered.filter((c) => campaignStatus(c, today) === value).length,
        selected: filters.status === value,
        onClick: () =>
          updateQuery({ status: filters.status === value ? null : value, new: null }),
      }));
    }
    return SEAT_STATES.map((value) => ({
      key: value,
      label: SEAT_STATE_LABEL[value],
      count: filtered.filter(
        (c) => seatState(c, today, seatsLeft(c.id)) === value,
      ).length,
      selected: seats === value,
      onClick: () =>
        updateQuery({ seats: seats === value ? null : value, new: null }),
    }));
  }, [tab, filtered, today, filters.status, seats, seatsLeft, updateQuery]);

  const newCount = useMemo(
    () => filtered.filter((c) => isNewCampaign(c, today)).length,
    [filtered, today],
  );

  const visible = useMemo(() => {
    if (newOnly) return filtered.filter((c) => isNewCampaign(c, today));
    if (filters.status) {
      return filtered.filter((c) => campaignStatus(c, today) === filters.status);
    }
    if (seats) {
      return filtered.filter((c) => seatState(c, today, seatsLeft(c.id)) === seats);
    }
    return filtered;
  }, [filtered, newOnly, filters.status, seats, today, seatsLeft]);

  const narrowed = hasActiveFilters(filters) || seats !== null || newOnly;

  /**
   * How many campaigns a draft set of filters would leave.
   *
   * The dialog covers the list, so this is the only way for an IC to tell they
   * are about to narrow it to nothing. Measured against the tab and the search
   * box as they stand — those are not part of the draft, and a count that
   * ignored them would promise results the list won't show.
   */
  const previewCount = useCallback(
    (draft: DropdownFilters) =>
      filterCampaigns(campaigns, {
        tab,
        filters: { ...draft, search: filters.search },
        today,
      }).length,
    [campaigns, tab, filters.search, today],
  );

  // Arriving from a campaign detail via the breadcrumb otherwise inherits that
  // page's scroll offset and opens partway down.
  useScrollTopOnChange([]);

  if (isLoading) return <PromotionsSkeleton />;

  return (
    <>
      <style>{PROMOTIONS_GRID_CSS}</style>
      <div className="flex flex-col gap-4 xl:gap-5">
        {/* Tabs, search and the filter button share one row — see
            `CampaignFilters`, which owns that row and the chips under it. */}
        <CampaignFilters
          tabs={
            <TabGroup
              items={TABS.map((t) => ({ id: t.id, title: t.title }))}
              activeId={tab}
              // `push`: a tab is a destination, and the back button should walk
              // out of it rather than off the page.
              onChange={(id) =>
                updateQuery(
                  // Status, format and the seat chip each belong to one tab;
                  // don't carry them into the other.
                  {
                    tab: id === DEFAULT_TAB ? null : id,
                    status: null,
                    format: null,
                    seats: null,
                    new: null,
                  },
                  "push",
                )
              }
              size="md"
            />
          }
          tab={tab}
          filters={filters}
          onChange={setFilters}
          // The dialog's axes only — the status chips over the grid keep theirs.
          onClear={() =>
            updateQuery({ product: null, segment: null, format: null, q: null })
          }
          previewCount={previewCount}
        />

        <div className="flex flex-wrap gap-2">
          <Chip
            label={`ทั้งหมด (${filtered.length})`}
            type="single"
            size="small"
            selected={!newOnly && statusChips.every((chip) => !chip.selected)}
            onClick={() => updateQuery({ status: null, seats: null, new: null })}
          />
          <Chip
            label={`ใหม่ (${newCount})`}
            type="single"
            size="small"
            selected={newOnly}
            onClick={() =>
              updateQuery({ new: newOnly ? null : "1", status: null, seats: null })
            }
          />
          {statusChips.map((chip) => (
            <Chip
              key={chip.key}
              label={`${chip.label} (${chip.count})`}
              type="single"
              size="small"
              selected={chip.selected}
              onClick={chip.onClick}
            />
          ))}
        </div>

        {/* Keyed on the tab alone. It used to carry `visible.length` too, which
            changes on almost every keystroke in the search box — so the list
            remounted and replayed its fade letter by letter, which read as a
            flicker. Switching tab is a view swap worth animating; filtering one
            down is the same view with fewer rows in it. */}
        <FadeIn key={tab}>
          {visible.length === 0 ? (
            <EmptyState
              icon={
                <MegaphoneIcon
                  size={40}
                  className="text-[var(--text-default-placeholder)]"
                />
              }
              title={emptyTitle(tab, narrowed)}
              body={emptyBody(tab, narrowed)}
              action={
                narrowed
                  ? { label: "ล้างตัวกรอง", onClick: clearFilters }
                  : undefined
              }
            />
          ) : (
            <div className="promotions-grid grid grid-cols-1 gap-4 sm:grid-cols-2">
              {visible.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  seatsLeft={seatsLeft(campaign.id)}
                  isNew={isNewCampaign(campaign, today)}
                />
              ))}
            </div>
          )}
        </FadeIn>
      </div>
    </>
  );
}

function emptyTitle(tab: CampaignTab, narrowed: boolean): string {
  if (narrowed) return "ไม่พบแคมเปญที่ค้นหา";
  return tab === "promotion" ? "ยังไม่มีโปรโมชัน" : "ยังไม่มีสัมมนา/อีเว้นท์";
}

function emptyBody(tab: CampaignTab, narrowed: boolean): string {
  if (narrowed) {
    // Scoped to the tab now that there is no combined view to fall back to —
    // telling someone to clear filters "to see everything" would promise a
    // list that no longer exists.
    return tab === "promotion"
      ? "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูโปรโมชันทั้งหมด"
      : "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูสัมมนา/อีเว้นท์ทั้งหมด";
  }
  return "เมื่อมีแคมเปญใหม่จากส่วนกลาง จะแสดงที่นี่";
}
