/**
 * Client-domain reads: the IC's book, per-client profile and history, and the
 * holdings behind the asset views. See docs/api-by-page.md for the target
 * endpoints and their refresh tiers.
 */

import { defineEndpoint } from "@/lib/api/endpoint";
import { mockClientDetails, mockClients, mockKYCData } from "@/mocks/mock-data";
import { getAccountIdentities, getClientProfile } from "@/mocks/client-profiles";
import { getCallLogs } from "@/mocks/call-log-data";
import {
  DEFAULT_ASSET_ACCOUNTS,
  getAssetAccountDetail,
  getAssetProductDetail,
} from "@/mocks/asset-account-details";
import { getLiabilitiesDetail } from "@/mocks/liabilities-details";
import { PRODUCT_SUB_DATA } from "@/mocks/product-sub-data";

/** The IC's client list. */
export const clientsEndpoint = defineEndpoint("clients", {
  mock: () => mockClients,
});

/** Client 360 detail records, keyed by client id. */
export const clientDetailsEndpoint = defineEndpoint("client-details", {
  mock: () => mockClientDetails,
});

/** KYC record for every client of the IC. */
export const kycRecordsEndpoint = defineEndpoint("kyc-records", {
  mock: () => mockKYCData,
});

/** One client's profile; `undefined` when none is on file. */
export const clientProfileEndpoint = defineEndpoint("client-profile", {
  mock: (clientId: string) => getClientProfile(clientId),
});

/**
 * Account number and Thai name for every client whose bookings this IC can
 * see — including other desks' clients that share a basket.
 */
export const accountIdentitiesEndpoint = defineEndpoint("account-identities", {
  mock: () => getAccountIdentities(),
});

export const clientCallLogsEndpoint = defineEndpoint("client-call-logs", {
  mock: (clientId: string) => getCallLogs(clientId),
});

/** One shared mock list today; per client once the API exists. */
export const clientAssetAccountsEndpoint = defineEndpoint("client-asset-accounts", {
  mock: (_clientId: string) => DEFAULT_ASSET_ACCOUNTS,
});

/** Holdings behind one account (`account` view) or one product (`product` view). */
export const holdingDetailEndpoint = defineEndpoint("holding-detail", {
  mock: (viewMode: "account" | "product", key: string) =>
    viewMode === "account" ? getAssetAccountDetail(key) : getAssetProductDetail(key),
});

/** Liabilities breakdown. The mock scales a template to the total it is given. */
export const liabilitiesEndpoint = defineEndpoint("liabilities", {
  mock: (totalAmount: string, lastUpdated: string) =>
    getLiabilitiesDetail(totalAmount, lastUpdated),
});

/** Products inside one asset class, aggregated across the IC's clients. */
export const assetClassProductsEndpoint = defineEndpoint("asset-class-products", {
  mock: (assetClassLabel: string) => PRODUCT_SUB_DATA[assetClassLabel] ?? [],
});
