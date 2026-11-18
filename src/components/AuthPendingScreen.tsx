"use client";

import { useT } from "@/i18n/I18nProvider";

/**
 * Full-bleed brand splash covering the auth screens while a sign-in attempt is
 * in flight (Figma `Desktop - 1`, node `30:66`). The gradient angle/stops come
 * straight from the design.
 *
 * Two deliberate departures from the node: the lockup renders at 320px rather
 * than the designed 423px, and it breathes (see `--animate-breathe` in
 * `globals.css`) so the screen reads as working rather than as a static brand
 * card. The animation lives on the lockup instead of a separate spinner so
 * nothing displaces the design's dead-centre placement.
 *
 * It overlays rather than replaces the form so the credentials the user typed
 * survive a navigation that never lands, and it fades in at the same 200ms as
 * `FadeIn` so an instant client-side push doesn't strobe the screen blue.
 */
export function AuthPendingScreen({ label }: { label?: string }) {
  const t = useT();
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200"
      style={{
        backgroundImage: "linear-gradient(125.89deg, #015AC0 0%, #019BE5 100.6%)",
      }}
    >
      {/* Height follows the asset's intrinsic 423:109 ratio, so the widths
          below are the only numbers to touch when resizing the lockup. 320px
          is the designed size; phones get a narrower one so the wordmark
          doesn't run edge to edge. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-ratio brand lockup, no responsive sources needed */}
      <img
        src="/brand/logo-ic-portal-white.svg"
        alt=""
        width={423}
        height={109}
        className="w-[220px] sm:w-[320px] max-w-[calc(var(--vw)*100-3rem)] animate-breathe motion-reduce:animate-none"
      />

      <span className="sr-only">{label ?? t.auth.signingIn}</span>
    </div>
  );
}
