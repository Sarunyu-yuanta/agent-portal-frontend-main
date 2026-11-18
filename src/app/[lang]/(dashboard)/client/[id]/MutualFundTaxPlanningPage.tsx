"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input } from "@sarunyu/system-one";
import { ArrowLeftIcon, ArrowRightIcon, InfoIcon } from "@phosphor-icons/react";
import { navRead, navRemove, navWrite } from "@/lib/nav-session";
import { mutualFundDetailHref, RiskBadge } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import { MutualFundTaxPlanningSkeleton } from "./MutualFundListPageSkeletons";
import { useMutualFundUniverse } from "@/hooks/use-catalog";
import {
  TAX_SAVING_FUND_TYPES,
  getTaxSavingFunds,
  taxSavingMaxInvestment,
  type MutualFund,
  type TaxSavingFundType,
} from "./mutual-fund-data";

function formatThb(value: number): string {
  return `${Math.round(value).toLocaleString("th-TH")} THB`;
}

/**
 * Selecting a recommended fund pushes to its detail page, which unmounts this
 * page; coming back from there should still show what was typed. Only the
 * explicit "กลับ" button — actually leaving the tool — clears it, so the next
 * fresh entry starts at default instead of resuming a stale calculation.
 */
const INCOME_STATE_KEY = "nav:tax-planning-income";

type StoredIncomeState = { incomeInput: string; calculatedIncome: number | null };

function readStoredIncomeState(): StoredIncomeState {
  const raw = navRead(INCOME_STATE_KEY);
  if (!raw) return { incomeInput: "", calculatedIncome: null };
  try {
    const parsed: unknown = JSON.parse(raw);
    const incomeInput =
      typeof parsed === "object" && parsed !== null && typeof (parsed as { incomeInput?: unknown }).incomeInput === "string"
        ? (parsed as { incomeInput: string }).incomeInput
        : "";
    const calculatedIncomeRaw = (parsed as { calculatedIncome?: unknown } | null)?.calculatedIncome;
    const calculatedIncome = typeof calculatedIncomeRaw === "number" ? calculatedIncomeRaw : null;
    return { incomeInput, calculatedIncome };
  } catch {
    return { incomeInput: "", calculatedIncome: null };
  }
}

function taxPlanningResultsHref(fundType: TaxSavingFundType): string {
  return `/product-catalog/mutual-fund/tools/tax-planning/${encodeURIComponent(fundType)}`;
}

function TaxCardViewTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 overflow-hidden rounded bg-[#f6f3ef] px-1 py-0.5">
      <span className="relative size-3.5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MF_ASSETS.performersTagView} alt="" className="absolute inset-0 block size-full max-w-none" />
      </span>
      <span className="text-micro leading-[18px] font-normal whitespace-nowrap text-[#935737]">View</span>
    </span>
  );
}

function TaxCardHighlightTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 overflow-hidden rounded bg-[#eff6ff] px-1 py-0.5">
      <span className="relative size-3.5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MF_ASSETS.performersTagHighlight} alt="" className="absolute inset-0 block size-full max-w-none" />
      </span>
      <span className="bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-micro leading-[18px] font-normal whitespace-nowrap text-transparent">
        Highlight
      </span>
    </span>
  );
}

/** Figma 40473:724623 — cards sorted so both-tag cards come first, then View-only, then Highlight-only. */
function tagVariantForIndex(index: number, total: number): "both" | "view" | "highlight" {
  const groupSize = Math.ceil(total / 3);
  if (index < groupSize) return "both";
  if (index < groupSize * 2) return "view";
  return "highlight";
}

function TaxCardTags({ variant }: { variant: "both" | "view" | "highlight" }) {
  return (
    <div className="flex w-full items-start gap-2 px-1">
      {variant !== "highlight" ? <TaxCardViewTag /> : null}
      {variant !== "view" ? <TaxCardHighlightTag /> : null}
    </div>
  );
}

