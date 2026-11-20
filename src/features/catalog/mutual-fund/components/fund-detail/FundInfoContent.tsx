"use client";

import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { MutualFundSectionEmpty } from "@/features/catalog/mutual-fund/components/mutual-fund-ui";
import { useT } from "@/i18n/I18nProvider";
import { KeyValueBox, SectionTitle } from "./FundDetailPrimitives";

/** Figma 39824:512312 — fee table with fixed value column widths on mobile */
function FeeDetailsTable({ rows }: { rows: { label: string; actual: string; maximum: string }[] }) {
  const t = useT();
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full">
        <div className="flex h-12 min-w-0 flex-1 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-neutral-600">
            {t.fund.detail.feeTable.item}
          </span>
        </div>
        <div className="flex h-12 w-20 shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-neutral-600">
            {t.fund.detail.feeTable.actual}
          </span>
        </div>
        <div className="flex h-12 w-[81px] shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-neutral-600">
            {t.fund.detail.feeTable.maximum}
          </span>
        </div>
      </div>
      {rows.map((row, index) => {
        const striped = index % 2 === 0;
        const bg = striped ? "bg-neutral-50" : "bg-white";
        const isLast = index === rows.length - 1;
        const rowBorder = isLast ? "" : "border-b border-black/10";

        return (
          <div key={row.label} className="flex w-full">
            <div
              className={`flex min-h-12 min-w-0 flex-1 items-center px-4 py-3.5 ${rowBorder} ${bg}`}
            >
              <span className="text-sm leading-[24px] text-neutral-900">{row.label}</span>
            </div>
            <div
              className={`flex min-h-12 w-20 shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}
            >
              <span className="text-sm leading-[24px] text-neutral-900">{row.actual}</span>
            </div>
            <div
              className={`flex min-h-12 w-[81px] shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}
            >
              <span className="text-sm leading-[24px] text-neutral-900">{row.maximum}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FundInfoContent({ fund }: { fund: MutualFundDetailData }) {
  const t = useT();
  const { tradingInfo } = fund;

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>{t.fund.detail.minimumTrade}</SectionTitle>
        <KeyValueBox
          rows={[
            { label: t.fund.detail.minInitialPurchase, value: tradingInfo.minInitialPurchase },
            {
              label: t.fund.detail.minSubsequentPurchase,
              value: tradingInfo.minSubsequentPurchase,
            },
            { label: t.fund.detail.minRedemption, value: tradingInfo.minRedemption },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>{t.fund.detail.tradingHours}</SectionTitle>
        <KeyValueBox
          rows={[
            { label: t.fund.detail.purchaseCutoff, value: tradingInfo.purchaseCutoff },
            { label: t.fund.detail.redemptionCutoff, value: tradingInfo.redemptionCutoff },
            { label: t.fund.detail.settlement, value: tradingInfo.settlementDays },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>{t.fund.detail.fees}</SectionTitle>
        {fund.feeDetails.length === 0 ? (
          <MutualFundSectionEmpty title={t.states.empty} />
        ) : (
          <FeeDetailsTable rows={fund.feeDetails} />
        )}
      </section>
    </>
  );
}
