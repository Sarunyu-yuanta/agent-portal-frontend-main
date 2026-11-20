"use client";

import { LocaleLink as Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * A `<Link>` wearing `Button`'s clothes.
 *
 * `Button` from `@sarunyu/system-one` is a plain `<button>` with no `asChild`
 * or `render` escape hatch, so an action that *navigates* has to choose between
 * the design system's look and the browser's behaviour — a `<button>` calling
 * `router.push` costs middle-click, ⌘-click and "open in new tab", and an
 * `<a>` styled by hand drifts from the real buttons beside it.
 *
 * The Dashboard cards hit this first and answered it with two hand-rolled
 * constants (`CARD_LINK_CLASS` and `CARD_BUTTON_CLASS` in
 * `dashboard/CardHeader`). This is the same answer generalised, for surfaces
 * that need more than those two shapes; those constants stay where they are
 * because the pixels they produce are already shipped.
 *
 * The class strings below are lifted from `Button`'s own `getVariantClasses`
 * and size maps. **If the design system's button changes, these follow it.**
 */

const BASE =
  "inline-flex select-none items-center justify-center gap-0.5 whitespace-nowrap font-medium no-underline transition-colors duration-150 cursor-pointer";

const SIZE = {
  sm: "h-[28px] rounded-md px-2 text-sm leading-[24px]",
  md: "h-8 rounded-md px-2.5 text-sm leading-[24px]",
  lg: "h-9 rounded-lg px-3.5 text-sm leading-[24px]",
} as const;

const VARIANT = {
  primary:
    "bg-primary-action text-on-primary-action border border-transparent hover:bg-primary-action-hover active:bg-primary-action-active",
  outline:
    "bg-background text-primary-action border border-border hover:bg-hover-bg active:bg-disabled-bg",
  plain:
    "bg-transparent text-primary-action border border-transparent hover:bg-hover-bg active:bg-disabled-bg",
  "outline-black": "bg-background text-foreground border border-border hover:bg-hover-bg",
} as const;

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  className,
  children,
  ...props
}: {
  href: string;
  variant?: keyof typeof VARIANT;
  size?: keyof typeof SIZE;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ComponentProps<typeof Link>, "href" | "className" | "children">) {
  return (
    <Link href={href} className={cn(BASE, SIZE[size], VARIANT[variant], className)} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </Link>
  );
}
