/** Portfolio summary shapes shared by the client profile, Client Hub and Command Center. */

export type AssetHeroSummary = {
  netValue: string;
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
  lineAvailable: string;
  cash: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
};

export type AssetAllocationSlice = {
  label: string;
  percent: number;
  statusIcon: string;
};

/** A single client's stake in one product (aggregated in the Product view). */
export type ProductHolder = {
  clientId: string;
  clientName: string;
  tier: string;
  allocationPct: number;
  amountThb: number;
};

/** One product row: an asset class aggregated across all holders. */
export type ProductRow = {
  label: string;
  statusIcon: string;
  clientCount: number;
  totalAmountThb: number;
  avgAllocationPct: number;
  holders: ProductHolder[];
};

// ── Accounts and holdings ────────────────────────────────────────────────────

export type AssetAccountItem = {
  name: string;
  accountNo: string;
  value: string;
  changeAmount?: string;
  changePercent?: string;
  changePositive?: boolean;
  avgYield?: string;
  statusIcon: string;
};

export type PositionField = {
  /** Its label is `t.client.assets.position[id]`. */
  id: "avgCost" | "currentPrice" | "costAmount" | "marketValue" | "quantity";
  value: string;
};

export type PositionSummary = {
  fields: PositionField[];
};

export type HoldingItem = {
  id: string;
  symbol: string;
  fullName: string;
  value: string;
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
  collateral?: boolean;
  /** Units held. Combined with value/changeAmount to derive average cost, current price, etc. */
  quantity?: number;
  position?: PositionSummary;
};

export type HoldingSection = {
  title: string;
  items: HoldingItem[];
};

export type AssetAccountDetail = {
  viewByLabel: string;
  sections: HoldingSection[];
};

// ── Liabilities ──────────────────────────────────────────────────────────────

export type LiabilitySubItem = {
  label: string;
  amount: string;
};

export type LiabilityCategory = {
  id: string;
  label: string;
  percent: number;
  /** Outstanding amount in this category, formatted. */
  amount: string;
  color: string;
  subItems: LiabilitySubItem[];
};

export type LiabilitiesDetail = {
  categories: LiabilityCategory[];
  lastUpdated: string;
};

/** A product inside an asset class, aggregated across the IC's clients. */
export type SubProduct = {
  id: string;
  name: string;
  ticker?: string;
  clientCount: number;
  totalAmountThb: number;
};
