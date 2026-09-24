"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  UsersIcon,
  SquaresFourIcon,
  SidebarSimpleIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon,
  NotePencilIcon,
  CalendarBlankIcon,
  GaugeIcon,
  MegaphoneIcon,
  ChartLineUpIcon,
  GraduationCapIcon,
} from "@phosphor-icons/react";
import { SidebarUserMenu } from "@/components/layout/SidebarUserMenu";
import { usePrivacy } from "@/contexts/privacy-context";
import { CALENDAR_ENABLED, NOTES_ENABLED } from "@/lib/feature-flags";
import {
  activeSectionForPath,
  sectionResumeUrl,
  markSectionEntry,
  navVisitSnapshot,
  subscribeNavVisits,
  urlPathname,
  type NavSectionKey,
} from "@/lib/nav-memory";

/**
 * What the firm puts in front of you: clients, products, research. Shared,
 * read-mostly, and none of it authored here.
 */
const workspaceItems: NavItem[] = [
  {
    href: "/dashboard",
    section: "dashboard",
    label: "Dashboard",
    icon: GaugeIcon,
    badge: null,
  },
  {
    href: "/client-hub",
    section: "client-hub",
    label: "Client 360",
    icon: UsersIcon,
    badge: null,
  },
  {
    href: "/product-catalog",
    section: "product-catalog",
    label: "Product Catalog",
    icon: SquaresFourIcon,
    badge: null,
  },
  {
    href: "/insights",
    section: "insights",
    label: "Insights",
    icon: ChartBarIcon,
    badge: null,
  },
  {
    href: "/promotions",
    section: "promotions",
    label: "Promotion/Events",
    icon: MegaphoneIcon,
    badge: null,
  },
];

/**
 * What grows the advisor's own book, rather than serving a client in front of
 * them right now: targets to track, skills to build. Split from Workspace for
 * that reason, not because the surfaces differ.
 */
const growthItems: NavItem[] = [
  {
    href: "/performance",
    section: "performance",
    label: "Performance",
    icon: ChartLineUpIcon,
    badge: null,
  },
  {
    href: "/ic-learning",
    section: "ic-learning",
    label: "IC Learning",
    icon: GraduationCapIcon,
    badge: null,
  },
];

/**
 * What you write down and what you owe. Split from Workspace because it is the
 * other kind of thing in this app — authored here, yours, and about what happens
 * next rather than what is.
 *
 * The two entries are closer than neighbours: Calendar renders the reminders
 * attached to notes, laid out by day instead of by list (see
 * `app/(dashboard)/calendar/page.tsx`). One body of work, two views of it.
 *
 * Both are out of the current delivery phase (see `lib/feature-flags`), so the
 * list is filtered rather than written out — with both off it comes back empty
 * and the whole Planner section, label included, stops rendering.
 */
const plannerItems: NavItem[] = [
  ...(NOTES_ENABLED
    ? [
        {
          href: "/notes",
          section: "notes" as const,
          label: "Notes",
          icon: NotePencilIcon,
          badge: null,
        },
      ]
    : []),
  ...(CALENDAR_ENABLED
    ? [
        {
          href: "/calendar",
          section: "calendar" as const,
          label: "Calendar",
          icon: CalendarBlankIcon,
          badge: null,
        },
      ]
    : []),
];

type NavItem = {
  href: string;
  section: NavSectionKey;
  label: string;
  icon: React.ElementType;
  badge: number | string | null;
};

// Fixed-width icon zone: collapsed sidebar = 50px, outer margin px-2 (8px each side),
// inner zone = 34px. All icons/logos/avatars live inside this zone and never move.
const ICON_ZONE = "w-[34px] flex items-center justify-center shrink-0";

