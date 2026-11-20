import type { TransactionAsset } from "@/types/transaction";

/** The platforms a client can trade each asset through. */
export const TRANSACTION_CHANNELS: Record<TransactionAsset, string[]> = {
  stock: ["Yuanta Pro", "Streaming", "Click2Win", "Mobile App", "Agent Portal"],
  tfex: ["Yuanta Pro", "Streaming", "Agent Portal"],
  "mutual-fund": ["Yuanta Fund Online", "Mobile App", "Agent Portal"],
};
