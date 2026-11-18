import globalBondsRaw from "@/data/global-bonds.json";
import type { StructuredProduct } from "./structured-product-data";

export type GlobalBondIssuerId =
  | "apple"
  | "microsoft"
  | "meta"
  | "amazon"
  | "coke"
  | "amex"
  | "nvidia"
  | "walmart";

export type YieldFilter = "all" | "lt2" | "2-3" | "3-4" | "gt4";
export type MaturityFilter = "all" | "short" | "long";
export type TickerFilter = "all" | "AAPL" | "MSFT" | "META" | "AMZN";
export type CouponFilter = "all" | "lt2" | "2-3" | "3-4" | "gt4";

export type GlobalBondRow = {
  id: string;
  name: string;
  logo: string;
  ticker?: string;
  isin: string;
  currency: string;
  couponRate: string;
  couponValue?: number;
  price: string;
  yieldPct: string;
  yieldValue: number;
  maturity: string;
  duration: string;
  durationYears: number;
  topPick?: boolean;
};

export type GlobalBondIssuer = {
  id: GlobalBondIssuerId;
  title: string;
  fullName: string;
  description: string;
  logo: string;
  ticker: string;
  currency: string;
  creditRating: string;
  updatedAt: string;
  heroImage?: string;
  bonds: GlobalBondRow[];
  couponRateRange: string;
  maturityRange: string;
  estimatedYield: string;
  sp: string;
  moodys: string;
  fitch: string;
};

export type DetailRecommendedCard = {
  id: GlobalBondIssuerId;
  title: string;
  ticker: string;
  estimatedYield: string;
  maturityRange: string;
  logoSrc: string;
  logoVariant: "meta-infinity" | "image";
};

export const GLOBAL_BOND_LOGOS = globalBondsRaw.logos as Record<GlobalBondIssuerId, string>;

const ISSUER_ID_BY_LOGO: Partial<Record<string, GlobalBondIssuerId>> = Object.fromEntries(
  Object.entries(GLOBAL_BOND_LOGOS).map(([id, logo]) => [logo, id as GlobalBondIssuerId]),
);

export function getIssuerIdForBondRow(row: GlobalBondRow): GlobalBondIssuerId | undefined {
  return ISSUER_ID_BY_LOGO[row.logo];
}

export const GLOBAL_BOND_ISSUERS: Record<GlobalBondIssuerId, GlobalBondIssuer> =
  Object.fromEntries(
    (globalBondsRaw.issuers as GlobalBondIssuer[]).map((issuer) => [issuer.id, issuer]),
  ) as Record<GlobalBondIssuerId, GlobalBondIssuer>;

export const TOP_PICK_ROWS = globalBondsRaw.topPickRows as GlobalBondRow[];
export const RECOMMENDED_ISSUERS = globalBondsRaw.recommendedIssuers as GlobalBondIssuerId[];

/** Table/accordion row projection of the recommended issuers — used by both
 *  desktop (RecommendedBondsTable) and mobile (RecommendedAccordionList). */
export type RecommendedIssuerRow = {
  id: GlobalBondIssuerId;
  issuer: string;
  logo: string;
  couponRate: string;
  maturity: string;
  sp: string;
  moodys: string;
  fitch: string;
  estimatedYield: string;
  alt: boolean;
};

export const RECOMMENDED_ISSUER_ROWS: RecommendedIssuerRow[] =
  RECOMMENDED_ISSUERS.map((id, i) => {
    const issuer = GLOBAL_BOND_ISSUERS[id];
    return {
      id,
      issuer: issuer.fullName,
      logo: issuer.logo,
      couponRate: issuer.couponRateRange,
      maturity: issuer.maturityRange,
      sp: issuer.sp,
      moodys: issuer.moodys,
      fitch: issuer.fitch,
      estimatedYield: issuer.estimatedYield,
      alt: i % 2 === 0,
    };
  });
export const DETAIL_RECOMMENDED_ISSUERS: GlobalBondIssuerId[] = ["meta", "microsoft", "amazon"];
export const DETAIL_RECOMMENDED_CARDS =
  globalBondsRaw.detailRecommendedCards as DetailRecommendedCard[];

export const ALL_OVERSEAS_BONDS_COUNT = globalBondsRaw.meta.allOverseasBondsCount;
export const ALL_OVERSEAS_BONDS_UPDATED_AT = globalBondsRaw.meta.allOverseasBondsUpdatedAt;

export const ALL_OVERSEAS_BONDS: GlobalBondRow[] = Array.from(
  { length: ALL_OVERSEAS_BONDS_COUNT },
  (_, i) => {
    const seed = globalBondsRaw.allOverseasBondsSeed[i % globalBondsRaw.allOverseasBondsSeed.length];
    return { ...(seed as GlobalBondRow), id: `aob-${i + 1}` };
  },
);

export function getGlobalBondIssuer(id: string): GlobalBondIssuer | undefined {
  return GLOBAL_BOND_ISSUERS[id as GlobalBondIssuerId];
}

export function filterGlobalBonds(
  bonds: GlobalBondRow[],
  yieldFilter: YieldFilter,
  maturityFilter: MaturityFilter,
): GlobalBondRow[] {
  return bonds.filter((bond) => {
    const yieldMatch =
      yieldFilter === "all" ||
      (yieldFilter === "lt2" && bond.yieldValue < 2) ||
      (yieldFilter === "2-3" && bond.yieldValue >= 2 && bond.yieldValue < 3) ||
      (yieldFilter === "3-4" && bond.yieldValue >= 3 && bond.yieldValue < 4) ||
      (yieldFilter === "gt4" && bond.yieldValue >= 4);

    const maturityMatch =
      maturityFilter === "all" ||
      (maturityFilter === "short" && bond.durationYears <= 3) ||
      (maturityFilter === "long" && bond.durationYears > 3);

    return yieldMatch && maturityMatch;
  });
}

