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

export function ProductOrderNotice({ book }: { book: OrderBook | null | undefined }) {
  if (!book || isBookingOpen(book)) return null;
  const order = book.submissions[0];

  if (order.status === "processing") {
    return (
      <Alert
        status="information"
        title="กำลังดำเนินการสั่งซื้อ"
        message={`ส่งคำสั่งซื้อ ${order.backendRef} แล้ว อยู่ระหว่างดำเนินการที่ระบบหลังบ้าน — ปิดรับจองเพิ่ม`}
        multiline
      />
    );
  }
  if (order.status === "completed") {
    return (
      <Alert
        status="success"
        title="รับคำสั่งซื้อสำเร็จ"
        message={`คำสั่งซื้อ ${order.backendRef} สำเร็จแล้ว — สินค้านี้ปิดรับจอง`}
        multiline
      />
    );
  }
  return (
    <Alert
      status="critical"
      title="คำสั่งซื้อถูกยกเลิก"
      message={`ระบบหลังบ้านปฏิเสธคำสั่งซื้อ ${order.backendRef} — สินค้านี้ปิดรับจอง`}
      multiline
    />
  );
}
