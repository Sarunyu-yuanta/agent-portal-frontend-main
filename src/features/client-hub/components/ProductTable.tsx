"use client";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@sarunyu/system-one";
import { TableSkeleton } from "@/components/ui/skeleton";
import { TABLE_EMPTY_MIN_HEIGHT, TableEmptyOverlay } from "@/components/ui/empty-state";
import { useFlipRows } from "@/hooks/use-flip-rows";
import { displayAssetLabel, formatThbAmount } from "@/lib/client-utils";
import type { ProductSortKey, SortDir } from "@/features/client-hub/lib/types";
import type { ProductRow } from "@/types/domain";
import { useT } from "@/i18n/I18nProvider";

export function ProductTable({
  rows,
  originalIndexMap,
  isLoading,
  dirFor,
  onSort,
  onRowClick,
  onClearFilters,
  isFiltered = false,
}: {
  rows: ProductRow[];
  /** Row numbers from the unsorted list, so "No." stays put like the Customer tab's. */
  originalIndexMap: Map<string, number>;
  isLoading?: boolean;
  dirFor: (key: ProductSortKey) => SortDir;
  onSort: (key: ProductSortKey) => (next: SortDir) => void;
  onRowClick: (row: ProductRow) => void;
  onClearFilters?: () => void;
  /** Whether a search is narrowing `rows` — tells "no match" apart from "nothing yet". */
  isFiltered?: boolean;
}) {
  const t = useT();
  const flipRef = useFlipRows<string>();
  if (isLoading) return <TableSkeleton />;

  const isEmpty = !isLoading && rows.length === 0;
  return (
    <div
      className={`table-scroll relative overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-default)] ${isEmpty ? TABLE_EMPTY_MIN_HEIGHT : ""}`}
    >
      <Table className="min-w-[640px] table-fixed">
        <TableHead>
          <TableRow>
            <TableHeaderCell
              className="w-[5%]"
              sortDirection={dirFor("rowIndex")}
              onSortChange={onSort("rowIndex")}
            >
              {t.client.hub.rowNo}
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[30%]"
              sortDirection={dirFor("label")}
              onSortChange={onSort("label")}
            >
              {t.client.hub.productTable.product}
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[18%] whitespace-nowrap"
              sortDirection={dirFor("clientCount")}
              onSortChange={onSort("clientCount")}
            >
              {t.client.hub.productTable.clientCount}
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[26%] whitespace-nowrap"
              sortDirection={dirFor("totalAmountThb")}
              onSortChange={onSort("totalAmountThb")}
            >
              {t.client.hub.productTable.totalAum}
            </TableHeaderCell>
            <TableHeaderCell
              className="w-[21%] whitespace-nowrap"
              sortDirection={dirFor("avgAllocationPct")}
              onSortChange={onSort("avgAllocationPct")}
            >
              {t.client.hub.productTable.avgAllocation}
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.label}
              ref={flipRef(row.label)}
              className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
              hoverable
              onClick={() => onRowClick(row)}
            >
              <TableCell>
                <p className="text-body-sm text-muted-foreground">
                  {originalIndexMap.get(row.label) ?? 0}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="relative size-2 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element -- SVG status dot; the image optimizer rejects SVG */}
                    <img alt="" className="block size-full max-w-none" src={row.statusIcon} />
                  </span>
                  <p className="truncate text-body font-semibold text-foreground">
                    {displayAssetLabel(row.label, t)}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-body font-semibold text-foreground">{row.clientCount}</p>
              </TableCell>
              <TableCell>
                <p className="text-body font-semibold text-foreground">
                  {formatThbAmount(row.totalAmountThb)}
                </p>
              </TableCell>
              <TableCell>
                <p className="text-body font-semibold text-foreground">
                  {row.avgAllocationPct.toFixed(1)}%
                </p>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isEmpty &&
        (isFiltered ? (
          <TableEmptyOverlay
            body={t.client.hub.noProductResultBody}
            onClearFilters={onClearFilters}
          />
        ) : (
          <TableEmptyOverlay variant="empty" title={t.client.hub.noProductsYet} />
        ))}
    </div>
  );
}
