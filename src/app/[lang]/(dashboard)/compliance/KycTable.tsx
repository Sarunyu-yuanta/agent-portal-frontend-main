"use client";

import { useState } from "react";
import {
  Tag,
  StatusTag,
  Button,
  Avatar,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
} from "@sarunyu/system-one";
import { DownloadSimpleIcon, ClockIcon } from "@phosphor-icons/react";
import { mockKYCData } from "@/lib/mock-data";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { TABLE_EMPTY_MIN_HEIGHT, TableEmptyOverlay } from "@/components/ui/empty-state";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import { KycDetailPanel } from "./KycDetailPanel";
import { kycFilterOpts, type KycRow, type SortKey, type SortDir } from "./compliance-data";

export function KycTable() {
  const { isPrivate } = usePrivacy();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("none");
  const [selectedRow, setSelectedRow] = useState<KycRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chipsScrolled, setChipsScrolled] = useState(false);

  const handleSort = (key: SortKey) => (dir: SortDir) => {
    setSortKey(dir === "none" ? null : key);
    setSortDir(dir);
  };

  const dirFor = (key: SortKey): SortDir => sortKey === key ? sortDir : "none";

  const filtered = filter ? mockKYCData.filter((r) => r.kycStatus === filter) : mockKYCData;

  const rows = [...filtered].sort((a, b) => {
    if (!sortKey || sortDir === "none") return 0;
    let av: string | number = a[sortKey];
    let bv: string | number = b[sortKey];
    if (typeof av === "string") av = av.toLowerCase();
    if (typeof bv === "string") bv = bv.toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const isEmpty = rows.length === 0;

  return (
    <>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="type-subtitle-1 text-foreground">KYC & Document Pipeline</p>
        <Button variant="outline-black" size="sm" leftIcon={<DownloadSimpleIcon size={14} />}>
          Export
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="type-caption text-muted-foreground shrink-0">Filter by:</span>
        <div className="relative flex-1 min-w-0">
          <div
            className="scrollable-tabs flex items-center gap-2"
            onScroll={(e) => setChipsScrolled(e.currentTarget.scrollLeft > 0)}
            style={chipsScrolled ? {
              maskImage: "linear-gradient(to right, transparent 0px, black 40px)",
              WebkitMaskImage: "linear-gradient(to right, transparent 0px, black 40px)",
            } : undefined}
          >
            {kycFilterOpts.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                type="single"
                size="small"
                selected={filter === opt.value}
                onClick={() => setFilter(opt.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className={`relative rounded-xl border border-[var(--border-default)] overflow-hidden overflow-x-auto ${isEmpty ? TABLE_EMPTY_MIN_HEIGHT : ""}`}>
        <Table className="table-fixed min-w-[560px]">
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-[26%]" sortDirection={dirFor("client")} onSortChange={handleSort("client")}>Client</TableHeaderCell>
              <TableHeaderCell className="w-[18%]" sortDirection={dirFor("riskRating")} onSortChange={handleSort("riskRating")}>Risk Rating</TableHeaderCell>
              <TableHeaderCell className="w-[16%]" sortable={false}>KYC Status</TableHeaderCell>
              <TableHeaderCell className="w-[22%]" sortDirection={dirFor("nextReview")} onSortChange={handleSort("nextReview")}>Next Review</TableHeaderCell>
              <TableHeaderCell className="w-[18%]" sortDirection={dirFor("daysUntilExpiry")} onSortChange={handleSort("daysUntilExpiry")}>Expiry</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const urgent = row.daysUntilExpiry <= 7;
              const soon   = row.daysUntilExpiry <= 30;
              const maskedClient = maskName(row.client, isPrivate);
              const initials = getInitialsFromWords(maskedClient);

              return (
                <TableRow key={row.id} hoverable className="cursor-pointer transition-colors active:bg-[var(--bg-default-pressed)]" onClick={() => { setSelectedRow(row); setDrawerOpen(true); }}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar type="text" initials={initials} size="s" />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="type-body-2 font-medium text-foreground truncate">{maskedClient}</span>
                        <span className="type-caption text-[var(--text-default-disabled)]">{row.riskRating} Risk</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Tag
                      text={row.riskRating}
                      variant={row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <StatusTag type={row.kycStatus} />
                  </TableCell>
                  <TableCell>
                    <span className="type-body-2 text-foreground">{row.nextReview}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {urgent && <ClockIcon size={12} weight="fill" className="text-destructive shrink-0" />}
                      <span className={`type-body-2 font-medium tabular-nums ${
                        urgent ? "text-destructive" : soon ? "text-warning" : "text-success"
                      }`}>
                        {row.daysUntilExpiry}d
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {isEmpty && (
          <TableEmptyOverlay
            body="ลองเลือกตัวกรองอื่น หรือล้างตัวกรองเพื่อดูรายการทั้งหมด"
            onClearFilters={filter ? () => setFilter("") : undefined}
          />
        )}
      </div>
    </div>

    <DetailDrawer size="narrow" className="overflow-y-auto" open={drawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) setSelectedRow(null); }}>
      {selectedRow && <KycDetailPanel row={selectedRow} onClose={() => setDrawerOpen(false)} />}
    </DetailDrawer>
    </>
  );
}
