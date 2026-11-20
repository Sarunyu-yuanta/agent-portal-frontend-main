"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { ProfitLossBadge } from "@/components/ui/finance-ui";
import type { AssetAccountDetail, HoldingItem } from "@/data/asset-account-details";
import { displayAssetLabel } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";

function HoldingItemRow({
  item,
  open,
  onToggle,
}: {
  item: HoldingItem;
  open: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  const hasPosition = item.position && item.position.fields.length > 0;
  const avgCost = item.position?.fields.find((f) => f.id === "avgCost")?.value;

  return (
    <div
      className={`overflow-hidden rounded-md border ${open ? "border-[rgba(0,0,0,0.1)] bg-[var(--bg-default-secondary)]" : "border-transparent"}`}
    >
      <button
        type="button"
        className={`flex w-full items-center gap-2 px-2 py-1.5 text-left transition-colors ${!open ? "hover:bg-[rgba(0,0,0,0.04)]" : ""}`}
        onClick={() => hasPosition && onToggle()}
        style={{ cursor: hasPosition ? "pointer" : "default" }}
      >
        <div className="min-w-0 flex-1">
          <p className="type-caption leading-4 font-semibold text-[var(--text-default-primary)]">
            {item.symbol}
          </p>
          <p className="type-caption truncate leading-4 text-[var(--text-default-tertiary)]">
            {item.fullName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <p className="type-caption font-bold text-[var(--text-default-primary)]">{item.value}</p>
          {avgCost && (
            <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
              {t.client.assets.avgCost(avgCost)}
            </p>
          )}
          <ProfitLossBadge
            changeAmount={item.changeAmount}
            changePercent={item.changePercent}
            changePositive={item.changePositive}
          />
        </div>
        {hasPosition && (
          <CaretDownIcon
            size={14}
            className={`shrink-0 text-[var(--text-default-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && hasPosition && (
        <div className="flex flex-col gap-1 px-2 pb-2">
          {item.position!.fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between gap-2">
              <p className="type-caption leading-4 text-[var(--text-default-tertiary)]">
                {t.client.assets.position[field.id]}
              </p>
              <p className="type-caption shrink-0 leading-4 font-semibold text-[var(--text-default-primary)]">
                {field.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AssetHoldingAccordion({ detail }: { detail: AssetAccountDetail }) {
  const t = useT();
  const allItems = detail.sections.flatMap((s) => s.items);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const allExpanded = allItems.length > 0 && allItems.every((item) => expandedIds.has(item.id));

  const toggleItem = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleExpandCollapseAll = () =>
    setExpandedIds(allExpanded ? new Set() : new Set(allItems.map((i) => i.id)));

  return (
    <div className="divide-y divide-[rgba(0,0,0,0.04)] border-t border-[rgba(0,0,0,0.06)]">
      {detail.sections.map((section, sIdx) => (
        <div key={section.title} className="flex flex-col gap-2 px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="type-caption leading-5 font-bold text-[var(--text-default-secondary)]">
              {displayAssetLabel(section.title, t)}
            </p>
            {sIdx === 0 && (
              <button
                type="button"
                onClick={handleExpandCollapseAll}
                className="type-caption text-primary-action cursor-pointer font-medium hover:underline"
              >
                {allExpanded ? t.client.assets.collapseAll : t.client.assets.expandAll}
              </button>
            )}
          </div>
          {section.items.map((item) => (
            <HoldingItemRow
              key={item.id}
              item={item}
              open={expandedIds.has(item.id)}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
