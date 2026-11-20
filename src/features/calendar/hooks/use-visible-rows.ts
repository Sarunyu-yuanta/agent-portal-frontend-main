"use client";

import { useEffect, useRef, useState } from "react";

/** Rows assumed before the stack has been measured — server render and the
 * first client paint, where there is no layout to read yet. Three is what the
 * old fixed-height cell fit, so the common desktop case lands on its final
 * number immediately and nothing visibly reflows. */
const ASSUMED_ROWS = 3;

/** `gap-1` on the pill stack, in px — part of what one row costs, so this and
 * the class have to move together or the fit calculation drifts. */
const ROW_GAP = 4;

/** Only used until the first pill can be measured. */
const FALLBACK_ROW_HEIGHT = 20;

/**
 * How many pills a day cell's stack can show, measured rather than assumed.
 *
 * Cells divide whatever height the viewport leaves, so a short window gets two
 * rows where a tall one gets six. A fixed count either clips mid-pill on a
 * laptop or wastes space on a monitor.
 *
 * Shared by both month grids in the app — `DayCell` on the Calendar page and the
 * Company Events cell on a stock — so the two stay one widget rather than
 * drifting into two dialects of the same overflow rule.
 *
 * @returns the ref to put on the stack element, and the row count it fits.
 */
export function useVisibleRows(): {
  stackRef: React.RefObject<HTMLDivElement | null>;
  rows: number;
} {
  const stackRef = useRef<HTMLDivElement>(null);
  const rowHeightRef = useRef(FALLBACK_ROW_HEIGHT);
  const [rows, setRows] = useState(ASSUMED_ROWS);

  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    const measure = () => {
      // Read the real pill height rather than hard-coding one — it follows
      // `type-caption`, so a type-scale change stays correct here for free.
      const first = el.firstElementChild as HTMLElement | null;
      if (first?.offsetHeight) rowHeightRef.current = first.offsetHeight;
      const perRow = rowHeightRef.current + ROW_GAP;
      // The last row needs no trailing gap, hence the `+ ROW_GAP` on the height.
      setRows(Math.max(0, Math.floor((el.clientHeight + ROW_GAP) / perRow)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
    // The stack element is stable for the cell's lifetime; resizes come from the
    // observer, so this never needs to re-subscribe.
  }, []);

  return { stackRef, rows };
}
