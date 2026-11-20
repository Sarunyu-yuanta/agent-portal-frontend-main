"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hover-and-click popover state with click-outside dismissal.
 *
 * Spread `hoverProps` onto the trigger wrapper and attach `ref` to the same
 * element; a short close delay lets the pointer travel into the popover.
 *
 * @param dismissOnOutsideClick Turn off when the same `open` flag also drives a
 *   surface that renders in a portal — a drawer, sheet or dialog. "Outside" is
 *   measured against `ref`, the trigger wrapper, and portalled content is
 *   outside it by construction: every tap inside such a surface would read as a
 *   tap out and close it. Those surfaces come with their own dismissal
 *   (backdrop, drag handle, Escape) via `onOpenChange`, so nothing is lost.
 */
export function usePopover({
  dismissOnOutsideClick = true,
}: { dismissOnOutsideClick?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!open || !dismissOnOutsideClick) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, dismissOnOutsideClick]);

  return {
    open,
    setOpen,
    ref,
    hoverProps: {
      onMouseEnter: () => {
        clearTimeout(timer.current);
        setOpen(true);
      },
      onMouseLeave: () => {
        timer.current = setTimeout(() => setOpen(false), 120);
      },
    },
  };
}