function TaxFundPreviewCard({
  fund,
  index,
  total,
  onSelect,
}: {
  fund: MutualFund;
  index: number;
  total: number;
  onSelect?: (fundId: string) => void;
}) {
  const href = mutualFundDetailHref(fund.id);
  const inner = (
    <div
      className="flex w-[132px] shrink-0 flex-col gap-1 rounded-lg bg-[#f3f4f6] pt-1"
      style={{
        boxShadow: "0px 0px 1px rgba(102, 102, 102, 0.16), 0px 4px 4px rgba(102, 102, 102, 0.12)",
      }}
    >
      <TaxCardTags variant={tagVariantForIndex(index, total)} />
      <div className="flex w-full cursor-pointer flex-col gap-2 rounded-lg bg-white p-2 transition-colors hover:bg-black/[0.03]!">
        <span className="truncate text-sm font-bold leading-[24px] text-[#101828]">{fund.symbol}</span>
        <div className="flex items-center gap-1">
          <span className="text-xs leading-[20px] text-[#4a5565]">{fund.price}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MF_ASSETS.caretUpFill} alt="" className="size-3" />
          <span className="inline-flex w-fit items-center rounded bg-[#dbfce7] px-1 py-0.5 text-micro leading-[18px] text-[#008236]">
            {fund.changePct}
          </span>
        </div>
        <RiskBadge risk={fund.risk} inline />
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <Link
        href={href}
        className="no-underline text-inherit"
        onClick={(e) => {
          e.preventDefault();
          onSelect(fund.id);
        }}
      >
        {inner}
      </Link>
    );
  }
  return (
    <Link href={href} className="no-underline text-inherit">
      {inner}
    </Link>
  );
}

