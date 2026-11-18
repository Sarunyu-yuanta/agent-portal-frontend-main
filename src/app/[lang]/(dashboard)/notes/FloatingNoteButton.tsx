"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button, Popover } from "@sarunyu/system-one";
import { NotePencilIcon } from "@phosphor-icons/react";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { NOTE_AUTHOR } from "./note-constants";
import {
  NoteComposer,
  draftHasContent,
  emptyDraft,
  type ComposerDraft,
} from "./NoteComposer";

const CLIENT_PAGE = /^\/client\/([^/]+)/;

/**
 * Persistent "New note" button, bottom-right — desktop only (hidden on
 * mobile/tablet, visible on `xl+`, the same cutoff the sidebar uses). On a
 * client's Full Profile the note it creates is filed under that client, so a
 * thought captured while looking at someone lands on them without being asked.
 *
 * Below `xl` there's no room to spare for a second "new note" entry point —
 * the Notes hub already has one in its list header, and every other page's
 * corner is busy with page content rather than the empty margin desktop has.
 *
 * The composer opens as a panel beside the button rather than a dialog over the
 * page: what you were looking at when you thought of the note stays visible
 * while you write it.
 *
 * The draft lives *here*, not in the composer, and that is the whole point. A
 * popover dismisses on any stray click outside, and the composer is unmounted
 * when it does — so a half-written note held inside it would be gone. Holding it
 * at this level means dismissing the panel costs nothing: the button marks that
 * something is unfinished, and reopening picks up mid-sentence. Discarding is
 * then something you choose, in the composer, rather than something a misclick
 * does to you.
 */
export function FloatingNoteButton() {
  const pathname = usePathname();
  const clients = useClients();
  const { addNote } = useNotes();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const clientIdFromPath = CLIENT_PAGE.exec(pathname)?.[1] ?? null;
  const [draft, setDraft] = useState<ComposerDraft>(() => emptyDraft(clientIdFromPath));

  const unfinished = draftHasContent(draft);

  /**
   * Opens on request; never closes on one.
   *
   * Radix asks to close on any pointerdown outside the panel, and that is
   * exactly what we don't want here: the point of this being a panel rather
   * than a dialog is that you can go and look something up mid-note — open a
   * client, check a number — and come back to it. Declining the request is the
   * only lever available, since the design system's `Popover` doesn't forward
   * `onInteractOutside`.
   *
   * The panel is left with two deliberate exits, both in the composer: the
   * minimise button, and Escape (which it re-implements, because it arrives
   * here as the same `false` an outside click does).
   */
  const handleOpenChange = (next: boolean) => {
    if (!next) return;
    // Re-seed the client on the way in, but only while the draft is untouched:
    // an unstarted draft should pick up whichever client's page you're on now,
    // and a started one is yours and shouldn't be rewritten under you.
    if (!unfinished) setDraft(emptyDraft(clientIdFromPath));
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await addNote({
        clientIds: draft.clientIds,
        title: draft.title.trim() || null,
        body: draft.body.trim(),
        author: NOTE_AUTHOR,
        reminderAt: draft.reminderAt,
        reminderDone: false,
      });
      setDraft(emptyDraft(clientIdFromPath));
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setDraft(emptyDraft(clientIdFromPath));
    setOpen(false);
  };

  return (
    <div
      // A class rather than a `useMediaQuery` early return: that hook can only
      // answer `false` on the server, so the button would ship in the HTML and
      // blink out on hydration. A media query in the stylesheet has the
      // answer before first paint.
      className="fixed bottom-8 right-8 z-40 hidden xl:block"
    >
      <Popover
        open={open}
        onOpenChange={handleOpenChange}
        // Up and to the left, because the trigger lives in the bottom-right
        // corner and that's the only direction with room.
        side="top"
        align="end"
        sideOffset={12}
        content={
          open ? (
            <NoteComposer
              draft={draft}
              onDraftChange={setDraft}
              clients={clients}
              saving={saving}
              onSubmit={handleSubmit}
              onDiscard={handleDiscard}
              onMinimize={() => setOpen(false)}
            />
          ) : null
        }
      >
        {/* No Tooltip: it and the popover both want the trigger's hover/click,
            and a tooltip firing as the panel opens sits on top of what you just
            opened. The label carries the draft state so it isn't colour-only. */}
        <Button
          variant="primary"
          size="icon-xl"
          className="rounded-full shadow-lg"
          aria-label={unfinished ? "New note — draft in progress" : "New note"}
        >
          <NotePencilIcon size={22} weight="bold" />
        </Button>
      </Popover>

      {/* Only while closed — with the panel up you can see the draft itself.
          `pointer-events-none` so it can't eat a click meant for the button it
          sits on, and a ring to keep the dot legible against the page behind.

          Solid dot plus an `animate-ping` halo expanding out of it, the same
          two-layer trick `MarketOpenBadge` uses in the dashboard layout — the
          ping alone would spend most of each cycle nearly invisible.

          `motion-reduce:animate-none` because this runs forever, not for a
          moment: it's exactly the kind of animation someone turns that setting
          on to stop. It degrades to the static dot, which still carries the
          meaning. */}
      {unfinished && !open && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center"
        >
          <span className="absolute inline-flex size-full rounded-full bg-[var(--bg-warning-primary)] opacity-75 animate-ping motion-reduce:animate-none" />
          <span className="relative inline-flex size-3 rounded-full bg-[var(--bg-warning-primary)] ring-2 ring-white" />
        </span>
      )}
    </div>
  );
}
