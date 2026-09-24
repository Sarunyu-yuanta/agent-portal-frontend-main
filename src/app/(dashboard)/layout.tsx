"use client";

import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  NavHeaderIconButton,
  Tag,
  type NotificationItem,
} from "@sarunyu/system-one";
import { ListIcon } from "@phosphor-icons/react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { NotificationBell } from "@/components/layout/NotificationBell";
import {
  isDue,
  ZONE_LABEL_TH,
  ZONE_ORDER,
  type NotificationZone,
} from "./notification-zones";
import { FadeIn } from "@/components/ui/fade-in";
import { NavStateMemory } from "@/components/layout/NavStateMemory";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { HeaderSlotProvider, useHeaderSlot } from "./header-slot-context";
import { PrivacyProvider } from "@/contexts/privacy-context";
import { NotesProvider, useNotes } from "@/contexts/notes-context";
import {
  CALENDAR_ENABLED,
  KYC_ALERTS_ENABLED,
  NOTES_ENABLED,
  REMINDERS_ENABLED,
} from "@/lib/feature-flags";
import { useClients } from "@/hooks/use-api";
import { ResponsiveBreadcrumb } from "@/components/layout/ResponsiveBreadcrumb";
import { FloatingNoteButton } from "./notes/FloatingNoteButton";
import { usePageChrome } from "./page-chrome";
import { useNotificationFeed } from "./calendar/use-notification-feed";
import { useKycNotificationFeed } from "./use-kyc-notification-feed";
import { useDayItemModals } from "./calendar/use-day-item-modals";

