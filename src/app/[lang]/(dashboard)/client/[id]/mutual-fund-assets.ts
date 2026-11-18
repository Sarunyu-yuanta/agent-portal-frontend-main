import type { MobileFundGroupId, MutualFundCategoryId, MutualFundThemeId } from "./mutual-fund-data";

/** Figma-exported assets for the Mutual Fund catalog tab. */
export const MF_ASSETS = {
  thumbsUp: "/products/mutual-fund/thumbs-up.svg",
  bookOpen: "/products/mutual-fund/book-open-text.svg",
  arrowRightBlue: "/products/mutual-fund/arrow-right-blue.svg",
  sparkline: "/products/mutual-fund/sparkline-positive.svg",
  /** Figma 360:77101 / 360:77110 — quick-action cards (ค้นหากองทุน / ลดหย่อนภาษี). */
  quickAction: {
    arrow: "/products/mutual-fund/quick-action-arrow.svg",
    search: "/products/mutual-fund/quick-action-search.png",
    searchRingOuter: "/products/mutual-fund/quick-action-search-ring-outer.svg",
    searchRingInner: "/products/mutual-fund/quick-action-search-ring-inner.svg",
    tax: "/products/mutual-fund/quick-action-tax.png",
    taxRingOuter: "/products/mutual-fund/quick-action-tax-ring-outer.svg",
    taxRingInner: "/products/mutual-fund/quick-action-tax-ring-inner.svg",
  },
  navPriceIcon: "/products/mutual-fund/nav-price-icon.svg",
  coinsIcon: "/products/mutual-fund/coins-icon.svg",
  filePdfIcon: "/products/mutual-fund/file-pdf-icon.svg",
  medal: "/products/mutual-fund/icon-medal.svg",
  /** Figma 40473:724659 — green up-caret next to a fund's % change. */
  caretUpFill: "/products/mutual-fund/caret-up-fill.svg",
  /** Figma 40544:772684 — "ไม่พบผลลัพธ์ที่ตรงกับตัวกรองที่คุณเลือก" empty-state illustration. */
  filterEmptyState: "/products/mutual-fund/filter-empty-state.png",
  insightsSectionBg: "/products/mutual-fund/insights-section-bg.png",
  /** Figma 40135:224291 — mobile insights decorative bg (375×375 @1x) */
  insightsSectionBgMobile: "/products/mutual-fund/insights-section-bg-mobile.png",
  insightCardChart: "/products/mutual-fund/insight-card-chart.svg",
  riskMeter: {
    low: "/products/mutual-fund/risk-meter-2.svg",
    mid: "/products/mutual-fund/risk-meter-4.svg",
    high: "/products/mutual-fund/risk-meter-6.svg",
    veryHigh: "/products/mutual-fund/risk-meter-7.svg",
  },
  /** Figma 39889:665485 — หุ้นทั่วโลก hero (globe). */
  performersHero: {
    "global-equity": "/products/mutual-fund/performers-hero-global-equity.png",
    "thai-equity": "/products/mutual-fund/performers-hero-thai-equity.png",
    "us-equity": "/products/mutual-fund/performers-hero-us-equity.png",
    "japan-equity": "/products/mutual-fund/performers-hero-japan-equity.png",
    "europe-equity": "/products/mutual-fund/performers-hero-europe-equity.png",
    "emerging-equity": "/products/mutual-fund/performers-hero-emerging-equity.png",
    "fixed-income": "/products/mutual-fund/performers-hero-fixed-income.png",
    "global-fixed-income": "/products/mutual-fund/performers-hero-fixed-income.png",
    reits: "/products/mutual-fund/performers-hero-reits.png",
    commodities: "/products/mutual-fund/performers-hero-commodities.png",
    gold: "/products/mutual-fund/performers-hero-gold.png",
  },
  /** Figma 39839:522570 (mobile) — "ทั้งหมด" tab hero, raw icon with no baked-in glow. */
  performersHeroAllFunds: "/products/mutual-fund/performers-hero-all-funds.png",
  /** Figma mobile tab-group heroes (40473:71xxxx) — raw icons, no baked-in glow (see MOBILE_GROUP_HERO). */
  mobileGroupHero: {
    "fixed-income": "/products/mutual-fund/mobile-thai-fixed-income.png",
    "global-fixed-income": "/products/mutual-fund/mobile-foreign-fixed-income-1.png",
    "thai-equity": "/products/mutual-fund/mobile-thai-equity.png",
    "foreign-equity": "/products/mutual-fund/mobile-foreign-equity.png",
    "commodities-group": "/products/mutual-fund/mobile-commodities.png",
    "tax-saving": "/products/mutual-fund/mobile-tax-saving.png",
    others: "/products/mutual-fund/mobile-others-globe.png",
  },
  performersTagView: "/products/mutual-fund/performers-tag-view.svg",
  performersTagHighlight: "/products/mutual-fund/performers-tag-highlight.svg",
  /** Figma 40544:190783 — corner checkmark badge shown on a selected View/Highlight filter chip. */
  tagChipSelectedBadge: "/products/mutual-fund/tag-chip-selected-badge.svg",
  /** Figma 40473:722554/721855/721622/722088/722322 — theme detail page hero illustrations. */
  themeHero: {
    ai: "/products/mutual-fund/theme-hero/ai.png",
    finance: "/products/mutual-fund/theme-hero/finance.png",
    tech: "/products/mutual-fund/theme-hero/tech.png",
    energy: "/products/mutual-fund/theme-hero/energy.png",
    health: "/products/mutual-fund/theme-hero/health.png",
  } satisfies Record<MutualFundThemeId, string>,
  /** Figma 39910:727252 — "บริษัทจัดการกองทุน" filter chip logos. */
  amcLogo: {
    kasset: "/products/mutual-fund/amc/kasset.png",
    daolinv: "/products/mutual-fund/amc/daolinv.png",
    talisam: "/products/mutual-fund/amc/talisam.png",
    bblam: "/products/mutual-fund/amc/bblam.png",
    ksam: "/products/mutual-fund/amc/ksam.png",
    ktam: "/products/mutual-fund/amc/ktam.png",
    bcap: "/products/mutual-fund/amc/bcap.png",
    principal: "/products/mutual-fund/amc/principal.png",
    pamc: "/products/mutual-fund/amc/pamc.png",
    uobam: "/products/mutual-fund/amc/uobam.png",
    oneam: "/products/mutual-fund/amc/oneam.png",
    eastspring: "/products/mutual-fund/amc/eastspring.png",
    aberdeen: "/products/mutual-fund/amc/aberdeen.png",
    kkpam: "/products/mutual-fund/amc/kkpam.png",
    lhfund: "/products/mutual-fund/amc/lhfund.png",
    assetfund: "/products/mutual-fund/amc/assetfund.png",
    scbam: "/products/mutual-fund/amc/scbam.png",
    mfc: "/products/mutual-fund/amc/mfc.png",
  },
} as const;

