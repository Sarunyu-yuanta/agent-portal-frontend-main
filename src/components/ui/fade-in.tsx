import type { ReactNode } from "react";

/**
 * Cross-fades its content in.
 *
 * Give it a `key` that changes with the content it wraps — active tab, active
 * filter, current route — so React remounts it and the animation replays on
 * every swap instead of only on first mount.
 */
export function FadeIn({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`animate-in duration-200 fade-in ${className}`}>{children}</div>;
}
