"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, WalletIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { Tag, useIsMobile } from "@sarunyu/system-one";
import { ProfitLossBadge, DashedDivider, StatCardRow } from "@/components/ui/finance-ui";
import { displayAssetLabel, formatThbDecimal, parseAmount } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import type {
  AssetAccountDetail,
  HoldingItem,
  HoldingSection,
  PositionSummary,
} from "@/types/portfolio";

function HoldingSummary({ sections }: { sections: HoldingSection[] }) {
  const t = useT();
  const allItems = sections.flatMap((s) => s.items);
  const totalValue = allItems.reduce((sum, item) => sum + parseAmount(item.value), 0);
  const totalChange = allItems.reduce((sum, item) => {
    if (!item.changeAmount) return sum;
    return sum + parseAmount(item.changeAmount);
  }, 0);
  const isPositive = totalChange >= 0;

  return (
    <StatCardRow
      stats={[
        {
          label: t.client.assets.totalValue,
          value: (
            <>
              {formatThbDecimal(totalValue)}{" "}
              <span className="type-body-2 font-normal text-muted-foreground">THB</span>
            </>
          ),
        },
        {
          label: t.client.assets.pl,
          value: (
            <span
              className={isPositive ? "text-[var(--text-success-primary)]" : "text-destructive"}
            >
              {isPositive ? "+" : ""}
              {formatThbDecimal(totalChange)}
            </span>
          ),
        },
      ]}
    />
  );
}

function PositionSummaryPanel({ position }: { position: PositionSummary }) {
  const t = useT();
  return (
    <div className="flex w-full flex-col gap-2 px-1 pb-1">
      <p className="type-caption leading-4 font-semibold text-[var(--text-default-secondary)]">
        {t.client.assets.positionSummary}
      </p>
      <div className="flex w-full flex-wrap gap-2">
        {position.fields.map((field) => (
          <div key={field.id} className="flex h-9 w-[calc(50%-4px)] shrink-0 flex-col items-start">
            <p className="type-caption h-4 w-full truncate leading-4 text-[var(--text-default-placeholder)]">
              {t.client.assets.position[field.id]}
            </p>
            <p className="type-body-2 w-full leading-5 text-[var(--text-default-primary)]">
              {field.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldingCard({
  item,
  expanded,
  onToggle,
}: {
  item: HoldingItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const avgCost = item.position?.fields.find((f) => f.id === "avgCost")?.value;

  const header = (
    <>
      <div className="flex min-w-0 flex-1 flex-col items-end justify-center">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 self-stretch">
            <p className="type-subtitle-2 shrink-0 leading-5 font-bold text-[var(--text-default-primary)]">
              {item.symbol}
            </p>
            {item.collateral && (
              <Tag text={t.client.assets.collateral} variant="blue" size="small" />
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 text-right whitespace-nowrap">
            <p className="type-subtitle-2 leading-5 font-bold text-[var(--text-default-primary)]">
              {item.value}
            </p>
            <p className="type-body-2 leading-5 text-[var(--text-default-tertiary)]">THB</p>
          </div>
        </div>
        <div className="flex w-full items-center gap-2">
          <p className="type-caption min-w-0 flex-1 truncate leading-4 text-[var(--text-default-tertiary)]">
            {item.fullName}
          </p>
          <ProfitLossBadge
            changeAmount={item.changeAmount}
            changePercent={item.changePercent}
            changePositive={item.changePositive}
          />
        </div>
        {avgCost && (
          <div className="flex w-full items-center justify-end">
            <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
              {t.client.assets.avgCost(avgCost)}
            </p>
          </div>
        )}
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
          className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
          onClick={onToggle}
          aria-expanded={false}
        >
          {header}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2 overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white px-3 py-2">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-2 text-left transition-opacity hover:opacity-80"
        onClick={onToggle}
        aria-expanded
      >
        {header}
      </button>

      {item.position && (
        <>
          <DashedDivider />
          <PositionSummaryPanel position={item.position} />
        </>
      )}
    </div>
  );
}

function HoldingSectionBlock({
  title,
  items,
  expandedIds,
  onToggle,
  isLast = false,
  compactHorizontalPadding = false,
  headerRight,
}: {
  title: string;
  items: HoldingItem[];
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  isLast?: boolean;
  compactHorizontalPadding?: boolean;
  headerRight?: React.ReactNode;
}) {
  const t = useT();
  const sectionX = compactHorizontalPadding ? "px-4" : "px-6";

  return (
    <div className="flex w-full flex-col">
      <div className={`flex items-center ${sectionX} w-full py-2`}>
        <p className="type-caption flex-1 leading-4 font-semibold text-[var(--text-default-tertiary)]">
          {displayAssetLabel(title, t)}
        </p>
        {headerRight}
      </div>
      <div className={`flex flex-col items-start gap-2 ${sectionX} w-full ${isLast ? "" : "pb-4"}`}>
        {items.map((item) => (
          <HoldingCard
            key={item.id}
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function HoldingDetailContent({ detail }: { detail: AssetAccountDetail }) {
  const t = useT();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const allIds = detail.sections.flatMap((s) => s.items.map((i) => i.id));
  const allExpanded = allIds.length > 0 && allIds.every((id) => expandedIds.has(id));

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(allExpanded ? new Set() : new Set(allIds));
  };

  if (detail.sections.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={
          <WalletIcon
            size={40}
            weight="duotone"
            className="text-[var(--text-default-placeholder)]"
          />
        }
        title={t.client.assets.noHoldingsTitle}
        body={t.client.assets.noHoldingsBody}
      />
    );
  }

  return (
    <div className="pb-6">
      <HoldingSummary sections={detail.sections} />
      <div className="pt-2" />
      {detail.sections.map((section, index) => (
        <HoldingSectionBlock
          key={section.title}
          title={section.title}
          items={section.items}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          isLast={index === detail.sections.length - 1}
          compactHorizontalPadding={isMobile}
          headerRight={
            index === 0 ? (
              <button
                type="button"
                onClick={handleExpandAll}
                className="type-caption text-primary-action cursor-pointer font-medium hover:underline"
              >
                {allExpanded ? t.client.assets.collapseAll : t.client.assets.expandAll}
              </button>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
