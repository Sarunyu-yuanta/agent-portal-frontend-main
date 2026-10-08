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
 * 3. **{@link CREDIT_CHECK_MS}** — the back office checking a client can fund
 *    a booking. Really a status on the booking record.
 *
 * Every mutator is `async` and every call site awaits it, so pointing them at
 * real endpoints is a change in this file alone. `isLoading` is in the contract
 * and permanently `false` for the same reason `useStatic` returns one — the
 * screens already render skeletons against it.
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
  ORDER_ACTOR,
  seedBookings,
  seedRequirementRequests,
  seedSubmissions,
} from "@/lib/order-mock-data";
import type {
  Booking,
  CreditStatus,
  OrderSubmission,
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

/** The same stand-in, for the funds check every new booking goes through. */
const CREDIT_CHECK_MS = 8_000;

type BookingDraft = {
  productId: string;
  clientId: string;
  clientName: string;
  amount: number;
  /** The checks the booking passed — stored on it, see `Booking.checks`. */
  checks: RequirementItem[];
  /**
   * The client's cash in the product's currency — what the mock funds check
   * measures the amount against. The real check reads the settlement account
   * itself, and this field goes.
   */
  fundsAvailable: number;
};

type OrdersContextValue = {
  bookings: Booking[];
  submissions: OrderSubmission[];
  requirementRequests: RequirementRequest[];
  /** Always `false` today — see the module note. */
  isLoading: boolean;
  bookOrder: (draft: BookingDraft) => Promise<Booking>;
  cancelBooking: (bookingId: string) => Promise<void>;
  /** Nudges a client to complete `keys` in whichever system owns them. */
  sendRequirementRequest: (input: {
    clientId: string;
    clientName: string;
    productId: string;
    keys: RequirementKey[];
  }) => Promise<RequirementRequest>;
  /** Sends every unsent booking on a product as one order. */
  submitOrder: (productId: string, bookingIds: string[]) => Promise<OrderSubmission>;
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
  const [bookings, setBookings] = useState<Booking[]>(seedBookings);
  const [submissions, setSubmissions] = useState<OrderSubmission[]>(seedSubmissions);
  const [requirementRequests, setRequirementRequests] =
    useState<RequirementRequest[]>(seedRequirementRequests);

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

  /** Resolves one booking's funds check — see {@link CREDIT_CHECK_MS}. */
  const settleCredit = useCallback(
    (bookingId: string, result: CreditStatus) =>
      later(() => {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, credit: result } : b)),
        );
      }, CREDIT_CHECK_MS),
    [later],
  );

  // Seeded bookings still at the check get their answer too, so a demo that
  // opens on one does not sit there forever. Seeds have no cash figure to
  // test, so they pass.
  useEffect(() => {
    for (const b of seedBookings) {
      if (b.credit === "pending") settleCredit(b.id, "sufficient");
    }
  }, [settleCredit]);

  const bookOrder = useCallback(async (draft: BookingDraft) => {
    // One order per product: once it has been sent the product is closed, and
    // every surface already hides its จองซื้อ. Held here as well because this is
    // where the endpoint will enforce it.
    if (submissions.some((s) => s.productId === draft.productId)) {
      throw new Error("This product's order has already been sent; it takes no more bookings.");
    }
    const booking: Booking = {
      id: localId("bk"),
      productId: draft.productId,
      clientId: draft.clientId,
      clientName: draft.clientName,
      amount: draft.amount,
      checks: draft.checks,
      credit: "pending",
      createdAt: new Date().toISOString(),
      createdBy: ORDER_ACTOR,
      status: "booked",
    };
    setBookings((prev) => [...prev, booking]);

    // ── Stand-in for the back office's funds check ─────────────────────────
    settleCredit(
      booking.id,
      draft.amount <= draft.fundsAvailable ? "sufficient" : "insufficient",
    );

    return booking;
  }, [submissions, settleCredit]);

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

  const submitOrder = useCallback<OrdersContextValue["submitOrder"]>(
    async (productId, bookingIds) => {
      const submission: OrderSubmission = {
        id: localId("sub"),
        productId,
        bookingIds,
        submittedAt: new Date().toISOString(),
        submittedBy: ORDER_ACTOR,
        status: "processing",
        // The downstream system assigns this; minting it here is what lets the
        // IC quote a reference while the order is still in flight, which is
        // what the mock is standing in for.
        backendRef: `ORD-${new Date().getFullYear()}-${String(++localSeq).padStart(6, "0")}`,
        settledAt: null,
      };
      setSubmissions((prev) => [...prev, submission]);

      // ── Stand-in for the back office accepting the order ─────────────────
      later(() => {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === submission.id
              ? { ...s, status: "completed", settledAt: new Date().toISOString() }
              : s,
          ),
        );
      }, SUBMISSION_TURNAROUND_MS);

      return submission;
    },
    [later],
  );

  const value = useMemo(
    () => ({
      bookings,
      submissions,
      requirementRequests,
      isLoading: false,
      bookOrder,
      cancelBooking,
      sendRequirementRequest,
      submitOrder,
    }),
    [
      bookings,
      submissions,
      requirementRequests,
      bookOrder,
      cancelBooking,
      sendRequirementRequest,
      submitOrder,
    ],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within an OrdersProvider");
  return ctx;
}
