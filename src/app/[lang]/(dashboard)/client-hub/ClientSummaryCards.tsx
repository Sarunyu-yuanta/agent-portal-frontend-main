"use client";

import { useMemo, useState } from "react";
import { Avatar, BottomSheet } from "@sarunyu/system-one";
import { ArrowsOutSimpleIcon, InfoIcon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { usePrivacy } from "@/contexts/privacy-context";
import { useCountUp } from "@/hooks/use-count-up";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePopover } from "@/hooks/use-popover";
import { maskName } from "@/lib/mask-name";
import { getInitials, formatMillionThb, formatAumThb } from "@/lib/client-utils";
import {
  getClientTotals,
  getSegmentBreakdown,
  getKycDueClients,
  splitKycByExpiry,
  getTopClientsByAum,
  getClientsByCash,
  type KycDueEntry,
} from "./client-hub-data";
import type { Client } from "@/types/domain";

const SEGMENT_COLORS: Record<string, string> = {
  UHNW: "#3b82f6",
  HNW: "#94a3b8",
  Affluent: "#f59e0b",
};

function PopoverChevron({ open }: { open: boolean }) {
  return (
    <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200 ${open ? "bg-primary-action text-white" : "bg-muted text-muted-foreground"}`}>
      <InfoIcon size={12} weight="bold" />
    </div>
  );
}

function CardShell({ open, onClick, children }: { open: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-full text-left flex flex-col gap-2 p-4 rounded-2xl bg-white border transition-colors cursor-pointer ${open ? "border-primary-action" : "border-border hover:border-primary-action/40"}`}
    >
      {children}
    </button>
  );
}

/* Every card in the row — interactive or not, real or skeleton — is the same
   three stacked lines: a small-caps label, one big number, one caption. */

function CardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-meta font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function CardValue({ colorClass = "text-foreground", children }: { colorClass?: string; children: React.ReactNode }) {
  return <p className={`text-[24px] font-bold leading-none tabular-nums ${colorClass}`}>{children}</p>;
}

function CardSub({ children }: { children: React.ReactNode }) {
  return <p className="text-meta text-muted-foreground">{children}</p>;
}

function StaticCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-border">
      <CardLabel>{label}</CardLabel>
      <CardValue>{value}</CardValue>
      <CardSub>{sub}</CardSub>
    </div>
  );
}

/** Matches StaticCard's shape — label, value, sub line. */
function SummaryCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-border">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/**
 * How much list the popover shows before it scrolls. Same number
 * `CompactList` caps its dialog lists at, so the app's two "peek at a list"
 * surfaces agree on what a peek is worth.
 */
const POPOVER_LIST_MAX_H = "max-h-[380px]";

/**
 * A `ClientListRow`'s height in px: `py-2.5`, an `xs` avatar, two lines of text
 * and a divider. Approximate, and only ever used to reserve space — nothing is
 * positioned off it.
 */
const LIST_ROW_H = 57;

/**
 * Panel width — a definite size, not `min-w` over the card's own width.
 *
 * A KPI card is 189–237px across the widths this popover is used at, and a
 * client row doesn't fit in that: at the old 260px floor the sub line wrapped
 * ("ของ AUM" onto its own line) and every name past ~14 characters truncated.
 * 360px leaves the name/sub column about 200px, which clears the longest name
 * and the widest sub line in the data with room to spare.
 *
 * Definite rather than shrink-to-fit because the name uses `truncate`: with an
 * indefinite width the panel would size to the longest *untruncated* name, so
 * one long name would widen the whole panel and truncation would never happen.
 */
const POPOVER_PANEL_W = "w-[360px]";

/**
 * @param position Which of the card's edges the panel hangs from, as Tailwind
 *   classes — per card, and per breakpoint, because a card's column changes
 *   with the grid. The panel is always wider than the card, so it has to grow
 *   sideways, and `main` clips horizontal overflow rather than scrolling it
 *   (see the dashboard layout's `overflow-x-clip`): grow the wrong way off the
 *   outermost column and the panel comes back with its edge shaved off. The
 *   rule is simply that the row's last card pins right — which card that is
 *   differs between the 3-column and 5-column layouts.
 * @param onExpand Opens the same list in the roomier dialog, from an expand
 *   affordance top-right. Was a "View all" button, which misdescribed it: the
 *   panel is capped in height but never in content, so every row is already
 *   here and the label promised something you were looking at. What the control
 *   actually offers is more room — the panel is `absolute` inside a scrolling
 *   `main` and can't simply grow, since a few hundred clients would stretch the
 *   page's own scrollbar and push the tail of the list past the fold, reachable
 *   only by scrolling the page while keeping the pointer inside a popover that
 *   closes 120ms after it leaves.
 *
 *   Not built on `CompactList`, which is the same idea for dialogs: its rows
 *   sit inside padded content, and these are full-bleed with their own `px-4`,
 *   so its `self-end` button would either hang off the edge or force the rows
 *   to indent. The cap constant is shared instead of the component.
 */
