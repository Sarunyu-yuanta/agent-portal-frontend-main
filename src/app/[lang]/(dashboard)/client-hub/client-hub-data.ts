/**
 * Client Hub domain layer — pure derivations over the client list.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Everything here is computed on the client TODAY from the mock data. Each
 * function's doc notes which API field should supply the value once a real
 * backend exists, so this file doubles as the spec for what the Client Hub
 * endpoints must return. The liabilities figure below is a placeholder with no
 * real source:
 *   • LIABILITIES_MULTIPLIER (see @/lib/client-utils) — total liabilities
 * Replace it with a real per-client figure from the backend.
 */

import { mockClientDetails, mockKYCData } from "@/lib/mock-data";
import { ALLOCATION_SLICES } from "@/components/AssetSummarySection";
import {
  LIABILITIES_MULTIPLIER,
  displayAssetLabel,
} from "@/lib/client-utils";
import { getNineBoxCell } from "./NineBoxTab";
import type { ProductSortKey, SortKey } from "./types";
import type { Client, ProductRow, ProductHolder } from "@/types/domain";

/** Allocation slices for a client, falling back to the default mix. */
function slicesFor(client: Client) {
  const detail = mockClientDetails[client.id];
  return detail?.assetSummary?.allocationSlices?.length
    ? detail.assetSummary.allocationSlices
    : ALLOCATION_SLICES;
}

/**
 * THB a client holds in one asset class = AUM × (slice percent / 100).
 * Backend: expose per-client, per-asset-class amounts directly so the UI does
 * not have to re-derive them from percentages.
 */
export function getClientSliceAmount(client: Client, label: string): number {
  const pct = slicesFor(client).find((s) => s.label === label)?.percent ?? 0;
  return client.aum * (pct / 100);
}

/** Sortable value for a client column. Strings sort lexically, numbers numerically. */
export function getSortValue(client: Client, key: SortKey): number | string {
  switch (key) {
    case "id": return client.id;
    case "name": return client.name;
    case "aum": return client.aum;
    case "thaiStock": return getClientSliceAmount(client, "หุ้นไทย");
    case "foreignStock": return getClientSliceAmount(client, "หุ้นต่างประเทศ");
    case "derivatives": return getClientSliceAmount(client, "อนุพันธ์");
    case "mutualFund": return getClientSliceAmount(client, "กองทุนรวม");
    case "bond": return getClientSliceAmount(client, "ตราสารหนี้");
    case "foreignBond": return getClientSliceAmount(client, "ตราสารหนี้ต่างประเทศ");
    case "structuredBond": return getClientSliceAmount(client, "หุ้นกู้ที่มีอนุพันธ์แฝง");
    case "plYtd": return client.plYtdPct;
    case "liabilities": return client.aum * LIABILITIES_MULTIPLIER;
    case "cashIdle": return client.aum * (client.cashIdlePct / 100);
    case "nineBox": return getNineBoxCell(client).heat;
    default: return 0;
  }
}

/**
 * Sort value for a product row — the Product tab's counterpart to
 * {@link getSortValue}. `label` sorts on the text actually shown, so the order
 * matches what the user reads rather than the raw slice key behind it.
 */
export function getProductSortValue(
  row: ProductRow,
  key: Exclude<ProductSortKey, "rowIndex" | null>,
): number | string {
  switch (key) {
    case "label": return displayAssetLabel(row.label);
    case "clientCount": return row.clientCount;
    case "totalAmountThb": return row.totalAmountThb;
    case "avgAllocationPct": return row.avgAllocationPct;
    default: return 0;
  }
}

/**
 * Aggregate every client's allocation slices into per-product rows, sorted by
 * total AUM. Backend: this whole aggregation ("holdings by product") is a good
 * candidate for a dedicated endpoint.
 */
