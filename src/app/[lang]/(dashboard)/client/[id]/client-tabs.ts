import {
  CALL_LOG_ENABLED,
  NOTES_ENABLED,
  ORDER_BOOKING_ENABLED,
  REMINDERS_ENABLED,
} from "@/lib/feature-flags";

/**
 * Full Profile's sub-tabs, in the order they're shown.
 *
 * One list, three readers: the tab strip renders it, `?tab=` is validated
 * against it, and the loading skeleton draws a placeholder per entry. So a tab
 * that's out of the current delivery phase (see `lib/feature-flags`) leaves the
 * strip, stops being addressable by URL, and stops being drawn as a bar the
 * page then never fills in — all from the same edit.
 *
 * Its own module rather than living in `page.tsx`, only because the skeleton is
 * imported *by* `page.tsx` and would otherwise have to import back out of it.
 */
export const CLIENT_TAB_ITEMS = [
  { id: "overview", title: "Overview" },
  { id: "kyc", title: "KYC" },
  { id: "assets", title: "Assets" },
  // This client's orders, every asset — Order Management's "ทั้งหมด" for one
  // client (`AllOrdersPanel` with `clientId`).
  ...(ORDER_BOOKING_ENABLED ? [{ id: "orders", title: "Order" }] : []),
  ...(CALL_LOG_ENABLED ? [{ id: "call-log", title: "Call Log" }] : []),
  ...(REMINDERS_ENABLED ? [{ id: "reminders", title: "Reminders" }] : []),
  ...(NOTES_ENABLED ? [{ id: "notes", title: "Notes" }] : []),
];

/** Sub-tabs that `?tab=` may address; anything else falls back to Overview. */
export const CLIENT_TABS = CLIENT_TAB_ITEMS.map((tab) => tab.id);
