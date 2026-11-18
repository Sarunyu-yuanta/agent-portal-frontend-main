"use client";

import { AvatarStack } from "@sarunyu/system-one";
import { getInitial } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";

type StackSize = "small" | "medium" | "large";

/**
 * The ink `Avatar` uses for its text type — the one thing the "+N" slot can't
 * get from the component itself, since it renders no glyph when `initials` is
 * empty.
 *
 * A copied value, not a reference: the design system holds it as a JS constant
 * (`TEXT_COLOR`) inside its bundle rather than a CSS variable, so there is
 * nothing to point at.
 */
const AVATAR_TEXT_COLOR = "#00A2D9";

/**
 * Per size: the circle's diameter (mirrors the DS `STACK_CONFIG`) and a font
 * size for the count. The count needs its own scale because the avatar's is
 * picked for a single glyph — "+12" at that size overflows the circle.
 */
const SLOT: Record<StackSize, { box: string; text: string }> = {
  small: { box: "size-4", text: "text-micro" },
  medium: { box: "size-5", text: "text-micro" },
  large: { box: "size-6", text: "text-meta" },
};

/**
 * A row of client avatars that folds its overflow into a "+N" circle.
 *
 * The overflow circle is a real `AvatarStack` item — a text avatar with no
 * glyph — so the component gives it the same diameter, gradient, overlap and
 * bite-mask as every face, and the count is laid over that slot rather than a
 * second circle being drawn by hand.
 */
export function ClientAvatarStack({
  names,
  slots = 4,
  size = "large",
}: {
  /** Display names, already resolved (and already masked, where privacy applies). */
  names: string[];
  /** Total circles shown. Beyond this the last one becomes the "+N". */
  slots?: number;
  size?: StackSize;
}) {
  const t = useT();
  if (names.length === 0) return null;

  const faces = names.length > slots ? names.slice(0, slots - 1) : names;
  const hidden = names.length - faces.length;
  const { box, text } = SLOT[size];

  return (
    <span className="relative inline-flex" title={names.join(", ")}>
      <AvatarStack
        items={[
          ...faces.map((name) => ({
            type: "text" as const,
            initials: getInitial(name),
            alt: name,
          })),
          ...(hidden > 0 ? [{ type: "text" as const, initials: "" }] : []),
        ]}
        size={size}
        max={slots}
      />
      {hidden > 0 && (
        /*
         * Pinned to `right-0`, which needs no offset arithmetic: the overflow
         * slot is the last item, so it is already flush with the stack's right
         * edge whatever the count.
         *
         * `z-10` is load-bearing. `AvatarStack` gives each item an explicit
         * `zIndex` (4,3,2,1 at four items), and an absolute element at
         * `z-index: auto` loses to any sibling with a z-index of 1 or more — so
         * the overflow circle painted over the count and the slot came out
         * blank. The wrapper is `relative` with `z-index: auto`, which is not a
         * stacking context, so these compete directly and 10 clears the stack.
         */
        <span
          role="img"
          aria-label={t.shell.avatarStack.more(hidden)}
          className={`pointer-events-none absolute right-0 top-0 z-10 flex ${box} ${text} select-none items-center justify-center font-bold leading-none`}
          style={{ color: AVATAR_TEXT_COLOR }}
        >
          +{hidden}
        </span>
      )}
    </span>
  );
}
