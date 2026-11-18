"use client";

/**
 * The one order store for the whole app — bookings, the requests sent to
 * clients, and the orders sent downstream.
 *
 * Mounted once in the dashboard layout, for the same reason `NotesProvider` is:
 * a booking placed from a product page has to show up on `/orders` and in the
 * header bell without either of them remounting. The layout does not remount
 * between pages, so state held here survives navigation where `useState` in a
 * page would not.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * Held in React state, seeded from `lib/order-mock-data`. Two things here stand
 * in for systems that do not exist yet, and both are marked:
 *
 * 1. **{@link REQUIREMENT_TURNAROUND_MS}** — a client finishing their forms in
 *    another system. Really a webhook, or a poll of that system.
 * 2. **{@link SUBMISSION_TURNAROUND_MS}** — the back office accepting an order.
 *    Really a status on the order record, arriving the same way.
 * 3. **{@link BACKOFFICE_PICKUP_MS}** — the back office taking an order up:
 *    collecting a basket book that has filled, or starting on a bond order the
 *    IC has sent. Really a job on their side, or a webhook this app receives;
 *    either way nobody here presses anything.
 *
 * Every mutator is `async` and every call site awaits it, so pointing them at
 * real endpoints is a change in this file alone. `isLoading` is in the contract
 * and comes from `useStatic` over the seed, the same seam every other
 * dataset uses — the screens already render skeletons against it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BACKOFFICE_ACTOR,
  ORDER_ACTOR,
  clientNameById,
  seedBookings,
  seedProposals,
  seedOfferedProposals,
  seedRequirementRequests,
  seedSubmissions,
} from "@/lib/order-mock-data";
import { useStatic } from "@/hooks/use-api";
import {
  bookingModeForId,
  findBookableProduct,
} from "@/app/[lang]/(dashboard)/orders/bookable-products";
import { orderTargetFor } from "@/app/[lang]/(dashboard)/orders/order-book";
import { evidenceComplete, evidenceRequired } from "@/app/[lang]/(dashboard)/orders/order-evidence";
import type {
  Booking,
  OrderEvidence,
  OrderSubmission,
  ProposalChannel,
  ProposalLog,
  RequirementItem,
  RequirementKey,
  RequirementRequest,
} from "@/types/domain";

/**
 * How long a client takes to go and fill their forms in, in the mock.
 *
 * Long enough that the IC sees the "รอลูกค้าดำเนินการ" state and can navigate
 * away from it, short enough that a demo does not stall on it. The moment a
 * real system reports back, delete this and the timer it feeds.
 */
const REQUIREMENT_TURNAROUND_MS = 15_000;

/** The same stand-in, for the back office accepting a submitted order. */
const SUBMISSION_TURNAROUND_MS = 12_000;

/**
 * How long the back office takes to take an order up. Two things on each desk,
 * one length, because it is the same queue being stood in for:
 *
 * - **basket** — collecting a book that reached its notional. Nobody here sends
 *   it; this is the gap between "ครบยอด" and the order existing.
 * - **quota** — starting on an order the IC has just sent. This is the gap the
 *   IC can still cancel in, and the only one: see `OrderSubmissionStatus`.
 */
const BACKOFFICE_PICKUP_MS = 10_000;


type BookingDraft = {
  productId: string;
  clientId: string;
  clientName: string;
  amount: number;
  /** The checks the booking passed — stored on it, see `Booking.checks`. */
  checks: RequirementItem[];
  /**
   * Proof of the client's instruction — see `Booking.evidence`.
   *
   * Required on a basket draft and refused without it below. Absent on a quota
   * draft, which those desks do not ask for.
   */
  evidence?: OrderEvidence;
};

