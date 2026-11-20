import { defineEndpoint } from "@/lib/api/endpoint";
import { mockInsights } from "@/mocks/mock-data";

export const aiInsightsEndpoint = defineEndpoint("ai-insights", { mock: () => mockInsights });
