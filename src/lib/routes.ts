/**
 * App paths, without the locale prefix — `LocaleLink` / `useLocalizedRouter`
 * add it. Use these instead of string literals so a renamed route is a
 * one-line change and a typo is a type error.
 *
 * Feature-specific builders with query state live beside their feature
 * (`catalogListHref`, `ordersListHref`, `mutualFundThemeHref`, …).
 */
export const ROUTES = {
  home: "/",
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  commandCenter: "/command-center",
  callLog: "/command-center/call-log",
  nextBestActions: "/command-center/next-best-actions",
  riskAlerts: "/command-center/risk-alerts",
  clientHub: "/client-hub",
  insights: "/insights",
  promotions: "/promotions",
  productCatalog: "/product-catalog",
  orders: "/orders",
  notes: "/notes",
  calendar: "/calendar",
  reminders: "/reminders",
  performance: "/performance",
  icLearning: "/ic-learning",
  yaaTeamHead: "/yaa-team-head",
  aiInsights: "/ai-insights",
  compliance: "/compliance",
  pipeline: "/pipeline",
} as const;

/** Client 360 profile, optionally opened on a tab (`overview`, `kyc`, …). */
export function clientPath(clientId: string, tab?: string): string {
  return tab ? `/client/${clientId}?tab=${tab}` : `/client/${clientId}`;
}

export function insightPath(id: string): string {
  return `/insights/${id}`;
}

export function campaignPath(id: string): string {
  return `/promotions/${id}`;
}
