"use client";

/**
 * The booking form: pick the customer, read their four statuses back, enter the
 * notional, book.
 *
 * ## One screen, with the amount gated in place
 *
 * The amount used to be a second step behind `ถัดไป`. It is back on the same
 * screen as the checks, so the IC sees the whole order at once — but it is
 * **disabled until all four pass**, faded rather than hidden, so the reader can
 * see what comes next and that it is not yet open to them. That keeps what the
 * step bought (no typing an amount for a client who cannot buy) without the
 * extra click.
 *
 * The primary button — `จองซื้อ` on a basket, `ส่งคำสั่งซื้อ` on a bond, see
 * {@link ORDER_WORDS} — still re-checks readiness rather than trusting the
 * faded section: a
 * check can expire while the form is open. A client who is missing something is
 * fixed in the system that owns the record, which is where
 * "ส่งให้ลูกค้าดำเนินการ" sends them — the form has no override.
 */

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import {
  Alert,
  Avatar,
  Button,
  SearchInput,
  TextArea,
  UploadArea,
  UploadItem,
  useIsMobile,
  type ToastStatus,
} from "@sarunyu/system-one";
import {
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIncomingIcon,
  PhoneOutgoingIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { SLIDE_MS, SlideSteps } from "@/components/ui/slide-steps";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { getCallLogs } from "@/data/call-log-data";
import { IC_NAME, IC_TEAM } from "@/lib/current-ic";
import { formatThbAmount, getInitial, parseAmount } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type {
  Booking,
  Client,
  ClientReadiness,
  RequirementItem,
  RequirementKey,
  EvidenceChannel,
  OrderEvidence,
  RequirementStatus,
} from "@/types/domain";
import { bookingModeFor, type BookableProduct } from "./bookable-products";
import { BackButton } from "./BackButton";
import { ProposalSteps, type ProposalStep, type ProposalSubject } from "./SendProposalDialog";
import { proposalSentMessage } from "./useSendProposal";
import { ORDER_WORDS } from "./order-words";
import { SHEET_DASHED, SHEET_PANEL, SheetBlock, SheetRow } from "./detail-sheet-ui";
import {
  CALL_DIRECTION_LABEL,
  EVIDENCE_CHANNEL,
  EVIDENCE_CHANNELS,
  evidenceComplete,
  evidenceRequired,
  formatFileSize,
  noteRequired,
} from "./order-evidence";
import {
  cashInCurrency,
  clientCashThb,
  formatOrderAmount,
  bookingRemaining,
  isBookClosed,
  isBookingOpen,
  minTicketFor,
} from "./order-book";
import { clientReadiness, requestableKeys, shortRequirementLabel } from "./order-requirements";
import {
  useClientReadiness,
  useOrderBook,
  useRequestsFor,
  useRosterReadiness,
} from "./use-order-books";

/**
 * Steps that come before the client list, in the same modal — Order
 * Management's "สร้าง Order" asks for the asset and the product first. They are
 * leading panes of the booking's own track, so the whole flow slides as one
 * instead of one modal closing and another opening.
 */
export type BookingLead = {
  /** One pane per step, in order. */
  panes: ReactNode[];
  /** The lead step showing, or `null` once a product is chosen. */
  index: number | null;
  /** The modal's title while a lead step is showing. */
  title: string;
  /** Back from the lead step showing, when there is a step before it. */
  onBack?: () => void;
};

export function OrderBookingModal({
  open,
  product,
  lead,
  onClose,
  onNotice,
  onBooked,
  onBack,
  fixedClientId,
  mode = "order",
  subject = null,
}: {
  open: boolean;
  /** `null` only with a `lead` that has not reached a product yet. */
  product: BookableProduct | null;
  lead?: BookingLead;
  /**
   * What the steps after the lead do. `"proposal"` sends the subject's
   * Proposal instead of booking — clients (many), then channels — on the same
   * track, so "สร้าง Order" can do either from one modal.
   */
  mode?: "order" | "proposal";
  /** The product a Proposal goes out for — proposal mode only. */
  subject?: ProposalSubject | null;
  /**
   * Book for this client and no other — opened from the client's own profile,
   * where choosing a client again would be a step with one right answer. The
   * client list is skipped and the form cannot change client; back goes to
   * `onBack` (or closes).
   */
  fixedClientId?: string;
  /**
   * Where the client list goes back to, when it was reached from somewhere
   * with a step before it — Order Management's product picker. Without it the
   * list is the first step and shows no arrow.
   */
  onBack?: () => void;
  onClose: () => void;
  /** The host owns the toast stack — a booking closes this, taking its DOM. */
  onNotice: (message: string, status: ToastStatus) => void;
  /** After a booking lands — the product page uses it to show the new row. */
  onBooked?: (booking: Booking) => void;
}) {
  /**
   * The chosen customer lives here rather than in the form, because the back
   * button that clears it sits in the modal's own title row.
   */
  const [clientId, setClientId] = useState(fixedClientId ?? "");
  /** Leaving the form: to the client list, or — with a fixed client — out. */
  const leaveForm = fixedClientId ? (onBack ?? onClose) : () => setClientId("");
  /**
   * On the summary rather than the form — the step between filling the order
   * in and sending it. Held here with the client, because the arrow that
   * steps back from it is in the title row too.
   */
  const [reviewing, setReviewing] = useState(false);
  // Reset on every open, during render rather than in an effect — the same
  // reason the form below remounts: a reopened form must not still hold the
  // last client.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setClientId(fixedClientId ?? "");
      setReviewing(false);
    }
  }

  /** Proposal mode's step, held here for the title row's arrow. */
  const [proposalStep, setProposalStep] = useState<ProposalStep>("clients");
  const [subjectId, setSubjectId] = useState(subject?.id);
  if (subject?.id !== subjectId) {
    setSubjectId(subject?.id);
    setProposalStep("clients");
  }
  if (open !== wasOpen && open) setProposalStep("clients");
  /**
   * The last height the steps' track settled on. Switching between order and
   * Proposal swaps the body below for a different component — a new track —
   * and without this the modal would jump to the new height in one frame.
   * Cleared on open, so a fresh modal opens at its own height.
   */
  const [trackHeight, setTrackHeight] = useState<number | undefined>(undefined);
  if (open !== wasOpen && open) setTrackHeight(undefined);
  const { sendProposal } = useOrders();
  const { data: subjectBook } = useOrderBook(subject?.id ?? "");

  const proposing = mode === "proposal";
  const target = proposing ? subject : product;
  const atLead = lead !== undefined && (lead.index !== null || !target);
  if (!target && !lead) return null;

  if (proposing) {
    return (
      <ResponsiveBottomSheetModal
        open={open}
        onClose={onClose}
        title={
          atLead || !subject
            ? (lead?.title ?? "")
            : `ส่ง Proposal · ${subject.underlying}${subject.coupon ? ` ${subject.coupon}` : ""}`
        }
        titleId="order-booking-title"
        desktopMaxWidth="max-w-[614px]"
        desktopTitleIcon={
          atLead ? (
            lead?.onBack ? <BackButton label="ย้อนกลับ" onClick={lead.onBack} /> : undefined
          ) : proposalStep === "channels" ? (
            <BackButton label="ย้อนกลับ" onClick={() => setProposalStep("clients")} />
          ) : onBack ? (
            <BackButton label="ย้อนกลับ" onClick={onBack} />
          ) : undefined
        }
      >
        <ProposalSteps
          key={open ? "open" : "closed"}
          variant="sheet"
          product={subject}
          book={subjectBook}
          step={proposalStep}
          onStepChange={setProposalStep}
          lead={lead}
          onListBack={onBack}
          initialPicked={fixedClientId ? [fixedClientId] : undefined}
          initialHeight={trackHeight}
          onHeightChange={setTrackHeight}
          onConfirm={(clientIds, channels) => {
            if (!subject) return;
            void (async () => {
              // The rows actually written, not the ids asked for — see
              // `useSendProposal`.
              const rows = await sendProposal({ productId: subject.id, clientIds, channels });
              onClose();
              onNotice(proposalSentMessage(subject.underlying, rows), "success");
            })();
          }}
        />
      </ResponsiveBottomSheetModal>
    );
  }

  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={
        atLead || !product
          ? (lead?.title ?? "")
          : `ทำรายการ${ORDER_WORDS[bookingModeFor(product)].action} ${product.underlying} ${product.coupon}`
      }
      titleId="order-booking-title"
      // Two columns of short fields and one amount — past about this width the
      // grid stops being two columns of a form and becomes two columns of a
      // page, with the eye travelling further than any of the values are long.
      desktopMaxWidth="max-w-[614px]"
      // Beside the title, where a back arrow is looked for: from the form to
      // the client list, and from the list to whatever opened it, if that was
      // a step of its own (`onBack`).
      desktopTitleIcon={
        atLead ? (
          lead?.onBack ? <BackButton label="ย้อนกลับ" onClick={lead.onBack} /> : undefined
        ) : clientId && reviewing ? (
          <BackButton label="กลับไปแก้ไข" onClick={() => setReviewing(false)} />
        ) : clientId ? (
          fixedClientId && !onBack ? undefined : <BackButton onClick={leaveForm} />
        ) : onBack ? (
          <BackButton onClick={onBack} />
        ) : undefined
      }
    >
      {/* Remounting per open resets the customer and the amount — a form
          reopened still holding the last client's number is a mis-booking
          waiting to happen. */}
      <BookingForm
        key={open ? "open" : "closed"}
        product={product}
        lead={lead}
        onListBack={fixedClientId ? undefined : onBack}
        clientId={clientId}
        onClientChange={(id) => {
          setReviewing(false);
          if (id) setClientId(id);
          else leaveForm();
        }}
        reviewing={reviewing}
        onReviewChange={setReviewing}
        initialHeight={trackHeight}
        onHeightChange={setTrackHeight}
        clientLocked={Boolean(fixedClientId)}
        onClose={onClose}
        onNotice={onNotice}
        onBooked={onBooked}
      />
    </ResponsiveBottomSheetModal>
  );
}

