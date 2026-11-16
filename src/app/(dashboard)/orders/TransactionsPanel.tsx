"use client";

/**
 * Stock, TFEX or Mutual Fund — the clients' own trades in that asset, as they
 * came through each platform.
 *
 * Read-only. Nothing on these tabs is booked by the IC; they are here so an
 * IC tracking a client's orders sees the listed side next to the booked one.
 * Every filter lives in the URL (`replace`), like the booking tabs' steps.
 *
 * Stock and Mutual Fund also list the Proposals the IC has sent on them
 * (`offered-products`) — an offer is the step before a client's own trade, so
 * it sits in the same list under its own status, "ส่ง Proposal แล้ว". The chip
 * row is status; ประเภท and ช่องทาง live in the filter dialog.
 */

import { OrdersPanelSkeleton } from "./OrdersPanelSkeleton";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FunnelSimpleIcon, ReceiptIcon } from "@phosphor-icons/react";
import {
  Button,
  Chip,
  Pagination,
  SearchInput,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tag,
} from "@sarunyu/system-one";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useOrders } from "@/contexts/orders-context";
import { FadeIn } from "@/components/ui/fade-in";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { TRANSACTION_CHANNELS } from "@/lib/transaction-mock-data";
import type {
  ClientTransaction,
  ProposalLog,
  TransactionAsset,
  TransactionSide,
  TransactionStatus,
} from "@/types/domain";
import { PAGE_SIZE_OPTIONS } from "../client/[id]/fixed-income-shared";
import { formatLogTime } from "./order-book";
import { offeredSymbol } from "./offered-products";
import { PROPOSAL_CHANNEL_META } from "./proposal-channels";
import { PROPOSAL_VARIANT } from "./ProposalChip";
import { FilterGroup } from "./FilterGroup";
import { TransactionDetailModal } from "./TransactionDetailModal";
import {
  PRICE_LABEL,
  QUANTITY_LABEL,
  SIDE_CLASS,
  SIDE_LABEL,
  STATUS_TAG,
  formatAmount,
  formatPrice,
  formatQuantity,
} from "./transaction-display";
import { useTransactions } from "./use-transactions";

const COLUMNS = 9;

/** The chip row: a trade's status, or "proposed" for a Proposal sent. */
type StatusFilter = TransactionStatus | "proposed";

const PROPOSED_LABEL = "ส่ง Proposal แล้ว";

/** One line of the table — a client's trade, or a Proposal the IC sent. */
type Row =
  | { kind: "trade"; id: string; at: string; trade: ClientTransaction }
  | {
      kind: "proposal";
      id: string;
      at: string;
      proposal: ProposalLog;
      symbol: string;
      name: string;
      /** The channels it went down, as labels — what ช่องทาง shows and matches. */
      channels: string[];
    };

type Criteria = {
  status: StatusFilter | null;
  side: TransactionSide | null;
  channel: string | null;
  query: string;
};

function matches(row: Row, c: Criteria, isPrivate: boolean): boolean {
  if (row.kind === "trade") {
    const t = row.trade;
    if (c.status === "proposed") return false;
    if (c.status && t.status !== c.status) return false;
    if (c.side && t.side !== c.side) return false;
    if (c.channel && t.channel !== c.channel) return false;
    if (!c.query) return true;
    return [t.symbol, t.name, t.clientId, maskName(t.clientName, isPrivate)].some((text) =>
      text.toLowerCase().includes(c.query),
    );
  }
  // A Proposal has no side and no fill: any trade-only filter rules it out.
  if (c.status && c.status !== "proposed") return false;
  if (c.side) return false;
  if (c.channel && !row.channels.includes(c.channel)) return false;
  if (!c.query) return true;
  const p = row.proposal;
  return [row.symbol, row.name, p.clientId, maskName(p.clientName, isPrivate)].some((text) =>
    text.toLowerCase().includes(c.query),
  );
}

/**
 * @param clientId One client's trades and Proposals only — the client
 *   profile's Order tab mounts this same panel.
 */
