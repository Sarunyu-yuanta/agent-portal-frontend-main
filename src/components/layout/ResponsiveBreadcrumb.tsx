"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Breadcrumb } from "@sarunyu/system-one";
import { crumbVariants, type Crumb } from "@/app/[lang]/(dashboard)/page-breadcrumbs";
import { cn } from "@/lib/utils";
import { useLocale } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

/**
 * A breadcrumb that fits the width it actually has.
 *
 * Two stages, because they solve different problems:
 *
 * 1. **Shape** — whether the middle rungs collapse to `…` is measured, not
 *    guessed: a character count says nothing about how wide a Thai label is.
 *    Each candidate shape is laid out off-screen at `w-max` (its natural width)
 *    and the richest one that fits is rendered. Re-measured on resize, so
 *    rotation and collapsing the sidebar are covered.
 * 2. **Labels** — the rendered nav then fills its box and lets the labels
 *    themselves shrink with an ellipsis (`.breadcrumb-fit`). So a phone narrows
 *    the text rather than dropping rungs, and the section, the path and the
 *    current page all stay on screen.
 */
export function ResponsiveBreadcrumb({ items, className }: { items: Crumb[]; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const probeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [level, setLevel] = useState(0);

  // Crumbs are built from unprefixed paths (so the trail stays the same in
  // both languages); the design system renders plain anchors, so the prefix
  // goes on here, at the last moment.
  const locale = useLocale();
  const variants = useMemo(
    () =>
      crumbVariants(items).map((variant) =>
        variant.map((c) => (c.href ? { ...c, href: localizePath(c.href, locale) } : c)),
      ),
    [items, locale],
  );

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const measure = () => {
      const available = box.clientWidth;
      if (!available) return;
      const fits = variants.findIndex(
        (_, i) => (probeRefs.current[i]?.scrollWidth ?? 0) <= available,
      );
      // Nothing fits at its natural width — take the shortest shape and let the
      // labels ellipsize into whatever room is left.
      setLevel(fits === -1 ? variants.length - 1 : fits);
    };

    // Fires once on observe, so this covers the initial layout too.
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    return () => observer.disconnect();
  }, [variants]);

  return (
    <div
      ref={boxRef}
      // `w-full` so the measured width is the space available, not the width of
      // whichever variant is currently rendered — otherwise shortening the
      // breadcrumb shrinks the box that decides how short it needs to be.
      className={cn("relative w-full min-w-0", className)}
    >
      {/* Off-screen copies, one per variant, purely to be measured. `h-0` keeps
          them out of layout; they are never announced or focusable. */}
      <div
        aria-hidden
        className="pointer-events-none invisible absolute top-0 left-0 h-0 overflow-hidden"
      >
        {variants.map((variant, i) => (
          <div
            key={i}
            ref={(el) => {
              probeRefs.current[i] = el;
            }}
          >
            <Breadcrumb items={variant} className="w-max" />
          </div>
        ))}
      </div>

      <Breadcrumb items={variants[level] ?? items} className="breadcrumb-fit w-full min-w-0" />
    </div>
  );
}
