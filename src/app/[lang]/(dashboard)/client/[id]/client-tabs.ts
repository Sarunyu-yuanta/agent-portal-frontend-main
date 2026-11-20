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
/** A sub-tab's id — also its `?tab=` value and its key in `t.client.tabs`. */
export type ClientTabId =
  "overview" | "kyc" | "assets" | "orders" | "call-log" | "reminders" | "notes";

/** Ids only — the tab strip reads each title from `t.client.tabs[id]`. */
export const CLIENT_TAB_ITEMS: { id: ClientTabId }[] = [
  { id: "overview" },
  { id: "kyc" },
  { id: "assets" },
  // This client's orders, every asset — Order Management's "ทั้งหมด" for one
  // client (`AllOrdersPanel` with `clientId`).
  ...(ORDER_BOOKING_ENABLED ? [{ id: "orders" as const }] : []),
  ...(CALL_LOG_ENABLED ? [{ id: "call-log" as const }] : []),
  ...(REMINDERS_ENABLED ? [{ id: "reminders" as const }] : []),
  ...(NOTES_ENABLED ? [{ id: "notes" as const }] : []),
];

/** Sub-tabs that `?tab=` may address; anything else falls back to Overview. */
export const CLIENT_TABS: string[] = CLIENT_TAB_ITEMS.map((tab) => tab.id);