function PopoverList({
  title,
  position = "left-0",
  onExpand,
  children,
}: {
  title: string;
  position?: string;
  onExpand?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`absolute top-full mt-1 z-50 bg-white border border-border rounded-xl shadow-xl overflow-hidden ${POPOVER_PANEL_W} ${position}`}
    >
      {/* `min-h-7` keeps the heading in one place whether or not a panel has the
          expand control beside it. `-mr-1` pulls the icon's own padding back so
          it optically lines up with the 16px margin the rows' amounts end on. */}
      <div className="flex min-h-7 items-center justify-between gap-2 px-4 pt-2 pb-1">
        <p className="text-meta font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={`ขยาย${title}`}
            title="ขยาย"
            className="-mr-1 shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowsOutSimpleIcon size={14} weight="bold" />
          </button>
        )}
      </div>
      <div className={`${POPOVER_LIST_MAX_H} overflow-y-auto`}>{children}</div>
    </div>
  );
}

/**
 * Sticky bar above one of these lists — a filter, in the one case there is.
 *
 * Placed by each surface rather than folded into `children` because the
 * horizontal padding is a property of the surface, not of the bar: the bottom
 * sheet and the modal pad their own content, so a bar that also padded itself
 * sat indented from the rows' own rules, while the popover panel pads nothing
 * and needs the bar to supply it. Sticky in all three, so it survives the
 * scroll that a capped list implies.
 */
function ListStickyHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={`sticky top-0 z-10 bg-white pb-2 ${className ?? ""}`}>{children}</div>;
}

function ClientListRow({ rank, name, sub, right }: { rank?: number; name: string; sub: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border">
      {rank !== undefined && <span className="text-label text-muted-foreground w-4 text-right shrink-0">{rank}</span>}
      <Avatar type="text" initials={getInitials(name)} size="xs" />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-meta text-muted-foreground">{sub}</p>
      </div>
      {right}
    </div>
  );
}

/**
 * Which half of the KYC list is on screen. `all` leads because the whole list
 * is the useful default — the split only matters once you're working through
 * one side of it.
 */
type KycFilter = "all" | "expired" | "upcoming";

const KYC_FILTERS: { id: KycFilter; label: string }[] = [
  { id: "all", label: "ทั้งหมด" },
  { id: "upcoming", label: "ใกล้หมดอายุ" },
  { id: "expired", label: "หมดอายุแล้ว" },
];

/**
 * A KPI card whose ⓘ opens a ranked client list — three of the five are this
 * shape, so they share one component rather than three copies of the same
 * popover / bottom-sheet / modal wiring.
 *
 * Three surfaces, one `children`:
 *  - **desktop popover** — capped and scrolling, with an expand control
 *  - **mobile bottom sheet** — nothing to expand into, it already has the
 *    screen; it just scrolls inside the sheet's own 80vh
 *  - **dialog** — where the popover's expand control lands
 *
 * The list is passed in as an element, so it renders in whichever surface is
 * mounted without the caller building it more than once.
 */
