"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import {
  getNavHistory,
  type MutualFundDetail as MutualFundDetailData,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import {
  NAV_RANGES,
  NavHistoryChart,
  type NavRange,
} from "@/features/catalog/mutual-fund/components/NavHistoryChart";
import { MF_ASSETS } from "@/features/catalog/mutual-fund/lib/mutual-fund-assets";
import { MutualFundInvestmentPolicyModal } from "@/features/catalog/mutual-fund/components/MutualFundInvestmentPolicyModal";
import { MutualFundSectionEmpty } from "@/features/catalog/mutual-fund/components/mutual-fund-ui";
import { useT } from "@/i18n/I18nProvider";

const CHART_RANGES = NAV_RANGES;

type ChartRange = NavRange;

function ReturnCell({ period, value }: { period: string; value: string }) {
  const isPositive = value.startsWith("+");
  const color = isPositive ? "#008236" : value.startsWith("-") ? "#fb2c36" : "#101828";

  return (
    <div className="flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-neutral-50 p-1.5">
      <span className="text-sm leading-[24px] font-bold" style={{ color }}>
        {value}
      </span>
      <span className="text-center text-xs leading-[20px] text-black">{period}</span>
    </div>
  );
}

function FeeCell({ label, sublabel, value }: { label: string; sublabel: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md bg-neutral-50 p-1.5">
      <span className="text-center text-sm leading-[24px] text-neutral-600">{label}</span>
      <span className="text-center text-micro leading-[18px] text-neutral-600">{sublabel}</span>
      <span className="text-sm leading-[24px] font-bold text-neutral-900">{value}</span>
    </div>
  );
}

function FundInfoRow({ label, value, link }: { label: string; value: ReactNode; link?: boolean }) {
  return (
    <div className="flex w-full border-b border-black/10 last:border-b-0">
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        <span className="text-sm leading-[24px] text-neutral-900">{label}</span>
      </div>
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        {link ? (
          <span className="text-sm leading-[24px] text-brand-600">{value}</span>
        ) : (
          <span className="text-sm leading-[24px] text-neutral-600">{value}</span>
        )}
      </div>
    </div>
  );
}

