"use client";

/**
 * Pick who a product's Proposal goes to.
 *
 * Modelled on the campaign `ShareDialog` (`promotions/[id]/ShareDialog`), which
 * answers the same question for a campaign's artwork: tick the clients, send
 * once. The two differences are what the desks differ on:
 *
 * - **The roster is the whole book**, not a campaign's eligibility list. Every
 *   client can be offered a product.
 * - **No readiness gate.** A proposal is a document; the four checks
 *   (`ClientReadiness`) gate a *booking*, and applying them here would refuse
 *   to show a client the thing that would make them go and complete them.
 *
 * Each row says where that client already stands on this product, read off the
 * log and the bookings (`proposalOutcome`) — the one thing that stops an IC
 * re-pitching someone who has already bought.
 *
 * **Two steps.** Who, then how: the clients first, then the channels it goes
 * down (`proposal-channels`). YSInvest is always on and cannot be unticked;
 * Email, LINE and Voice AI are added per send, as many as the IC wants.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The send writes a {@link ProposalLog} and delivers nothing. There is no mail
 * service and no app push behind it; the dialog says so rather than implying a
 * document has landed. See `sendProposal` in `contexts/orders-context`.
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Avatar,
  Button,
  Checkbox,
  Chip,
  Popover,
  SearchInput,
  Tag,
  useIsMobile,
} from "@sarunyu/system-one";
import {
  CaretDownIcon,
  DevicesIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  PaperPlaneTiltIcon,
  UsersIcon,
  XIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { SlideSteps } from "@/components/ui/slide-steps";
import { TierBadge, meetsTier, tierLabel, type MembershipTier } from "@/components/ui/tier-badge";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useOrders } from "@/features/orders/store/orders-context";
import { getInitials } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import {
  AVAILABLE_PROPOSAL_CHANNELS,
  PROPOSAL_CHANNEL_META,
  PROPOSAL_CHANNEL_ORDER,
} from "./proposal-channels";
import { BackButton } from "./BackButton";
import { ProposalChip } from "./ProposalChip";
import {
  PROPOSAL_OUTCOME_VARIANT,
  latestProposalFor,
  proposalOutcome,
} from "@/features/orders/lib/order-proposals";
import { useT } from "@/i18n/I18nProvider";
import type { OrderBook, ProposalChannel } from "@/types/order";
import { useClients } from "@/features/clients/hooks/use-clients";
import { proposalMinTier } from "@/features/orders/lib/proposal-eligibility";

/**
 * What a Proposal can be about — any product the IC can put in front of a
 * client. A `BookableProduct` is one as it stands; a mutual fund or a stock,
 * which are offered but never booked through the portal, passes the same three
 * fields plus what its documents are called.
 */
export type ProposalSubject = {
  /** Namespaced for products with no book (`fund-…`, `stock-…`), so a proposal
   *  on one can never be read as one on a structured product's id. */
  id: string;
  /** How it names itself — an underlying, a fund code, a ticker. */
  underlying: string;
  /** A second word beside the name, where the product has one (a coupon). */
  coupon?: string;
  /** What goes out. Defaults to a structured product's two documents. */
  documents?: string;
  /** The lowest membership tier that may be offered this product. Clients
   *  below it are still listed, so the IC can see who is left out and why,
   *  but they cannot be ticked. Unset: anyone can be offered it. */
  minTier?: MembershipTier;
};

/** Which part of the roster the client list shows. */
type ClientScope = "all" | "eligible" | "ineligible";

export type ProposalStep = "clients" | "channels";

/**
 * The dialog the product pages open — the two steps in a `ResponsiveDialog`.
 * Order Management's "สร้าง Order" runs the same steps inside its own modal
 * instead (`ProposalSteps variant="sheet"`, via `OrderBookingModal`).
 */
