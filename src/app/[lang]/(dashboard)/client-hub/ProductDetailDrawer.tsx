"use client";

import { useState } from "react";
import { Avatar, TabGroup } from "@sarunyu/system-one";
import { CaretRightIcon, CaretDownIcon } from "@phosphor-icons/react";
import { StatCardRow } from "@/components/ui/finance-ui";
import { useSlideOver, SlideOverPanel } from "@/components/ui/slide-over";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitials, formatThbAmount } from "@/lib/client-utils";
import { PRODUCT_SUB_DATA, type SubProduct } from "@/data/product-sub-data";
import { ClientDetailPanel } from "./ClientDetailPanel";
import type { Client, ProductRow } from "@/types/domain";

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
  const { isPrivate } = usePrivacy();
  const subProducts: SubProduct[] = PRODUCT_SUB_DATA[product.label] ?? [];
  const hasSub = subProducts.length > 0;
  const [tab, setTab] = useState<"sub" | "clients">(hasSub ? "sub" : "clients");
  const [expandedSubIds, setExpandedSubIds] = useState<Set<string>>(new Set());
  const push = useSlideOver<Client>();

  const openClient = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (c) push.open(c);
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-default)] shrink-0">
        <span className="relative shrink-0 size-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG status dot; the image optimizer rejects SVG */}
          <img alt="" className="block size-full max-w-none" src={product.statusIcon} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="type-subtitle-1 font-bold text-foreground truncate">{product.label}</p>
          <p className="type-caption text-muted-foreground">{product.clientCount} clients</p>
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0">
        <StatCardRow
          stats={[
            {
              label: "Total AUM",
              value: (
                <>
                  {formatThbAmount(product.totalAmountThb)}{" "}
                  <span className="type-body-2 font-normal text-muted-foreground">THB</span>
                </>
              ),
            },
            {
              label: "Avg Allocation",
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
              { id: "sub", title: `Holdings (${subProducts.length})` },
              { id: "clients", title: `Clients (${product.clientCount})` },
            ]}
            activeId={tab}
            size="sm"
            onChange={(id) => setTab(id as "sub" | "clients")}
          />
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar">
        {/* Sub-products tab */}
        {hasSub && tab === "sub" && (
          <div className="flex flex-col gap-2 p-4">
            {/* Expand / Collapse All */}
            <div className="flex justify-end sticky top-0 bg-white py-1 -mx-4 px-4 z-10">
              {expandedSubIds.size === subProducts.length ? (
                <button
                  type="button"
                  className="text-label text-blue-600 hover:underline cursor-pointer"
                  onClick={() => setExpandedSubIds(new Set())}
                >
                  Collapse All
                </button>
              ) : (
                <button
                  type="button"
                  className="text-label text-blue-600 hover:underline cursor-pointer"
                  onClick={() => setExpandedSubIds(new Set(subProducts.map((s) => s.id)))}
                >
                  Expand All
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
                  className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg overflow-hidden"
                >
                  {/* Card header — clickable */}
                  <button
                    type="button"
                    className="w-full text-left p-3 flex items-center gap-3 hover:bg-[var(--bg-default-secondary)] transition-colors cursor-pointer"
                    onClick={() => setExpandedSubIds((prev) => {
                      const next = new Set(prev);
                      if (isExpanded) next.delete(sub.id);
                      else next.add(sub.id);
                      return next;
                    })}
                  >
                    {/* Ticker + name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sub.ticker && (
                          <span className="text-meta font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                            {sub.ticker}
                          </span>
                        )}
                        <p className="text-body-sm font-semibold text-foreground truncate">{sub.name}</p>
                      </div>
                      <p className="text-label text-muted-foreground">{formatThbAmount(sub.totalAmountThb)} THB</p>
                    </div>

                    {/* Client count badge (prominent) */}
                    <div className="shrink-0 flex flex-col items-center bg-[var(--bg-default-secondary)] rounded-lg px-3 py-1.5 min-w-[52px]">
                      <span className="text-title font-bold text-foreground leading-none">{sub.clientCount}</span>
                      <span className="text-meta text-muted-foreground leading-tight mt-0.5">clients</span>
                    </div>

                    {/* Chevron */}
                    <CaretDownIcon
                      size={20}
                      className={`text-[var(--text-default-tertiary)] shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* Expanded client list */}
                  {isExpanded && (
                    <div className="border-t border-[rgba(0,0,0,0.07)]">
                      {subHolders.map((holder) => (
                        <button
                          key={holder.clientId}
                          type="button"
                          className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--bg-default-secondary)] transition-colors cursor-pointer"
                          onClick={() => openClient(holder.clientId)}
                        >
                          <Avatar type="text" initials={getInitials(maskName(holder.clientName, isPrivate))} size="s" />
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-semibold text-foreground truncate">{maskName(holder.clientName, isPrivate)}</p>
                            <p className="type-caption text-muted-foreground">{holder.clientId} · {holder.tier}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-label font-bold text-foreground">{holder.allocationPct.toFixed(1)}%</p>
                            <p className="type-caption text-muted-foreground">{formatThbAmount(holder.amountThb)} THB</p>
                          </div>
                          <CaretRightIcon size={20} className="text-[var(--text-default-tertiary)] shrink-0" />
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
            {product.holders.map((holder) => (
              <button
                key={holder.clientId}
                type="button"
                className="bg-white border border-[rgba(0,0,0,0.1)] rounded-lg p-3 flex items-center gap-3 w-full text-left hover:bg-[var(--bg-default-secondary)] transition-colors cursor-pointer"
                onClick={() => openClient(holder.clientId)}
              >
                <Avatar type="text" initials={getInitials(maskName(holder.clientName, isPrivate))} size="s" />
                <div className="flex-1 min-w-0">
                  <p className="type-subtitle-2 font-semibold text-foreground truncate">{maskName(holder.clientName, isPrivate)}</p>
                  <p className="type-caption text-muted-foreground">{holder.clientId} · {holder.tier}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="type-subtitle-2 font-bold text-foreground">{holder.allocationPct.toFixed(1)}%</p>
                  <p className="type-caption text-muted-foreground">{formatThbAmount(holder.amountThb)} THB</p>
                </div>
                <CaretRightIcon size={20} className="text-[var(--text-default-tertiary)] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

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
