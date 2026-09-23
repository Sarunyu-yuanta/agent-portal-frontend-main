"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";

/** Content width tokens shared by catalog drill-in pages (MF theme detail, SET sector, …). */
export const CATALOG_DETAIL_WIDTH = {
  /** Figma mutual-fund theme detail — 996px column. */
  narrow: "mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0",
  /** Figma SET Industry Sector — 1280px column with 80px side inset on large screens. */
  wide: "mx-auto w-full max-w-[1280px] px-4 md:px-8 lg:px-20",
} as const;

export function useCatalogDetailScrollTop(deps: readonly unknown[]) {
  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- scroll reset when drill-in identity changes
  }, deps);
}

/** Desktop shell used by mutual-fund theme detail; mobile pages supply their own tree. */
export function CatalogDetailDesktopShell({ children }: { children: ReactNode }) {
  return <div className="hidden w-full flex-1 flex-col bg-white pb-20 lg:flex">{children}</div>;
}

/** Full-width shell when the design has no separate mobile frame (e.g. SET sector desktop Figma). */
export function CatalogDetailPageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`flex w-full flex-1 flex-col bg-white pb-16 lg:pb-20 ${className}`}>{children}</div>;
}

export function CatalogDetailBackHeader({
  title,
  onBack,
  widthClass = CATALOG_DETAIL_WIDTH.narrow,
  className = "",
}: {
  title: string;
  onBack: () => void;
  widthClass?: string;
  className?: string;
}) {
  return (
    <div className={`${widthClass} ${className}`}>
      <div className="flex h-[46px] items-center gap-2 py-2 lg:pt-6 lg:pb-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label="กลับ"
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-[26px] text-[#101828] lg:leading-7">
          {title}
        </h1>
      </div>
    </div>
  );
}

/** Figma "Tabs" arrow (node 22907:35400/35410) — 32px square, 1px hairline
 *  border, 18px caret. Kept mounted and faded out at the ends so the tab strip
 *  never reflows as you scroll, which is what the design shows for the
 *  at-the-start state. */
function TabScrollButton({
  direction,
  hidden,
  onClick,
}: {
  direction: "prev" | "next";
  hidden: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? CaretLeftIcon : CaretRightIcon;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden}
      aria-label={direction === "prev" ? "เลื่อนแท็บไปทางซ้าย" : "เลื่อนแท็บไปทางขวา"}
      className={`flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md border border-black/10 bg-white text-[#4a5565] transition-opacity hover:bg-black/[0.02] ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <Icon size={18} />
    </button>
  );
}

/** Selecting a tab on a dynamic route makes the App Router remount this whole
 *  subtree (see `navigateWithoutFlicker` in `SetIndustrySectorDetail`), so the
 *  strip comes back as a fresh node at `scrollLeft: 0`. Parking the offset at
 *  module scope, keyed by the tab set, is what survives that remount. */
const tabStripScrollMemory = new Map<string, number>();

/** How long after a tab switch a remount may still claim the remembered offset. */
const TAB_STRIP_RESTORE_WINDOW_MS = 1500;

/** When a tab switch last asked for the offset to outlive the remount it causes.
 *
 *  Module scope outlives the page, not only the remount, so the memory above on
 *  its own also survived leaving the section entirely: coming back and opening
 *  Resources reopened the strip scrolled to wherever some earlier visit left it,
 *  with the first tabs cut off to the left. The offset is only ever meant to
 *  bridge one navigation, so it expires — the remount a tab switch causes lands
 *  within a few hundred milliseconds, and anything later is a fresh arrival.
 *
 *  A timestamp rather than a flag the mount consumes: React attaches the ref
 *  twice under StrictMode in development, so the first mount would eat the flag
 *  and the second would find nothing left to restore. */
let tabStripScrollArmedAt = 0;

/** Call immediately before a navigation that only changes which tab is active,
 *  so the strip it remounts keeps its scroll offset instead of resetting. Any
 *  other way of reaching the page leaves this unarmed and gets the default. */
export function preserveTabStripScroll() {
  tabStripScrollArmedAt = Date.now();
}

/** Tracks how far the tab strip is scrolled so the arrows can hide at each end.
 *  Both edges read `true` when the tabs fit outright, which hides both arrows. */
function useTabStripScroll(enabled: boolean, memoryKey: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    // 1px slack: fractional scroll offsets never settle exactly on the bounds.
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
    if (enabled) tabStripScrollMemory.set(memoryKey, el.scrollLeft);
  }, [enabled, memoryKey]);

  /** Runs in the commit phase, before paint — restoring here means the strip is
   *  never painted at the left edge first, so switching tabs shows no jump. */
  const attachStrip = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node;
      if (!node || !enabled) return;
      const armed = Date.now() - tabStripScrollArmedAt < TAB_STRIP_RESTORE_WINDOW_MS;
      const remembered = armed ? tabStripScrollMemory.get(memoryKey) : undefined;
      if (remembered) {
        node.scrollLeft = remembered;
        return;
      }
      // Fresh arrival (deep link, the sector list, or coming back to the
      // section): nothing to restore, so centre whichever tab is active. For the
      // first few sectors that resolves to a negative offset and the browser
      // clamps it to 0, which is the left edge; for one further along it scrolls
      // only as far as it takes to show it rather than stranding it off-screen.
      // Set `scrollLeft` directly rather than `scrollIntoView`, which would also
      // scroll the page vertically.
      const active = node.querySelector<HTMLElement>('[data-tab-active="true"]');
      if (active) node.scrollLeft = active.offsetLeft - (node.clientWidth - active.offsetWidth) / 2;
    },
    [enabled, memoryKey],
  );

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    // Re-measure on resize: whether the strip overflows depends on the width
    // it was given, not just on its content.
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, [enabled, sync]);

  const scrollByPage = useCallback((dir: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.8), behavior: "smooth" });
  }, []);

  return { attachStrip, atStart, atEnd, scrollByPage };
}

/** Underline tab row — text-only (mutual fund themes) or with a leading glyph
 *  plus scroll arrows (SET/US industry sector, Figma node 22907:35399). */
export function CatalogDetailTextTabs<T extends string>({
  items,
  activeId,
  onSelect,
  widthClass = CATALOG_DETAIL_WIDTH.narrow,
  fill = true,
  scrollButtons = false,
}: {
  items: { id: T; label: string; icon?: ReactNode }[];
  activeId: T;
  onSelect: (id: T) => void;
  widthClass?: string;
  /** Even-width tabs stretched to fill the row — fine for mutual-fund's few
   *  short theme names. SET sector's 8 longer labels don't fit that way (the
   *  shrink below their own text width and overlap), so it passes `false` for
   *  natural-width tabs that scroll horizontally instead. */
  fill?: boolean;
  /** Flank the strip with prev/next arrows. Opt-in so the mutual-fund caller,
   *  whose tabs always fit, keeps its current chrome. */
  scrollButtons?: boolean;
}) {
  // Identifies this strip across remounts. The tab set is what makes a strip
  // distinct (SET's 8 sectors vs US's 11), and it is stable while you switch
  // between them — exactly the lifetime the remembered offset should have.
  const memoryKey = items.map((i) => i.id).join("|");
  const { attachStrip, atStart, atEnd, scrollByPage } = useTabStripScroll(scrollButtons, memoryKey);

  const strip = (
    <div
      ref={attachStrip}
      className={`w-full overflow-x-auto hide-scrollbar ${scrollButtons ? "" : "xl:overflow-visible"}`}
      style={{ scrollbarWidth: "none" }}
    >
      <div className={`flex w-full min-w-max ${fill ? "xl:min-w-0" : ""}`}>
        {items.map(({ id, label, icon }) => {
          const active = id === activeId;
          return (
            <button
              key={id}
              type="button"
              data-tab-active={active}
              onClick={() => onSelect(id)}
              className={`flex items-center justify-center gap-1.5 border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                fill ? "min-w-[80px] flex-1" : "shrink-0"
              } ${active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"}`}
            >
              {icon && <span className="shrink-0">{icon}</span>}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={widthClass}>
      {scrollButtons ? (
        <div className="flex w-full items-center gap-4">
          <TabScrollButton direction="prev" hidden={atStart} onClick={() => scrollByPage(-1)} />
          <div className="min-w-0 flex-1">{strip}</div>
          <TabScrollButton direction="next" hidden={atEnd} onClick={() => scrollByPage(1)} />
        </div>
      ) : (
        strip
      )}
    </div>
  );
}