export function SendProposalDialog({
  open,
  onOpenChange,
  product,
  book,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProposalSubject;
  /** For reading each client's standing. `null` while the book loads, and
   *  always for a product that is offered but never booked. */
  book: OrderBook | null;
  /** Resolves `true` once sent. `false` keeps the dialog open with the picks intact. */
  onConfirm: (clientIds: string[], channels: ProposalChannel[]) => Promise<boolean>;
}) {
  const t = useT();
  const [step, setStep] = useState<ProposalStep>("clients");
  // Closing clears the step; the ticks go with the steps' remount below.
  const setOpen = (next: boolean) => {
    if (!next) setStep("clients");
    onOpenChange(next);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={setOpen}
      title={t.orders.proposal.sendToClients}
      onBack={step === "channels" ? () => setStep("clients") : undefined}
      closeOnBackdrop
      desktopContentClassName="w-[460px] max-w-full"
    >
      {/* Remounted per open, so the next product never inherits the ticks. */}
      <ProposalSteps
        key={open ? "open" : "closed"}
        variant="dialog"
        product={product}
        book={book}
        step={step}
        onStepChange={setStep}
        // Closed only once the send has gone through: closing first threw the
        // IC's picks away whenever the send failed.
        onConfirm={async (clientIds, channels) => {
          const ok = await onConfirm(clientIds, channels);
          if (ok) setOpen(false);
          return ok;
        }}
      />
    </ResponsiveDialog>
  );
}

/**
 * Who, then how: the clients, then the channels — two panes that slide.
 *
 * - `dialog`: inside `ResponsiveDialog`, which pads and scrolls; the product
 *   header stays put above the track and the client list scrolls on its own.
 * - `sheet`: inside `OrderBookingModal`, laid out like the booking form — an
 *   unpadded scroller whose panes pad themselves, and a footer bar outside it.
 *   `lead` panes (asset, product) come first on the same track, so the whole
 *   flow is one slide.
 */
