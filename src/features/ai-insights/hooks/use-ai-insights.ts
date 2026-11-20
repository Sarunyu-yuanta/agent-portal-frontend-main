"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { AiInsight } from "@/types/sales";
import { aiInsightsEndpoint } from "@/features/ai-insights/api/ai-insights.api";

const NONE: AiInsight[] = [];

export function useAiInsights(): Resource<AiInsight[]> {
  return useEndpoint(aiInsightsEndpoint, [], { fallback: NONE });
}
