/**
 * Every record Order Management lists, as one kind of row — for the
 * "ทั้งหมด" tab.
 *
 * The seven desk tabs each have their own table because each asset has its own
 * facts: a trade has a side, a price and a platform; a booking has a deal it
 * fills. "ทั้งหมด" keeps only what every record has — when, who, what, how
 * much, where it stands — and adds which asset it is. The rest is one click
 * away, in the record's own receipt.
 *
 * **Status keeps its own words, and is grouped for filtering.** The tag in the
 * row is the record's native status (จับคู่บางส่วน, จองแล้ว …), because that is
 * what the IC acts on. The chips above group them into four buckets that mean
 * the same thing on every desk — see {@link StatusBucket}.
 */

import type {
  Booking,
  ClientTransaction,
  OrderBook,
  ProposalLog,
  TransactionAsset,
  TransactionStatus,
} from "@/types/domain";
import { bookingModeForDesk, deskForId, type Desk } from "./bookable-products";
import { dealStatus } from "./booking-status";
import { bookingPhase, bookingPhaseSteps, ownBookings, type BookingPhase } from "./order-book";
import { openOffersFor } from "./order-proposals";
import { offeredSymbol } from "./offered-products";
import { PROPOSAL_CHANNEL_META } from "./proposal-channels";
import { SIDE_LABEL, STATUS_TAG, formatQuantity } from "./transaction-display";

const UNIT: Record<TransactionAsset, string> = { stock: "หุ้น", tfex: "สัญญา", "mutual-fund": "หน่วย" };

/** The asset column, and the filter on it — the seven tabs, by their own names. */
export type AllAsset = TransactionAsset | "fixed-income" | "thai-structured" | "structured" | "global-bond";

export const ALL_ASSET_LABEL: Record<AllAsset, string> = {
  stock: "Stock",
  tfex: "TFEX",
  "mutual-fund": "Mutual Fund",
  "fixed-income": "Fixed Income",
  "thai-structured": "Thai Structured Product",
  structured: "Global Structured Product",
  "global-bond": "Global Bond",
};

/** In tab order. */
export const ALL_ASSETS: AllAsset[] = [
  "stock",
  "tfex",
  "mutual-fund",
  "fixed-income",
  "thai-structured",
  "structured",
  "global-bond",
];

export const ASSET_OF_DESK: Record<Desk, AllAsset> = {
  "Fixed Income": "fixed-income",
  "Thai Structured": "thai-structured",
  "Global Structured": "structured",
  "Global Bond": "global-bond",
};

/**
 * Where a record stands, in words every desk shares:
 * - `proposed` — offered, nothing placed yet
 * - `processing` — placed and not finished (a pending or part-filled trade; a
 *   booking not yet confirmed by the back office)
 * - `done` — filled / confirmed
 * - `cancelled` — withdrawn or rejected
 */
export type StatusBucket = "proposed" | "processing" | "done" | "cancelled";

export const STATUS_BUCKETS: StatusBucket[] = ["proposed", "processing", "done", "cancelled"];

export const STATUS_BUCKET_LABEL: Record<StatusBucket, string> = {
  proposed: "ส่ง Proposal แล้ว",
  processing: "กำลังดำเนินการ",
  done: "สำเร็จ",
  cancelled: "ยกเลิก",
};

const TRADE_BUCKET: Record<TransactionStatus, StatusBucket> = {
  pending: "processing",
  partial: "processing",
  matched: "done",
  cancelled: "cancelled",
};

const BOOKING_BUCKET: Record<BookingPhase, StatusBucket> = {
  pending: "processing",
  processing: "processing",
  completed: "done",
  cancelled: "cancelled",
};

type Base = {
  id: string;
  at: string;
  asset: AllAsset;
  clientId: string;
  clientName: string;
  /** The product's name as it leads — a symbol, an underlying. */
  title: string;
  /** One line under it. */
  subtitle: string;
  amount: { value: number; currency: string } | null;
  bucket: StatusBucket;
  /**
   * The status in its own desk's terms — what that desk's chips filter on:
   * a `TransactionStatus` for a trade, a `BookingPhase` for a booking,
   * `"offered"` for a Proposal.
   */
  native: string;
};

export type AllRow =
  | (Base & { kind: "trade"; trade: ClientTransaction; status: { text: string; variant: string } })
  | (Base & { kind: "booking"; book: OrderBook; booking: Booking; status: { text: string; variant: string } })
  | (Base & { kind: "offer"; book: OrderBook; offer: ProposalLog })
  | (Base & { kind: "offered"; proposal: ProposalLog; channels: string[] });

