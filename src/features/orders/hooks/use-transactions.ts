"use client";

/**
 * Clients' own trades in one asset class — the Stock, TFEX and Mutual Fund
 * tabs of Order Management.
 *
 * Pointing this at the real feed is adding `http` to `transactionsEndpoint`.
 */

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { ClientTransaction, TransactionAsset } from "@/types/transaction";
import { transactionsEndpoint } from "@/features/orders/api/transactions.api";

const NONE: ClientTransaction[] = [];

export function useTransactions(asset: TransactionAsset): Resource<ClientTransaction[]> {
  return useEndpoint(transactionsEndpoint, [asset], { fallback: NONE });
}
