import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { CLIENT_TAB_ITEMS } from "./client-tabs";
import { OrdersPanelSkeleton } from "../../orders/OrdersPanelSkeleton";

/** Matches `Card variant="default"` shell (`bg-card rounded-[8px] p-4`) exactly. */
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col bg-card text-foreground shadow-card rounded-[8px] p-4 gap-4">
      {children}
    </div>
  );
}

/** Matches CurrentAllocationSection: donut circle + 2-col grid of stat tiles. */
function AllocationSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center">
      <Skeleton className="rounded-full shrink-0 mx-auto sm:mx-0 w-[180px] h-[180px]" />
      <div className="grid grid-cols-2 gap-2 flex-1 min-w-0 w-full">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-xl p-3 bg-[var(--bg-default-secondary)]">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Matches TopHoldingsSection's table: Asset / Market Value / P&L / % Portfolio. */
function HoldingsTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 pb-2 border-b border-border">
        <Skeleton className="h-3 w-16 flex-1" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-1.5">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Matches the Recent Activity timeline: dot + 3 lines, repeated. */
function ActivityTimelineSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 3 }).map((_, i, arr) => (
        <div key={i} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0 w-3">
            <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" />
            {i < arr.length - 1 && <div className="w-px flex-1 bg-border my-1.5" />}
          </div>
          <div className={`flex flex-col gap-1.5 ${i < arr.length - 1 ? "pb-5" : ""}`}>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A list of rows in a card — Call Log, and the Reminders tab. */
export function ListTabSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <CardShell>
      <Skeleton className="h-5 w-32" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </CardShell>
  );
}

/** The Notes tab: the "add" bar, then a grid of note cards. */
export function NotesTabSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** KYC and Assets: two columns of label/value cards. */
export function DetailCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, c) => (
        <CardShell key={c}>
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </CardShell>
      ))}
    </div>
  );
}

/** The Overview tab body — left/right columns, same ratio as the real page. */
function OverviewBodySkeleton() {
  return (
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start">
        <div className="flex-[3] min-w-0 flex flex-col gap-6">
          <CardShell>
            <Skeleton className="h-5 w-40" />
            <AllocationSkeleton />
          </CardShell>
          <CardShell>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <HoldingsTableSkeleton />
          </CardShell>
        </div>
        <div className="flex-[2] min-w-0 flex flex-col gap-5">
          <CardShell>
            <Skeleton className="h-5 w-28" />
            <div className="flex flex-col items-center gap-2 py-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-3 w-32" />
            </div>
          </CardShell>
          <CardShell>
            <Skeleton className="h-5 w-32" />
            <ActivityTimelineSkeleton />
          </CardShell>
        </div>
      </div>
  );
}

/** The body for whichever tab is open, so a reload on `?tab=notes` doesn't
 *  flash an Overview silhouette before landing on Notes. */
function TabBodySkeleton({ tab }: { tab: string }) {
  switch (tab) {
    case "orders":
      return (
        <OrdersPanelSkeleton withCreate />
      );
    case "notes":
      return <NotesTabSkeleton />;
    case "call-log":
    case "reminders":
      return <ListTabSkeleton />;
    case "kyc":
    case "assets":
      return <DetailCardsSkeleton />;
    default:
      return <OverviewBodySkeleton />;
  }
}

/** Full-page placeholder for the Client 360 full-profile — mirrors the real
 *  sticky header (avatar, identity, contact pills, KPIs, tabs) and the body
 *  of the tab that is open, so loading and loaded states share a silhouette.
 *  This is the FIRST-load state — the tab strip is bars too. */
export function ClientProfileSkeleton({ tab = "overview" }: { tab?: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Sticky identity + KPI bar + tabs */}
      <div className="flex flex-wrap md:flex-nowrap items-start justify-between gap-4 lg:gap-8 py-5">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-start">
            <Skeleton className="rounded-full shrink-0 w-16 h-16" />
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        </div>
        <div className="flex items-center gap-8 shrink-0">
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>

      {/* First load: nothing on the page is clickable yet, tabs included.
          Once the profile has loaded the real tabs take over, and a tab whose
          own data is slow skeletons its content only (see the page). */}
      <div className="border-b border-border">
        <TabsSkeleton count={CLIENT_TAB_ITEMS.length} />
      </div>

      <TabBodySkeleton tab={tab} />
    </div>
  );
}
