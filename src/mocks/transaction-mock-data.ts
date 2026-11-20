/**
 * Mock client transactions for Order Management's Stock, TFEX and Mutual Fund
 * tabs.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * There is no transaction feed in the app yet. These rows are generated from
 * the catalogue's own products and the mock clients, so every symbol and name
 * on screen is one the rest of the app knows. Generation is deterministic — a
 * fixed-seed sequence, timestamps stamped like the order seeds
 * (`stampFromDaysAgo`) — so the server render and the browser agree.
 *
 * Replace `useTransactions` (`app/(dashboard)/orders/use-transactions.ts`)
 * with the real endpoint; nothing reads this file directly.
 */

import { mockClients } from "./mock-data";
import { stampFromDaysAgo } from "./order-mock-data";
import { STOCK_TOP_PICK } from "@/features/catalog/stock/lib/stock-data";
import { getSectorStockBatch } from "@/features/catalog/stock/lib/stock-industry-sector-data";
import { getTopPerformers } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import type {
  ClientTransaction,
  TransactionAsset,
  TransactionSide,
  TransactionStatus,
} from "@/types/transaction";
import { TRANSACTION_CHANNELS } from "@/features/orders/lib/transaction-channels";

const ROWS_PER_ASSET = 40;
const DAYS_BACK = 14;

/** A small fixed-seed generator — the same rows on every render and machine. */
function sequence(seed: number) {
  let state = seed;
  const next = () => {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    return state / 2_147_483_648;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]) => items[Math.floor(next() * items.length)],
  };
}

const parse = (text: string) => Number.parseFloat(text.replace(/[^0-9.]/g, "")) || 0;

/** Mostly done; now and then still working, partly filled or withdrawn. */
function statusFrom(roll: number, daysAgo: number, canPartial: boolean): TransactionStatus {
  if (daysAgo === 0 && roll < 0.25) return "pending";
  if (canPartial && roll < 0.35) return "partial";
  if (roll > 0.93) return "cancelled";
  return "matched";
}

type Instrument = { symbol: string; name: string; price: number; currency: string };

const STOCKS: Instrument[] = [...STOCK_TOP_PICK, ...getSectorStockBatch(0, 10)].map((s) => ({
  symbol: s.symbol,
  name: s.name,
  price: parse(s.price),
  currency: "THB",
}));

/** Contract multipliers, so a contract's value reads like the real thing. */
const TFEX: (Instrument & { multiplier: number })[] = [
  {
    symbol: "S50H26",
    name: "SET50 Index Futures (Mar 2026)",
    price: 905.4,
    currency: "THB",
    multiplier: 200,
  },
  {
    symbol: "S50M26",
    name: "SET50 Index Futures (Jun 2026)",
    price: 908.1,
    currency: "THB",
    multiplier: 200,
  },
  {
    symbol: "USDH26",
    name: "USD Futures (Mar 2026)",
    price: 36.52,
    currency: "THB",
    multiplier: 1_000,
  },
  {
    symbol: "GO10H26",
    name: "Gold Online Futures (Mar 2026)",
    price: 2_712.5,
    currency: "THB",
    multiplier: 10,
  },
];

const FUNDS: Instrument[] = getTopPerformers("global-equity").map((f) => ({
  symbol: f.symbol,
  name: f.name,
  price: parse(f.price) || 10,
  currency: f.currency || "THB",
}));

function generate(asset: TransactionAsset, seed: number): ClientTransaction[] {
  const rnd = sequence(seed);
  const channels = TRANSACTION_CHANNELS[asset];
  const rows: ClientTransaction[] = [];

  for (let i = 0; i < ROWS_PER_ASSET; i++) {
    const id = `tx-${asset}-${String(i + 1).padStart(3, "0")}`;
    const client = rnd.pick(mockClients);
    const daysAgo = Math.floor((i / ROWS_PER_ASSET) * DAYS_BACK);
    const roll = rnd.next();

    let instrument: Instrument;
    let side: TransactionSide;
    let quantity: number;
    let amount: number;

    if (asset === "stock") {
      instrument = rnd.pick(STOCKS);
      side = rnd.next() < 0.55 ? "buy" : "sell";
      quantity = rnd.int(1, 50) * 100;
      amount = quantity * instrument.price;
    } else if (asset === "tfex") {
      const contract = rnd.pick(TFEX);
      instrument = contract;
      side = rnd.next() < 0.5 ? "buy" : "sell";
      quantity = rnd.int(1, 20);
      amount = quantity * contract.price * contract.multiplier;
    } else {
      instrument = rnd.pick(FUNDS);
      const sideRoll = rnd.next();
      side = sideRoll < 0.6 ? "buy" : sideRoll < 0.88 ? "sell" : "switch";
      amount = rnd.int(1, 100) * 5_000;
      quantity = Math.round((amount / instrument.price) * 10_000) / 10_000;
    }

    rows.push({
      id,
      at: stampFromDaysAgo(daysAgo, id),
      clientId: client.id,
      clientName: client.name,
      asset,
      symbol: instrument.symbol,
      name: instrument.name,
      side,
      quantity,
      price: instrument.price,
      amount,
      currency: instrument.currency,
      channel: rnd.pick(channels),
      status: statusFrom(roll, daysAgo, asset !== "mutual-fund"),
    });
  }

  // Newest first, the order every list in Order Management reads in.
  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

export const mockTransactions: Record<TransactionAsset, ClientTransaction[]> = {
  stock: generate("stock", 11),
  tfex: generate("tfex", 23),
  "mutual-fund": generate("mutual-fund", 37),
};
