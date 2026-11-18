import mutualFundsRaw from "@/data/mutual-funds.json";
import navHistoryRaw from "@/data/mutual-fund-nav-history.json";

export type MutualFundCategoryId =
  | "global-equity"
  | "thai-equity"
  | "us-equity"
  | "japan-equity"
  | "europe-equity"
  | "emerging-equity"
  | "fixed-income"
  | "global-fixed-income"
  | "reits"
  | "commodities"
  | "gold";

export type MutualFundThemeId = "ai" | "finance" | "tech" | "energy" | "health";

export type MutualFundThemeIcon = "head-circuit" | "bank" | "cpu" | "rocket-launch" | "cube";

export type MutualFund = {
  id: string;
  symbol: string;
  name: string;
  risk: number;
  price: string;
  currency: string;
  changeAbs: string;
  changePct: string;
  isPick: boolean;
  /** Theme card "View" tag (Figma 360:76695) — only set on theme funds. */
  isView?: boolean;
};

export type MutualFundCategory = {
  id: MutualFundCategoryId;
  label: string;
};

export type MutualFundInsight = {
  id: string;
  /** House View strategy id — links to `/insights/[detailId]`. */
  detailId: string;
  title: string;
  date: string;
  recommendedFunds: string[];
};

export type MutualFundTheme = {
  id: MutualFundThemeId;
  title: string;
  icon: MutualFundThemeIcon;
  funds: MutualFund[];
};

export type MutualFundHistoricalReturn = {
  period: string;
  value: string;
};

export type MutualFundPerformanceReturn = {
  period: string;
  return: string;
  volatility: string;
  maxDrawdown: string;
};

export type MutualFundAllocationItem = {
  label: string;
  percent: number;
  color?: string;
};

export type MutualFundTradingInfo = {
  minInitialPurchase: string;
  minSubsequentPurchase: string;
  minRedemption: string;
  purchaseCutoff: string;
  redemptionCutoff: string;
  settlementDays: string;
};

export type MutualFundFeeDetail = {
  label: string;
  actual: string;
  maximum: string;
};

export type MutualFundFees = {
  frontEnd: string;
  backEnd: string;
  management: string;
};

export type MutualFundDividend = {
  bookCloseDate: string;
  paymentDate: string;
  amountPerUnit: string;
};

export type MutualFundInfo = {
  prospectusUrl: string;
  managementCompany: string;
  fundType: string;
  taxBenefit: string;
  foreignInvestment: string;
  fxRiskPolicy: string;
  riskScore: number;
  dividendPolicy: string;
  currencyPolicy: string;
  managementFee: string;
  minimumInvestment: string;
  registrationDate: string;
  netAssetValue: string;
};

export type MutualFundDetailFields = {
  nav: string;
  navDate: string;
  changePct: string;
  fxRisk: string;
  acceptsCreditCard: boolean;
  investmentPolicy: string;
  fees: MutualFundFees;
  dividend?: MutualFundDividend;
  historicalReturns: MutualFundHistoricalReturn[];
  performanceReturns: MutualFundPerformanceReturn[];
  dividendHistory: MutualFundDividend[];
  topHoldings: MutualFundAllocationItem[];
  assetAllocation: MutualFundAllocationItem[];
  tradingInfo: MutualFundTradingInfo;
  feeDetails: MutualFundFeeDetail[];
  fundInfo: MutualFundInfo;
};

export type MutualFundDetail = MutualFund & MutualFundDetailFields;

export type MutualFundCatalog = {
  categories: MutualFundCategory[];
  topPerformers: Partial<Record<MutualFundCategoryId, MutualFund[]>>;
  insights: MutualFundInsight[];
  themes: MutualFundTheme[];
  fundDetails: Partial<Record<string, MutualFundDetailFields>>;
};

export const MUTUAL_FUND_CATALOG = mutualFundsRaw as MutualFundCatalog;

export const MUTUAL_FUND_CATEGORIES = MUTUAL_FUND_CATALOG.categories;

/** Figma 39889:665476 — performers list tabs (no ตราสารหนี้ต่างประเทศ). */
export const TOP_PERFORMERS_TAB_CATEGORIES = MUTUAL_FUND_CATEGORIES.filter(
  (c) => c.id !== "global-fixed-income",
);

export function getTopPerformers(categoryId: MutualFundCategoryId): MutualFund[] {
  return (
    MUTUAL_FUND_CATALOG.topPerformers[categoryId] ??
    MUTUAL_FUND_CATALOG.topPerformers["global-equity"] ??
    []
  );
}

// ─── Mutual fund insight ↔ House View strategy bridge ──────────────────────
// A mutual fund insight's `detailId` points at a House View strategy id (see
// the `MutualFundInsight.detailId` doc comment above) and both the Mutual
// Fund insights list and Product Catalog's "บทวิเคราะห์ทั้งหมด" list link
// straight to the shared `/insights/[id]` detail page. That page also serves
// non-mutual-fund insights, so its Related Products sidebar needs a way to
// tell the two apart: `findMutualFundInsightByDetailId` is that bridge —
// when it resolves, the detail page is being viewed as a Mutual Fund
// insight and should show Mutual Fund related products instead of the
// generic structured/fixed income/global bond picks.

