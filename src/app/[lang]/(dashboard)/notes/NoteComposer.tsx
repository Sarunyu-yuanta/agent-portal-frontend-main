"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Modal, Tooltip } from "@sarunyu/system-one";
import { MinusIcon } from "@phosphor-icons/react";
import { NoteAttributesControl } from "./NoteAttributesControl";
import { NoteEditorFields } from "./NoteEditorFields";

/** Everything being written, before it's a note. */
export type ComposerDraft = {
  title: string;
  body: string;
  clientIds: string[];
  reminderAt: string | null;
};

export function emptyDraft(seedClientId?: string | null): ComposerDraft {
  return {
    title: "",
    body: "",
    clientIds: seedClientId ? [seedClientId] : [],
    reminderAt: null,
  };
}

/**
 * Whether there is anything here worth not losing.
 *
 * `clientIds` is deliberately *not* part of it: opening the composer on a
 * client's page seeds that client automatically, and a draft nobody has touched
 * shouldn't announce itself as unfinished work. The seeded value is still kept
 * along with the rest — this only decides whether to say so.
 */
export function draftHasContent(draft: ComposerDraft): boolean {
  return draft.title.trim().length > 0 || draft.body.trim().length > 0 || draft.reminderAt !== null;
}

/**
 * Quick capture, as a panel that opens beside its trigger rather than a dialog
 * over the page — writing a note down shouldn't black out what you were looking
 * at when you thought of it.
 *
 * The surface is just the writing area: the same `NoteEditorFields` the detail
 * pane uses, so it *is* that editor rather than a form styled to look like it.
 * Client and reminder sit behind the control in the header, out of the way of
 * the thing you opened this to do.
 *
 * Fully controlled, and that's the point: this component is unmounted the moment
 * its popover closes, so anything it owned itself would be gone with one stray
 * click outside. The caller holds the draft, which is what lets a half-written
 * note survive being dismissed and be picked back up.
 */
export function NoteComposer({
  draft,
  onDraftChange,
  lockedClientId,
  clients,
  saving = false,
  onSubmit,
  onDiscard,
  onMinimize,
}: {
  draft: ComposerDraft;
  onDraftChange: (next: ComposerDraft) => void;
  /** When set (even to null), the note is fixed to that client — used from client-scoped views. */
  lockedClientId?: string | null;
  clients: { id: string; name: string }[];
  saving?: boolean;
  onSubmit: () => void;
  onDiscard: () => void;
  /** Put the panel away and keep the draft. */
  onMinimize: () => void;
}) {
  // Controlled so the trigger can show an active state while its panel is up.
  // Starts closed even when the draft already carries a client or a reminder —
  // the trigger reads those out on its own, and a popover that opens itself on
  // mount would land over the text you came here to write.
  const [attributesOpen, setAttributesOpen] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Opening this is a statement of intent to write, so the caret starts in Title
  // instead of waiting for a click.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true });
  }, []);

  /**
   * Escape minimises — restored by hand because the parent now refuses every
   * close Radix asks for (that's what keeps the panel up when you click away),
   * and Escape arrives through the same `onOpenChange(false)` as an outside
   * click with nothing to tell them apart.
   *
   * Lives here rather than in the parent so it can defer to whatever is layered
   * on top: while the attributes popover or the discard confirmation is up,
   * Escape belongs to that, and swallowing the key at this level would close the
   * whole composer instead of just the layer in front of it.
   */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || attributesOpen || confirmDiscard) return;
      onMinimize();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [attributesOpen, confirmDiscard, onMinimize]);

  const patch = (next: Partial<ComposerDraft>) => onDraftChange({ ...draft, ...next });

  // Either field is enough — a title on its own is a note ("Call Khun Somchai").
  // Same rule the detail pane uses to decide a note isn't blank, so a note that
  // survives being written there can be created here.
  const canSubmit = draft.title.trim().length > 0 || draft.body.trim().length > 0;

  return (
    // `min(...)` rather than a fixed width: this is anchored to a corner button,
    // so on a phone a 26rem panel would be wider than the screen and get shoved
    // around by collision detection.
    <div className="flex w-[min(var(--vw)*88,26rem)] flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <p className="type-subtitle-1 font-semibold text-foreground">New note</p>
        {/* The way out, now that clicking away deliberately doesn't close this.
            "Minimize" rather than "close": the draft is kept and the button it
            folds back into starts blinking, so nothing is being dismissed.

            `aria-label` stays alongside the tooltip: the tooltip is a hover
            affordance, not the button's accessible name. */}
        <Tooltip content="Minimize" side="left">
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize"
            // A step darker than the attributes pill's gray-50 — this one is the
            // way out of the panel, so it holds its own rather than blending
            // into the header.
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-default-tertiary)] text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--fill-gray-200)] hover:text-foreground"
          >
            <MinusIcon size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Bounded height: the body textarea has no natural ceiling, and a panel
          that grows with the note would run off the top of the viewport. */}
      <div className="flex max-h-[calc(var(--vh)*45)] min-h-[9rem] flex-col overflow-y-auto">
        <NoteEditorFields
          titleRef={titleRef}
          title={draft.title}
          body={draft.body}
          onTitleChange={(title) => patch({ title })}
          onBodyChange={(body) => patch({ body })}
        />
      </div>

      {/* Attributes bottom-left, actions bottom-right.
          No "Cancel": closing this keeps the draft now, so a button named cancel
          would be lying about what it does — clicking away or pressing Escape
          already does the harmless thing. Discard is the one that throws work
          away, so it says so, and only appears when there is work to throw. */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <NoteAttributesControl
          clientIds={draft.clientIds}
          clients={clients}
          pinnedClientId={lockedClientId}
          reminderAt={draft.reminderAt}
          open={attributesOpen}
          onOpenChange={setAttributesOpen}
          onClientIdsChange={(clientIds) => patch({ clientIds })}
          onReminderChange={(reminderAt) => patch({ reminderAt })}
          onClear={() => patch({ clientIds: [], reminderAt: null })}
        />

        <div className="flex shrink-0 items-center gap-2">
          {draftHasContent(draft) && (
            <Button variant="plain" size="sm" onClick={() => setConfirmDiscard(true)}>
              Discard
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={!canSubmit || saving}
            onClick={onSubmit}
          >
            {saving ? "Saving…" : "Add note"}
          </Button>
        </div>
      </div>

      {/*
       * Same alert pattern the Notes hub uses to confirm deleting a note, but
       * portalled to `document.body` — which is what makes it cover the screen.
       *
       * Left inline it only covered the popover: Radix positions the panel with
       * a `transform`, and a transformed ancestor becomes the containing block
       * for `position: fixed` descendants, so `inset-0` measured the panel
       * rather than the viewport.
       *
       * Portalling costs nothing here even though a click on it must still count
       * as "inside" the composer for Radix: `createPortal` moves the DOM node,
       * not the React tree, and React events propagate along the tree — so the
       * composer's layer still sees the pointerdown and stays open.
       */}
      {confirmDiscard &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <Modal
              variant="alert"
              alertStatus="danger"
              title="Discard this note?"
              description="What you've written will be lost."
              actionLayout="double"
              primaryLabel="Discard"
              secondaryLabel="Keep writing"
              onPrimaryClick={onDiscard}
              onSecondaryClick={() => setConfirmDiscard(false)}
              onClose={() => setConfirmDiscard(false)}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
