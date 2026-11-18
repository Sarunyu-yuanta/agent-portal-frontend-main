"use client";

import Link from "next/link";
import { Card, Tag } from "@sarunyu/system-one";
import type { CardTagStatus } from "@sarunyu/system-one";
import type { Campaign } from "@/types/domain";
import { campaignDateLine, FORMAT_LABEL, PRODUCT_LABEL } from "./campaign-data";

/**
 * One campaign in the grid: the design system's `Card variant="event"`.
 *
 * Everything rendered here comes out of that card — the banner, the title, the
 * orange calendar row, the venue line, the audience line, the status chip. It
 * is wrapped in a `<Link>` so the card has somewhere to go, and that link adds
 * exactly one thing of its own: the cover grows a little under the pointer. The
 * card itself does not lift, tint or change its shadow — the artwork moving is
 * the whole of the feedback.
 *
 * All this file does otherwise is map a `Campaign` onto that card's props.
 * Where the two disagree is written down below, because the card is built for
 * events and half of these are promotions.
 */
export function CampaignCard({
  campaign,
  seatsLeft,
  isNew = false,
}: {
  campaign: Campaign;
  /** Events only; `null` for a promotion, which has no seats. */
  seatsLeft: number | null;
  /** Recently opened — see `isNewCampaign`. Pinned over the cover's corner. */
  isNew?: boolean;
}) {
  const isEvent = campaign.type === "event";

  /**
   * The audience row, as that row wants it — taken, out of the total.
   * `undefined` switches the row off: a promotion has no attendees, and the
   * label it would print ("ผู้เข้าร่วม") is fixed by the design system.
   */
  const attendance =
    isEvent && campaign.seatsTotal !== undefined && seatsLeft !== null
      ? `${campaign.seatsTotal - seatsLeft}/${campaign.seatsTotal}`
      : undefined;

  /**
   * The chip. "เต็มแล้ว" once the seats are gone, otherwise the default.
   *
   * It always renders and its three labels are all about registration, so a
   * promotion gets "ยังไม่ลงทะเบียน" — which it has nothing to register for.
   * That is the card's wording, not a choice made here.
   */
  const tagStatus: CardTagStatus = seatsLeft === 0 ? "full" : "not-registered";

  /** The second fact on the date row, so its divider isn't left orphaned. */
  const secondary = isEvent
    ? campaign.format
      ? FORMAT_LABEL[campaign.format]
      : ""
    : campaign.products.map((p) => PRODUCT_LABEL[p]).join(" · ");

  return (
    <Link
      href={`/promotions/${campaign.id}`}
      // `group` so the hover is owned by the whole card rather than by
      // whichever part of it the pointer happens to be over.
      className="group relative block rounded-[8px] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary-action)]"
    >
      <Card
        variant="event"
        // `locked` defaults to *true* and stamps a padlock over the banner.
        locked={false}
        image={campaign.cover}
        title={campaign.title}
        date={campaignDateLine(campaign)}
        time={secondary}
        location={campaign.venue ?? ""}
        showLocation={isEvent && Boolean(campaign.venue)}
        showAudience={attendance !== undefined}
        count={attendance}
        tagStatus={tagStatus}
        className={[
          // Fills the grid cell, so a row of cards ends level.
          "h-full",
          // Title on one line, truncated. The card clamps it to two, so the
          // date row moved up or down with the title's length; `!` for the
          // same unlayered-stylesheet reason as the hover tint below.
          "[&_p.line-clamp-2]:line-clamp-1!",
          /**
           * The body greys off under the pointer. White at rest.
           *
           * Aimed at the card's content block — its last child; the first is
           * the banner, which is an image and wants no tint.
           *
           * `gray-50`, and the shade is not free choice: `gray-100` is what the
           * design system fills the "ยังไม่ลงทะเบียน" chip with, so hovering
           * would paint the surface the chip's own colour and flatten it into
           * plain text for as long as the pointer stayed — a glitch, not a
           * hover. `gray-50` leaves the chip a shade darker than the card, so
           * it keeps its pill.
           *
           * `!` because the block carries the system's own `bg-card`, which
           * ships unlayered and beats an `@layer utilities` rule whatever its
           * specificity — without it the card simply stays white.
           */
          "[&>div:last-child]:transition-colors [&>div:last-child]:duration-200",
          "group-hover:[&>div:last-child]:bg-[var(--fill-gray-50)]!",
          // The cover, and only the cover, responds to the pointer: no lift,
          // no shadow change. The banner is clipped by the card, so the image
          // grows into its frame rather than past it.
          "[&_img]:transition-transform [&_img]:duration-500 [&_img]:ease-out",
          "group-hover:[&_img]:scale-[1.06]",
        ].join(" ")}
      />
      {/* Over the cover rather than in the body: the card has no slot for a
          second tag, and the corner is where a glance lands first. */}
      {isNew && (
        <span className="pointer-events-none absolute left-3 top-3 z-10">
          <Tag text="ใหม่" variant="red" size="large" />
        </span>
      )}
    </Link>
  );
}
