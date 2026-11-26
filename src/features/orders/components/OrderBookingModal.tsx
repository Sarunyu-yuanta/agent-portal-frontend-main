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

import { useEffect, useRef, useState } from "react";

import type { ToastStatus } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ui/responsive-bottom-sheet-modal";
import { useOrders } from "@/features/orders/store/orders-context";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import type { BookingLead } from "@/features/orders/lib/booking-lead";
import { BackButton } from "./BackButton";
import { ProposalSteps, type ProposalStep, type ProposalSubject } from "./SendProposalDialog";
import { sendAndReport } from "@/features/orders/hooks/use-send-proposal";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { useT } from "@/i18n/I18nProvider";
import type { Booking } from "@/types/order";
import { BookingForm } from "./booking/BookingForm";
import { markUtStep } from "@/lib/usability-test";

// Re-exported so existing importers of this module keep working.
export type { BookingLead } from "@/features/orders/lib/booking-lead";
export { STATUS_CHIP } from "@/features/orders/lib/status-chip";
export { FieldCard, ReadOnlyField } from "./booking/FieldCard";

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
  const t = useT();
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

  // USABILITY-TEST ONLY (temporary; revert after testing): mirror the step into
  // `?ut_step=` for test tools. The success step must survive the close after it.
  const utStep = atLead
    ? "order-pick"
    : proposing
      ? `proposal-${proposalStep}`
      : !clientId
        ? "order-clients"
        : reviewing
          ? "order-review"
          : "order-form";
  const utDone = useRef(false);
  const utFinish = (step: string) => {
    utDone.current = true;
    markUtStep(step);
  };
  useEffect(() => {
    if (open) {
      utDone.current = false;
      markUtStep(utStep);
    } else if (!utDone.current) {
      markUtStep(null);
    }
  }, [open, utStep]);
  // Most hosts unmount the modal on close rather than passing `open={false}`.
  useEffect(
    () => () => {
      if (!utDone.current) markUtStep(null);
    },
    [],
  );

  if (!target && !lead) return null;

  if (proposing) {
    return (
      <ResponsiveBottomSheetModal
        open={open}
        onClose={onClose}
        title={
          atLead || !subject
            ? (lead?.title ?? "")
            : t.orders.proposal.sheetTitle(subject.underlying, subject.coupon ?? "")
        }
        titleId="order-booking-title"
        desktopMaxWidth="max-w-[614px]"
        desktopTitleIcon={
          atLead ? (
            lead?.onBack ? (
              <BackButton label={t.orders.back} onClick={lead.onBack} />
            ) : undefined
          ) : proposalStep === "channels" ? (
            <BackButton label={t.orders.back} onClick={() => setProposalStep("clients")} />
          ) : onBack ? (
            <BackButton label={t.orders.back} onClick={onBack} />
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
          onConfirm={async (clientIds, channels) => {
            if (!subject) return false;
            const ok = await sendAndReport(
              t,
              () => sendProposal({ productId: subject.id, clientIds, channels }),
              subject.underlying,
              onNotice,
              onClose,
            );
            if (ok) utFinish("proposal-sent");
            return ok;
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
          : t.orders.words[bookingModeFor(product)].modalTitle(product.underlying, product.coupon)
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
          lead?.onBack ? (
            <BackButton label={t.orders.back} onClick={lead.onBack} />
          ) : undefined
        ) : clientId && reviewing ? (
          <BackButton label={t.orders.backToEdit} onClick={() => setReviewing(false)} />
        ) : clientId ? (
          fixedClientId && !onBack ? undefined : (
            <BackButton onClick={leaveForm} />
          )
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
        onBooked={(booking) => {
          utFinish("order-booked");
          onBooked?.(booking);
        }}
      />
    </ResponsiveBottomSheetModal>
  );
}
