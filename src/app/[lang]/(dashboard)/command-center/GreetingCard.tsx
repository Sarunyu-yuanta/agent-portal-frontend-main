"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Card } from "@sarunyu/system-one";
import { formatDate } from "@/i18n/format";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { skyVars } from "./time-of-day-sky";

/** Re-read the clock once a minute. The sky moves by a hair per minute, so
 *  this is what makes the fade actually happen on a tab left open — and it is
 *  cheap: the snapshot is a plain number, so React skips the render whenever
 *  the minute hasn't changed. */
function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 30_000);
  return () => window.clearInterval(id);
}

const getMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

/** `null` on the server and during hydration: the hour there is the server's,
 *  not the reader's, and a mismatch would paint the wrong sky for a frame. The
 *  card falls back to its plain brand look until the client has a real time. */
const getServerMinutes = () => null;

/**
 * The dashboard's hello — its sky follows the clock.
 *
 * Purely cosmetic. Rather than switching between four looks, the card slides
 * from one sky gradient to the next (see `time-of-day-sky`): the glow travels
 * from sunrise low on the left, up over the card at midday, down to the right
 * at dusk, and gives way to a moon; the colours move in the hours either side
 * of each change instead of flipping at it.
 *
 * The colours go on a wrapper as custom properties and `globals.css`
 * (`.greeting-card--live`) reads them, because `system-one`'s `Card` takes a
 * `className` and nothing else — no `style` — so inheritance is the only way a
 * computed value reaches it.
 *
 * `minutes` pins the time for previewing (`?tod=` on the dashboard); omit it
 * for the reader's own clock.
 */
export function GreetingCard({
  name,
  today,
  minutes: override,
}: {
  name: string;
  today: Date;
  minutes?: number | null;
}) {
  const locale = useLocale();
  const t = useT();
  const live = useSyncExternalStore(subscribe, getMinutes, getServerMinutes);
  const minutes = override ?? live;
  const vars = useMemo(() => (minutes === null ? undefined : skyVars(minutes)), [minutes]);
  return (
    <div style={vars} className="flex h-full min-h-0 flex-1 flex-col">
    <Card
      variant="default"
      className={`greeting-card${vars ? " greeting-card--live" : ""} relative isolate flex h-full min-h-0 flex-1 flex-col justify-center gap-1 overflow-hidden bg-primary-action-light border-border`}
    >
      {/* The Yuanta mark as a watermark: far larger than the card and pushed
          off its right edge, so only part of it shows and it reads as texture
          rather than a logo. Painted as a mask over a flat colour instead of an
          <img>, so it takes the period's accent rather than the SVG's own blue;
          the gradient mask on the wrapper fades it out toward the greeting so
          text never sits on the mark's busiest part. Decorative — hidden from
          AT and inert to the pointer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-2/3 [mask-image:linear-gradient(to_right,transparent,black_55%)]"
      >
        <div
          className="greeting-card__mark absolute -right-4 top-1/2 size-32 -translate-y-1/2 rotate-[-12deg] sm:-right-6 sm:size-36 xl:-right-8 xl:size-40"
          style={{
            maskImage: "url(/brand/logo-yuanta.svg)",
            WebkitMaskImage: "url(/brand/logo-yuanta.svg)",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      </div>
      <h2 className="greeting-card__title type-h5 font-bold text-primary-action">
        {t.commandCenter.greeting(name)}
      </h2>
      <p
        className="greeting-card__date truncate text-label text-primary-action/70"
        title={formatDate(locale, today, "weekdayLong")}
      >
        {formatDate(locale, today, "weekdayLongMonthShort")}
      </p>
    </Card>
    </div>
  );
}
