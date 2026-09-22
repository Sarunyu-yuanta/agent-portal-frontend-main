"use client";

import { useEffect, type ReactNode } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";

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

/** Underline tab row — text-only (mutual fund themes, SET sector). */
export function CatalogDetailTextTabs<T extends string>({
  items,
  activeId,
  onSelect,
  widthClass = CATALOG_DETAIL_WIDTH.narrow,
  fill = true,
}: {
  items: { id: T; label: string }[];
  activeId: T;
  onSelect: (id: T) => void;
  widthClass?: string;
  /** Even-width tabs stretched to fill the row — fine for mutual-fund's few
   *  short theme names. SET sector's 8 longer labels don't fit that way (the
   *  shrink below their own text width and overlap), so it passes `false` for
   *  natural-width tabs that scroll horizontally instead. */
  fill?: boolean;
}) {
  return (
    <div className={widthClass}>
      <div className="w-full overflow-x-auto hide-scrollbar xl:overflow-visible" style={{ scrollbarWidth: "none" }}>
        <div className={`flex w-full min-w-max ${fill ? "xl:min-w-0" : ""}`}>
          {items.map(({ id, label }) => {
            const active = id === activeId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelect(id)}
                className={`flex items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-5 whitespace-nowrap ${
                  fill ? "min-w-[80px] flex-1" : "shrink-0"
                } ${active ? "border-[#0a6ee7] text-[#0a6ee7]" : "border-black/10 text-[#6a7282]"}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
