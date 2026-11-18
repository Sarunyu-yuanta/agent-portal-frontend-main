"use client";

import type { ReactNode } from "react";
import { Modal } from "@sarunyu/system-one";

/**
 * The backdrop/panel/footer shell `NoteEditModal` and `ClientNotesTab`'s note
 * dialog both built by hand — same classes, same shape, right down to the
 * "only a direct click on the backdrop counts" guard.
 *
 * Presentational only: `onBackdropDismiss` fires whenever the backdrop itself
 * (not something inside the panel) is clicked, and it's the caller's job to
 * decide whether that should actually close anything — `NoteEditModal` and
 * `ClientNotesTab` guard this differently (the latter also prunes a note left
 * blank), so that decision stays with them rather than living here.
 */
export function NoteModalShell({
  open,
  onBackdropDismiss,
  children,
  footer,
}: {
  open: boolean;
  onBackdropDismiss: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        onBackdropDismiss();
      }}
    >
      <div className="relative w-full max-w-4xl h-[calc(var(--vh)*75)] rounded-xl border border-border bg-card flex flex-col overflow-hidden shadow-xl">
        <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

/**
 * The delete-confirm alert both note dialogs open on top of their own shell.
 * `title` stays a prop rather than a fixed string: `NoteEditModal` asks
 * "Delete reminder?" (it only ever opens for a reminder someone clicked
 * through to) and `ClientNotesTab` asks "Delete note?" — same dialog, two
 * genuinely different questions depending on how you got there.
 */
export function NoteDeleteConfirmModal({
  open,
  title,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <Modal
        variant="alert"
        alertStatus="danger"
        title={title}
        description="This note will be permanently removed."
        actionLayout="double"
        primaryLabel="Delete"
        secondaryLabel="Cancel"
        onPrimaryClick={onConfirm}
        onSecondaryClick={onCancel}
        onClose={onCancel}
      />
    </div>
  );
}