function buildMutualFundsBySymbol(): Map<string, MutualFund> {
  const bySymbol = new Map<string, MutualFund>();
  for (const category of MUTUAL_FUND_CATEGORIES) {
    for (const fund of getTopPerformers(category.id)) {
      if (!bySymbol.has(fund.symbol)) bySymbol.set(fund.symbol, fund);
    }
  }
  for (const theme of MUTUAL_FUND_CATALOG.themes) {
    for (const fund of theme.funds) {
      if (!bySymbol.has(fund.symbol)) bySymbol.set(fund.symbol, fund);
    }
  }
  return bySymbol;
}

const MUTUAL_FUNDS_BY_SYMBOL = buildMutualFundsBySymbol();

/** The Mutual Fund catalog's insight entry (if any) for this House View strategy id. */
export function findMutualFundInsightByDetailId(detailId: string): MutualFundInsight | undefined {
  return MUTUAL_FUND_CATALOG.insights.find((insight) => insight.detailId === detailId);
}

/**
 * Resolves a Mutual Fund insight's `recommendedFunds` symbols (plain strings)
 * to full catalog records, so they can render as real `MutualFundListCard`s.
 * Symbols with no matching mock fund yet (e.g. some Hold List picks) are
 * skipped rather than shown as broken cards.
 */
export function getRecommendedFundsForInsight(detailId: string): MutualFund[] {
  const insight = findMutualFundInsightByDetailId(detailId);
  if (!insight) return [];
  return insight.recommendedFunds
    .map((symbol) => MUTUAL_FUNDS_BY_SYMBOL.get(symbol))
    .filter((fund): fund is MutualFund => fund !== undefined);
}

/** Figma 39889:665484 — performers list as-of date. */
export const TOP_PERFORMERS_LIST_UPDATED_AT = "2 ส.ค 69";

/** Figma 39889:667557 — total catalog count (mock). */
export const TOP_PERFORMERS_DISPLAY_COUNT = 160;

/** The performers hero's one line of copy. Shared by the desktop page and the
 *  mobile one, which each held their own identical `HERO_SUBTITLE`. */
export const TOP_PERFORMERS_HERO_SUBTITLE = "คัดสรรกองทุนเด่น เพื่อคุณโดยเฉพาะ";

export const MUTUAL_FUND_PERFORMANCE_PERIODS = [
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "3Y",
  "5Y",
  "MAX",
] as const;

export type MutualFundPerformancePeriod = (typeof MUTUAL_FUND_PERFORMANCE_PERIODS)[number];

/** Figma 39839:522570 (mobile) — tab bar groups several desktop categories under one tab. */
export type MobileFundGroupId =
  | "all"
  | "fixed-income"
  | "global-fixed-income"
  | "thai-equity"
  | "foreign-equity"
  | "commodities-group"
  | "tax-saving"
  | "others";

export type MobileFundGroup = {
  id: MobileFundGroupId;
  label: string;
  /** Underlying categories this group pools funds from; omitted (tax-saving/others) means no catalog data exists yet. */
  categoryIds?: MutualFundCategoryId[];
};

export const MOBILE_FUND_GROUPS: MobileFundGroup[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "fixed-income", label: "ตราสารหนี้ไทย", categoryIds: ["fixed-income"] },
  { id: "global-fixed-income", label: "ตราสารหนี้ต่างประเทศ", categoryIds: ["global-fixed-income"] },
  { id: "thai-equity", label: "หุ้นไทย", categoryIds: ["thai-equity"] },
  {
    id: "foreign-equity",
    label: "หุ้นต่างประเทศ",
    categoryIds: ["global-equity", "us-equity", "japan-equity", "europe-equity", "emerging-equity"],
  },
  { id: "commodities-group", label: "Commodities", categoryIds: ["reits", "commodities", "gold"] },
  { id: "tax-saving", label: "ลดหย่อนภาษี" },
  { id: "others", label: "อื่นๆ" },
];

/** Funds for a mobile tab — pools every underlying category, deduped by fund id. */
export function getMobileGroupFunds(groupId: MobileFundGroupId): MutualFund[] {
  const group = MOBILE_FUND_GROUPS.find((g) => g.id === groupId);
  const categoryIds = groupId === "all" ? MUTUAL_FUND_CATEGORIES.map((c) => c.id) : (group?.categoryIds ?? []);

  const byId = new Map<string, MutualFund>();
  for (const categoryId of categoryIds) {
    for (const fund of getTopPerformers(categoryId)) {
      byId.set(fund.id, fund);
    }
  }
  return [...byId.values()];
}

/** Figma mobile period tabs — different set from desktop (adds 1D/1W, drops 3Y/5Y/MAX). */
export const MOBILE_PERFORMANCE_PERIODS = ["1D", "1W", "1M", "3M", "6M", "YTD", "1Y"] as const;

export type MobilePerformancePeriod = (typeof MOBILE_PERFORMANCE_PERIODS)[number];

export function normalizeMutualFundCategoryId(value: string): MutualFundCategoryId {
  if (value === "global-fixed-income") return "fixed-income";
  return MUTUAL_FUND_CATEGORIES.some((c) => c.id === value)
    ? (value as MutualFundCategoryId)
    : "global-equity";
}

