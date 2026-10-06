"use client";

/**
 * What a row on Order Management actually is, per tab.
 *
 * The page lists two different things and used to pretend they were one. A
 * product that is still being filled is a **book** — one row, because there is
 * one round open on it and one thing to do about it. A product that has sent
 * orders is a list of **orders**, and folding those back into one row per
 * product meant a book that had sent three rounds showed one card, carrying the
 * newest round's figures under a tag that could belong to any of them. The
 * other two rounds were reachable only from inside the book.
 *
 * Rounds are independent — each order holds its own bookings, its own reference
 * and its own answer — so the sent and finished tabs list orders, and nothing
 * has to be collapsed.
 */

import type { OrderBook, OrderSubmission } from "@/types/domain";
import { roundOfSubmission, submissionRows } from "./order-book";

/** One sent order, with the book it belongs to and the figures it carried. */
export type OrderRow = {
  book: OrderBook;
  submission: OrderSubmission;
  /** 1-based — round 1 is the first order this book sent. */
  round: number;
  amount: number;
  holders: number;
  /**
   * What the row is dated by: the answer for an order that has one, otherwise
   * when it was sent. Both tabs then read newest-first by the event the tab is
   * about — "คำสั่งซื้อเสร็จสิ้น" by when it finished, not by when it went out.
   */
  at: string;
};

/** A row on any tab, with the key its unseen-badge is tracked by. */
export type Entry =
  | { kind: "book"; key: string; book: OrderBook }
  | { kind: "order"; key: string; row: OrderRow };

/** `true` for a book with a round still being filled. */
export const hasOpenRound = (book: OrderBook) =>
  book.status === "collecting" || book.status === "ready";

function orderRow(book: OrderBook, submission: OrderSubmission): OrderRow {
  const { amount, holders } = submissionRows(book, submission);
  return {
    book,
    submission,
    round: roundOfSubmission(book, submission.id),
    amount,
    holders,
    at: submission.settledAt ?? submission.submittedAt,
  };
}

/**
 * The rows one tab shows, newest first.
 *
 * Keys carry the status for order rows, so an order that moves from
 * "คำสั่งซื้อรอผล" to "คำสั่งซื้อเสร็จสิ้น" counts as new on the tab it arrives
 * in — the same rule a book already follows when it changes tab.
 */
export function entriesFor(tabId: string, books: OrderBook[]): Entry[] {
  if (tabId === "open") {
    // Already sorted by latest activity — see `useOrderBooks`.
    return books.filter(hasOpenRound).map((book) => ({
      kind: "book" as const,
      key: `open|${book.productId}|${book.logs[0]?.id ?? ""}`,
      book,
    }));
  }

  const wanted =
    tabId === "sent"
      ? (s: OrderSubmission) => s.status === "processing"
      : (s: OrderSubmission) => s.status !== "processing";

  return books
    .flatMap((book) => book.submissions.filter(wanted).map((s) => orderRow(book, s)))
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((row) => ({
      kind: "order" as const,
      key: `${tabId}|${row.submission.id}|${row.submission.status}`,
      row,
    }));
}

/** The order rows of a list of entries — the two order tabs' payload. */
export const orderRowsOf = (entries: Entry[]): OrderRow[] =>
  entries.flatMap((e) => (e.kind === "order" ? [e.row] : []));

/** The books of a list of entries — the first tab's payload. */
export const booksOf = (entries: Entry[]): OrderBook[] =>
  entries.flatMap((e) => (e.kind === "book" ? [e.book] : []));
