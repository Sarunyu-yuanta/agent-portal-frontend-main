"use client";

import { useState } from "react";
import { BottomSheet, Modal, Button } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";
import {
  DIVIDEND_POLICY_OPTIONS,
  FILTER_CATEGORY_OPTIONS,
  FUND_MANAGEMENT_COMPANIES,
  FUND_RISK_LEVELS,
  INVESTMENT_POLICY_OPTIONS,
  fundRiskLevelLabel,
  TAX_SAVING_FUND_TYPES,
  getFundCategoryIds,
  getFundDividendPolicy,
  getFundInvestmentPolicy,
  getFundManagementCompanyId,
  getFundTaxSavingType,
  type MutualFund,
} from "./mutual-fund-data";
import { MF_ASSETS } from "./mutual-fund-assets";

export type MutualFundFilterState = {
  categories: string[];
  taxTypes: string[];
  dividendPolicies: string[];
  investmentPolicies: string[];
  managementCompanies: string[];
  riskLevels: number[];
};

export const EMPTY_FILTER_STATE: MutualFundFilterState = {
  categories: [],
  taxTypes: [],
  dividendPolicies: [],
  investmentPolicies: [],
  managementCompanies: [],
  riskLevels: [],
};

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function isEmptyFilterState(filter: MutualFundFilterState): boolean {
  return (
    filter.categories.length === 0 &&
    filter.taxTypes.length === 0 &&
    filter.dividendPolicies.length === 0 &&
    filter.investmentPolicies.length === 0 &&
    filter.managementCompanies.length === 0 &&
    filter.riskLevels.length === 0
  );
}

/** Figma 40544:772211 (no chips → full catalog) / 40544:772630 (no matches → empty state). */
export function applyMutualFundFilter(funds: MutualFund[], filter: MutualFundFilterState): MutualFund[] {
  if (isEmptyFilterState(filter)) return funds;

  return funds.filter((fund) => {
    const categoryOptions = FILTER_CATEGORY_OPTIONS.filter((o) => filter.categories.includes(o.id));
    if (categoryOptions.length > 0) {
      const categories = getFundCategoryIds(fund.id);
      const matches = categoryOptions.some((option) =>
        option.id === "tax-saving"
          ? getFundTaxSavingType(fund.id) !== null
          : (option.categoryIds ?? []).some((c) => categories.includes(c)),
      );
      if (!matches) return false;
    }
    if (filter.taxTypes.length > 0) {
      const taxType = getFundTaxSavingType(fund.id);
      if (!taxType || !filter.taxTypes.includes(taxType)) return false;
    }
    if (filter.dividendPolicies.length > 0 && !filter.dividendPolicies.includes(getFundDividendPolicy(fund.id))) {
      return false;
    }
    if (
      filter.investmentPolicies.length > 0 &&
      !filter.investmentPolicies.includes(getFundInvestmentPolicy(fund.id))
    ) {
      return false;
    }
    if (
      filter.managementCompanies.length > 0 &&
      !filter.managementCompanies.includes(getFundManagementCompanyId(fund.id))
    ) {
      return false;
    }
    if (filter.riskLevels.length > 0 && !filter.riskLevels.includes(Math.min(fund.risk, 9))) {
      return false;
    }
    return true;
  });
}

type AmcId = keyof typeof MF_ASSETS.amcLogo;

/**
 * Figma 155:19536 "Mutual Fund_Icon Symbol" — 20px logo per AMC. Most logos fill the circle;
 * the ones below sit inset on a white disc, with the box (px) and optional crop taken from Figma.
 */
const AMC_INSET_LOGOS: Partial<
  Record<AmcId, { w: number; h: number; top: number; left: number; crop?: React.CSSProperties }>
