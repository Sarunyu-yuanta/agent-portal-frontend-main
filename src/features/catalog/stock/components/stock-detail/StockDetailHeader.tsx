"use client";

import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ASSETS } from "@/features/catalog/stock/lib/stock-detail-constants";
import type { StockProductDetail } from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useT } from "@/i18n/I18nProvider";
import { MarketStatusTag } from "./MarketStatusTag";

/** Back arrow, symbol, name and market status above the ticker card. */
export function StockDetailHeader({
  detail,
  onBack,
}: {
  detail: StockProductDetail;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <div className="flex items-center gap-2 pt-1 pr-2 pb-2 lg:pt-0">
      <Button
        variant="plain"
        size="icon-sm"
        onClick={onBack}
        aria-label={t.common.back}
        className="size-[30px] shrink-0 rounded-md p-[5px]"
      >
        <ArrowLeftIcon size={18} />
      </Button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-1">
            <p className="shrink-0 text-lg leading-[28px] font-bold text-[rgba(0,0,0,0.8)]">
              {detail.symbol}
            </p>
            {detail.featured ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ASSETS.sparkle} alt="" width={16} height={16} className="shrink-0" />
            ) : null}
            <p className="min-w-0 truncate text-base leading-[24px] text-[rgba(0,0,0,0.75)]">
              {detail.name}
            </p>
          </div>
          <MarketStatusTag status={detail.status} />
        </div>
      </div>
    </div>
  );
}
