"use client";

import { useMemo } from "react";
import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { Analyst, HouseViewStrategy } from "@/types/research";
import type { ResearchFeed } from "@/features/insights/lib/research-data";
import {
  analystsEndpoint,
  houseViewStrategiesEndpoint,
  researchFeedEndpoint,
} from "@/features/insights/api/insights.api";

const NO_STRATEGIES: HouseViewStrategy[] = [];
const NO_ANALYSTS: Analyst[] = [];

export function useInsightStrategies(): Resource<HouseViewStrategy[]> {
  return useEndpoint(houseViewStrategiesEndpoint, [], { fallback: NO_STRATEGIES });
}

/** One strategy. `undefined` once loaded means the id isn't one. */
export function useInsightStrategy(id: string): Resource<HouseViewStrategy | undefined> {
  const source = useInsightStrategies();
  const strategy = useMemo(() => source.data.find((s) => s.id === id), [source.data, id]);
  return { ...source, data: strategy };
}

export function useAnalysts(): Resource<Analyst[]> {
  return useEndpoint(analystsEndpoint, [], { fallback: NO_ANALYSTS });
}

export function useResearch(): Resource<ResearchFeed | null> {
  return useEndpoint(researchFeedEndpoint, [], { fallback: null });
}
