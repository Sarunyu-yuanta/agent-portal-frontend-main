"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useStatic } from "@/hooks/use-api";
import type { Note } from "@/types/note";

/** Nothing is seeded today; a real feed would be fetching this list. */
const SEED_NOTES: Note[] = [];

/** Everything the caller supplies for a new note; id and timestamps are set here. */
export type NoteDraft = Omit<Note, "id" | "createdAt" | "updatedAt">;

type NotesContextValue = {
  notes: Note[];
  /**
   * The seed list hasn't arrived — from `useStatic` over the seed, the same
   * seam every other dataset uses. Every notes screen renders a skeleton
   * against it, so a real endpoint needs no screen changes.
   */
  isLoading: boolean;
  /** The first load of the notes failed; screens show `ErrorState`. */
  error: Error | null;
  /** Fetch the notes again. */
  retry: () => void;
  /**
   * `localId` lets a caller that was already showing the note under an id of its
   * own hand that id over instead of being given a new one. `NotesSplitView`
   * composes into a local draft and only creates the note once a character is
   * typed — if that create minted a fresh id, the row and the editor would both
   * change key mid-keystroke and remount, taking the caret with them.
   */
  addNote: (draft: NoteDraft, localId?: string) => Promise<Note>;
  editNote: (note: Note) => Promise<Note>;
  removeNote: (id: string) => Promise<void>;
};

const NotesContext = createContext<NotesContextValue | null>(null);

/**
 * Marks an id minted here. Every note id carries it now that there is no server
 * to assign one.
 *
 * Exported because it doubles as "this note appeared because someone clicked" —
 * exactly the set of rows `NotesSidebarList` animates in. That reading is
 * unchanged in practice: the mock endpoint this used to read from never seeded
 * any notes, so every note in the list was already locally created.
 */
export const LOCAL_ID_PREFIX = "local-";
let localIdSeq = 0;

/**
 * Single shared note list for the whole app — mounted once in the dashboard
 * layout so every screen (the Notes hub, a client's Notes tab, the Overview
 * Reminders card, the floating "New note" button) reads and writes the same
 * data. Without this, adding a note from one screen wouldn't appear on
 * another already-open screen until that screen remounted.
 *
 * Held in React state rather than behind a fetch. The notes API this used to
 * talk to was a mock route backed by an in-process store, so it never outlived
 * the dev server either; the one thing lost by dropping it is that notes no
 * longer survive a page reload. Everything asynchronous went with it — the
 * optimistic insert, the local-id→server-id map, and the create-then-edit race
 * they existed to paper over are all gone, because a write is now just a
 * `setNotes`.
 *
 * The mutators stay `async`. They are awaited at every call site, and keeping
 * the signature means this can go back to a real endpoint without touching a
 * single caller.
 */
export function NotesProvider({ children }: { children: ReactNode }) {
  const { isLoading, error, retry } = useStatic(SEED_NOTES);
  const [notes, setNotes] = useState<Note[]>(SEED_NOTES);

  const addNote = useCallback(async (draft: NoteDraft, presetLocalId?: string) => {
    const now = new Date().toISOString();
    const note: Note = {
      ...draft,
      id: presetLocalId ?? `${LOCAL_ID_PREFIX}${++localIdSeq}`,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const editNote = useCallback(async (note: Note) => {
    const updated: Note = { ...note, updatedAt: new Date().toISOString() };
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    return updated;
  }, []);

  const removeNote = useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotesContext.Provider
      value={{ notes, isLoading, error, retry, addNote, editNote, removeNote }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within a NotesProvider");
  return ctx;
}