function matchCouponFilter(couponValue: number | undefined, filter: CouponFilter): boolean {
  if (filter === "all" || couponValue === undefined) return filter === "all";
  return (
    (filter === "lt2" && couponValue < 2) ||
    (filter === "2-3" && couponValue >= 2 && couponValue < 3) ||
    (filter === "3-4" && couponValue >= 3 && couponValue < 4) ||
    (filter === "gt4" && couponValue >= 4)
  );
}

export function filterAllOverseasBonds(
  bonds: GlobalBondRow[],
  tickerFilter: TickerFilter,
  couponFilter: CouponFilter,
  yieldFilter: YieldFilter,
  maturityFilter: MaturityFilter,
): GlobalBondRow[] {
  return bonds.filter((bond) => {
    const tickerMatch = tickerFilter === "all" || bond.ticker === tickerFilter;
    const couponMatch = matchCouponFilter(bond.couponValue, couponFilter);
    const yieldMatch =
      yieldFilter === "all" ||
      (yieldFilter === "lt2" && bond.yieldValue < 2) ||
      (yieldFilter === "2-3" && bond.yieldValue >= 2 && bond.yieldValue < 3) ||
      (yieldFilter === "3-4" && bond.yieldValue >= 3 && bond.yieldValue < 4) ||
      (yieldFilter === "gt4" && bond.yieldValue >= 4);
    const maturityMatch =
      maturityFilter === "all" ||
      (maturityFilter === "short" && bond.durationYears <= 3) ||
      (maturityFilter === "long" && bond.durationYears > 3);
    return tickerMatch && couponMatch && yieldMatch && maturityMatch;
  });
}

// ── Booking ──────────────────────────────────────────────────────────────────

/**
 * The id a bond is booked and routed under in Order Management.
 *
 * Keyed on the issuer page's own bond row (`a1`, `m1`, …) — the one list where
 * every bond is distinct. The top-pick and all-overseas lists repeat rows and
 * ISINs freely, so they resolve to a bookable bond by name instead; see
 * {@link findBookableGlobalBond}.
 */
export function globalBondBookableId(row: Pick<GlobalBondRow, "id">): string {
  return `gb-${row.id}`;
}

const ISSUER_BONDS: { issuer: GlobalBondIssuer; row: GlobalBondRow }[] = Object.values(
  GLOBAL_BOND_ISSUERS,
).flatMap((issuer) => issuer.bonds.map((row) => ({ issuer, row })));

/** The issuer bond a row from any list stands for, or `undefined` when none matches. */
export function findBookableGlobalBond(row: Pick<GlobalBondRow, "id" | "name">) {
  return (
    ISSUER_BONDS.find((b) => b.row.id === row.id) ??
    ISSUER_BONDS.find((b) => b.row.name === row.name)
  );
}

/**
 * Mock issue quota per bond, in USD — not in the catalogue data yet. Picked from
 * a fixed ladder by the row id, so it is stable across renders.
 */
const GB_QUOTA_LADDER_USD = [1_000_000, 1_500_000, 2_000_000, 3_000_000];

/** Global bonds trade in round lots; 200,000 is the desk's usual minimum. */
const GB_MIN_TICKET = "200,000 USD";

export function globalBondQuotaUsd(row: Pick<GlobalBondRow, "id">): number {
  const seed = [...row.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return GB_QUOTA_LADDER_USD[seed % GB_QUOTA_LADDER_USD.length];
}

/** An issuer bond in the shape the order machinery reads a product in. */
export function globalBondToBookableProduct(
  issuer: GlobalBondIssuer,
  row: GlobalBondRow,
): StructuredProduct {
  return {
    id: globalBondBookableId(row),
    underlying: row.name,
    coupon: row.couponRate,
    tenor: row.duration,
    ko: "-",
    strike: "-",
    ki: "-",
    tags: [],
    logos: [row.logo],
    offerDate: "-",
    couponPeriod: "-",
    detailTenor: row.duration,
    productName: `${issuer.title} · ${row.isin}`,
    productType: "Global Bond",
    currency: row.currency,
    minInvestment: GB_MIN_TICKET,
    requestNotionalSize: `0 / ${globalBondQuotaUsd(row).toLocaleString("en-US")}`,
    issuer: issuer.fullName,
    updatedAt: issuer.updatedAt,
  };
}

const BOOKABLE_BY_ID = new Map(
  ISSUER_BONDS.map(({ issuer, row }) => [
    globalBondBookableId(row),
    globalBondToBookableProduct(issuer, row),
  ]),
);

export function getBookableGlobalBond(id: string): StructuredProduct | undefined {
  return BOOKABLE_BY_ID.get(id);
}

/** Every bookable global bond — what Order Management books from. */
export function allBookableGlobalBonds(): StructuredProduct[] {
  return [...BOOKABLE_BY_ID.values()];
}

/** The issuer page a bookable bond lives on. */
export function globalBondIssuerIdForBookable(id: string): GlobalBondIssuerId | undefined {
  return ISSUER_BONDS.find(({ row }) => globalBondBookableId(row) === id)?.issuer.id;
}
