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
function LiabilitiesDonutChart({ categories }: { categories: LiabilityCategory[] }) {
  const t = useT();
  return (
    <AllocationDonut
      slices={categories.map((c) => ({
        label: t.client.liabilities.categories[c.id] ?? c.label,
        percent: c.percent,
        color: c.color,
      }))}
      size={96}
    />
  );
}

function LiabilitiesLegendItem({ category }: { category: LiabilityCategory }) {
  const t = useT();
  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1 px-2 py-1">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <p className="truncate text-label leading-[20px] font-normal text-[var(--text-default-tertiary)]">
          {t.client.liabilities.categories[category.id] ?? category.label}
        </p>
      </div>
      <p className="shrink-0 text-label leading-[20px] font-normal text-[var(--text-default-tertiary)]">
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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <p className="text-body leading-[24px] font-bold whitespace-nowrap text-[var(--text-default-primary)]">
          {t.client.liabilities.categories[category.id] ?? category.label}
        </p>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end">
        <div className="flex items-center gap-1 text-right whitespace-nowrap">
          <p className="text-body leading-[24px] font-bold text-[var(--text-default-primary)]">
            {amount}
          </p>
          <p className="text-body leading-[24px] font-normal text-[var(--text-default-tertiary)]">
            THB
          </p>
        </div>
      </div>

      {expanded ? (
        <CaretUpIcon size={20} className="shrink-0 text-[var(--text-default-tertiary)]" />
      ) : (
        <CaretDownIcon size={20} className="shrink-0 text-[var(--text-default-tertiary)]" />
      )}
    </>
  );

  if (!expanded) {
    return (
      <div className="w-full overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white">
        <button
          type="button"
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-4 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
          onClick={onToggle}
          aria-expanded={false}
        >
          {headerRow}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white px-3 pt-2 pb-4">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 py-2 text-left transition-opacity hover:opacity-80"
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
            className="flex w-full items-center gap-2 text-label leading-[20px] font-normal text-[var(--text-default-tertiary)]"
          >
            <p className="min-w-0 flex-1">{subItem.label}</p>
            <p className="min-w-0 flex-1 text-right">{subItem.amount} THB</p>
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
  const allExpanded =
    detail.categories.length > 0 && detail.categories.every((c) => expandedIds.has(c.id));

  const toggleId = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleExpandCollapseAll = () =>
    setExpandedIds(allExpanded ? new Set() : new Set(detail.categories.map((c) => c.id)));

  // Nothing owed: say so, rather than a blank donut over an empty list with an
  // "Expand all" that has nothing to expand.
  if (detail.categories.length === 0) {
    return (
      <div className="flex w-full flex-col gap-4">
        <EmptyState
          size="compact"
          icon={
            <CreditCardIcon
              size={32}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title={t.client.liabilities.empty}
        />
        <p className="type-caption w-full text-center leading-4 text-[var(--text-default-tertiary)]">
          {t.client.liabilities.lastUpdated(detail.lastUpdated)}
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="w-full rounded-lg border border-[rgba(0,0,0,0.1)] bg-white p-4">
        <div className="flex w-full items-center gap-3">
          <LiabilitiesDonutChart categories={detail.categories} />
          <div className="flex min-w-0 flex-1 flex-col items-start justify-center">
            {detail.categories.map((category) => (
              <LiabilitiesLegendItem key={category.id} category={category} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleExpandCollapseAll}
            className="type-caption text-primary-action cursor-pointer font-medium hover:underline"
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

      <p className="type-caption w-full text-center leading-4 text-[var(--text-default-tertiary)]">
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
      <div className="min-h-0 flex-1 overflow-y-auto pt-4 pb-6">
        <div className={`flex flex-col gap-6 ${isMobile ? "px-2" : "px-6"}`}>
          <LiabilitiesDetailContent totalAmount={totalAmount} detail={detail} />
        </div>
      </div>
    </ResponsiveBottomSheetModal>
  );
}
