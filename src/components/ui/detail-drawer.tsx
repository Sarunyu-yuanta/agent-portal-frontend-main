"use client";

import { Sheet, SheetContent } from "./sheet";
import { cn } from "@/lib/utils";

/** Standard right-side drawer widths used across the dashboard. */
const SIZE_CLASSES = {
  /** Client / product / nine-box detail drawers. */
  wide: "md:w-[calc(var(--vw)*55)] md:max-w-[calc(var(--vw)*55)] lg:w-[calc(var(--vw)*40)] lg:max-w-[calc(var(--vw)*40)] xl:w-[calc(var(--vw)*30)] xl:max-w-[calc(var(--vw)*30)]",
  /** Compact side panels (insight / KYC detail). */
  narrow: "sm:w-[400px] sm:max-w-[400px]",
  /** Slightly wider compact panel (client intelligence). */
  compact: "sm:w-[420px] sm:max-w-[420px]",
} as const;

/**
 * Right-side sliding drawer with the app's standard responsive widths.
 * Non-modal so the page underneath stays interactive, matching existing usage.
 *
 * Content-flow classes (`overflow-*`, `flex`) are intentionally NOT baked in —
 * pass them via `className` so wide detail panels (`overflow-hidden flex
 * flex-col`) and scrolling side panels (`overflow-y-auto`) both stay pixel-exact.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  size = "wide",
  showCloseButton,
  className,
  children,
}: {
  open: boolean;
  /**
   * Base UI's own signature, so callers can reach the second argument — it
   * carries the `reason` for the change, the native event, and a `cancel()` that
   * refuses it. A drawer whose contents open a popover needs that: `Sheet` is
   * Base UI and decides "outside" by DOM containment, while a popover from
   * `@sarunyu/system-one` is Radix and portals to `document.body`, so clicking
   * inside one reads as clicking the page. (Radix inside Radix is fine — that
   * stack checks the React tree. It's the cross-library pairing that breaks.)
   *
   * Handlers that only take `open` still satisfy this.
   */
  onOpenChange: NonNullable<React.ComponentProps<typeof Sheet>["onOpenChange"]>;
  size?: keyof typeof SIZE_CLASSES;
  showCloseButton?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet modal={false} open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={showCloseButton}
        className={cn("w-full p-0", SIZE_CLASSES[size], className)}
      >
        {children}
      </SheetContent>
    </Sheet>
  );
}
