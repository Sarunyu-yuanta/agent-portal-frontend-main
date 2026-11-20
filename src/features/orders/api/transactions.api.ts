import { defineEndpoint } from "@/lib/api/endpoint";
import { mockTransactions } from "@/mocks/transaction-mock-data";
import type { TransactionAsset } from "@/types/transaction";

/** Clients' own trades in one asset class. */
export const transactionsEndpoint = defineEndpoint("transactions", {
  mock: (asset: TransactionAsset) => mockTransactions[asset],
});
