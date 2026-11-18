"use client";

import Link from "next/link";

/**
 * `Button variant="plain" size="sm"`, as classes rather than as a component.
 *
 * Every card's "ดูทั้งหมด" navigates somewhere now, and a `<button>` that calls
 * `router.push` costs middle-click, ⌘-click and "open in new tab" — so these
 * are `<Link>`s. `Button` has no `asChild`, so matching its classes is the only
 * way to have the design system's look and the browser's behaviour at once.
 * Exported because the Reminders and Call Log cards draw their own headings.
 */
export const CARD_LINK_CLASS =
  "inline-flex h-[28px] shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-transparent px-2 text-sm font-medium leading-[24px] text-primary-action no-underline transition-colors duration-150 cursor-pointer hover:bg-hover-bg active:bg-disabled-bg";

/**
 * `Button variant="outline" size="md"`, as classes, for the same reason
 * `CARD_LINK_CLASS` exists — a `<Link>` that has to look like a button.
 *
 * The bordered variant rather than the plain one, for a card's *own* action
 * standing on a line by itself rather than a "ดูทั้งหมด" tucked beside a title.
 * Alone in the white under a calendar, plain reads as a caption someone
 * forgot to style; an outline says it can be pressed.
 *
 * Width is left to the caller: this is the button, not where it sits.
 */
export const CARD_BUTTON_CLASS =
  "inline-flex h-8 select-none items-center justify-center gap-1 whitespace-nowrap rounded-md border border-border bg-background px-3 text-sm font-medium leading-[24px] text-primary-action no-underline transition-colors duration-150 cursor-pointer hover:bg-hover-bg active:bg-disabled-bg";

/**
 * The line every card on this page opens with: a bold title, an optional count,
 * and an optional way out to the section that owns the subject.
 *
 * Deliberately plain. An earlier version put a tinted icon square beside every
 * title, which made four cards look like four buttons and left nothing to
 * distinguish the rows *inside* them — the tint is worth more down there, where
 * it separates a KYC row from a dividend alert at a glance, than up here, where
 * the words already say which card you are looking at. So the heading is type
 * and the colour lives in the content.
 */
export function CardHeader({
  title,
  count,
  link,
  action,
}: {
  title: string;
  /** Shown as a muted figure beside the title. Omitted rather than shown as "0". */
  count?: number;
  link?: { href: string; label: string };
  /** A control that belongs to the card itself, e.g. "clear filter". */
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="type-subtitle-1 font-bold text-foreground">{title}</p>
      {count !== undefined && count > 0 && <CardCount value={count} />}
      <span className="flex-1" />
      {action}
      {link && (
        <Link href={link.href} className={CARD_LINK_CLASS}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

/**
 * How many rows a card is counting, as a pill beside its title.
 *
 * Its own export because three cards on this page draw it and only one of them
 * goes through `CardHeader` — the Call Log and KYC cards render their own
 * headings, which carry a control `CardHeader` has no slot for. A fourth copy
 * of the same six classes is how they would start disagreeing.
 *
 * `rounded-md` rather than a full pill: at two digits a capsule reads as a
 * status chip, and this is a quantity.
 */
export function CardCount({ value }: { value: number }) {
  return (
    <span className="shrink-0 rounded-md bg-[var(--fill-p1-100)] px-1.5 py-0.5 text-label font-semibold tabular-nums text-primary-action">
      {value}
    </span>
  );
}

/**
 * The soft tinted square that marks what a row is about.
 *
 * One shape, one size, one radius, across every list on the page — a KYC row, a
 * dividend alert and an AI suggestion all wear it, and only the hue changes.
 * Rounded square rather than a circle: a circle reads as an avatar, and half
 * these rows already have real client avatars a few pixels away.
 */
export function RowIcon({
  tone,
  style,
  children,
}: {
  /** Tailwind background + text classes off the `--fill-*` ramp. */
  tone: string;
  /** For the rows whose fill can't be a class — a corporate action's colour is
   *  its SET code and that list isn't closed, so it resolves at runtime. See
   *  `calendar/source-badge`. */
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      style={style}
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      {children}
    </span>
  );
}
