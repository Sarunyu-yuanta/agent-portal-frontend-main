import { defineEndpoint } from "@/lib/api/endpoint";
import { mockAnalysts, mockHouseViewStrategies } from "@/mocks/mock-data";
import { RESEARCH_FEED } from "@/features/insights/lib/research-data";

/** Every published house-view strategy — the Insights list. */
export const houseViewStrategiesEndpoint = defineEndpoint("house-view-strategies", {
  mock: () => mockHouseViewStrategies,
});

export const analystsEndpoint = defineEndpoint("analysts", { mock: () => mockAnalysts });

export const researchFeedEndpoint = defineEndpoint("research-feed", { mock: () => RESEARCH_FEED });
