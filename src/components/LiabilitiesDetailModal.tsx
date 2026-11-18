"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, CreditCardIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { useIsMobile } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { DashedDivider } from "@/components/ui/finance-ui";
import { AllocationDonut } from "@/components/allocation-donut";
import type { LiabilitiesDetail, LiabilityCategory } from "@/data/liabilities-details";
import { getCategoryAmount } from "@/data/liabilities-details";
import { useT } from "@/i18n/I18nProvider";

/**
 * Same donut as the allocation cards — it was a `conic-gradient` with a white
 * disc punched through the middle, which meant no hover value, no entry
 * animation, and a hole that only stays a hole over a white background. Each
 * category brings its own `color`, so the shared palette stands aside here.
 */
function LiabilitiesDonutChart({
  categories,
}: {
  categories: LiabilityCategory[];
}) {
  const t = useT();
  return (
    <AllocationDonut
      slices={categories.map((c) => ({ label: t.client.liabilities.categories[c.id] ?? c.label, percent: c.percent, color: c.color }))}
      size={96}
    />
  );
}

function LiabilitiesLegendItem({
  category,
}: {
  category: LiabilityCategory;
}) {
  const t = useT();
  return (
    <div className="flex gap-2 items-center w-full">
      <div className="flex flex-1 gap-1 items-center min-w-0 px-2 py-1">
        <span
          className="shrink-0 size-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <p className="text-label font-normal leading-[20px] text-[var(--text-default-tertiary)] truncate">
          {t.client.liabilities.categories[category.id] ?? category.label}
        </p>
      </div>
      <p className="text-label font-normal leading-[20px] text-[var(--text-default-tertiary)] shrink-0">
        {category.percent}%
      </p>
    </div>
  );
}

function LiabilityCategoryCard({
  category,
  totalAmount,
  expanded,
  onToggle,
}: {
  category: LiabilityCategory;
  totalAmount: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const amount = getCategoryAmount(totalAmount, category.percent);

  const headerRow = (
    <>
      <div className="flex flex-1 gap-2 items-center min-w-0">
        <span
          className="shrink-0 size-2 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <p className="text-body font-bold leading-[24px] text-[var(--text-default-primary)] whitespace-nowrap">
          {t.client.liabilities.categories[category.id] ?? category.label}
        </p>
      </div>

      <div className="flex flex-1 justify-end items-center min-w-0">
        <div className="flex gap-1 items-center text-right whitespace-nowrap">
          <p className="text-body font-bold leading-[24px] text-[var(--text-default-primary)]">
            {amount}
          </p>
          <p className="text-body font-normal leading-[24px] text-[var(--text-default-tertiary)]">
            THB
          </p>
        </div>
      </div>

      {expanded ? (
        <CaretUpIcon size={20} className="text-[var(--text-default-tertiary)] shrink-0" />
      ) : (
        <CaretDownIcon size={20} className="text-[var(--text-default-tertiary)] shrink-0" />
      )}
    </>
  );

  if (!expanded) {
    return (
      <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden w-full">
        <button
          type="button"
          className="flex gap-2 items-center px-3 py-4 w-full cursor-pointer hover:bg-[var(--bg-default-secondary)] transition-colors text-left"
          onClick={onToggle}
          aria-expanded={false}
        >
          {headerRow}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden w-full flex flex-col gap-2 px-3 pt-2 pb-4">
      <button
        type="button"
        className="flex gap-2 items-center py-2 w-full cursor-pointer hover:opacity-80 transition-opacity text-left"
        onClick={onToggle}
        aria-expanded
      >
        {headerRow}
      </button>

      <DashedDivider />

      <div className="flex flex-col px-1">
        {category.subItems.map((subItem) => (
          <div
            key={subItem.label}
            className="flex gap-2 items-center text-label font-normal leading-[20px] text-[var(--text-default-tertiary)] w-full"
          >
            <p className="flex-1 min-w-0">{subItem.label}</p>
            <p className="flex-1 min-w-0 text-right">
              {subItem.amount} THB
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LiabilitiesDetailContent({
  totalAmount,
  detail,
}: {
  totalAmount: string;
  detail: LiabilitiesDetail;
}) {
  const t = useT();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(["debt"]));
  const allExpanded = detail.categories.length > 0 && detail.categories.every((c) => expandedIds.has(c.id));

  const toggleId = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleExpandCollapseAll = () =>
    setExpandedIds(allExpanded ? new Set() : new Set(detail.categories.map((c) => c.id)));

  // Nothing owed: say so, rather than a blank donut over an empty list with an
  // "Expand all" that has nothing to expand.
  if (detail.categories.length === 0) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <EmptyState
          size="compact"
          icon={<CreditCardIcon size={32} weight="duotone" className="text-[var(--text-default-placeholder)]" />}
          title={t.client.liabilities.empty}
        />
        <p className="type-caption text-[var(--text-default-tertiary)] leading-4 text-center w-full">
          {t.client.liabilities.lastUpdated(detail.lastUpdated)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg p-4 w-full">
        <div className="flex gap-3 items-center w-full">
          <LiabilitiesDonutChart categories={detail.categories} />
          <div className="flex flex-1 flex-col items-start justify-center min-w-0">
            {detail.categories.map((category) => (
              <LiabilitiesLegendItem key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExpandCollapseAll}
            className="type-caption text-primary-action font-medium hover:underline cursor-pointer"
          >
            {allExpanded ? t.client.assets.collapseAll : t.client.assets.expandAll}
          </button>
        </div>
        {detail.categories.map((category) => (
          <LiabilityCategoryCard
            key={category.id}
            category={category}
            totalAmount={totalAmount}
            expanded={expandedIds.has(category.id)}
            onToggle={() => toggleId(category.id)}
          />
        ))}
      </div>

      <p className="type-caption text-[var(--text-default-tertiary)] leading-4 text-center w-full">
        {t.client.liabilities.lastUpdated(detail.lastUpdated)}
      </p>
    </div>
  );
}

export function LiabilitiesDetailModal({
  open,
  totalAmount,
  detail,
  onClose,
}: {
  open: boolean;
  totalAmount: string;
  detail: LiabilitiesDetail;
  onClose: () => void;
}) {
  const t = useT();
  const isMobile = useIsMobile();

  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={t.client.liabilities.modalTitle}
      titleId="liabilities-modal-title"
      desktopMaxWidth="max-w-[704px]"
      desktopTitleClassName="leading-7"
    >
      <div className="flex-1 min-h-0 overflow-y-auto pt-4 pb-6">
        <div className={`flex flex-col gap-6 ${isMobile ? "px-2" : "px-6"}`}>
          <LiabilitiesDetailContent totalAmount={totalAmount} detail={detail} />
        </div>
      </div>
    </ResponsiveBottomSheetModal>
  );
}
