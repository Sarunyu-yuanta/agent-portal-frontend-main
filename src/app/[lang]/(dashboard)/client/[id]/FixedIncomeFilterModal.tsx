"use client";

import { useEffect, useState } from "react";
import { BottomSheet, Button, Chip, useIsMobile } from "@sarunyu/system-one";
import { FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import {
  BOND_LOGOS,
  EMPTY_FIXED_INCOME_FILTERS,
  FIXED_INCOME_COUPON_FILTERS,
  FIXED_INCOME_OFFER_FILTERS,
  FIXED_INCOME_RISK_FILTERS,
  countFixedIncomeFilters,
  getFixedIncomeFilterCompanies,
  type FixedIncomeCouponFilter,
  type FixedIncomeFilterCompany,
  type FixedIncomeFilters,
  type FixedIncomeOfferFilter,
  type FixedIncomeRiskFilter,
} from "./fixed-income-data";
import { BondLogo } from "./fixed-income-shared";

function CompanyFilterChip({
  label,
  selected,
  onClick,
  company,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  company: FixedIncomeFilterCompany;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-8 w-full min-w-0 items-center justify-center gap-1 overflow-hidden rounded-full border pl-2 pr-3 py-1.5 text-sm leading-[24px] cursor-pointer transition-colors"
      style={{
        backgroundColor: selected ? "#0a6ee7" : "white",
        borderColor: selected ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.1)",
        color: selected ? "white" : "#4a5565",
      }}
    >
      <BondLogo src={BOND_LOGOS[company.logoIdx]} logoCrop={company.logoCrop} className="size-5 rounded" />
      <span className="min-w-0 flex-1 truncate text-center">{label}</span>
    </button>
  );
}

