import topIdeasRaw from "@/data/top-ideas.json";

export type TopIdeaSector =
  | "Energy"
  | "Material"
  | "Industrials"
  | "Consumer Discretionary"
  | "Consumer Staples";

export const TOP_IDEA_THEMES: Record<TopIdeaSector, string> = Object.fromEntries(
  topIdeasRaw.sectors.map((s) => [s.id, s.theme]),
) as Record<TopIdeaSector, string>;

export const TOP_IDEA_SUBTITLES: Record<TopIdeaSector, string> = Object.fromEntries(
  topIdeasRaw.sectors.map((s) => [s.id, s.subtitle]),
) as Record<TopIdeaSector, string>;

export const TOP_IDEA_MAX_COUPON = topIdeasRaw.meta.maxCoupon;
export const TOP_IDEA_UPDATED_AT = topIdeasRaw.meta.updatedAt;
export const TOP_IDEA_UPDATED_AT_MOBILE = topIdeasRaw.meta.updatedAtMobile;

export const TOP_IDEAS: { sector: TopIdeaSector }[] = topIdeasRaw.homeStrip.map((id) => ({
  sector: id as TopIdeaSector,
}));

export const ALL_TOP_IDEAS: { sector: TopIdeaSector }[] = topIdeasRaw.allGrid.map((id) => ({
  sector: id as TopIdeaSector,
}));
