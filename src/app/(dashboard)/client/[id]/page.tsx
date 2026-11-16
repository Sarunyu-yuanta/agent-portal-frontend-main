"use client";

import { Suspense, use, useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Avatar, Card, TabGroup } from "@sarunyu/system-one";
import { ClientAssetSidebarContent } from "@/components/ClientAssetSidebarContent";
import { ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { mockClients, mockClientDetails } from "@/lib/mock-data";
import {
  useClientAssetAccounts,
  useClientCallLogs,
  useClientProfile,
  useClientsResource,
} from "@/hooks/use-api";
import { ClientProfileSkeleton, DetailCardsSkeleton } from "./ClientProfileSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials, formatAumThb, formatPlYtdPct } from "@/lib/client-utils";
import { setQueryState } from "@/lib/query-state";
import { useSetHeaderSlot } from "../../header-slot-context";
import { usePageBreadcrumb } from "../../page-breadcrumbs";
import { ResponsiveBreadcrumb } from "@/components/layout/ResponsiveBreadcrumb";
import { TierBadge } from "@/components/ui/tier-badge";
import { ContactChips } from "../../calendar/HolderContact";
import { LiabilitiesDetailModal } from "@/components/LiabilitiesDetailModal";
import type { LiabilitiesDetail } from "@/data/liabilities-details";
import {
  clientDetailById,
  kycExpiryLabelTh,
  type SortDir,
  type HoldingsSortKey,
} from "./client-detail-data";
import { CLIENT_TABS, CLIENT_TAB_ITEMS } from "./client-tabs";
import { CallLogTable } from "./ClientSections";
import { ClientNotesTab } from "./ClientNotesTab";
import { FadeIn } from "@/components/ui/fade-in";
import { ClientRemindersTab } from "./ClientRemindersTab";
import { ClientOrdersTab } from "@/app/(dashboard)/orders/ClientOrdersTab";
import { KycTab } from "./KycTab";
import { OverviewTab } from "./OverviewTab";

export default function ClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // Keyed remount on client id — this page reuses the same component instance
  // across in-app navigations between different clients (same route segment),
  // so header-collapse / sort state would otherwise leak between clients.
  return (
    <Suspense fallback={null}>
      <ClientPageInner key={id} id={id} />
    </Suspense>
  );
}

