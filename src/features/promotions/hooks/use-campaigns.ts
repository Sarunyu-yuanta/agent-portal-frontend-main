"use client";

/**
 * The read side of Promotions & Events.
 *
 * The *write* side — who has been sent what, who is registered — is
 * `store/campaigns-context`, so a share sent from a detail page moves the KPI
 * strip on the list without either screen remounting.
 */

import { useMemo } from "react";
import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { Campaign } from "@/types/campaign";
import { campaignsEndpoint } from "@/features/promotions/api/promotions.api";

const NONE: Campaign[] = [];

/** Every campaign, promotions and events alike, in authored order. */
export function useCampaigns(): Resource<Campaign[]> {
  return useEndpoint(campaignsEndpoint, [], { fallback: NONE });
}

/** One campaign. `undefined` once loaded means the id isn't a campaign. */
export function useCampaign(id: string): Resource<Campaign | undefined> {
  const source = useCampaigns();
  const { data } = source;
  const campaign = useMemo(() => data.find((c) => c.id === id), [data, id]);
  return { ...source, data: campaign };
}
