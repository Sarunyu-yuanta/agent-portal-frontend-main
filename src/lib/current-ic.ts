/**
 * The signed-in IC.
 *
 * There is one of them in this app today, and this is where they are described.
 * Before this file the same person was three separate literals — `NOTE_AUTHOR`
 * for anything they authored, `"Senior RM"` inline in the sidebar, and nothing
 * at all for their team, which the booking modal has to print. Three literals
 * is how a log line and a booking end up crediting different people for the
 * same afternoon.
 *
 * `IC_NAME` re-exports `NOTE_AUTHOR` rather than redeclaring it: that constant
 * already has callers across the notes surfaces, and a second string holding
 * the same name would be the exact problem this file exists to remove.
 *
 * ─── Backend handoff ─────────────────────────────────────────────────────────
 * All three come from the session once there is one. Nothing here is per-client
 * or per-product, so this stays a module constant rather than a context until
 * the app has more than one user.
 */

export { NOTE_AUTHOR as IC_NAME } from "@/app/(dashboard)/notes/note-constants";

/** Shown under the name in the sidebar's account menu. */
export const IC_ROLE = "Senior RM";

/** The branch and desk code a booking is placed under. */
export const IC_TEAM = "Bangna Branch (BGN1A01)";