function ClientPageInner({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { isPrivate } = usePrivacy();
  const { data: clients, isLoading } = useClientsResource();

  // Same source as the desktop top-bar breadcrumb — this page renders its own
  // only so it can live inside the sticky identity bar.
  const breadcrumb = usePageBreadcrumb(pathname, { clients, isPrivate });

  const client = clients.find((c) => c.id === id) ?? clients[0] ?? mockClients[0];
  const maskedClientName = maskName(client.name, isPrivate);
  const detail = clientDetailById[client.id] ?? mockClientDetails["1"];

  // Page tab state — URL-owned, so returning to this profile (browser back or
  // the sidebar's Client 360 entry) comes back to the sub-tab left open.
  // `replace`: sub-tabs are views of one profile, not stops worth unwinding.
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && CLIENT_TABS.includes(tabParam) ? tabParam : "overview";
  const setActiveTab = (tab: string) =>
    setQueryState(`/client/${id}?tab=${tab}`, "replace");

  // Holdings sort state
  const [holdingsSortDir, setHoldingsSortDir] = useState<SortDir>("none");
  const [holdingsSortKey, setHoldingsSortKey] = useState<HoldingsSortKey>(null);

  // Per-tab data: each tab that would be its own endpoint waits on its own
  // resource, so a slow one skeletons that tab's content, not the page.
  const { data: callLogs, isLoading: callLogsLoading } = useClientCallLogs(client.id);
  const { data: profile, isLoading: profileLoading } = useClientProfile(client.id);
  const { data: assetAccounts, isLoading: assetsLoading } = useClientAssetAccounts(client.id);
  const kycExpiryLabel = kycExpiryLabelTh(client.id);
  const [liabilitiesOpen, setLiabilitiesOpen] = useState(false);
  const [liabilitiesData, setLiabilitiesData] = useState<{ amount: string; detail: LiabilitiesDetail } | null>(null);

  const setHeaderSlot = useSetHeaderSlot();

  // Compact sticky header on scroll
  const [scrolled, setScrolled] = useState(false);
  const collapsedRef = useRef(false);
  const lockUntilRef = useRef(0);
  const quickContactRef = useRef<HTMLDivElement>(null);

  // Force the initial scroll offset to 0 — with scroll-snap + a negative-margin
  // bleed container, some browsers land on a non-zero offset on first paint.
  useEffect(() => {
    if (quickContactRef.current) quickContactRef.current.scrollLeft = 0;
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const onScroll = () => {
      const now = Date.now();
      if (now < lockUntilRef.current) return; // ignore events during transition
      const top = main.scrollTop;
      const remaining = main.scrollHeight - main.clientHeight - top;
      if (!collapsedRef.current && top > 50 && remaining > 100) {
        collapsedRef.current = true;
        lockUntilRef.current = now + 400; // block re-triggers for 400ms (> 300ms transition)
        setScrolled(true);
      } else if (collapsedRef.current && top <= 8) {
        collapsedRef.current = false;
        lockUntilRef.current = now + 400;
        setScrolled(false);
      }
    };
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, []);

  // Reset header + scroll position on tab change
  const [prevTab, setPrevTab] = useState(activeTab);
  if (prevTab !== activeTab) {
    setPrevTab(activeTab);
    setScrolled(false);
  }
  useEffect(() => {
    collapsedRef.current = false;
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
  }, [activeTab]);

  useEffect(() => {
    setHeaderSlot(null);
    return () => setHeaderSlot(null);
  }, [scrolled, activeTab, setHeaderSlot]);

  const tabStrip = (
    <div className="transparent-tabs scrollable-tabs -mx-4 xl:-mx-6 pl-4 xl:pl-6">
      <TabGroup
        items={CLIENT_TAB_ITEMS}
        activeId={activeTab}
        onChange={setActiveTab}
        size="md"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col -mt-6 pt-6">
        <ClientProfileSkeleton tab={activeTab} />
      </div>
    );
  }

  return (
    <div className="flex flex-col -mt-6">

      {/* Sticky Identity + KPI bar + Tabs */}
      <div className={`sticky -top-6 z-20 -mx-[9999px] px-[9999px] bg-card will-change-transform [overflow-anchor:none] transition-shadow duration-300 ease-out ${scrolled ? "shadow-sm" : ""}`}>
        {/* Mobile/Tablet breadcrumb — inside sticky header */}
        {breadcrumb && (
          <div className="xl:hidden pt-5 pb-0">
            <ResponsiveBreadcrumb items={breadcrumb} />
          </div>
        )}
        <div className={`flex flex-wrap md:flex-nowrap items-center md:items-start xl:items-center justify-between gap-4 lg:gap-8 transition-[padding] duration-300 ease-out ${scrolled ? "py-3" : "py-5"}`}>

          {/* Left: identity */}
          <div className={`flex flex-col ${scrolled ? "justify-center" : "gap-4"}`}>

            {/* Avatar + identity */}
            <div className={`flex gap-4 ${scrolled ? "items-center" : "items-start"}`}>
              {!scrolled && (
                <div className="shrink-0">
                  <Avatar type="text" initials={getInitials(maskedClientName)} size="xxl" />
                </div>
              )}
              <div className="flex flex-col">
                {/* Name + Tier + Status pill */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="type-h4 text-foreground leading-none">{maskedClientName}</h4>
                  <TierBadge tier={client.membershipTier} />
                </div>
                {/* Metadata — collapses when scrolled */}
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${scrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
                  <div className="overflow-hidden min-h-0">
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="type-caption text-muted-foreground">{client.id}</span>
                      {/* Last Contact sat here. It is out of scope for this
                          phase (see the note on `CALL_LOG_ENABLED`), not
                          removed — `client.lastContact` is still in
                          `clients.json` waiting for it — and the KYC countdown
                          is the thing an RM acts on meanwhile. That countdown
                          is itself dropped when the client has no KYC record:
                          the pill's own outline is the separator, so the
                          middot went with it. */}
                      {kycExpiryLabel && (
                        <span className="type-caption text-muted-foreground rounded-md bg-muted px-2 py-0.5">
                          {kycExpiryLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick contact — collapses on scroll */}
            <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${scrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}>
              <div className="overflow-hidden min-h-0 -mx-4 xl:-mx-6">
                <ContactChips
                  clientId={client.id}
                  scrollerRef={quickContactRef}
                  /* Bleeds past the card's padding so a pill can sit under the
                     edge while scrolling, and scroll-padding puts it back
                     inside when one is snapped to. */
                  className="px-4 xl:px-6 py-0.5 [scroll-padding-inline:1rem] xl:[scroll-padding-inline:1.5rem]"
                />
              </div>
            </div>
          </div>

          {/* Right: KPIs — fade between sizes, hide on mobile when scrolled */}
          <div className={`flex items-center justify-center gap-8 md:justify-start md:gap-0 shrink-0 w-full md:w-auto bg-[var(--bg-default-secondary)] md:!bg-transparent border border-border md:!border-0 rounded-2xl md:!rounded-none p-4 md:!p-0 ${scrolled ? "hidden sm:flex" : ""}`}>
            {/* `flex-1` only below `md` — the two stats don't naturally take
                equal width (the P&L side carries an extra arrow icon), so
                without it the pair centers as a whole and the divider lands
                off the card's actual midline, leaving "Total AUM" reading as
                pushed toward it rather than centered in its own half. `md:`
                drops it: the desktop layout right-aligns each stat against
                its own edge instead of splitting a shared box in half. */}
            <div className="flex flex-1 md:flex-none flex-col items-center text-center md:items-end md:text-right gap-1 md:pr-8">
              <p className="type-caption text-muted-foreground">Total AUM</p>
              {/* `type-h3` is a fixed 32px — fine on the desktop layout this
                  block switches to at `md`, but on a narrow phone that's wide
                  enough to wrap "฿ 220M" onto two lines. `!` on the mobile
                  override because `@sarunyu/system-one`'s stylesheet loads
                  after `globals.css` and would otherwise win the specificity
                  tie against a plain Tailwind class — same trap `SELECTED_ROW`
                  in `NotesSidebarList` documents. `md:text-[32px]!` restores
                  `type-h3`'s exact size rather than Tailwind's own `text-3xl`
                  (30px), so nothing shifts at the breakpoint. */}
              <p className={`text-foreground transition-opacity duration-150 ${scrolled ? "type-subtitle-1" : "type-h3 text-xl! md:text-[32px]!"}`}>{formatAumThb(client.aum)}</p>
            </div>
            <div className="w-px bg-border self-stretch -my-4 md:my-1 shrink-0" />
            <div className="flex flex-1 md:flex-none flex-col items-center text-center md:items-end md:text-right gap-1 md:pl-8">
              <p className="type-caption text-muted-foreground">YTD P&L</p>
              <div className="flex items-center gap-1.5">
                {client.plYtdPct >= 0 ? (
                  <ArrowUpIcon size={scrolled ? 14 : 18} className="text-success shrink-0" weight="bold" />
                ) : (
                  <ArrowDownIcon size={scrolled ? 14 : 18} className="text-destructive shrink-0" weight="bold" />
                )}
                <p className={`transition-opacity duration-150 ${scrolled ? "type-subtitle-1" : "type-h3 text-xl! md:text-[32px]!"} ${client.plYtdPct >= 0 ? "text-success" : "text-destructive"}`}>{formatPlYtdPct(client.plYtdPct)}</p>
              </div>
            </div>
          </div>

        </div>

        {/* ── Tab navigation ── */}
        {tabStrip}
      </div>

      {/* ── Body content ── */}
      <FadeIn key={activeTab}>
        {activeTab === "kyc" ? (
          profileLoading ? (
            <div className="pt-8">
              <DetailCardsSkeleton />
            </div>
          ) : (
            <KycTab client={client} profile={profile} />
          )
        ) : activeTab === "assets" ? (
          <div className="pt-8">
            {assetsLoading ? (
              <DetailCardsSkeleton />
            ) : (
            <ClientAssetSidebarContent
              clientId={client.id}
              client={client}
              assetAccounts={assetAccounts}
              accordionCards
              onLiabilitiesOpen={(amount, detail) => {
                setLiabilitiesData({ amount, detail });
                setLiabilitiesOpen(true);
              }}
            />
            )}
          </div>
        ) : activeTab === "orders" ? (
          <div className="pt-8 w-full">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">Order</h6>
                <ClientOrdersTab clientId={client.id} />
              </div>
            </Card>
          </div>
        ) : activeTab === "call-log" ? (
          <div className="pt-8 w-full">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">Call Log</h6>
                {callLogsLoading ? (
                  // Already inside the Call Log card — rows only, no second card.
                  <div className="flex flex-col gap-2" aria-busy="true">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <CallLogTable callLogs={callLogs} />
                )}
              </div>
            </Card>
          </div>
        ) : activeTab === "notes" ? (
          <div className="pt-8 w-full">
            <ClientNotesTab clientId={client.id} />
          </div>
        ) : activeTab === "reminders" ? (
          <div className="pt-8 w-full">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">Reminders</h6>
                <ClientRemindersTab clientId={client.id} />
              </div>
            </Card>
          </div>
        ) : (
          <OverviewTab
            clientId={client.id}
            detail={detail}
            holdingsSortKey={holdingsSortKey}
            holdingsSortDir={holdingsSortDir}
            onSort={(key, dir) => {
              setHoldingsSortKey(dir === "none" ? null : key);
              setHoldingsSortDir(dir);
            }}
            onViewAllHoldings={() => setActiveTab("assets")}
            onViewReminders={() => setActiveTab("reminders")}
          />
        )}
      </FadeIn>

      {liabilitiesData && (
        <LiabilitiesDetailModal
          open={liabilitiesOpen}
          totalAmount={liabilitiesData.amount}
          detail={liabilitiesData.detail}
          onClose={() => setLiabilitiesOpen(false)}
        />
      )}
    </div>
  );
}
