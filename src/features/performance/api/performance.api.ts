import { defineEndpoint } from "@/lib/api/endpoint";
import { mockPerformanceData } from "@/mocks/mock-data";

export const performanceEndpoint = defineEndpoint("performance", {
  mock: () => mockPerformanceData,
});