> = {
  eastspring: { w: 13.84, h: 13.84, top: 3.12, left: 2.84 },
  aberdeen: { w: 13.84, h: 13.84, top: 2.84, left: 2.64 },
  pamc: { w: 13.86, h: 13.86, top: 3, left: 3 },
  talisam: { w: 13.8, h: 13.86, top: 3.07, left: 3.12 },
  principal: { w: 12.12, h: 14.84, top: 2.88, left: 3.4 },
  bcap: { w: 12.88, h: 16.44, top: 1.76, left: 3.56, crop: { width: "179.5%", height: "140.63%", left: "-40.99%", top: "-20.19%" } },
  mfc: { w: 16.08, h: 5.84, top: 7.08, left: 1.96, crop: { width: "102.66%", height: "100%", left: "-0.21%", top: 0 } },
};

function AmcLogo({ id }: { id: string }) {
  const src = MF_ASSETS.amcLogo[id as AmcId];
  if (!src) return null;
  const inset = AMC_INSET_LOGOS[id as AmcId];
  return (
    <span className="relative size-5 shrink-0 overflow-clip rounded-full bg-white">
      {inset ? (
        <span
          className="absolute overflow-hidden"
          style={{ width: inset.w, height: inset.h, top: inset.top, left: inset.left }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className={inset.crop ? "absolute block max-w-none" : "absolute inset-0 block size-full max-w-none object-cover"}
            style={inset.crop}
          />
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 block size-full max-w-none object-cover" />
      )}
    </span>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-9 w-full cursor-pointer items-center justify-center gap-1 rounded-full border py-2 pl-2 pr-3 text-sm leading-[24px] transition-colors ${
        active
          ? "border-[#0a6ee7] bg-[#f3f8fe] text-[#0a6ee7] hover:bg-[#e4f0fd]!"
          : "border-black/10 bg-white text-[#4a5565] hover:bg-black/[0.03]!"
      }`}
    >
      {icon}
      <span className={`min-w-0 truncate text-center ${icon ? "flex-1" : ""}`}>{label}</span>
    </button>
  );
}

function FilterSection({
  title,
  onClear,
  children,
  compact = false,
}: {
  title: string;
  onClear: () => void;
  children: React.ReactNode;
  /** Figma 360:78475 — the category block sits 12px under its header; the rest use 16px. */
  compact?: boolean;
}) {
  return (
    <div className={`flex w-full flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div className="flex w-full items-center justify-between gap-2">
        <p className="text-sm font-bold leading-[24px] text-[#101828]">{title}</p>
        <Button variant="plain" size="xs" onClick={onClear} className="shrink-0">
          ล้าง
        </Button>
      </div>
      {children}
    </div>
  );
}

/** Figma 360:78489 — 1px rule centered in an 8px band. */
function FilterDivider() {
  return (
    <div className="flex h-2 w-full items-center">
      <div className="h-px w-full bg-black/10" />
    </div>
  );
}

function MutualFundFilterContent({
  draft,
  setDraft,
}: {
  draft: MutualFundFilterState;
  setDraft: (updater: (prev: MutualFundFilterState) => MutualFundFilterState) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-6">
      <FilterSection title="หมวดหมู่" compact onClear={() => setDraft((prev) => ({ ...prev, categories: [] }))}>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {FILTER_CATEGORY_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              active={draft.categories.includes(option.id)}
              onClick={() =>
                setDraft((prev) => ({ ...prev, categories: toggleValue(prev.categories, option.id) }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection title="กองทุนลดหย่อนภาษี" onClear={() => setDraft((prev) => ({ ...prev, taxTypes: [] }))}>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {TAX_SAVING_FUND_TYPES.map((type) => (
            <FilterChip
              key={type}
              label={type}
              active={draft.taxTypes.includes(type)}
              onClick={() => setDraft((prev) => ({ ...prev, taxTypes: toggleValue(prev.taxTypes, type) }))}
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="นโยบายการจ่ายปันผล"
        onClear={() => setDraft((prev) => ({ ...prev, dividendPolicies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {DIVIDEND_POLICY_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.dividendPolicies.includes(option)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  dividendPolicies: toggleValue(prev.dividendPolicies, option),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="นโยบายการลงทุน"
        onClear={() => setDraft((prev) => ({ ...prev, investmentPolicies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {INVESTMENT_POLICY_OPTIONS.map((option) => (
            <FilterChip
              key={option}
              label={option}
              active={draft.investmentPolicies.includes(option)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  investmentPolicies: toggleValue(prev.investmentPolicies, option),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection
        title="บริษัทจัดการกองทุน"
        onClear={() => setDraft((prev) => ({ ...prev, managementCompanies: [] }))}
      >
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {FUND_MANAGEMENT_COMPANIES.map((company) => (
            <FilterChip
              key={company.id}
              label={company.label}
              icon={<AmcLogo id={company.id} />}
              active={draft.managementCompanies.includes(company.id)}
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  managementCompanies: toggleValue(prev.managementCompanies, company.id),
                }))
              }
            />
          ))}
        </div>
      </FilterSection>

      <FilterDivider />

      <FilterSection title="ระดับความเสี่ยง" onClear={() => setDraft((prev) => ({ ...prev, riskLevels: [] }))}>
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {FUND_RISK_LEVELS.map((level) => (
            <FilterChip
              key={level}
              label={fundRiskLevelLabel(level)}
              active={draft.riskLevels.includes(level)}
              onClick={() =>
                setDraft((prev) => ({ ...prev, riskLevels: toggleValue(prev.riskLevels, level) }))
              }
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterFooter({
  onClear,
  onApply,
}: {
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex w-full gap-3">
      <Button variant="outline" size="xl" className="flex-1" onClick={onClear}>
        ล้างทั้งหมด
      </Button>
      <Button variant="primary" size="xl" className="flex-1" onClick={onApply}>
        ตกลง
      </Button>
    </div>
  );
}

/** Figma 360:78470 — "ค้นหากองทุนที่คุณสนใจ", mobile bottom sheet; footer pinned to the bottom. */
export function MutualFundFilterBottomSheet({
  open,
  initialState,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  initialState: MutualFundFilterState;
  onOpenChange: (open: boolean) => void;
  onApply: (state: MutualFundFilterState) => void;
}) {
  const [draft, setDraft] = useState(initialState);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initialState);
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="ค้นหากองทุนที่คุณสนใจ"
      showHandle
      showHeader
      rightSide="icon"
      rightIcon={<XIcon size={18} weight="bold" />}
      contentClassName="mx-[-16px] flex max-h-[calc(var(--dvh)*100-8rem)] flex-col overflow-y-auto px-4 pt-4"
    >
      <MutualFundFilterContent draft={draft} setDraft={setDraft} />
      {/* Figma 360:78598 — footer stays pinned while the chips scroll under it */}
      <div className="sticky bottom-0 z-10 -mx-4 mt-6 bg-white px-4 pb-10 pt-4 shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]">
        <FilterFooter
          onClear={() => setDraft(EMPTY_FILTER_STATE)}
          onApply={() => {
            onApply(draft);
            onOpenChange(false);
          }}
        />
      </div>
    </BottomSheet>
  );
}

/** Desktop centered modal — same content as the mobile sheet (Figma 360:78470). */
export function MutualFundFilterModal({
  open,
  initialState,
  onClose,
  onApply,
}: {
  open: boolean;
  initialState: MutualFundFilterState;
  onClose: () => void;
  onApply: (state: MutualFundFilterState) => void;
}) {
  const [draft, setDraft] = useState(initialState);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(initialState);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
        <Modal
          variant="content"
          title="ค้นหากองทุนที่คุณสนใจ"
          showClose
          onClose={onClose}
          className="!max-w-[726px] w-[calc(var(--vw)*100-3rem)]"
        >
          <div className="mx-[-16px] max-h-[calc(var(--vh)*70)] overflow-y-auto px-4 pb-2">
            <div className="flex w-full flex-col gap-6">
              <MutualFundFilterContent draft={draft} setDraft={setDraft} />
            </div>
          </div>
          <div className="pt-4">
            <FilterFooter
              onClear={() => setDraft(EMPTY_FILTER_STATE)}
              onApply={() => {
                onApply(draft);
                onClose();
              }}
            />
          </div>
        </Modal>
      </div>
    </div>
  );
}
