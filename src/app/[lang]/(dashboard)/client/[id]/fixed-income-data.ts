import fixedIncomeRaw from "@/data/fixed-income.json";
import type { StructuredProduct } from "./structured-product-data";

export type FixedIncomeStatus = "open" | "upcoming" | "soon";
export type FixedIncomeAction = "invest" | "follow" | "followed";

export type FixedIncomeDocument = {
  label: string;
  href?: string;
};

export type FixedIncomeBond = {
  id: string;
  symbol: string;
  fullCompanyName: string;
  companyName: string;
  logoIdx: number;
  logoCrop?: boolean;
  status: FixedIncomeStatus;
  statusLabel: string;
  bondCategory: string;
  ytm: string;
  couponRate: string;
  couponPeriod: string;
  tenor: string;
  maturity: string;
  companyRating: string;
  bondRating: string;
  risk: string;
  guarantee: string;
  offerType: string;
  subscriptionPeriod: string;
  documents: FixedIncomeDocument[];
  updatedAt: string;
  action: FixedIncomeAction;
};

export type FixedIncomeCompany = {
  id: string;
  fullName: string;
  logoIdx: number;
  description: string;
  ticker: string;
  offeringType: string;
  minSubscription: string;
  updatedAt: string;
};

export const BOND_LOGOS: string[] = fixedIncomeRaw.logos;

export const FIXED_INCOME_BONDS = fixedIncomeRaw.bonds as FixedIncomeBond[];

const COMPANY_ONLY_BONDS = fixedIncomeRaw.secondaryMarketBonds as FixedIncomeBond[];
const FIXED_INCOME_COMPANIES = fixedIncomeRaw.companies as FixedIncomeCompany[];
const FIXED_INCOME_COMPANY_ORDER: string[] = fixedIncomeRaw.companyOrder;

function allBonds(): FixedIncomeBond[] {
  return [...FIXED_INCOME_BONDS, ...COMPANY_ONLY_BONDS];
}

export function getFixedIncomeCompany(companyId: string): FixedIncomeCompany | undefined {
  return FIXED_INCOME_COMPANIES.find((c) => c.id === companyId);
}

export function resolveFixedIncomeCompany(companyId: string): FixedIncomeCompany | null {
  const existing = getFixedIncomeCompany(companyId);
  if (existing) return existing;

  const bonds = FIXED_INCOME_BONDS.filter((b) => b.companyName === companyId);
  if (bonds.length === 0) return null;

  const first = bonds[0];
  return {
    id: companyId,
    fullName: first.fullCompanyName,
    logoIdx: first.logoIdx,
    description: "",
    ticker: companyId,
    offeringType: first.offerType,
    minSubscription: "100,000 บาท | ทวีคูณครั้งละ 100,000 บาท",
    updatedAt: first.updatedAt,
  };
}

export function getCompanyPrimaryBonds(companyId: string): FixedIncomeBond[] {
  return allBonds().filter(
    (b) => b.companyName === companyId && b.bondCategory === "หุ้นกู้ตลาดแรก",
  );
}

export function getCompanySecondaryBonds(companyId: string): FixedIncomeBond[] {
  return allBonds().filter(
    (b) => b.companyName === companyId && b.bondCategory === "หุ้นกู้ตลาดรอง",
  );
}

export function getFixedIncomeBond(id: string): FixedIncomeBond | undefined {
  return allBonds().find((b) => b.id === id);
}

/**
 * The id a bond is booked and routed under in Order Management.
 *
 * Prefixed because `/orders/:id` is one namespace shared with every bookable
 * desk; `findBookableProduct` splits on the prefix.
 */
export function fixedIncomeBookableId(bond: Pick<FixedIncomeBond, "id">): string {
  return `fi-${bond.id}`;
}

/**
 * Mock issue quota per bond, in THB — the most the desk can place before the
 * bond is sold out. Not in the catalogue data yet; picked from a fixed ladder by
 * the bond's id so it is stable across renders and between server and browser.
 */
const FI_QUOTA_LADDER_THB = [5_000_000, 8_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000];

