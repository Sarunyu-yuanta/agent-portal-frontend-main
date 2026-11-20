"use client";

import { NotesTabSkeleton } from "./ClientProfileSkeleton";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/i18n/navigation";
import { Button, Toaster } from "@sarunyu/system-one";
import { NotePencilIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { useClients } from "@/hooks/use-api";
import { useToasts } from "@/hooks/use-toasts";
import { useNotes } from "@/features/notes/store/notes-context";
import { setQueryState, withQuery } from "@/lib/query-state";
import { NOTE_AUTHOR } from "@/features/notes/lib/note-constants";
import { NotesGallery } from "@/features/notes/components/NotesGallery";
import { NoteDetailPane } from "@/features/notes/components/NoteDetailPane";
import {
  NoteModalShell,
  NoteDeleteConfirmModal,
} from "@/features/notes/components/note-modal-shell";
import { useT } from "@/i18n/I18nProvider";
import type { Note } from "@/types/note";

/**
 * Notes tab on a client's Full Profile — a wall of cards rather than the Notes
 * hub's list-beside-reader.
 *
 * Different shape for a different job: the hub is where you work through every
 * note you have, so it wants a list and a reader side by side. Here you're
 * looking at one client, the set is small, and what you want is to recognise the
 * note you're after — which cards do better than rows.
 */
export function ClientNotesTab({ clientId }: { clientId: string }) {
  const router = useLocalizedRouter();
  const t = useT();
  const searchParams = useSearchParams();
  const clients = useClients();
  const { notes, isLoading, addNote, editNote, removeNote } = useNotes();

  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const attributesOpenRef = useRef(false);
  // Latest title/body from NoteDetailPane — read on "Add note" click.
  const modalValuesRef = useRef<{ title: string; body: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();
  // True when the editor is blank — disables "Add note" so empty notes can't be saved.
  const [draftBlank, setDraftBlank] = useState(true);

  // --- Create flow: modal opens with a local draft, note is only created in DB on "Add note" ---
  const [createOpen, setCreateOpen] = useState(false);
  const [draftAttrs, setDraftAttrs] = useState<{
    clientIds: string[];
    reminderAt: string | null;
    reminderDone: boolean;
  }>({ clientIds: [clientId], reminderAt: null, reminderDone: false });
  // Stable timestamp so the displayed date doesn't jump when attributes change.
  // State rather than a ref because the draft note below is built during render:
  // a ref read at render time is what `react-hooks/refs` flags, and `handleAdd`
  // already re-renders (it calls `setDraftAttrs`) whenever it restamps this.
  const [draftCreatedAt, setDraftCreatedAt] = useState(() => new Date().toISOString());

  const draftNoteForPane = useMemo<Note>(
    () => ({
      id: "__draft__",
      title: null,
      body: "",
      author: NOTE_AUTHOR,
      createdAt: draftCreatedAt,
      updatedAt: draftCreatedAt,
      ...draftAttrs,
    }),
    [draftAttrs, draftCreatedAt],
  );

  // --- Edit flow: existing note opened via URL param ---
  const clientNotes = useMemo(
    () => notes.filter((n) => n.clientIds.includes(clientId)),
    [notes, clientId],
  );

  const noteParam = searchParams.get("note");
  const openNote = (noteParam && clientNotes.find((n) => n.id === noteParam)) || null;
  const editOpen = openNote !== null;

  // Kept in state so the modal still has content while it fades out after closing.
  const [panelNote, setPanelNote] = useState<Note | null>(openNote);
  if (openNote && openNote !== panelNote) {
    setPanelNote(openNote);
  }

  // Opening a *different* note collapses its attributes section. In an effect
  // rather than the render-phase branch above (where it used to live, tripping
  // `react-hooks/refs`) — the flag is only ever read from event handlers, which
  // cannot fire before effects have flushed, so the reset still lands in time.
  useEffect(() => {
    attributesOpenRef.current = false;
  }, [openNote?.id]);

  const pushedPanelRef = useRef(false);

  // A `?note=` that is none of this client's notes (a stale link, a note since
  // deleted elsewhere) used to open nothing and say nothing. Checked when the
  // param or the load changes — not on every notes update, so deleting the
  // open note (which drops it from `clientNotes` a beat before the URL closes)
  // isn't mistaken for a bad link.
  const unknownNoteParam = !isLoading && noteParam && !openNote ? noteParam : null;
  useEffect(() => {
    if (!unknownNoteParam) return;
    setQueryState(
      withQuery(`/client/${clientId}`, searchParams, { tab: "notes", note: null }),
      "replace",
    );
    addToast({ status: "warning", message: t.client.notes.notFound });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [noteParam, isLoading]);

  const hrefFor = (noteId: string | null) =>
    withQuery(`/client/${clientId}`, searchParams, { tab: "notes", note: noteId });

  const navigateClosed = () => {
    if (pushedPanelRef.current) {
      pushedPanelRef.current = false;
      router.back();
    } else {
      setQueryState(hrefFor(null), "replace");
    }
  };

  const pruneIfBlank = (note: Note | null) => {
    // Housekeeping for a note left blank; nothing the IC asked for, so a
    // failure is logged rather than toasted.
    if (note && draftBlank) {
      removeNote(note.id).catch((err: unknown) =>
        console.warn("[ClientNotesTab] prune failed", err),
      );
    }
  };

  const openNoteId = (noteId: string) => {
    const leaving = openNote;
    if (editOpen) {
      setQueryState(hrefFor(noteId), "replace");
    } else {
      pushedPanelRef.current = true;
      setQueryState(hrefFor(noteId), "push");
    }
    if (leaving && leaving.id !== noteId) pruneIfBlank(leaving);
  };

  // --- Shared modal close ---
  const closeModal = () => {
    if (createOpen) {
      setCreateOpen(false);
    } else {
      pruneIfBlank(openNote);
      navigateClosed();
    }
  };

  // --- "New note" tile: open create modal without touching the DB ---
  const handleAdd = () => {
    setDraftCreatedAt(new Date().toISOString());
    setDraftAttrs({ clientIds: [clientId], reminderAt: null, reminderDone: false });
    modalValuesRef.current = { title: "", body: "" };
    setCreateOpen(true);
  };

  // --- "Add note" button in modal ---
  const handleModalSave = async () => {
    const values = modalValuesRef.current ?? { title: "", body: "" };

    if (saving) return;
    setSaving(true);
    try {
      if (createOpen) {
        await addNote({
          clientIds: draftAttrs.clientIds,
          title: values.title.trim() || null,
          body: values.body,
          author: NOTE_AUTHOR,
          reminderAt: draftAttrs.reminderAt,
          reminderDone: draftAttrs.reminderDone,
        });
      } else if (panelNote) {
        // Awaited before the toast: it used to report "saved" before the
        // write had even returned, failed or not.
        await editNote({ ...panelNote, title: values.title.trim() || null, body: values.body });
      } else {
        return;
      }
    } catch (err) {
      // The modal stays open with what was typed.
      console.warn("[ClientNotesTab] save failed", err);
      addToast({ status: "critical", message: t.client.notes.saveFailed });
      return;
    } finally {
      setSaving(false);
    }
    if (createOpen) {
      addToast({ status: "success", message: t.client.notes.added });
      setCreateOpen(false);
    } else {
      addToast({ status: "success", message: t.client.notes.saved });
      navigateClosed();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    const wasOpen = target.id === openNote?.id;
    setDeleteTarget(null);
    try {
      await removeNote(target.id);
    } catch (err) {
      console.warn("[ClientNotesTab] delete failed", err);
      addToast({ status: "critical", message: t.client.notes.deleteFailed });
      return;
    }
    addToast({ status: "success", message: t.client.notes.deleted });
    if (wasOpen) navigateClosed();
  };

  const modalOpen = createOpen || editOpen;

  if (isLoading) {
    return <NotesTabSkeleton />;
  }

  return (
    <>
      <Toaster items={toasts} onRemove={removeToast} />
      <NotesGallery
        notes={clientNotes}
        selectedId={openNote?.id ?? null}
        onOpen={(note) => openNoteId(note.id)}
        onAdd={handleAdd}
        addDisabled={createOpen}
      />
      {clientNotes.length === 0 && (
        <EmptyState
          size="compact"
          icon={
            <NotePencilIcon
              size={32}
              weight="duotone"
              className="text-[var(--text-default-placeholder)]"
            />
          }
          title={t.client.notes.noneForClient}
        />
      )}

      <NoteModalShell
        open={modalOpen}
        onBackdropDismiss={() => {
          if (attributesOpenRef.current || deleteTarget) return;
          closeModal();
        }}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleModalSave}
              disabled={draftBlank || saving}
            >
              {createOpen ? t.client.notes.addNote : t.common.save}
            </Button>
          </>
        }
      >
        {createOpen ? (
          <NoteDetailPane
            key="__draft__"
            note={draftNoteForPane}
            clients={clients}
            pinnedClientId={clientId}
            onSave={(patch) => setDraftAttrs((prev) => ({ ...prev, ...patch }))}
            onEmptyChange={setDraftBlank}
            onValuesChange={(values) => {
              modalValuesRef.current = values;
            }}
            manualSave
            layout="side"
            autoFocusTitle
            onAttributesOpenChange={(open) => {
              attributesOpenRef.current = open;
            }}
          />
        ) : panelNote ? (
          <NoteDetailPane
            key={panelNote.id}
            note={panelNote}
            clients={clients}
            pinnedClientId={clientId}
            onSave={(patch) => editNote({ ...panelNote, ...patch })}
            onEmptyChange={setDraftBlank}
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
        ) : null}
      </NoteModalShell>

      <NoteDeleteConfirmModal
        open={deleteTarget !== null}
        title={t.client.notes.deleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