/** Figma performers list — one hero illustration per category tab. */
export function mutualFundPerformersHeroSrc(categoryId: MutualFundCategoryId): string {
  return MF_ASSETS.performersHero[categoryId] ?? MF_ASSETS.performersHero["global-equity"];
}

export type MutualFundPerformersHeroSpec = {
  /** Offset from the top of the ~996×70 heading text container. */
  top: number;
  /** Offset from the right edge of the heading text container (negative = overflow past it). */
  right: number;
  width: number;
  height: number;
};

/**
 * Figma per-category hero bounding boxes (39889:665472, 668602, 669119, 669516,
 * 669794, 670098, 670283, 670388, 670538, 670886) — each measured relative to its
 * own "Heading Text Container". Only the globe (global-equity) overflows the
 * container's right edge; every other category sits flush (right: 0).
 */
const PERFORMERS_HERO_SPEC: Record<MutualFundCategoryId, MutualFundPerformersHeroSpec> = {
  "global-equity": { top: -22.5, right: -3, width: 136, height: 180 },
  "thai-equity": { top: -1, right: 0, width: 124, height: 159 },
  /** Figma group height 159 assumes the asset's native 278×318 aspect (139×159), not 124×159. */
  "us-equity": { top: -1, right: 0, width: 139, height: 159 },
  "japan-equity": { top: -1, right: 0, width: 124, height: 159 },
  "europe-equity": { top: -1, right: 0, width: 124, height: 159 },
  "emerging-equity": { top: -7, right: 0, width: 128, height: 165 },
  "fixed-income": { top: -3, right: 0, width: 124, height: 161 },
  "global-fixed-income": { top: -3, right: 0, width: 124, height: 161 },
  reits: { top: -3, right: 0, width: 124, height: 161 },
  commodities: { top: -3, right: 0, width: 124, height: 161 },
  gold: { top: -3, right: 0, width: 124, height: 161 },
};

