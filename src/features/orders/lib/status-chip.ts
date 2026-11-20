import { CheckCircleIcon, ClockIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { RequirementStatus } from "@/types/order";

/**
 * How each status reads: a tinted chip with an icon, not a text box.
 *
 * These fields were boxes once, which was wrong twice over. A bordered box the
 * height of an input invites a click and a keystroke, and none of them takes
 * one — only Notional Amount does. And a box can only say "wrong" by turning
 * its outline red, which leaves "right" saying nothing at all: the IC had to
 * read four values to work out that three were fine.
 *
 * A chip answers "มีแล้วหรือยัง" before the value is read. Green is on file,
 * red is not, and the two states that are neither get their own colour rather
 * than being rounded towards one of them — amber for *waiting on an approver*
 * (the client has already acted; chasing them would be chasing the wrong
 * person) and orange for *expired* (it was on file, which is a different
 * conversation from never having had it).
 */
export const STATUS_CHIP: Record<
  RequirementStatus,
  { icon: typeof CheckCircleIcon; bg: string; fg: string }
> = {
  passed: {
    icon: CheckCircleIcon,
    bg: "bg-[var(--fill-green-100)]",
    fg: "text-[var(--fill-green-600)]",
  },
  pending: {
    icon: ClockIcon,
    bg: "bg-[var(--fill-yellow-100)]",
    fg: "text-[var(--fill-yellow-600)]",
  },
  expired: {
    icon: WarningCircleIcon,
    bg: "bg-[var(--fill-orange-100)]",
    fg: "text-[var(--fill-orange-600)]",
  },
  missing: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
  failed: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
};
