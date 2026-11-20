import { defineEndpoint } from "@/lib/api/endpoint";
import { mockNBAActions } from "@/mocks/mock-data";
import { mockRiskAlerts } from "@/mocks/risk-mock-data";

/** AI next-best actions across the IC's book. */
export const nbaActionsEndpoint = defineEndpoint("nba-actions", {
  mock: () => mockNBAActions,
});

/**
 * Every open risk & compliance finding across the book, in authored order.
 * Critical findings are a push-tier feed (docs/api-by-page.md).
 */
export const riskAlertsEndpoint = defineEndpoint("risk-alerts", {
  mock: () => mockRiskAlerts,
});
