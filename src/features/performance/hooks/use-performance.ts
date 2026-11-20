"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { PerformanceData } from "@/types/sales";
import { performanceEndpoint } from "@/features/performance/api/performance.api";

export function usePerformance(): Resource<PerformanceData | null> {
  return useEndpoint(performanceEndpoint, [], { fallback: null });
}
