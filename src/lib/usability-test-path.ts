/**
 * USABILITY-TEST ONLY — temporary; revert once testing is done.
 *
 * Useberry tells screens apart by pathname alone, so an open modal is written
 * as a trailing path segment — `/…/ut-proposal`, `/…/ut-order-booked` — see
 * `markUtStep`. Pure, so the proxy can use it too.
 */

export const UT_SEGMENTS = ["proposal", "booking", "proposal-sent", "order-booked"] as const;
export type UtSegment = (typeof UT_SEGMENTS)[number];

const UT_SEGMENT_RE = new RegExp(`/ut-(${UT_SEGMENTS.join("|")})/?$`);

/** The `ut-*` segment a path ends with, or `null`. */
export function utSegmentOf(pathname: string): UtSegment | null {
  return (pathname.match(UT_SEGMENT_RE)?.[1] as UtSegment | undefined) ?? null;
}

/** The path without its `ut-*` segment — `/th/x/ut-proposal` → `/th/x`. */
export function utBasePath(pathname: string): string {
  return pathname.replace(UT_SEGMENT_RE, "") || "/";
}