function ClientListCard({
  label,
  value,
  sub,
  valueColorClass,
  title,
  position,
  listHeader,
  children,
}: {
  label: string;
  value: string;
  sub: string;
  valueColorClass?: string;
  /** Heading over the list, in all three surfaces. */
  title: string;
  /** Where this card's panel hangs from — see `PopoverList`. */
  position?: string;
  /**
   * Pinned above the rows in every surface — see `ListStickyHeader`, which each
   * surface below wraps this in with its own padding.
   */
  listHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  // Mobile shows the bottom sheet instead of the popover, and the sheet is
  // portalled: leaving click-outside on would close it on the first tap of
  // anything inside — which the KYC filter chips made obvious.
  const { open, setOpen, ref, hoverProps } = usePopover({ dismissOnOutsideClick: !isMobile });
  const [allOpen, setAllOpen] = useState(false);

  return (
    <>
      <div ref={ref} className="relative min-w-0" {...hoverProps}>
        <CardShell open={open} onClick={() => setOpen((p) => !p)}>
          <div className="flex items-center justify-between gap-2">
            <CardLabel>{label}</CardLabel>
            <PopoverChevron open={open} />
          </div>
          <CardValue colorClass={valueColorClass}>{value}</CardValue>
          <CardSub>{sub}</CardSub>
        </CardShell>
        {!isMobile && open && (
          <PopoverList
            title={title}
            position={position}
            onExpand={() => {
              setOpen(false);
              setAllOpen(true);
            }}
          >
            {/* The one surface with no padding of its own, so the header
                carries the 16px that lines it up with the panel heading and
                the rows' text. */}
            {listHeader && <ListStickyHeader className="px-4 pt-1">{listHeader}</ListStickyHeader>}
            {children}
          </PopoverList>
        )}
        {isMobile && (
          <BottomSheet
            open={open}
            onOpenChange={setOpen}
            title={title}
            showHandle
            showHeader
            rightSide="none"
            // `px-0` so the rows keep their own 16px and their rules run to the
            // sheet's edges, but `pt-3` rather than a flat `p-0`: the sheet's
            // own 8px was the only thing between its title and the first row,
            // and dropping it left the list sitting on the heading.
            //
            // `min-h-0` so this can shrink below its content inside the sheet's
            // `flex flex-col` / `max-h-[calc(var(--vh)*80)]`, which is what lets the scroll
            // engage. Without it a long list overflowed the sheet upward — the
            // drawer caps its own height but doesn't scroll what's inside.
            contentClassName="flex flex-col px-0 pt-3 pb-0 overflow-y-auto min-h-0"
          >
            {/* No padding of its own: the sheet pads horizontally, and the
                `pt-3` above is the gap under the title. */}
            {listHeader && <ListStickyHeader>{listHeader}</ListStickyHeader>}
            {children}
          </BottomSheet>
        )}
      </div>

      {/* Rendered outside the card's wrapper so it isn't inside the `relative`
          box the popover is positioned against. Fixed either way, but nesting a
          full-screen surface inside one grid cell reads as a mistake. */}
      <ResponsiveDialog
        open={allOpen}
        onOpenChange={setAllOpen}
        title={title}
        mobileContentClassName="flex flex-col px-0 pt-3 pb-0 overflow-y-auto min-h-0"
        desktopContentClassName="flex flex-col min-w-[420px] max-w-[520px] max-h-[calc(var(--vh)*70)] overflow-y-auto"
      >
        {/* No `px` in either variant: the modal and the sheet both pad their
            own content, and this is the surface where the extra 16px was most
            obvious — a filter bar visibly narrower than the rows it filters. */}
        {listHeader && <ListStickyHeader className="pt-1">{listHeader}</ListStickyHeader>}
        {children}
      </ResponsiveDialog>
    </>
  );
}

export function ClientSummaryCards({ clients, isLoading }: { clients: Client[]; isLoading?: boolean }) {
  const { isPrivate } = usePrivacy();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const {
    open: segmentOpen,
    setOpen: setSegmentOpen,
    ref: segmentRef,
    hoverProps: segmentHoverProps,
  } = usePopover({ dismissOnOutsideClick: !isMobile });
  // The three list cards own their own popover state inside `ClientListCard`;
  // only Total Clients still needs it here, since its panel is a segment bar
  // rather than a client list.

  // Lives here rather than beside the chips so the popover, the bottom sheet
  // and the expanded dialog share one filter: `kycListContent` is handed to
  // all three, and a filter that reset on the way into the full list would
  // undo the narrowing the user just did.
  const [kycFilter, setKycFilter] = useState<KycFilter>("all");

  const { totalAum, totalCash } = useMemo(() => getClientTotals(clients), [clients]);
  const segmentBreakdown = useMemo(() => getSegmentBreakdown(clients), [clients]);
  const kycDueClients = useMemo(() => getKycDueClients(clients), [clients]);
  const kycSections = useMemo(() => splitKycByExpiry(kycDueClients), [kycDueClients]);
  const topClients = useMemo(() => getTopClientsByAum(clients), [clients]);
  const cashClients = useMemo(() => getClientsByCash(clients), [clients]);

  const animatedClientCount = useCountUp(clients.length);
  const animatedKycCount = useCountUp(kycDueClients.length);
  const animatedTotalAum = useCountUp(totalAum);
  const animatedTotalCash = useCountUp(totalCash);
  const animatedAssetValue = useCountUp(totalAum - totalCash);

  const segmentBreakdownContent = (
    <>
      <div className="flex h-2 rounded-full overflow-hidden mb-3">
        {segmentBreakdown.map(([tier, count]) => (
          <div key={tier} style={{ width: `${(count / clients.length) * 100}%`, backgroundColor: SEGMENT_COLORS[tier] ?? "#94a3b8" }} />
        ))}
      </div>
      {segmentBreakdown.map(([tier, count]) => (
        <div key={tier} className="flex items-center justify-between gap-6 py-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEGMENT_COLORS[tier] ?? "#94a3b8" }} />
            <span className="text-body-sm text-foreground">{tier}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-body font-bold text-foreground">{count}</span>
            <span className="text-meta text-muted-foreground">({Math.round((count / clients.length) * 100)}%)</span>
          </div>
        </div>
      ))}
    </>
  );

  const assetListContent = (
    <>
      {topClients.map((c, i) => {
        const name = maskName(c.name, isPrivate);
        return (
          <ClientListRow
            key={c.id}
            rank={i + 1}
            name={name}
            sub={c.tier}
            right={<span className="text-label font-bold text-foreground shrink-0">{formatAumThb(c.aum)}</span>}
          />
        );
      })}
    </>
  );

  /* Ranked like the asset list, because the question this card answers is the
     same shape — "whose cash is this?" — and the answer is only useful in the
     order you'd act on it. The percentage rides along in the sub line: ฿ 44M
     idle out of ฿ 890M is a different conversation from ฿ 57M out of ฿ 180M. */
  const cashListContent = (
    <>
      {cashClients.length === 0
        ? <p className="text-body-sm text-muted-foreground px-4 py-3">ไม่มีลูกค้าที่มีเงินรอลงทุน</p>
        : cashClients.map(({ client, cashThb }, i) => (
            <ClientListRow
              key={client.id}
              rank={i + 1}
              name={maskName(client.name, isPrivate)}
              sub={`${client.tier} · ${client.cashIdlePct}% ของ AUM`}
              right={
                <span className="text-label font-bold text-foreground shrink-0">
                  {formatMillionThb(cashThb)}
                </span>
              }
            />
          ))
      }
    </>
  );

  /* The day count keeps its sign. With the two halves interleaved under
     "ทั้งหมด" nothing else on the row says which side of the expiry line it
     falls on, so `-10d` is doing real work — it's only redundant when a header
     or chip has already declared the group. */
  const renderKycRow = (k: KycDueEntry) => (
    <ClientListRow
      key={k.id}
      name={maskName(k.client.name, isPrivate)}
      sub={`${k.client.tier} · ${k.nextReview}`}
      right={
        <span className={`text-label font-bold shrink-0 ${k.daysUntilExpiry <= 7 ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"}`}>
          {k.daysUntilExpiry}d
        </span>
      }
    />
  );

  /* Offered only when both halves have rows: with every client on one side of
     the expiry line there is nothing to narrow down, and a segment reading
     "(0)" invites a click that empties the panel. */
  const kycFilterable = kycSections.expired.length > 0 && kycSections.upcoming.length > 0;
  const kycFilterCounts: Record<KycFilter, number> = {
    all: kycDueClients.length,
    expired: kycSections.expired.length,
    upcoming: kycSections.upcoming.length,
  };
  const kycRows = !kycFilterable || kycFilter === "all" ? kycDueClients : kycSections[kycFilter];

  /**
   * shadcn `Tabs` as a segmented control, same as the notes sidebar's filter —
   * no `TabsContent`, the list below just reads `kycFilter`. `w-full` overrides
   * the list's `w-fit` so the three segments split whatever width they're
   * given, and `text-xs` overrides the trigger's `text-sm`, which in a 360px
   * popover couldn't fit a Thai label plus its count in a third of the width.
   *
   * Handed to `ClientListCard` as its `listHeader` rather than sitting at the
   * top of `kycListContent`, so each surface can pad it to its own edges.
   */
  const kycFilterBar = kycFilterable ? (
    <Tabs value={kycFilter} onValueChange={(v) => setKycFilter(v as KycFilter)}>
      <TabsList aria-label="กรองรายการ KYC" className="w-full">
        {KYC_FILTERS.map(({ id, label }) => (
          <TabsTrigger key={id} value={id} className="text-xs">
            {label} ({kycFilterCounts[id]})
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  ) : undefined;

  const kycListContent = (
    <>
      {/* Space held for the unfiltered list, so picking a segment narrows the
          rows without resizing the surface around them — the bottom sheet sizes
          to its content, and a sheet that shrank from six rows to one bounced
          the control you were aiming at up the screen. Reserved rather than
          fixed: every surface still caps its own height (80vh in the sheet,
          `POPOVER_LIST_MAX_H` in the popover), so a long list scrolls as
          before instead of forcing a tall panel. */}
      <div style={{ minHeight: kycDueClients.length * LIST_ROW_H }}>
        {kycRows.length === 0 ? (
          <p className="text-body-sm text-muted-foreground px-4 py-3">ไม่มีลูกค้าที่ KYC ใกล้ครบกำหนด</p>
        ) : (
          kycRows.map(renderKycRow)
        )}
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SummaryCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Total Clients */}
      <div ref={segmentRef} className="relative min-w-0" {...segmentHoverProps}>
        <CardShell open={segmentOpen} onClick={() => setSegmentOpen((p) => !p)}>
          <div className="flex items-center justify-between gap-2">
            <CardLabel>Total Clients</CardLabel>
            <PopoverChevron open={segmentOpen} />
          </div>
          <CardValue>{Math.round(animatedClientCount)}</CardValue>
          <CardSub>ราย</CardSub>
        </CardShell>
        {!isMobile && segmentOpen && clients.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-border rounded-xl shadow-xl p-4 min-w-[200px]">
            <p className="text-meta font-bold uppercase tracking-wider text-muted-foreground mb-2.5">สัดส่วนตาม Segment</p>
            {segmentBreakdownContent}
          </div>
        )}
        {isMobile && (
          <BottomSheet
            open={segmentOpen && clients.length > 0}
            onOpenChange={setSegmentOpen}
            title="สัดส่วนตาม Segment"
            showHandle
            showHeader
            rightSide="none"
            contentClassName="flex flex-col gap-1 p-4"
          >
            {segmentBreakdownContent}
          </BottomSheet>
        )}
      </div>

      {/* 2. Wealth Under Advice */}
      <StaticCard label="Wealth Under Advice" value={formatMillionThb(animatedTotalAum)} sub="AUM รวมทั้งหมด" />

      {/* 3. มูลค่าทรัพย์สิน — last in the row at 3 columns (768–1023px), third
             of five above that, so which edge its panel hangs from flips at
             `lg`. See `PopoverList`'s `position`. */}
      <ClientListCard
        label="มูลค่าทรัพย์สิน"
        value={formatMillionThb(animatedAssetValue)}
        sub="ไม่รวม cash"
        title="ลูกค้าเรียงตามมูลค่าทรัพย์สิน"
        position="right-0 lg:right-auto lg:left-0"
      >
        {assetListContent}
      </ClientListCard>

      {/* 4. KYC ครบกำหนด — first of the second row at 3 columns, fourth of five
             above that. Never the row's last card either way, so the default
             left anchor always has room to its right. */}
      <ClientListCard
        label="KYC ครบกำหนด"
        value={String(Math.round(animatedKycCount))}
        sub="ภายใน 30 วัน"
        valueColorClass={kycDueClients.length > 0 ? "text-[var(--text-warning-primary)]" : "text-foreground"}
        title="ลูกค้าที่ KYC ใกล้หมดอายุ"
        listHeader={kycFilterBar}
      >
        {kycListContent}
      </ClientListCard>

      {/* 5. Cash Under Advice — last of five at `lg`, and pinning right also
             works from the second column it sits in below that, so this one
             needs no breakpoint switch. */}
      <ClientListCard
        label="Cash Under Advice"
        value={formatMillionThb(animatedTotalCash)}
        sub="เงินรอลงทุน"
        title="ลูกค้าเรียงตามเงินรอลงทุน"
        position="right-0"
      >
        {cashListContent}
      </ClientListCard>
    </div>
  );
}
