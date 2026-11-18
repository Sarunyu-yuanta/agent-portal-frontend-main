"use client";

import { useEffect, useState } from "react";
import { BottomSheet, Button, Chip, useIsMobile } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";
import {
  EMPTY_ROBO_ADVISORY_FILTERS,
  ROBO_PROVIDER_FILTERS,
  ROBO_REBALANCE_FILTERS,
  ROBO_RISK_FILTERS,
  countRoboAdvisoryFilters,
  type RoboAdvisoryFilters,
  type RoboProviderFilter,
  type RoboRebalanceFilter,
} from "./robo-advisory-filter-data";
import type { RoboRiskTier } from "./robo-risk-level";

/** Figma 33787:152139 — chip group label + wrapped chip row. */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-base leading-[24px] text-[#4a5565]">{title}</p>
      {children}
    </div>
  );
}

type FilterContentProps = {
  draft: RoboAdvisoryFilters;
  onToggleProvider: (provider: RoboProviderFilter) => void;
  onToggleRisk: (risk: RoboRiskTier) => void;
  onToggleRebalance: (rebalance: RoboRebalanceFilter) => void;
};

function FilterContent({ draft, onToggleProvider, onToggleRisk, onToggleRebalance }: FilterContentProps) {
  return (
    <div className="flex w-full flex-col gap-4">
      <FilterSection title="Model type">
        <div className="flex w-full flex-wrap items-center gap-2">
          {ROBO_PROVIDER_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.providers.includes(option.id)}
              onClick={() => onToggleProvider(option.id)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="ความเสี่ยง">
        <div className="flex w-full flex-wrap items-center gap-2">
          {ROBO_RISK_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.risks.includes(option.id)}
              onClick={() => onToggleRisk(option.id)}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rebalance Timing">
        <div className="flex w-full flex-wrap items-center gap-2">
          {ROBO_REBALANCE_FILTERS.map((option) => (
            <Chip
              key={option.id}
              label={option.label}
              size="medium"
              selected={draft.rebalances.includes(option.id)}
              onClick={() => onToggleRebalance(option.id)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterFooter({ onClear, onApply }: { onClear: () => void; onApply: () => void }) {
  return (
    <div className="flex w-full items-start gap-4">
      <Button variant="outline-black" size="xl" className="min-w-0 flex-1 max-w-[343px] text-[#0a6ee7]" onClick={onClear}>
        ล้างตัวเลือก
      </Button>
      <Button variant="primary" size="xl" className="min-w-0 flex-1 max-w-[343px]" onClick={onApply}>
        แสดงผล
      </Button>
    </div>
  );
}

type RoboAdvisoryFilterModalProps = {
  open: boolean;
  filters: RoboAdvisoryFilters;
  onClose: () => void;
  onApply: (filters: RoboAdvisoryFilters) => void;
};

/** Figma 33787:152139 — Robo Advisory filter modal (Model type / ความเสี่ยง / Rebalance Timing). */
export function RoboAdvisoryFilterModal({ open, filters, onClose, onApply }: RoboAdvisoryFilterModalProps) {
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState<RoboAdvisoryFilters>(filters);
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

  const activeCount = countRoboAdvisoryFilters(draft);
  const title = `ตัวกรอง (${activeCount})`;

  const toggleProvider = (provider: RoboProviderFilter) => {
    setDraft((prev) => ({
      ...prev,
      providers: prev.providers.includes(provider)
        ? prev.providers.filter((p) => p !== provider)
        : [...prev.providers, provider],
    }));
  };

  const toggleRisk = (risk: RoboRiskTier) => {
    setDraft((prev) => ({
      ...prev,
      risks: prev.risks.includes(risk) ? prev.risks.filter((r) => r !== risk) : [...prev.risks, risk],
    }));
  };

  const toggleRebalance = (rebalance: RoboRebalanceFilter) => {
    setDraft((prev) => ({
      ...prev,
      rebalances: prev.rebalances.includes(rebalance)
        ? prev.rebalances.filter((r) => r !== rebalance)
        : [...prev.rebalances, rebalance],
    }));
  };

  const clearDraft = () => setDraft(EMPTY_ROBO_ADVISORY_FILTERS);
  const applyDraft = () => onApply(draft);

  const filterContentProps = {
    draft,
    onToggleProvider: toggleProvider,
    onToggleRisk: toggleRisk,
    onToggleRebalance: toggleRebalance,
  };

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={title}
        rightSide="action"
        actionLabel="Close"
        onActionClick={onClose}
        showHandle
        contentClassName="flex max-h-[calc(var(--dvh)*100-8rem)] flex-col gap-6 overflow-y-auto pb-2"
      >
        <FilterContent {...filterContentProps} />
        <FilterFooter onClear={clearDraft} onApply={applyDraft} />
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 py-2.5 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative flex w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-black/10 bg-white"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="robo-advisory-filter-title"
      >
        <div className="flex w-full items-center gap-4 px-4 pt-4">
          <p id="robo-advisory-filter-title" className="min-w-0 flex-1 text-lg font-bold leading-[28px] text-[#101828]">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="flex size-5 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0"
          >
            <XIcon size={20} className="text-[#101828]" />
          </button>
        </div>

        <div className="flex w-full flex-col items-center px-4 pb-6 pt-4">
          <FilterContent {...filterContentProps} />
        </div>

        <div className="flex w-full items-start gap-4 px-4 pb-4">
          <FilterFooter onClear={clearDraft} onApply={applyDraft} />
        </div>
      </div>
    </div>
  );
}
