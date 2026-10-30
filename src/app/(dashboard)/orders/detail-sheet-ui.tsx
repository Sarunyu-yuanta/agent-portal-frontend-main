"use client";

/**
 * The receipt vocabulary Order Management's detail sheets are built from — a
 * status disc, a grey panel of label-left / value-right rows, dashed rules
 * between blocks.
 *
 * Two sheets use it: a client's trade (`TransactionDetailModal`) and an IC's
 * booking (`BookingDetailModal`). They describe different things but are read
 * the same way — "what is this, who is it for, what are the particulars" — and
 * the shapes here are what keep them from drifting into two house styles.
 *
 * Keyed on `TagVariant` rather than on either sheet's own status type: both
 * already derive a tag variant for their status (`STATUS_TAG`, `dealStatus`),
 * so the colour follows from what each sheet has already decided.
 */

import { useEffect, useRef, useState } from "react";
import { CaretRightIcon, CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { Avatar, type TagVariant } from "@sarunyu/system-one";
import Link from "next/link";
import { getInitial } from "@/lib/client-utils";

/** How long a copied row claims it copied. */
const COPIED_MS = 1500;

/** The sheet's one surface for grouped facts. No border: the sheet is white. */
export const SHEET_PANEL = "rounded-xl bg-[var(--bg-default-secondary)] px-4 py-3";

/** A receipt's rule — dashed where it separates blocks inside the panel. */
export const SHEET_DASHED = "border-t border-dashed border-[var(--border-default)]";

/**
 * A pressable row's cursor, hover and focus ring. The caller adds its own
 * padding and the negative margin that lets the highlight reach past the
 * panel's padding — a full row pulls on both sides, a value on the right only
 * on one.
 *
 * `cursor-pointer` lives here because a `<button>` does not get one from the
 * browser the way a link does, and every pressable thing on these sheets
 * should feel the same under the mouse whichever element it happens to be.
 *
 * `gray-100`, one step off the `gray-50` panel: `200` read as the row being
 * pressed rather than pointed at, and a row this wide shows even a faint
 * shift.
 */
export const SHEET_PRESSABLE =
  "cursor-pointer rounded-lg transition-colors hover:bg-[var(--fill-gray-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7]";

/**
 * Each tag variant as a disc, a halo and a heading colour.
 *
 * `500` for the disc and `100` for the halo — the one place a status colour is
 * stated at full strength, because the disc carries the verdict on its own
 * before any of the words below it are read. The heading takes the darker
 * `600`/`700` ink: it has no fill behind it to carry the contrast.
 */
export type Tone = TagVariant | "primary";

export const TONE: Record<Tone, { halo: string; disc: string; text: string }> = {
  /**
   * The app's own blue, which is not one of Tag's six.
   *
   * A status that means "someone is working on it" belongs in the colour the
   * product uses for its own actions, not in the generic `blue` of a tag —
   * they are two different blues, and side by side the difference reads as a
   * mistake rather than a distinction.
   */
  primary: {
    halo: "bg-[var(--fill-p1-200)]",
    disc: "bg-primary-action",
    text: "text-primary-action",
  },
  green: {
    halo: "bg-[var(--fill-green-100)]",
    disc: "bg-[var(--fill-green-500)]",
    text: "text-[var(--fill-green-700)]",
  },
  lime: {
    halo: "bg-[var(--fill-lime-100)]",
    disc: "bg-[var(--fill-lime-500)]",
    text: "text-[var(--fill-lime-600)]",
  },
  yellow: {
    halo: "bg-[var(--fill-yellow-100)]",
    disc: "bg-[var(--fill-yellow-500)]",
    text: "text-[var(--fill-yellow-600)]",
  },
  blue: {
    halo: "bg-[var(--fill-blue-100)]",
    disc: "bg-[var(--fill-blue-500)]",
    text: "text-[var(--fill-blue-700)]",
  },
  red: {
    halo: "bg-[var(--fill-red-100)]",
    disc: "bg-[var(--fill-red-500)]",
    text: "text-[var(--fill-red-600)]",
  },
  gray: {
    halo: "bg-[var(--fill-gray-200)]",
    disc: "bg-[var(--fill-gray-400)]",
    text: "text-muted-foreground",
  },
};

/**
 * The status as a disc inside its own halo.
 *
 * Two rings rather than one so the colour reads at this size without the
 * saturated circle having to grow to fill the space — the same shape a payment
 * receipt uses, and the reason the glyph can stay white.
 */
export function StatusDisc({ variant, children }: { variant: Tone; children: React.ReactNode }) {
  const tone = TONE[variant];
  return (
    <span className={`flex size-[72px] items-center justify-center rounded-full ${tone.halo}`}>
      <span
        className={`flex size-14 items-center justify-center rounded-full text-white ${tone.disc}`}
      >
        {children}
      </span>
    </span>
  );
}

/** A titled run of rows. The title is optional — a second block rarely needs one. */
export function SheetBlock({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      {title && <p className="pb-1 text-[13px] font-bold text-foreground">{title}</p>}
      {children}
    </div>
  );
}

/**
 * One label-left / value-right line.
 *
 * `children` takes over the right-hand side for anything that is not a string
 * — a tag, a copy button. `value` covers the other nine rows out of ten.
 */
export function SheetRow({
  label,
  /** A sentence under the label — only ever drawn when there is one. */
  hint,
  value,
  /** Overrides the value's ink, e.g. a side's red or green. */
  valueClassName = "text-foreground",
  children,
}: {
  label: string;
  hint?: string | null;
  value?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      {/* `shrink-0` while the label is one short line, as nine rows in ten
          are — the value is what truncates. A row carrying a hint gives that
          up, since the sentence is the longer of the two. */}
      <span className={`flex flex-col gap-0.5 ${hint ? "min-w-0" : "shrink-0"}`}>
        <span className="text-[12px] text-muted-foreground">{label}</span>
        {hint && <span className="text-[11px] leading-4 text-muted-foreground/80">{hint}</span>}
      </span>
      {children ?? (
        <span className={`truncate text-[13px] font-semibold tabular-nums ${valueClassName}`}>
          {value}
        </span>
      )}
    </div>
  );
}

/**
 * A reference, with itself on the clipboard.
 *
 * Copyable because a reference is the one value on these sheets nobody reads —
 * it gets quoted into a chat or a ticket, and retyping it is where the
 * mistakes come from. The whole value is the target, not just the icon: the
 * icon is 14px, and it is there to say the row *can* be pressed.
 */
export function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The sheet is dismissed from outside this row, so a pending timer would
  // otherwise fire into a gone component.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Refused on an insecure origin and in some embedded webviews. Nothing
      // was copied, so nothing should claim it was.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <SheetRow label={label}>
      <button
        type="button"
        onClick={copy}
        className={`-mr-2 flex min-w-0 items-center gap-1.5 px-2 py-0.5 ${SHEET_PRESSABLE}`}
      >
        {/* `aria-live` on the label: the tick alone says nothing to a screen
            reader. */}
        <span
          aria-live="polite"
          className={`truncate text-[13px] font-semibold tabular-nums ${
            copied ? "text-[var(--fill-green-700)]" : "text-foreground"
          }`}
        >
          {copied ? "คัดลอกแล้ว" : value}
        </span>
        {copied ? (
          <CheckIcon size={14} weight="bold" className="shrink-0 text-[var(--fill-green-700)]" />
        ) : (
          <CopyIcon size={14} className="shrink-0 text-muted-foreground" />
        )}
      </button>
    </SheetRow>
  );
}

/**
 * The client, as the way to their profile.
 *
 * The chevron is what says so: a name in a column of values looks like every
 * other value. Both sheets carry one of these and neither has room for a card.
 */
export function ClientRow({ clientId, name }: { clientId: string; name: string }) {
  return (
    <Link
      href={`/client/${clientId}`}
      className={`-mx-2 flex items-center justify-between gap-3 px-2 py-1.5 no-underline ${SHEET_PRESSABLE}`}
    >
      <span className="shrink-0 text-[12px] text-muted-foreground">ลูกค้า</span>
      <span className="flex min-w-0 items-center gap-2">
        {/* `getInitial`, not the two-letter helpers: the design system's Avatar
            renders one character and drops the rest. */}
        <Avatar type="text" initials={getInitial(name)} size="xs" />
        <span className="truncate text-[13px] font-semibold text-foreground">{name}</span>
        <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
      </span>
    </Link>
  );
}