export function buildProductRows(clients: Client[]): ProductRow[] {
  const map = new Map<string, { statusIcon: string; holders: ProductHolder[] }>();
  for (const client of clients) {
    const aumThb = client.aum;
    for (const slice of slicesFor(client)) {
      if (slice.percent <= 0) continue;
      if (!map.has(slice.label)) map.set(slice.label, { statusIcon: slice.statusIcon, holders: [] });
      map.get(slice.label)!.holders.push({
        clientId: client.id,
        clientName: client.name,
        tier: client.tier,
        allocationPct: slice.percent,
        amountThb: aumThb * (slice.percent / 100),
      });
    }
  }
  return Array.from(map.entries())
    .map(([label, { statusIcon, holders }]) => ({
      label,
      statusIcon,
      clientCount: holders.length,
      totalAmountThb: holders.reduce((s, h) => s + h.amountThb, 0),
      avgAllocationPct: holders.reduce((s, h) => s + h.allocationPct, 0) / holders.length,
      holders: [...holders].sort((a, b) => b.amountThb - a.amountThb),
    }))
    .sort((a, b) => b.totalAmountThb - a.totalAmountThb);
}

/** Total AUM and idle cash across a set of clients. */
export function getClientTotals(clients: Client[]): { totalAum: number; totalCash: number } {
  let totalAum = 0;
  let totalCash = 0;
  for (const c of clients) {
    const aum = c.aum;
    totalAum += aum;
    totalCash += aum * (c.cashIdlePct / 100);
  }
  return { totalAum, totalCash };
}

/** Client count per segment/tier, most populous first. */
export function getSegmentBreakdown(clients: Client[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const c of clients) counts.set(c.tier, (counts.get(c.tier) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

/** Clients whose KYC expires within 30 days, enriched and sorted by urgency. */
export function getKycDueClients(clients: Client[]) {
  return mockKYCData
    .filter((k) => k.daysUntilExpiry < 30)
    .flatMap((k) => {
      const client = clients.find((c) => c.id === k.clientId);
      return client ? [{ ...k, client }] : [];
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
}

/** One row of {@link getKycDueClients} — a KYC record with its client attached. */
export type KycDueEntry = ReturnType<typeof getKycDueClients>[number];

/**
 * {@link getKycDueClients} split at the expiry line, because the two halves are
 * different jobs: a lapsed review is remediation, an upcoming one is
 * scheduling. Presented as one flat list they only differed by the sign on the
 * day count, which is easy to miss.
 *
 * `daysUntilExpiry === 0` counts as upcoming — due today, not yet missed. Both
 * halves inherit the ascending sort, so each still reads most-urgent-first.
 */
export function splitKycByExpiry(due: KycDueEntry[]): { expired: KycDueEntry[]; upcoming: KycDueEntry[] } {
  return {
    expired: due.filter((k) => k.daysUntilExpiry < 0),
    upcoming: due.filter((k) => k.daysUntilExpiry >= 0),
  };
}

/** Clients sorted by AUM, largest first. */
export function getTopClientsByAum(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => b.aum - a.aum);
}

/**
 * Clients holding idle cash, most first, with the amount alongside.
 *
 * Returns the THB figure rather than leaving the caller to re-derive it: this is
 * the same `aum × cashIdlePct` that {@link getClientTotals} sums into the Cash
 * Under Advice total, and the two have to agree for the breakdown to add up to
 * the headline. Backend: return per-client idle cash directly and this becomes a
 * sort.
 *
 * Clients with no idle cash are dropped — they contribute nothing to the total,
 * so a `฿ 0M` row would only be noise in a list about where the cash is.
 */
export function getClientsByCash(clients: Client[]): { client: Client; cashThb: number }[] {
  return clients
    .map((client) => ({
      client,
      cashThb: client.aum * (client.cashIdlePct / 100),
    }))
    .filter((entry) => entry.cashThb > 0)
    .sort((a, b) => b.cashThb - a.cashThb);
}
