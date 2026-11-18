"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, ClockIcon } from "@phosphor-icons/react";
import {
  getNavHistory,
  type MutualFundDetail as MutualFundDetailData,
} from "./mutual-fund-data";
import { NAV_RANGES, NavHistoryChart, type NavRange } from "@/components/nav-history-chart";
import { MF_ASSETS, mutualFundRiskMeterSrc } from "./mutual-fund-assets";
import { MutualFundInvestmentPolicyModal } from "./MutualFundInvestmentPolicyModal";
import {
  DividendHistoryPreview,
  MutualFundDividendHistoryModal,
} from "./MutualFundDividendHistoryModal";
import { AllocationDonut } from "@/components/allocation-donut";
import { FundTagBadges } from "./MutualFundCard";
import { NoDividendIllustration } from "./NoDividendIllustration";
import { SendProposalButton } from "@/app/(dashboard)/orders/SendProposalButton";
import { offeredProductId } from "@/app/(dashboard)/orders/offered-products";
import { pageZoom } from "@/lib/page-zoom";

const DETAIL_TABS = ["ภาพรวม", "ผลตอบแทน", "สัดส่วนการลงทุน", "ข้อมูลกองทุน"] as const;

const CHART_RANGES = NAV_RANGES;

type DetailTab = (typeof DETAIL_TABS)[number];
type ChartRange = NavRange;

function RiskTag({ risk }: { risk: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(risk)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs font-semibold leading-[20px] text-[#4a5565] whitespace-nowrap">
        risk: {risk}
      </span>
    </span>
  );
}

function FxRiskTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <Image src={MF_ASSETS.coinsIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className="text-xs font-semibold leading-[20px] text-[#4a5565] whitespace-nowrap">{label}</span>
    </span>
  );
}

function CreditCardTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(4)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs font-semibold leading-[20px] text-[#4a5565] whitespace-nowrap">Credit Card</span>
    </span>
  );
}

function ReturnCell({ period, value }: { period: string; value: string }) {
  const isPositive = value.startsWith("+");
  const color = isPositive ? "#008236" : value.startsWith("-") ? "#fb2c36" : "#101828";

  return (
    <div className="flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg bg-[#f9fafb] p-1.5">
      <span className="text-sm font-bold leading-[24px]" style={{ color }}>
        {value}
      </span>
      <span className="text-xs leading-[20px] text-black text-center">{period}</span>
    </div>
  );
}

