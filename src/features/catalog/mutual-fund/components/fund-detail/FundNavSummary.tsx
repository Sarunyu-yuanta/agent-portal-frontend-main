"use client";

import Image from "next/image";
import { ClockIcon } from "@phosphor-icons/react";
import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { MF_ASSETS } from "@/features/catalog/mutual-fund/lib/mutual-fund-assets";
import { CreditCardTag, FxRiskTag, RiskTag } from "./FundTags";

/** NAV, daily change, NAV date and the risk / FX / credit-card tags under the fund title. */
export function FundNavSummary({ fund }: { fund: MutualFundDetailData }) {
  const isPositive = fund.changePct.startsWith("+");

  return (
    <div className="flex flex-col gap-2.5 pb-3">
      <div className="flex items-end gap-1">
        <Image
          src={MF_ASSETS.navPriceIcon}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0"
        />
        <span className="text-[32px] leading-[48px] font-bold text-neutral-900">{fund.nav}</span>
        <span className="text-sm leading-[24px] text-neutral-500">{fund.currency}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs leading-[20px] ${
            isPositive ? "bg-[#dbfce7] text-[#008236]" : "bg-[#fee2e2] text-[#fb2c36]"
          }`}
        >
          {fund.changePct}
        </span>
        <span className="inline-flex items-center gap-1 text-micro leading-[18px] text-[#666]">
          <ClockIcon size={16} />
          {fund.navDate}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        <RiskTag risk={fund.risk} />
        <FxRiskTag label={fund.fxRisk} />
        {fund.acceptsCreditCard && <CreditCardTag />}
      </div>
    </div>
  );
}
