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
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
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
import { useOrders } from "@/features/orders/store/orders-context";
import { FadeIn } from "@/components/ui/fade-in";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { TRANSACTION_CHANNELS } from "@/mocks/transaction-mock-data";
import type {
  ClientTransaction,
  ProposalLog,
  TransactionAsset,
  TransactionSide,
  TransactionStatus,
} from "@/types/domain";
import { PAGE_SIZE_OPTIONS } from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { formatLogTime } from "@/features/orders/lib/order-book";
import { offeredSymbol } from "@/features/orders/lib/offered-products";
import { PROPOSAL_CHANNEL_META } from "./proposal-channels";
import { PROPOSAL_VARIANT } from "./ProposalChip";
import { FilterGroup } from "./FilterGroup";
import { TransactionDetailModal } from "./TransactionDetailModal";
import {
  SIDE_CLASS,
  STATUS_TAG,
  formatAmount,
  formatPrice,
  formatQuantity,
} from "@/features/orders/lib/transaction-display";
import { useTransactions } from "@/features/orders/hooks/use-transactions";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";

const COLUMNS = 9;

/** The chip row: a trade's status, or "proposed" for a Proposal sent. */
type StatusFilter = TransactionStatus | "proposed";

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
  const dict = useT();
  const pathname = useAppPathname();
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
      ? all.filter(
          (r) => (r.kind === "trade" ? r.trade.clientId : r.proposal.clientId) === clientId,
        )
      : all;
    return theirs.sort((a, b) => b.at.localeCompare(a.at));
  }, [trades, proposals, asset, clientId]);

  const query = search.trim().toLowerCase();
  const visible = rows.filter((r) => matches(r, { status, side, channel, query }, isPrivate));
  const clearFilters = () => {
    setSearch("");
    setParams({ status: null, side: null, channel: null });
  };

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
            label={dict.orders.tabAll}
            type="single"
            selected={status === null}
            onClick={() => setParams({ status: null })}
          />
          {statuses.map((s) => (
            <Chip
              key={s}
              label={s === "proposed" ? dict.orders.stepOffered : dict.orders.tradeStatus[s]}
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
            {dict.orders.list.filter}
            {activeFilters > 0 && (
              <span className="bg-primary-action text-on-primary-action ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-meta font-bold tabular-nums">
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
              placeholder={dict.orders.list.searchPlaceholder}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <ResponsiveDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title={dict.orders.list.filter}
        headerAction={{
          label: dict.orders.list.clearAll,
          onClick: () => setDraft({ side: null, channel: null }),
        }}
        closeOnBackdrop
        desktopContentClassName="w-[440px] max-w-full"
      >
        <div className="flex flex-col gap-4 pt-1">
          <FilterGroup
            label={dict.orders.list.side}
            options={sides.map((s) => ({ value: s, label: dict.orders.side[s] }))}
            value={draft.side}
            onChange={(v) => setDraft((d) => ({ ...d, side: v as TransactionSide | null }))}
          />
          <FilterGroup
            label={dict.orders.list.channel}
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
              {dict.orders.list.viewResults(previewed)}
            </Button>
          </div>
        </div>
      </ResponsiveDialog>

      {!isLoading && visible.length === 0 ? (
        rows.length === 0 ? (
          <EmptyState
            icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
            title={dict.orders.list.emptyTitle}
          />
        ) : (
          <EmptyState
            icon={<ReceiptIcon size={40} className="text-[var(--text-default-placeholder)]" />}
            title={query ? dict.states.noResultTitle : dict.states.noFilterResultTitle}
            body={query ? dict.orders.list.noMatchHint : dict.states.noFilterResultBody}
            action={{ label: dict.states.clearFilters, onClick: clearFilters }}
          />
        )
      ) : (
        <FadeIn key={`${status}|${side}|${channel}`} className="flex flex-col gap-3">
          <div className="table-scroll relative overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border-default)]">
            <Table className="min-w-[1100px] table-fixed">
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="w-[13%] whitespace-nowrap">
                    {dict.orders.list.col.time}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[14%] whitespace-nowrap">
                    {dict.orders.list.col.client}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[19%] whitespace-nowrap">
                    {dict.orders.list.col.product}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[7%] whitespace-nowrap">
                    {dict.orders.list.col.side}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[10%] text-right whitespace-nowrap">
                    {dict.orders.quantityLabel[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[8%] text-right whitespace-nowrap">
                    {dict.orders.priceLabel[asset]}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[11%] text-right whitespace-nowrap">
                    {dict.orders.list.col.amount}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">
                    {dict.orders.list.col.channel}
                  </TableHeaderCell>
                  <TableHeaderCell className="w-[9%] whitespace-nowrap">
                    {dict.orders.list.col.status}
                  </TableHeaderCell>
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
                <p className="text-label whitespace-nowrap text-muted-foreground">
                  {dict.orders.list.perPage}
                </p>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="focus:ring-primary-action cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-label text-foreground focus:ring-1 focus:outline-none"
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
                  {dict.products.pagination.showing(
                    {
                      from: (safePage - 1) * pageSize + 1,
                      to: Math.min(safePage * pageSize, visible.length),
                      total: visible.length,
                    },
                    (n) => (
                      <span className="font-medium text-foreground">{n}</span>
                    ),
                  )}
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
  const locale = useLocale();
  const dict = useT();
  const p = row.proposal;
  const dash = <span className="type-body-2 text-muted-foreground">—</span>;
  return (
    <TableRow>
      <TableCell>
        <p className="type-caption whitespace-nowrap text-muted-foreground tabular-nums">
          {formatLogTime(p.sentAt, locale)}
        </p>
      </TableCell>
      <TableCell>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="type-body-2 truncate text-foreground">
            {maskName(p.clientName, isPrivate)}
          </p>
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
        <Tag text={dict.orders.stepOffered} variant={PROPOSAL_VARIANT} size="large" />
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
  const locale = useLocale();
  const dict = useT();
  return (
    // The whole row opens the trade — same as a booking row on
    // a product's tab, and cheaper than a column of arrows in a
    // table already scrolling sideways.
    <TableRow
      hoverable
      tabIndex={0}
      aria-label={dict.orders.list.openTradeAria(t.symbol, maskName(t.clientName, isPrivate))}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:outline-none focus-visible:ring-inset active:bg-[var(--bg-default-pressed)]"
    >
      <TableCell>
        <p className="type-caption whitespace-nowrap text-muted-foreground tabular-nums">
          {formatLogTime(t.at, locale)}
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
          <p className="type-body-2 truncate !font-semibold text-foreground">{t.symbol}</p>
          <p className="type-caption truncate text-muted-foreground">{t.name}</p>
        </div>
      </TableCell>
      <TableCell>
        <span className={`type-body-2 !font-semibold ${SIDE_CLASS[t.side]}`}>
          {dict.orders.side[t.side]}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="type-body-2 text-foreground tabular-nums">
          {formatQuantity(asset, t.quantity)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="type-body-2 text-foreground tabular-nums">
          {formatPrice(asset, t.price)}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="type-body-2 !font-semibold text-foreground tabular-nums">
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
          text={dict.orders.tradeStatus[t.status]}
          variant={STATUS_TAG[t.status].variant}
          size="large"
        />
      </TableCell>
    </TableRow>
  );
}