export function mutualFundPerformersHeroSpec(
  categoryId: MutualFundCategoryId,
): MutualFundPerformersHeroSpec {
  return PERFORMERS_HERO_SPEC[categoryId] ?? PERFORMERS_HERO_SPEC["global-equity"];
}

/** A single decorative icon within a tab group's hero graphic — none of these have a baked-in glow, unlike the desktop per-category PNGs. */
export type MobileGroupHeroLayer = {
  src: string;
  /** Offset from the bottom/right edge of the Header Section (375×126 on mobile; reused as-is on desktop). */
  bottom: number;
  right: number;
  width: number;
  height: number;
  rotationDeg?: number;
};

export type MobileGroupHero = {
  glow: { bottom: number; right: number; size: number };
  layers: MobileGroupHeroLayer[];
};

const ALL_FUNDS_HERO: MobileGroupHero = {
  glow: { bottom: -61, right: 21, size: 124 },
  layers: [{ src: MF_ASSETS.performersHeroAllFunds, bottom: 16, right: 41, width: 85, height: 85 }],
};

/**
 * Figma mobile tab-group heroes (40473:719391, 719154, 718914, 718673, 719628,
 * 720351, 719868) — each is a raw icon composited over a shared #eff6ff glow
 * circle at the Header Section's bottom-right corner, not a flattened PNG.
 */
const MOBILE_GROUP_HERO: Record<MobileFundGroupId, MobileGroupHero> = {
  all: ALL_FUNDS_HERO,
  "fixed-income": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [
      {
        src: MF_ASSETS.mobileGroupHero["fixed-income"],
        bottom: -8,
        right: 24,
        width: 114,
        height: 116,
        rotationDeg: -24,
      },
    ],
  },
  "global-fixed-income": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [
      {
        src: MF_ASSETS.mobileGroupHero["global-fixed-income"],
        bottom: -8,
        right: 23,
        width: 94,
        height: 101,
        rotationDeg: -25,
      },
    ],
  },
  "thai-equity": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [{ src: MF_ASSETS.mobileGroupHero["thai-equity"], bottom: -11, right: 39, width: 85, height: 110 }],
  },
  "foreign-equity": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [{ src: MF_ASSETS.mobileGroupHero["foreign-equity"], bottom: -11, right: 37, width: 91, height: 110 }],
  },
  "commodities-group": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [
      { src: MF_ASSETS.mobileGroupHero["commodities-group"], bottom: -11, right: 37, width: 91, height: 112 },
    ],
  },
  "tax-saving": {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [{ src: MF_ASSETS.mobileGroupHero["tax-saving"], bottom: 16, right: 41, width: 81, height: 81 }],
  },
  others: {
    glow: { bottom: -61, right: 21, size: 124 },
    layers: [{ src: MF_ASSETS.mobileGroupHero.others, bottom: -3, right: 43, width: 66, height: 90 }],
  },
};

export function mobileGroupHero(groupId: MobileFundGroupId): MobileGroupHero {
  return MOBILE_GROUP_HERO[groupId] ?? ALL_FUNDS_HERO;
}

export function mutualFundRiskMeterSrc(risk: number): string {
  if (risk <= 2) return MF_ASSETS.riskMeter.low;
  if (risk <= 4) return MF_ASSETS.riskMeter.mid;
  if (risk <= 5) return MF_ASSETS.riskMeter.mid;
  if (risk <= 6) return MF_ASSETS.riskMeter.high;
  return MF_ASSETS.riskMeter.veryHigh;
}