function NavSection({
  label,
  items,
  collapsed,
  onNavigate,
}: {
  label: string;
  items: NavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  useSyncExternalStore(subscribeNavVisits, navVisitSnapshot, () => "");
  const activeSection = activeSectionForPath(pathname);

  /**
   * Smart link: re-entering a section from elsewhere resumes where the user left
   * off (Full Profile + sub-tab, catalog category, insight filter) — matching
   * what browser-back already does. Clicking the section you're already in is
   * the deliberate "take me back to the list" gesture, so that keeps `href`.
   *
   * `href` stays the section root either way, so middle-click / open-in-new-tab
   * and SSR markup behave normally.
   */
  const handleNavigate = (item: NavItem) => (e: React.MouseEvent) => {
    onNavigate?.();
    // Cmd/ctrl/shift-click is "open this href elsewhere" — leave it to the browser.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (activeSection === item.section) return;
    const last = sectionResumeUrl(item.section);
    // A resume target that is the page you're already on (a stale pointer
    // left behind by a cross-section guest visit) is not a navigation — fall
    // through to the plain `href` so the click still goes somewhere.
    if (!last || last === item.href || urlPathname(last) === pathname) {
      // Still a deliberate section entry even though it lands on `href` — if
      // that ever is a guest route, it must not read as cross-section either.
      markSectionEntry(item.href);
      return;
    }
    // Clicking a section explicitly always means "I'm entering this section
    // now" — even when the resume target is a guest route (e.g. the last
    // Insights article, reached from Product Catalog) whose URL history looks
    // identical to a Product Catalog card opening that same guest page.
    markSectionEntry(urlPathname(last));
    e.preventDefault();
    router.push(last);
  };

  return (
    <div className="flex flex-col gap-0.5 mt-2">
      {/* Section label fades out when collapsed */}
      <div className="h-7 flex items-end px-4 pb-1 overflow-hidden">
        <p
          className={`text-[11px] font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap transition-all duration-300 ease-in-out ${collapsed ? "opacity-0 -translate-x-1" : "opacity-100 translate-x-0"
            }`}
        >
          {label}
        </p>
      </div>

      {items.map((item) => {
        const Icon = item.icon;
        // Section-wide, so Client 360 stays lit on a Full Profile (/client/:id).
        const isActive = activeSection === item.section;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="no-underline block px-2"
            onClick={handleNavigate(item)}
            title={item.label}
          >
            <div
              className={`flex items-center gap-3 py-2.5 rounded-lg transition-colors overflow-hidden ${isActive ? "bg-slate-700/60" : "hover:bg-slate-800"
                }`}
            >
              {/* Icon zone — fixed width, never moves */}
              <div className={ICON_ZONE}>
                <Icon
                  size={18}
                  weight={isActive ? "fill" : "regular"}
                  className={isActive ? "text-white" : "text-slate-400"}
                />
              </div>

              {/* Text fades + collapses. max-width (not width:auto) so the collapse
                  itself can be transitioned — CSS can't interpolate to/from "auto". */}
              <span
                className={`text-[13.5px] leading-[18px] whitespace-nowrap transition-all duration-300 ease-in-out overflow-hidden ${collapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100"
                  } ${isActive ? "text-white" : "text-slate-300"} font-medium`}
              >
                {item.label}
              </span>

              {item.badge != null && (
                <span
                  className={`bg-slate-700 text-slate-300 text-[11px] font-semibold py-0.5 rounded-full tabular-nums whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed
                    ? "max-w-0 opacity-0 p-0"
                    : "max-w-[48px] opacity-100 px-2"
                    }`}
                >
                  {item.badge}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export function AppSidebar({
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { isPrivate, toggle } = usePrivacy();
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Toggle button — icon zone keeps it still */}
      {onToggleCollapse && (
        <div className="flex shrink-0 pt-5 pb-1 px-2">
          <div className={ICON_ZONE}>
            <button
              type="button"
              onClick={onToggleCollapse}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <SidebarSimpleIcon size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Logo — the collapsed rail shows the YA square in the same icon zone
          the nav icons line up on; expanded, the full white lockup replaces it
          rather than sitting beside it. `logo-ic-portal-white.svg` carries the
          YA mark itself (the wordmark-only asset it replaced did not), so
          keeping both on screen would draw the mark twice. */}
      <div className="flex items-center py-4 shrink-0 px-2 h-[62px]">
        <div
          className={`${ICON_ZONE} transition-opacity duration-300 ease-in-out ${collapsed ? "opacity-100" : "opacity-0 w-0"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size icon, no responsive sizes needed */}
          <img src="/brand/yuanta-icon-logo.svg" alt="Yuanta" className="w-auto h-7.5" />
        </div>
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100"
            }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size wordmark, no responsive sizes needed */}
          <img
            src="/brand/logo-ic-portal-white.svg"
            alt="Yuanta IC Portal"
            className="w-auto h-8"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <NavSection
          label="Workspace"
          items={workspaceItems}
          collapsed={collapsed}
          onNavigate={onClose}
        />
        {plannerItems.length > 0 && (
          <NavSection
            label="Planner"
            items={plannerItems}
            collapsed={collapsed}
            onNavigate={onClose}
          />
        )}
        <NavSection
          label="Growth"
          items={growthItems}
          collapsed={collapsed}
          onNavigate={onClose}
        />
      </nav>

      {/* Privacy mode toggle */}
      <div
        className="shrink-0 mx-2 mb-2 rounded-lg transition-colors duration-200"
        style={{ backgroundColor: isPrivate ? "color-mix(in srgb, var(--primary-action) 25%, transparent)" : "color-mix(in srgb, var(--fill-gray-700) 30%, transparent)" }}
      >
        <button
          type="button"
          onClick={toggle}
          title={isPrivate ? "แสดงชื่อลูกค้า" : "ซ่อนชื่อลูกค้า"}
          className={`w-full flex items-center gap-1.5 py-2.5 pr-2 rounded-lg transition-colors cursor-pointer ${isPrivate ? "hover:bg-primary-action/20" : "hover:bg-slate-700/50"}`}
        >
          <div className={ICON_ZONE}>
            {isPrivate
              ? <EyeSlashIcon size={16} className="text-primary-action shrink-0" />
              : <EyeIcon size={16} className="text-slate-400 shrink-0" />
            }
          </div>
          <span className={`text-[13px] leading-normal whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"} ${isPrivate ? "text-primary-action font-medium" : "text-slate-300"}`}>
            ซ่อนชื่อลูกค้า
          </span>
          {/* Switch indicator */}
          <div className={`ml-auto shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${collapsed ? "max-w-0 opacity-0" : "max-w-[40px] opacity-100"}`}>
            <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${isPrivate ? "bg-primary-action" : "bg-slate-600"}`}>
              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isPrivate ? "translate-x-[14px]" : "translate-x-0.5"}`} />
            </div>
          </div>
        </button>
      </div>

      {/* User profile — avatar in icon zone. Deliberately unpadded: the trigger
          carries all of its own spacing so its hover highlight fills the footer
          edge to edge, from the divider down to the foot of the rail. Any
          padding here would show up as a dead margin around the highlight. */}
      <div className="shrink-0 border-t border-slate-700/60">
        <SidebarUserMenu
          name="Relation Manager"
          role="Senior RM"
          initials="RM"
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}
