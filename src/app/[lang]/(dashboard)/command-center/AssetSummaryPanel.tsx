"use client";

import { useMemo } from "react";
import { ALLOCATION_SLICES } from "@/components/AssetSummarySection";
import { ALLOCATION_COLORS, AllocationDonut, AllocationTiles } from "@/components/allocation-donut";
import { buildProductRows, getClientTotals } from "../client-hub/client-hub-data";
import { formatAumThb } from "@/lib/client-utils";
import { useCountUp } from "@/hooks/use-count-up";
import type { Client } from "@/types/domain";

/**
 * What the desk's book is made of.
 *
 * Deliberately the only money on this page, and deliberately the last thing on
 * it. "How is the quarter going" is not the question being asked at eight in
 * the morning, and Client 360 owns the answer — but a dashboard that never says
 * what it is managing is missing its subject, so the book gets one card you
 * scroll to rather than a strip you open onto.
 *
 * Idle cash is not here even though it is one line away in `getClientTotals`.
 * It is ฿328M — 12.4% of the book — while the donut's `เงินสด` slice reads 34%,
 * because they are different things: money waiting to be deployed versus the
 * cash sleeve of an allocation model. Two cash figures 200px apart, differing
 * threefold, is a credibility problem no caption can talk its way out of.
 * Client 360's "Cash Under Advice" card owns that number.
 */
export function AssetSummaryPanel({ clients }: { clients: Client[] }) {
  const { totalAum, rows, slices } = useMemo(() => {
    const productRows = buildProductRows(clients);
    const total = productRows.reduce((sum, r) => sum + r.totalAmountThb, 0);

    return {
      totalAum: getClientTotals(clients).totalAum,
      rows: productRows,
      /**
       * THB share, not `avgAllocationPct`.
       *
       * That field is the unweighted mean of each holder's percentage, so a
       * ฿75M client would move the book's mix exactly as far as the ฿890M one.
       * Dividing the absolute totals by their own sum is AUM-weighted by
       * construction — every holder's slice was already applied to their own
       * AUM in `buildProductRows`.
       */
      slices: productRows.map((r) => ({
        label: r.label,
        percent: total > 0 ? Math.round((r.totalAmountThb / total) * 1000) / 10 : 0,
        /**
         * Keyed on the asset class, not on position.
         *
         * `AllocationDonut` hands out `ALLOCATION_COLORS` by index, and these
         * rows are sorted by THB — so `ตราสารหนี้` would be whatever colour its
         * rank happened to be that day, and a different one on the client page.
         * Looking the label up in `ALLOCATION_SLICES` pins each class to the
         * colour it wears everywhere else.
         */
        color:
          ALLOCATION_COLORS[
            Math.max(0, ALLOCATION_SLICES.findIndex((s) => s.label === r.label)) %
              ALLOCATION_COLORS.length
          ],
      })),
    };
  }, [clients]);

  const animatedAum = useCountUp(totalAum);

  return (
    <div className="flex flex-col gap-4">
      {/* Ring and total on one line, ring first: the donut is the shape of the
          answer and the figure is its size, and putting the number beside it
          rather than above keeps the card short. */}
      <div className="flex items-center gap-4">
        <AllocationDonut slices={slices} size={116} />
        <div className="min-w-0 flex flex-col gap-1">
          <p className="text-[28px] font-bold leading-none tabular-nums text-foreground">
            {formatAumThb(animatedAum)}
          </p>
          <p className="text-label leading-tight text-muted-foreground">
            จาก {clients.length} ลูกค้า · {rows.length} ประเภทสินทรัพย์
          </p>
        </div>
      </div>

      <AllocationTiles slices={slices} />
    </div>
  );
}