export function TransactionsPanel({
  asset,
  clientId,
}: {
  asset: TransactionAsset;
  clientId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: trades, isLoading } = useTransactions(asset);
  const { proposals } = useOrders();
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  // Which row's detail is open. Local, like the booking detail on a product's
  // own tab — the URL carries where the IC *is*, and a trade they opened to
  // read is not somewhere they navigated to.
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<{ side: TransactionSide | null; channel: string | null }>({
    side: null,
    channel: null,
  });

  const offered = asset !== "tfex";
  const sides: TransactionSide[] =
    asset === "mutual-fund" ? ["buy", "sell", "switch"] : ["buy", "sell"];
  // A fund order fills whole or not at all — no จับคู่บางส่วน to filter on.
  const statuses: StatusFilter[] = [
    ...(offered ? (["proposed"] as const) : []),
    "pending",
    ...(asset === "mutual-fund" ? [] : (["partial"] as const)),
    "matched",
    "cancelled",
  ];
  const tradeChannels = TRANSACTION_CHANNELS[asset];

  const status = statuses.find((s) => s === searchParams.get("status")) ?? null;
  const side = sides.find((s) => s === searchParams.get("side")) ?? null;
  // A trade's platform only. A Proposal has no platform, so picking one leaves
  // the Proposals out — the same as picking a ประเภท does.
  const channel = tradeChannels.find((c) => c === searchParams.get("channel")) ?? null;

  const setParams = (next: Record<string, string | null>) => {
    setPage(1);
    setQueryState(withQuery(pathname, searchParams, next), "replace");
  };

  /** Trades and this asset's Proposals, newest first. */
  const rows = useMemo<Row[]>(() => {
    // A Proposal names only its symbol; the product's name comes off any
    // trade in it, and is left blank for one nobody has traded.
    const nameOf = new Map(trades.map((t: ClientTransaction) => [t.symbol, t.name]));
    const offers: Row[] = proposals.flatMap((p) => {
      const symbol = offeredSymbol(asset, p.productId);
      if (!symbol) return [];
      return [
        {
          kind: "proposal" as const,
          id: p.id,
          at: p.sentAt,
          proposal: p,
          symbol,
          name: nameOf.get(symbol) ?? "",
          channels: p.channels.map((c) => PROPOSAL_CHANNEL_META[c].label),
        },
      ];
    });
    const traded: Row[] = trades.map((t: ClientTransaction) => ({
      kind: "trade" as const,
      id: t.id,
      at: t.at,
      trade: t,
    }));
    const all = [...offers, ...traded];
    const theirs = clientId
      ? all.filter((r) =>
          (r.kind === "trade" ? r.trade.clientId : r.proposal.clientId) === clientId,
        )
      : all;
    return theirs.sort((a, b) => b.at.localeCompare(a.at));
  }, [trades, proposals, asset, clientId]);

  const query = search.trim().toLowerCase();
  const visible = rows.filter((r) => matches(r, { status, side, channel, query }, isPrivate));

  /** How many the dialog's draft would leave — its primary action says so. */
  const previewed = rows.filter((r) =>
    matches(r, { status, side: draft.side, channel: draft.channel, query }, isPrivate),
  ).length;
  const activeFilters = (side ? 1 : 0) + (channel ? 1 : 0);

  const openFilters = () => {
    // A scratch copy, seeded on open — see `CampaignFilters`.
    setDraft({ side, channel });
    setFilterOpen(true);
  };

  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);
  // Looked up in the unfiltered rows: a chip clicked behind the open modal
  // must not blank out the trade being read.
  const open = trades.find((t: ClientTransaction) => t.id === openId) ?? null;

  if (isLoading) return <OrdersPanelSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      {/* Status chips on the left; search and the filter button on the right.
          Stacked below `lg`. Widths sit on wrappers: the library's own
          `.w-full` outranks a Tailwind width set on the component. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollable-tabs flex min-w-0 items-center gap-2">
          <Chip
            label="ทั้งหมด"
            type="single"
            selected={status === null}
            onClick={() => setParams({ status: null })}
          />
          {statuses.map((s) => (
            <Chip
              key={s}
              label={s === "proposed" ? PROPOSED_LABEL : STATUS_TAG[s].text}
              type="single"
              selected={status === s}
              onClick={() => setParams({ status: s })}
            />
          ))}
        </div>

        {/* The search at its default size, the same as every other tab's —
            the tabs swap under one toolbar, and a box that changes height from
            tab to tab reads as a different control. The button stretches to
            match it rather than the other way round. */}
        <div className="flex items-stretch gap-2.5 lg:shrink-0">
          <Button
            variant="outline"
            size="lg"
            className="shrink-0"
            // Inline: the library's fixed `h-9` is unlayered and beats a class.
            style={{ height: "auto" }}
            leftIcon={<FunnelSimpleIcon size={16} weight="bold" />}
            onClick={openFilters}
          >
            ตัวกรอง
            {activeFilters > 0 && (
              <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary-action px-1 text-meta font-bold tabular-nums text-on-primary-action">
                {activeFilters}
              </span>
            )}
          </Button>
          <div className="min-w-0 flex-1 lg:w-[220px] lg:flex-none">
            <SearchInput
              value={search}
              onChange={(v) => {
                setSearch(v);
                setPage(1);
              }}
              onClear={() => setSearch("")}
              placeholder="ค้นหาสินค้า หรือลูกค้า"
              className="w-full"
            />
          </div>
        </div>
      </div>

      <ResponsiveDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="ตัวกรอง"
        headerAction={{
          label: "ล้างทั้งหมด",
          onClick: () => setDraft({ side: null, channel: null }),
        }}
        closeOnBackdrop
        desktopContentClassName="w-[440px] max-w-full"
      >
        <div className="flex flex-col gap-4 pt-1">
          <FilterGroup
            label="ประเภท"
            options={sides.map((s) => ({ value: s, label: SIDE_LABEL[s] }))}
            value={draft.side}
            onChange={(v) => setDraft((d) => ({ ...d, side: v as TransactionSide | null }))}
          />
          <FilterGroup
            label="ช่องทาง"
            options={tradeChannels.map((c) => ({ value: c, label: c }))}
            value={draft.channel}
            onChange={(v) => setDraft((d) => ({ ...d, channel: v }))}
          />
          <div className="mt-1 border-t border-border pt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => {
                setParams({ side: draft.side, channel: draft.channel });
                setFilterOpen(false);
              }}
            >
              ดูผลลัพธ์ ({previewed})
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      {!isLoading && visible.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search ? "ไม่พบรายการที่ค้นหา" : "ไม่มีรายการในเงื่อนไขนี้"}
          body="ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยชื่อสินค้า รหัสลูกค้า หรือชื่อลูกค้า"
        />
      ) : (
        <FadeIn key={`${status}|${side}|${channel}`} className="flex flex-col gap-3">
          <div className="relative overflow-x-auto overflow-y-hidden table-scroll rounded-lg border border-[var(--border-default)]">
            <Table className="table-fixed min-w-[1100px]">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-[13%] whitespace-nowrap">วันเวลา</TableHeaderCell>
                  <TableHeaderCell className="w-[14%] whitespace-nowrap">ลูกค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[19%] whitespace-nowrap">สินค้า</TableHeaderCell>
                  <TableHeaderCell className="w-[7%] whitespace-nowrap">ประเภท</TableHeaderCell>
                  <TableHeaderCell className="w-[10%] whitespace-nowrap text-right">
                    {QUANTITY_LABEL[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[8%] whitespace-nowrap text-right">
                    {PRICE_LABEL[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[11%] whitespace-nowrap text-right">
                    มูลค่า
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">ช่องทาง</TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">สถานะ</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRowsSkeleton columns={COLUMNS} />
                ) : (
                  paged.map((row) =>
                    row.kind === "proposal" ? (
                      <ProposalRow key={row.id} row={row} isPrivate={isPrivate} />
                    ) : (
                      <TradeRow
                        key={row.id}
                        trade={row.trade}
                        asset={asset}
                        isPrivate={isPrivate}
                        onOpen={() => setOpenId(row.trade.id)}
                      />
                    ),
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && (
            <div className="flex flex-wrap-reverse items-center justify-end gap-3">
              <div className="flex items-center gap-2">
                <p className="text-label text-muted-foreground whitespace-nowrap">Show per page</p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-label border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-label text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">{(safePage - 1) * pageSize + 1}</span>
                  {" – "}
                  <span className="font-medium text-foreground">
                    {Math.min(safePage * pageSize, visible.length)}
                  </span>
                  {" of "}
                  <span className="font-medium text-foreground">{visible.length}</span> items
                </p>
                <Pagination totalPages={totalPages} currentPage={safePage} onPageChange={setPage} />
              </div>
            </div>
          )}
        </FadeIn>
      )}

      {/* Rendered whether or not one is open, so the modal can animate out. */}
      <TransactionDetailModal transaction={open} onClose={() => setOpenId(null)} />
    </div>
  );
}

/** A Proposal's line in the table: no side, no fill, not clickable. */
function ProposalRow({
  row,
  isPrivate,
}: {
  row: Extract<Row, { kind: "proposal" }>;
  isPrivate: boolean;
}) {
  const p = row.proposal;
  const dash = <span className="type-body-2 text-muted-foreground">—</span>;
  return (
    <TableRow>
      <TableCell>
        <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
          {formatLogTime(p.sentAt)}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-body-2 truncate text-foreground">{maskName(p.clientName, isPrivate)}</p>
          <p className="type-caption text-muted-foreground">{p.clientId}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-body-2 truncate !font-semibold text-foreground">{row.symbol}</p>
          {row.name && <p className="type-caption truncate text-muted-foreground">{row.name}</p>}
        </div>
      </TableCell>
      <TableCell>{dash}</TableCell>
      <TableCell className="text-right">{dash}</TableCell>
      <TableCell className="text-right">{dash}</TableCell>
      <TableCell className="text-right">{dash}</TableCell>
      <TableCell>
        <span className="type-caption text-foreground">{row.channels.join(", ")}</span>
      </TableCell>
      <TableCell>
        <Tag text={PROPOSED_LABEL} variant={PROPOSAL_VARIANT} size="large" />
      </TableCell>
    </TableRow>
  );
}

/** A client's own trade — the whole row opens its detail. */
function TradeRow({
  trade: t,
  asset,
  isPrivate,
  onOpen,
}: {
  trade: ClientTransaction;
  asset: TransactionAsset;
  isPrivate: boolean;
  onOpen: () => void;
}) {
  return (
                    // The whole row opens the trade — same as a booking row on
                    // a product's tab, and cheaper than a column of arrows in a
                    // table already scrolling sideways.
                    <TableRow
                      hoverable
                      tabIndex={0}
                      aria-label={`ดูรายละเอียดรายการ ${t.symbol} ของ ${maskName(t.clientName, isPrivate)}`}
                      onClick={onOpen}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onOpen();
                        }
                      }}
                      className="cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7] active:bg-[var(--bg-default-pressed)]"
                    >
                      <TableCell>
                        <p className="type-caption whitespace-nowrap tabular-nums text-muted-foreground">
                          {formatLogTime(t.at)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="type-body-2 truncate text-foreground">
                            {maskName(t.clientName, isPrivate)}
                          </p>
                          <p className="type-caption text-muted-foreground">{t.clientId}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <p className="type-body-2 truncate !font-semibold text-foreground">
                            {t.symbol}
                          </p>
                          <p className="type-caption truncate text-muted-foreground">{t.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`type-body-2 !font-semibold ${SIDE_CLASS[t.side]}`}>
                          {SIDE_LABEL[t.side]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums text-foreground">
                          {formatQuantity(asset, t.quantity)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums text-foreground">
                          {formatPrice(asset, t.price)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="type-body-2 tabular-nums !font-semibold text-foreground">
                          {formatAmount(t.amount)}
                        </span>
                        <span className="type-caption ml-1 text-muted-foreground">{t.currency}</span>
                      </TableCell>
                      <TableCell>
                        <span className="type-caption text-foreground">{t.channel}</span>
                      </TableCell>
                      <TableCell>
                        {/* `large`, the component's own default — the สถานะ
                            column is the one an IC scans down, and it reads at
                            the same size as the booking tabs' beside it. */}
                        <Tag
                          text={STATUS_TAG[t.status].text}
                          variant={STATUS_TAG[t.status].variant}
                          size="large"
                        />
                      </TableCell>
                    </TableRow>
  );
}
