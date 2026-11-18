"use client";

/**
 * How full a deal is, on a product's Detail tab: one bar in three parts — the
 * signed-in IC's bookings, every other IC's (as a sum, never whose), and what
 * is left.
 *
 * The Order tab lists only this IC's clients (see `ProductOrderSection`), so
 * without this a deal filling up on other ICs' bookings would look full for
 * no visible reason. This answers "how did it get this full?" without naming
 * anyone.
 *
 * "ยอดจองทั้งดีล" on a basket; on a bond it is the issue's quota being drawn
 * down — "โควตาที่ใช้ไป", the same split.
 */

import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { IC_NAME } from "@/lib/current-ic";
import { useOrderBook } from "./use-order-books";

const money = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

export function DealProgress({ productId }: { productId: string }) {
  const { data: book } = useOrderBook(productId);
  if (!ORDER_BOOKING_ENABLED || !book) return null;

  const mine = book.bookings
    .filter((b) => b.createdBy === IC_NAME)
    .reduce((sum, b) => sum + b.amount, 0);
  const used =
    book.mode === "basket"
      ? book.bookings.reduce((sum, b) => sum + b.amount, 0)
      : book.quotaUsed;
  const others = Math.max(0, used - mine);
  const target = book.targetAmount;
  const remaining = Math.max(0, target - used);
  // Overbooked deals clamp the bar to full; the figures still say by how much.
  const scale = Math.max(target, used, 1);
  const pct = (n: number) => `${(n / scale) * 100}%`;
  const label = book.mode === "basket" ? "ยอดจองทั้งดีล" : "โควตาที่ใช้ไป";

  return (
    <div className="flex w-full flex-col gap-3 rounded-xl border border-black/10 bg-white px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs uppercase leading-[20px] tracking-wide text-[#6a7282]">{label}</span>
        <span className="text-lg font-bold leading-[28px] tabular-nums text-[#101828]">
          {money(used)} / {money(target)}{" "}
          <span className="text-sm font-normal text-[#6a7282]">{book.currency}</span>
        </span>
      </div>
      <div
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-[var(--fill-gray-100)]"
        role="img"
        aria-label={`${label}: ของฉัน ${money(mine)}, IC อื่น ${money(others)}, คงเหลือ ${money(remaining)} จาก ${money(target)} ${book.currency}`}
      >
        <div className="h-full bg-primary-action" style={{ width: pct(mine) }} />
        <div className="h-full bg-[var(--fill-emerald-400)]" style={{ width: pct(others) }} />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs leading-[20px] text-[#6a7282]">
        <Legend swatch="bg-primary-action" label="ของฉัน" value={money(mine)} />
        <Legend swatch="bg-[var(--fill-emerald-400)]" label="IC อื่น" value={money(others)} />
        <Legend
          swatch="border border-[var(--fill-gray-300)] bg-[var(--fill-gray-100)]"
          label="คงเหลือ"
          value={money(remaining)}
        />
      </div>
    </div>
  );
}

function Legend({ swatch, label, value }: { swatch: string; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2.5 rounded-sm ${swatch}`} />
      {label}
      <span className="font-semibold tabular-nums text-[#101828]">{value}</span>
    </span>
  );
}
