/**
 * Ids for products that are offered but never booked — stocks and mutual
 * funds. A Proposal on one is logged under one of these, and Order
 * Management's Stock and Mutual Fund tabs read them back.
 *
 * Prefixed so an offered product's id can never collide with a bookable one's
 * (see `bookable-products`), and one place mints and reads them so the pages
 * that send and the tabs that list cannot drift apart.
 */

import type { TransactionAsset } from "@/types/domain";

/** The assets a Proposal can be sent for without a booking. TFEX has none. */
export type OfferedAsset = Extract<TransactionAsset, "stock" | "mutual-fund">;

const PREFIX: Record<OfferedAsset, string> = {
  stock: "stock-",
  "mutual-fund": "fund-",
};

export function offeredProductId(asset: OfferedAsset, symbol: string): string {
  return `${PREFIX[asset]}${symbol}`;
}

/** The symbol behind an offered id of this asset, or `null` if it is not one. */
export function offeredSymbol(asset: TransactionAsset, productId: string): string | null {
  if (asset !== "stock" && asset !== "mutual-fund") return null;
  const prefix = PREFIX[asset];
  return productId.startsWith(prefix) ? productId.slice(prefix.length) : null;
}
