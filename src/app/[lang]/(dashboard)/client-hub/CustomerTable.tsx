"use client";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Tooltip,
} from "@sarunyu/system-one";
import { TableSkeleton } from "@/components/ui/skeleton";
import { TABLE_EMPTY_MIN_HEIGHT, TableEmptyOverlay } from "@/components/ui/empty-state";
import { useFlipRows } from "@/hooks/use-flip-rows";
import { useMediaQuery } from "@/hooks/use-media-query";
import { CUSTOMER_COLUMNS } from "./columns";
import type { ColumnId, SortDir, SortKey } from "./types";
import type { Client } from "@/types/domain";
import { useT } from "@/i18n/I18nProvider";

const NO_WIDTH = 60;

export function CustomerTable({
  rows,
  visibleColumns,
  originalIndexMap,
  tableWidth,
  isPrivate,
  isLoading,
  dirFor,
  onSort,
  onRowClick,
  onClearFilters,
  isFiltered = false,
}: {
  rows: Client[];
  visibleColumns: Set<ColumnId>;
  originalIndexMap: Map<string, number>;
  tableWidth: number;
  isPrivate: boolean;
  isLoading?: boolean;
  dirFor: (key: SortKey) => SortDir;
  onSort: (key: SortKey) => (next: SortDir) => void;
  onRowClick: (client: Client) => void;
  onClearFilters?: () => void;
  /** Whether a search is narrowing `rows` — tells "no match" apart from "nothing yet". */
  isFiltered?: boolean;
}) {
  const t = useT();
  const shown = CUSTOMER_COLUMNS.filter((col) => visibleColumns.has(col.id));
  const flipRef = useFlipRows<string>();

  // Proportional column widths: each column gets its natural share of the total.
  // With table-fixed + w-full, percentages scale all columns proportionally as
  // the table grows to fill the container, keeping the layout balanced.
  const pct = (w: number) => `${(w / tableWidth) * 100}%`;

  // ── Pinned (frozen) leading columns: No., Client ID, Client ──────────────────
  // Freeze on tablet/desktop only; on mobile the columns scroll normally.
  const isMobile = useMediaQuery("(max-width: 767px)");
  const pinningEnabled = !isMobile;
  // Client ID / Client are toggleable, so left offsets follow whichever are shown.
  const widthOf = (id: ColumnId) => CUSTOMER_COLUMNS.find((c) => c.id === id)?.width ?? 0;
  const clientIdVisible = visibleColumns.has("clientId");
  const clientVisible = visibleColumns.has("client");
  const clientIdOffset = NO_WIDTH;
  const clientOffset = NO_WIDTH + (clientIdVisible ? widthOf("clientId") : 0);
  // The last frozen column gets the separating shadow.
  const lastPinned: "no" | "clientId" | "client" = clientVisible
    ? "client"
    : clientIdVisible
      ? "clientId"
      : "no";

  const noCellPin = pinningEnabled
    ? {
        fixed: "left" as const,
        fixedOffset: 0,
        fixedShadow: lastPinned === "no" ? ("right" as const) : undefined,
      }
    : {};

  /** Sticky-column props for a pinnable column (empty on mobile / non-pinned columns). */
  const pinProps = (id: ColumnId) => {
    if (!pinningEnabled) return {};
    if (id === "clientId") {
      return {
        fixed: "left" as const,
        fixedOffset: clientIdOffset,
        fixedShadow: lastPinned === "clientId" ? ("right" as const) : undefined,
      };
    }
    if (id === "client") {
      return {
        fixed: "left" as const,
        fixedOffset: clientOffset,
        fixedShadow: lastPinned === "client" ? ("right" as const) : undefined,
      };
    }
    return {};
  };

  if (isLoading) return <TableSkeleton />;

  const isEmpty = !isLoading && rows.length === 0;

  return (
    <div
      className={`table-scroll relative overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-default)] ${isEmpty ? TABLE_EMPTY_MIN_HEIGHT : ""}`}
    >
      <Table className="w-full table-fixed" style={{ minWidth: tableWidth }}>
        <TableHead>
          <TableRow>
            <TableHeaderCell
              style={{ width: pct(NO_WIDTH) }}
              {...noCellPin}
              sortDirection={dirFor("rowIndex")}
              onSortChange={onSort("rowIndex")}
            >
              {t.client.hub.rowNo}
            </TableHeaderCell>
            {shown.map((col) => (
              <TableHeaderCell
                key={col.id}
                style={{ width: pct(col.width) }}
                className={col.headerClassName}
                {...pinProps(col.id)}
                sortDirection={dirFor(col.sortKey)}
                onSortChange={onSort(col.sortKey)}
              >
                {t.clientHub.columns[col.id] ?? col.label}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((client) => {
            const rowNo = originalIndexMap.get(client.id) ?? 0;
            return (
              <Tooltip
                key={client.id}
                content={t.client.hub.viewClientProfile}
                side="top"
                delayDuration={400}
              >
                {/* `data-client-row` is how the open quick-view panel tells a
                    press on another client apart from a press on the page: one
                    is a switch, the other a dismissal. See the drawer's
                    `onOpenChange` in `client-hub/page.tsx`. */}
                <TableRow
                  data-client-row=""
                  ref={flipRef(client.id)}
                  className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]"
                  hoverable
                  onClick={() => onRowClick(client)}
                >
                  <TableCell {...noCellPin}>
                    <p className="text-body-sm text-muted-foreground">{rowNo}</p>
                  </TableCell>
                  {shown.map((col) => (
                    <TableCell key={col.id} {...pinProps(col.id)}>
                      {col.render(client, { isPrivate })}
                    </TableCell>
                  ))}
                </TableRow>
              </Tooltip>
            );
          })}
        </TableBody>
      </Table>
      {isEmpty &&
        (isFiltered ? (
          <TableEmptyOverlay
            body={t.client.hub.noClientResultBody}
            onClearFilters={onClearFilters}
          />
        ) : (
          <TableEmptyOverlay variant="empty" title={t.client.hub.noClientsYet} />
        ))}
    </div>
  );
}