function FilterSection({
  title,
  mobile,
  children,
}: {
  title: string;
  mobile?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex w-full flex-col ${mobile ? "gap-3" : "gap-4"}`}>
      <p
        className={`w-full font-bold text-[#101828] ${
          mobile ? "text-sm leading-[24px]" : "text-base leading-[28px]"
        }`}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

type FilterContentProps = {
  draft: FixedIncomeFilters;
  mobile?: boolean;
  onToggleCompany: (companyId: string) => void;
  onToggleCoupon: (coupon: FixedIncomeCouponFilter) => void;
  onToggleOfferType: (offerType: FixedIncomeOfferFilter) => void;
  onToggleRisk: (risk: FixedIncomeRiskFilter) => void;
};

function FilterContent({
  draft,
  mobile,
  onToggleCompany,
  onToggleCoupon,
  onToggleOfferType,
  onToggleRisk,
}: FilterContentProps) {
  const companies = getFixedIncomeFilterCompanies();
  const gridClass = mobile
    ? "grid w-full grid-cols-2 gap-x-3 gap-y-2"
    : "grid w-full grid-cols-3 gap-x-3 gap-y-2";

  return (
    <div className={`flex w-full flex-col ${mobile ? "gap-6" : "gap-4"}`}>
      <FilterSection title="บริษัท" mobile={mobile}>
        <div className={gridClass}>
          {companies.map((company) => (
            <CompanyFilterChip
              key={company.id}
              label={company.name}
              company={company}
              selected={draft.companies.includes(company.id)}
              onClick={() => onToggleCompany(company.id)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="ดอกเบี้ย" mobile={mobile}>
        <div className={gridClass}>
          {FIXED_INCOME_COUPON_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.coupons.includes(option.id)}
              onClick={() => onToggleCoupon(option.id)}
              className="w-full"
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="เสนอขาย" mobile={mobile}>
        <div className={gridClass}>
          {FIXED_INCOME_OFFER_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.offerTypes.includes(option.id)}
              onClick={() => onToggleOfferType(option.id)}
              className="w-full"
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="ความเสี่ยง" mobile={mobile}>
        <div className={gridClass}>
          {FIXED_INCOME_RISK_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.risks.includes(option.id)}
              onClick={() => onToggleRisk(option.id)}
              className="w-full"
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterFooter({
  mobile,
  onClear,
  onApply,
}: {
  mobile?: boolean;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className={`flex w-full items-center ${mobile ? "gap-4 pt-6" : "gap-4"}`}>
      <Button
        variant="outline-black"
        size={mobile ? "lg" : "xl"}
        className="min-w-0 flex-1 max-w-[343px] text-[#0a6ee7]"
        onClick={onClear}
      >
        ล้างตัวเลือก
      </Button>
      <Button
        variant="primary"
        size={mobile ? "lg" : "xl"}
        className="min-w-0 flex-1 max-w-[343px]"
        onClick={onApply}
      >
        ยืนยันตัวเลือก
      </Button>
    </div>
  );
}

type FixedIncomeFilterModalProps = {
  open: boolean;
  filters: FixedIncomeFilters;
  onClose: () => void;
  onApply: (filters: FixedIncomeFilters) => void;
};

export function FixedIncomeFilterModal({
  open,
  filters,
  onClose,
  onApply,
}: FixedIncomeFilterModalProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<FixedIncomeFilters>(filters);
  const [syncSnapshot, setSyncSnapshot] = useState({ open, filters });
  if (syncSnapshot.open !== open || syncSnapshot.filters !== filters) {
    setSyncSnapshot({ open, filters });
    if (open) setDraft(filters);
  }

  useEffect(() => {
    if (!open || isMobile) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isMobile, onClose]);

  const activeCount = countFixedIncomeFilters(draft);
  const title = `Filter${activeCount > 0 ? ` (${activeCount})` : ""}`;

  const toggleCompany = (companyId: string) => {
    setDraft((prev) => ({
      ...prev,
      companies: prev.companies.includes(companyId)
        ? prev.companies.filter((id) => id !== companyId)
        : [...prev.companies, companyId],
    }));
  };

  const toggleCoupon = (coupon: FixedIncomeCouponFilter) => {
    setDraft((prev) => ({
      ...prev,
      coupons: prev.coupons.includes(coupon)
        ? prev.coupons.filter((c) => c !== coupon)
        : [...prev.coupons, coupon],
    }));
  };

  const toggleOfferType = (offerType: FixedIncomeOfferFilter) => {
    setDraft((prev) => ({
      ...prev,
      offerTypes: prev.offerTypes.includes(offerType)
        ? prev.offerTypes.filter((o) => o !== offerType)
        : [...prev.offerTypes, offerType],
    }));
  };

  const toggleRisk = (risk: FixedIncomeRiskFilter) => {
    setDraft((prev) => ({
      ...prev,
      risks: prev.risks.includes(risk)
        ? prev.risks.filter((id) => id !== risk)
        : [...prev.risks, risk],
    }));
  };

  const clearDraft = () => setDraft(EMPTY_FIXED_INCOME_FILTERS);
  const applyDraft = () => onApply(draft);

  const filterContentProps = {
    draft,
    onToggleCompany: toggleCompany,
    onToggleCoupon: toggleCoupon,
    onToggleOfferType: toggleOfferType,
    onToggleRisk: toggleRisk,
  };

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        headerType="icon"
        leftIcon={<FunnelSimpleIcon size={22} className="text-[#101828]" />}
        title={title}
        rightSide="action"
        actionLabel="Close"
        onActionClick={onClose}
        showHandle
        contentClassName="flex max-h-[calc(var(--dvh)*100-8rem)] flex-col gap-0 overflow-y-auto pb-2"
      >
        <FilterContent {...filterContentProps} mobile />
        <FilterFooter mobile onClear={clearDraft} onApply={applyDraft} />
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-[614px] flex-col gap-6 rounded-[24px] bg-white p-4"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fixed-income-filter-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full border-none p-1 cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
        >
          <XIcon size={18} color="white" />
        </button>

        <div className="flex w-full items-center gap-2 pr-8">
          <FunnelSimpleIcon size={24} className="shrink-0 text-[#101828]" />
          <p id="fixed-income-filter-title" className="min-w-0 flex-1 text-lg font-bold leading-[28px] text-[#101828]">
            {title}
          </p>
        </div>

        <FilterContent {...filterContentProps} />
        <div className="pt-4">
          <FilterFooter onClear={clearDraft} onApply={applyDraft} />
        </div>
      </div>
    </div>
  );
}
