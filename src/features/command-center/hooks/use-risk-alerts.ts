"use client";

/**
 * The read side of Risk & Compliance alerts.
 *
 * What the IC has *acknowledged* is not here. That is a user preference, not a
 * property of the finding — see `risk-feed` and `use-risk-alert-rows`.
 */

import { useMemo } from "react";
import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { RiskAlert } from "@/types/risk-alert";
import { riskAlertsEndpoint } from "@/features/command-center/api/command-center.api";

const NONE: RiskAlert[] = [];

/** Every open finding across the book, in authored order. */
export function useRiskAlertsResource(): Resource<RiskAlert[]> {
  return useEndpoint(riskAlertsEndpoint, [], { fallback: NONE });
}

/** One finding. `undefined` once loaded means the id isn't an alert. */
export function useRiskAlert(id: string): Resource<RiskAlert | undefined> {
  const source = useRiskAlertsResource();
  const { data } = source;
  const alert = useMemo(() => data.find((a) => a.id === id), [data, id]);
  return { ...source, data: alert };
}
