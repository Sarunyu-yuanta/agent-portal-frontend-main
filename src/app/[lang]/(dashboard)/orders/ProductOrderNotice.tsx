"use client";

/**
 * What a product page says once its order has gone out — in place of the
 * จองซื้อ buttons, which are gone by then.
 *
 * Above the tabs rather than inside one, so it reads the same on Detail and on
 * Order Management: the order is a fact about the whole product, and a disabled
 * button on one tab only said "not now" without saying why.
 */

import { Alert } from "@sarunyu/system-one";
import type { OrderBook } from "@/types/domain";
import { isBookingOpen } from "./order-book";
import { useT } from "@/i18n/I18nProvider";

export function ProductOrderNotice({ book }: { book: OrderBook | null | undefined }) {
  const t = useT();
  if (!book || isBookingOpen(book)) return null;
  const order = book.submissions[0];

  if (order.status === "processing") {
    return (
      <Alert
        status="information"
        title={t.orders.notice.processingTitle}
        message={t.orders.notice.processing(order.backendRef)}
        multiline
      />
    );
  }
  if (order.status === "completed") {
    return (
      <Alert
        status="success"
        title={t.orders.notice.completedTitle}
        message={t.orders.notice.completed(order.backendRef)}
        multiline
      />
    );
  }
  return (
    <Alert
      status="critical"
      title={t.orders.notice.rejectedTitle}
      message={t.orders.notice.rejected(order.backendRef)}
      multiline
    />
  );
}