function TaxSavingFundCard({
  fundType,
  maxInvestment,
  funds,
  onFundSelect,
}: {
  fundType: TaxSavingFundType;
  maxInvestment: number;
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full items-center justify-between gap-2 p-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs leading-[20px] text-[#6a7282]">ประเภทกองทุน</span>
          <span className="text-base font-bold leading-[28px] text-[#101828]">{fundType}</span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs leading-[20px] text-[#6a7282]">ลงทุนได้สูงสุด</span>
          <span className="text-base font-bold leading-[28px] text-[#101828]">{formatThb(maxInvestment)}</span>
        </div>
      </div>

      <div className="h-px w-full bg-black/10" />

      <div className="flex w-full flex-col gap-2 bg-[#f9fafb] p-4">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-sm leading-[24px] text-[#6a7282]">กองทุนแนะนำ</span>
          <Button
            variant="plain"
            size="xs"
            rightIcon={<ArrowRightIcon size={14} />}
            className="shrink-0 !px-0"
            onClick={() => router.push(taxPlanningResultsHref(fundType))}
          >
            ดูทั้งหมด
          </Button>
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          {funds.map((fund, index) => (
            <TaxFundPreviewCard
              key={`${fund.id}-${index}`}
              fund={fund}
              index={index}
              total={funds.length}
              onSelect={onFundSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Figma 38372:394899 / 38372:395507 — "วางแผนภาษี" income input + per-tax-type recommended funds. */
export function MutualFundTaxPlanningPage({
  onBack,
  onFundSelect,
}: {
  onBack: () => void;
  onFundSelect?: (fundId: string) => void;
}) {
  const [incomeInput, setIncomeInput] = useState(() => readStoredIncomeState().incomeInput);
  const [hasInvalidChar, setHasInvalidChar] = useState(false);
  const [calculatedIncome, setCalculatedIncome] = useState<number | null>(
    () => readStoredIncomeState().calculatedIncome,
  );

  // The recommended funds are a slice of the fund universe; the page waits on that.
  const { isLoading } = useMutualFundUniverse();

  useEffect(() => {
    navWrite(INCOME_STATE_KEY, JSON.stringify({ incomeInput, calculatedIncome }));
  }, [incomeInput, calculatedIncome]);

  const maxInvestment = calculatedIncome !== null ? taxSavingMaxInvestment(calculatedIncome) : 0;
  const recommendedFunds = getTaxSavingFunds(false, 10);

  const handleBack = () => {
    navRemove(INCOME_STATE_KEY);
    onBack();
  };

  const handleIncomeChange = (raw: string) => {
    setCalculatedIncome(null);
    if (/^[0-9]*$/.test(raw)) {
      setIncomeInput(raw);
      setHasInvalidChar(false);
    } else {
      setIncomeInput(raw.replace(/[^0-9]/g, ""));
      setHasInvalidChar(true);
    }
  };

  const handleCalculate = () => {
    const numeric = Number(incomeInput);
    setCalculatedIncome(Number.isFinite(numeric) && numeric > 0 ? numeric : 0);
  };

  if (isLoading) {
    return (
      <MutualFundTaxPlanningSkeleton
        fundTypes={TAX_SAVING_FUND_TYPES.length}
        showResults={calculatedIncome !== null}
      />
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col bg-[#f9fafb] pb-20">
      <div className="mx-auto flex w-full max-w-[996px] items-center gap-2 px-4 pb-2 pt-4 md:px-8 lg:px-0 lg:pt-8">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={handleBack}
          aria-label="กลับ"
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold leading-[32px] text-[#101828]">วางแผนภาษี</h1>
      </div>

      <div className="mx-auto w-full max-w-[996px] px-4 py-4 md:px-8 lg:px-0">
        <div
          className="flex w-full flex-col gap-6 rounded-xl bg-white p-6"
          style={{
            boxShadow:
              "0px 0px 1px rgba(102, 102, 102, 0.16), 0px 4px 4px rgba(102, 102, 102, 0.12)",
          }}
        >
          <div className="flex w-full flex-col gap-3 rounded-xl border border-black/10 bg-[#f9fafb] p-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-bold leading-[24px] text-[#101828]">รายได้ของคุณ</p>
              <p className="text-xs leading-[20px] text-[#6a7282]">รวมรายได้ทั้งหมดที่ได้รับในปี</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1">
                <Input
                  inputMode="numeric"
                  value={incomeInput}
                  onChange={handleIncomeChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && incomeInput.trim()) handleCalculate();
                  }}
                  placeholder="รายได้ต่อปี"
                  unit="THB"
                  forceState={hasInvalidChar ? "error" : undefined}
                  errorMessage="กรุณากรอกเฉพาะตัวเลข"
                />
              </div>
              <Button
                variant="primary"
                size="xl"
                className="h-12! sm:w-[160px]"
                disabled={!incomeInput.trim()}
                onClick={handleCalculate}
              >
                คำนวณ
              </Button>
            </div>
            <div className="flex w-full items-start gap-1.5 rounded bg-[#f9fafb] px-2 py-2">
              <InfoIcon size={16} className="mt-0.5 shrink-0 text-[#4a5565]" />
              <p className="min-w-0 flex-1 text-sm leading-[24px] text-[#4a5565]">
                เครื่องมือวางแผนภาษีนี้เป็นเพียงการประมาณการสิทธิลดหย่อนภาษีเบื้องต้นจากรายได้ที่ระบุและเป็นไปตามหลักเกณฑ์ทั่วไป
                โดยยังไม่รวมสิทธิลดหย่อนอื่น และมิใช่คำแนะนำภาษีเฉพาะบุคคลหรือการรับรองสิทธิ
                โปรดตรวจสอบเกณฑ์สรรพากรและเงื่อนไขล่าสุดก่อนตัดสินใจลงทุน
              </p>
            </div>
          </div>

          {calculatedIncome !== null ? (
            <div className="flex w-full flex-col gap-3">
              <p className="text-base font-bold leading-[28px] text-[#101828]">วางแผนภาษี</p>
              {TAX_SAVING_FUND_TYPES.map((fundType) => (
                <TaxSavingFundCard
                  key={fundType}
                  fundType={fundType}
                  maxInvestment={maxInvestment}
                  funds={recommendedFunds}
                  onFundSelect={onFundSelect}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
