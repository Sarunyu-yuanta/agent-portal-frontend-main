"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { useMemo, type CSSProperties } from "react";
import { CaretRightIcon } from "@phosphor-icons/react";
import {
  MARKET_LATEST_UPDATE,
  type HeatmapLayout,
  type IndustrySectorMarket,
  type SectorRow,
  type Trend,
} from "@/features/catalog/stock/lib/stock-data";
import {
  industrySectorHref,
  localizeSector,
} from "@/features/catalog/stock/lib/stock-industry-sector-data";
import { CARD_SHADOW, PercentPill, SectorGlyph, StockSectionEmpty, TREND_TEXT } from "./stock-ui";
import { useT } from "@/i18n/I18nProvider";

function SectorListRow({ sector, onNavigate }: { sector: SectorRow; onNavigate?: () => void }) {
  const inner = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* Figma "Sector_list" row icons render solid brand blue regardless of
         *  the sector's own trend color (node 26739:57814 family). */}
        <span style={{ color: "#0a6ee7" }}>
          <SectorGlyph id={sector.id} size={24} />
        </span>
        <p className="flex-1 truncate text-base" style={{ color: "#4a5565" }}>
          {sector.name}
        </p>
      </div>
      {sector.trend === "flat" ? (
        <span className="text-sm" style={{ color: "rgba(0,0,0,0.35)" }}>
          {sector.changePercent}
        </span>
      ) : sector.listAccent === "teal" ? (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm" style={{ color: "#00786f" }}>
            {sector.changeAmount}
          </span>
          <span
            className="inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-normal whitespace-nowrap"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <span style={{ color: "#008236" }}>+</span>
            <span style={{ color: "#00786f" }}>{sector.changePercent.replace(/^[+-]/, "")}</span>
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm" style={{ color: TREND_TEXT[sector.trend] }}>
            {sector.changeAmount}
          </span>
          <PercentPill trend={sector.trend} value={sector.changePercent} />
        </div>
      )}
      <CaretRightIcon size={24} className="shrink-0 text-neutral-600" />
    </>
  );
  // Figma's "Sector_list" carries the divider on every row, last one included.
  const className = "flex gap-4 items-center px-6 py-4 w-full border-b border-black/10";
  if (onNavigate) {
    return (
      <button
        type="button"
        onClick={onNavigate}
        className={`${className} w-full cursor-pointer text-left transition-colors hover:bg-black/[0.02]`}
      >
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

const HEATMAP_TILE_BG: Record<Trend, string> = { up: "#f0fdf4", down: "#fef2f2", flat: "#f9fafb" };
const HEATMAP_TILE_BORDER: Record<Trend, string> = {
  up: "#b9f8cf",
  down: "#ffe2e2",
  flat: "#e5e7eb",
};
/** Figma's "Heat map เมื่อมีแค่ 2 Sectors" permutation (node 25177:23062) uses
 *  a bolder green/300 & red/400 palette for its two hero tiles instead of the
 *  soft pastel one the crowded 8-sector grid uses. */
const HEATMAP_TILE_BG_BOLD: Record<Trend, string> = {
  up: "#b9f8cf",
  down: "#ffa2a2",
  flat: "#e5e7eb",
};
const HEATMAP_TILE_BORDER_BOLD: Record<Trend, string> = {
  up: "#7bf1a8",
  down: "#ff6467",
  flat: "#d1d5dc",
};
const HEATMAP_TILE_BG_MID: Record<Trend, string> = {
  up: "#dbfce7",
  down: "#ffe2e2",
  flat: "#f3f3f3",
};
const HEATMAP_TILE_BORDER_MID: Record<Trend, string> = {
  up: "#b9f8cf",
  down: "#ffc9c9",
  flat: "rgba(0,0,0,0.08)",
};
const HEATMAP_TEXT: Record<Trend, string> = { up: "#008236", down: "#c10007", flat: "#6a7282" };

/** Figma "Sector_list" heatmap tile (node 22907:32081 family) has 3 distinct
 *  typographic tiers, not just a size split: "lg" (Resources/Services/
 *  Industrials — 24px icon, 14px label+value, 14px pill), "md" (Consumer
 *  Products/Agro & Food — 20px icon, 12px caption label+value, 9px pill),
 *  and "xs" (Financials/Technology/Property — 16px icon, plain 9px gray
 *  label+value, no pill). */
function HeatmapTile({
  sector,
  variant,
  palette = "soft",
  /** Figma tints the Thai treemap's mid-size labels with text/default/secondary
   *  while the US board keeps them at text/default/primary. */
  labelTone = "primary",
  style,
}: {
  /** Missing when the feed leaves a sector out — the tile keeps its slot, empty. */
  sector: SectorRow | undefined;
  variant: "lg" | "md" | "sm" | "xs";
  palette?: "soft" | "mid" | "bold";
  labelTone?: "primary" | "secondary";
  style?: CSSProperties;
}) {
  if (!sector) {
    return <div aria-hidden className="min-w-0 flex-1 rounded-md bg-neutral-100" style={style} />;
  }
  const trend = sector.heatmapTrend ?? sector.trend;
  const changeAmount = sector.heatmapChangeAmount ?? sector.changeAmount;
  const changePercent = sector.heatmapChangePercent ?? sector.changePercent;
  const bg =
    palette === "bold"
      ? HEATMAP_TILE_BG_BOLD
      : palette === "mid"
        ? HEATMAP_TILE_BG_MID
        : HEATMAP_TILE_BG;
  const border =
    palette === "bold"
      ? HEATMAP_TILE_BORDER_BOLD
      : palette === "mid"
        ? HEATMAP_TILE_BORDER_MID
        : HEATMAP_TILE_BORDER;
  const iconSize = variant === "lg" ? 24 : variant === "xs" ? 16 : 20;
  const label = sector.heatmapName ?? sector.name;
  const wrap = label.includes("\n");
  const iconColor = variant === "xs" || trend === "flat" ? "#6a7282" : HEATMAP_TEXT[trend];
  const labelColor = labelTone === "secondary" ? "#4a5565" : "#101828";

  return (
    <div
      // Every tier is one flex-wrap track, like Figma: icon and label share the
      // first line and the quote wraps onto its own full-width line beneath.
      // Nesting the quote beside the icon instead would starve it of width and
      // push the pill past the tile edge. `overflow-hidden` matches Figma's
      // overflow-clip, so a long label can never bleed outside the tile.
      className={`flex min-h-0 w-full min-w-0 flex-wrap self-stretch overflow-hidden rounded-lg p-2 ${
        variant === "sm" ? "items-start" : "items-center"
      } ${
        variant === "lg"
          ? "content-start gap-2"
          : variant === "xs"
            ? "content-center gap-1"
            : "content-start gap-1.5"
      }`}
      style={{
        backgroundColor: bg[trend],
        border: `1px solid ${border[trend]}`,
        ...style,
      }}
    >
      <span className="shrink-0" style={{ color: iconColor }}>
        <SectorGlyph id={sector.id} size={iconSize} />
      </span>
      {variant === "lg" && (
        <>
          <span
            className={`shrink-0 text-sm ${wrap ? "whitespace-pre" : "whitespace-nowrap"}`}
            style={{ color: labelColor }}
          >
            {label}
          </span>
          <span className="text-sm" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="lg" />}
        </>
      )}
      {variant === "md" && (
        <>
          <span
            className={`min-w-10 shrink-0 text-sm ${wrap ? "whitespace-pre" : ""}`}
            style={{ color: "#4a5565" }}
          >
            {label}
          </span>
          <span className="text-sm" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="lg" />}
        </>
      )}
      {variant === "sm" && (
        <>
          <span
            className={`shrink-0 text-xs leading-[20px] ${wrap ? "whitespace-pre" : ""}`}
            style={{ color: labelColor }}
          >
            {label}
          </span>
          <span className="text-xs" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="sm" />}
        </>
      )}
      {variant === "xs" && (
        <>
          <span className="min-w-10 flex-1 truncate text-micro" style={{ color: "#4a5565" }}>
            {label}
          </span>
          <span className="shrink-0 text-micro" style={{ color: "#6a7282" }}>
            {changePercent}
          </span>
        </>
      )}
    </div>
  );
}

