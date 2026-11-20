"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalizedRouter } from "@/i18n/navigation";
import { Avatar } from "@sarunyu/system-one";
import { CaretUpDownIcon, SignOutIcon } from "@phosphor-icons/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { pageZoom } from "@/lib/page-zoom";
import { useT } from "@/i18n/I18nProvider";
import { ROUTES } from "@/lib/routes";

/**
 * Floor for the panel width, for when the rail is too narrow to derive a usable
 * one from — a collapsed 50px rail would otherwise give a 34px panel.
 */
const MENU_MIN_WIDTH = 200;
/** The panel's inset: from the row, from the rail's sides, off the viewport edge. */
const MENU_GAP = 8;
/**
 * Below Tailwind's `md` the menu is a bottom sheet, at or above it a dropdown.
 * The same string the rest of the app tests mobile with.
 */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * The signed-in row at the foot of the sidebar, and the menu it opens.
 *
 * One open state drives two presentations, the same way `ColumnVisibilityMenu`
 * does it: a dropdown from `md` up, and a bottom sheet below that, where a
 * 200px panel pinned to a corner is both hard to hit and easy to miss.
 *
 * The dropdown is `fixed` and positioned from a measurement of the trigger
 * rather than `absolute`: both the sidebar `<aside>` and `AppSidebar`'s own
 * root are `overflow-hidden`, which would crop an absolutely positioned panel
 * to the 50px rail when the sidebar is collapsed. No ancestor holds a
 * persistent transform, so `fixed` escapes that clipping and still lands on the
 * row, while staying a DOM child here — which is what lets one `contains` check
 * on the root cover outside-clicks on both the row and the panel.
 */
