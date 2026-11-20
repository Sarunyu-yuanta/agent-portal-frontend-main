import { defineEndpoint } from "@/lib/api/endpoint";
import { mockCampaigns } from "@/mocks/campaign-mock-data";

/** Every campaign, promotions and events alike, in authored order. */
export const campaignsEndpoint = defineEndpoint("campaigns", {
  mock: () => mockCampaigns,
});

/**
 * The campaign store's initial state — who has been sent what, who is
 * registered. `CampaignsProvider` mutates it in memory; with a backend these
 * become endpoints and its mutators become requests.
 */
export {
  CAMPAIGN_ACTOR,
  seedCampaignClients,
  seedRsvps,
  seedShareLogs,
} from "@/mocks/campaign-mock-data";
