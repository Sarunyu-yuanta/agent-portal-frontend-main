"use client";

import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@sarunyu/system-one";
import {
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
} from "@phosphor-icons/react";
import { relativeCallDate, type CallLogEntry } from "@/data/call-log-data";
import { type SortDir } from "./client-detail-data";
import { AllocationDonutWithTiles } from "@/components/allocation-donut";
import { EmptyState } from "@/components/ui/empty-state";

export function CurrentAllocationSection({ slices }: { slices: { label: string; percent: number }[] }) {
  return <AllocationDonutWithTiles slices={slices} donutSize={180} />;
}

export function TopHoldingsSection({
  holdings,
  sortKey,
  sortDir,
  onSort,
}: {
  holdings: { asset: string; value: string; pnl: string; pnlPct: string; pct: string; positive: boolean }[];
  sortKey: "value" | "pnlPct" | "pct" | null;
  sortDir: SortDir;
  onSort: (key: "value" | "pnlPct" | "pct", dir: SortDir) => void;
}) {
  const parseVal = (s: string) => parseFloat(s.replace(/[฿%+,M\s]/g, "")) || 0;
  const sorted = [...holdings].sort((a, b) => {
    if (!sortKey || sortDir === "none") return 0;
    const field = sortKey === "value" ? "value" : sortKey === "pnlPct" ? "pnlPct" : "pct";
    const diff = parseVal(a[field]) - parseVal(b[field]);
    return sortDir === "asc" ? diff : -diff;
  });
  return (
    <Table>
      <colgroup>
        <col />
        <col style={{ width: "1px" }} />
        <col style={{ width: "1px" }} />
        <col style={{ width: "1px" }} />
      </colgroup>
      <TableHead>
        <TableRow>
          <TableHeaderCell sortable={false} className="min-w-0 max-w-[160px]">Asset</TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "value" ? sortDir : "none"}
            onSortChange={(d) => onSort("value", d)}
          >Market Value</TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "pnlPct" ? sortDir : "none"}
            onSortChange={(d) => onSort("pnlPct", d)}
          >Unrealized P&L</TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "pct" ? sortDir : "none"}
            onSortChange={(d) => onSort("pct", d)}
          >% Portfolio</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((h) => (
          <TableRow key={h.asset}>
            <TableCell className="min-w-0 max-w-[160px]"><span className="type-body-2 text-foreground font-medium truncate block">{h.asset}</span></TableCell>
            <TableCell className="min-w-0 whitespace-nowrap"><span className="type-body-2 text-foreground">{h.value}</span></TableCell>
            <TableCell className="min-w-0 whitespace-nowrap">
              <div className="flex flex-col">
                <span className={`type-body-2 font-medium ${h.positive ? "text-success" : "text-destructive"}`}>{h.pnl}</span>
                <span className={`type-caption ${h.positive ? "text-success" : "text-destructive"}`}>{h.pnlPct}</span>
              </div>
            </TableCell>
            <TableCell className="min-w-0 whitespace-nowrap"><span className="type-body-2 text-foreground">{h.pct}</span></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CallLogTable({ callLogs }: { callLogs: CallLogEntry[] }) {
  if (callLogs.length === 0) {
    return (
      <EmptyState
        icon={<PhoneIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title="No call history yet"
        body="Call logs for this client will appear here."
      />
    );
  }
  return (
    <>
      {/* Mobile / tablet — stacked cards (table columns can't shrink below their content width) */}
      <div className="flex flex-col gap-3 md:hidden">
        {callLogs.map((log) => (
          <div key={log.id} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="type-body-2 text-foreground font-semibold">{log.date} · {log.time}</span>
              <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                {log.direction === "outbound" ? (
                  <PhoneOutgoingIcon size={14} className="text-[var(--text-brand-primary)]" />
                ) : (
                  <PhoneIncomingIcon size={14} className="text-[var(--icon-success)]" />
                )}
                <span className="type-caption">{log.direction === "outbound" ? "Outbound" : "Inbound"}</span>
              </div>
            </div>
            <p className="type-caption text-muted-foreground">
              {relativeCallDate(log.date)} · {log.duration}
            </p>
            <p className="type-body-2 text-foreground mt-1">{log.summary}</p>
          </div>
        ))}
      </div>

      {/* Desktop — table */}
      <div className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Date</TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Direction</TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">Duration</TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0">Summary</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {callLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="type-body-2 text-foreground font-medium">{log.date} · {log.time}</span>
                    <span className="type-caption text-muted-foreground">{relativeCallDate(log.date)}</span>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {log.direction === "outbound" ? (
                      <PhoneOutgoingIcon size={16} className="text-[var(--text-brand-primary)]" />
                    ) : (
                      <PhoneIncomingIcon size={16} className="text-[var(--icon-success)]" />
                    )}
                    <span className="type-body-2 text-foreground">{log.direction === "outbound" ? "Outbound" : "Inbound"}</span>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap"><span className="type-body-2 text-foreground">{log.duration}</span></TableCell>
                <TableCell className="min-w-0"><span className="type-body-2 text-foreground">{log.summary}</span></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
