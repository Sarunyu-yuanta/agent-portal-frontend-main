"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { Alert, useIsMobile, type ToastStatus } from "@sarunyu/system-one";
import { SLIDE_MS, SlideSteps } from "@/components/ui/slide-steps";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useOrders } from "@/features/orders/store/orders-context";
import { maskName } from "@/lib/mask-name";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import type { BookingLead } from "@/features/orders/lib/booking-lead";
import { cashInCurrency, clientCashThb, formatOrderAmount } from "@/features/orders/lib/order-book";
import { clientReadiness } from "@/features/orders/lib/order-requirements";
import { useRequestsFor } from "@/features/orders/hooks/use-order-books";
import { BackButton } from "@/features/orders/components/BackButton";
import { SHEET_PANEL } from "@/features/orders/components/detail-sheet-ui";
import { evidenceRequired } from "@/features/orders/components/order-evidence";
import { useAccountIdentity, useClients } from "@/features/clients/hooks/use-clients";
import { useCurrentIc } from "@/features/auth/hooks/use-current-ic";
import { useT } from "@/i18n/I18nProvider";
import { reportError } from "@/lib/report-error";
import type { Booking, OrderEvidence } from "@/types/order";
import { AmountSection } from "./AmountSection";
import { BookingSummary } from "./BookingSummary";
import { CustomerPicker } from "./CustomerPicker";
import { EvidenceSection } from "./EvidenceSection";
import { ActionLink, FieldCard, ReadOnlyField } from "./FieldCard";
import { Footer } from "./Footer";
import { StatusGrid } from "./StatusGrid";

export function BookingForm({
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
  const currentIc = useCurrentIc();
  const getAccountIdentity = useAccountIdentity();
  const t = useT();
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
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
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
        <SlideSteps index={stepIndex} initialHeight={initialHeight} onHeightChange={onHeightChange}>
          {[
            ...(lead?.panes ?? []).map((pane, i) => <Fragment key={`lead-${i}`}>{pane}</Fragment>),
            <div key="customers">
              {product && (
                <>
                  {/* A phone's sheet has no arrow in its title row, so the way
                      back to the lead step sits at the top of the list. */}
                  {isMobile && onListBack && (
                    <div className="px-4 pt-3">
                      <BackButton label={t.orders.back} onClick={onListBack} />
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
              className="px-4 pt-5 pb-4 md:px-6"
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
                    <FieldCard label={t.orders.field.customer}>
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
                            label={t.orders.booking.change}
                            disabled={false}
                            onClick={() => setClientId("")}
                          />
                        )}
                      </div>
                    </FieldCard>
                    <ReadOnlyField
                      label={t.orders.field.accountNo}
                      value={getAccountIdentity(shown.id).accountNo}
                    />
                    {/* The IC sits with the customer, above the checks, because
                        the four of them together are the header of the order:
                        who it is for, on which account, placed by whom, from
                        which desk. None of it is a decision — putting it after
                        the checks made the reader step over a block of facts to
                        reach the amount. */}
                    <ReadOnlyField label={t.orders.field.icName} value={currentIc.name} />
                    <ReadOnlyField label={t.orders.field.icTeam} value={currentIc.team} />
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
                      message={t.orders.words[bookingModeFor(product)].prereqIncomplete(
                        checks.filter((i) => i.status === "passed").length,
                        checks.length,
                      )}
                      multiline
                      className="mt-5"
                    />
                  )}
                </>
              )}
            </div>,
            // The order as it will go — read through once before it is sent,
            // with nothing on it left to edit. Changing anything is Back.
            <div key="summary" className="px-4 pt-5 pb-4 md:px-6">
              {shown && product && (
                <>
                  {isMobile && (
                    <div className="mb-2">
                      <BackButton
                        label={t.orders.backToEdit}
                        onClick={() => onReviewChange(false)}
                      />
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
            let result: Awaited<ReturnType<typeof placeOrder>>;
            try {
              result = await placeOrder({
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
            } catch (err) {
              // The form stays as the IC filled it, and the buttons come back:
              // a failure used to leave `booking` true, disabling both the
              // primary and Cancel with only the ✕ as a way out.
              reportError("[placeOrder]", err);
              onNotice(t.orders.words[bookingModeFor(product)].actionFailed, "critical");
              return;
            } finally {
              setBooking(false);
            }
            const { booking: placed, submission } = result;
            onClose();
            onBookedProp?.(placed);
            // On a bond the order has already gone downstream, so the notice
            // can quote its reference — which is the whole reason the IC would
            // otherwise have gone looking for the record.
            const money = formatOrderAmount(amount, product.currency);
            const who = maskName(shown.name, isPrivate);
            onNotice(
              submission
                ? t.orders.booking.orderSent(money, who, submission.backendRef)
                : t.orders.booking.booked(money, who),
              "success",
            );
            // USABILITY-TEST ONLY (temporary; revert after testing): marks a
            // placed booking in the URL for Useberry's "URL contains
            // booking=sent". Next's own history state is passed on, so the
            // page is not refetched or remounted.
            const url = new URL(window.location.href);
            url.searchParams.set("booking", "sent");
            window.history.replaceState(window.history.state, "", url);
          }}
        />
      )}
    </div>
  );
}
