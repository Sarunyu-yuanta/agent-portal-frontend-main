"use client";

import { useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { ProfitLossBadge } from "@/components/ui/finance-ui";
import type {
  AssetAccountDetail,
  HoldingItem,
} from "@/data/asset-account-details";
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
    <div className={`rounded-md overflow-hidden border ${open ? "border-[rgba(0,0,0,0.1)] bg-[var(--bg-default-secondary)]" : "border-transparent"}`}>
      <button
        type="button"
        className={`flex items-center gap-2 py-1.5 w-full text-left transition-colors px-2 ${!open ? "hover:bg-[rgba(0,0,0,0.04)]" : ""}`}
        onClick={() => hasPosition && onToggle()}
        style={{ cursor: hasPosition ? "pointer" : "default" }}
      >
        <div className="flex-1 min-w-0">
          <p className="type-caption font-semibold text-[var(--text-default-primary)] leading-4">
            {item.symbol}
          </p>
          <p className="type-caption text-[var(--text-default-tertiary)] truncate leading-4">
            {item.fullName}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <p className="type-caption font-bold text-[var(--text-default-primary)]">
            {item.value}
          </p>
          {avgCost && (
            <p className="type-caption text-[var(--text-default-tertiary)] leading-4 whitespace-nowrap">
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
            className={`text-[var(--text-default-tertiary)] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {open && hasPosition && (
        <div className="px-2 pb-2 flex flex-col gap-1">
          {item.position!.fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between gap-2">
              <p className="type-caption text-[var(--text-default-tertiary)] leading-4">{t.client.assets.position[field.id]}</p>
              <p className="type-caption font-semibold text-[var(--text-default-primary)] leading-4 shrink-0">{field.value}</p>
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleExpandCollapseAll = () =>
    setExpandedIds(allExpanded ? new Set() : new Set(allItems.map((i) => i.id)));

  return (
    <div className="border-t border-[rgba(0,0,0,0.06)] divide-y divide-[rgba(0,0,0,0.04)]">
      {detail.sections.map((section, sIdx) => (
        <div key={section.title} className="px-3 py-2 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="type-caption font-bold text-[var(--text-default-secondary)] leading-5">
              {displayAssetLabel(section.title, t)}
            </p>
            {sIdx === 0 && (
              <button
                type="button"
                onClick={handleExpandCollapseAll}
                className="type-caption text-primary-action font-medium hover:underline cursor-pointer"
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
