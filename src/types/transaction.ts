// ── Client transactions ──────────────────────────────────────────────────────
//
// Listed products a client trades themselves — stock, TFEX, mutual funds.
// Nothing is booked for these; Order Management lists the trades as they came
// through each platform.

export type TransactionAsset = "stock" | "tfex" | "mutual-fund";

/** `switch` is a mutual fund's สับเปลี่ยน; stock and TFEX only buy and sell. */
export type TransactionSide = "buy" | "sell" | "switch";

export type TransactionStatus = "matched" | "partial" | "pending" | "cancelled";

export type ClientTransaction = {
  id: string;
  /** ISO timestamp the order was placed. */
  at: string;
  clientId: string;
  clientName: string;
  asset: TransactionAsset;
  symbol: string;
  name: string;
  side: TransactionSide;
  /** Shares, contracts or fund units. */
  quantity: number;
  /** Per share / point / NAV, in `currency`. */
  price: number;
  /** What the trade is worth, in `currency` — for TFEX, the contract value. */
  amount: number;
  currency: string;
  /** The platform the client placed it through. */
  channel: string;
  status: TransactionStatus;
};
