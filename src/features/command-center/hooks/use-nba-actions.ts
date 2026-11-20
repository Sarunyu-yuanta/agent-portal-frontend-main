"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { NbaAction } from "@/types/sales";
import { nbaActionsEndpoint } from "@/features/command-center/api/command-center.api";

const NONE: NbaAction[] = [];

export function useNBAActions(): Resource<NbaAction[]> {
  return useEndpoint(nbaActionsEndpoint, [], { fallback: NONE });
}