function FeeCell({
  label,
  sublabel,
  value,
}: {
  label: string;
  sublabel: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-md bg-[#f9fafb] p-1.5">
      <span className="text-sm leading-[24px] text-[#4a5565] text-center">{label}</span>
      <span className="text-micro leading-[18px] text-[#4a5565] text-center">{sublabel}</span>
      <span className="text-sm font-bold leading-[24px] text-[#101828]">{value}</span>
    </div>
  );
}

function FundInfoRow({ label, value, link }: { label: string; value: ReactNode; link?: boolean }) {
  return (
    <div className="flex w-full border-b border-black/10 last:border-b-0">
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        <span className="text-sm leading-[24px] text-[#101828]">{label}</span>
      </div>
      <div className="flex min-h-12 flex-1 items-center px-4 py-3.5">
        {link ? (
          <span className="text-sm leading-[24px] text-[#0a6ee7]">{value}</span>
        ) : (
          <span className="text-sm leading-[24px] text-[#4a5565]">{value}</span>
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
            className={`flex min-h-8 flex-1 items-center justify-center rounded-full px-2 py-1.5 text-xs font-bold leading-[20px] transition-colors ${
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

function OverviewContent({ fund }: { fund: MutualFundDetailData }) {
  const [chartRange, setChartRange] = useState<ChartRange>("YTD");
  const navHistory = getNavHistory(fund.id);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const returnRows = [
    fund.historicalReturns.slice(0, 3),
    fund.historicalReturns.slice(3, 6),
  ];

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
        <h2 className="text-base font-bold leading-[28px] text-black">ผลตอบแทนย้อนหลัง</h2>
        <div className="flex flex-col gap-2">
          {returnRows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2">
              {row.map((item) => (
                <ReturnCell key={item.period} period={item.period} value={item.value} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-[28px] text-[#101828]">นโยบายการลงทุน</h2>
        <div className="flex flex-col items-end gap-2.5 rounded-lg border border-black/10 p-3">
          <p className="w-full text-sm leading-[24px] text-[#101828] line-clamp-4">{fund.investmentPolicy}</p>
          <button
            type="button"
            className="border-none bg-transparent p-0 text-sm leading-[24px] text-[#2b7fff] cursor-pointer"
            onClick={() => setPolicyModalOpen(true)}
          >
            อ่านเพิ่มเติม
          </button>
        </div>
      </section>

      <MutualFundInvestmentPolicyModal
        open={policyModalOpen}
        policy={fund.investmentPolicy}
        onClose={() => setPolicyModalOpen(false)}
      />

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-[28px] text-[#101828]">ค่าธรรมเนียม</h2>
        <div className="flex gap-2.5 rounded-lg border border-black/10 p-3">
          <FeeCell label="ซื้อ" sublabel="(Front-end Fee)" value={fund.fees.frontEnd} />
          <FeeCell label="ขาย" sublabel="(Front-end Fee)" value={fund.fees.backEnd} />
          <FeeCell label="จัดการ" sublabel="(Front-end Fee)" value={fund.fees.management} />
        </div>
      </section>

      {fund.dividend && (
        <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
          <h2 className="text-base font-bold leading-[28px] text-[#101828]">การจ่ายปันผลครั้งล่าสุด</h2>
          <div className="rounded-lg border border-black/10 p-3">
            <div className="flex gap-2.5">
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-[20px] text-[#4a5565] text-center">วันที่ปิดสมุด</span>
                <span className="text-sm font-bold leading-[24px] text-[#101828]">{fund.dividend.bookCloseDate}</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-[20px] text-[#4a5565] text-center">วันที่จ่าย</span>
                <span className="text-sm font-bold leading-[24px] text-[#101828]">{fund.dividend.paymentDate}</span>
              </div>
              <div className="flex flex-1 flex-col items-center gap-0.5 p-1.5">
                <span className="text-xs leading-[20px] text-[#4a5565] text-center">บาท/หน่วย</span>
                <span className="text-sm font-bold leading-[24px] text-[#101828]">{fund.dividend.amountPerUnit}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="flex w-full flex-col gap-4 py-4 lg:px-0">
        <h2 className="text-base font-bold leading-[28px] text-[#101828]">รายละเอียดกองทุน</h2>
        <div className="overflow-hidden rounded-lg border border-black/10">
          <FundInfoRow
            label="หนังสือชี้ชวน"
            link
            value={
              <span className="inline-flex items-center gap-0.5">
                <Image src={MF_ASSETS.filePdfIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
                ดูหนังสือชี้ชวน
              </span>
            }
          />
          <FundInfoRow label="ชื่อกองทุน" value={fund.name} />
          <FundInfoRow label="บลจ." value={fund.fundInfo.managementCompany} />
          <FundInfoRow label="ประเภทกอง" value={fund.fundInfo.fundType} />
          <FundInfoRow label="สิทธิประโยชน์ทางภาษี" value={fund.fundInfo.taxBenefit} />
          <FundInfoRow label="ลงทุนในต่างประเทศ" value={fund.fundInfo.foreignInvestment} />
          <FundInfoRow label="ความเสี่ยงอัตราแลก เปลี่ยน" value={fund.fundInfo.fxRiskPolicy} />
          <FundInfoRow label="ค่าความเสี่ยง" value={String(fund.fundInfo.riskScore)} />
          <FundInfoRow label="นโยบายการจ่ายปันผล" value={fund.fundInfo.dividendPolicy} />
          <FundInfoRow label="นโยบายค่าเงิน" value={fund.fundInfo.currencyPolicy} />
          <FundInfoRow label="ค่าธรรมเนียมการจัดการ" value={fund.fundInfo.managementFee} />
          <FundInfoRow label="ขั้นต่ำการลงทุน" value={fund.fundInfo.minimumInvestment} />
          <FundInfoRow label="วันที่จดทะเบียนกองทุน" value={fund.fundInfo.registrationDate} />
          <FundInfoRow label="มูลค่าทรัพย์สินสุทธิ" value={fund.fundInfo.netAssetValue} />
        </div>
      </section>
    </>
  );
}

function valueColor(value: string): string {
  if (value.startsWith("+")) return "#008236";
  if (value.startsWith("-") && value !== "-") return "#c10007";
  return "#101828";
}

function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-base font-bold leading-[28px] text-[#101828] ${className}`}>{children}</h2>
  );
}

function DataTableHeader({ columns }: { columns: { label: string; align?: "left" | "center" | "right" }[] }) {
  return (
    <div className="flex w-full border-b border-black/10">
      {columns.map((col) => (
        <div
          key={col.label}
          className={`flex flex-1 items-center px-4 py-3 ${
            col.align === "center" ? "justify-center text-center" : col.align === "right" ? "justify-end text-right" : ""
          }`}
        >
          <span className="text-xs leading-[20px] text-[#6a7282]">{col.label}</span>
        </div>
      ))}
    </div>
  );
}

function DataTableCell({
  value,
  align = "left",
  striped,
}: {
  value: string;
  align?: "left" | "center" | "right";
  striped?: boolean;
}) {
  return (
    <div
      className={`flex h-[38px] flex-1 items-center border-b border-black/10 px-4 py-3.5 last:border-b-0 ${
        striped ? "bg-[#f9fafb]" : "bg-white"
      } ${align === "center" ? "justify-center text-center" : align === "right" ? "justify-end text-right" : ""}`}
    >
      <span className="text-sm leading-[24px]" style={{ color: valueColor(value) }}>
        {value}
      </span>
    </div>
  );
}

function KeyValueBox({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full flex-col gap-3 rounded-lg border border-black/10 p-3">
      {rows.map((row) => (
        <div key={row.label} className="flex w-full items-end gap-2">
          <span className="flex-1 text-sm leading-[24px] text-[#4a5565]">{row.label}</span>
          <span className="shrink-0 text-sm leading-[24px] text-[#101828] whitespace-nowrap">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Figma 39824:512312 — fee table with fixed value column widths on mobile */
function FeeDetailsTable({ rows }: { rows: { label: string; actual: string; maximum: string }[] }) {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full">
        <div className="flex h-12 min-w-0 flex-1 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-[#4a5565]">รายการค่าธรรมเนียม</span>
        </div>
        <div className="flex h-12 w-20 shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-[#4a5565]">เก็บจริง</span>
        </div>
        <div className="flex h-12 w-[81px] shrink-0 items-center border-b border-black/10 bg-white px-4 py-3.5">
          <span className="text-sm leading-[24px] text-[#4a5565]">ไม่เกิน</span>
        </div>
      </div>
      {rows.map((row, index) => {
        const striped = index % 2 === 0;
        const bg = striped ? "bg-[#f9fafb]" : "bg-white";
        const isLast = index === rows.length - 1;
        const rowBorder = isLast ? "" : "border-b border-black/10";

        return (
          <div key={row.label} className="flex w-full">
            <div className={`flex min-h-12 min-w-0 flex-1 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-[24px] text-[#101828]">{row.label}</span>
            </div>
            <div className={`flex min-h-12 w-20 shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-[24px] text-[#101828]">{row.actual}</span>
            </div>
            <div className={`flex min-h-12 w-[81px] shrink-0 items-center px-4 py-3.5 ${rowBorder} ${bg}`}>
              <span className="text-sm leading-[24px] text-[#101828]">{row.maximum}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AllocationSection({
  title,
  slices,
}: {
  title: string;
  slices: { label: string; percent: number; color?: string }[];
}) {
  if (slices.length === 0) {
    return (
      <section className="flex w-full flex-col gap-3 bg-white py-4 lg:bg-transparent">
        <SectionTitle className="lg:px-0">{title}</SectionTitle>
        <p className="text-sm leading-[24px] text-[#6a7282] lg:px-0">ไม่มีข้อมูล</p>
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
                  style={{ backgroundColor: item.color ?? ["#074EA4", "#51A2FF", "#A3B3FF"][index % 3] }}
                />
                <span className="flex-1 text-sm leading-[24px] text-[#4a5565]">{item.label}</span>
                <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">
                  {item.percent}%
                </span>
              </div>
              {index < slices.length - 1 && (
                <div className="mx-6 h-px bg-black/10 lg:mx-6" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PerformanceContent({ fund }: { fund: MutualFundDetailData }) {
  const [dividendModalOpen, setDividendModalOpen] = useState(false);

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>ผลตอบแทนย้อนหลัง</SectionTitle>
        <div className="overflow-x-auto md:overflow-visible">
        <div className="min-w-[520px] overflow-hidden rounded-lg border border-black/10 md:min-w-0">
          <DataTableHeader
            columns={[
              { label: "ช่วงเวลา" },
              { label: "ผลตอบแทน" },
              { label: "ความผันผวนกองทุน" },
              { label: "Maximum Drawdown" },
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
      </section>

      {/* Figma 360:64004 — the section always shows; a fund that pays nothing
          gets the empty state (360:64499) instead of losing the section. */}
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>ประวัติการจ่ายปันผล</SectionTitle>
        {fund.dividendHistory.length > 0 ? (
          <DividendHistoryPreview
            rows={fund.dividendHistory}
            onViewAll={() => setDividendModalOpen(true)}
          />
        ) : (
          <div className="flex w-full items-center gap-[15px]">
            <NoDividendIllustration />
            <p className="text-center text-sm leading-[24px] text-[#4a5565]">กองทุนนี้ไม่มีการจ่ายปันผล</p>
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

function AllocationContent({ fund }: { fund: MutualFundDetailData }) {
  return (
    <div className="flex flex-col gap-2.5 bg-[#f9fafb] lg:bg-transparent">
      <AllocationSection title="หลักทรัพย์ 5 อันดับแรก" slices={fund.topHoldings} />
      <AllocationSection title="สัดส่วนการลงทุน" slices={fund.assetAllocation} />
    </div>
  );
}

function FundInfoContent({ fund }: { fund: MutualFundDetailData }) {
  const { tradingInfo } = fund;

  return (
    <>
      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>มูลค่าขั้นต่ำในการซื้อขาย</SectionTitle>
        <KeyValueBox
          rows={[
            { label: "มูลค่าขั้นต่ำของการซื้อครั้งแรก", value: tradingInfo.minInitialPurchase },
            { label: "มูลค่าขั้นต่ำของการซื้อครั้งถัดไป", value: tradingInfo.minSubsequentPurchase },
            { label: "มูลค่าขายขั้นต่ำ", value: tradingInfo.minRedemption },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>เวลาทำรายการ</SectionTitle>
        <KeyValueBox
          rows={[
            { label: "เวลาปิดรับคำสั่งซื้อ", value: tradingInfo.purchaseCutoff },
            { label: "เวลาปิดรับคำสั่งขาย", value: tradingInfo.redemptionCutoff },
            { label: "วันที่จะได้รับเงิน", value: tradingInfo.settlementDays },
          ]}
        />
      </section>

      <section className="flex w-full flex-col gap-3 py-4 lg:px-0">
        <SectionTitle>ค่าธรรมเนียม</SectionTitle>
        <FeeDetailsTable rows={fund.feeDetails} />
      </section>
    </>
  );
}

function DetailBody({ fund, activeTab }: { fund: MutualFundDetailData; activeTab: DetailTab }) {
  if (activeTab === "ภาพรวม") return <OverviewContent fund={fund} />;
  if (activeTab === "ผลตอบแทน") return <PerformanceContent fund={fund} />;
  if (activeTab === "สัดส่วนการลงทุน") return <AllocationContent fund={fund} />;
  return <FundInfoContent fund={fund} />;
}

export function MutualFundDetail({
  fund,
  onBack,
}: {
  fund: MutualFundDetailData;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>("ภาพรวม");

  // The tab bar parks directly under the identity block, so its sticky offset
  // is that block's height — measured rather than hardcoded, since the block
  // is taller on a phone (the fund name wraps) than on a desktop. Measuring
  // also sidesteps a trap: `system-one`'s stylesheet is unlayered, so its
  // plain `.top-12` outranks every `lg:top-*` in Tailwind's utilities layer.
  // An inline `top` answers to nobody.
  const [identityEl, setIdentityEl] = useState<HTMLDivElement | null>(null);
  const [tabsEl, setTabsEl] = useState<HTMLDivElement | null>(null);
  const [tabsAnchorEl, setTabsAnchorEl] = useState<HTMLDivElement | null>(null);
  const [tabsTop, setTabsTop] = useState(0);
  // No min-height floor on the panel: a short tab ends where its content does
  // (design ask — no empty band under a fund with no dividends). The cost is
  // that switching to a short tab from deep in a long one can't park the bar
  // at the top; the browser clamps the scroll and the page settles lower.

  useEffect(() => {
    if (!identityEl || !tabsEl) return;
    // The bar parks under the identity block below `lg` — see its classes.
    const measure = () => setTabsTop(identityEl.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(identityEl);
    observer.observe(tabsEl);
    return () => observer.disconnect();
  }, [identityEl, tabsEl]);

  /**
   * How far the page is from having the tab bar parked: negative once the bar
   * has travelled up and stuck, zero or positive while it is still below.
   *
   * The bar is sticky, so its own rect reads as "already at the top" the whole
   * way down — hence the zero-height anchor right above it, which stays put in
   * the flow and gives the distance the bar really travelled. The resting
   * offset comes off the computed style rather than the breakpoint, so it is
   * whatever CSS says: the identity block's height on a phone, 0 on a desktop.
   */
  const tabsDelta = () => {
    const main = document.querySelector("main");
    if (!main || !tabsEl || !tabsAnchorEl) return null;
    const stickyTop = parseFloat(getComputedStyle(tabsEl).top) || 0;
    // The rects are screen pixels; `stickyTop` and `scrollTop` are the page's
    // own (see `pageZoom`).
    return (
      (tabsAnchorEl.getBoundingClientRect().top - main.getBoundingClientRect().top) /
        pageZoom() -
      stickyTop
    );
  };

  const scrollTabsIntoPlace = () => {
    const main = document.querySelector("main");
    const delta = tabsDelta();
    if (!main || delta === null || Math.abs(delta) <= 0.5) return;
    main.scrollTop += delta;
  };

  /**
   * Switching tabs deep in a long one leaves you halfway down the new one, so
   * bring the bar back to where it parks — but only ever upward. Read from the
   * top of the fund the bar has not moved yet, and dragging the page down
   * there would swallow the NAV you are looking at.
   *
   * When it does move, it runs twice: once now, once after the new panel has
   * laid out. The first pass moves while the old panel is still up; if the new
   * one is shorter the browser can clamp the scroll back, and the second pass
   * puts it right. When nothing clamps, the second pass is a no-op.
   */
  const selectTab = (tab: DetailTab) => {
    const delta = tabsDelta();
    setActiveTab(tab);
    if (delta === null || delta >= -0.5) return;
    scrollTabsIntoPlace();
    requestAnimationFrame(scrollTabsIntoPlace);
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [fund.id]);

  const isPositive = fund.changePct.startsWith("+");

  return (
    <div className="flex w-full flex-col pb-20 max-lg:bg-white lg:bg-[#f9fafb] lg:pt-2">
      <div className="mx-auto flex w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:px-0">
        {/* Desktop keeps its own bar above the card: there the card's title
            block is fully visible anyway, so a back arrow parked next to the
            content would just be a second copy of it. Below `lg` the card's
            own title does this job instead — see the row inside it. */}
        {/* `hidden lg:flex`, never `flex max-lg:hidden`: `system-one` ships an
            unlayered `.flex` that outranks any `max-lg:hidden` in Tailwind's
            utilities layer, so the bar would show at every width. */}
        <div className="hidden min-h-[46px] items-center gap-2 py-2 pr-2 lg:flex">
          <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
            <ArrowLeftIcon size={18} />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <p className="shrink-0 text-base font-bold leading-[28px] text-[#101828]">{fund.symbol}</p>
            <p className="min-w-0 flex-1 truncate text-sm leading-[24px] text-[#4a5565]">
              {fund.name}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col lg:rounded-t-3xl lg:bg-white lg:px-14 lg:py-8 lg:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.02)]">
          {/* Below `lg` this row is the page's only header, so it carries the
              back arrow and sticks; the full name stays behind because three
              lines of Thai is too much to keep pinned on a phone. At `lg` the
              arrow moves to the bar above and this goes back to being a plain
              title. */}
          <div
            ref={setIdentityEl}
            className="max-lg:sticky max-lg:top-0 max-lg:z-30 flex items-center gap-2 bg-white pt-4 lg:pt-0"
          >
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label="กลับ"
              className="shrink-0 lg:hidden"
            >
              <ArrowLeftIcon size={18} />
            </Button>
            {/* Figma 360:64854 — View / Highlight sit right after the symbol */}
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <h1 className="min-w-0 text-lg font-bold leading-[32px] text-[#101828]">{fund.symbol}</h1>
              <FundTagBadges fund={fund} />
            </div>
          </div>
          {/* `pl-9` keeps the name under the symbol rather than under the
              arrow — the 28px button plus the row's 8px gap. */}
          <p className="pb-3 pl-9 pt-1.5 text-sm leading-[24px] text-[#4a5565] lg:pl-0">{fund.name}</p>

          <div className="flex flex-col gap-2.5 pb-3">
            <div className="flex items-end gap-1">
              <Image src={MF_ASSETS.navPriceIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
              <span className="text-[32px] font-bold leading-[48px] text-[#101828]">{fund.nav}</span>
              <span className="text-sm leading-[24px] text-[#6a7282]">{fund.currency}</span>
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

          {/* Below `lg` the strip runs edge to edge — the negative margins
              cancel the page gutter its container paints — and scrolls
              sideways when four Thai labels outrun a phone. */}
          {/* Zero-height, so it costs nothing in the column — it exists only to
              mark where the tab bar sits when it is not stuck. */}
          <div ref={setTabsAnchorEl} aria-hidden />
          <div
            ref={setTabsEl}
            className="sticky max-lg:top-[var(--tabs-top)] lg:top-0 z-20 -mx-4 flex overflow-x-auto border-b border-black/10 bg-white md:-mx-8 md:overflow-visible lg:mx-0"
            style={
              { "--tabs-top": `${tabsTop}px`, scrollbarWidth: "none" } as CSSProperties
            }
          >
            {DETAIL_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={`flex shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm font-bold leading-[24px] whitespace-nowrap md:min-w-[80px] md:flex-1 md:shrink lg:min-w-[80px] lg:flex-1 ${
                    active
                      ? "border-[#0a6ee7] text-[#0a6ee7]"
                      : "border-black/10 text-black/60"
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* `overflowAnchor: none` keeps Chrome's scroll anchoring out of the
              swap — left on, it re-adjusts the scroll to hold whatever row was
              on screen, undoing the jump we just made. */}
          <div
            className="flex w-full flex-col"
            style={{ overflowAnchor: "none" }}
          >
            <DetailBody fund={fund} activeTab={activeTab} />

            {/* Offered, never booked — see `SendProposalButton`. Under every
                tab, since all four are about the one fund. */}
            <SendProposalButton
              subject={{ id: offeredProductId("mutual-fund", fund.symbol), underlying: fund.symbol, documents: "Fund Fact Sheet" }}
              className="pt-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