function ChartRangeSelector({
  active,
  onChange,
}: {
  active: ChartRange;
  onChange: (range: ChartRange) => void;
}) {
  return (
    <div className="flex w-full rounded-full bg-[#f3f3f3] p-1">
      {CHART_RANGES.map((range) => {
        const selected = active === range;
        return (
          <button
            key={range}
            type="button"
            onClick={() => onChange(range)}
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs leading-[20px] font-bold transition-colors ${
              selected
                ? "bg-white text-[#292524] shadow-[0px_4px_8px_0px_rgba(28,25,23,0.03),0px_8px_16px_0px_rgba(28,25,23,0.02)]"
                : "text-black/75"
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}

export function OverviewContent({ fund }: { fund: MutualFundDetailData }) {
  const t = useT();
  const [chartRange, setChartRange] = useState<ChartRange>("YTD");
  const navHistory = getNavHistory(fund.id);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const returnRows = [fund.historicalReturns.slice(0, 3), fund.historicalReturns.slice(3, 6)];

  return (
    <>
      {/* No NAV series, no chart block — an invented line, or a range selector
          with nothing to select over, is worse than an absent one on a page an
          RM quotes from. */}
      {navHistory && (
        <div className="w-full py-5">
          <NavHistoryChart
            points={navHistory.points}
            range={chartRange}
            currency={navHistory.currency}
            className="h-[227px] w-full"
          />
          <div className="mx-auto mt-6 w-full max-w-[768px] lg:px-0">
            <ChartRangeSelector active={chartRange} onChange={setChartRange} />
          </div>
        </div>
      )}

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base leading-[28px] font-bold text-black">
          {t.fund.detail.historicalReturns}
        </h2>
        {fund.historicalReturns.length === 0 ? (
          <MutualFundSectionEmpty title={t.states.empty} />
        ) : (
          <div className="flex flex-col gap-2">
            {returnRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2">
                {row.map((item) => (
                  <ReturnCell key={item.period} period={item.period} value={item.value} />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base leading-[28px] font-bold text-neutral-900">
          {t.fund.detail.investmentPolicy}
        </h2>
        <div className="flex flex-col items-end gap-2.5 rounded-lg border border-black/10 p-3">
          <p className="line-clamp-4 w-full text-sm leading-[24px] text-neutral-900">
            {fund.investmentPolicy}
          </p>
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 text-sm leading-[24px] text-[#2b7fff]"
            onClick={() => setPolicyModalOpen(true)}
          >
            {t.fund.detail.readMore}
          </button>
        </div>
      </section>

      <MutualFundInvestmentPolicyModal
        open={policyModalOpen}
        policy={fund.investmentPolicy}
        onClose={() => setPolicyModalOpen(false)}
      />

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base leading-[28px] font-bold text-neutral-900">
          {t.fund.detail.fees}
        </h2>
        <div className="flex gap-2.5 rounded-lg border border-black/10 p-3">
          <FeeCell
            label={t.fund.detail.feeBuy}
            sublabel={t.fund.detail.frontEndFee}
            value={fund.fees.frontEnd}
          />
          <FeeCell
            label={t.fund.detail.feeSell}
            sublabel={t.fund.detail.frontEndFee}
            value={fund.fees.backEnd}
          />
          <FeeCell
            label={t.fund.detail.feeManagement}
            sublabel={t.fund.detail.frontEndFee}
            value={fund.fees.management}
          />
        </div>
      </section>

      {fund.dividend && (
        <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
          <h2 className="text-base leading-[28px] font-bold text-neutral-900">
            {t.fund.detail.lastDividend}
          </h2>
          <div className="rounded-lg border border-black/10 p-3">
            <div className="flex gap-2.5">
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-center text-xs leading-[20px] text-neutral-600">
                  {t.fund.dividend.bookCloseDate}
                </span>
                <span className="text-sm leading-[24px] font-bold text-neutral-900">
                  {fund.dividend.bookCloseDate}
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-center text-xs leading-[20px] text-neutral-600">
                  {t.fund.detail.lastDividendPaymentDate}
                </span>
                <span className="text-sm leading-[24px] font-bold text-neutral-900">
                  {fund.dividend.paymentDate}
                </span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-center text-xs leading-[20px] text-neutral-600">
                  {t.fund.dividend.perUnit}
                </span>
                <span className="text-sm leading-[24px] font-bold text-neutral-900">
                  {fund.dividend.amountPerUnit}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base leading-[28px] font-bold text-neutral-900">
          {t.fund.detail.fundDetails}
        </h2>
        <div className="overflow-hidden rounded-lg border border-black/10">
          <FundInfoRow
            label={t.fund.detail.info.prospectus}
            link
            value={
              <span className="inline-flex items-center gap-0.5">
                <Image
                  src={MF_ASSETS.filePdfIcon}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0"
                />
                {t.fund.detail.info.viewProspectus}
              </span>
            }
          />
          <FundInfoRow label={t.fund.detail.info.name} value={fund.name} />
          <FundInfoRow
            label={t.fund.detail.info.managementCompany}
            value={fund.fundInfo.managementCompany}
          />
          <FundInfoRow label={t.fund.detail.info.fundType} value={fund.fundInfo.fundType} />
          <FundInfoRow label={t.fund.detail.info.taxBenefit} value={fund.fundInfo.taxBenefit} />
          <FundInfoRow
            label={t.fund.detail.info.foreignInvestment}
            value={fund.fundInfo.foreignInvestment}
          />
          <FundInfoRow label={t.fund.detail.info.fxRisk} value={fund.fundInfo.fxRiskPolicy} />
          <FundInfoRow
            label={t.fund.detail.info.riskScore}
            value={String(fund.fundInfo.riskScore)}
          />
          <FundInfoRow
            label={t.fund.detail.info.dividendPolicy}
            value={fund.fundInfo.dividendPolicy}
          />
          <FundInfoRow
            label={t.fund.detail.info.currencyPolicy}
            value={fund.fundInfo.currencyPolicy}
          />
          <FundInfoRow
            label={t.fund.detail.info.managementFee}
            value={fund.fundInfo.managementFee}
          />
          <FundInfoRow
            label={t.fund.detail.info.minimumInvestment}
            value={fund.fundInfo.minimumInvestment}
          />
          <FundInfoRow
            label={t.fund.detail.info.registrationDate}
            value={fund.fundInfo.registrationDate}
          />
          <FundInfoRow
            label={t.fund.detail.info.netAssetValue}
            value={fund.fundInfo.netAssetValue}
          />
        </div>
      </section>
    </>
  );
}
