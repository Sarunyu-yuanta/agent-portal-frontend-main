"use client";

import Link from "next/link";

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
      {count !== undefined && count > 0 && (
        <span className="text-[13px] font-semibold tabular-nums text-[var(--text-default-placeholder)]">
          {count}
        </span>
      )}
      <span className="flex-1" />
      {action}
      {link && (
        <Link
          href={link.href}
          className="shrink-0 text-[12px] font-medium text-muted-foreground no-underline transition-colors hover:text-primary-action hover:underline"
        >
          {link.label}
        </Link>
      )}
    </div>
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
  children,
}: {
  /** Tailwind background + text classes off the `--fill-*` ramp. */
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone}`}
    >
      {children}
    </span>
  );
}