export function ProposalSteps({
  variant,
  product,
  book,
  step,
  onStepChange: setStep,
  lead,
  onListBack,
  initialPicked,
  initialHeight,
  onHeightChange,
  onConfirm,
}: {
  variant: "dialog" | "sheet";
  /** `null` until a lead step has chosen one — the client panes stay empty. */
  product: ProposalSubject | null;
  book: OrderBook | null;
  step: ProposalStep;
  onStepChange: (step: ProposalStep) => void;
  /** Steps before the clients, as `OrderBookingModal`'s `BookingLead`. */
  lead?: { panes: ReactNode[]; index: number | null };
  /** Back from the client list on a phone, where the sheet has no arrow. */
  onListBack?: () => void;
  /** Ticked from the start — the client whose profile it was opened from. */
  initialPicked?: string[];
  /** See `SlideSteps` — carried across the order / Proposal swap. */
  initialHeight?: number;
  onHeightChange?: (height: number) => void;
  /** Resolves `true` once sent. `false` keeps the dialog open with the picks intact. */
  onConfirm: (clientIds: string[], channels: ProposalChannel[]) => Promise<boolean>;
}) {
  const t = useT();
  const clients = useClients();
  const { proposals } = useOrders();
  const { isPrivate } = usePrivacy();
  const isMobile = useIsMobile();
  const minTier = product ? proposalMinTier(product) : undefined;
  // Only clients who can be offered this product can be ticked, including
  // the one a client profile opened the dialog on.
  const eligibleOnly = (ids: string[] | undefined) =>
    new Set(
      (ids ?? []).filter((id) => {
        const client = clients.find((c) => c.id === id);
        // Unknown while the roster loads: kept rather than silently dropped.
        return client === undefined || meetsTier(client.membershipTier, minTier);
      }),
    );
  const [picked, setPicked] = useState<Set<string>>(() => eligibleOnly(initialPicked));
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<ClientScope>("all");
  const [showRecipients, setShowRecipients] = useState(false);
  // While the send is in flight: the button can't be pressed twice.
  const [sending, setSending] = useState(false);
  const [channels, setChannels] = useState<Set<ProposalChannel>>(() => new Set());

  // A different product is a different send: the ticks for the last one must
  // not carry over when a lead step picks another. Reset during render.
  const [productId, setProductId] = useState(product?.id);
  if (product?.id !== productId) {
    setProductId(product?.id);
    setPicked(eligibleOnly(initialPicked));
    setSearch("");
    setScope("all");
    setShowRecipients(false);
    setChannels(new Set());
  }

  /** Each client, with where they already stand on this product and whether
   *  their tier allows it. Eligible clients come first; `sort` is stable, so
   *  the roster's own order holds inside each group. */
  const rows = useMemo(
    () =>
      product
        ? clients
            .map((client) => {
              const sent = latestProposalFor(proposals, product.id, client.id);
              return {
                client,
                sent,
                outcome: sent && book ? proposalOutcome(sent, book) : null,
                eligible: meetsTier(client.membershipTier, minTier),
              };
            })
            .sort((a, b) => Number(b.eligible) - Number(a.eligible))
        : [],
    [clients, proposals, product, book, minTier],
  );

  const query = search.trim().toLowerCase();
  /** The rows the search matches. The chips count these, so their numbers
   *  describe the list on screen rather than the whole book. */
  const searched = useMemo(
    () =>
      query
        ? rows.filter(
            (r) =>
              maskName(r.client.name, isPrivate).toLowerCase().includes(query) ||
              r.client.id.toLowerCase().includes(query),
          )
        : rows,
    [rows, query, isPrivate],
  );
  const eligibleCount = searched.filter((r) => r.eligible).length;
  const visibleRows =
    scope === "all" ? searched : searched.filter((r) => r.eligible === (scope === "eligible"));

  /** "Select all" covers the eligible clients in view. Picks hidden by the
   *  search stay as they are. */
  const selectable = visibleRows.filter((r) => r.eligible).map((r) => r.client.id);
  const allPicked = selectable.length > 0 && selectable.every((id) => picked.has(id));
  const toggleAll = () =>
    setPicked((prev) => {
      const copy = new Set(prev);
      for (const id of selectable) {
        if (allPicked) copy.delete(id);
        else copy.add(id);
      }
      return copy;
    });
  const clearFilters = () => {
    setSearch("");
    setScope("all");
  };
  const scopes: { id: ClientScope; label: string; n: number }[] = [
    { id: "all", label: t.orders.proposal.scopeAll, n: searched.length },
    { id: "eligible", label: t.orders.proposal.scopeEligible, n: eligibleCount },
    {
      id: "ineligible",
      label: t.orders.proposal.scopeIneligible,
      n: searched.length - eligibleCount,
    },
  ];
  const allChannels = AVAILABLE_PROPOSAL_CHANNELS.every((c) => channels.has(c));
  /** Who it is going to, for step two — in the roster's order. */
  const recipients = rows
    .filter((r) => picked.has(r.client.id))
    .map((r) => ({ id: r.client.id, name: maskName(r.client.name, isPrivate) }));

  /** Dropping the last one leaves nothing to send — back to choosing. */
  const removeRecipient = (id: string) => {
    toggle(id, false);
    if (picked.size === 1 && picked.has(id)) setStep("clients");
  };

  const toggleChannel = (c: ProposalChannel, next: boolean) =>
    setChannels((prev) => {
      if (PROPOSAL_CHANNEL_META[c].comingSoon) return prev;
      const copy = new Set(prev);
      if (next) copy.add(c);
      else copy.delete(c);
      return copy;
    });

  const toggle = (id: string, next: boolean) =>
    setPicked((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });

  const sheet = variant === "sheet";
  const atLead = lead !== undefined && (lead.index !== null || !product);

  /* What is going out, named before who it goes to — the IC is about to put
     this in front of a client and has to know which document. */
  const productBox = product && (
    <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
      <DevicesIcon size={16} weight="fill" className="text-primary-action mt-0.5 shrink-0" />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-label font-semibold text-foreground">
          {product.underlying}
          {product.coupon ? ` ${product.coupon}` : ""}
        </span>
        <span className="text-meta leading-snug text-muted-foreground">
          {product.documents ?? t.orders.proposal.defaultDocuments}
        </span>
      </div>
    </div>
  );

  const clientsPane = (
    <div className="flex flex-col gap-4">
      {rows.length > 0 && (
        /* Pinned in the sheet, where the whole modal scrolls: narrowing a long
           list is what the reader wants most once they have scrolled it. In
           the dialog only the list below scrolls, so this stays put anyway. */
        <div
          className={`flex flex-col gap-3 ${sheet ? "sticky top-0 z-10 -mx-1 bg-white px-1 pt-1 pb-1" : ""}`}
        >
          <div className="-mb-1 flex items-center justify-between pl-1">
            <span className="text-label font-semibold text-muted-foreground">
              {t.orders.proposal.clientList}
            </span>
            <Button
              variant="plain"
              size="sm"
              disabled={selectable.length === 0}
              onClick={toggleAll}
            >
              {allPicked ? t.orders.proposal.clearPicked : t.orders.proposal.pickAll}
            </Button>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            onClear={() => setSearch("")}
            placeholder={t.orders.proposal.searchClient}
            size="sm"
            className="w-full"
          />
          {/* Only when the product has a tier requirement; without one every
              client is eligible and the chips would all say the same thing. */}
          {minTier && (
            <div className="flex flex-wrap items-center gap-1.5">
              {scopes.map((s) => (
                <Chip
                  key={s.id}
                  type="single"
                  size="small"
                  label={`${s.label} ${s.n}`}
                  selected={scope === s.id}
                  onClick={() => setScope(s.id)}
                />
              ))}
              {/* The rule behind the chips, pushed to the row's right end:
                  what it requires in words, the icon marking that there is
                  more. The whole pair is the trigger, so a phone gets a
                  target bigger than the icon. A Popover rather than a
                  Tooltip, because a tooltip only opens on hover and this
                  dialog is a bottom sheet on a phone. On a narrow screen it
                  wraps onto its own line, still on the right. */}
              <Popover
                side="bottom"
                align="end"
                className="max-w-[260px] px-3 py-2 text-meta leading-snug text-foreground"
                content={t.orders.proposal.tierRequiredWhy(tierLabel(minTier))}
              >
                <button
                  type="button"
                  className="ml-auto flex shrink-0 cursor-pointer items-center gap-0.5 rounded-full py-1 pr-1 pl-1.5 text-meta font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
                >
                  {t.orders.proposal.tierRule(tierLabel(minTier))}
                  <InfoIcon size={14} weight="bold" aria-hidden />
                </button>
              </Popover>
            </div>
          )}
        </div>
      )}

      {/* Its own scroller in the dialog; in the sheet the modal scrolls. */}
      <div
        className={`flex flex-col gap-2 py-0.5 ${
          sheet ? "" : "max-h-[calc(var(--vh)*46)] overflow-y-auto"
        }`}
      >
        {/* An empty book says so — otherwise the pane is blank and the
            disabled button never says why. Not before a product is chosen:
            the rows are empty then by design. */}
        {product && rows.length === 0 && (
          <EmptyState
            size="compact"
            icon={<UsersIcon size={32} className="text-[var(--text-default-placeholder)]" />}
            title={t.orders.booking.noClients}
          />
        )}
        {/* A search or chip that leaves nothing is a different fact from an
            empty book, and it comes with a way back. */}
        {rows.length > 0 && visibleRows.length === 0 && (
          <EmptyState
            size="compact"
            icon={
              <MagnifyingGlassIcon size={32} className="text-[var(--text-default-placeholder)]" />
            }
            title={t.orders.booking.noClientMatch(search.trim())}
            action={{ label: t.states.clearFilters, onClick: clearFilters }}
          />
        )}
        {visibleRows.map(({ client, sent, outcome, eligible }) => {
          const name = maskName(client.name, isPrivate);
          const checked = picked.has(client.id);
          return (
            <label
              key={client.id}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                !eligible
                  ? "cursor-not-allowed border-border/60 opacity-60"
                  : checked
                    ? "border-primary-action/40 bg-primary-action-light cursor-pointer"
                    : "cursor-pointer border-border/60 hover:border-border hover:bg-muted/40"
              }`}
            >
              <Checkbox
                checked={checked}
                disabled={!eligible}
                onChange={(next) => toggle(client.id, next)}
              />
              <Avatar type="text" initials={getInitials(name)} size="s" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body-sm font-semibold text-foreground">{name}</span>
                {/* Why it can't be ticked, said on the row itself. The full
                    rule is behind the info icon beside the chips. */}
                {!eligible && minTier && (
                  <span className="truncate text-meta text-muted-foreground">
                    {t.orders.proposal.tierRequired(tierLabel(minTier))}
                  </span>
                )}
              </span>
              {/* Where they already stand. Nothing for a client never offered
                  this — an empty row reads as "ยังไม่ส่ง" without a tag saying
                  so, and a tag on every row would make the two that matter hard
                  to pick out. No book to read an outcome off — a fund or a
                  stock — so only that it went. */}
              {sent && !book ? (
                <ProposalChip />
              ) : outcome === "open" ? (
                <ProposalChip label={t.orders.proposalOutcome.open} />
              ) : outcome ? (
                <Tag
                  text={t.orders.proposalOutcome[outcome]}
                  variant={PROPOSAL_OUTCOME_VARIANT[outcome]}
                  size="small"
                />
              ) : null}
              <TierBadge tier={client.membershipTier} className="shrink-0" />
            </label>
          );
        })}
      </div>
    </div>
  );

  const channelsPane = (
    <div className="flex flex-col gap-4">
      {/* Who it is going to, named — step one's choice carried into step two
          so the IC confirms people, not a count. Folded to one line by default
          ("ส่งถึง N คน"); unfolded it is every name, in a box that scrolls past
          three rows so a long list never pushes the channels off screen. */}
      {recipients.length > 0 && (
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/60">
          {/* The whole row is the toggle. Only the row, not the box: the
              unfolded chips carry their own ✕ buttons, and a button cannot sit
              inside another. */}
          <button
            type="button"
            onClick={() => setShowRecipients((v) => !v)}
            aria-expanded={showRecipients}
            aria-label={
              showRecipients
                ? t.orders.proposal.hideRecipients
                : t.orders.proposal.showRecipients(recipients.length)
            }
            className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
          >
            <span className="min-w-0 flex-1 text-label text-muted-foreground">
              {t.orders.proposal.sendingTo}{" "}
              <span className="font-semibold text-foreground">
                {t.orders.proposal.people(recipients.length)}
              </span>
            </span>
            <CaretDownIcon
              size={14}
              weight="bold"
              className={`shrink-0 text-muted-foreground transition-transform ${showRecipients ? "rotate-180" : ""}`}
            />
          </button>
          {showRecipients && (
            <div className="mx-3 mb-2 flex max-h-[88px] flex-wrap gap-1.5 overflow-y-auto border-t border-border/60 pt-2">
              {recipients.map(({ id, name }) => (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 rounded-full bg-muted/50 py-0.5 pr-1 pl-2 text-meta font-medium text-foreground"
                >
                  {name}
                  <button
                    type="button"
                    onClick={() => removeRecipient(id)}
                    aria-label={t.orders.proposal.removeRecipient(name)}
                    className="flex size-4 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-black/10 hover:text-foreground"
                  >
                    <XIcon size={10} weight="bold" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="-mb-1 flex items-center justify-between gap-2 pl-1">
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="text-label font-semibold text-muted-foreground">
              {t.orders.proposal.channels}
            </span>
            {/* Nothing is ticked to start with, so say what the disabled
                send button is waiting for. */}
            {channels.size === 0 && (
              <span className="truncate text-meta text-muted-foreground">
                {t.orders.proposal.channelsMin}
              </span>
            )}
          </span>
          <Button
            variant="plain"
            size="sm"
            onClick={() => setChannels(new Set(allChannels ? [] : AVAILABLE_PROPOSAL_CHANNELS))}
          >
            {allChannels ? t.orders.proposal.clearPicked : t.orders.proposal.pickAll}
          </Button>
        </div>
        {PROPOSAL_CHANNEL_ORDER.map((c) => {
          const { label, Icon, color, comingSoon } = PROPOSAL_CHANNEL_META[c];
          const hint = t.orders.proposalChannelHint[c];
          const checked = channels.has(c);
          return (
            <label
              key={c}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                comingSoon
                  ? "cursor-not-allowed border-border/60 bg-muted/20"
                  : checked
                    ? "border-primary-action/40 bg-primary-action-light cursor-pointer"
                    : "cursor-pointer border-border/60 hover:border-border hover:bg-muted/40"
              }`}
            >
              <Checkbox
                checked={checked}
                disabled={comingSoon}
                onChange={(next) => toggleChannel(c, next)}
              />
              {/* Dimmed as a group, not the whole row: the Coming Soon pill
                  stays at full strength, since it is the row's answer. */}
              <span
                className={`flex min-w-0 flex-1 items-center gap-3 ${comingSoon ? "opacity-50" : ""}`}
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white"
                  style={{ color }}
                >
                  <Icon size={18} weight="fill" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-body-sm font-semibold text-foreground">{label}</span>
                  <span className="truncate text-meta text-muted-foreground">{hint}</span>
                </span>
              </span>
              {comingSoon && (
                <span className="text-primary-action border-primary-action/30 shrink-0 rounded-full border bg-[var(--bg-brand-light)] px-2 py-0.5 text-meta font-semibold whitespace-nowrap">
                  {t.orders.proposal.comingSoon}
                </span>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );

  const footer =
    step === "clients" ? (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        disabled={picked.size === 0}
        onClick={() => setStep("channels")}
      >
        {picked.size > 0 ? t.orders.proposal.nextPicked(picked.size) : t.orders.proposal.next}
      </Button>
    ) : (
      <>
        {/* Said plainly, because it is not true yet: the record is written,
            nothing is delivered. Same wording bargain `ShareDialog` makes. */}
        <p className="flex items-start gap-1.5 text-label leading-snug text-muted-foreground">
          <PaperPlaneTiltIcon size={14} className="mt-0.5 shrink-0" />
          {t.orders.proposal.backOfficeNote}
        </p>
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={picked.size === 0 || channels.size === 0 || sending}
          leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
          onClick={async () => {
            setSending(true);
            try {
              await onConfirm(
                [...picked],
                PROPOSAL_CHANNEL_ORDER.filter((c) => channels.has(c)),
              );
            } finally {
              setSending(false);
            }
          }}
        >
          {sending
            ? t.common.sending
            : picked.size > 1
              ? t.orders.proposal.sendToN(picked.size)
              : t.orders.proposal.send}
        </Button>
      </>
    );

  if (!sheet) {
    return (
      <div className="flex flex-col gap-4 pt-1">
        {productBox}
        {/* Who, then how — two panes that slide rather than swap, so Back
            lands on the roster exactly as it was left (scroll, ticks). */}
        <SlideSteps index={step === "clients" ? 0 : 1}>
          {clientsPane}
          {channelsPane}
        </SlideSteps>
        <div className="flex flex-col gap-3 border-t border-border pt-4">{footer}</div>
      </div>
    );
  }

  const leadCount = lead?.panes.length ?? 0;
  const index = atLead ? (lead?.index ?? 0) : leadCount + (step === "clients" ? 0 : 1);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProposalScroller resetKey={`${lead?.index ?? "x"}-${step}`}>
        <SlideSteps index={index} initialHeight={initialHeight} onHeightChange={onHeightChange}>
          {[
            ...(lead?.panes ?? []).map((pane, i) => <Fragment key={`lead-${i}`}>{pane}</Fragment>),
            <div key="clients" className="flex flex-col gap-4 px-4 pt-3 pb-4 md:px-6">
              {product && (
                <>
                  {/* A phone's sheet has no arrow in its title row. */}
                  {isMobile && onListBack && (
                    <div>
                      <BackButton label={t.orders.back} onClick={onListBack} />
                    </div>
                  )}
                  {productBox}
                  {clientsPane}
                </>
              )}
            </div>,
            <div key="channels" className="flex flex-col gap-4 px-4 pt-3 pb-4 md:px-6">
              {product && (
                <>
                  {isMobile && (
                    <div>
                      <BackButton label={t.orders.back} onClick={() => setStep("clients")} />
                    </div>
                  )}
                  {productBox}
                  {channelsPane}
                </>
              )}
            </div>,
          ]}
        </SlideSteps>
      </ProposalScroller>

      {/* Only past the lead steps — nothing to send while a product is still
          being chosen. */}
      {product && !atLead && (
        <div className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-3 md:px-6">
          {footer}
        </div>
      )}
    </div>
  );
}

/** The sheet's scroller, back at the top whenever the step changes. */
function ProposalScroller({ resetKey, children }: { resetKey: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = 0;
  }, [resetKey]);
  return (
    <div ref={ref} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  );
}
