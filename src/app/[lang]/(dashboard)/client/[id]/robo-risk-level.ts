/** Figma 33787:149969 — risk bar colors and filled segment counts. Labels: `t.products.advisory.riskTier`. */
export type RoboRiskTier = "low" | "low-medium" | "medium" | "high" | "super-high";

export const ROBO_RISK_TRACK_COLOR = "#d9d9d9";
export const ROBO_RISK_EMPTY_SEGMENT_COLOR = "#f9fafb";

export const ROBO_RISK_CONFIG: Record<
  RoboRiskTier,
  { filledSegments: number; color: string }
> = {
  low: { filledSegments: 1, color: "#00c951" },
  "low-medium": { filledSegments: 2, color: "#f0b100" },
  medium: { filledSegments: 3, color: "#ff6900" },
  high: { filledSegments: 4, color: "#fb2c36" },
  "super-high": { filledSegments: 5, color: "#9810fa" },
};
