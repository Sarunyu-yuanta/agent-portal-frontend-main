"use client";

import type { ReactNode } from "react";
import { THEME_HERO_COLOR } from "./MutualFundThemesSection";
import {
  CatalogDetailBackHeader,
  CatalogDetailDesktopShell,
  CatalogDetailTextTabs,
  CATALOG_DETAIL_WIDTH,
} from "./ProductCatalogTabbedDetailLayout";

/** Figma 39839:525396 theme-detail hero band — shared by mutual-fund themes and SET sectors. */
export function CatalogDetailThemeHero({
  icon,
  title,
  description,
  meta,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="relative w-full overflow-hidden" style={{ backgroundColor: THEME_HERO_COLOR.glow }}>
      <div className="relative mx-auto flex h-[126px] w-full max-w-[996px] shrink-0 items-center gap-1.5 overflow-visible px-4 pb-2.5 pt-2.5 md:px-8 lg:px-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {icon}
            <p
              className="min-w-0 flex-1 truncate text-xl font-bold leading-[30px]"
              style={{ color: THEME_HERO_COLOR.title }}
            >
              {title}
            </p>
          </div>
          <p className="text-sm font-normal leading-5 text-[#4a5565]">{description}</p>
          {meta ? (
            <p className="text-[9px] font-normal leading-[14px] text-[#6a7282]">{meta}</p>
          ) : null}
        </div>
        {trailing}
      </div>
    </div>
  );
}

/**
 * Full mutual-fund theme detail frame (39839:525396): back, underline tabs, hero,
 * gradient bar, white list panel. Callers supply hero + list controls + grid.
 */
export function CatalogTabbedDetailView<T extends string>({
  title,
  onBack,
  tabItems,
  activeTabId,
  onTabSelect,
  hero,
  listControls,
  countLabel,
  children,
  visibility = "desktop-only",
}: {
  title: string;
  onBack: () => void;
  tabItems: { id: T; label: string }[];
  activeTabId: T;
  onTabSelect: (id: T) => void;
  hero: ReactNode;
  /** Rows above the grid (filters, sort, …) — rendered inside the white panel. */
  listControls?: ReactNode;
  countLabel?: string;
  children: ReactNode;
  /** MF keeps a separate mobile page; SET sector reuses this layout on all breakpoints. */
  visibility?: "desktop-only" | "always";
}) {
  const body = (
    <>
      <CatalogDetailBackHeader title={title} onBack={onBack} className="!pt-8" />
      <CatalogDetailTextTabs sticky items={tabItems} activeId={activeTabId} onSelect={onTabSelect} />
      {hero}
      <div
        className="relative z-10 w-full rounded-xl"
        style={{
          backgroundImage: `linear-gradient(to right, ${THEME_HERO_COLOR.from}, ${THEME_HERO_COLOR.to})`,
        }}
      >
        <div className="w-full rounded-t-xl bg-white pt-4 pb-6">
          <div className={`flex flex-col gap-6 ${CATALOG_DETAIL_WIDTH.narrow}`}>
            {listControls ? <div className="flex w-full flex-col gap-3">{listControls}</div> : null}
            {countLabel ? (
              <p className="w-full px-3 text-sm font-normal leading-5 text-[#101828]">{countLabel}</p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </>
  );

  if (visibility === "always") {
    return <div className="flex w-full flex-1 flex-col bg-white pb-20">{body}</div>;
  }
  return <CatalogDetailDesktopShell>{body}</CatalogDetailDesktopShell>;
}
