"use client";

import { useState } from "react";
import { CaretDownIcon, WalletIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ALLOCATION_SLICES,
  AllocationBreakdownSidebar,
  HeroCard,
  LastUpdated,
  LiabilitiesBar,
} from "./AssetSummarySection";
import type {
  AssetAccountItem,
  AssetAllocationSlice,
  AssetHeroSummary,
  LiabilitiesDetail,
} from "@/types/portfolio";
import { HoldingDetailContent } from "./HoldingDetailContent";
import {
  useClientAssetAccounts,
  useClientDetails,
  useHoldingDetail,
  useLiabilities,
} from "@/features/clients/hooks/use-clients";
import {
  ASSET_CLASS,
  buildHeroSummaryFromClient,
  formatLiabilitiesStr,
  formatThbAmount,
  parseAmount,
  type ClientSummaryInput,
} from "@/lib/client-utils";
import {
  AssetAccountCard,
  AssetDetailDrawerHeader,
  type AssetListViewMode,
} from "./AssetAccountCard";
import { useLocale, useT } from "@/i18n/I18nProvider";

export type { AssetListViewMode } from "./AssetAccountCard";

/** Option order; labels come from `t.client.assets` at render. */
const ASSET_LIST_VIEW_OPTIONS: AssetListViewMode[] = ["product", "account"];

function buildProductItems(netValue: string, slices: AssetAllocationSlice[]): AssetAccountItem[] {
  const total = parseAmount(netValue);

  return slices
    .filter((slice) => slice.percent > 0)
    .map((slice) => ({
      name: slice.label,
      accountNo: `${slice.percent}%`,
      value: formatThbAmount(total * (slice.percent / 100)),
      changeAmount: "+1,234.00",
      changePercent: "0.05",
      changePositive: true,
      statusIcon: slice.statusIcon,
      ...(slice.label === ASSET_CLASS.bond ? { avgYield: "7.32" } : {}),
    }));
}

function AssetListHeader({
  viewMode,
  onViewModeChange,
}: {
  viewMode: AssetListViewMode;
  onViewModeChange: (mode: AssetListViewMode) => void;
}) {
  const t = useT();
  const viewLabel = (mode: AssetListViewMode) =>
    mode === "account" ? t.client.assets.byAccount : t.client.assets.byProduct;
  const selected =
    ASSET_LIST_VIEW_OPTIONS.find((option) => option === viewMode) ?? ASSET_LIST_VIEW_OPTIONS[0];

  return (
    <div className="flex w-full items-center justify-between px-4">
      <p className="type-subtitle-1 leading-6 font-bold whitespace-nowrap text-[var(--text-default-primary)]">
        {t.client.assets.assetList}
      </p>
      <div className="relative">
        <select
          value={viewMode}
          onChange={(event) => onViewModeChange(event.target.value as AssetListViewMode)}
          aria-label={t.client.assets.filterAria}
          className="absolute inset-0 z-[1] h-full w-full cursor-pointer opacity-0"
        >
          {ASSET_LIST_VIEW_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {viewLabel(option)}
            </option>
          ))}
        </select>
        <div className="pointer-events-none flex items-center gap-0.5 rounded-md border border-[rgba(0,0,0,0.1)] bg-white py-1 pr-1.5 pl-2">
          <span className="type-button leading-5 text-[var(--text-default-primary)]">
            {viewLabel(selected)}
          </span>
          <CaretDownIcon size={18} className="shrink-0 text-[var(--text-default-tertiary)]" />
        </div>
      </div>
    </div>
  );
}

