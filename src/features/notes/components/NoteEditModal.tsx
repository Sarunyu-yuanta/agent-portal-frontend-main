"use client";

import { useRef, useState } from "react";
import { Button, Toaster } from "@sarunyu/system-one";
import { useNotes } from "@/features/notes/store/notes-context";
import { useToasts } from "@/hooks/use-toasts";
import type { Note } from "@/types/domain";
import { NoteDetailPane } from "./NoteDetailPane";
import { NoteModalShell, NoteDeleteConfirmModal } from "./note-modal-shell";
import { useT } from "@/i18n/I18nProvider";

/**
 * The modal an existing note opens into wherever a reminder points at it —
 * `CalendarView`'s day panel, a client's Reminders tab, and their Overview
 * tab's own mini-list all hand a note id here rather than growing their own
 * editor. One definition, so a fourth copy of this panel can't drift from the
 * others the way the source badge once did (see `SOURCE_BADGE`).
 *
 * Edit-only: there is no create flow here, because nothing that opens this
 * modal is ever looking at a note that doesn't exist yet. `CalendarView` and
 * the Notes tab still own their own "new note" modals — writing one is a
 * different job from reading a reminder back.
 */
export function NoteEditModal({
  noteId,
  clients,
  pinnedClientId,
  onClose,
}: {
  /** `null` closes it. */
  noteId: string | null;
  clients: { id: string; name: string }[];
  /** A client this note is pinned to when opened from inside their own profile. */
  pinnedClientId?: string | null;
  onClose: () => void;
}) {
  const t = useT();
  const { notes, editNote, removeNote } = useNotes();

  const attributesOpenRef = useRef(false);
  const modalValuesRef = useRef<{ title: string; body: string } | null>(null);
  const [blank, setBlank] = useState(true);
  const { toasts, addToast, removeToast } = useToasts();

  const [panelNote, setPanelNote] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);

  const liveNote = notes.find((n) => n.id === noteId) ?? null;
  if (liveNote && liveNote !== panelNote) setPanelNote(liveNote);

  const open = noteId !== null;

  const [saving, setSaving] = useState(false);

  // Waits for the write before saying it worked. This used to toast "saved"
  // and close straight away, so a failed save still looked like a success.
  const handleSave = async () => {
    if (!panelNote || saving) return;
    const values = modalValuesRef.current;
    setSaving(true);
    try {
      await editNote({
        ...panelNote,
        title: values?.title.trim() || null,
        body: values?.body ?? panelNote.body,
      });
    } catch (err) {
      console.warn("[NoteEditModal] save failed", err);
      addToast({ status: "critical", message: t.planner.saveFailedKept });
      return;
    } finally {
      setSaving(false);
    }
    addToast({ status: "success", message: t.planner.saved });
    onClose();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await removeNote(target.id);
    } catch (err) {
      console.warn("[NoteEditModal] delete failed", err);
      addToast({ status: "critical", message: t.states.deleteError });
      return;
    }
    addToast({ status: "success", message: t.planner.deleted });
    onClose();
  };

  return (
    <>
      <Toaster items={toasts} onRemove={removeToast} />

      <NoteModalShell
        open={open}
        onBackdropDismiss={() => {
          if (attributesOpenRef.current || deleteTarget) return;
          onClose();
        }}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={blank || saving}>
              {saving ? t.common.saving : t.common.save}
            </Button>
          </>
        }
      >
        {panelNote && (
          <NoteDetailPane
            key={panelNote.id}
            note={panelNote}
            clients={clients}
            pinnedClientId={pinnedClientId}
            onSave={(patch) => editNote({ ...panelNote, ...patch })}
            onEmptyChange={setBlank}
            onValuesChange={(values) => {
              modalValuesRef.current = values;
            }}
            manualSave
            layout="side"
            autoFocusTitle={panelNote.title === null && panelNote.body === ""}
            onAttributesOpenChange={(open) => {
              attributesOpenRef.current = open;
            }}
            onDelete={() => setDeleteTarget(panelNote)}
          />
        )}
      </NoteModalShell>

      <NoteDeleteConfirmModal
        open={deleteTarget !== null}
        title={t.planner.deleteReminderTitle}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