export function SidebarUserMenu({
  name,
  role,
  initials,
  collapsed,
}: {
  name: string;
  role: string;
  initials: string;
  collapsed: boolean;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  /**
   * Which presentation to mount — not just which to show. Rendering both and
   * letting `md:hidden` hide one would still open the sheet's Base UI dialog on
   * desktop, and its focus trap and scroll lock would fight the dropdown.
   */
  const isMobile = useMediaQuery(MOBILE_QUERY);
  /**
   * Where the panel was placed, plus the sidebar width it was placed against.
   * Those coordinates are a one-time measurement, so collapsing the sidebar
   * moves the row out from under them — comparing `collapsed` back against the
   * value captured at open time lets that close the menu on its own, with no
   * effect reaching in to do it.
   */
  const [placement, setPlacement] = useState<{
    collapsed: boolean;
    left: number;
    bottom: number;
    width: number;
  } | null>(null);
  const open = placement !== null && placement.collapsed === collapsed;

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    if (open) {
      setPlacement(null);
      return;
    }
    const box = triggerRef.current?.getBoundingClientRect();
    if (!box) return;
    // The box and the window are screen pixels; the panel's position is
    // applied in the page's own — they differ on very wide screens (see
    // `pageZoom`).
    const zoom = pageZoom();
    const rect = {
      left: box.left / zoom,
      top: box.top / zoom,
      width: box.width / zoom,
    };
    const viewport = {
      width: window.innerWidth / zoom,
      height: window.innerHeight / zoom,
    };
    // The trigger is full-bleed, so its box *is* the rail's — sizing the panel
    // off it makes the panel as wide as the sidebar less an even gap each side,
    // instead of a fixed width that left a 32px gutter on one side and 8px on
    // the other. The floor takes over on the collapsed rail, where the panel
    // has to spill over the content to stay legible.
    const width = Math.max(MENU_MIN_WIDTH, rect.width - MENU_GAP * 2);
    setPlacement({
      collapsed,
      width,
      // Clamped to keep the panel on-screen once the floor makes it wider than
      // the rail it was measured from.
      left: Math.max(MENU_GAP, Math.min(rect.left + MENU_GAP, viewport.width - width - MENU_GAP)),
      bottom: viewport.height - rect.top + MENU_GAP,
    });
  }

  // Dismissal for the dropdown only — the sheet brings its own, and it portals
  // out of `rootRef`, so these listeners would read a tap inside it as an
  // outside-click and shut it the moment it opened.
  useEffect(() => {
    if (!open || isMobile) return;
    const close = () => setPlacement(null);
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // A resize moves the row the same way collapsing does, and there is no
    // captured value to compare against for it.
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
    };
  }, [open, isMobile]);

  function handleLogout() {
    setPlacement(null);
    // `replace`, not `push`: there is no session to tear down yet (see
    // `src/app/login/page.tsx`), so leaving no dashboard entry behind to go
    // Back into is the closest this gets to actually signing out.
    router.replace(ROUTES.login);
  }

  return (
    <div className="relative" ref={rootRef}>
      {/* Full-bleed rather than an inset pill: the highlight fills the footer on
          all four sides instead of floating in a dead margin. All of the row's
          spacing lives here as padding, so it sits inside the highlight — the
          `px-2` keeps the avatar on the same icon-zone centre line as the nav
          glyphs and gives the caret its gap from the right edge. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.nav.accountOf(name)}
        title={collapsed ? name : undefined}
        className={`group flex w-full cursor-pointer items-center gap-3 px-2 py-2 transition-colors ${open ? "bg-slate-700/50" : "hover:bg-slate-700/50"}`}
      >
        {/* Same fixed icon zone the nav glyphs and the logo line up on, so the
            avatar holds its place as the sidebar collapses. */}
        {/* The avatar's initial is the library's `text-xl`, which
            `app/typography.css` enlarges; held at its original 20px here like
            the rest of the sidebar. `!` to beat that unlayered rule. */}
        <div className="flex w-[34px] shrink-0 items-center justify-center [&_span.text-xl]:text-[length:20px]!">
          <Avatar type="text" initials={initials} size="m" />
        </div>
        <div
          className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ease-in-out ${
            collapsed ? "max-w-0 opacity-0" : "max-w-[180px] flex-1 opacity-100"
          }`}
        >
          <div className="min-w-0 flex-1 text-left">
            {/* Original sidebar sizes, written `text-[length:Npx]` so
                `app/typography.css` does not enlarge them — see `AppSidebar`. */}
            <p className="truncate text-[length:13px] leading-tight font-medium whitespace-nowrap text-white">
              {name}
            </p>
            <p className="truncate text-[length:11px] leading-tight whitespace-nowrap text-slate-400">
              {role}
            </p>
          </div>
          <CaretUpDownIcon
            size={15}
            className={`shrink-0 transition-colors ${open ? "text-slate-200" : "text-slate-500 group-hover:text-slate-300"}`}
          />
        </div>
      </button>

      {/* Dropdown — `md` and up */}
      {open && !isMobile && (
        <div
          role="menu"
          aria-label={t.nav.accountOf(name)}
          style={{ left: placement.left, bottom: placement.bottom, width: placement.width }}
          className="fixed z-50 animate-in overflow-hidden rounded-xl border border-border bg-card shadow-lg duration-150 fade-in"
        >
          {/* Repeated here because the collapsed rail hides the row's own
              labels — without it the menu gives no clue whose account it is. */}
          <div className="border-b border-[var(--border-default)] px-3 py-2.5">
            <p className="truncate text-[length:13px] leading-tight font-medium text-foreground">
              {name}
            </p>
            <p className="truncate text-[length:11px] leading-tight text-muted-foreground">
              {role}
            </p>
          </div>
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[length:13px] text-destructive transition-colors hover:bg-[var(--bg-default-secondary)]"
            >
              <SignOutIcon size={16} className="shrink-0" />
              {t.nav.logout}
            </button>
          </div>
        </div>
      )}

      {/* Bottom sheet — below `md`. Rows are sized for thumbs rather than
          reusing the dropdown's 13px/py-2, and the identity block leads with
          the avatar since there is room for it here. */}
      <Sheet
        open={open && isMobile}
        onOpenChange={(next) => {
          if (!next) setPlacement(null);
        }}
      >
        {/* Own backdrop, so the dimming covers the sidebar drawer instead of
            stopping at its edge and leaving it lit beside a dimmed page.
            Pressing it closes the sheet, which is the point: the drawer is
            behind the backdrop, not beside it.

            `forceRender` is load-bearing. On mobile this sheet opens from
            inside the drawer's own dialog, and Base UI skips the backdrop of a
            nested dialog entirely (`enabled: forceRender || !nested` in
            `DialogBackdrop`) — without it nothing renders and no z-index helps.

            Stacked past the `z-50` the drawer and its scrim share, at 40%
            rather than the drawer's 50% because it lands on top of that one:
            the page behind reads as the sum of both. */}
        <SheetOverlay forceRender className="z-[60] bg-black/40" />
        <SheetContent
          side="bottom"
          showCloseButton={false}
          aria-label={t.nav.accountOf(name)}
          className="z-[61] gap-0 rounded-t-2xl pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto mt-3 mb-1 h-1 w-9 shrink-0 rounded-full bg-[var(--border-default)]" />
          <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-4 py-3">
            <Avatar type="text" initials={initials} size="m" />
            <div className="min-w-0">
              <p className="truncate text-[length:15px] leading-tight font-medium text-foreground">
                {name}
              </p>
              <p className="truncate text-[length:12px] leading-tight text-muted-foreground">
                {role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left text-[length:15px] text-destructive transition-colors active:bg-[var(--bg-default-secondary)]"
          >
            <SignOutIcon size={20} className="shrink-0" />
            {t.nav.logout}
          </button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
