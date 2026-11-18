/** Figma 33787:149969 — risk bar colors and filled segment counts. */
export type RoboRiskTier = "low" | "low-medium" | "medium" | "high" | "super-high";

export const ROBO_RISK_TRACK_COLOR = "#d9d9d9";
export const ROBO_RISK_EMPTY_SEGMENT_COLOR = "#f9fafb";

export const ROBO_RISK_CONFIG: Record<
  RoboRiskTier,
  { label: string; filledSegments: number; color: string }
> = {
  low: { label: "ความเสี่ยงต่ำ", filledSegments: 1, color: "#00c951" },
  "low-medium": { label: "ความเสี่ยงต่ำ-กลาง", filledSegments: 2, color: "#f0b100" },
  medium: { label: "ความเสี่ยงกลาง", filledSegments: 3, color: "#ff6900" },
  high: { label: "ความเสี่ยงสูง", filledSegments: 4, color: "#fb2c36" },
  "super-high": { label: "ความเสี่ยงสูงมาก", filledSegments: 5, color: "#9810fa" },
};