export function fixedIncomeQuotaThb(bond: Pick<FixedIncomeBond, "id">): number {
  const seed = [...bond.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return FI_QUOTA_LADDER_THB[seed % FI_QUOTA_LADDER_THB.length];
}

/** The company's minimum subscription, e.g. `"100,000 บาท | ทวีคูณ…"` → `"100,000 THB"`. */
function minSubscriptionThb(bond: FixedIncomeBond): string {
  const text = resolveFixedIncomeCompany(bond.companyName)?.minSubscription ?? "";
  const digits = text.split("|")[0].replace(/[^0-9,]/g, "");
  return `${digits || "100,000"} THB`;
}

/**
 * A bond in the shape the order machinery reads a product in — the same
 * conversion `toBookableProduct` does for the Thai structured desk. Barrier
 * fields have no meaning for a bond and read "-".
 */
export function fixedIncomeToBookableProduct(bond: FixedIncomeBond): StructuredProduct {
  return {
    id: fixedIncomeBookableId(bond),
    underlying: bond.symbol,
    coupon: bond.couponRate,
    tenor: bond.tenor,
    ko: "-",
    strike: "-",
    ki: "-",
    tags: [],
    logos: BOND_LOGOS[bond.logoIdx] ? [BOND_LOGOS[bond.logoIdx]] : [],
    offerDate: bond.subscriptionPeriod,
    couponPeriod: bond.couponPeriod,
    detailTenor: bond.tenor,
    productName: `${bond.bondCategory} · ${bond.companyName}`,
    productType: bond.bondCategory,
    currency: "THB",
    minInvestment: minSubscriptionThb(bond),
    // Only the denominator is read (see `orderTargetFor`): for a bond it is the
    // quota rather than a basket to fill.
    requestNotionalSize: `0 / ${fixedIncomeQuotaThb(bond).toLocaleString("en-US")}`,
    issuer: bond.fullCompanyName,
    updatedAt: bond.updatedAt,
  };
}

export function getBookingLabel(bond: FixedIncomeBond): string {
  const prefix = bond.status === "open" ? "เปิดขาย" : "คาดว่าเปิดขาย";
  return `${prefix} ${bond.subscriptionPeriod}`;
}

export function getRiskNumber(risk: string): string {
  return risk.replace("ระดับ ", "");
}

export type FixedIncomeCouponFilter = "lt2" | "2to4" | "5to7" | "gt7";
export type FixedIncomeOfferFilter = "po" | "ii-hnw" | "iuihnw";
export type FixedIncomeRiskFilter = "lt3" | "4to5" | "6to7" | "8";

export type FixedIncomeFilters = {
  companies: string[];
  coupons: FixedIncomeCouponFilter[];
  offerTypes: FixedIncomeOfferFilter[];
  risks: FixedIncomeRiskFilter[];
};

export const EMPTY_FIXED_INCOME_FILTERS: FixedIncomeFilters = {
  companies: [],
  coupons: [],
  offerTypes: [],
  risks: [],
};

export const FIXED_INCOME_COUPON_FILTERS = fixedIncomeRaw.filters.coupon as {
  id: FixedIncomeCouponFilter;
  label: string;
}[];

export const FIXED_INCOME_OFFER_FILTERS = fixedIncomeRaw.filters.offerType as {
  id: FixedIncomeOfferFilter;
  label: string;
}[];

export const FIXED_INCOME_RISK_FILTERS = fixedIncomeRaw.filters.risk as {
  id: FixedIncomeRiskFilter;
  label: string;
}[];

export function countFixedIncomeFilters(filters: FixedIncomeFilters): number {
  return (
    filters.companies.length +
    filters.coupons.length +
    filters.offerTypes.length +
    filters.risks.length
  );
}

export type FixedIncomeFilterChipCategory = "company" | "coupon" | "offerType" | "risk";

export type FixedIncomeFilterChip = {
  id: string;
  label: string;
  category: FixedIncomeFilterChipCategory;
  value: string;
};

function getCouponChipLabel(id: FixedIncomeCouponFilter): string {
  switch (id) {
    case "lt2":
      return "ดอกเบี้ย น้อยกว่า 2%";
    case "2to4":
      return "ดอกเบี้ย 2 - 4%";
    case "5to7":
      return "ดอกเบี้ย 5 - 7%";
    case "gt7":
      return "ดอกเบี้ย มากกว่า 7%";
  }
}

function getRiskChipLabel(id: FixedIncomeRiskFilter): string {
  const option = FIXED_INCOME_RISK_FILTERS.find((item) => item.id === id);
  return option ? `ความเสี่ยง ${option.label}` : id;
}

export function getFixedIncomeFilterChips(filters: FixedIncomeFilters): FixedIncomeFilterChip[] {
  const chips: FixedIncomeFilterChip[] = [];

  for (const companyId of filters.companies) {
    chips.push({
      id: `company:${companyId}`,
      label: companyId,
      category: "company",
      value: companyId,
    });
  }

  for (const couponId of filters.coupons) {
    chips.push({
      id: `coupon:${couponId}`,
      label: getCouponChipLabel(couponId),
      category: "coupon",
      value: couponId,
    });
  }

  for (const offerTypeId of filters.offerTypes) {
    const option = FIXED_INCOME_OFFER_FILTERS.find((item) => item.id === offerTypeId);
    chips.push({
      id: `offerType:${offerTypeId}`,
      label: option?.label ?? offerTypeId,
      category: "offerType",
      value: offerTypeId,
    });
  }

  for (const riskId of filters.risks) {
    chips.push({
      id: `risk:${riskId}`,
      label: getRiskChipLabel(riskId),
      category: "risk",
      value: riskId,
    });
  }

  return chips;
}

export function removeFixedIncomeFilterChip(
  filters: FixedIncomeFilters,
  chip: FixedIncomeFilterChip,
): FixedIncomeFilters {
  switch (chip.category) {
    case "company":
      return {
        ...filters,
        companies: filters.companies.filter((companyId) => companyId !== chip.value),
      };
    case "coupon":
      return { ...filters, coupons: filters.coupons.filter((c) => c !== chip.value) };
    case "offerType":
      return { ...filters, offerTypes: filters.offerTypes.filter((o) => o !== chip.value) };
    case "risk":
      return {
        ...filters,
        risks: filters.risks.filter((riskId) => riskId !== chip.value),
      };
  }
}

export type FixedIncomeFilterCompany = {
  id: string;
  name: string;
  logoIdx: number;
  logoCrop?: boolean;
};

export function getFixedIncomeFilterCompanies(): FixedIncomeFilterCompany[] {
  const byId = new Map<string, FixedIncomeFilterCompany>();
  for (const bond of FIXED_INCOME_BONDS) {
    if (!byId.has(bond.companyName)) {
      byId.set(bond.companyName, {
        id: bond.companyName,
        name: bond.companyName,
        logoIdx: bond.logoIdx,
        logoCrop: bond.logoCrop,
      });
    }
  }
  return FIXED_INCOME_COMPANY_ORDER.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

function parseCouponPercent(couponRate: string): number {
  return parseFloat(couponRate.replace(/[^\d.]/g, ""));
}

function parseRiskLevel(risk: string): number {
  return parseInt(risk.replace(/\D/g, ""), 10);
}

function matchesCouponFilter(couponRate: string, filter: FixedIncomeCouponFilter): boolean {
  const rate = parseCouponPercent(couponRate);
  switch (filter) {
    case "lt2":
      return rate < 2;
    case "2to4":
      return rate >= 2 && rate <= 4;
    case "5to7":
      return rate >= 5 && rate <= 7;
    case "gt7":
      return rate > 7;
  }
}

function matchesOfferFilter(offerType: string, filter: FixedIncomeOfferFilter): boolean {
  switch (filter) {
    case "po":
      return offerType === "PO";
    case "ii-hnw":
      return offerType === "PO/HNW";
    case "iuihnw":
      return offerType === "HNW/UHNW";
  }
}

function matchesRiskFilter(risk: string, filter: FixedIncomeRiskFilter): boolean {
  const level = parseRiskLevel(risk);
  switch (filter) {
    case "lt3":
      return level < 3;
    case "4to5":
      return level >= 4 && level <= 5;
    case "6to7":
      return level >= 6 && level <= 7;
    case "8":
      return level === 8;
  }
}

export function filterFixedIncomeBonds(
  bonds: FixedIncomeBond[],
  filters: FixedIncomeFilters,
): FixedIncomeBond[] {
  if (countFixedIncomeFilters(filters) === 0) return bonds;

  return bonds.filter((bond) => {
    if (filters.companies.length > 0 && !filters.companies.includes(bond.companyName)) {
      return false;
    }
    if (filters.coupons.length > 0 && !filters.coupons.some((c) => matchesCouponFilter(bond.couponRate, c))) {
      return false;
    }
    if (filters.offerTypes.length > 0 && !filters.offerTypes.some((o) => matchesOfferFilter(bond.offerType, o))) {
      return false;
    }
    if (
      filters.risks.length > 0 &&
      !filters.risks.some((risk) => matchesRiskFilter(bond.risk, risk))
    ) {
      return false;
    }
    return true;
  });
}
