"use client";

/**
 * The header bell's order rows — the three moments the IC is waiting on someone
 * else and needs to be told the wait is over:
 *
 * 1. a client has finished the forms they were sent off to fill in,
 * 2. the back office has answered a submitted order,
 * 3. a book has filled up and the order is theirs to send.
 *
 * Nothing *in progress* raises a row. "ส่งคำขอแล้ว" and "กำลังดำเนินการ" are
 * states the IC put the system into themselves, and a bell that announces them
 * is a bell that announces the user's own clicks back at them.
 *
 * ─── Sharing the bell's axis ─────────────────────────────────────────────────
 * Both existing feeds place rows by *days until due* (`notification-zones`).
 * An order event has no due date — it has already happened — so it is placed at
 * the negative of its age: today's events sit at `0`, yesterday's at `-1`. That
 * is exactly what the shell's grouping reads ("วันนี้", "เมื่อวาน", "2 วันก่อน"),
 * so these rows interleave with KYC and reminder rows by recency instead of
 * being a third list stapled on the end.
 */

import { useMemo } from "react";
import {
  CheckCircleIcon,
  IdentificationCardIcon,
  PaperPlaneTiltIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useOrders } from "@/contexts/orders-context";
import type { ZonedNotification } from "../notification-zones";
import { zoneForDays } from "../notification-zones";
import { formatOrderAmount } from "./order-book";
import { useOrderBooks } from "./use-order-books";

/** Whole days since `iso`, counted in calendar days rather than hours. */
function daysSince(iso: string): number {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return 0;
  const now = new Date();
  const start = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - start) / 86_400_000));
}

function iconFor(tone: "green" | "blue" | "red" | "yellow", glyph: React.ReactNode) {
  const fill = {
    green: "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]",
    blue: "bg-[var(--fill-blue-100)] text-[var(--fill-blue-600)]",
    red: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    yellow: "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]",
  }[tone];
  return (
    <span
      role="img"
      aria-label="Order"
      className={`flex size-6 shrink-0 items-center justify-center rounded-full ${fill}`}
    >
      {glyph}
    </span>
  );
}

export function useOrderNotificationFeed() {
  const { requirementRequests } = useOrders();
  const { data: books } = useOrderBooks();

  return useMemo(() => {
    // `onItemClick` hands back only the `NotificationItem`, which has nowhere
    // to carry a destination — so this is the side table the click reads. Same
    // arrangement the KYC feed uses.
    const targets = new Map<string, string>();
    const rows: ZonedNotification[] = [];

    const add = (
      id: string,
      daysAgo: number,
      href: string,
      item: Omit<ZonedNotification["item"], "id">,
    ) => {
      const daysLeft = -daysAgo;
      const zone = zoneForDays(daysLeft);
      // Past the bell's 15-day horizon an event stops being news. It is still
      // in the book's own log, which is where history belongs.
      if (!zone) return;
      rows.push({ zone, daysLeft, item: { ...item, id } });
      targets.set(id, href);
    };

    // ── 1. A client has finished what they were sent ─────────────────────────
    for (const request of requirementRequests) {
      if (request.status !== "completed" || !request.completedAt) continue;
      add(
        `order-req-${request.id}`,
        daysSince(request.completedAt),
        `/orders/${encodeURIComponent(request.productId)}`,
        {
          title: request.clientName,
          // "ตรวจสอบได้" rather than "จองซื้อได้". What came back is the forms
          // that were asked for, and a client can still be blocked by something
          // no form covers — a risk rating below the product's. Promising the
          // booking here would be promising an outcome this row can't see.
          description: `กรอกข้อมูลครบแล้ว ${request.keys.length} รายการ — กลับไปตรวจสอบได้`,
          time: "",
          icon: iconFor("green", <IdentificationCardIcon size={15} weight="fill" />),
        },
      );
    }

    for (const book of books) {
      // ── 2. The back office has answered ───────────────────────────────────
      for (const submission of book.submissions) {
        if (submission.status === "processing" || !submission.settledAt) continue;
        const ok = submission.status === "completed";
        add(
          `order-sub-${submission.id}`,
          daysSince(submission.settledAt),
          `/orders/${encodeURIComponent(book.productId)}`,
          {
            title: ok ? "คำสั่งซื้อสำเร็จ" : "คำสั่งซื้อถูกปฏิเสธ",
            description: `${book.productName} · ${submission.backendRef}`,
            time: "",
            icon: ok
              ? iconFor("green", <CheckCircleIcon size={15} weight="fill" />)
              : iconFor("red", <WarningCircleIcon size={15} weight="fill" />),
          },
        );
      }

      // ── 3. The book is full and the order is the IC's to send ─────────────
      if (book.status !== "ready") continue;
      // The id counts submissions rather than naming the amount: a book that
      // fills, is sent, and fills again is genuinely two announcements, while
      // one extra booking on an already-full book is not — an id carrying the
      // amount would re-ring on every one of those.
      add(
        `order-ready-${book.productId}-r${book.submissions.length}`,
        // A standing state, not an event: it is true now, so it rings today
        // and keeps the "วันนี้" heading until it stops being true.
        0,
        `/orders/${encodeURIComponent(book.productId)}`,
        {
          title: `${book.productName} ครบยอดแล้ว`,
          description: `จองครบ ${formatOrderAmount(book.bookedAmount, book.currency)} — ส่งคำสั่งซื้อได้`,
          time: "",
          icon: iconFor("blue", <PaperPlaneTiltIcon size={15} weight="fill" />),
        },
      );
    }

    return { orderNotificationRows: rows, orderNotificationTargets: targets };
  }, [requirementRequests, books]);
}
