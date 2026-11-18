"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Avatar, BottomSheet } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  ChatCircleIcon,
  ChatCircleTextIcon,
  CheckIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  PhoneIcon,
  XIcon,
} from "@phosphor-icons/react";
import { getInitial } from "@/lib/client-utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getClientProfile } from "@/data/client-profiles";

/** How long the tick stays after a copy. Long enough to be seen if you glanced
 * away, short enough that the row is back to normal before you need it again. */
const COPIED_MS = 1600;

/**
 * A client's ways of being reached, as a row of pills.
 *
 * The other shape contact details take in this app — {@link ContactFields} is
 * the stacked, copy-on-click list for a panel with a column to fill, this is
 * the single line for a header that has width but no height to spare.
 *
 * Lifted out of Client 360's page, where it was three near-identical five-line
 * spans written inline, and where a second copy of the markup was about to be
 * pasted into the risk panel. The sizes, the radii and the icon bubble now have
 * one definition — and since two features' headers are drawn from it, the thing
 * it must never become again is a copy.
 *
 * Plain `<span>`s, not `tel:`/`mailto:` links: an RM copies these into a phone
 * or a CRM rather than dialling from a desktop, and an anchor hijacks the drag
 * as a link-drag so the text cannot be selected. The icon bubble is
 * `select-none` so a selection across the pill yields the value alone.
 */
