"use client";

/**
 * The read side of Promotions & Events.
 *
 * Same seam as `@/hooks/use-api` and `@/hooks/use-catalog`: the fixtures ship
 * in the bundle, so these hand them back through {@link useStatic}, and the
 * list page already renders its skeleton against the `isLoading` that comes
 * out. Giving campaigns a real endpoint is a change in this file.
 *
 * The *write* side — who has been sent what, who is registered — is
 * `@/contexts/campaigns-context`, for the reason `OrdersProvider` exists: a
 * share sent from a detail page has to move the KPI strip on the list without
 * either screen remounting.
 */

import { useMemo } from "react";
import { useStatic, type Resource } from "@/hooks/use-api";
import { mockCampaigns } from "@/mocks/campaign-mock-data";
import type { Campaign } from "@/types/campaign";

/** Every campaign, promotions and events alike, in authored order. */
export function useCampaigns(): Resource<Campaign[]> {
  return useStatic(mockCampaigns);
}

/** One campaign. `undefined` once loaded means the id isn't a campaign. */
export function useCampaign(id: string): Resource<Campaign | undefined> {
  const source = useCampaigns();
  const { data } = source;
  const campaign = useMemo(() => data.find((c) => c.id === id), [data, id]);
  return { ...source, data: campaign };
}