/** Which mobile tab group a route param falls under — accepts either a group id directly (e.g. "commodities-group") or a single category id (e.g. "us-equity", deep-linked from the catalog grid), so any prior link still lands on the right tab. */
export function resolveMobileFundGroupId(value: string): MobileFundGroupId {
  const direct = MOBILE_FUND_GROUPS.find((g) => g.id === value);
  if (direct) return direct.id;
  const categoryId = normalizeMutualFundCategoryId(value);
  const group = MOBILE_FUND_GROUPS.find((g) => g.categoryIds?.includes(categoryId));
  return group?.id ?? "all";
}

export function mutualFundCategoryHref(categoryId: MutualFundCategoryId): string {
  return `/product-catalog/mutual-fund/top-performers/${encodeURIComponent(categoryId)}`;
}

export function mutualFundGroupHref(groupId: MobileFundGroupId): string {
  return `/product-catalog/mutual-fund/top-performers/${encodeURIComponent(groupId)}`;
}

export function mutualFundInsightsHref(): string {
  return "/product-catalog/mutual-fund/insights";
}

export function mutualFundInsightDetailHref(detailId: string): string {
  return `/insights/${encodeURIComponent(detailId)}`;
}

/** Figma 38285:291118 — insights list grid page size. */
export const MUTUAL_FUND_INSIGHTS_PAGE_SIZE = 8;

/** Figma pagination mock — 10 pages × 8 cards. */
export const MUTUAL_FUND_INSIGHTS_MOCK_TOTAL = 80;

function cycleInsightsToCount(items: MutualFundInsight[], targetCount: number): MutualFundInsight[] {
  if (items.length === 0) return [];
  const out: MutualFundInsight[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    const source = items[i % items.length];
    out.push({ ...source, id: `${source.id}-${i}` });
  }
  return out;
}

export function getMutualFundInsightsCatalog(): MutualFundInsight[] {
  return cycleInsightsToCount(MUTUAL_FUND_CATALOG.insights, MUTUAL_FUND_INSIGHTS_MOCK_TOTAL);
}

