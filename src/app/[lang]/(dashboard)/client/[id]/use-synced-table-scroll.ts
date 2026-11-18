"use client";

import { useCallback, useRef, useState, type RefObject } from "react";

/**
 * Split-scroll table pattern: the header and body are two separate
 * horizontally-scrollable elements. Only the body shows a scrollbar; the
 * header's scroll is driven programmatically from the body's `onScroll`.
 *
 * Attach `headerScrollRef` and `bodyScrollRef` to the two containers, and
 * spread `onBodyScroll` on the body's `onScroll`. `isScrolled` flips to `true`
 * as soon as the body scrolls right of zero — use it to toggle the drop
 * shadow on the sticky first column.
 */
export function useSyncedTableScroll(): {
  isScrolled: boolean;
  headerScrollRef: RefObject<HTMLDivElement | null>;
  bodyScrollRef: RefObject<HTMLDivElement | null>;
  onBodyScroll: (e: React.UIEvent<HTMLDivElement>) => void;
} {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);

  const onBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const left = e.currentTarget.scrollLeft;
    if (headerScrollRef.current) headerScrollRef.current.scrollLeft = left;
    setIsScrolled(left > 0);
  }, []);

  return { isScrolled, headerScrollRef, bodyScrollRef, onBodyScroll };
}
