/** House-view strategies and the research team behind them. */

export type Conviction = "High" | "Medium" | "Low";

/** Badge colour for a conviction level. */
export type ConvictionVariant = "green" | "yellow" | "red";

export type StrategyAssetClass =
  "Equity" | "Fixed Income" | "Mixed" | "Alternatives" | "Real Estate";

export type HouseViewStrategy = {
  id: string;
  name: string;
  conviction: Conviction;
  convictionVariant: ConvictionVariant;
  targetAllocation: string;
  pitchHook: string;
  products: string[];
  matchedClients: number;
  assetClass: StrategyAssetClass;
  category: string;
  period: "weekly" | "monthly";
  /** Display label of the period, already localized by the source. */
  periodLabel: string;
};

export type Analyst = { id: string; name: string; title: string; photo: string };
