import { defineEndpoint } from "@/lib/api/endpoint";
import { mockPipelineDeals } from "@/mocks/mock-data";

export const pipelineDealsEndpoint = defineEndpoint("pipeline-deals", {
  mock: () => mockPipelineDeals,
});