export function getMutualFundInsightsPage(
  page: number,
  pageSize = MUTUAL_FUND_INSIGHTS_PAGE_SIZE,
): {
  items: MutualFundInsight[];
  totalPages: number;
  currentPage: number;
} {
  const all = getMutualFundInsightsCatalog();
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    items: all.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

/** Full list for performers page — category slice plus catalog funds for a fuller grid. */
/** Tile funds for list grid density (Figma shows 16+ cards). */
export function getTopPerformersGridFunds(
  categoryId: MutualFundCategoryId,
  pickOnly: boolean,
  targetCount = 16,
): MutualFund[] {
  const base = getTopPerformersList(categoryId);
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Same density cycling as getTopPerformersGridFunds, for a mobile tab group. */
export function getMobileGroupGridFunds(
  groupId: MobileFundGroupId,
  pickOnly: boolean,
  targetCount = 16,
): MutualFund[] {
  const base = getMobileGroupFunds(groupId);
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

function cycleToCount(funds: MutualFund[], targetCount: number): MutualFund[] {
  if (funds.length === 0) return [];
  const out: MutualFund[] = [];
  for (let i = 0; i < targetCount; i += 1) {
    out.push(funds[i % funds.length]);
  }
  return out;
}

/** Category slice only — performers list page order matches Figma grid. */
export function getTopPerformersList(categoryId: MutualFundCategoryId): MutualFund[] {
  return getTopPerformers(categoryId);
}

/** Figma 39839:525396 — theme detail page ("ดูเพิ่มเติม" destination) tabs, in card order. */
export const MUTUAL_FUND_THEME_IDS: MutualFundThemeId[] = MUTUAL_FUND_CATALOG.themes.map((t) => t.id);

export function getMutualFundTheme(themeId: MutualFundThemeId): MutualFundTheme {
  return MUTUAL_FUND_CATALOG.themes.find((t) => t.id === themeId) ?? MUTUAL_FUND_CATALOG.themes[0];
}

export function normalizeMutualFundThemeId(value: string): MutualFundThemeId {
  return MUTUAL_FUND_CATALOG.themes.some((t) => t.id === value)
    ? (value as MutualFundThemeId)
    : MUTUAL_FUND_CATALOG.themes[0].id;
}

export function mutualFundThemeHref(themeId: MutualFundThemeId): string {
  return `/product-catalog/mutual-fund/themes/${encodeURIComponent(themeId)}`;
}

/** Same density cycling as getTopPerformersGridFunds, for a theme's fund pool. */
export function getThemeGridFunds(themeId: MutualFundThemeId, pickOnly: boolean, targetCount = 16): MutualFund[] {
  const base = getMutualFundTheme(themeId).funds;
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Figma 39839:525396 hero heading — the English business name shown above each theme's description. */
const THEME_HERO_TITLES: Record<MutualFundThemeId, string> = {
  ai: "Semiconductor & Memory",
  finance: "Global Financial Services",
  tech: "Cybersecurity",
  energy: "Metals & Mining",
  health: "Defense",
};

export function getThemeHeroTitle(themeId: MutualFundThemeId): string {
  return THEME_HERO_TITLES[themeId] ?? "";
}

/** Figma 39839:525396 hero subtitle. */
const THEME_DESCRIPTIONS: Record<MutualFundThemeId, string> = {
  ai: "ผู้ผลิตชิปและหน่วยความจำ ฮาร์ดแวร์เบื้องหลัง AI",
  finance: "ธนาคารและบริการทางการเงินโลก",
  tech: "ซอฟต์แวร์ความปลอดภัยไซเบอร์และซอฟต์แวร์องค์กร",
  energy: "เหมืองแร่โลหะมีค่าและโลหะยุทธศาสตร์ ทั่วโลก",
  health: "อุตสาหกรรมกลาโหมโลก และโดรนทางทหาร",
};

export function getThemeDescription(themeId: MutualFundThemeId): string {
  return THEME_DESCRIPTIONS[themeId] ?? "";
}

/**
 * Figma 360:78470 — "ค้นหากองทุนที่คุณสนใจ" category chips: the same groups as the
 * mobile performers tabs (minus "ทั้งหมด"). Each option pools catalog categories;
 * "tax-saving" matches any fund with a tax-saving type, "others" funds outside the catalog.
 */
export type FilterCategoryOption = { id: MobileFundGroupId; label: string; categoryIds?: string[] };
export const FILTER_CATEGORY_OPTIONS: FilterCategoryOption[] = MOBILE_FUND_GROUPS.filter((g) => g.id !== "all").map(
  (g) => ({
    id: g.id,
    label: g.label,
    categoryIds: g.id === "others" ? ["others"] : g.categoryIds,
  }),
);

export const TAX_SAVING_FUND_TYPES = ["RMF", "TESG", "TESGX"] as const;
export type TaxSavingFundType = (typeof TAX_SAVING_FUND_TYPES)[number];

export function normalizeTaxSavingFundType(value: string): TaxSavingFundType {
  const upper = value.toUpperCase();
  return (TAX_SAVING_FUND_TYPES as readonly string[]).includes(upper)
    ? (upper as TaxSavingFundType)
    : "RMF";
}

export const DIVIDEND_POLICY_OPTIONS = ["จ่าย", "ไม่จ่าย"] as const;
export const INVESTMENT_POLICY_OPTIONS = ["เชิงรุก", "เชิงรับ"] as const;
/** 9 stands for "8+" (Figma 360:78597) — funds riskier than level 8. */
export const FUND_RISK_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function fundRiskLevelLabel(level: number): string {
  return level >= 9 ? "Level 8+" : `Level ${level}`;
}

/** Figma 39910:727252 — "บริษัทจัดการกองทุน" chip row; icon looked up via MF_ASSETS.amcLogo[id]. */
export const FUND_MANAGEMENT_COMPANIES = [
  { id: "kasset", label: "KASSET" },
  { id: "daolinv", label: "DAOLINV" },
  { id: "talisam", label: "TALISAM" },
  { id: "bblam", label: "BBLAM" },
  { id: "ksam", label: "KSAM" },
  { id: "ktam", label: "KTAM" },
  { id: "bcap", label: "BCAP" },
  { id: "principal", label: "PRINCIPAL" },
  { id: "pamc", label: "PAMC" },
  { id: "uobam", label: "UOBAM" },
  { id: "oneam", label: "ONEAM" },
  { id: "eastspring", label: "EASTSPRING" },
  { id: "aberdeen", label: "ABERDEEN" },
  { id: "kkpam", label: "KKPAM" },
  { id: "lhfund", label: "LHFUND" },
  { id: "assetfund", label: "ASSETFUND" },
  { id: "scbam", label: "SCBAM" },
  { id: "mfc", label: "MFC" },
] as const;

/** Figma 38285:289685 — generic "ตัวกรองกองทุน" results list (full catalog, unfiltered). */
export function getFilterResultFunds(pickOnly: boolean, targetCount = 16): MutualFund[] {
  const base = allCatalogFunds();
  return cycleToCount(pickOnly ? base.filter((f) => f.isPick) : base, targetCount);
}

/** Figma 40544:772211 — "ตกลง" with no chips selected shows the full, uncapped catalog. */
export function getAllMutualFunds(pickOnly = false): MutualFund[] {
  const base = allCatalogFunds();
  return pickOnly ? base.filter((f) => f.isPick) : base;
}

/** Stable (non-random) hash so mock per-fund attributes stay consistent across renders. */
function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * "View" / "Highlight" tags per fund. Highlight is the house pick (`isPick`); View comes from
 * `isView` when the catalog sets it, otherwise a stable mock so some funds carry no tag at all.
 */
export function fundHasViewTag(fund: MutualFund): boolean {
  return fund.isView ?? hashString(`view-${fund.id}`) % 2 === 0;
}

export function fundHasHighlightTag(fund: MutualFund): boolean {
  return fund.isPick;
}

/** Search box on the fund list pages: case-insensitive match on the fund code or full name. */
export function searchFunds(funds: MutualFund[], query: string): MutualFund[] {
  const term = query.trim().toLowerCase();
  if (!term) return funds;
  return funds.filter((fund) => fund.symbol.toLowerCase().includes(term) || fund.name.toLowerCase().includes(term));
}

/** The View/Highlight toggles: neither on → every fund; otherwise funds carrying any active tag. */
export function filterFundsByTag(funds: MutualFund[], viewActive: boolean, highlightActive: boolean): MutualFund[] {
  if (!viewActive && !highlightActive) return funds;
  return funds.filter(
    (fund) => (viewActive && fundHasViewTag(fund)) || (highlightActive && fundHasHighlightTag(fund)),
  );
}

const FUND_CATEGORY_MAP: Map<string, MutualFundCategoryId[]> = (() => {
  const map = new Map<string, MutualFundCategoryId[]>();
  for (const [categoryId, funds] of Object.entries(MUTUAL_FUND_CATALOG.topPerformers)) {
    for (const fund of funds ?? []) {
      const list = map.get(fund.id) ?? [];
      list.push(categoryId as MutualFundCategoryId);
      map.set(fund.id, list);
    }
  }
  return map;
})();

/** A fund's category ids (as used by the filter's "หมวดหมู่" chips); "others" if uncategorized. */
export function getFundCategoryIds(fundId: string): string[] {
  const categories = FUND_CATEGORY_MAP.get(fundId);
  return categories && categories.length > 0 ? categories : ["others"];
}

/**
 * No fund data models tax-saving type, dividend policy, investment policy, or
 * management company per-fund — these are mock catalog options only. Derive a
 * stable pseudo-assignment per fund (not random per render) so the filter's
 * "no matches" empty state is reachable and repeatable.
 */
export function getFundTaxSavingType(fundId: string): TaxSavingFundType | null {
  const hash = hashString(`tax-${fundId}`);
  if (hash % 4 !== 0) return null;
  return TAX_SAVING_FUND_TYPES[hash % TAX_SAVING_FUND_TYPES.length];
}

export function getFundDividendPolicy(fundId: string): (typeof DIVIDEND_POLICY_OPTIONS)[number] {
  return DIVIDEND_POLICY_OPTIONS[hashString(`div-${fundId}`) % DIVIDEND_POLICY_OPTIONS.length];
}

export function getFundInvestmentPolicy(fundId: string): (typeof INVESTMENT_POLICY_OPTIONS)[number] {
  return INVESTMENT_POLICY_OPTIONS[hashString(`inv-${fundId}`) % INVESTMENT_POLICY_OPTIONS.length];
}

export function getFundManagementCompanyId(fundId: string): string {
  const options = FUND_MANAGEMENT_COMPANIES;
  return options[hashString(`amc-${fundId}`) % options.length].id;
}

/** Figma 38372:395507 — tax-planning recommended funds; same mock pool for every fund type. */
export function getTaxSavingFunds(pickOnly: boolean, targetCount = 16): MutualFund[] {
  return getFilterResultFunds(pickOnly, targetCount);
}

/** Figma 38372:395507 — "ลงทุนได้สูงสุด" is 30% of entered annual income for every fund type. */
export function taxSavingMaxInvestment(annualIncomeThb: number): number {
  if (!Number.isFinite(annualIncomeThb) || annualIncomeThb <= 0) return 0;
  return Math.round(annualIncomeThb * 0.3);
}

function allCatalogFunds(): MutualFund[] {
  const byId = new Map<string, MutualFund>();
  for (const funds of Object.values(MUTUAL_FUND_CATALOG.topPerformers)) {
    for (const fund of funds ?? []) {
      byId.set(fund.id, fund);
    }
  }
  for (const theme of MUTUAL_FUND_CATALOG.themes) {
    for (const fund of theme.funds) {
      byId.set(fund.id, fund);
    }
  }
  return [...byId.values()];
}

/* ── Mock detail for funds without a hand-written entry ─────────────────────
 * Only one fund in the catalog JSON carries full detail data. Every other fund
 * gets a generated one so all four detail tabs have something real to show —
 * seeded by fund id, so the same fund always reads the same numbers, and
 * built to agree with itself: the NAV series hits the returns table exactly,
 * the dividend section follows the fund's dividend policy, the fund-info rows
 * follow its category, AMC and tax type. */

/** Latest priced day for generated funds — same as the hand-written one. */
const MOCK_LATEST_NAV_DATE = "2026-07-08";
const MOCK_NAV_DATE_LABEL = "ราคาหน่วยลงทุน (NAV) ณ 8 ก.ค 69";

function seededRandom(seed: string): () => number {
  let state = hashString(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function between(rnd: () => number, min: number, max: number): number {
  return min + rnd() * (max - min);
}

function formatPct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function pick<T>(rnd: () => number, items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length)];
}

type MockFundGroup = "thai-equity" | "thai-bond" | "foreign";

function mockFundGroup(fundId: string): MockFundGroup {
  const category = getFundCategoryIds(fundId)[0];
  if (category === "thai-equity") return "thai-equity";
  if (category === "fixed-income") return "thai-bond";
  return "foreign";
}

const MOCK_HOLDINGS: Record<MockFundGroup, string[]> = {
  foreign: [
    "PIMCO GIS Income Fund 'I' (USD) ACC",
    "BlackRock Global Funds - World Technology Fund",
    "JPMorgan Funds - US Select Equity Fund",
    "Fidelity Funds - Global Dividend Fund",
    "Schroder ISF Asian Opportunities",
    "iShares Core S&P 500 UCITS ETF",
  ],
  "thai-equity": [
    "PTT PUBLIC COMPANY LIMITED",
    "ADVANCED INFO SERVICE PCL",
    "CP ALL PUBLIC COMPANY LIMITED",
    "KASIKORNBANK PUBLIC COMPANY LIMITED",
    "BANGKOK DUSIT MEDICAL SERVICES PCL",
  ],
  "thai-bond": [
    "พันธบัตรรัฐบาล LB336A",
    "พันธบัตรธนาคารแห่งประเทศไทย CB26",
    "หุ้นกู้ ปตท. PTTC29",
    "หุ้นกู้ ซีพี ออลล์ CPALL27",
    "เงินฝากธนาคารกสิกรไทย",
  ],
};

const MOCK_ALLOCATION_LABELS: Record<MockFundGroup, [string, string, string]> = {
  foreign: ["หน่วยลงทุน", "เงินฝาก/ตราสารเทียบเท่า", "สินทรัพย์อื่นๆ/หนี้สินอื่นๆ"],
  "thai-equity": ["หุ้นสามัญ", "เงินฝาก/ตราสารเทียบเท่า", "สินทรัพย์อื่นๆ/หนี้สินอื่นๆ"],
  "thai-bond": ["พันธบัตรรัฐบาล", "หุ้นกู้", "เงินฝาก/ตราสารเทียบเท่า"],
};

const MOCK_POLICY: Record<MockFundGroup, string> = {
  foreign:
    "กองทุนมีนโยบายลงทุนในหน่วยลงทุนของกองทุนรวมต่างประเทศ (Master Fund) โดยเฉลี่ยในรอบปีบัญชีไม่น้อยกว่าร้อยละ 80 ของมูลค่าทรัพย์สินสุทธิของกองทุน ส่วนที่เหลืออาจลงทุนในเงินฝากหรือตราสารที่เทียบเท่าเงินฝาก และอาจใช้สัญญาซื้อขายล่วงหน้าเพื่อป้องกันความเสี่ยงจากอัตราแลกเปลี่ยนตามดุลยพินิจของผู้จัดการกองทุน",
  "thai-equity":
    "กองทุนมีนโยบายลงทุนในหุ้นของบริษัทจดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทยที่มีปัจจัยพื้นฐานดีและมีแนวโน้มการเติบโตของกำไรอย่างต่อเนื่อง โดยเฉลี่ยในรอบปีบัญชีไม่น้อยกว่าร้อยละ 80 ของมูลค่าทรัพย์สินสุทธิของกองทุน มุ่งหวังผลตอบแทนที่สูงกว่าดัชนีชี้วัดในระยะยาว",
  "thai-bond":
    "กองทุนมีนโยบายลงทุนในตราสารหนี้ภาครัฐ ตราสารหนี้ภาคเอกชนที่มีอันดับความน่าเชื่อถืออยู่ในระดับที่สามารถลงทุนได้ และเงินฝาก โดยมีอายุเฉลี่ยของตราสารที่ลงทุนไม่เกิน 3 ปี เพื่อสร้างรายได้สม่ำเสมอและรักษาเงินต้นในระดับที่เหมาะสม",
};

const MOCK_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MOCK_THAI_MONTHS = ["ม.ค", "ก.พ", "มี.ค", "เม.ย", "พ.ค", "มิ.ย", "ก.ค", "ส.ค", "ก.ย", "ต.ค", "พ.ย", "ธ.ค"];

function formatEnDate(date: Date): string {
  return `${String(date.getUTCDate()).padStart(2, "0")} ${MOCK_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Quarterly dividends, newest first: book closes at quarter end, pays ~2 weeks later. */
function mockDividendHistory(rnd: () => number): MutualFundDividend[] {
  const rows: MutualFundDividend[] = [];
  const count = 6 + Math.floor(rnd() * 5);
  for (let i = 0; i < count; i += 1) {
    // Quarter ends counting back from Mar 2026.
    const monthIndex = 2 - i * 3;
    const year = 2026 + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    const bookClose = new Date(Date.UTC(year, month + 1, 0));
    const payment = new Date(Date.UTC(year, month + 1, 10 + Math.floor(rnd() * 8)));
    rows.push({
      bookCloseDate: formatEnDate(bookClose),
      paymentDate: formatEnDate(payment),
      amountPerUnit: (Math.round(between(rnd, 2, 8)) * 0.05).toFixed(4),
    });
  }
  return rows;
}

function mockAllocation(rnd: () => number, labels: string[], first: [number, number]): MutualFundAllocationItem[] {
  const colors = ["#074EA4", "#51A2FF", "#A3B3FF"];
  const a = Number(between(rnd, first[0], first[1]).toFixed(2));
  const b = Number(((100 - a) * between(rnd, 0.45, 0.8)).toFixed(2));
  const c = Number((100 - a - b).toFixed(2));
  return [a, b, c].map((percent, i) => ({ label: labels[i], percent, color: colors[i] }));
}

function defaultDetailFields(fund: MutualFund): MutualFundDetailFields {
  const rnd = seededRandom(`detail-${fund.id}`);
  const group = mockFundGroup(fund.id);
  const foreign = group === "foreign";
  const categoryId = getFundCategoryIds(fund.id)[0];
  const categoryLabel = MUTUAL_FUND_CATEGORIES.find((c) => c.id === categoryId)?.label ?? "อื่นๆ";
  const amcId = getFundManagementCompanyId(fund.id);
  const amcLabel = FUND_MANAGEMENT_COMPANIES.find((c) => c.id === amcId)?.label ?? "-";
  const taxType = getFundTaxSavingType(fund.id);
  const dividendPolicy = getFundDividendPolicy(fund.id);

  // Returns: 1Y is the card's own figure (list cards label it "ผลดำเนินงาน
  // ย้อนหลัง 1 ปี"), so the card, its sparkline and this page all agree; the
  // shorter windows scale off it with noise.
  const cardReturn = parseFloat(fund.changePct);
  const r1y = Number.isFinite(cardReturn) ? cardReturn : between(rnd, -4, 20);
  const returns = {
    "1W": between(rnd, -0.8, 1.2),
    "1M": r1y * 0.1 + between(rnd, -1.5, 1.5),
    "3M": r1y * 0.28 + between(rnd, -2, 2),
    "6M": r1y * 0.55 + between(rnd, -2.5, 2.5),
    YTD: r1y * 0.5 + between(rnd, -2, 2),
    "1Y": r1y,
  };
  const historicalReturns = (Object.keys(returns) as (keyof typeof returns)[]).map((period) => ({
    period,
    value: formatPct(returns[period]),
  }));
  const volatility1y = between(rnd, 4, 18);
  const drawdown1y = -between(rnd, 2, 15);
  const performanceReturns = [
    ...historicalReturns.map((r) => ({
      period: r.period,
      return: r.value,
      volatility: r.period === "1Y" ? formatPct(volatility1y) : "-",
      maxDrawdown: r.period === "1Y" ? formatPct(drawdown1y) : "-",
    })),
    { period: "3Y", return: formatPct(between(rnd, -2, 12)), volatility: formatPct(volatility1y * 1.1), maxDrawdown: formatPct(drawdown1y * 1.6) },
    { period: "5Y", return: formatPct(between(rnd, -1, 10)), volatility: formatPct(volatility1y * 1.2), maxDrawdown: formatPct(drawdown1y * 2) },
    { period: "SI", return: formatPct(between(rnd, 0, 8)), volatility: "-", maxDrawdown: "-" },
  ];

  const managementFee = between(rnd, 0.5, 1.8).toFixed(2);
  const frontEnd = pick(rnd, ["0.00%", "1.00%", "1.50%"] as const);
  const backEnd = pick(rnd, ["0.00%", "1.00%"] as const);
  const dividendHistory = dividendPolicy === "จ่าย" ? mockDividendHistory(rnd) : [];

  const holdingPool = [...MOCK_HOLDINGS[group]].sort(() => rnd() - 0.5);
  const topHoldings = mockAllocation(rnd, holdingPool.slice(0, 3), foreign ? [85, 97] : [8, 14]).map(
    (item, i) => (foreign ? item : { ...item, percent: Number(between(rnd, 9 - i * 2, 12 - i * 2).toFixed(2)) }),
  );
  const assetAllocation = mockAllocation(rnd, MOCK_ALLOCATION_LABELS[group], group === "thai-bond" ? [50, 70] : [85, 97]);

  const regYear = 60 + Math.floor(rnd() * 8);
  const nav = between(rnd, 500_000_000, 40_000_000_000);

  return {
    nav: fund.price,
    navDate: MOCK_NAV_DATE_LABEL,
    changePct: fund.changePct,
    fxRisk: foreign ? "ความเสี่ยง FX: ป้องกันบางส่วน" : "ความเสี่ยง FX: ไม่มี",
    acceptsCreditCard: false,
    investmentPolicy: MOCK_POLICY[group],
    fees: { frontEnd, backEnd, management: `${managementFee}%` },
    dividend: dividendHistory[0],
    historicalReturns,
    performanceReturns,
    dividendHistory,
    topHoldings,
    assetAllocation,
    tradingInfo: {
      minInitialPurchase: "0.01 บาท",
      minSubsequentPurchase: "0.01 บาท",
      minRedemption: "0.00 บาท",
      purchaseCutoff: "ก่อน 15:30",
      redemptionCutoff: "ก่อน 15:30",
      settlementDays: foreign ? "5 วันหลังทำรายการขาย (T+5)" : "3 วันหลังทำรายการขาย (T+3)",
    },
    feeDetails: [
      { label: "ค่าธรรมเนียมการซื้อ", actual: frontEnd.replace(".00", ""), maximum: "2%" },
      { label: "ค่าธรรมเนียมการขาย", actual: backEnd.replace(".00", ""), maximum: "1%" },
      { label: "ค่าธรรมเนียมการสับเปลี่ยนเข้า", actual: frontEnd.replace(".00", ""), maximum: "2%" },
      { label: "ค่าธรรมเนียมการสับเปลี่ยนออก", actual: backEnd.replace(".00", ""), maximum: "1%" },
      { label: "ค่าธรรมเนียมการจัดการ", actual: `${managementFee}%`, maximum: "2.14%" },
      { label: "ค่าใช้จ่ายรวมทั้งหมด", actual: `${(Number(managementFee) + 0.1).toFixed(2)}%`, maximum: "5.35%" },
    ],
    fundInfo: {
      prospectusUrl: "#",
      managementCompany: amcLabel,
      fundType: categoryLabel,
      taxBenefit: taxType ? `มี (${taxType})` : "ไม่มี",
      foreignInvestment: foreign ? "มี" : "ไม่มี",
      fxRiskPolicy: foreign ? "มี" : "ไม่มี",
      riskScore: fund.risk,
      dividendPolicy,
      currencyPolicy: foreign
        ? "ป้องกันความเสี่ยงอัตราแลกเปลี่ยนตามดุลยพินิจของผู้จัดการกองทุน"
        : "ไม่มีความเสี่ยงอัตราแลกเปลี่ยน",
      managementFee: `${managementFee}% ต่อปี`,
      minimumInvestment: pick(rnd, ["1 บาท", "500 บาท", "1,000 บาท"] as const),
      registrationDate: `${1 + Math.floor(rnd() * 28)} ${pick(rnd, MOCK_THAI_MONTHS)} ${regYear}`,
      netAssetValue: `${nav.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท`,
    },
  };
}

const DAY_MS = 86_400_000;

/**
 * NAV series for a fund with no recorded history: five years, weekly until a
 * year back and every business day after (the recorded series' shape). It
 * passes exactly through the NAV each `historicalReturns` window implies, so
 * the chart and the returns grid under it agree; between anchors it wanders.
 */
function mockNavHistory(fund: MutualFundDetail): NavHistory {
  const rnd = seededRandom(`nav-${fund.id}`);
  const latestNav = Number(fund.nav) || 10;
  const latest = Date.parse(`${MOCK_LATEST_NAV_DATE}T00:00:00Z`);
  const ytdDays = Math.round((latest - Date.UTC(new Date(latest).getUTCFullYear(), 0, 1)) / DAY_MS);
  const windowDays: Record<string, number> = { "1W": 7, "1M": 30, "3M": 91, "6M": 182, YTD: ytdDays, "1Y": 365 };

  const anchors: [number, number][] = [[0, latestNav]];
  for (const r of fund.historicalReturns) {
    const days = windowDays[r.period];
    const pct = parseFloat(r.value);
    if (days !== undefined && Number.isFinite(pct)) anchors.push([days, latestNav / (1 + pct / 100)]);
  }
  const navAt1y = anchors.find(([d]) => d === 365)?.[1] ?? latestNav;
  anchors.push([1826, navAt1y / (1 + between(rnd, -0.1, 0.35))]);
  anchors.sort((a, b) => a[0] - b[0]);
  const phase = rnd() * Math.PI * 2;

  const navAtDay = (day: number) => {
    let i = 0;
    while (i < anchors.length - 2 && anchors[i + 1][0] < day) i += 1;
    const [d0, v0] = anchors[i];
    const [d1, v1] = anchors[i + 1];
    const t = d1 === d0 ? 0 : (day - d0) / (d1 - d0);
    const base = Math.exp(Math.log(v0) + (Math.log(v1) - Math.log(v0)) * t);
    // Gentle drift that fades to zero at both anchors: a slow swing plus a
    // little day-to-day noise, so the line reads like a fund, not a seismograph.
    const wobble = Math.sin(Math.PI * t) * (Math.sin(day * 0.09 + phase) * 0.006 + (rnd() - 0.5) * 0.003);
    return base * (1 + wobble);
  };

  const points: NavPoint[] = [];
  for (let day = 1826; day >= 0; day -= day > 365 ? 7 : 1) {
    const date = new Date(latest - day * DAY_MS);
    const weekday = date.getUTCDay();
    if (day <= 365 && day !== 0 && (weekday === 0 || weekday === 6)) continue;
    points.push({ date: date.toISOString().slice(0, 10), nav: Number(navAtDay(day).toFixed(4)) });
  }
  return { currency: fund.currency, points };
}

/** One mutual fund by id, merged with detail fields when available. */
export function getMutualFund(id: string): MutualFundDetail | undefined {
  const fund = allCatalogFunds().find((f) => f.id === id);
  if (!fund) return undefined;

  const detail = MUTUAL_FUND_CATALOG.fundDetails[id] ?? defaultDetailFields(fund);
  return { ...fund, ...detail };
}

export function getMutualFundSymbol(id: string): string | undefined {
  return allCatalogFunds().find((f) => f.id === id)?.symbol;
}

/* ── NAV history ───────────────────────────────────────────────────────────── */

/** One priced day: `[ISO date, NAV]`, oldest first. */
export type NavPoint = { date: string; nav: number };

export type NavHistory = {
  currency: string;
  points: NavPoint[];
};

/**
 * Five years of NAV, weekly until a year back and every business day after —
 * a 5Y line reads the same at weekly resolution and the file stays small.
 *
 * The series is built to agree with `historicalReturns`: the NAV one month
 * back really is 2.82% below the latest one, and so on down the list, so the
 * chart and the returns under it can never tell different stories.
 */
const NAV_HISTORY: Record<
  string,
  { currency: string; points: (string | number)[][] } | undefined
> = navHistoryRaw;

const NAV_HISTORY_CACHE = new Map<string, NavHistory | undefined>();

export function getNavHistory(fundId: string): NavHistory | undefined {
  if (NAV_HISTORY_CACHE.has(fundId)) return NAV_HISTORY_CACHE.get(fundId);
  const history = buildNavHistory(fundId);
  NAV_HISTORY_CACHE.set(fundId, history);
  return history;
}

function buildNavHistory(fundId: string): NavHistory | undefined {
  const raw = NAV_HISTORY[fundId];
  if (!raw) {
    const fund = getMutualFund(fundId);
    return fund ? mockNavHistory(fund) : undefined;
  }
  return {
    currency: raw.currency,
    points: raw.points.map(([date, nav]) => ({ date: String(date), nav: Number(nav) })),
  };
}