function BookingForm({
  product,
  lead,
  onListBack,
  clientId,
  onClientChange: setClientId,
  reviewing,
  onReviewChange,
  initialHeight,
  onHeightChange,
  clientLocked = false,
  onClose,
  onNotice,
  onBooked: onBookedProp,
}: {
  /** `null` until a lead step has chosen one — the client panes stay empty. */
  product: BookableProduct | null;
  lead?: Pick<BookingLead, "panes" | "index">;
  /** Back from the client list on a phone, where the title row has no arrow. */
  onListBack?: () => void;
  clientId: string;
  onClientChange: (id: string) => void;
  /** On the summary step — after the form, before anything is sent. */
  reviewing: boolean;
  onReviewChange: (next: boolean) => void;
  /** See `SlideSteps` — carried across the order / Proposal swap. */
  initialHeight?: number;
  onHeightChange?: (height: number) => void;
  /** The client was fixed by the opener — no "เปลี่ยน". */
  clientLocked?: boolean;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
  onBooked?: (booking: Booking) => void;
}) {
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const { placeOrder } = useOrders();

  const isMobile = useIsMobile();
  const [raw, setRaw] = useState("");
  const [booking, setBooking] = useState(false);
  /** The attached proof of the client's instruction — every desk, see `evidenceRequired`. */
  const [evidence, setEvidence] = useState<OrderEvidence | null>(null);
  const needsEvidence = product ? evidenceRequired(bookingModeFor(product)) : false;

  // A different product is a different order: an amount or a proof typed for
  // the last one must not carry over when a lead step picks another. Reset
  // during render, as the modal does for its client.
  const [productId, setProductId] = useState(product?.id);
  if (product?.id !== productId) {
    setProductId(product?.id);
    setRaw("");
    setEvidence(null);
  }

  const client = clients.find((c) => c.id === clientId) ?? null;
  const atForm = client !== null;

  /**
   * Who the form pane is about, which lags `client` on the way back.
   *
   * Both panes stay mounted so they can slide past each other, so for the
   * ~200ms it takes the form to leave it still needs someone to be about —
   * clearing it with `clientId` would empty the pane while it is still on
   * screen. Set in the same breath as the selection going forward, so the pane
   * is never blank on the way in. Same split `KycAlertsPanel` makes, which is
   * where this track comes from.
   */
  // Seeded from `clientId`: a form opened with its client already fixed (the
  // client's own profile) never passes through a selection to set this, and
  // started blank it left the form pane empty.
  const [shownId, setShownId] = useState(clientId);
  const shown = clients.find((c) => c.id === shownId) ?? null;
  useEffect(() => {
    if (clientId) return;
    const t = setTimeout(() => setShownId(""), SLIDE_MS);
    return () => clearTimeout(t);
  }, [clientId]);

  // Built from the request store directly rather than `useClientReadiness`,
  // which needs a product — and before a lead step picks one there is none.
  const requests = useRequestsFor(shown?.id ?? "", product?.id ?? "");
  const readiness = useMemo(
    () => (shown && product ? clientReadiness(shown, product, requests) : null),
    [shown, product, requests],
  );
  const checks = readiness?.items ?? [];
  /** The gate on the amount section — and the one on the booking itself.
   *  Keyed off the live selection, not `shown`: the footer outlives the slide
   *  back to the list, and nothing on it may stay armed once Back is pressed. */
  const ready = atForm && readiness?.status === "ready";

  /** Lead steps first (when the opener has any), then the list, then the form. */
  const leadCount = lead?.panes.length ?? 0;
  const stepIndex =
    lead && (lead.index !== null || !product)
      ? (lead.index ?? 0)
      : leadCount + (atForm ? (reviewing ? 2 : 1) : 0);

  /** The modal's scroller — the customer list needs it to reset on search. */
  const bodyRef = useRef<HTMLDivElement>(null);
  // Each lead step opens at its top: the product list is long, and arriving
  // on it at the client list's scroll offset would hide its search.
  const leadIndex = lead?.index;
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [leadIndex]);
  // The summary opens at its top — it is reached from the bottom of a long
  // form. Only on the way in: Back lands on the form where it was left.
  useEffect(() => {
    if (reviewing && bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [reviewing]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* No padding of its own — each pane pads itself.
          The sticky header inside the picker has to bleed to the modal's edges
          to cover the rows passing under it, and doing that from inside a
          padded scroller meant cancelling the padding with a negative margin.
          That pair has to match at every breakpoint, and it did not: the block
          ended up 8px further in than the list below it. Padding the panes
          instead means there is no pair to keep in step.

          `overflow-x-hidden` here rather than on the track below, which is what
          actually clips the off-screen pane: an `overflow: hidden` box between
          a sticky element and its scroller becomes the scrollport it sticks to,
          and that box never scrolls — so clipping on the track would have left
          the picker's search header scrolling away with the rows. Hidden on the
          same element that scrolls is the one place it costs nothing. */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
        {/* The form is two screens in one modal: choose, then fill in. Until a
            customer is chosen there is nothing to show but their statuses, and
            every one of them would read "—" — so the list gets the whole body
            instead of sitting in a dropdown above four empty cards.

            They are one strip that slides rather than two views that swap: the
            form is a drill-in from the row the IC just pressed, and Back has to
            land on the list exactly as it was — same scroll position, same
            search. */}
        {/* The off-screen pane keeps its own height, so an overhang would be
            blank scroll inside `bodyRef` — `SlideSteps` clips it with
            `overflow-clip`, not `hidden`, so the picker's sticky search header
            still sticks to that scroller. It also `inert`s the hidden pane. */}
        <SlideSteps
          index={stepIndex}
          initialHeight={initialHeight}
          onHeightChange={onHeightChange}
        >
          {[
            ...(lead?.panes ?? []).map((pane, i) => (
              <Fragment key={`lead-${i}`}>{pane}</Fragment>
            )),
            <div key="customers">
              {product && (
                <>
                  {/* A phone's sheet has no arrow in its title row, so the way
                      back to the lead step sits at the top of the list. */}
                  {isMobile && onListBack && (
                    <div className="px-4 pt-3">
                      <BackButton label="ย้อนกลับ" onClick={onListBack} />
                    </div>
                  )}
                  <CustomerPicker
                    product={product}
                    scrollerRef={bodyRef}
                    onSelect={(id) => {
                      // Together, and in this order: the pane has to be about
                      // someone before it starts sliding into view.
                      setShownId(id);
                      setClientId(id);
                      // A different customer is a different order — never carry the
                      // last one's amount over to them.
                      setRaw("");
                    }}
                  />
                </>
              )}
            </div>,
            <div
              key="form"
              // `pt-5`, matching the gap between every section below it: the
              // first block was sitting nearer the title than the blocks are to
              // each other, which read as the header's padding rather than as
              // the form starting.
              className="px-4 pb-4 pt-5 md:px-6"
            >
              {shown && product && (
                <>
                  {/* The bottom sheet's header is its own and takes no icon, so
                      on a phone the back arrow opens the body instead of
                      sharing the title row. */}
                  {isMobile && (
                    <div className="mb-2">
                      <BackButton onClick={() => setClientId("")} />
                    </div>
                  )}
                  {/* A wider row gap than column gap: the columns are already
                      far apart across the modal, where the rows are two lines
                      of text that would otherwise run together. */}
                  <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
                    <FieldCard label="Customer">
                      {/* The link trails the name, not the label. "เปลี่ยน" acts
                          on the customer, and the customer is the line below the
                          caption — put it up there and it reads as an action on
                          the word "Customer" instead. `flex-wrap` lets it drop to
                          its own line rather than squeezing a long name. */}
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="type-body-2 min-w-0 truncate !font-semibold text-foreground">
                          {shown.id} - {maskName(shown.name, isPrivate)}
                        </span>
                        {!clientLocked && (
                          <ActionLink
                            label="เปลี่ยน"
                            disabled={false}
                            onClick={() => setClientId("")}
                          />
                        )}
                      </div>
                    </FieldCard>
                    <ReadOnlyField
                      label="Account No"
                      value={getClientProfile(shown.id).accountNo}
                    />
                    {/* The IC sits with the customer, above the checks, because
                        the four of them together are the header of the order:
                        who it is for, on which account, placed by whom, from
                        which desk. None of it is a decision — putting it after
                        the checks made the reader step over a block of facts to
                        reach the amount. */}
                    <ReadOnlyField label="IC Name" value={IC_NAME} />
                    <ReadOnlyField label="IC Team" value={IC_TEAM} />
                  </div>

                  {/* The checks keep the receipt's rows — four grey cards made
                      the block that needs no attention the heaviest thing on
                      the screen. The facts above stay as cards: they are the
                      order's header, and the grid is what pairs them off.

                      `mt-5` because the panel carries its own fill: the gap has
                      to read as a gap between two blocks rather than as the
                      panel's padding, and the grid's last row sat on the fill's
                      edge without it. The old layout got the same separation
                      from a rule and `mt-4 pt-4`, which the panel replaced. */}
                  <div className={`mt-5 ${SHEET_PANEL}`}>
                    <StatusGrid product={product} client={shown} onNotice={onNotice} />
                  </div>
                  {/* The steps after the checks do not exist until the checks
                      pass.

                      They used to render faded and inert, on the reasoning
                      that the IC should see what is coming. What that actually
                      produced was two-thirds of a long modal greyed out under
                      a warning — the reader scrolled past an amount they could
                      not type and a file they could not attach to reach a dead
                      button. The line below says what is missing and where to
                      fix it, which is the whole of what the faded blocks were
                      communicating. */}
                  {ready ? (
                    <>
                      <AmountSection
                        product={product}
                        client={shown}
                        raw={raw}
                        onRawChange={setRaw}
                      />
                      {needsEvidence && (
                        <EvidenceSection
                          clientId={shown.id}
                          value={evidence}
                          onChange={setEvidence}
                        />
                      )}
                    </>
                  ) : (
                    <Alert
                      status="warning"
                      message={`${ORDER_WORDS[bookingModeFor(product)].prereq}ยังไม่ครบ (${
                        checks.filter((i) => i.status === "passed").length
                      }/${checks.length}) — ทำให้ครบก่อนจึงจะ${
                        ORDER_WORDS[bookingModeFor(product)].action
                      }ได้`}
                      multiline
                      className="mt-5"
                    />
                  )}
                </>
              )}
            </div>,
            // The order as it will go — read through once before it is sent,
            // with nothing on it left to edit. Changing anything is Back.
            <div key="summary" className="px-4 pb-4 pt-5 md:px-6">
              {shown && product && (
                <>
                  {isMobile && (
                    <div className="mb-2">
                      <BackButton label="กลับไปแก้ไข" onClick={() => onReviewChange(false)} />
                    </div>
                  )}
                  <BookingSummary
                    product={product}
                    client={shown}
                    raw={raw}
                    evidence={evidence}
                    cashAvailable={cashInCurrency(clientCashThb(shown), product.currency)}
                  />
                </>
              )}
            </div>,
          ]}
        </SlideSteps>
      </div>

      {/* Only on the second screen. Both of its buttons are about an order that
          does not exist yet while the list is up — the primary button can only
          ever be dead there, and a dead primary under a list of people reads as
          "one of these should have enabled it". The ✕ in the title row is the
          way out of the picker; Cancel comes back with the form it belongs to.

          Tied to `shown`, so it leaves with the pane rather than a beat before
          it: unmounting on `client` shortened the modal in one frame while the
          track was still animating its height, and the two read as a stumble.
          `ready` is false the moment Back is pressed, so nothing here is live
          during the slide out. */}
      {shown && product && (
        <Footer
          ready={ready}
          evidence={evidence}
          product={product}
          cashAvailable={cashInCurrency(clientCashThb(shown), product.currency)}
          raw={raw}
          booking={booking}
          reviewing={reviewing}
          onReview={() => onReviewChange(true)}
          onCancel={onClose}
          onBooked={async (amount) => {
            setBooking(true);
            const { booking: placed, submission } = await placeOrder({
              productId: product.id,
              clientId: shown.id,
              clientName: shown.name,
              amount,
              checks,
              // `?? undefined`, so a desk that does not ask for it sends
              // nothing rather than an explicit null the store would have to
              // know to ignore.
              evidence: evidence ?? undefined,
            });
            setBooking(false);
            onClose();
            onBookedProp?.(placed);
            // On a bond the order has already gone downstream, so the notice
            // can quote its reference — which is the whole reason the IC would
            // otherwise have gone looking for the record.
            const money = formatOrderAmount(amount, product.currency);
            const who = maskName(shown.name, isPrivate);
            onNotice(
              submission
                ? `ส่งคำสั่งซื้อ ${money} ของ ${who} แล้ว (${submission.backendRef})`
                : `จอง ${money} ให้ ${who} แล้ว`,
              "success",
            );
          }}
        />
      )}
    </div>
  );
}

// ── Choosing the customer ────────────────────────────────────────────────────

/**
 * The customer list, in place of a dropdown.
 *
 * A dropdown can only show a name, so the IC picks someone and *then* finds out
 * they are three documents short. A list has room to answer that up front —
 * every row carries its own verdict against this product — which turns "pick a
 * customer" into "pick a customer who can actually buy this".
 *
 * That is also why the ready ones sort to the top rather than the roster
 * staying in id order: the list is being read to find someone bookable, and the
 * ones who are not are the answer to a different question.
 */
function CustomerPicker({
  product,
  scrollerRef,
  onSelect,
}: {
  product: BookableProduct;
  /** The modal body — see the scroll reset below. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (clientId: string) => void;
}) {
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const readiness = useRosterReadiness(clients, product);

  /**
   * Back to the top whenever the list changes under the reader.
   *
   * Typing a search while scrolled down a long book leaves the scroll position
   * where it was, and the browser only clamps it to the new, much shorter
   * list — so the matches open halfway down, with the first row cut off under
   * the sticky header. Returning on mount covers the same thing in reverse:
   * coming back from the form via "เปลี่ยน" would otherwise land wherever the
   * list was left.
   */
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [search, scrollerRef]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? clients.filter(
          (c) =>
            maskName(c.name, isPrivate).toLowerCase().includes(query) ||
            c.id.includes(query),
        )
      : clients;
    // Stable within each group — `sort` is stable in every engine this runs
    // on, so the roster's own order survives inside "ready" and "not ready".
    return [...matched].sort((a, b) => {
      const aReady = readiness.get(a.id)?.status === "ready" ? 0 : 1;
      const bReady = readiness.get(b.id)?.status === "ready" ? 0 : 1;
      return aReady - bReady;
    });
  }, [clients, search, isPrivate, readiness]);

  // Counts describe what is on screen, not the whole book — with a search
  // active, "2 จาก 8" beside a list of three is a number about something the
  // reader cannot see.
  const readyCount = results.filter((c) => readiness.get(c.id)?.status === "ready").length;

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Pinned to the top of the modal's scroller. With a long book the list
          scrolls for screens, and a search box that scrolls away with it means
          scrolling back to the top to narrow the list — which is the one thing
          a long list makes you want to do.
          It carries the same padding as the list below, so the two line up: the
          scroller and the pane around it are both unpadded precisely so this can
          be stated once per side rather than as a margin cancelling one. */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 pb-2 pt-3 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="type-body-2 !font-semibold text-foreground">เลือกลูกค้า</span>
          <span className="type-caption text-muted-foreground tabular-nums">
            {ORDER_WORDS[bookingModeFor(product)].eligible} {readyCount} จาก{" "}
            {results.length} ราย
          </span>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="ค้นหาชื่อหรือรหัสลูกค้า"
          size="sm"
          className="w-full"
        />
      </div>

      <div className="px-4 md:px-6">
        {results.length === 0 ? (
          <p className="type-body-2 py-10 text-center leading-5 text-muted-foreground">
            ไม่พบลูกค้าที่ค้นหา
          </p>
        ) : (
          /* One frame, divided inside, rather than eight floating cards. The
             rows are a single list read top to bottom — gaps between them made
             each one its own object and put eight pairs of rounded corners in
             the way of that. `overflow-hidden` lets the first and last row take
             the frame's corners. */
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-[#f3f4f6]">
            {results.map((client) => (
              <CustomerRow
                key={client.id}
                client={client}
                readiness={readiness.get(client.id)}
                onSelect={() => onSelect(client.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * The three answers a row can give, in words rather than as a score.
 *
 * `ready` is the one the list exists to find, so it is the only green; the
 * other two are both "not yet" and differ in who the next move belongs to —
 * `in-review` is waiting on an approver (yellow, the same colour the status
 * chips use for `pending`), `blocked` is waiting on the IC (red). The prefix is
 * how the names that follow are read: "รอผล KYC" and "ยังขาด KYC" are the same
 * four records in two different states.
 */
const READINESS_VERDICT: Record<
  ClientReadiness["status"],
  { icon: typeof CheckCircleIcon; chip: string; text: string; prefix: string }
> = {
  ready: {
    icon: CheckCircleIcon,
    chip: "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]",
    text: "ครบแล้ว",
    prefix: "",
  },
  "in-review": {
    icon: ClockIcon,
    chip: "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]",
    text: "รอตรวจสอบ",
    prefix: "รอผล",
  },
  blocked: {
    icon: XCircleIcon,
    chip: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    text: "ยังไม่ครบ",
    prefix: "ยังขาด",
  },
};

function CustomerRow({
  client,
  readiness,
  onSelect,
}: {
  client: Client;
  readiness: ClientReadiness | undefined;
  onSelect: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const displayName = maskName(client.name, isPrivate);
  const verdict = READINESS_VERDICT[readiness?.status ?? "blocked"];
  // Named, not counted. "2/4" says how much is wrong without saying what, and
  // the answer is four words away — the IC had to open the client to find out
  // whether this was a form to send or a KYC review they cannot start.
  const outstanding = (readiness?.outstanding ?? [])
    .map((i) => shortRequirementLabel(i.label))
    .join(", ");

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        // No fill and no radius of its own — both belong to the frame now.
        // The hover is what the row still owns, and it reaches the frame's
        // edges because the row is the full width of it.
        // `py-4`, where the single-line pair it was built for took `py-3`: a
        // chip sitting right on top of the line that explains it reads as one
        // stacked object, and the row needed the height for them to be two.
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--fill-gray-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7]"
      >
        <Avatar type="text" initials={getInitial(displayName)} size="m" />
        {/* Still tight. A name and the tier under it are one label in two
            lines, and loosening them would undo that to match a gap on the
            other side of the row that is doing a different job. */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-2 truncate !font-semibold text-foreground">
            {client.id} - {displayName}
          </span>
          {/* Who the client is, and only that. What is outstanding used to be
              appended here, dot-separated and changing colour halfway, which
              put a second heavy line under a bold name and made the list harder
              to read than the "2/4" it replaced. */}
          <span className="type-caption truncate text-muted-foreground">
            {client.tier} · {client.riskProfile}
          </span>
        </span>
        {/* The verdict, and under it the reason — one column, because they are
            one answer. The row has to say "can I book this one" before anything
            else, and a ratio made the reader derive it (4/4 only means yes if
            you also know the total is four); what is missing is the follow-up
            question, so it sits directly under the word that raises it.

            A filled chip rather than coloured text, and the same fill the next
            screen's status cards use: one shape to find down the column, at a
            contrast 12px type can carry. The reason under it stays grey — the
            chip is the only alarm in the row. */}
        <span className="flex min-w-0 shrink flex-col items-end gap-2">
          <span
            className={`type-caption flex shrink-0 items-center gap-1 rounded-full py-0.5 pl-1.5 pr-2 !font-semibold ${verdict.chip}`}
          >
            <verdict.icon size={14} weight="fill" />
            {verdict.text}
          </span>
          {outstanding && (
            <span className="type-caption max-w-full truncate text-muted-foreground">
              {verdict.prefix} {outstanding}
            </span>
          )}
        </span>
        <CaretRightIcon size={16} className="shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

// ── The status block ─────────────────────────────────────────────────────────

function StatusGrid({
  product,
  client,
  onNotice,
}: {
  product: BookableProduct;
  client: Client;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { isPrivate } = usePrivacy();
  const { sendRequirementRequest } = useOrders();
  const readiness = useClientReadiness(client, product);
  const sendable = requestableKeys(readiness);
  const displayName = maskName(client.name, isPrivate);
  /** Which row is in flight, by key — `null` while none is. */
  const [sendingKey, setSendingKey] = useState<RequirementKey | null>(null);

  /**
   * Sends the client off to complete one record.
   *
   * One request per row, where this used to send the whole outstanding set at
   * once. The single button was a fair reading while the four were cards and
   * the action had nowhere to sit inside them; as rows they each have room
   * beside their own label, and only *some* of them are sendable — KYC is
   * started at a branch with the client present, and a risk rating below the
   * product's is not something a form can fix. A button that acts on "whatever
   * of these four happens to qualify" is a button whose effect the IC has to
   * work out from the count in its label.
   *
   * In the real screen each record lives in its own system (Wealth Declare,
   * Risk Consent), so one row is one routing target anyway. Here there is
   * nowhere to route to and the store answers on a timer — same round trip,
   * minus the other applications. See `contexts/orders-context`.
   */
  const sendOne = async (item: RequirementItem) => {
    setSendingKey(item.key);
    await sendRequirementRequest({
      clientId: client.id,
      clientName: client.name,
      productId: product.id,
      keys: [item.key],
    });
    setSendingKey(null);
    onNotice(
      `ส่ง "${item.label}" ให้ ${displayName} ดำเนินการแล้ว — จะแจ้งเตือนเมื่อลูกค้าทำเสร็จ`,
      "success",
    );
  };

  const verdict = READINESS_VERDICT[readiness.status];

  return (
    <>
      {/* A heading over the four, with the verdict. The chips answer each row;
          this answers the set, so the reader is not re-counting ticks every
          time the form re-renders under them.

          Rendered here rather than through `SheetBlock`, whose title is a
          string: the verdict rides beside the words and has to be a node. The
          type matches that block's own so the two headings in this panel are
          the same heading. */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-body-sm font-bold text-foreground">
          {ORDER_WORDS[bookingModeFor(product)].prereq}
        </span>
        {/* The same word the customer list gave this client a moment ago — the
            IC picked the row that said "ยังไม่ครบ" and the next screen has to
            agree with it. The count rides along here, where the grid under it
            says which ones; in the list it was the whole of the answer, which
            is what made it unreadable. */}
        <span
          className={`type-caption rounded-full px-2 py-0.5 tabular-nums ${
            readiness.status === "ready"
              ? "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]"
              : "bg-[var(--fill-gray-100)] text-muted-foreground"
          }`}
        >
          {readiness.status === "ready"
            ? verdict.text
            : `${verdict.text} (${readiness.outstanding.length} รายการ)`}
        </span>
      </div>

      {/* One row each, in the panel's own language. They were four grey cards
          in a 2×2 grid, which made the block that needs no attention — every
          one of them passes, nine times in ten — the heaviest thing on the
          screen. A row says the same thing and sits level with the facts above
          it.

          The risk row prints its rating *instead of* an icon: a tick beside the
          word "Aggressive" is the same verdict twice. That is what
          `item.value !== null` means. */}
      {readiness.items.map((item) => {
        const chip = STATUS_CHIP[item.status];
        const Icon = chip.icon;
        const canSend = sendable.includes(item.key);
        const inFlight = sendingKey === item.key;
        return (
          <SheetRow
            key={item.key}
            label={item.label}
            hint={item.detail}
            // The action sits beside the label, so the row names the record and
            // the move on it in one breath. See `sendOne`.
            action={
              canSend ? (
                <button
                  type="button"
                  disabled={inFlight}
                  onClick={() => void sendOne(item)}
                  className="shrink-0 cursor-pointer text-label font-semibold text-primary-action hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  {inFlight ? "กำลังส่ง…" : "ส่งให้ลูกค้า"}
                </button>
              ) : undefined
            }
          >
            {item.value ? (
              <span className={`text-body-sm font-bold ${chip.fg}`}>{item.value}</span>
            ) : (
              <Icon size={20} weight="fill" className={`shrink-0 ${chip.fg}`} />
            )}
          </SheetRow>
        );
      })}

      {/* One line under the grid, only when the grid alone would leave the IC
          guessing why the button is dead. The red boxes say *what* is wrong;
          these say what to do about it. */}
      {readiness.status === "blocked" && sendable.length === 0 && (
        <Alert
          status="critical"
          title="ลูกค้ารายนี้ยังซื้อผลิตภัณฑ์นี้ไม่ได้"
          message={`ระดับความเสี่ยงที่ลูกค้ารับได้ (${client.riskProfile}) ต่ำกว่าที่ผลิตภัณฑ์นี้กำหนด — ต้องให้ลูกค้าทำแบบประเมินความเสี่ยงใหม่ก่อน`}
          multiline
          className="mt-4"
        />
      )}
      {readiness.status === "in-review" && (
        <Alert
          status="information"
          message="ลูกค้าดำเนินการแล้ว อยู่ระหว่างรอผลตรวจสอบ — จะแจ้งเตือนเมื่อผ่าน"
          multiline
          className="mt-4"
        />
      )}
    </>
  );
}

/**
 * How each status reads: a tinted chip with an icon, not a text box.
 *
 * These fields were boxes once, which was wrong twice over. A bordered box the
 * height of an input invites a click and a keystroke, and none of them takes
 * one — only Notional Amount does. And a box can only say "wrong" by turning
 * its outline red, which leaves "right" saying nothing at all: the IC had to
 * read four values to work out that three were fine.
 *
 * A chip answers "มีแล้วหรือยัง" before the value is read. Green is on file,
 * red is not, and the two states that are neither get their own colour rather
 * than being rounded towards one of them — amber for *waiting on an approver*
 * (the client has already acted; chasing them would be chasing the wrong
 * person) and orange for *expired* (it was on file, which is a different
 * conversation from never having had it).
 */
export const STATUS_CHIP: Record<
  RequirementStatus,
  { icon: typeof CheckCircleIcon; bg: string; fg: string }
> = {
  passed: {
    icon: CheckCircleIcon,
    bg: "bg-[var(--fill-green-100)]",
    fg: "text-[var(--fill-green-600)]",
  },
  pending: {
    icon: ClockIcon,
    bg: "bg-[var(--fill-yellow-100)]",
    fg: "text-[var(--fill-yellow-600)]",
  },
  expired: {
    icon: WarningCircleIcon,
    bg: "bg-[var(--fill-orange-100)]",
    fg: "text-[var(--fill-orange-600)]",
  },
  missing: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
  failed: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
};

/**
 * The grey panel every read-only value sits on.
 *
 * This is what separates the two kinds of field at a glance: **white with a
 * border means you can type in it** (the customer dropdown, the notional
 * amount), **filled grey means the system is telling you something**. The
 * statuses had an input's shape once, which invited a click none of them takes;
 * a filled panel with the label inside it reads as a card rather than a field,
 * so the invitation goes away without the information going with it.
 *
 * No border, deliberately — an outline is the other half of what made these
 * read as inputs, and the fill alone is enough to bound a card. That is also
 * why the grey is `#f3f4f6` rather than the `#f9fafb` used elsewhere in this
 * app: with an outline to define the edge, the lighter grey is plenty; without
 * one it is close enough to the modal's white that the cards stop reading as
 * separate surfaces at all.
 */
export function FieldCard({
  label,
  trailing,
  variant = "fact",
  className = "",
  children,
}: {
  label: string;
  /**
   * Which of the two things this card is — they differ in more than one way, so
   * they are one choice rather than a handful of booleans that always move
   * together.
   *
   * **status** — one of the four checks. Sits on a grey panel, because the four
   * of them are a group being scanned, and leads with its label: the verdict
   * has moved to the icon on the right, so what is left on the left is the name
   * of the thing being judged.
   *
   * **fact** — an account number, an IC, a cash balance. No panel: there is
   * nothing to scan and nothing to decide, and giving it the same surface as a
   * check made the grid read as eight equal things when only four of them are
   * the point. The value leads and the label captions it.
   */
  variant?: "status" | "fact";
  /**
   * Pinned to the card's right edge and centred against its full height — the
   * status icon. Separate from `children` so it stays beside the label *and*
   * the value rather than below one of them.
   */
  trailing?: React.ReactNode;
  /** `self-start` where the card must not stretch to its grid row's height. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    /* The card is a flex container and its row fills it, so `items-center`
       centres against the card rather than against the row's own content.
       Without that, a card whose content is shorter than its grid row-mate's
       keeps its natural height and sits at the top: the risk card's text
       trailing is 20px where the others' icons are 28px, which left it — and
       its label — 4px above where every neighbouring card put theirs. */
    <div
      className={`flex ${
        // A fact has no padding at all. It had the status card's `py-3` back
        // when the two shared a grid row and had to sit level; they no longer
        // do, and with no panel to pad the padding only showed up as 36px of
        // dead space between two rows of plain text. The grid's own row gap is
        // the spacing now.
        variant === "status" ? "rounded-xl bg-[#f3f4f6] px-4 py-3" : ""
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-h-5 items-center">
            {/* Both labels are 12px — the design system's caption size. A
                status label carries its card, so it takes the bold cut and the
                dark ink; a fact label captions a value below it, so it stays
                regular and grey. Size is what the two have in common; weight
                and colour are what tell them apart. */}
            <span
              className={
                variant === "status"
                  ? "type-caption-bold text-foreground"
                  : "type-caption text-muted-foreground"
              }
            >
              {label}
            </span>
          </div>
          {children}
        </div>
        {trailing}
      </div>
    </div>
  );
}

/** A quiet blue link, greyed when the thing it opens would do nothing. */
function ActionLink({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer text-xs leading-[20px] font-medium text-[#0a6ee7] hover:underline disabled:cursor-default disabled:text-muted-foreground/50 disabled:no-underline"
    >
      {label}
    </button>
  );
}

/**
 * A plain fact — account number, IC, team — on the same grey card.
 *
 * Same surface as a status, no icon and no colour: there is no state to report.
 * These are always present and never block anything, so giving them a tone
 * would spend attention on rows that never need it, and the four that do carry
 * a verdict would stop standing out for carrying one.
 */
export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldCard label={label}>
      <span className="type-body-2 truncate !font-semibold text-foreground">{value}</span>
    </FieldCard>
  );
}


// ── Amount ───────────────────────────────────────────────────────────────────

/**
 * The amount's own validity, shared by the field and the submit button.
 *
 * `full` — the round has already reached the target — is its own answer rather
 * than a very large `tooBig`. The over-limit test used to read
 * `remaining > 0 && amount > remaining`, which switched itself off at exactly
 * the moment it was needed most: with nothing left to book, every amount
 * passed, and a 100,000 book took another 500,000 under a helper line still
 * reading "ยังจองได้ 0 USD".
 */
/** Anything in the field besides digits and the commas it groups them with. */
const hasNonDigit = (raw: string) => /[^0-9,]/.test(raw);

function amountCheck(
  product: BookableProduct,
  /**
   * The cap on this booking, or `null` where the desk has none — see
   * `bookingRemaining`. A basket has none: its notional is a target, not a
   * limit, and it can be over-booked.
   */
  cap: number | null,
  /** The product takes no more bookings at all — see `isBookingOpen`. */
  closed: boolean,
  /** The client's own cash, in the product's currency — see `overCash`. */
  cashAvailable: number,
  raw: string,
): {
  amount: number;
  full: boolean;
  invalid: boolean;
  tooSmall: boolean;
  tooBig: boolean;
  overCash: boolean;
  ok: boolean;
} {
  // Not a number at all: the size checks would be measuring whatever digits
  // happened to be in it, so they stand down and this is the one error shown.
  const invalid = hasNonDigit(raw);
  const amount = invalid ? 0 : parseAmount(raw);
  // Read off the product rather than inferred from the cap running out. A
  // basket at its notional is not closed — it can take more — and a quota book
  // with nothing left is closed whatever anyone types.
  const full = closed || cap === 0;
  const tooSmall = amount > 0 && amount < minTicketFor(product);
  const tooBig = !full && cap !== null && amount > cap;
  /**
   * More than the client can fund.
   *
   * A gate, not a warning. It used to be the latter, on the reasoning that the
   * back office's funds check downstream was the real gate — which meant a
   * booking could be placed, fill a basket, and then hold the whole product at
   * "วงเงินไม่เพียงพอ" until the IC found it and cancelled it. The check that
   * decides belongs where the number is typed, so that state no longer exists
   * (see `Booking` in `types/domain.ts`).
   */
  const overCash = amount > 0 && amount > cashAvailable;
  return {
    amount,
    full,
    invalid,
    tooSmall,
    tooBig,
    overCash,
    ok: !invalid && amount > 0 && !full && !tooSmall && !tooBig && !overCash,
  };
}

function AmountSection({
  product,
  client,
  raw,
  onRawChange,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  onRawChange: (next: string) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const currency = product.currency;
  const minTicket = minTicketFor(product);
  const closed = book ? !isBookingOpen(book) : false;
  /** The cap on this booking — `null` on a basket, which has none. */
  const cap = book ? bookingRemaining(book) : null;
  // `bookingModeFor(product)`, not `book.mode` — the book may not have loaded
  // and the product is the authority on its desk either way.
  const mode = bookingModeFor(product);
  const words = ORDER_WORDS[mode];

  const cashThb = clientCashThb(client);
  const cashHere = cashInCurrency(cashThb, currency);
  /** What is in the field right now, as a number — `0` while it is empty. */
  const typed = hasNonDigit(raw) ? 0 : parseAmount(raw);
  /**
   * The amounts offered as one-press fills.
   *
   * Multiples of the minimum ticket, de-duplicated, and only those the client
   * can actually fund and the desk's cap allows — a chip that fails the form's
   * own check the moment it is pressed is worse than no chip.
   */
  const quickFills = ((): number[] => {
    // No `useMemo`: three multiplications over a three-item list, and the React
    // Compiler memoises it better than a dependency list can — a hand-written
    // one here is what it reports as "memoization could not be preserved".
    const ceiling = Math.min(Math.floor(cashHere), cap ?? Number.POSITIVE_INFINITY);
    return [1, 2, 5]
      .map((n) => minTicket * n)
      .filter((v, i, a) => v <= ceiling && a.indexOf(v) === i);
  })();
  const { full, invalid, tooSmall, tooBig, overCash } = amountCheck(
    product,
    cap,
    closed,
    cashHere,
    raw,
  );
  /**
   * Two different reasons the amount is closed, and they do not stack: a client
   * who is short a document cannot book whatever the round's state, so that
   * message wins and the round's is not also shown.
   */
  // The checks are the caller's gate now — this one only closes for a product
  // that takes no more bookings.
  const blocked = full;
  /**
   * Whether the figure reads as wrong.
   *
   * Not while the field is closed: a faded, inert section in red would be
   * shouting about a number nobody can change.
   */
  const showError = !blocked && (invalid || tooSmall || tooBig || overCash);
  /** `฿` for a Thai product, `$` for a dollar one — against the figure. */
  const symbol = currency === "THB" ? "฿" : "$";

  /**
   * Digits are grouped with commas as they are typed. Anything else is kept
   * exactly as typed rather than dropped — a key that silently did nothing read
   * as a broken field — and the field flags it (see `amountCheck`) until it is
   * fixed. Regrouping a value that is not a number would rewrite what the IC
   * is looking at, so it is left alone.
   */
  const setAmount = (next: string) => {
    if (hasNonDigit(next)) {
      onRawChange(next);
      return;
    }
    const digits = next.replace(/,/g, "");
    onRawChange(digits ? Number(digits).toLocaleString("en-US") : "");
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      {/* The product takes no more bookings. Not an error on the amount —
          there is no amount that would be right — so it closes the field the
          same way a missing document does.

          No "ครบยอดแล้ว" branch: a basket reaching its notional does *not*
          close it. The target is what the deal aims for, and a basket can be
          over-booked — see `bookingRemaining`. What closes a basket is its
          order going downstream, which is the third and fourth cases here. */}
      {full && (
        <Alert
          status="information"
          message={
            mode === "quota"
              ? `${product.underlying} เต็มโควตาแล้ว — ไม่สามารถจองเพิ่มได้`
              : book && isBookClosed(book)
                ? `ส่งคำสั่งซื้อของ ${product.underlying} แล้ว — สินค้านี้ปิดรับจอง`
                : `คำสั่งซื้อของ ${product.underlying} กำลังดำเนินการที่ระบบหลังบ้าน — ไม่สามารถจองเพิ่มได้`
          }
          multiline
        />
      )}
      {/* Faded and inert, not removed — `inert` takes it out of the tab order
          and the accessibility tree as well as the pointer's reach. */}
      <div
        inert={blocked}
        aria-disabled={blocked}
        className={`flex flex-col gap-3 transition-opacity ${
          blocked ? "pointer-events-none select-none opacity-40" : ""
        }`}
      >
        {/* The amount as a figure, not a field.

            It was a bordered `Input` with the cash beside it, and it read as a
            form: six boxes of equal weight, one of which happened to be the
            only decision on the screen. This is the shape a payment app uses
            for the same job — the number large and centred, the currency
            against it, the common amounts one press away, and the balance a
            caption underneath — because there is exactly one thing to do here
            and it should look like it.

            A plain `<input>` rather than the library's: the figure has to be
            48px, centred and borderless, and `Input` owns its own box from an
            unlayered stylesheet that a class cannot beat (see the note on
            `FIT` in `ProductOrderSection`). The validation it would have drawn
            is drawn below instead — same four messages, same order. */}
        <div className="flex flex-col items-center gap-4 py-2">
          <label
            htmlFor="booking-amount"
            className="type-caption text-muted-foreground"
          >
            {`Notional Amount (${currency})`}
          </label>

          <div
            className={`flex items-baseline justify-center ${
              showError ? "text-[var(--fill-red-600)]" : "text-primary-action"
            }`}
          >
            {/* The same size as the figure and hard against it — the two are
                one number read as one word, the way `$408` is. No gap, so the
                only space between them is the glyph's own sidebearing. */}
            <span className="text-[48px] leading-[1.3] font-bold">{symbol}</span>
            {/* Sized to the digits themselves, so the field never has more text
                than room and never scrolls. `size` was the old way, but it
                counts characters at an average width — 48px bold digits and
                commas are wider, so the figure overflowed its box, scrolled
                sideways, and lost its tops to the tight line-height.

                The input and an invisible copy of its text share one grid
                cell: the copy sets the width, the input fills it. Left-aligned,
                so the digits start right after the symbol. The copy's
                `pr-[0.1em]` leaves the caret room at the end. */}
            <span className="inline-grid">
              <span
                aria-hidden
                className="invisible whitespace-pre pr-[0.1em] text-[48px] leading-[1.3] font-bold tabular-nums [grid-area:1/1]"
              >
                {raw || "0"}
              </span>
              <input
                id="booking-amount"
                value={raw}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                inputMode="numeric"
                disabled={blocked}
                aria-invalid={showError}
                size={1}
                className="w-full min-w-0 border-0 bg-transparent p-0 text-left text-[48px] leading-[1.3] font-bold tabular-nums outline-none [grid-area:1/1] placeholder:text-[var(--text-default-placeholder)] disabled:cursor-not-allowed"
              />
            </span>
          </div>

          {/* One line under the figure, where the reference puts its balance.
              The error replaces it rather than stacking under it: both are
              about the same number, and two lines of small text below a 48px
              figure is the clutter this layout exists to remove. */}
          {showError ? (
            <p className="type-caption text-center text-[var(--fill-red-600)]">
              {invalid
                ? "กรอกได้เฉพาะตัวเลข 0–9 เท่านั้น"
                : tooSmall
                  ? `ต่ำกว่าขั้นต่ำ ${formatOrderAmount(minTicket, currency)}`
                  : tooBig
                    ? `เกิน${words.remainingLabel} ${formatOrderAmount(cap ?? 0, currency)}`
                    : `เกินเงินสดคงเหลือของลูกค้า ${formatOrderAmount(Math.floor(cashHere), currency)}`}
            </p>
          ) : (
            <p className="type-caption text-center text-muted-foreground">
              ขั้นต่ำ {formatOrderAmount(minTicket, currency)}
              {cap !== null && <> · {words.remainingLabel} {formatOrderAmount(cap, currency)}</>}
            </p>
          )}

          {/* Steps off the minimum, so the common amounts are one press rather
              than six keystrokes each. Multiples of the ticket rather than
              round numbers: a product with a 10,000 minimum does not sell in
              25,000s. Anything the client cannot fund is left out — a
              suggestion that fails the form's own check is worse than none.
              Scrolls rather than wraps, so the row stays one line. */}
          {quickFills.length > 0 && (
            <div className="scrollable-tabs flex w-full items-center justify-center gap-2">
              {quickFills.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onRawChange(v.toLocaleString("en-US"))}
                  className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-body-sm font-semibold tabular-nums transition-colors ${
                    typed === v
                      ? "border-primary-action bg-primary-action-light text-primary-action"
                      : "border-border bg-white text-foreground hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                  }`}
                >
                  {v.toLocaleString("en-US")}
                </button>
              ))}
            </div>
          )}

          {/* The balance, as the reference captions it. In THB, which is the
              account's own currency — where the amount above exceeds it, the
              error line says so in the product's. */}
          <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
            <span className="type-caption text-muted-foreground">เงินสดคงเหลือของลูกค้า</span>
            <span className="type-body-2 !font-semibold tabular-nums text-foreground">
              ฿ {formatThbAmount(cashThb)}
            </span>
          </div>
        </div>

        {overCash && (
          <Alert
            status="critical"
            message="จำนวนมากกว่าเงินสดคงเหลือของลูกค้า — ลดจำนวนลง หรือให้ลูกค้าเติมเงินก่อนจึงจะทำรายการได้"
            multiline
          />
        )}

      </div>
    </div>
  );
}

// ── Evidence ─────────────────────────────────────────────────────────────────

/**
 * The proof that the client asked for this — every bookable desk.
 *
 * Two steps and they are in this order on purpose: the channel decides which
 * files are even offered (`EVIDENCE_CHANNEL[...].accept`), so there is no file
 * field until a channel is chosen. A field that took anything would be a field
 * that took the wrong thing — a chat screenshot filed under "โทรศัพท์" is a log
 * that lies about the one fact it exists to record.
 *
 * Faded until the four checks pass, exactly as the amount is: this is gated on
 * the same thing, and the IC should see it is coming without it being open yet.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * The `File` goes no further than this component — see `OrderEvidence`. What
 * leaves is its name, size and type, and the note at the foot says so rather
 * than implying the recording has been filed somewhere.
 */
function EvidenceSection({
  clientId,
  value,
  onChange,
}: {
  /** Whose Call Log the phone channel offers. */
  clientId: string;
  value: OrderEvidence | null;
  onChange: (next: OrderEvidence | null) => void;
}) {
  const [channel, setChannel] = useState<EvidenceChannel | null>(null);
  /** Phone only: pick the call off the Call Log, or attach the recording. */
  const [callSource, setCallSource] = useState<"call-log" | "file">("call-log");
  // Kept here as well as on the evidence: the IC may write it before choosing
  // the proof, and switching channel clears the proof but not what they wrote.
  const [note, setNote] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  /**
   * The file being "uploaded" — shown as the library's loading UploadItem
   * until it lands as the evidence. There is no upload endpoint yet (see
   * `OrderEvidence`), so the progress is a short stand-in; the backend's own
   * progress replaces the timer.
   */
  const [uploading, setUploading] = useState<{ name: string; size: number; progress: number } | null>(
    null,
  );
  const uploadTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadDone = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Stops an in-flight upload — on delete, on a new file, on unmount. */
  const stopUpload = () => {
    if (uploadTimer.current) clearInterval(uploadTimer.current);
    if (uploadDone.current) clearTimeout(uploadDone.current);
    uploadTimer.current = null;
    uploadDone.current = null;
  };
  useEffect(() => stopUpload, []);
  const chosen = channel ? EVIDENCE_CHANNEL[channel] : null;
  const calls = useMemo(() => getCallLogs(clientId), [clientId]);
  const byLog = channel === "call" && callSource === "call-log";

  const clearProof = () => {
    // A file attached under one channel is not evidence of another, so
    // switching clears it rather than re-labelling it.
    stopUpload();
    setUploading(null);
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const pickChannel = (next: EvidenceChannel) => {
    if (next === channel) return;
    setChannel(next);
    setCallSource("call-log");
    clearProof();
  };

  const pickCallSource = (next: "call-log" | "file") => {
    if (next === callSource) return;
    setCallSource(next);
    clearProof();
  };

  const withNote = (e: OrderEvidence): OrderEvidence => {
    const trimmed = note.trim();
    return trimmed ? { ...e, note: trimmed } : e;
  };

  const attach = (file: File | undefined) => {
    if (!file || !channel) return;
    // A new file replaces the one there: one proof per booking.
    clearProof();
    const forChannel = channel;
    setUploading({ name: file.name, size: file.size, progress: 0 });
    uploadTimer.current = setInterval(() => {
      setUploading((u) => (u ? { ...u, progress: Math.min(100, u.progress + 25) } : u));
    }, 150);
    uploadDone.current = setTimeout(() => {
      stopUpload();
      setUploading(null);
      onChange(
        withNote({
          channel: forChannel,
          source: "file",
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          attachedAt: new Date().toISOString(),
        }),
      );
    }, 700);
  };

  const pickCall = (call: (typeof calls)[number]) =>
    onChange(
      withNote({
        channel: "call",
        source: "call-log",
        callLog: { ...call },
        attachedAt: new Date().toISOString(),
      }),
    );

  const changeNote = (next: string) => {
    setNote(next);
    if (!value) return;
    const trimmed = next.trim();
    const rest = { ...value };
    delete rest.note;
    onChange(trimmed ? { ...rest, note: trimmed } : rest);
  };

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <span className="type-body-2 !font-semibold text-foreground">
          หลักฐานการรับคำสั่งจากลูกค้า
        </span>
        {/* Said once, here, rather than only by a disabled button: the IC
            should know it is required before they go looking for the file. */}
        <span className="type-caption text-[var(--fill-red-600)]">จำเป็นต้องแนบ</span>
      </div>

      <div className="flex flex-col gap-3">
        {/* Cards across the modal rather than a row of chips. Chips read as a
            *filter* — something narrowing a list already on screen — and this
            is a choice the IC has to make before anything below it exists.
            Equal widths, because none of them is the expected one. */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {EVIDENCE_CHANNELS.map((c) => {
            const meta = EVIDENCE_CHANNEL[c];
            const Icon = meta.icon;
            const on = channel === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => pickChannel(c)}
                className={`flex h-[84px] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border px-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] ${
                  on
                    ? "border-primary-action bg-primary-action-light"
                    : "border-border bg-white hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                }`}
              >
                <Icon
                  size={22}
                  weight="fill"
                  className={`shrink-0 ${on ? "text-primary-action" : "text-muted-foreground"}`}
                />
                <span
                  className={`type-body-2 leading-tight !font-semibold ${
                    on ? "text-primary-action" : "text-foreground"
                  }`}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Phone has two kinds of proof. The Call Log comes first: it is
            already on file and needs nothing from the IC but a pick. */}
        {channel === "call" && (
          <div className="flex gap-1 rounded-lg bg-[var(--bg-default-secondary)] p-1">
            {(
              [
                { id: "call-log", label: "เลือกจาก Call Log" },
                { id: "file", label: "แนบไฟล์เสียง" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={callSource === o.id}
                onClick={() => pickCallSource(o.id)}
                className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-body-sm font-semibold transition-colors ${
                  callSource === o.id
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {byLog && (
          <>
            <p className="type-caption text-muted-foreground">
              เลือกสายที่ลูกค้าให้คำสั่งซื้อนี้
            </p>
            {calls.length === 0 ? (
              <p className="type-caption rounded-xl border border-dashed border-border px-3 py-4 text-center text-muted-foreground">
                ยังไม่มีประวัติการโทรของลูกค้ารายนี้ — แนบไฟล์เสียงแทน
              </p>
            ) : (
              <div
                role="radiogroup"
                aria-label="Call Log"
                className="-mx-1 flex max-h-[232px] flex-col gap-2 overflow-y-auto px-1 py-0.5"
              >
                {calls.map((call) => {
                  const on = value?.source === "call-log" && value.callLog?.id === call.id;
                  const Dir = call.direction === "inbound" ? PhoneIncomingIcon : PhoneOutgoingIcon;
                  return (
                    <button
                      key={call.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => pickCall(call)}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        on
                          ? "border-primary-action bg-primary-action-light"
                          : "border-border bg-white hover:border-[var(--border-hover)] hover:bg-[var(--bg-default-secondary)]"
                      }`}
                    >
                      <Dir
                        size={18}
                        weight="fill"
                        className={`mt-0.5 shrink-0 ${on ? "text-primary-action" : "text-muted-foreground"}`}
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="type-body-2 !font-semibold text-foreground">
                          {call.date} · {call.time}
                          <span className="type-caption ml-1.5 !font-normal text-muted-foreground">
                            {CALL_DIRECTION_LABEL[call.direction]} · {call.duration}
                          </span>
                        </span>
                        <span className="type-caption line-clamp-1 text-muted-foreground">
                          {call.summary}
                        </span>
                      </span>
                      {on && (
                        <CheckCircleIcon
                          size={18}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-primary-action"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {chosen && !byLog && (
          <>
            {/* The input itself is never shown: a bare file input cannot be
                styled and reads as a different app. The button in front of it
                is what the IC presses. */}
            <input
              ref={fileRef}
              type="file"
              accept={chosen.accept || undefined}
              className="hidden"
              aria-label={`แนบ${chosen.hint}`}
              onChange={(e) => attach(e.target.files?.[0])}
            />
            {/* The library's upload pair, as it is meant to be used together:
                the dashed area stays to choose (or drop) a file — a new one
                replaces the last — and the file sits under it as an
                UploadItem, loading and then done, with its own delete. */}
            <UploadArea
              className="mt-2"
              label={value?.source === "file" ? "เปลี่ยนไฟล์" : "เลือกไฟล์ หรือลากไฟล์มาวาง"}
              disabled={uploading !== null}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!uploading) attach(e.dataTransfer.files?.[0]);
              }}
            />
            {/* What to attach, under the area it is attached through. */}
            <p className="type-caption -mt-1.5 text-center text-muted-foreground">{chosen.hint}</p>
            {uploading ? (
              <UploadItem
                variant="card"
                status="loading"
                fileName={uploading.name}
                fileSize={formatFileSize(uploading.size)}
                progress={uploading.progress}
                onDelete={clearProof}
              />
            ) : value?.source === "file" ? (
              <UploadItem
                variant="card"
                status="success"
                fileName={value.fileName}
                fileSize={value.fileSize != null ? formatFileSize(value.fileSize) : undefined}
                onDelete={clearProof}
              />
            ) : null}
          </>
        )}

        {/* Optional on every channel — what the proof alone does not say: the
            client's exact words, a condition they set, why it came by "other". */}
        {channel && (
          <TextArea
            label={
              noteRequired(channel)
                ? // Typed `string` but rendered as a child, so a node works —
                  // the asterisk needs its own colour.
                  ((
                    <>
                      หมายเหตุ <span className="text-[var(--fill-red-600)]">*</span>
                    </>
                  ) as unknown as string)
                : "หมายเหตุ (ถ้ามี)"
            }
            value={note}
            onChange={changeNote}
            placeholder={
              noteRequired(channel)
                ? "ระบุว่าไฟล์นี้คืออะไร และลูกค้าสั่งมาทางไหน"
                : "เช่น ลูกค้ายืนยันยอดและเงื่อนไขแล้ว"
            }
            showCount
            maxCount={300}
            // Flagged only once a file is attached: before that the missing
            // file is the first thing to fix, and two errors at once is noise.
            forceState={
              noteRequired(channel) && value !== null && !note.trim() ? "error" : undefined
            }
            errorMessage="กรุณาระบุหมายเหตุสำหรับหลักฐานประเภทอื่นๆ"
          />
        )}

      </div>
    </div>
  );
}

// ── Reviewing before it is sent ──────────────────────────────────────────────

/**
 * The order read back, between the form and the send.
 *
 * Everything the IC decided on the screen before — who, how much, on what
 * proof — as statements rather than fields, in the order a supervisor would
 * check them. Nothing here is editable: a summary that can be changed is a
 * second form, and the point is to see the one that is about to go.
 */
function BookingSummary({
  product,
  client,
  raw,
  evidence,
  cashAvailable,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  evidence: OrderEvidence | null;
  cashAvailable: number;
}) {
  const { isPrivate } = usePrivacy();
  const { data: book } = useOrderBook(product.id);
  const { amount } = amountCheck(
    product,
    book ? bookingRemaining(book) : null,
    book ? !isBookingOpen(book) : false,
    cashAvailable,
    raw,
  );
  const words = ORDER_WORDS[bookingModeFor(product)];
  const channel = evidence ? EVIDENCE_CHANNEL[evidence.channel] : null;
  const ChannelIcon = channel?.icon;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="type-body-2 !font-semibold text-foreground">สรุปรายการ{words.action}</p>
        <p className="type-caption text-muted-foreground">
          ตรวจสอบให้ถูกต้องก่อน{words.action}
        </p>
      </div>

      {/* The figure first and largest: it is the one value a slip of the
          keyboard can make wrong by a factor of ten. */}
      <div className={`flex flex-col items-center gap-1 ${SHEET_PANEL} py-4`}>
        <span className="type-caption text-muted-foreground">
          {`Notional Amount (${product.currency})`}
        </span>
        <span className="text-[32px] leading-[1.3] font-bold tabular-nums text-primary-action">
          {formatOrderAmount(amount, product.currency)}
        </span>
      </div>

      <SheetBlock title="รายละเอียดคำสั่ง">
        <SheetRow label="สินค้า">
          <span className="truncate text-body-sm font-semibold text-foreground">
            {product.underlying}
            {product.coupon && (
              <span className="ml-1.5 text-primary-action">{product.coupon}</span>
            )}
          </span>
        </SheetRow>
        {product.productType && <SheetRow label="ประเภท" value={product.productType} />}
        <SheetRow label="ลูกค้า" value={`${client.id} - ${maskName(client.name, isPrivate)}`} />
        <SheetRow label="Account No" value={getClientProfile(client.id).accountNo} />
        <SheetRow label="IC" value={`${IC_NAME} · ${IC_TEAM}`} />
      </SheetBlock>

      {evidence && channel && (
        <>
          <div className={SHEET_DASHED} />
          <SheetBlock title="หลักฐานการรับคำสั่ง">
            <SheetRow label="ช่องทาง">
              <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                {ChannelIcon && (
                  <ChannelIcon size={15} weight="fill" className="shrink-0 text-muted-foreground" />
                )}
                {channel.label}
              </span>
            </SheetRow>
            {evidence.source === "call-log" && evidence.callLog ? (
              <>
                <SheetRow
                  label="สายจาก Call Log"
                  value={`${evidence.callLog.date} ${evidence.callLog.time}`}
                />
                <SheetRow
                  label="ประเภทสาย"
                  value={`${CALL_DIRECTION_LABEL[evidence.callLog.direction]} · ${evidence.callLog.duration}`}
                />
              </>
            ) : (
              <SheetRow label="ไฟล์">
                <span className="text-right text-body-sm font-semibold break-all text-foreground">
                  {evidence.fileName}
                  {evidence.fileSize != null && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({formatFileSize(evidence.fileSize)})
                    </span>
                  )}
                </span>
              </SheetRow>
            )}
            {evidence.note && (
              <SheetRow label="หมายเหตุ">
                <span className="text-right text-body-sm font-semibold whitespace-pre-line text-foreground">
                  {evidence.note}
                </span>
              </SheetRow>
            )}
          </SheetBlock>
        </>
      )}
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  ready,
  evidence,
  product,
  cashAvailable,
  raw,
  booking,
  reviewing,
  onReview,
  onCancel,
  onBooked,
}: {
  /** Whether all four checks pass — the gate on the amount and the booking. */
  ready: boolean;
  /** The attached proof, where this desk asks for one. */
  evidence: OrderEvidence | null;
  product: BookableProduct;
  /** The client's cash in the product's currency — see `amountCheck`. */
  cashAvailable: number;
  raw: string;
  booking: boolean;
  /** On the summary: the primary sends. On the form it only moves on to it. */
  reviewing: boolean;
  onReview: () => void;
  onCancel: () => void;
  onBooked: (amount: number) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const { amount, ok } = amountCheck(
    product,
    book ? bookingRemaining(book) : null,
    book ? !isBookingOpen(book) : false,
    cashAvailable,
    raw,
  );

  const mode = bookingModeFor(product);
  // `ready` is checked here as well as on the amount section: a check can
  // expire while the form is open, and the gate has to hold at the moment of
  // booking. The evidence is re-checked for the same reason — the section can
  // have it removed after it was attached.
  const hasEvidence = !evidenceRequired(mode) || evidenceComplete(evidence);
  const canBook = ready && ok && hasEvidence && !booking;
  const words = ORDER_WORDS[mode];

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 md:px-6">
      {/* Two screens, one footer. The form's primary only moves on to the
          summary — same gate, so the summary is never reached with an order
          that could not be sent. The summary's primary is the one that sends,
          and it re-checks: a check can lapse while the IC is reading. */}
      <div className="flex items-center justify-end gap-2">
        {/* Cancel on both screens — the way back from the summary is the
            arrow in the title row (or atop the sheet on a phone). */}
        <Button variant="outline" size="md" disabled={booking} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant={canBook ? "primary" : "disabled"}
          size="md"
          disabled={!canBook}
          onClick={() => (reviewing ? onBooked(amount) : onReview())}
        >
          {!reviewing
            ? "ตรวจสอบรายการ"
            : booking
              ? words.actionBusy
              : `ยืนยัน${words.action}`}
        </Button>
      </div>
    </div>
  );
}