export function ClientAssetSidebarContent({
  clientId,
  client,
  heroSummary,
  liabilities,
  allocationSlices = ALLOCATION_SLICES,
  assetAccounts: assetAccountsProp,
  accordionCards,
  onItemClick,
  onLiabilitiesOpen,
}: {
  clientId: string;
  client: ClientSummaryInput;
  heroSummary?: AssetHeroSummary;
  liabilities?: string;
  allocationSlices?: AssetAllocationSlice[];
  assetAccounts?: AssetAccountItem[];
  accordionCards?: boolean;
  onItemClick?: (item: AssetAccountItem, viewMode: AssetListViewMode) => void;
  onLiabilitiesOpen?: (amount: string, detail: LiabilitiesDetail) => void;
}) {
  const locale = useLocale();
  const t = useT();
  const [viewMode, setViewMode] = useState<AssetListViewMode>("product");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  // Desktop list+detail layout (accordionCards): key of the row whose detail
  // is shown in the side panel, or null to show the summary there instead.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const detail = useClientDetails().data[clientId];
  const fetchedAccounts = useClientAssetAccounts(clientId).data;
  const assetAccounts = assetAccountsProp ?? fetchedAccounts;
  const summary = heroSummary ?? detail?.assetSummary ?? buildHeroSummaryFromClient(client, locale);

  const liabilitiesAmount = liabilities ?? formatLiabilitiesStr(client.aum);

  const slices = detail?.assetSummary?.allocationSlices ?? allocationSlices;

  const lastUpdatedLabel = `${summary.lastUpdatedDate} - ${summary.lastUpdatedTime}`;
  const liabilitiesDetail = useLiabilities(liabilitiesAmount, lastUpdatedLabel);
  const openLiabilities = () => {
    if (liabilitiesDetail) onLiabilitiesOpen?.(liabilitiesAmount, liabilitiesDetail);
  };

  const listItems =
    viewMode === "account" ? assetAccounts : buildProductItems(summary.netValue, slices);

  const cardKeys = listItems.map((item) => `${viewMode}-${item.accountNo}-${item.name}`);
  const allExpanded = cardKeys.length > 0 && cardKeys.every((k) => expandedCards.has(k));

  const toggleCard = (key: string) =>
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const handleExpandCollapseAll = () =>
    setExpandedCards(allExpanded ? new Set() : new Set(cardKeys));

  // No accounts / no positive slices: one line saying so, in place of an empty
  // list under an "Expand all" with nothing to expand.
  const listEmpty = listItems.length === 0;
  const emptyList = (
    <EmptyState
      size="compact"
      icon={
        <WalletIcon size={32} weight="duotone" className="text-[var(--text-default-placeholder)]" />
      }
      title={t.client.assets.noAssets}
    />
  );

  const selectedIndex = cardKeys.findIndex((k) => k === selectedKey);
  const selectedItem = accordionCards && selectedIndex >= 0 ? listItems[selectedIndex] : null;
  const selectedDetail = useHoldingDetail(viewMode, selectedItem);

  if (accordionCards) {
    return (
      <div className="w-full">
        {/* Mobile / tablet — stacked, tap-to-expand-inline (no room for a side panel) */}
        <div className="flex flex-col gap-6 lg:hidden">
          <div className="flex flex-col gap-2">
            <HeroCard summary={summary} />
            <LiabilitiesBar amount={liabilitiesAmount} onClick={openLiabilities} />
            <LastUpdated summary={summary} />
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-3 md:p-4">
            <AssetListHeader
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                setExpandedCards(new Set());
              }}
            />
            <div className="flex flex-col gap-4">
              <AllocationBreakdownSidebar slices={slices} />
              {listEmpty ? (
                emptyList
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleExpandCollapseAll}
                      className="type-caption text-primary-action cursor-pointer font-medium hover:underline"
                    >
                      {allExpanded ? t.client.assets.collapseAll : t.client.assets.expandAll}
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {listItems.map((item, i) => (
                      <AssetAccountCard
                        key={cardKeys[i]}
                        account={item}
                        viewMode={viewMode}
                        accordion
                        open={expandedCards.has(cardKeys[i])}
                        onToggle={() => toggleCard(cardKeys[i])}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Desktop — list on the left (60%), summary sticky on the right (40%).
            Clicking a row opens its detail in a drawer sliding in from the
            right, so the net-value card up top is never covered. */}
        <div className="hidden grid-cols-[3fr_2fr] items-start gap-6 lg:grid">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-white p-4">
            <AssetListHeader
              viewMode={viewMode}
              onViewModeChange={(mode) => {
                setViewMode(mode);
                setSelectedKey(null);
              }}
            />
            <div className="flex flex-col gap-4">
              <AllocationBreakdownSidebar slices={slices} />
              {listEmpty ? (
                emptyList
              ) : (
                <div className="flex flex-col gap-3">
                  {listItems.map((item, i) => (
                    <AssetAccountCard
                      key={cardKeys[i]}
                      account={item}
                      viewMode={viewMode}
                      selected={selectedKey === cardKeys[i]}
                      onClick={() => setSelectedKey(cardKeys[i])}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="sticky top-24 flex flex-col gap-2">
            <HeroCard summary={summary} />
            <LiabilitiesBar amount={liabilitiesAmount} onClick={openLiabilities} />
            <LastUpdated summary={summary} />
            {selectedItem && selectedDetail && (
              <div
                key={selectedKey}
                className="mt-4 animate-in overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white duration-200 fade-in slide-in-from-top-2"
              >
                <AssetDetailDrawerHeader item={selectedItem} onClose={() => setSelectedKey(null)} />
                <div>
                  <HoldingDetailContent detail={selectedDetail} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="bg-gradient-to-b from-white to-[#f3f4f6]">
        <div className="flex w-full flex-col items-center gap-2 p-4">
          <HeroCard summary={summary} />
          <LiabilitiesBar amount={liabilitiesAmount} onClick={openLiabilities} />
          <LastUpdated summary={summary} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-t-2xl bg-white py-4">
        <AssetListHeader
          viewMode={viewMode}
          onViewModeChange={(mode) => {
            setViewMode(mode);
            setExpandedCards(new Set());
          }}
        />
        <div className="flex w-full flex-col items-start gap-4 px-4">
          <AllocationBreakdownSidebar slices={slices} />
          <div className="flex w-full flex-col gap-4">
            {listEmpty && emptyList}
            {listItems.map((item, i) => (
              <AssetAccountCard
                key={cardKeys[i]}
                account={item}
                viewMode={viewMode}
                accordion={false}
                onClick={() => onItemClick?.(item, viewMode)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