function MarketOpenBadge() {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex items-center justify-center w-3 h-3">
        <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-75 animate-ping" />
        <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
      </div>
      <Tag text="Market Open in 1h 45m" variant="green" size="small" />
    </div>
  );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const {
    title: pageTitle,
    breadcrumb,
    isCommandCenter,
    isPerformance,
    isFullWidth,
    isMobileFullBleed,
    isFullHeight,
    isWideContent,
    ownsMobileBreadcrumb,
    contentTopIsWhite,
  } = usePageChrome();
  const headerSlot = useHeaderSlot();

  const { notes } = useNotes();
  const clients = useClients();

  // Clicking a bell row opens the reminder itself — the same two modals
  // `ClientRemindersTab` opens for the same job, just hoisted up here since
  // the bell can be clicked from any page, not only a client's own. `null`
  // clientId scoping (no `pinnedClientId`, `showHolders` left at its
  // default `true`) is deliberate: unlike a client's own Reminders tab,
  // this modal doesn't already know whose page you're on.
  const { open: openReminder, modals: reminderModals } = useDayItemModals({ clients });

  const { notificationRows, notificationTargets } =
    useNotificationFeed(notes, clients);
  const { kycNotificationRows, kycNotificationTargets } =
    useKycNotificationFeed(clients);

  /**
   * The two feeds merged into one list and grouped once, rather than
   * concatenated.
   *
   * Both run unconditionally — they're memoised derivations, and gating the
   * hook calls themselves on a flag isn't allowed; the flags pick what reaches
   * the bell. What they produce is now on a shared axis (`notification-zones`),
   * so a KYC expiring today and a reminder due today land in the same group
   * instead of under two headings in two languages, one of them below "Next 2
   * weeks".
   *
   * Split three ways, one per screen the bell can show. Today is the screen it
   * opens on; overdue and upcoming each sit behind a counted row, so neither a
   * backlog nor a queue can push today's work below the fold.
   */
  const { todayGroups, overdueGroups, upcomingGroups } = useMemo(() => {
    const rows = [
      ...(REMINDERS_ENABLED ? notificationRows : []),
      ...(KYC_ALERTS_ENABLED ? kycNotificationRows : []),
    ];
    const build = (zones: NotificationZone[]) =>
      zones
        .map((zone) => ({
          label: ZONE_LABEL_TH[zone],
          items: rows
            .filter((r) => r.zone === zone)
            // Within a zone the closest deadline leads.
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .map((r) => r.item),
        }))
        .filter((g) => g.items.length > 0);
    return {
      todayGroups: build(["today"]),
      overdueGroups: build(["overdue"]),
      upcomingGroups: build(ZONE_ORDER.filter((z) => !isDue(z))),
    };
  }, [notificationRows, kycNotificationRows]);

  const handleNotificationClick = (notifItem: NotificationItem) => {
    // A KYC row's only useful destination is that client's own KYC tab, which
    // is where the record and its forms are — there's no modal for it the way
    // a reminder has one.
    const kycClientId = kycNotificationTargets.get(notifItem.id);
    if (kycClientId) {
      router.push(`/client/${kycClientId}?tab=kyc`);
      return;
    }
    const target = notificationTargets.get(notifItem.id);
    if (!target) return;
    openReminder(target.item, target.day);
  };

  return (
    <>
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetOverlay className="bg-black/50" />
        <SheetContent
          side="left"
          className="w-60 p-0 bg-slate-900 border-slate-700"
        >
          <AppSidebar onClose={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar — hidden on mobile/tablet, visible on xl+ (desktop only) */}
        <aside
          className={`hidden xl:flex shrink-0 bg-slate-900 overflow-hidden flex-col transition-[width] duration-300 ease-in-out ${sidebarCollapsed ? "w-[50px]" : "w-60"}`}
        >
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          />
        </aside>

        {/* Content area */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top bar */}
          <header
            className={`shrink-0 min-h-[60px] flex items-center justify-between gap-4 px-4 border-b border-border bg-background z-30 relative ${
              headerSlot ? "xl:grid xl:grid-cols-[1fr_minmax(0,28rem)_1fr]" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo — mobile + tablet (sidebar hidden below xl) */}
              <div className="flex items-center gap-2.5 xl:hidden shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size icon, no responsive sizes needed */}
                <img
                  src="/brand/logo-ic-portal-blue.svg"
                  alt="Yuanta"
                  className="w-auto h-8 shrink-0"
                />

              </div>
              {/* Title in header — desktop only */}
              {breadcrumb ? (
                // `flex-1` gives it a width that doesn't depend on its own
                // content, which is what makes the measurement inside stable.
                <div className="hidden xl:block min-w-0 flex-1">
                  <ResponsiveBreadcrumb items={breadcrumb} />
                </div>
              ) : (
                <div className="hidden xl:flex items-center gap-3">
                  {pageTitle && (
                    <h1 className="type-subtitle-1 text-foreground">
                      {pageTitle}
                    </h1>
                  )}
                  {isCommandCenter && <MarketOpenBadge />}
                </div>
              )}
            </div>

            {headerSlot && (
              <div className="hidden xl:flex">
                <div className="w-full">{headerSlot}</div>
              </div>
            )}

            <div className={`flex items-center gap-4 ${headerSlot ? "xl:justify-self-end" : ""}`}>
              {/* The bell carries whichever feeds are in phase — KYC expiries
                  today, reminders alongside them once that flag flips. It only
                  disappears if every feed is off, rather than sitting there
                  permanently empty. */}
              {(todayGroups.length > 0 ||
                overdueGroups.length > 0 ||
                upcomingGroups.length > 0) && (
                <NotificationBell
                  todayGroups={todayGroups}
                  overdueGroups={overdueGroups}
                  upcomingGroups={upcomingGroups}
                  emptyText="ไม่มีการแจ้งเตือน"
                  onItemClick={handleNotificationClick}
                  // Only offered while the Calendar is in phase — otherwise the
                  // link would lead to a route that redirects straight back.
                  onOpenCalendar={
                    CALENDAR_ENABLED ? () => router.push("/calendar") : undefined
                  }
                />
              )}

              <div className="xl:hidden">
                <NavHeaderIconButton
                  aria-label="Open navigation"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ListIcon weight="regular" size={24} />
                </NavHeaderIconButton>
              </div>
            </div>
          </header>

          <main
            className={`flex-1 overflow-x-clip bg-[var(--bg-default-secondary)] ${
              isFullWidth ? "" : isMobileFullBleed ? "xl:p-6" : "p-4 xl:p-6"
            } ${
              isFullHeight
                ? "flex flex-col min-h-0 overflow-y-hidden"
                : "overflow-y-auto [scrollbar-gutter:stable]"
            }`}
          >
            {/* Mobile/tablet breadcrumb — the top bar has no room for it next
                to the logo, so it leads the content instead. Sits outside the
                gap-6 stack below to keep its own spacing; the padding lives on
                this wrapper so the measured width inside is the real one. No
                surface of its own — it takes the one the content starts on. */}
            {breadcrumb && !ownsMobileBreadcrumb && (
              <div
                className={`xl:hidden ${isFullWidth ? "px-4 pt-4 pb-3" : "pb-4"} ${contentTopIsWhite ? "bg-white" : ""}`}
              >
                <ResponsiveBreadcrumb items={breadcrumb} />
              </div>
            )}
            {/* The gap only ever separates the mobile page title from the
                content: above `xl` that title is `display: none`, so it stops
                being a flex item and the gap collapses to nothing. Tightened
                below `xl` because a phone has the least room to spend on a
                heading it is already reading as one — `xl:gap-6` is kept so a
                page that ever renders two stacked children on desktop still gets
                the roomier rhythm. */}
            <FadeIn
              key={pathname}
              className={`${
                isFullWidth || isWideContent
                  ? "w-full min-h-full"
                  : "max-w-[1280px] mx-auto"
              } flex flex-col gap-3 xl:gap-6 ${isFullHeight ? "w-full flex-1 min-h-0" : ""}`}
            >
              {!breadcrumb &&
                !isFullWidth &&
                !isMobileFullBleed &&
                (pageTitle || isCommandCenter) && (
                  <div className="flex items-center justify-between gap-3 xl:hidden">
                    <div className="flex items-center gap-3">
                      {pageTitle && (
                        <h1 className="type-h5 text-foreground">{pageTitle}</h1>
                      )}
                      {isCommandCenter && <MarketOpenBadge />}
                    </div>
                    {isPerformance && (
                      <div
                        className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 shrink-0"
                        style={{ background: "#1e2337" }}
                      >
                        <span className="text-[13px] font-bold text-white leading-none">
                          B+
                        </span>
                      </div>
                    )}
                  </div>
                )}
              {children}
            </FadeIn>
          </main>
        </div>
      </div>

      {NOTES_ENABLED && <FloatingNoteButton />}

      {/* What a bell row opens into. Global rather than per-page, the same
          reason the bell itself is: the reminder it points at can belong to
          whichever client you aren't currently looking at. */}
      {REMINDERS_ENABLED && reminderModals}

      {/* Rendered last on purpose — its scroll restore has to win over any
          `main.scrollTop` reset a page does in its own mount effect. */}
      <Suspense fallback={null}>
        <NavStateMemory />
      </Suspense>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PrivacyProvider>
      <NotesProvider>
        <HeaderSlotProvider>
          <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </HeaderSlotProvider>
      </NotesProvider>
    </PrivacyProvider>
  );
}