function UsSectorHeatmap({ byId }: { byId: Record<string, SectorRow> }) {
  return (
    <div className="hidden w-[556px] shrink-0 gap-1.5 self-stretch lg:flex">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <HeatmapTile sector={byId.energy} variant="lg" palette="bold" style={{ flex: "1 1 0%" }} />
        <HeatmapTile
          sector={byId.material}
          variant="lg"
          palette="bold"
          style={{ flex: "1 1 0%" }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <HeatmapTile
            sector={byId.industrials}
            variant="lg"
            palette="mid"
            style={{ flex: "1 1 0%" }}
          />
          <div className="flex min-h-0 gap-1.5" style={{ flex: "1 1 0%" }}>
            <HeatmapTile sector={byId["consumer-discretionary"]} variant="md" />
            <HeatmapTile sector={byId["consumer-staples"]} variant="md" palette="mid" />
          </div>
          <div className="flex shrink-0 gap-1.5">
            <HeatmapTile
              sector={byId["health-care"]}
              variant="sm"
              palette="mid"
              style={{ flex: "1 1 0%" }}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <HeatmapTile
                sector={byId["communication-services"]}
                variant="sm"
                style={{ flex: "1 1 0%" }}
              />
              <HeatmapTile sector={byId.utilities} variant="sm" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5" style={{ height: 50 }}>
          <HeatmapTile
            sector={byId.financials}
            variant="sm"
            palette="mid"
            style={{ flex: "1 1 0%" }}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <HeatmapTile sector={byId["information-technology"]} variant="xs" />
            <HeatmapTile sector={byId["real-estate"]} variant="xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Figma ships three heatmap permutations:
 *  - "Heat map เมื่อมีแค่ 2 Sectors" (node 25177:23062) — stacked hero tiles.
 *    Chosen by the data, not a flag: a market that reports two or fewer sectors
 *    gets it, and the list beside it renders the same two rows.
 *  - The full 8-sector Thai treemap (node 23219:28885).
 *  - US GICS treemap (node 23219:37166) — Energy/Material heroes plus a denser
 *    right column that also packs Health Care, Communication, Utilities.
 */
function SectorHeatmap({ sectors, layout }: { sectors: SectorRow[]; layout: HeatmapLayout }) {
  if (sectors.length === 0) return null;

  if (sectors.length <= 2) {
    // Two rows of list can't hold the card open on their own, so the hero tiles
    // keep Figma's 448px content height (node 25177:23750) as a floor.
    return (
      <div className="hidden min-h-[448px] w-[556px] shrink-0 flex-col gap-1.5 self-stretch lg:flex">
        <HeatmapTile sector={sectors[0]} variant="lg" palette="bold" style={{ flex: "235 1 0%" }} />
        {sectors[1] && (
          <HeatmapTile
            sector={sectors[1]}
            variant="lg"
            palette="bold"
            style={{ flex: "207 1 0%" }}
          />
        )}
      </div>
    );
  }

  const byId = Object.fromEntries(sectors.map((s) => [s.id, s])) as Record<string, SectorRow>;

  if (layout === "treemap-us") {
    return <UsSectorHeatmap byId={byId} />;
  }

  return (
    <div className="hidden w-[556px] shrink-0 gap-1.5 self-stretch lg:flex">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <HeatmapTile
          sector={byId.resources}
          variant="lg"
          palette="bold"
          style={{ flex: "235 1 0%" }}
        />
        <HeatmapTile
          sector={byId.services}
          variant="lg"
          palette="bold"
          style={{ flex: "207 1 0%" }}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-h-0 flex-1 flex-col gap-1.5">
          <HeatmapTile
            sector={byId.industrials}
            variant="lg"
            palette="mid"
            style={{ flex: "118 1 0%" }}
          />
          {/* Both tiles sit directly in the flex row — a wrapper div would swallow
           *  their `self-stretch` and leave the shorter one floating. */}
          <div className="flex min-h-0 gap-1.5" style={{ flex: "94 1 0%" }}>
            <HeatmapTile
              sector={byId["consumer-products"]}
              variant="sm"
              labelTone="secondary"
              style={{ width: 108, flex: "0 0 auto" }}
            />
            <HeatmapTile
              sector={byId["agro-food"]}
              variant="sm"
              labelTone="secondary"
              style={{ flex: "1 1 0%" }}
            />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 gap-1.5">
          <HeatmapTile sector={byId.financials} variant="xs" style={{ flex: "1 1 0%" }} />
          {/* Figma pins this stack to the width of its widest tile (123px) and
           *  lets Financials take the slack. */}
          <div className="flex w-[123px] shrink-0 flex-col gap-1.5">
            <HeatmapTile sector={byId.technology} variant="xs" style={{ flex: "1 1 0%" }} />
            <HeatmapTile
              sector={byId["property-construction"]}
              variant="xs"
              style={{ flex: "1 1 0%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Industry-sector card shared by every market tab (Thai/US/HK/VN): the sector
 *  list on the left, the market's heatmap permutation on the right. Everything
 *  that differs per market arrives as props from `MARKET_CATALOG`. */
export function SetIndustrySectorSection({
  sectors: feedSectors,
  layout,
  sectorsMarket,
}: {
  sectors: SectorRow[];
  layout: HeatmapLayout;
  /** Taxonomy the rows drill into — decides which detail route they open. */
  sectorsMarket: IndustrySectorMarket;
}) {
  const t = useT();
  const router = useLocalizedRouter();
  const sectors = useMemo(
    () => feedSectors.map((s) => localizeSector(t, sectorsMarket, s)),
    [feedSectors, sectorsMarket, t],
  );
  return (
    <div className={`flex w-full flex-col gap-4 rounded-xl bg-white p-6 ${CARD_SHADOW}`}>
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-lg font-bold" style={{ color: "#101828" }}>
            {t.stock.sectorSection.title}
          </p>
          <p className="text-sm" style={{ color: "#4a5565" }}>
            {t.stock.sectorSection.desc}
          </p>
        </div>
        <p className="shrink-0 text-xs" style={{ color: "#6a7282" }}>
          {t.stock.latestUpdate(MARKET_LATEST_UPDATE)}
        </p>
      </div>
      {sectors.length === 0 ? (
        <StockSectionEmpty title={t.stock.empty.sectors} />
      ) : (
        <div className="flex w-full items-stretch gap-10">
          <div className="min-w-0 flex-1">
            {sectors.map((s) => (
              <SectorListRow
                key={s.id}
                sector={s}
                onNavigate={() => router.push(industrySectorHref(s.id, sectorsMarket))}
              />
            ))}
          </div>
          <SectorHeatmap sectors={sectors} layout={layout} />
        </div>
      )}
    </div>
  );
}
