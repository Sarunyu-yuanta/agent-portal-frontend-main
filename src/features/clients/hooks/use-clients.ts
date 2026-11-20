"use client";

import { useCallback } from "react";
import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { AccountIdentity, Client, ClientDetail, ClientProfile } from "@/types/client";
import type { CallLogEntry } from "@/types/call-log";
import type { KycRecord } from "@/types/compliance";
import type {
  AssetAccountDetail,
  AssetAccountItem,
  LiabilitiesDetail,
  SubProduct,
} from "@/types/portfolio";
import {
  accountIdentitiesEndpoint,
  assetClassProductsEndpoint,
  clientAssetAccountsEndpoint,
  clientCallLogsEndpoint,
  clientDetailsEndpoint,
  clientProfileEndpoint,
  clientsEndpoint,
  holdingDetailEndpoint,
  kycRecordsEndpoint,
  liabilitiesEndpoint,
} from "@/features/clients/api/clients.api";

const NO_CLIENTS: Client[] = [];
const NO_DETAILS: Record<string, ClientDetail> = {};
const NO_KYC: KycRecord[] = [];
const NO_IDENTITIES: Record<string, AccountIdentity> = {};
const NO_CALLS: CallLogEntry[] = [];
const NO_ACCOUNTS: AssetAccountItem[] = [];
const NO_PRODUCTS: SubProduct[] = [];
const UNKNOWN_IDENTITY: AccountIdentity = { accountNo: "—", nameTh: "—" };

/** The client list, plus whether it is still loading. */
export function useClientsResource(): Resource<Client[]> {
  return useEndpoint(clientsEndpoint, [], { fallback: NO_CLIENTS });
}

/** Just the client list — use {@link useClientsResource} when you also need `isLoading`. */
export function useClients(): Client[] {
  return useClientsResource().data;
}

/** Client 360 detail records, keyed by client id. */
export function useClientDetails(): Resource<Record<string, ClientDetail>> {
  return useEndpoint(clientDetailsEndpoint, [], { fallback: NO_DETAILS });
}

export function useKycRecords(): Resource<KycRecord[]> {
  return useEndpoint(kycRecordsEndpoint, [], { fallback: NO_KYC });
}

/** KYC tab: the client's profile. `undefined` once loaded means none on file. */
export function useClientProfile(clientId: string): Resource<ClientProfile | undefined> {
  return useEndpoint(clientProfileEndpoint, [clientId], { fallback: undefined });
}

/**
 * Looks up the account number and Thai name printed beside a booking.
 * Returns "—" for both while loading or when the client is unknown.
 */
export function useAccountIdentity(): (clientId: string) => AccountIdentity {
  const { data } = useEndpoint(accountIdentitiesEndpoint, [], { fallback: NO_IDENTITIES });
  return useCallback((clientId: string) => data[clientId] ?? UNKNOWN_IDENTITY, [data]);
}

/** Call Log tab: the client's calls. */
export function useClientCallLogs(clientId: string): Resource<CallLogEntry[]> {
  return useEndpoint(clientCallLogsEndpoint, [clientId], { fallback: NO_CALLS });
}

/** Assets tab: the client's accounts. */
export function useClientAssetAccounts(clientId: string): Resource<AssetAccountItem[]> {
  return useEndpoint(clientAssetAccountsEndpoint, [clientId], { fallback: NO_ACCOUNTS });
}

/**
 * Holdings behind one account or product row. Pass `null` for no selection.
 */
export function useHoldingDetail(
  viewMode: "account" | "product",
  item: Pick<AssetAccountItem, "accountNo" | "name"> | null,
): AssetAccountDetail | null {
  const key = item ? (viewMode === "account" ? item.accountNo : item.name) : "";
  const { data } = useEndpoint(holdingDetailEndpoint, [viewMode, key], {
    fallback: null,
    enabled: item !== null,
  });
  return item ? data : null;
}

export function useLiabilities(totalAmount: string, lastUpdated: string): LiabilitiesDetail | null {
  return useEndpoint(liabilitiesEndpoint, [totalAmount, lastUpdated], { fallback: null }).data;
}

/** Products inside one asset class (Client Hub product drawer). */
export function useAssetClassProducts(assetClassLabel: string): Resource<SubProduct[]> {
  return useEndpoint(assetClassProductsEndpoint, [assetClassLabel], { fallback: NO_PRODUCTS });
}