export function buildAllRows(input: {
  trades: Record<TransactionAsset, ClientTransaction[]>;
  books: OrderBook[];
  proposals: ProposalLog[];
  icName: string;
}): AllRow[] {
  const { trades, books, proposals, icName } = input;
  const rows: AllRow[] = [];
  const nameOf = new Map<string, string>();

  for (const asset of ["stock", "tfex", "mutual-fund"] as const) {
    for (const t of trades[asset]) {
      nameOf.set(`${asset}:${t.symbol}`, t.name);
      rows.push({
        kind: "trade",
        id: t.id,
        at: t.at,
        asset,
        clientId: t.clientId,
        clientName: t.clientName,
        title: t.symbol,
        subtitle: `${SIDE_LABEL[t.side]} ${formatQuantity(asset, t.quantity)} ${UNIT[asset]}`,
        amount: { value: t.amount, currency: t.currency },
        bucket: TRADE_BUCKET[t.status],
        native: t.status,
        trade: t,
        status: STATUS_TAG[t.status],
      });
    }
  }

  for (const book of books) {
    const asset = ASSET_OF_DESK[deskForId(book.productId)];
    for (const booking of ownBookings(book, icName)) {
      rows.push({
        kind: "booking",
        id: booking.id,
        at: booking.createdAt,
        asset,
        clientId: booking.clientId,
        clientName: booking.clientName,
        title: book.productName,
        subtitle: book.productType,
        amount: { value: booking.amount, currency: book.currency },
        bucket: BOOKING_BUCKET[bookingPhase(booking, book)],
        native: bookingPhase(booking, book),
        book,
        booking,
        status: dealStatus(booking, book),
      });
    }
    for (const offer of openOffersFor(proposals, book, icName)) {
      rows.push({
        kind: "offer",
        id: offer.id,
        at: offer.sentAt,
        asset,
        clientId: offer.clientId,
        clientName: offer.clientName,
        title: book.productName,
        subtitle: book.productType,
        amount: null,
        bucket: "proposed",
        native: "offered",
        book,
        offer,
      });
    }
  }

  for (const p of proposals) {
    if (p.sentBy !== icName) continue;
    for (const asset of ["stock", "mutual-fund"] as const) {
      const symbol = offeredSymbol(asset, p.productId);
      if (!symbol) continue;
      const channels = p.channels.map((c) => PROPOSAL_CHANNEL_META[c].label);
      rows.push({
        kind: "offered",
        id: p.id,
        at: p.sentAt,
        asset,
        clientId: p.clientId,
        clientName: p.clientName,
        title: symbol,
        subtitle: nameOf.get(`${asset}:${symbol}`) ?? `ส่งทาง ${channels.join(", ")}`,
        amount: null,
        bucket: "proposed",
        native: "offered",
        proposal: p,
        channels,
      });
    }
  }

  return rows.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * The status chips for one asset — the same chips that asset's own tab in
 * Order Management shows, so a client's Stock tab and Order Management's Stock
 * tab filter the same way. With no asset, the four shared buckets.
 *
 * Ids are what {@link matchesStatus} compares: a bucket with no asset, the
 * row's `native` status with one.
 */
export function statusChipsFor(asset: AllAsset | null): { id: string; label: string }[] {
  if (!asset) return STATUS_BUCKETS.map((b) => ({ id: b, label: STATUS_BUCKET_LABEL[b] }));
  if (asset === "stock" || asset === "tfex" || asset === "mutual-fund") {
    const statuses: TransactionStatus[] =
      asset === "mutual-fund"
        ? ["pending", "matched", "cancelled"]
        : ["pending", "partial", "matched", "cancelled"];
    return [
      // TFEX is never offered — see `offered-products`.
      ...(asset === "tfex" ? [] : [{ id: "offered", label: STATUS_BUCKET_LABEL.proposed }]),
      ...statuses.map((s) => ({ id: s, label: STATUS_TAG[s].text })),
    ];
  }
  const desk = (Object.keys(ASSET_OF_DESK) as Desk[]).find((d) => ASSET_OF_DESK[d] === asset)!;
  return bookingPhaseSteps(bookingModeForDesk(desk), { offers: true })
    .filter((s) => s.id !== "all")
    .map((s) => ({ id: s.id, label: s.label }));
}

/** Whether a row passes a chip from {@link statusChipsFor} for this asset. */
export function matchesStatus(row: AllRow, asset: AllAsset | null, status: string | null): boolean {
  if (!status) return true;
  return asset ? row.native === status : row.bucket === status;
}
