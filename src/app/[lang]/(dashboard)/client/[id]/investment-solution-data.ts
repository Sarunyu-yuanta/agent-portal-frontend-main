import investmentSolutionsRaw from "@/data/investment-solutions.json";

export type InvestmentSolutionId = "secure-income" | "balanced-growth" | "high-conviction";

export type HeroBannerImage = {
  containerWidth: number;
  containerHeight: number;
  leftPx: number;
  topOffset: number;
  imgLeft?: string;
  imgWidth?: string;
  rotation?: number;
  objectCover?: boolean;
  /** Mobile (375px) per Figma 34995:49778 */
  mobile: {
    bannerHeight: number;
    width: number;
    height: number;
    gap?: number;
    /** Fixed left/top — Secure Income & Balanced Growth */
    leftPx?: number;
    topPx?: number;
    /** Fixed anchor + translate(-50%) — High Conviction */
    anchorLeftPx?: number;
    anchorTopOffset?: number;
  };
  /** Tablet (768px) per Figma 34995:49867 / 33991:122779 */
  tablet: {
    bannerHeight: number;
    width: number;
    height: number;
    leftPx?: number;
    topPx?: number;
    anchorLeftPx?: number;
    anchorTopOffset?: number;
  };
  /** Desktop anchor for High Conviction (1440px): calc(50% - 686.01px) */
  anchorLeftPx?: number;
};

export type InvestmentSolution = {
  id: InvestmentSolutionId;
  name: string;
  desc: string;
  couponRange: string;
  tenor: string;
  heroGradient: string;
  heroGradientMobile: string;
  heroGradientTablet: string;
  heroImage: string;
  heroBannerImage: HeroBannerImage;
  showCoupon: boolean;
};

// ─── UI-only: gradient backgrounds (SVG data URIs) ────────────────────────────

const GRAD_SECURE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1440 146' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(112.56 6.8832 -24.44 52.448 245.31 77.168)'><stop stop-color='%23f6f7fb'/><stop offset='1' stop-color='%23c5dbe8'/></radialGradient></defs></svg>\")";

const GRAD_BALANCED =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1440 146' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(112.56 6.8832 -24.44 52.448 245.31 77.168)'><stop stop-color='%23ffedfc'/><stop offset='1' stop-color='%23f8d0d8'/></radialGradient></defs></svg>\")";

const GRAD_HIGH_CV =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 1440 146' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(112.56 6.8832 -24.44 52.448 245.31 77.168)'><stop stop-color='%23e5e3fe'/><stop offset='1' stop-color='%23d5beff'/></radialGradient></defs></svg>\")";

const GRAD_SECURE_MOBILE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 375 96' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(29.313 4.526 -6.3646 34.487 63.882 50.74)'><stop stop-color='%23f6f7fb'/><stop offset='1' stop-color='%23c5dbe8'/></radialGradient></defs></svg>\")";

const GRAD_BALANCED_MOBILE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 375 96' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(29.313 4.526 -6.3646 34.487 63.882 50.74)'><stop stop-color='%23ffedfc'/><stop offset='1' stop-color='%23f8d0d8'/></radialGradient></defs></svg>\")";

const GRAD_HIGH_CV_MOBILE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 375 98' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(29.313 4.6202 -6.3646 35.205 63.882 51.798)'><stop stop-color='%23e5e3fe'/><stop offset='1' stop-color='%23d5beff'/></radialGradient></defs></svg>\")";

const GRAD_SECURE_TABLET =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 768 96' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(60.033 4.526 -13.035 34.487 130.83 50.74)'><stop stop-color='%23f6f7fb'/><stop offset='1' stop-color='%23c5dbe8'/></radialGradient></defs></svg>\")";

const GRAD_BALANCED_TABLET =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 768 96' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(60.033 4.526 -13.035 34.487 130.83 50.74)'><stop stop-color='%23ffedfc'/><stop offset='1' stop-color='%23f8d0d8'/></radialGradient></defs></svg>\")";

const GRAD_HIGH_CV_TABLET =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 768 98' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(60.033 4.6202 -13.035 35.205 130.83 51.798)'><stop stop-color='%23e5e3fe'/><stop offset='1' stop-color='%23d5beff'/></radialGradient></defs></svg>\")";

// ─── UI-only: per-solution banner image layout (pixel values from Figma) ──────

type BannerUIData = {
  heroGradient: string;
  heroGradientMobile: string;
  heroGradientTablet: string;
  heroBannerImage: HeroBannerImage;
};

const BANNER_UI: Record<InvestmentSolutionId, BannerUIData> = {
  "secure-income": {
    heroGradient: GRAD_SECURE,
    heroGradientMobile: GRAD_SECURE_MOBILE,
    heroGradientTablet: GRAD_SECURE_TABLET,
    heroBannerImage: {
      containerWidth: 61,
      containerHeight: 78,
      leftPx: 33,
      topOffset: 9,
      imgLeft: "0",
      imgWidth: "227.8%",
      mobile: { bannerHeight: 96, leftPx: 24, topPx: 12, width: 37.525, height: 48, gap: 12 },
      tablet: { bannerHeight: 96, leftPx: 29.948, topPx: 12, width: 37.525, height: 48 },
    },
  },
  "balanced-growth": {
    heroGradient: GRAD_BALANCED,
    heroGradientMobile: GRAD_BALANCED_MOBILE,
    heroGradientTablet: GRAD_BALANCED_TABLET,
    heroBannerImage: {
      containerWidth: 63.051,
      containerHeight: 90,
      leftPx: 32,
      topOffset: 9,
      imgLeft: "-20.9%",
      imgWidth: "142.74%",
      mobile: { bannerHeight: 96, leftPx: 20, topPx: 5.394, width: 42.885, height: 61.214, gap: 16 },
      tablet: { bannerHeight: 96, leftPx: 25.948, topPx: 5.394, width: 42.885, height: 61.214 },
    },
  },
  "high-conviction": {
    heroGradient: GRAD_HIGH_CV,
    heroGradientMobile: GRAD_HIGH_CV_MOBILE,
    heroGradientTablet: GRAD_HIGH_CV_TABLET,
    heroBannerImage: {
      containerWidth: 143.982,
      containerHeight: 96,
      leftPx: -38,
      topOffset: 9,
      anchorLeftPx: 33.99,
      rotation: 180,
      objectCover: true,
      mobile: { bannerHeight: 98, anchorLeftPx: 19.94, width: 143.982, height: 96, gap: 16 },
      tablet: { bannerHeight: 98, anchorLeftPx: 33.99, width: 143.982, height: 96 },
    },
  },
};

// ─── Merge business data (JSON) with UI constants ─────────────────────────────

export const INVESTMENT_SOLUTIONS: InvestmentSolution[] = (
  investmentSolutionsRaw as Array<Omit<InvestmentSolution, "heroGradient" | "heroGradientMobile" | "heroGradientTablet" | "heroBannerImage">>
).map((s) => ({ ...s, ...BANNER_UI[s.id] }));

export const INVESTMENT_SOLUTION_UPDATED_AT = "10 September 2026 - 09:00";
export const INVESTMENT_SOLUTION_UPDATED_AT_MOBILE = "10 Sep 2026 - 09:00";

export function getInvestmentSolution(id: InvestmentSolutionId): InvestmentSolution {
  return INVESTMENT_SOLUTIONS.find((s) => s.id === id) ?? INVESTMENT_SOLUTIONS[2];
}

