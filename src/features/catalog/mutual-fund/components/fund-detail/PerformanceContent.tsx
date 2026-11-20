"use client";

import { useState } from "react";
import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import {
  DividendHistoryPreview,
  MutualFundDividendHistoryModal,
} from "@/features/catalog/mutual-fund/components/MutualFundDividendHistoryModal";
import { NoDividendIllustration } from "@/features/catalog/mutual-fund/components/NoDividendIllustration";
import { MutualFundSectionEmpty } from "@/features/catalog/mutual-fund/components/mutual-fund-ui";
import { useT } from "@/i18n/I18nProvider";
import { DataTableCell, DataTableHeader, SectionTitle } from "./FundDetailPrimitives";

export function PerformanceContent({ fund }: { fund: MutualFundDetailData }) {
  const t = useT();
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>{t.fund.detail.historicalReturns}</SectionTitle>
        {fund.performanceReturns.length === 0 ? (
          <MutualFundSectionEmpty title={t.states.empty} />
        ) : (
          <div className="overflow-x-auto md:overflow-visible">
            <div className="min-w-[520px] overflow-hidden rounded-lg border border-black/10 md:min-w-0">
              <DataTableHeader
                columns={[
                  { label: t.fund.detail.returnsTable.period },
                  { label: t.fund.detail.returnsTable.return },
                  { label: t.fund.detail.returnsTable.volatility },
                  { label: t.fund.detail.returnsTable.maxDrawdown },
                ]}
              />
              {fund.performanceReturns.map((row, index) => (
                <div key={row.period} className="flex w-full">
                  <DataTableCell value={row.period} striped={index % 2 === 0} />
                  <DataTableCell value={row.return} striped={index % 2 === 0} />
                  <DataTableCell value={row.volatility} striped={index % 2 === 0} />
                  <DataTableCell value={row.maxDrawdown} striped={index % 2 === 0} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Figma 360:64004 — the section always shows; a fund that pays nothing
          gets the empty state (360:64499) instead of losing the section. */}
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>{t.fund.dividend.historyTitle}</SectionTitle>
        {fund.dividendHistory.length > 0 ? (
          <DividendHistoryPreview
            rows={fund.dividendHistory}
            onViewAll={() => setDividendModalOpen(true)}
          />
        ) : (
          <div className="flex w-full items-center gap-[15px]">
            <NoDividendIllustration />
            <p className="text-center text-sm leading-[24px] text-neutral-600">
              {t.fund.dividend.none}
            </p>
          </div>
        )}
      </section>

      <MutualFundDividendHistoryModal
        open={dividendModalOpen}
        rows={fund.dividendHistory}
        onClose={() => setDividendModalOpen(false)}
      />
    </>
  );
}
