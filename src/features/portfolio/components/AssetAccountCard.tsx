"use client";

import { useState } from "react";
import { CaretDownIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { ProfitLossBadge } from "@/components/ui/finance-ui";
import { useHoldingDetail } from "@/features/clients/hooks/use-clients";
import { AssetHoldingAccordion } from "./AssetHoldingRow";
import { displayAssetLabel } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import type { AssetAccountItem } from "@/types/portfolio";

export type AssetListViewMode = "product" | "account";

export function AssetAccountCard({
  account,
  viewMode,
  accordion,
  open: controlledOpen,
  onToggle,
  onClick,
  selected,
}: {
  account: AssetAccountItem;
  viewMode: AssetListViewMode;
  accordion?: boolean;
  open?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  /** Highlights the card as the active selection — used by the desktop
   * list+detail layout, where clicking a row opens its detail in the side
   * panel instead of expanding inline. */
  selected?: boolean;
}) {
  const t = useT();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleOpen = onToggle ?? (() => setInternalOpen((p) => !p));
  const detail = useHoldingDetail(viewMode, accordion ? account : null);

  return (
    <div
      className={`w-full overflow-hidden rounded-lg border bg-white transition-colors ${
        selected ? "border-[color:var(--primary-action)]/50" : "border-[rgba(0,0,0,0.1)]"
      }`}
    >
      <button
        type="button"
        className={`flex w-full cursor-pointer items-center gap-2 p-3 text-left transition-colors ${
          selected ? "bg-primary-action-light" : "hover:bg-[var(--bg-default-secondary)]"
        }`}
        onClick={accordion ? toggleOpen : onClick}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="relative size-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- 8px SVG status dot; the image optimizer rejects SVG and a vector has nothing to gain from it */}
            <img alt="" className="block size-full max-w-none" src={account.statusIcon} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="type-subtitle-2 w-full truncate leading-5 whitespace-nowrap text-[var(--text-default-primary)]">
              {displayAssetLabel(account.name, t)}
            </p>
            <p className="type-caption w-full truncate leading-4 text-[var(--text-default-tertiary)]">
              {account.accountNo}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <div className="flex items-center gap-1 text-right whitespace-nowrap">
            <p className="type-subtitle-2 leading-5 font-bold text-[var(--text-default-primary)]">
              {account.value}
            </p>
            <p className="type-body-2 leading-5 text-[var(--text-default-tertiary)]">THB</p>
          </div>
          {account.avgYield ? (
            <p className="type-caption leading-4 whitespace-nowrap text-[var(--text-default-tertiary)]">
              {t.client.assets.avgYield(account.avgYield)}
            </p>
          ) : account.changeAmount && account.changePercent ? (
            <ProfitLossBadge
              changeAmount={account.changeAmount}
              changePercent={account.changePercent}
              changePositive={account.changePositive ?? true}
            />
          ) : null}
        </div>

        {accordion ? (
          <CaretDownIcon
            size={20}
            className={`shrink-0 text-[var(--text-default-tertiary)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        ) : (
          <CaretRightIcon
            size={20}
            className={`shrink-0 transition-colors ${selected ? "text-primary-action" : "text-[var(--text-default-tertiary)]"}`}
          />
        )}
      </button>

      {accordion && open && detail && <AssetHoldingAccordion detail={detail} />}
    </div>
  );
}

/** Header row shown at the top of the asset detail panel — icon, name,
 * account number, and value, matching the row that was clicked.
 * Pass `onClose` to show a close button; omit it when a drawer provides its own. */
export function AssetDetailDrawerHeader({
  item,
  onClose,
}: {
  item: AssetAccountItem;
  onClose?: () => void;
}) {
  const t = useT();
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
      <span className="relative size-2 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- 8px SVG status dot, see above */}
        <img alt="" className="block size-full max-w-none" src={item.statusIcon} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="type-subtitle-2 truncate leading-5 font-bold text-[var(--text-default-primary)]">
          {displayAssetLabel(item.name, t)}
        </p>
        <p className="type-caption truncate leading-4 text-[var(--text-default-tertiary)]">
          {item.accountNo}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 whitespace-nowrap">
        <p className="type-subtitle-2 leading-5 font-bold text-[var(--text-default-primary)]">
          {item.value}
        </p>
        <p className="type-body-2 leading-5 text-[var(--text-default-tertiary)]">THB</p>
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded text-[var(--text-default-tertiary)] transition-colors hover:bg-[var(--bg-default-secondary)] hover:text-[var(--text-default-secondary)]"
          aria-label={t.client.assets.closeDetail}
        >
          <XIcon size={16} />
        </button>
      ) : (
        <div className="w-8 shrink-0" />
      )}
    </div>
  );
}