export function ContactChips({
  clientId,
  className,
  scrollerRef,
}: {
  clientId: string;
  /** For the scroller itself — Client 360 bleeds it past the card's padding. */
  className?: string;
  /** Client 360 forces this to `scrollLeft = 0` on mount: with scroll-snap and
   *  a negative-margin bleed, some browsers land on a non-zero offset on first
   *  paint. Nothing else needs it. */
  scrollerRef?: React.Ref<HTMLDivElement>;
}) {
  const profile = getClientProfile(clientId);

  /** Only `lineId` is optional on the profile; phone and email are always on
   *  file. A channel the client has not given is dropped rather than shown as
   *  empty — every pill here is something to copy, and one holding nothing to
   *  copy is only in the way. */
  const chips: { key: string; icon: ReactNode; value: string | null }[] = [
    {
      key: "phone",
      icon: <PhoneIcon size={13} className="text-muted-foreground" />,
      value: profile.phone,
    },
    {
      key: "email",
      icon: <EnvelopeSimpleIcon size={13} className="text-muted-foreground" />,
      value: profile.email,
    },
    {
      key: "line",
      icon: <ChatCircleIcon size={13} className="text-muted-foreground" />,
      value: profile.lineId ?? null,
    },
  ].filter((chip) => chip.value !== null);

  return (
    <div
      ref={scrollerRef}
      className={`flex items-center gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
    >
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1.5 pl-1.5 pr-3 py-1 rounded-full bg-muted/70 text-foreground shrink-0 whitespace-nowrap snap-start"
        >
          <span className="flex items-center justify-center size-6 rounded-full bg-card shadow-sm shrink-0 select-none">
            {chip.icon}
          </span>
          <span className="type-caption font-medium select-text cursor-text">
            {chip.value}
          </span>
        </span>
      ))}
    </div>
  );
}

/**
 * One contact line with the thing you actually came for: its value on the
 * clipboard.
 *
 * The whole row copies, not just the icon. A phone number is a 130px target and
 * the icon beside it is 28px; making only the small one work would be asking for
 * precision the task doesn't need. The icon stays because it is what tells you
 * the row is copyable at all.
 */
function CopyField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clearing on unmount matters here: the panel this lives in is dismissed by
  // the row above it, so a pending timer would fire into a gone component.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Clipboard access is refused on an insecure origin and by some embedded
      // webviews. Nothing was copied, so nothing should claim it was.
      return;
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <button
      type="button"
      onClick={copy}
      // `aria-live` on the label so a screen reader hears the confirmation; the
      // tick alone says nothing to one.
      // Hover moved off `--bg-default-secondary`: that is the card's own fill
      // now, so hovering to it would be no change at all.
      className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer hover:bg-[var(--fill-p1-100)]!"
    >
      {/* White for the same reason — a grey disc on a grey card is a disc you
          cannot see. */}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-muted-foreground">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="type-caption text-muted-foreground">{label}</span>
        <span className="type-body-2 text-foreground truncate">{value}</span>
      </span>
      <span
        aria-live="polite"
        className={`flex shrink-0 items-center gap-1 type-caption transition-colors ${
          copied ? "text-[var(--text-success-primary)]" : "text-muted-foreground"
        }`}
      >
        {copied ? <CheckIcon size={14} weight="bold" /> : <CopyIcon size={14} />}
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}

/**
 * The ways to reach one person, as a boxed list of copyable rows.
 *
 * Inset in a rounded card rather than running to its container's edges.
 * Full-bleed rows read as a continuation of the panel; boxed, they read as one
 * thing — the ways to reach this person — which is what they are.
 *
 * A soft fill with rules inside it rather than an outline, matching every other
 * list in this app. `overflow-hidden` is what rounds the first and last row's
 * hover along with the card.
 *
 * Its own export because the Call Log's record carries this block too: after
 * reading what was said on a call, the next thing wanted is a way to ring back.
 * One definition rather than two, so the contact rows a KYC row opens and the
 * ones under a call summary cannot drift apart.
 */
export function ContactFields({ clientId }: { clientId: string }) {
  const profile = getClientProfile(clientId);

  return (
    <div className="flex flex-col divide-y divide-black/[0.05] overflow-hidden rounded-xl bg-[var(--bg-default-secondary)]">
      <CopyField
        icon={<PhoneIcon size={14} weight="fill" />}
        label="Phone"
        value={profile.phone}
      />
      <CopyField
        icon={<EnvelopeSimpleIcon size={14} weight="fill" />}
        label="Email"
        value={profile.email}
      />
      {/* Optional on the profile type, so it only appears for a client who has
          one rather than showing an empty row. */}
      {profile.lineId && (
        <CopyField
          icon={<ChatCircleTextIcon size={14} weight="fill" />}
          label="LINE ID"
          value={profile.lineId}
        />
      )}
    </div>
  );
}

/**
 * A holder's contact details, shown in place of the alert rather than instead of
 * the page.
 *
 * Tapping a name used to leave for the client's profile, which is a lot of
 * context to lose for the one thing an alert like "notify holders" actually
 * needs — a number to call or an address to write to. This is that, one step
 * away and one step back, with the profile still a button away for when the
 * question turns out to be bigger.
 */
export function HolderContact({
  clientId,
  name,
  onBack,
  onClose,
  variant = "modal",
}: {
  clientId: string;
  /** Already masked by the caller if privacy mode is on. */
  name: string;
  /** Omit where this pane is the whole panel rather than the second step of a
   *  sliding track — a back arrow with nothing behind it is a dead control. */
  onBack?: () => void;
  onClose: () => void;
  variant?: "modal" | "sheet";
}) {
  const isSheet = variant === "sheet";

  return (
    <div className="flex w-full flex-col">
      <header
        className={`flex shrink-0 items-center gap-2 px-3 pb-3 ${isSheet ? "pt-2" : "pt-3"}`}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to the alert"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
          >
            <ArrowLeftIcon size={16} />
          </button>
        )}
        <Avatar type="text" initials={getInitial(name)} size="s" />
        <p className="min-w-0 flex-1 truncate type-body-1 font-bold! text-foreground">{name}</p>
        {!isSheet && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
          >
            <XIcon size={16} />
          </button>
        )}
      </header>

      {/* `max-h` rather than `flex-1`: this pane sits in a sliding track whose
          height is measured and animated (see `AlertDetail`), and a pane that
          stretches to fill has no height of its own to measure. Three contact
          rows never reach the cap anyway — it is only there so a future source
          with a dozen fields still can't run off the screen. */}
      <div className="max-h-[calc(var(--vh)*40)] overflow-y-auto px-3 pb-1">
        <ContactFields clientId={clientId} />
      </div>

      {/* No rule above the button any more — the card below the header already
          bounds the contact block, and a line here would be a third horizontal
          edge in 60px. Spacing separates it instead. */}
      <div
        className={`shrink-0 px-3 pt-2 ${
          // Clears the home indicator on a gesture-navigation phone, where the
          // last few pixels aren't reliably tappable.
          isSheet ? "pb-[max(1rem,env(safe-area-inset-bottom))]" : "pb-4"
        }`}
      >
        {/* A `Link` styled as a button rather than `Button` wrapping one:
            `Button` has no `asChild`, so nesting an anchor inside it would put
            an `<a>` in a `<button>` — invalid, and the two would fight over the
            click. Middle-click and open-in-new-tab keep working this way too.
            The classes copy what `Button variant="plain"` emits: transparent
            fill, transparent border so nothing shifts on hover, accent label.

            `onClick` closes the panel as it navigates: leaving it mounted over
            the page it just opened is the same overlap the day popover had. */}
        <Link
          href={`/client/${clientId}`}
          onClick={onClose}
          className="flex h-9 w-full items-center justify-center rounded-lg border border-transparent bg-transparent type-body-2 font-medium text-primary-action transition-colors hover:bg-[var(--bg-default-secondary)]!"
        >
          View full profile
        </Link>
      </div>
    </div>
  );
}

/**
 * `HolderContact` as a thing that opens over the page.
 *
 * A sheet from the bottom on a phone, a centred card on a desktop — the same
 * split `AlertOverlay` and `ResponsiveBottomSheetModal` make, and for the same
 * reason: a floating card is fine where there is room around it and wrong where
 * there isn't.
 *
 * Portalled to `document.body` on desktop because the callers put this inside
 * containers that create stacking contexts — the Dashboard's `sticky` rail, the
 * Calendar's scrolling timeline — and a `fixed` descendant cannot climb out of
 * one. Its own export because two surfaces now open the same panel the same
 * way, and the second copy is where they would start to differ.
 */
export function HolderContactOverlay({
  clientId,
  name,
  onClose,
}: {
  clientId: string;
  /** Already masked by the caller if privacy mode is on. */
  name: string;
  onClose: () => void;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <BottomSheet
        open
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        showHeader={false}
        title={name}
        className="px-0 pb-0"
        contentClassName="flex min-h-0 flex-col pt-0"
      >
        <HolderContact clientId={clientId} name={name} onClose={onClose} variant="sheet" />
      </BottomSheet>
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[360px] overflow-hidden rounded-xl bg-card shadow-lg">
        <HolderContact clientId={clientId} name={name} onClose={onClose} />
      </div>
    </div>,
    document.body,
  );
}
