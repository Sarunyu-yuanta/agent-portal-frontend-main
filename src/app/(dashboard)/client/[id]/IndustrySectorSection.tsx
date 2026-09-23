"use client";

import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { CaretRightIcon } from "@phosphor-icons/react";
import {
  MARKET_LATEST_UPDATE,
  type HeatmapLayout,
  type IndustrySectorMarket,
  type SectorRow,
  type Trend,
} from "./stock-data";
import { industrySectorHref } from "./stock-industry-sector-data";
import { CARD_SHADOW, PercentPill, SectorGlyph, TREND_TEXT } from "./stock-ui";

function SectorListRow({
  sector,
  showBorder,
  onNavigate,
}: {
  sector: SectorRow;
  showBorder: boolean;
  onNavigate?: () => void;
}) {
  const inner = (
    <>
      <div className="flex gap-4 items-center flex-1 min-w-0">
        {/* Figma "Sector_list" row icons render solid brand blue regardless of
         *  the sector's own trend color (node 26739:57814 family). */}
        <span style={{ color: "#0a6ee7" }}>
          <SectorGlyph id={sector.id} size={20} />
        </span>
        <p className="flex-1 text-base truncate" style={{ color: "#4a5565" }}>
          {sector.name}
        </p>
      </div>
      {sector.trend === "flat" ? (
        <span className="text-sm" style={{ color: "rgba(0,0,0,0.35)" }}>
          {sector.changePercent}
        </span>
      ) : sector.listAccent === "teal" ? (
        <div className="flex gap-2 items-center justify-end">
          <span className="text-sm" style={{ color: "#00786f" }}>
            {sector.changeAmount}
          </span>
          <span
            className="inline-flex shrink-0 items-center rounded font-normal whitespace-nowrap text-xs px-1.5 py-0.5"
            style={{ backgroundColor: "#f0fdfa" }}
          >
            <span style={{ color: "#008236" }}>+</span>
            <span style={{ color: "#00786f" }}>
              {sector.changePercent.replace(/^[+-]/, "")}
            </span>
          </span>
        </div>
      ) : (
        <div className="flex gap-2 items-center justify-end">
          <span className="text-sm" style={{ color: TREND_TEXT[sector.trend] }}>
            {sector.changeAmount}
          </span>
          <PercentPill trend={sector.trend} value={sector.changePercent} />
        </div>
      )}
      <CaretRightIcon size={24} className="text-[#4a5565] shrink-0" />
    </>
  );
  const className = `flex gap-4 items-center px-6 py-4 w-full ${showBorder ? "border-b border-black/10" : ""}`;
  if (onNavigate) {
    return (
      <button type="button" onClick={onNavigate} className={`${className} text-left w-full cursor-pointer hover:bg-black/[0.02] transition-colors`}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

const HEATMAP_TILE_BG: Record<Trend, string> = { up: "#f0fdf4", down: "#fef2f2", flat: "#f9fafb" };
const HEATMAP_TILE_BORDER: Record<Trend, string> = { up: "#b9f8cf", down: "#ffe2e2", flat: "#e5e7eb" };
/** Figma's "Heat map เมื่อมีแค่ 2 Sectors" permutation (node 25177:23062) uses
 *  a bolder green/300 & red/400 palette for its two hero tiles instead of the
 *  soft pastel one the crowded 8-sector grid uses. */
const HEATMAP_TILE_BG_BOLD: Record<Trend, string> = { up: "#b9f8cf", down: "#ffa2a2", flat: "#e5e7eb" };
const HEATMAP_TILE_BORDER_BOLD: Record<Trend, string> = { up: "#7bf1a8", down: "#ff6467", flat: "#d1d5dc" };
const HEATMAP_TILE_BG_MID: Record<Trend, string> = { up: "#dbfce7", down: "#ffe2e2", flat: "#f3f3f3" };
const HEATMAP_TILE_BORDER_MID: Record<Trend, string> = { up: "#b9f8cf", down: "#ffc9c9", flat: "rgba(0,0,0,0.08)" };
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
  style,
}: {
  sector: SectorRow;
  variant: "lg" | "md" | "sm" | "xs";
  palette?: "soft" | "mid" | "bold";
  style?: CSSProperties;
}) {
  const trend = sector.heatmapTrend ?? sector.trend;
  const changeAmount = sector.heatmapChangeAmount ?? sector.changeAmount;
  const changePercent = sector.heatmapChangePercent ?? sector.changePercent;
  const bg = palette === "bold" ? HEATMAP_TILE_BG_BOLD : palette === "mid" ? HEATMAP_TILE_BG_MID : HEATMAP_TILE_BG;
  const border = palette === "bold" ? HEATMAP_TILE_BORDER_BOLD : palette === "mid" ? HEATMAP_TILE_BORDER_MID : HEATMAP_TILE_BORDER;
  const iconSize = variant === "lg" ? 24 : variant === "xs" ? 16 : 20;
  const label = sector.heatmapName ?? sector.name;
  const wrap = label.includes("\n");
  const iconColor = variant === "xs" || trend === "flat" ? "#6a7282" : HEATMAP_TEXT[trend];
  const keepIconInline = variant === "sm" && wrap;

  return (
    <div
      className={`flex rounded-lg p-2 min-h-0 min-w-0 w-full self-stretch ${
        keepIconInline ? "items-start" : "flex-wrap items-center"
      } ${
        variant === "lg" ? "gap-2 content-start" : variant === "xs" ? "gap-1.5 content-center" : "gap-1.5 content-start"
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
          <span className={`text-sm shrink-0 ${wrap ? "whitespace-pre" : "whitespace-nowrap"}`} style={{ color: "#101828" }}>
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
          <span className={`text-sm min-w-10 shrink-0 ${wrap ? "whitespace-pre" : ""}`} style={{ color: "#4a5565" }}>
            {label}
          </span>
          <span className="text-sm" style={{ color: HEATMAP_TEXT[trend] }}>
            {changeAmount}
          </span>
          {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="lg" />}
        </>
      )}
      {variant === "sm" && wrap && (
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-xs leading-4 whitespace-pre" style={{ color: "#101828" }}>
            {label}
          </span>
          <div className="flex gap-1 items-center">
            <span className="text-xs" style={{ color: HEATMAP_TEXT[trend] }}>
              {changeAmount}
            </span>
            {trend !== "flat" && <PercentPill trend={trend} value={changePercent} size="sm" />}
          </div>
        </div>
      )}
      {variant === "sm" && !wrap && (
        <>
          <span className="text-xs shrink-0 leading-4" style={{ color: "#101828" }}>
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
          <span className="text-[9px] flex-1 min-w-10 truncate" style={{ color: "#4a5565" }}>
            {label}
          </span>
          <span className="text-[9px] shrink-0" style={{ color: "#6a7282" }}>
            {changePercent}
          </span>
        </>
      )}
    </div>
  );
}

function UsSectorHeatmap({ byId }: { byId: Record<string, SectorRow> }) {
  return (
    <div className="hidden lg:flex gap-1.5 w-[556px] shrink-0 self-stretch">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <HeatmapTile sector={byId.energy} variant="lg" palette="bold" style={{ flex: "1 1 0%" }} />
        <HeatmapTile sector={byId.material} variant="lg" palette="bold" style={{ flex: "1 1 0%" }} />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <HeatmapTile sector={byId.industrials} variant="lg" palette="mid" style={{ flex: "1 1 0%" }} />
          <div className="flex gap-1.5 min-h-0" style={{ flex: "1 1 0%" }}>
            <HeatmapTile sector={byId["consumer-discretionary"]} variant="md" />
            <HeatmapTile sector={byId["consumer-staples"]} variant="md" palette="mid" />
          </div>
          <div className="flex gap-1.5 shrink-0">
            <HeatmapTile sector={byId["health-care"]} variant="sm" palette="mid" style={{ flex: "1 1 0%" }} />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <HeatmapTile
                sector={byId["communication-services"]}
                variant="sm"
                style={{ flex: "1 1 0%" }}
              />
              <HeatmapTile sector={byId.utilities} variant="sm" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0" style={{ height: 50 }}>
          <HeatmapTile sector={byId.financials} variant="sm" palette="mid" style={{ flex: "1 1 0%" }} />
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
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
 *  - The full 8-sector Thai treemap (node 22907:295581).
 *  - US GICS treemap (node 23219:37166) — Energy/Material heroes plus a denser
 *    right column that also packs Health Care, Communication, Utilities.
 */
function SectorHeatmap({ sectors, layout }: { sectors: SectorRow[]; layout: HeatmapLayout }) {
  const tiles = sectors.filter((s) => s.inHeatmap !== false);
  if (tiles.length === 0) return null;
  const byId = Object.fromEntries(tiles.map((s) => [s.id, s])) as Record<string, SectorRow>;

  if (layout === "treemap-us") {
    return <UsSectorHeatmap byId={byId} />;
  }

  if (layout === "compact-2" || tiles.length <= 2) {
    return (
      <div className="hidden lg:flex gap-1.5 w-[556px] shrink-0 self-stretch">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0 h-full">
          <HeatmapTile sector={tiles[0]} variant="lg" palette="bold" style={{ flex: "235 1 0%" }} />
          {tiles[1] && (
            <HeatmapTile sector={tiles[1]} variant="lg" palette="bold" style={{ flex: "207 1 0%" }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex gap-1.5 flex-1 min-w-0 self-stretch">
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <HeatmapTile sector={byId.resources} variant="lg" style={{ flex: "235 1 0%" }} />
        <HeatmapTile sector={byId.services} variant="lg" style={{ flex: "207 1 0%" }} />
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex flex-col gap-1.5 flex-1 min-h-0">
          <HeatmapTile sector={byId.industrials} variant="lg" style={{ flex: "118 1 0%" }} />
          <div className="flex gap-1.5 min-h-0" style={{ flex: "94 1 0%" }}>
            <div className="w-[108px] shrink-0">
              <HeatmapTile sector={byId["consumer-products"]} variant="md" />
            </div>
            <div className="flex-1 min-w-0">
              <HeatmapTile sector={byId["agro-food"]} variant="md" />
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <HeatmapTile sector={byId.financials} variant="xs" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            <div className="flex-1 min-h-0">
              <HeatmapTile sector={byId.technology} variant="xs" />
            </div>
            <div className="flex-1 min-h-0">
              <HeatmapTile sector={byId["property-construction"]} variant="xs" />
            </div>
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
  title,
  sectors,
  layout,
  sectorsMarket,
}: {
  title: string;
  sectors: SectorRow[];
  layout: HeatmapLayout;
  /** Taxonomy the rows drill into — decides which detail route they open. */
  sectorsMarket: IndustrySectorMarket;
}) {
  const router = useRouter();
  return (
    <div className={`flex flex-col gap-4 bg-white rounded-xl p-6 w-full ${CARD_SHADOW}`}>
      <div className="flex gap-4 items-center justify-between w-full flex-wrap">
        <div className="flex flex-col gap-1">
          <p className="font-bold text-lg" style={{ color: "#101828" }}>
            {title}
          </p>
          <p className="text-sm" style={{ color: "#4a5565" }}>
            Select stocks with strong fundamentals from sectors you like.
          </p>
        </div>
        <p className="text-xs shrink-0" style={{ color: "#6a7282" }}>
          {MARKET_LATEST_UPDATE}
        </p>
      </div>
      <div className="flex gap-10 items-stretch w-full">
        <div className="flex-1 min-w-0">
          {sectors.map((s, i) => (
            <SectorListRow
              key={s.id}
              sector={s}
              showBorder={i < sectors.length - 1}
              onNavigate={() => router.push(industrySectorHref(s.id, sectorsMarket))}
            />
          ))}
        </div>
        <SectorHeatmap sectors={sectors} layout={layout} />
      </div>
    </div>
  );
}
