"use client";

import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { AllocationDonut } from "@/components/charts/AllocationDonut";
import { useT } from "@/i18n/I18nProvider";
import { SectionTitle } from "./FundDetailPrimitives";

function AllocationSection({
  title,
  slices,
}: {
  title: string;
  slices: { label: string; percent: number; color?: string }[];
}) {
  const t = useT();
  if (slices.length === 0) {
    return (
      <section className="flex w-full flex-col gap-3 bg-white py-4 lg:bg-transparent">
        <SectionTitle className="lg:px-0">{title}</SectionTitle>
        <p className="text-sm leading-[24px] text-neutral-500 lg:px-0">{t.common.noData}</p>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-3 bg-white py-4 lg:bg-transparent">
      <SectionTitle className="lg:px-0">{title}</SectionTitle>
      <div className="flex flex-col items-center gap-3 py-3">
        <AllocationDonut slices={slices} size={180} />
        <div className="flex w-full flex-col">
          {slices.map((item, index) => (
            <div key={item.label}>
              <div className="flex items-center gap-2 px-6 py-2 lg:px-6">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: item.color ?? ["#074EA4", "#51A2FF", "#A3B3FF"][index % 3],
                  }}
                />
                <span className="flex-1 text-sm leading-[24px] text-neutral-600">{item.label}</span>
                <span className="text-sm leading-[24px] font-bold whitespace-nowrap text-neutral-900">
                  {item.percent}%
                </span>
              </div>
              {index < slices.length - 1 && <div className="mx-6 h-px bg-black/10 lg:mx-6" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AllocationContent({ fund }: { fund: MutualFundDetailData }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2.5 bg-neutral-50 lg:bg-transparent">
      <AllocationSection title={t.fund.detail.topHoldings} slices={fund.topHoldings} />
      <AllocationSection title={t.fund.detail.assetAllocation} slices={fund.assetAllocation} />
    </div>
  );
}
