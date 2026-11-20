import { defineEndpoint } from "@/lib/api/endpoint";
import { mockComplianceAlerts } from "@/mocks/mock-data";

export const complianceAlertsEndpoint = defineEndpoint("compliance-alerts", {
  mock: () => mockComplianceAlerts,
});
