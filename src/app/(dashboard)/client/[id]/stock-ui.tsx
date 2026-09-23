"use client";

import {
  BellIcon,
  BowlFoodIcon,
  DesktopTowerIcon,
  FactoryIcon,
  FirstAidIcon,
  HouseLineIcon,
  LightbulbFilamentIcon,
  LightningIcon,
  MoneyWavyIcon,
  PhoneIcon,
  ShirtFoldedIcon,
  ShoppingBagIcon,
  WallIcon,
} from "@phosphor-icons/react";
import type { Trend } from "./stock-data";

/** Matches the catalog's other card shadow tokens (`MutualFundCard.tsx`'s
 *  `LIST_CARD_CLASS`), just the slightly heavier variant Figma uses here. */
export const CARD_SHADOW =
  "shadow-[0px_0px_2px_0px_rgba(102,102,102,0.16),0px_4px_8px_0px_rgba(102,102,102,0.12)]";

/** Note: `SetIndustrySectorDetail.tsx` deliberately keeps its own copy with a
 *  lighter `flat` (#6a7282) — Figma's hero band uses a different neutral, so
 *  these are NOT interchangeable. Only `TREND_PILL_BG` is shared with it. */
export const TREND_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#4a5565" };
export const TREND_PILL_BG: Record<Trend, string> = { up: "#dbfce7", down: "#fef2f2", flat: "#f3f4f6" };

/** Figma "Percent Change" pill — success/danger/neutral tri-state badge used
 *  throughout the Stock tab (market boards, stock rows, sector list). Figma
 *  ships two sizes: "Large" (14px, board index cards) and "Small" (9px,
 *  compact instrument rows) — `size` picks between them. */
const PERCENT_PILL_SIZE: Record<"sm" | "md" | "lg", string> = {
  sm: "text-[9px] px-1 py-0.5",
  md: "text-xs px-1.5 py-0.5",
  lg: "text-sm px-1.5 py-0.5",
};

export function PercentPill({
  trend,
  value,
  size = "md",
}: {
  trend: Trend;
  value: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap ${PERCENT_PILL_SIZE[size]}`}
      style={{ backgroundColor: TREND_PILL_BG[trend], color: TREND_TEXT[trend] }}
    >
      {value}
    </span>
  );
}

/** Sector id → glyph. Covers both the Thai SET taxonomy (resources, services,
 *  agro-food, …) and the US GICS one (energy, material, health-care, …); ids
 *  outside the map render nothing, which is how non-SET sectors stay blank on
 *  the Thai-only detail page. */
export const SECTOR_ICON = {
  resources: LightningIcon,
  services: BellIcon,
  industrials: FactoryIcon,
  "consumer-products": ShoppingBagIcon,
  "agro-food": BowlFoodIcon,
  financials: MoneyWavyIcon,
  technology: DesktopTowerIcon,
  "property-construction": HouseLineIcon,
  energy: LightningIcon,
  material: WallIcon,
  "consumer-discretionary": ShoppingBagIcon,
  "consumer-staples": ShirtFoldedIcon,
  "health-care": FirstAidIcon,
  "information-technology": DesktopTowerIcon,
  "communication-services": PhoneIcon,
  utilities: LightbulbFilamentIcon,
  "real-estate": HouseLineIcon,
} as const;

/** Omit `color` to inherit from the caller's wrapper (the sector list and
 *  heatmap tiles colour their own span); pass it to get the wrapper for free. */
export function SectorGlyph({ id, size, color }: { id: string; size: number; color?: string }) {
  const Icon = SECTOR_ICON[id as keyof typeof SECTOR_ICON];
  if (!Icon) return null;
  const glyph = <Icon size={size} weight="fill" />;
  return color ? <span style={{ color }}>{glyph}</span> : glyph;
}
