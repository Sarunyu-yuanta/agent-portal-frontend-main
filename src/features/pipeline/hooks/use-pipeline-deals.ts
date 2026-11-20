"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { PipelineDeal } from "@/types/sales";
import { pipelineDealsEndpoint } from "@/features/pipeline/api/pipeline.api";

const NONE: PipelineDeal[] = [];

export function usePipelineDeals(): Resource<PipelineDeal[]> {
  return useEndpoint(pipelineDealsEndpoint, [], { fallback: NONE });
}
