"use client";

import {
  MARKET_STATUS_STYLE,
  type MarketStatusValue,
} from "@/features/catalog/stock/lib/stock-data";
import { ASSETS } from "@/features/catalog/stock/lib/stock-detail-constants";
import { useT } from "@/i18n/I18nProvider";

export function MarketStatusTag({ status }: { status: MarketStatusValue }) {
  const t = useT();
  const s = MARKET_STATUS_STYLE[status];
  const isOpen = status === "Open";
  return (
    <span
      className="inline-flex w-fit items-center gap-1 overflow-hidden rounded px-2 py-1 text-xs leading-[20px]"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {isOpen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ASSETS.statusOpen} alt="" width={12} height={12} className="shrink-0" />
      ) : (
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: s.dot }}
          aria-hidden
        />
      )}
      {t.stock.marketStatus[status] ?? status}
    </span>
  );
}
