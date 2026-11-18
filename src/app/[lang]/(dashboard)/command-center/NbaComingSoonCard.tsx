"use client";

import { Card } from "@sarunyu/system-one";
import { SparkleIcon } from "@phosphor-icons/react";
import { CardHeader } from "./CardHeader";
import { NbaPanel } from "./NbaPanel";
import { NBA_ROW_LIMIT, type NbaRow } from "./dashboard-data";

/** Blurred rows behind the Coming Soon panel — enough to read the shape. */
const COMING_SOON_PREVIEW_LIMIT = 4;

/** Fixed band the overlay sits over; tall rows are clipped, not counted. */
const COMING_SOON_BAND_CLASS = "relative min-h-[300px] max-h-[400px] overflow-hidden";

/**
 * "AI Next Best Actions", held behind a blur until the feature is live.
 *
 * One definition rather than one per surface. The Dashboard shows it across the
 * whole book; a client's Overview shows the same card scoped to that client,
 * and the only thing that differs between them is the sentence on the panel —
 * so that is the only thing this takes as a prop.
 *
 * Held behind a blur rather than replaced by a placeholder: the rows are real
 * enough to show the shape of the thing — a client, a reason, a drafted message
 * — and a reader who can see that shape understands the promise in a way an
 * empty card never conveys. Legible as layout, unreadable as content, which is
 * the honest position for something that is not live yet.
 */
export function NbaComingSoonCard({
  rows,
  message,
  onDismiss,
  paired = false,
}: {
  rows: NbaRow[];
  /** What the feature will do, in the voice of the surface it sits on. */
  message: string;
  /**
   * Only meaningful once the blur lifts — the layer below is
   * `pointer-events-none`, so no dismiss button on it can ever be clicked.
   * Optional so a surface that has nowhere to store dismissals can leave it
   * out rather than invent one.
   */
  onDismiss?: (id: string) => void;
  /** Beside Proactive Compliance Alerts — stretch to the row height and clip
   *  the blur rather than letting tall rows set it. */
  paired?: boolean;
}) {
  return (
    <Card
      variant="default"
      className={`gap-4 ${paired ? "flex h-full flex-col" : ""}`}
    >
      {/* No count while the card is held behind the blur — a number promises
          rows you can read, and these are a preview of a shape, not things
          waiting to be done. */}
      <CardHeader title="AI Next Best Actions" />
      <div className={paired ? "relative min-h-0 flex-1" : COMING_SOON_BAND_CLASS}>
        {/* `aria-hidden` and `pointer-events-none` because it is decoration: a
            screen reader should not read out suggestions nobody can act on, and
            Tab should not stop on their buttons.

            With no rows there is nothing worth blurring — a blurred empty state
            is a smudge, not a preview — so the card just holds enough height
            for the panel to sit in. */}
        {rows.length > 0 ? (
          <div
            aria-hidden
            className={`pointer-events-none select-none blur-[3px] ${
              paired ? "absolute inset-0 overflow-hidden" : ""
            }`}
          >
            <NbaPanel
              rows={rows}
              limit={paired ? NBA_ROW_LIMIT : COMING_SOON_PREVIEW_LIMIT}
              onDismiss={onDismiss ?? (() => {})}
            />
          </div>
        ) : (
          <div aria-hidden className={paired ? "absolute inset-0" : undefined} />
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/40 p-4">
          {/* The message sits on a solid panel of its own. Laid straight over
              the blur it was two soft greys on top of each other — legible in
              isolation, washed out in place. The card title above already names
              the feature, so this says what it will do rather than repeating
              it. */}
          <div className="flex max-w-[400px] flex-col items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 text-center shadow-[0px_4px_16px_rgba(0,0,0,0.06)]">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary-action-light">
              <SparkleIcon size={18} weight="fill" className="text-primary-action" />
            </span>
            <p className="type-body-2 leading-relaxed text-muted-foreground">
              {message}
            </p>
            <p className="text-meta font-semibold uppercase tracking-widest text-primary-action">
              Coming Soon
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

/** The Dashboard's framing: the whole book, read first thing in the morning. */
export const NBA_MESSAGE_BOOK =
  "ทุกเช้า AI จะบอกว่าวันนี้ควรดูแลลูกค้ารายไหนก่อน ด้วยเรื่องอะไร และเพราะอะไร";

/** A single client's profile, where "which client first" is already answered. */
export const NBA_MESSAGE_CLIENT =
  "AI จะแนะนำว่าควรคุยเรื่องอะไรกับลูกค้ารายนี้ต่อ เพราะอะไร พร้อมร่างข้อความให้";