type OrdersContextValue = {
  bookings: Booking[];
  submissions: OrderSubmission[];
  requirementRequests: RequirementRequest[];
  /** Append-only, newest last — every offer that has gone out. */
  proposals: ProposalLog[];
  /** The order records haven't arrived — sourced from `useStatic` over the seed. */
  isLoading: boolean;
  /** The first load of the order records failed; screens show `ErrorState`. */
  error: Error | null;
  /** Fetch the order records again. */
  retry: () => void;
  /**
   * Places one client's order on a product — the single action behind every
   * booking button in the app.
   *
   * What that means differs by desk, which is why this returns both records:
   *
   * - **quota** — one press creates the booking *and* sends it downstream, so
   *   `submission` comes back populated and the caller can quote its reference
   *   straight away. A bond needs nothing to fill, so there was never anything
   *   for a separate send step to wait for.
   * - **basket** — the booking joins the basket and `submission` is `null`. The
   *   order is created later, by the back office, when the basket fills. These
   *   desks also require `draft.evidence`; see `Booking.evidence`.
   */
  placeOrder: (
    draft: BookingDraft,
  ) => Promise<{ booking: Booking; submission: OrderSubmission | null }>;
  /**
   * Pulls a booking back.
   *
   * What the surfaces allow differs by desk and is enforced there
   * (`BookingDetailModal`): a basket booking can go until an order carries it,
   * a bond order only until the back office picks it up. Cancelling one whose
   * order is still `sent` also stops that order — see the guard in
   * {@link placeSubmission}.
   */
  cancelBooking: (bookingId: string) => Promise<void>;
  /** Nudges a client to complete `keys` in whichever system owns them. */
  sendRequirementRequest: (input: {
    clientId: string;
    clientName: string;
    productId: string;
    keys: RequirementKey[];
  }) => Promise<RequirementRequest>;
  /**
   * Sends one product's documents to any number of clients at once — an offer,
   * and the record of it. See {@link ProposalLog}.
   *
   * Returns the rows actually written, the way `shareMaterial` does in
   * `contexts/campaigns-context`, so a caller reports what went rather than
   * what it asked for.
   *
   * ─── Backend handoff ───────────────────────────────────────────────────────
   * **Nothing is delivered.** There is no mail service and no app push behind
   * this; what the mutator does is write the log the offer will be measured
   * from. The dialog says so in as many words rather than implying a document
   * has landed in someone's inbox. When that service exists, this is the one
   * function it lands in.
   */
  sendProposal: (input: {
    productId: string;
    clientIds: string[];
    /** Where it goes. `app` is added if missing — every send lands there. */
    channels: ProposalChannel[];
  }) => Promise<ProposalLog[]>;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

/**
 * Ids minted in the browser. Sequential rather than random so a page that
 * renders one is stable across a re-render, and prefixed so a locally created
 * row is distinguishable from a seeded one at a glance in the log.
 */
let localSeq = 0;
const localId = (prefix: string) => `${prefix}-local-${++localSeq}`;

export function OrdersProvider({ children }: { children: ReactNode }) {
  // The seed is what a real feed would be fetching; its loading state is the
  // context's, so every order screen and the bell wait on the same thing.
  const { isLoading, error, retry } = useStatic(seedBookings);
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [submissions, setSubmissions] = useState<OrderSubmission[]>(seedSubmissions);
  const [requirementRequests, setRequirementRequests] =
    useState<RequirementRequest[]>(seedRequirementRequests);
  const [proposals, setProposals] = useState<ProposalLog[]>(() => [
    ...seedProposals,
    ...seedOfferedProposals,
  ]);

  /**
   * Every pending stand-in timer, cleared on unmount.
   *
   * Without this a navigation away mid-round-trip leaves a `setState` pointed
   * at an unmounted tree — which React tolerates but which would also mean a
   * booking silently completing after the surface that started it is gone.
   */
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const t of pending) clearTimeout(t);
    };
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /**
   * The live lists, for the one timer that fires long after it was set.
   *
   * {@link backOfficePickup} runs ten seconds after a book filled up and has to
   * read what is true *then* — whether a booking was cancelled out from under
   * it, whether an order already exists. Closing over the render's `bookings`
   * would have it deciding against a snapshot that is one navigation out of
   * date.
   */
  const bookingsRef = useRef(bookings);
  const submissionsRef = useRef(submissions);
  useEffect(() => {
    bookingsRef.current = bookings;
    submissionsRef.current = submissions;
  }, [bookings, submissions]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    // Marked rather than removed: the log is rebuilt from the bookings
    // themselves, so deleting the row would delete the history of it too.
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b)),
    );
  }, []);

  const sendRequirementRequest = useCallback<
    OrdersContextValue["sendRequirementRequest"]
  >(
    async ({ clientId, clientName, productId, keys }) => {
      const request: RequirementRequest = {
        id: localId("rq"),
        clientId,
        clientName,
        productId,
        keys,
        sentAt: new Date().toISOString(),
        sentBy: ORDER_ACTOR,
        status: "sent",
        completedAt: null,
      };
      setRequirementRequests((prev) => [...prev, request]);

      // ── Stand-in for the client's own system reporting back ──────────────
      later(() => {
        setRequirementRequests((prev) =>
          prev.map((r) =>
            r.id === request.id
              ? { ...r, status: "completed", completedAt: new Date().toISOString() }
              : r,
          ),
        );
      }, REQUIREMENT_TURNAROUND_MS);

      return request;
    },
    [later],
  );

  const sendProposal = useCallback<OrdersContextValue["sendProposal"]>(
    async ({ productId, clientIds, channels: picked }) => {
      // One array shared by every row of this send: they went the same way.
      const channels: ProposalChannel[] = picked.includes("app") ? picked : ["app", ...picked];
      // Ids resolved against the roster here rather than taken from the caller:
      // the log carries the name it was sent under, and a caller passing a
      // stale one would put a name in the compliance record that nobody sent
      // anything to. Unknown ids are dropped rather than logged blank.
      const sentAt = new Date().toISOString();
      const rows: ProposalLog[] = [];
      for (const clientId of clientIds) {
        const clientName = clientNameById(clientId);
        if (!clientName) continue;
        rows.push({
          id: localId("prp"),
          productId,
          clientId,
          clientName,
          sentAt,
          sentBy: ORDER_ACTOR,
          channels,
        });
      }
      // Appended, never merged into an existing row: a second proposal to the
      // same client is a re-pitch, and the log is the record that both happened.
      setProposals((prev) => [...prev, ...rows]);
      return rows;
    },
    [],
  );

  /**
   * Whether an order still has anything to carry.
   *
   * A cancellation marks the booking and nothing else, so the timers below have
   * to ask: an order every one of whose bookings has been pulled must not go on
   * to report itself accepted. Reads the ref, not the render's list — these are
   * answered seconds later, after any number of navigations.
   */
  const stillLive = useCallback(
    (bookingIds: string[]) =>
      bookingIds.some(
        (id) => bookingsRef.current.find((b) => b.id === id)?.status === "booked",
      ),
    [],
  );

  /**
   * One order record, however it came to exist.
   *
   * Two arguments carry the whole of the difference between the desks:
   *
   * - `by` — an IC pressing ส่งคำสั่งซื้อ on a bond, or the back office helping
   *   itself to a full basket. Read back as the actor on the log line, so a
   *   basket order must not be attributed to someone who never pressed
   *   anything.
   * - `startAt` — `"sent"` for an order the IC just sent, which the back office
   *   has yet to take up and the IC can still pull; `"processing"` for a basket
   *   the back office is collecting *as* it creates the order. See
   *   `OrderSubmissionStatus`.
   */
  const placeSubmission = useCallback(
    (
      productId: string,
      bookingIds: string[],
      by: string,
      startAt: "sent" | "processing",
    ) => {
      const submission: OrderSubmission = {
        id: localId("sub"),
        productId,
        bookingIds,
        submittedAt: new Date().toISOString(),
        submittedBy: by,
        status: startAt,
        // The downstream system assigns this; minting it here is what lets the
        // IC quote a reference while the order is still in flight, which is
        // what the mock is standing in for.
        backendRef: `ORD-${new Date().getFullYear()}-${String(++localSeq).padStart(6, "0")}`,
        settledAt: null,
      };
      setSubmissions((prev) => [...prev, submission]);

      // ── Stand-in for the back office taking the order up ─────────────────
      // Only an order that started as `sent` has this step; a basket order was
      // created by the pickup itself.
      const pickupAfter = startAt === "sent" ? BACKOFFICE_PICKUP_MS : 0;
      if (startAt === "sent") {
        later(() => {
          if (!stillLive(bookingIds)) return;
          setSubmissions((prev) =>
            prev.map((s) => (s.id === submission.id ? { ...s, status: "processing" } : s)),
          );
        }, pickupAfter);
      }

      // ── Stand-in for the back office accepting it ────────────────────────
      // Counted from the pickup, not from the send: the turnaround is how long
      // they take over the order, and it has not reached them until then.
      later(() => {
        if (!stillLive(bookingIds)) return;
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? { ...s, status: "completed", settledAt: new Date().toISOString() }
              : s,
          ),
        );
      }, pickupAfter + SUBMISSION_TURNAROUND_MS);

      return submission;
    },
    [later, stillLive],
  );

  const placeOrder = useCallback<OrdersContextValue["placeOrder"]>(
    async (draft) => {
      const mode = bookingModeForId(draft.productId);
      // Basket desks take one order per product: once it has been sent the
      // product is closed, and every surface already hides its จองซื้อ. Held
      // here as well because this is where the endpoint will enforce it. Quota
      // desks send every order on its own, so a sent order closes nothing;
      // their cap is the quota, which the booking modal holds the amount to.
      if (mode === "basket" && submissions.some((s) => s.productId === draft.productId)) {
        throw new Error("This product's order has already been sent; it takes no more bookings.");
      }
      // The IC books on the client's behalf on these desks, so the record of
      // how the client asked is part of the booking rather than a note beside
      // it. The form disables its button without one, but a disabled button is
      // a courtesy and this is where the endpoint will enforce it — the same
      // reasoning `shareMaterial` spells out in `contexts/campaigns-context`.
      if (evidenceRequired(mode) && !evidenceComplete(draft.evidence)) {
        throw new Error(
          "A booking on this desk needs evidence of the client's instruction (and a note, for \"other\").",
        );
      }
      const booking: Booking = {
        id: localId("bk"),
        productId: draft.productId,
        clientId: draft.clientId,
        clientName: draft.clientName,
        amount: draft.amount,
        checks: draft.checks,
        evidence: draft.evidence,
        createdAt: new Date().toISOString(),
        createdBy: ORDER_ACTOR,
        status: "booked",
        // Everything this portal writes is the IC acting. `"app"` only ever
        // arrives from the client's own app — see `Booking.placedVia`.
        placedVia: "ic",
      };
      setBookings((prev) => [...prev, booking]);
      // The booking is not in `bookingsRef` until the next render, so `sent`'s
      // own timers would find nothing live if they fired first. They cannot —
      // the shortest is ten seconds — but `stillLive` is deliberately written
      // against the ref for the navigation case, so this is worth knowing.
      if (mode !== "quota") return { booking, submission: null };
      return {
        booking,
        submission: placeSubmission(draft.productId, [booking.id], ORDER_ACTOR, "sent"),
      };
    },
    [placeSubmission, submissions],
  );

  /**
   * The back office collecting a basket book that has reached its notional.
   *
   * Re-checks on the way in rather than trusting the effect that scheduled it:
   * ten seconds is long enough for a booking to be cancelled out from under a
   * full book, and collecting one that is no longer full would send an order
   * short of its target.
   */
  const backOfficePickup = useCallback(
    (productId: string) => {
      // Every early return releases the claim `pickedUp` staked when this was
      // scheduled. Without that, a basket that filled, then lost a booking to a
      // cancellation inside the ten seconds, then filled again, is skipped by
      // the effect forever — it sits full and uncollected with nothing anyone
      // can do about it.
      const giveUp = () => {
        pickedUp.current.delete(productId);
      };
      if (submissionsRef.current.some((s) => s.productId === productId)) return giveUp();
      const product = findBookableProduct(productId);
      if (!product) return giveUp();
      const open = bookingsRef.current.filter(
        (b) => b.productId === productId && b.status === "booked",
      );
      const total = open.reduce((sum, b) => sum + b.amount, 0);
      if (total < orderTargetFor(product)) return giveUp();
      // `processing`, not `sent`: this *is* the pickup, so the order reaches
      // them the moment it exists. See `OrderSubmissionStatus`.
      placeSubmission(
        productId,
        open.map((b) => b.id),
        BACKOFFICE_ACTOR,
        "processing",
      );
    },
    [placeSubmission],
  );

  /**
   * Books already handed to the back office, or promised to it.
   *
   * Claimed at *schedule* time so the effect below does not queue a second
   * pickup while the first is still in its ten seconds; released by
   * `backOfficePickup` if it finds the book no longer qualifies.
   */
  const pickedUp = useRef(new Set<string>());

  /**
   * Watches every basket book for the moment it fills, and hands it over.
   *
   * An effect rather than a line inside `placeOrder`, because a book can reach
   * its target without a booking being placed — a cancellation that lowers the
   * total, a seeded book that is already full when the app loads. Anything that
   * can make a book full has to be able to hand it over, and the only thing all
   * of those have in common is the state landing.
   *
   * `pickedUp` is what keeps it to once each: the effect re-runs on every
   * booking change, and a book stays full for the whole ten seconds it is
   * waiting.
   */
  useEffect(() => {
    const totals = new Map<string, number>();
    for (const b of bookings) {
      if (b.status !== "booked") continue;
      if (bookingModeForId(b.productId) !== "basket") continue;
      totals.set(b.productId, (totals.get(b.productId) ?? 0) + b.amount);
    }
    for (const [productId, total] of totals) {
      if (pickedUp.current.has(productId)) continue;
      if (submissions.some((s) => s.productId === productId)) continue;
      const product = findBookableProduct(productId);
      if (!product || total < orderTargetFor(product)) continue;
      pickedUp.current.add(productId);
      later(() => backOfficePickup(productId), BACKOFFICE_PICKUP_MS);
    }
  }, [bookings, submissions, later, backOfficePickup]);

  const value = useMemo(
    () => ({
      bookings,
      submissions,
      requirementRequests,
      proposals,
      isLoading,
      error,
      retry,
      placeOrder,
      cancelBooking,
      sendRequirementRequest,
      sendProposal,
    }),
    [
      bookings,
      submissions,
      requirementRequests,
      proposals,
      isLoading,
      error,
      retry,
      placeOrder,
      cancelBooking,
      sendRequirementRequest,
      sendProposal,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
