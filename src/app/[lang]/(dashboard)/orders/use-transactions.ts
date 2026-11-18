"use client";

/**
 * Clients' own trades in one asset class — the Stock, TFEX and Mutual Fund
 * tabs of Order Management.
 *
 * A {@link Resource} over the mock today (`lib/transaction-mock-data`), so the
 * panel already renders its skeleton against `isLoading`; pointing this at the
 * real feed is a change here and nowhere else.
 */

import { useStatic, type Resource } from "@/hooks/use-api";
import { mockTransactions } from "@/lib/transaction-mock-data";
import type { ClientTransaction, TransactionAsset } from "@/types/domain";

export function useTransactions(asset: TransactionAsset): Resource<ClientTransaction[]> {
  return useStatic(mockTransactions[asset]);
}
