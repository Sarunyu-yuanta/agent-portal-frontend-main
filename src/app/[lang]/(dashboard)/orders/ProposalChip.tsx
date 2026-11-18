"use client";

/**
 * "ส่ง Proposal แล้ว", as a `Tag` like every status beside it.
 *
 * `blue` — one variant in that palette has to be left over for proposals, and
 * this is it: yellow is กำลังดำเนินการ, green สำเร็จ, gray ยกเลิก, red ถูกปฏิเสธ,
 * and `จองแล้ว` was moved to `lime` to free this one up
 * (`BOOKING_PHASE_VARIANT`). So a proposal wears the same shape as the
 * statuses without wearing one of their meanings.
 *
 * A thin wrapper rather than a `<Tag variant="lime">` at each call site: the
 * list says "ส่ง Proposal แล้ว" and the receipt says "รอลูกค้าตัดสินใจ", but the
 * *colour* is the thing that has to be the same in all three places, and this
 * is where it is decided once.
 *
 * It had an outline and a paper plane for a while, to keep a proposal visibly
 * apart from a booking status. That earned less than it cost: the two never
 * share a cell — a record is one kind or the other — and their wording cannot
 * be confused, while a chip of a different shape read as a lesser kind of row.
 */

import { Tag } from "@sarunyu/system-one";

/** Where a proposal's colour is decided, for every surface that shows one. */
export const PROPOSAL_VARIANT = "blue" as const;

export function ProposalChip({
  label = "ส่ง Proposal แล้ว",
  size = "sm",
}: {
  label?: string;
  /** `lg` is `Tag`'s own `large` — what every status in a table row uses. */
  size?: "sm" | "lg";
}) {
  return <Tag text={label} variant={PROPOSAL_VARIANT} size={size === "lg" ? "large" : "small"} />;
}
