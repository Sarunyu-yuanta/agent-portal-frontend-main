"use client";

import Link from "next/link";
import { CaretRightIcon } from "@phosphor-icons/react";
import { PlaybookCardCompact } from "../insights/PlaybookCardCompact";
import type { SpotlightProduct } from "./dashboard-data";
import type { mockHouseViewStrategies } from "@/lib/mock-data";

/**
 * The house view an RM has to be able to talk about today, and the catalog
 * entries it points at.
 *
 * The join is the whole reason the block is here. Insights has held an
 * `assetClass` per strategy and `getRelatedProducts` has mapped it to real
 * products since the insight detail page was built — but the two live in
 * different sections, so reading the view and finding something to do about it
 * has always been two journeys. On the Dashboard they are one card.
 *
 * The playbook itself is `PlaybookCardCompact`, the same component the Insights
 * sidebar uses, rather than a Dashboard-shaped copy of it: the strategy should
 * look identical in both places, and it is one edit away from staying that way.
 */
export function HouseViewSpotlight({
  strategy,
  products,
}: {
  strategy: (typeof mockHouseViewStrategies)[number];
  products: SpotlightProduct[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <PlaybookCardCompact strategy={strategy} />

      {products.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            สินค้าที่มุมมองนี้ชี้ไป
          </p>
          {products.map((product) => (
            <Link
              key={product.id}
              href={product.href}
              className="flex items-center gap-2 rounded-lg px-2 py-2 no-underline transition-colors hover:bg-muted/60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">
                  {product.name}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{product.sub}</p>
              </div>
              <CaretRightIcon
                size={14}
                weight="bold"
                className="shrink-0 text-[var(--text-default-placeholder)]"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
