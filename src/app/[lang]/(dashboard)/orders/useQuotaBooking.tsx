"use client";

/**
 * Ordering a bond from a catalogue page — Fixed Income or Global Bond.
 *
 * One press is the whole flow here: a bond has nothing to fill, so the order is
 * created and sent in the same action (`placeOrder` in `contexts/orders-context`)
 * and the IC has nothing left to do with it. The structured desks order from a
 * product page with its own Order tab to land on; a bond is ordered from a list
 * row as often as from its own page, and a list has no tab to switch to, so the
 * hand-off is a toast instead — the modal's "ส่งคำสั่งซื้อ … แล้ว" quotes the
 * reference and carries a "ดูคำสั่งซื้อ" action to Order Management.
 *
 * One hook per page rather than one modal per row: a table of bonds would
 * otherwise mount a modal and a toast stack for every line.
 */

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button, Toaster, type ToastStatus } from "@sarunyu/system-one";
import { useToasts } from "@/hooks/use-toasts";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import type { Booking } from "@/types/domain";
import { ordersListHref, type BookableProduct } from "./bookable-products";
import { isBookingOpen } from "./order-book";
import { ORDER_WORDS } from "./order-words";
import { OrderBookingModal } from "./OrderBookingModal";
import { useOrderBook } from "./use-order-books";

export function useQuotaBooking(options?: {
  /**
   * The order just placed, for a page that marks it — the bond page's Order
   * tab highlights the row it made (see `ProductOrderSection`).
   */
  onPlaced?: (booking: Booking) => void;
}): {
  /**
   * Opens the order modal on this product. `onBack` gives the client list a
   * back arrow to the step that opened it — see `CreateOrderButton`.
   */
  book: (
    product: BookableProduct,
    options?: { onBack?: () => void; clientId?: string },
  ) => void;
  /**
   * Reports into this page's one toast stack.
   *
   * Exposed so whatever else the page mounts — the Order tab, whose detail
   * modal reports a cancellation — reports in the same place rather than
   * standing up a second `<Toaster>` over the first.
   */
  notice: (message: string, status: ToastStatus) => void;
  /**
   * What the modal's `onBooked` does here — for a host that mounts its own
   * `OrderBookingModal` (`CreateOrderButton`, whose picker steps live inside
   * it) but reports into this stack, so the success toast still links to the
   * order.
   */
  markBooked: (booking: Booking) => void;
  /** The modal and its toasts — render once, anywhere on the page. */
  ui: ReactNode;
} {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToasts();
  const [product, setProduct] = useState<BookableProduct | null>(null);
  const [onBack, setOnBack] = useState<(() => void) | null>(null);
  const [fixedClientId, setFixedClientId] = useState<string | undefined>(undefined);
  // Set by `onBooked`, which the modal calls just before its success notice —
  // by then `product` has already been cleared by the close.
  const bookedId = useRef<string | null>(null);

  const notice = (message: string, status: ToastStatus) => {
    const id = status === "success" ? bookedId.current : null;
    bookedId.current = null;
    addToast({
      message,
      status,
      ...(id
        ? { actionLabel: "ดูคำสั่งซื้อ", onActionClick: () => router.push(ordersListHref(id)) }
        : {}),
    });
  };

  const markBooked = (booking: Booking) => {
    bookedId.current = booking.productId;
    options?.onPlaced?.(booking);
  };

  const ui = (
    <>
      {ORDER_BOOKING_ENABLED && product && (
        <OrderBookingModal
          open
          product={product}
          onClose={() => setProduct(null)}
          fixedClientId={fixedClientId}
          onBack={
            onBack
              ? () => {
                  setProduct(null);
                  onBack();
                }
              : undefined
          }
          onNotice={notice}
          onBooked={markBooked}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </>
  );

  const book = (
    next: BookableProduct,
    options?: { onBack?: () => void; clientId?: string },
  ) => {
    // Wrapped: a function handed to a state setter is called as an updater.
    setOnBack(() => options?.onBack ?? null);
    setFixedClientId(options?.clientId);
    setProduct(next);
  };

  return { book, notice, markBooked, ui };
}

/**
 * The CTA on a bond: opens the order modal while the bond has quota left,
 * and says เต็มโควตา once it hasn't.
 */
export function QuotaBookButton({
  product,
  onBook,
  size = "xs",
  className,
  label = ORDER_WORDS.quota.cta,
}: {
  product: BookableProduct;
  onBook: (product: BookableProduct) => void;
  size?: "xs" | "sm" | "lg" | "xl";
  className?: string;
  label?: string;
}) {
  const { data: book } = useOrderBook(product.id);
  const open = !book || isBookingOpen(book);
  return (
    <Button
      variant={open ? "primary" : "disabled"}
      size={size}
      disabled={!open}
      className={`whitespace-nowrap ${className ?? ""}`}
      onClick={(e) => {
        // Rows open the bond's page; the button is a separate action on it.
        e.stopPropagation();
        onBook(product);
      }}
    >
      {open ? label : "เต็มโควตา"}
    </Button>
  );
}
