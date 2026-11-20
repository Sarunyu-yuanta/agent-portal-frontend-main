"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Tracks whether `main` has scrolled past a threshold. Same enter/exit +
 * lock-window pattern as the Full Profile header's `scrolled` state: separate
 * enter/exit points prevent flip-flopping at the boundary, and the lock
 * window (longer than the CSS transition it drives) stops a re-trigger from
 * firing mid-animation — together they're what keeps this jitter-free.
 */
export function useScrollThreshold(enter = 120, exit = 32, lockMs = 400) {
  const [passed, setPassed] = useState(false);
  const passedRef = useRef(false);
  const lockUntilRef = useRef(0);

  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    // `main` is part of the persistent dashboard layout, so it keeps whatever
    // scrollTop the previous page left it at — reset on mount so a fresh page
    // visit always starts expanded instead of inheriting a "scrolled" state.
    main.scrollTop = 0;
    passedRef.current = false;
    const onScroll = () => {
      const now = Date.now();
      if (now < lockUntilRef.current) return; // ignore events during transition
      const top = main.scrollTop;
      if (!passedRef.current && top > enter) {
        passedRef.current = true;
        lockUntilRef.current = now + lockMs;
        setPassed(true);
      } else if (passedRef.current && top <= exit) {
        passedRef.current = false;
        lockUntilRef.current = now + lockMs;
        setPassed(false);
      }
    };
    onScroll();
    main.addEventListener("scroll", onScroll, { passive: true });
    return () => main.removeEventListener("scroll", onScroll);
  }, [enter, exit, lockMs]);

  return passed;
}
