"use client";

import { Suspense, use, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname, useLocalizedRouter } from "@/i18n/navigation";
import { Avatar, Card, TabGroup } from "@sarunyu/system-one";
import { ClientAssetSidebarContent } from "@/features/portfolio/components/ClientAssetSidebarContent";
import { ArrowUpIcon, ArrowDownIcon } from "@phosphor-icons/react";
import { ErrorState, NotFoundState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";
import {
  ClientProfileSkeleton,
  DetailCardsSkeleton,
} from "@/features/client-profile/components/ClientProfileSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials, formatAumThb, formatPlYtdPct } from "@/lib/client-utils";
import { setQueryState } from "@/lib/query-state";
import { useSetHeaderSlot } from "@/features/shell/components/header-slot-context";
import { usePageBreadcrumb } from "@/features/shell/lib/page-breadcrumbs";
import { ResponsiveBreadcrumb } from "@/features/shell/components/ResponsiveBreadcrumb";
import { TierBadge } from "@/components/ui/tier-badge";
import { ContactChips } from "@/features/calendar/components/HolderContact";
import { LiabilitiesDetailModal } from "@/features/portfolio/components/LiabilitiesDetailModal";
import {
  clientDetailById,
  kycExpiryLabel,
  type HoldingsSortKey,
} from "@/features/client-profile/lib/client-detail-data";
import { CLIENT_TABS, CLIENT_TAB_ITEMS } from "@/features/client-profile/lib/client-tabs";
import { CallLogTable } from "@/features/client-profile/components/ClientSections";
import { ClientNotesTab } from "@/features/client-profile/components/ClientNotesTab";
import { FadeIn } from "@/components/ui/fade-in";
import { ClientRemindersTab } from "@/features/client-profile/components/ClientRemindersTab";
import { ClientOrdersTab } from "@/features/orders/components/ClientOrdersTab";
import { KycTab } from "@/features/client-profile/components/KycTab";
import { OverviewTab } from "@/features/client-profile/components/OverviewTab";
import { useLocale } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { SortDir } from "@/types/table";
import type { LiabilitiesDetail } from "@/types/portfolio";
import {
  useClientAssetAccounts,
  useClientCallLogs,
  useClientProfile,
  useClientsResource,
} from "@/features/clients/hooks/use-clients";
import { ROUTES, clientPath } from "@/lib/routes";

export function ClientProfileView({ params }: { params: Promise<{ id: string }> }) {
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

/**
 * Resolves the client, in the order every screen checks: loading → error →
 * not found → the profile.
 *
 * An unknown id used to fall back to the first client in the list, and a
 * client with no detail record to client 1's holdings — a real-looking profile
 * of the wrong person, which on a wealth platform is worse than no profile.
 */
function ClientPageInner({ id }: { id: string }) {
  const router = useLocalizedRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const resource = useClientsResource();
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && CLIENT_TABS.includes(tabParam) ? tabParam : "overview";

  if (resource.isLoading) {
    return (
      <div className="-mt-6 flex flex-col pt-6">
        <ClientProfileSkeleton tab={activeTab} />
      </div>
    );
  }
  if (resource.error) return <ErrorState onRetry={resource.retry} />;

  const client = resource.data.find((c) => c.id === id);
  if (!client) {
    return (
      <NotFoundState
        message={t.states.notFoundClient}
        onBack={() => router.push(ROUTES.clientHub)}
        backLabel={t.states.backToClientHub}
      />
    );
  }
  return <ClientProfile id={id} client={client} clients={resource.data} />;
}

function ClientProfile({ id, client, clients }: { id: string; client: Client; clients: Client[] }) {
  const locale = useLocale();
  const t = useT();
  const searchParams = useSearchParams();
  const pathname = useAppPathname();
  const { isPrivate } = usePrivacy();

  // Same source as the desktop top-bar breadcrumb — this page renders its own
  // only so it can live inside the sticky identity bar.
  const breadcrumb = usePageBreadcrumb(pathname, { clients, isPrivate });

  const maskedClientName = maskName(client.name, isPrivate);
  // `undefined` for a client with no detail record yet — the Overview sections
  // show their own empty states rather than borrowing another client's.
  const detail = clientDetailById[client.id];

  // Page tab state — URL-owned, so returning to this profile (browser back or
  // the sidebar's Client 360 entry) comes back to the sub-tab left open.
  // `replace`: sub-tabs are views of one profile, not stops worth unwinding.
  const tabParam = searchParams.get("tab");
  const activeTab = tabParam && CLIENT_TABS.includes(tabParam) ? tabParam : "overview";
  const setActiveTab = (tab: string) => setQueryState(clientPath(id, tab), "replace");

  // Holdings sort state
  const [holdingsSortDir, setHoldingsSortDir] = useState<SortDir>("none");
  const [holdingsSortKey, setHoldingsSortKey] = useState<HoldingsSortKey>(null);

  // Per-tab data: each tab that would be its own endpoint waits on its own
  // resource, so a slow one skeletons that tab's content, not the page.
  const { data: callLogs, isLoading: callLogsLoading } = useClientCallLogs(client.id);
  const { data: profile, isLoading: profileLoading } = useClientProfile(client.id);
  const { data: assetAccounts, isLoading: assetsLoading } = useClientAssetAccounts(client.id);
  const kycLine = kycExpiryLabel(client.id, t, locale);
  const [liabilitiesOpen, setLiabilitiesOpen] = useState(false);
  const [liabilitiesData, setLiabilitiesData] = useState<{
    amount: string;
    detail: LiabilitiesDetail;
  } | null>(null);

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
    <div className="transparent-tabs scrollable-tabs -mx-4 pl-4 xl:-mx-6 xl:pl-6">
      <TabGroup
        items={CLIENT_TAB_ITEMS.map((tab) => ({ id: tab.id, title: t.client.tabs[tab.id] }))}
        activeId={activeTab}
        onChange={setActiveTab}
        size="md"
      />
    </div>
  );

  return (
    <div className="-mt-6 flex flex-col">
      {/* Sticky Identity + KPI bar + Tabs */}
      <div
        className={`sticky -top-6 z-20 -mx-[9999px] bg-card px-[9999px] transition-shadow duration-300 ease-out will-change-transform [overflow-anchor:none] ${scrolled ? "shadow-sm" : ""}`}
      >
        {/* Mobile/Tablet breadcrumb — inside sticky header */}
        {breadcrumb && (
          <div className="pt-5 pb-0 xl:hidden">
            <ResponsiveBreadcrumb items={breadcrumb} />
          </div>
        )}
        <div
          className={`flex flex-wrap items-center justify-between gap-4 transition-[padding] duration-300 ease-out md:flex-nowrap md:items-start lg:gap-8 xl:items-center ${scrolled ? "py-3" : "py-5"}`}
        >
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
                <div className="flex flex-wrap items-center gap-2.5">
                  <h4 className="type-h4 leading-none text-foreground">{maskedClientName}</h4>
                  <TierBadge tier={client.membershipTier} />
                </div>
                {/* Metadata — collapses when scrolled */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-out ${scrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
                >
                  <div className="min-h-0 overflow-hidden">
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="type-caption text-muted-foreground">{client.id}</span>
                      {/* Last Contact sat here. It is out of scope for this
                          phase (see the note on `CALL_LOG_ENABLED`), not
                          removed — `client.lastContact` is still in
                          `clients.json` waiting for it — and the KYC countdown
                          is the thing an RM acts on meanwhile. That countdown
                          is itself dropped when the client has no KYC record:
                          the pill's own outline is the separator, so the
                          middot went with it. */}
                      {kycLine && (
                        <span className="type-caption rounded-md bg-muted px-2 py-0.5 text-muted-foreground">
                          {kycLine}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick contact — collapses on scroll */}
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${scrolled ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"}`}
            >
              <div className="-mx-4 min-h-0 overflow-hidden xl:-mx-6">
                <ContactChips
                  clientId={client.id}
                  scrollerRef={quickContactRef}
                  /* Bleeds past the card's padding so a pill can sit under the
                     edge while scrolling, and scroll-padding puts it back
                     inside when one is snapped to. */
                  className="[scroll-padding-inline:1rem] px-4 py-0.5 xl:[scroll-padding-inline:1.5rem] xl:px-6"
                />
              </div>
            </div>
          </div>

          {/* Right: KPIs — fade between sizes, hide on mobile when scrolled */}
          <div
            className={`flex w-full shrink-0 items-center justify-center gap-8 rounded-2xl border border-border bg-[var(--bg-default-secondary)] p-4 md:w-auto md:justify-start md:gap-0 md:!rounded-none md:!border-0 md:!bg-transparent md:!p-0 ${scrolled ? "hidden sm:flex" : ""}`}
          >
            {/* `flex-1` only below `md` — the two stats don't naturally take
                equal width (the P&L side carries an extra arrow icon), so
                without it the pair centers as a whole and the divider lands
                off the card's actual midline, leaving "Total AUM" reading as
                pushed toward it rather than centered in its own half. `md:`
                drops it: the desktop layout right-aligns each stat against
                its own edge instead of splitting a shared box in half. */}
            <div className="flex flex-1 flex-col items-center gap-1 text-center md:flex-none md:items-end md:pr-8 md:text-right">
              <p className="type-caption text-muted-foreground">{t.client.profile.totalAum}</p>
              {/* `type-h3` is a fixed 32px — fine on the desktop layout this
                  block switches to at `md`, but on a narrow phone that's wide
                  enough to wrap "฿ 220M" onto two lines. `!` on the mobile
                  override because `@sarunyu/system-one`'s stylesheet loads
                  after `globals.css` and would otherwise win the specificity
                  tie against a plain Tailwind class — same trap `SELECTED_ROW`
                  in `NotesSidebarList` documents. `md:text-[32px]!` restores
                  `type-h3`'s exact size rather than Tailwind's own `text-3xl`
                  (30px), so nothing shifts at the breakpoint. */}
              <p
                className={`text-foreground transition-opacity duration-150 ${scrolled ? "type-subtitle-1" : "type-h3 text-xl! md:text-[32px]!"}`}
              >
                {formatAumThb(client.aum)}
              </p>
            </div>
            <div className="-my-4 w-px shrink-0 self-stretch bg-border md:my-1" />
            <div className="flex flex-1 flex-col items-center gap-1 text-center md:flex-none md:items-end md:pl-8 md:text-right">
              <p className="type-caption text-muted-foreground">{t.client.profile.ytdPl}</p>
              <div className="flex items-center gap-1.5">
                {client.plYtdPct >= 0 ? (
                  <ArrowUpIcon
                    size={scrolled ? 14 : 18}
                    className="text-success shrink-0"
                    weight="bold"
                  />
                ) : (
                  <ArrowDownIcon
                    size={scrolled ? 14 : 18}
                    className="shrink-0 text-destructive"
                    weight="bold"
                  />
                )}
                <p
                  className={`transition-opacity duration-150 ${scrolled ? "type-subtitle-1" : "type-h3 text-xl! md:text-[32px]!"} ${client.plYtdPct >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {formatPlYtdPct(client.plYtdPct)}
                </p>
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
          <div className="w-full pt-8">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">{t.client.tabs.orders}</h6>
                <ClientOrdersTab clientId={client.id} />
              </div>
            </Card>
          </div>
        ) : activeTab === "call-log" ? (
          <div className="w-full pt-8">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">{t.client.tabs["call-log"]}</h6>
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
          <div className="w-full pt-8">
            <ClientNotesTab clientId={client.id} />
          </div>
        ) : activeTab === "reminders" ? (
          <div className="w-full pt-8">
            <Card variant="default">
              <div className="flex flex-col gap-4">
                <h6 className="type-h6 text-foreground">{t.client.tabs.reminders}</h6>
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
          detail={liabilitiesData.detail}
          onClose={() => setLiabilitiesOpen(false)}
        />
      )}
    </div>
  );
}
