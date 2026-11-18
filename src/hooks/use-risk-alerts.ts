"use client";

/**
 * The read side of Risk & Compliance alerts.
 *
 * Same seam as `@/hooks/use-api`, `@/hooks/use-catalog` and
 * `@/hooks/use-campaigns`: the fixtures ship in the bundle, so this hands them
 * back through {@link useStatic}, and both surfaces already render skeletons
 * against the `isLoading` that comes out. Giving risk alerts a real endpoint is
 * a change in this file.
 *
 * Its own module rather than a fifth entry in `@/hooks/use-api`, which says of
 * itself that it holds the datasets the dashboard *shell* needs. These are a
 * feature's, and putting them there would also have `use-api` importing
 * `risk-mock-data`, which imports `mock-data` — the cycle `use-catalog` and
 * `use-campaigns` avoid by living apart.
 *
 * What the IC has *acknowledged* is not here. That is a user preference, not a
 * property of the finding — see `command-center/risk-feed` and
 * `command-center/use-risk-alert-rows`.
 */

import { useMemo } from "react";
import { useStatic, type Resource } from "@/hooks/use-api";
import { mockRiskAlerts } from "@/lib/risk-mock-data";
import type { RiskAlert } from "@/types/domain";

/** Every open finding across the book, in authored order. */
export function useRiskAlertsResource(): Resource<RiskAlert[]> {
  return useStatic(mockRiskAlerts);
}

/** One finding. `undefined` once loaded means the id isn't an alert. */
export function useRiskAlert(id: string): Resource<RiskAlert | undefined> {
  const source = useRiskAlertsResource();
  const { data } = source;
  const alert = useMemo(() => data.find((a) => a.id === id), [data, id]);
  return { ...source, data: alert };
}
