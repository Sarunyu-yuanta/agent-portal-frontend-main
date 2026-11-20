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
  ChartBarIcon,
  PhoneIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
} from "@phosphor-icons/react";
import { AllocationDonutWithTiles } from "@/components/charts/AllocationDonut";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";
import type { SortDir } from "@/types/table";
import type { CallLogEntry } from "@/types/call-log";
import { relativeCallDate } from "@/features/clients/lib/call-log-format";

export function CurrentAllocationSection({
  slices,
}: {
  slices: { label: string; percent: number }[];
}) {
  return <AllocationDonutWithTiles slices={slices} donutSize={180} />;
}

export function TopHoldingsSection({
  holdings,
  sortKey,
  sortDir,
  onSort,
}: {
  holdings: {
    asset: string;
    value: string;
    pnl: string;
    pnlPct: string;
    pct: string;
    positive: boolean;
  }[];
  sortKey: "value" | "pnlPct" | "pct" | null;
  sortDir: SortDir;
  onSort: (key: "value" | "pnlPct" | "pct", dir: SortDir) => void;
}) {
  const t = useT();
  if (holdings.length === 0) {
    return (
      <EmptyState
        size="compact"
        icon={
          <ChartBarIcon
            size={32}
            weight="duotone"
            className="text-[var(--text-default-placeholder)]"
          />
        }
        title={t.client.overview.noHoldings}
      />
    );
  }
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
          <TableHeaderCell sortable={false} className="max-w-[160px] min-w-0">
            {t.client.holdings.asset}
          </TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "value" ? sortDir : "none"}
            onSortChange={(d) => onSort("value", d)}
          >
            {t.client.holdings.marketValue}
          </TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "pnlPct" ? sortDir : "none"}
            onSortChange={(d) => onSort("pnlPct", d)}
          >
            {t.client.holdings.unrealizedPl}
          </TableHeaderCell>
          <TableHeaderCell
            className="min-w-0 whitespace-nowrap"
            sortDirection={sortKey === "pct" ? sortDir : "none"}
            onSortChange={(d) => onSort("pct", d)}
          >
            {t.client.holdings.portfolioPct}
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((h) => (
          <TableRow key={h.asset}>
            <TableCell className="max-w-[160px] min-w-0">
              <span className="type-body-2 block truncate font-medium text-foreground">
                {h.asset}
              </span>
            </TableCell>
            <TableCell className="min-w-0 whitespace-nowrap">
              <span className="type-body-2 text-foreground">{h.value}</span>
            </TableCell>
            <TableCell className="min-w-0 whitespace-nowrap">
              <div className="flex flex-col">
                <span
                  className={`type-body-2 font-medium ${h.positive ? "text-success" : "text-destructive"}`}
                >
                  {h.pnl}
                </span>
                <span
                  className={`type-caption ${h.positive ? "text-success" : "text-destructive"}`}
                >
                  {h.pnlPct}
                </span>
              </div>
            </TableCell>
            <TableCell className="min-w-0 whitespace-nowrap">
              <span className="type-body-2 text-foreground">{h.pct}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function CallLogTable({ callLogs }: { callLogs: CallLogEntry[] }) {
  const t = useT();
  if (callLogs.length === 0) {
    return (
      <EmptyState
        icon={<PhoneIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title={t.client.callLog.emptyTitle}
        body={t.client.callLog.emptyBody}
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
              <span className="type-body-2 font-semibold text-foreground">
                {log.date} · {log.time}
              </span>
              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                {log.direction === "outbound" ? (
                  <PhoneOutgoingIcon size={14} className="text-[var(--text-brand-primary)]" />
                ) : (
                  <PhoneIncomingIcon size={14} className="text-[var(--icon-success)]" />
                )}
                <span className="type-caption">
                  {log.direction === "outbound"
                    ? t.client.callLog.outbound
                    : t.client.callLog.inbound}
                </span>
              </div>
            </div>
            <p className="type-caption text-muted-foreground">
              {relativeCallDate(log.date, t)} · {log.duration}
            </p>
            <p className="type-body-2 mt-1 text-foreground">{log.summary}</p>
          </div>
        ))}
      </div>

      {/* Desktop — table */}
      <div className="hidden md:block">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.client.callLog.date}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.client.callLog.direction}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0 whitespace-nowrap">
                {t.client.callLog.duration}
              </TableHeaderCell>
              <TableHeaderCell sortable={false} className="min-w-0">
                {t.client.callLog.summary}
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {callLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="type-body-2 font-medium text-foreground">
                      {log.date} · {log.time}
                    </span>
                    <span className="type-caption text-muted-foreground">
                      {relativeCallDate(log.date, t)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {log.direction === "outbound" ? (
                      <PhoneOutgoingIcon size={16} className="text-[var(--text-brand-primary)]" />
                    ) : (
                      <PhoneIncomingIcon size={16} className="text-[var(--icon-success)]" />
                    )}
                    <span className="type-body-2 text-foreground">
                      {log.direction === "outbound"
                        ? t.client.callLog.outbound
                        : t.client.callLog.inbound}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-0 whitespace-nowrap">
                  <span className="type-body-2 text-foreground">{log.duration}</span>
                </TableCell>
                <TableCell className="min-w-0">
                  <span className="type-body-2 text-foreground">{log.summary}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
