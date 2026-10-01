/**
 * Phase gates — which features are in the build the dev team picks up.
 *
 * The portal was built ahead of the delivery plan, so a few finished features
 * belong to a later phase than the one being handed over. Rather than deleting
 * them (and re-typing them later), each is switched off here and every entry
 * point into it is gated on the flag. The code stays where it is, compiles, and
 * comes back by flipping one boolean.
 *
 * ## Currently out of phase
 *
 * Nothing. **Phase 2 turned every gate on** — Notes, Calendar, Reminders and
 * Call log are all live again, alongside the KYC alerts that were already on in
 * Phase 1. What each covers:
 *
 * - **Notes** — the `/notes` hub, the floating composer, Client 360's Notes tab
 *   and the Notes dialog in the client-hub side panel.
 * - **Calendar** — the `/calendar` month view.
 * - **Reminders** — the bell's reminder rows, Client 360's Reminders tab and
 *   its Overview card, and the Reminders dialog in the client-hub side panel.
 *   The bell itself is not gated on this — see `KYC_ALERTS_ENABLED`.
 * - **Call log** — Client 360's Call Log tab and the Call log dialog in the
 *   client-hub side panel.
 *
 * The file stays because the mechanism is worth keeping: it is how a finished
 * feature gets held back from a release without being deleted, and the next
 * phase boundary will want it again.
 *
 * ## Turning one off again
 *
 * Flip the flag to `false`. Everything gated on it disappears — nothing else
 * to unwire. Two dependencies to respect if they are toggled separately:
 *
 * - A reminder **is** a date attached to a note, so `REMINDERS_ENABLED` without
 *   `NOTES_ENABLED` leaves the reminder surfaces read-only: they still show
 *   system-raised items (dividend ex-dates), but there is no way to author one.
 * - The Calendar is a by-day view of those same reminders, so
 *   `CALENDAR_ENABLED` without `REMINDERS_ENABLED` is not a combination the
 *   design accounts for.
 *
 * The safe move is to bring all three back together, the way they were built.
 *
 * Plain module constants rather than env vars on purpose: a phase boundary is a
 * property of the build, not of the environment it is deployed to, and a
 * constant means whoever greps for the flag finds every gate on it.
 *
 * Each is annotated `: boolean` rather than left to infer `false`. Without it
 * TypeScript narrows the type to the literal `false` and treats the enabled
 * branch of every gate as dead — `flag ? [item] : []` collapses to `never[]`,
 * which breaks the moment a gated value has to satisfy a real type. The
 * annotation keeps both branches type-checked, so flipping a flag can't turn
 * out to have been hiding a compile error all along.
 */

/** `/notes`, the floating note composer, and every per-client Notes surface. */
export const NOTES_ENABLED: boolean = true;

/**
 * Order booking: the "จองซื้อให้ลูกค้า" flow on a product, the `/orders` hub,
 * and the order rows in the header bell.
 *
 * Its own gate rather than riding on anything above it — it stands on the
 * product catalogue and the client KYC records, both of which have been in
 * phase since Phase 1, and it is the first feature here that *writes*. Turning
 * it off leaves the catalogue exactly as it was: the product detail page falls
 * back to the external "สร้างคำสั่งซื้อ" link it carried before, and `/orders`
 * redirects to the catalogue the way `/notes` used to redirect to the hub.
 */
export const ORDER_BOOKING_ENABLED: boolean = true;

/** The `/calendar` month view. */
export const CALENDAR_ENABLED: boolean = true;

/** Every reminder list, card, and dialog, and the bell's reminder rows. */
export const REMINDERS_ENABLED: boolean = true;

/**
 * KYC expiry alerts in the header bell.
 *
 * Deliberately its own flag rather than part of `REMINDERS_ENABLED`: a KYC
 * expiry isn't a reminder anyone wrote, it's derived from the client's own KYC
 * record, so it stands on data that is already in phase. This is what puts the
 * bell in the header while Reminders is still switched off — the two feeds are
 * merged, so turning Reminders back on adds its rows alongside these rather
 * than replacing them.
 */
export const KYC_ALERTS_ENABLED: boolean = true;

/**
 * Client 360's Call Log tab and the Call log dialog in its side panel.
 *
 * The "Last Contact" line in a profile's identity bar is a separate decision
 * that happens to land the same way. It reads as a property of the client
 * rather than a view of the call history — the client list carries its own
 * `lastContact` field for the same fact — so it could have stayed. It is out of
 * scope for this phase all the same, and is hidden in
 * `client/[id]/page.tsx` (the KYC countdown took its place in the bar).
 *
 * Two things are therefore unreferenced but deliberately kept, the same way
 * everything else on this page is kept: the `lastContact` field in
 * `clients.json`, and `lastContactFromCallLogs` in `client-detail-data.ts`.
 * **Neither is dead code — do not delete them.** A grep for callers finds only
 * this comment, which is exactly how they look right before someone removes
 * them by mistake.
 */
export const CALL_LOG_ENABLED: boolean = true;
