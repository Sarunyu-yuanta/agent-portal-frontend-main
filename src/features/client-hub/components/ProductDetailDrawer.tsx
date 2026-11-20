"use client";

import { useState } from "react";
import { Avatar, TabGroup, Toaster } from "@sarunyu/system-one";
import { CaretRightIcon, CaretDownIcon, UsersIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { useToasts } from "@/hooks/use-toasts";
import { StatCardRow } from "@/components/ui/finance-ui";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials, formatThbAmount } from "@/lib/client-utils";
import { PRODUCT_SUB_DATA, type SubProduct } from "@/mocks/product-sub-data";
import { ClientDetailPanel } from "./ClientDetailPanel";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { ProductRow } from "@/types/portfolio";

/** Content of the product drawer: stats, holdings/clients tabs, and a pushed
 * client detail overlay. Owns its own tab/expand/push state so remounting on a
 * new product resets it. */
export function ProductDetailDrawer({
  product,
  clients,
  onViewFullProfile,
}: {
  product: ProductRow;
  clients: Client[];
  onViewFullProfile: (clientId: string) => void;
}) {
  const t = useT();
  const d = t.client.productDrawer;
  const { isPrivate } = usePrivacy();
  const subProducts: SubProduct[] = PRODUCT_SUB_DATA[product.label] ?? [];
  const hasSub = subProducts.length > 0;
  const [tab, setTab] = useState<"sub" | "clients">(hasSub ? "sub" : "clients");
  const [expandedSubIds, setExpandedSubIds] = useState<Set<string>>(new Set());
  const push = useSlideOver<Client>();
  const { toasts, addToast, removeToast } = useToasts();

  // A holder whose client isn't in the loaded list can't open a panel — say
  // so instead of leaving the press doing nothing.
  const openClient = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (c) push.open(c);
    else addToast({ status: "warning", message: t.states.notFoundClient });
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border-default)] px-5 py-4">
        <span className="relative size-3 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG status dot; the image optimizer rejects SVG */}
          <img alt="" className="block size-full max-w-none" src={product.statusIcon} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="type-subtitle-1 truncate font-bold text-foreground">{product.label}</p>
          <p className="type-caption text-muted-foreground">{d.clientCount(product.clientCount)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0">
        <StatCardRow
          stats={[
            {
              label: d.totalAum,
              value: (
                <>
                  {formatThbAmount(product.totalAmountThb)}{" "}
                  <span className="type-body-2 font-normal text-muted-foreground">THB</span>
                </>
              ),
            },
            {
              label: d.avgAllocation,
              value: `${product.avgAllocationPct.toFixed(1)}%`,
            },
          ]}
        />
      </div>

      {/* Tabs */}
      {hasSub && (
        <div className="shrink-0 px-4 pt-3 pb-0">
          <TabGroup
            items={[
              { id: "sub", title: d.holdingsTab(subProducts.length) },
              { id: "clients", title: d.clientsTab(product.clientCount) },
            ]}
            activeId={tab}
            size="sm"
            onChange={(id) => setTab(id as "sub" | "clients")}
          />
        </div>
      )}

      <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* Sub-products tab */}
        {hasSub && tab === "sub" && (
          <div className="flex flex-col gap-2 p-4">
            {/* Expand / Collapse All */}
            <div className="sticky top-0 z-10 -mx-4 flex justify-end bg-white px-4 py-1">
              {expandedSubIds.size === subProducts.length ? (
                <button
                  type="button"
                  className="cursor-pointer text-label text-blue-600 hover:underline"
                  onClick={() => setExpandedSubIds(new Set())}
                >
                  {t.client.assets.collapseAll}
                </button>
              ) : (
                <button
                  type="button"
                  className="cursor-pointer text-label text-blue-600 hover:underline"
                  onClick={() => setExpandedSubIds(new Set(subProducts.map((s) => s.id)))}
                >
                  {t.client.assets.expandAll}
                </button>
              )}
            </div>
            {subProducts.map((sub) => {
              const isExpanded = expandedSubIds.has(sub.id);
              // Use first N holders as mock client data for this sub-product
              const subHolders = product.holders.slice(0, sub.clientCount);
              return (
                <div
                  key={sub.id}
                  className="overflow-hidden rounded-lg border border-[rgba(0,0,0,0.1)] bg-white"
                >
                  {/* Card header — clickable */}
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                    onClick={() =>
                      setExpandedSubIds((prev) => {
                        const next = new Set(prev);
                        if (isExpanded) next.delete(sub.id);
                        else next.add(sub.id);
                        return next;
                      })
                    }
                  >
                    {/* Ticker + name */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        {sub.ticker && (
                          <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-meta font-bold text-blue-600">
                            {sub.ticker}
                          </span>
                        )}
                        <p className="truncate text-body-sm font-semibold text-foreground">
                          {sub.name}
                        </p>
                      </div>
                      <p className="text-label text-muted-foreground">
                        {formatThbAmount(sub.totalAmountThb)} THB
                      </p>
                    </div>

                    {/* Client count badge (prominent) */}
                    <div className="flex min-w-[52px] shrink-0 flex-col items-center rounded-lg bg-[var(--bg-default-secondary)] px-3 py-1.5">
                      <span className="text-title leading-none font-bold text-foreground">
                        {sub.clientCount}
                      </span>
                      <span className="mt-0.5 text-meta leading-tight text-muted-foreground">
                        {d.clientsBadge(sub.clientCount)}
                      </span>
                    </div>

                    {/* Chevron */}
                    <CaretDownIcon
                      size={20}
                      className={`shrink-0 text-[var(--text-default-tertiary)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Expanded client list */}
                  {isExpanded && (
                    <div className="border-t border-[rgba(0,0,0,0.07)]">
                      {subHolders.map((holder) => (
                        <button
                          key={holder.clientId}
                          type="button"
                          className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                          onClick={() => openClient(holder.clientId)}
                        >
                          <Avatar
                            type="text"
                            initials={getInitials(maskName(holder.clientName, isPrivate))}
                            size="s"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm font-semibold text-foreground">
                              {maskName(holder.clientName, isPrivate)}
                            </p>
                            <p className="type-caption text-muted-foreground">
                              {holder.clientId} · {holder.tier}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-label font-bold text-foreground">
                              {holder.allocationPct.toFixed(1)}%
                            </p>
                            <p className="type-caption text-muted-foreground">
                              {formatThbAmount(holder.amountThb)} THB
                            </p>
                          </div>
                          <CaretRightIcon
                            size={20}
                            className="shrink-0 text-[var(--text-default-tertiary)]"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Clients tab */}
        {(!hasSub || tab === "clients") && (
          <div className="flex flex-col gap-2 p-4">
            {product.holders.length === 0 && (
              <EmptyState
                size="compact"
                icon={
                  <UsersIcon
                    size={32}
                    weight="duotone"
                    className="text-[var(--text-default-placeholder)]"
                  />
                }
                title={d.noHolders}
              />
            )}
            {product.holders.map((holder) => (
              <button
                key={holder.clientId}
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[rgba(0,0,0,0.1)] bg-white p-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                onClick={() => openClient(holder.clientId)}
              >
                <Avatar
                  type="text"
                  initials={getInitials(maskName(holder.clientName, isPrivate))}
                  size="s"
                />
                <div className="min-w-0 flex-1">
                  <p className="type-subtitle-2 truncate font-semibold text-foreground">
                    {maskName(holder.clientName, isPrivate)}
                  </p>
                  <p className="type-caption text-muted-foreground">
                    {holder.clientId} · {holder.tier}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="type-subtitle-2 font-bold text-foreground">
                    {holder.allocationPct.toFixed(1)}%
                  </p>
                  <p className="type-caption text-muted-foreground">
                    {formatThbAmount(holder.amountThb)} THB
                  </p>
                </div>
                <CaretRightIcon
                  size={20}
                  className="shrink-0 text-[var(--text-default-tertiary)]"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <Toaster items={toasts} onRemove={removeToast} />

      {/* Push overlay: client detail */}
      {push.mounted && push.data && (
        <SlideOverPanel visible={push.visible}>
          <ClientDetailPanel
            client={push.data}
            onViewFull={() => onViewFullProfile(push.data!.id)}
            onBack={push.close}
          />
        </SlideOverPanel>
      )}
    </div>
  );
}
