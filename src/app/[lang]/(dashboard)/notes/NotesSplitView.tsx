"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Toaster } from "@sarunyu/system-one";
import { NotePencilIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useToasts } from "@/hooks/use-toasts";
import { useNotes, LOCAL_ID_PREFIX } from "@/contexts/notes-context";
import type { Note } from "@/types/domain";
import { NOTE_AUTHOR } from "./note-constants";
import { NotesSidebarList, DISCARD_REMOVE_MS } from "./NotesSidebarList";
import { NoteDetailPane } from "./NoteDetailPane";

/** Distinguishes one composition from the next, so clicking New Note twice in a
 * row gives the editor a key it hasn't seen and it mounts empty. */
let draftSeq = 0;

/**
 * Apple-Notes-style master/detail view, shared by the Notes hub, the Client
 * 360 Notes tab, and the Client Hub Notes dialog. Responsive by itself: side
 * by side on desktop, single-pane drill-in (list → detail, with a back
 * arrow) below 768px — the same breakpoint/hook `ResponsiveDialog` uses.
 *
 * New Note opens a *draft*: a note-shaped object held in this component and
 * nowhere else. Nothing reaches the store, or the network, until a character is
 * typed. That is what makes an abandoned New Note free — navigating away, or
 * closing the tab, takes the draft with it and leaves nothing to clean up.
 *
 * The alternative, creating the note on click and deleting it later, needs a
 * cleanup on every way out of the page and silently misses the ones it doesn't
 * cover: a refresh, a closed tab, a crash. Those all used to leave an untouched
 * "New Note" in the list — and, because the New Note button locks while a blank
 * note is open, a user who came back to one had a dead button and no memory of
 * why.
 */
export function NotesSplitView({
  notes,
  clients,
  lockedClientId,
  defaultClientId,
  initialSelectedId,
  heightClassName = "h-[calc(var(--vh)*70)]",
  surfaceClassName,
}: {
  notes: Note[];
  clients: { id: string; name: string }[];
  /** When set (even to null), new/existing notes here can't change client — used from client-scoped views. */
  lockedClientId?: string | null;
  /** Client a freshly-created note starts with when `lockedClientId` isn't set. */
  defaultClientId?: string | null;
  /** Note to open on mount — how a link from outside (e.g. a Calendar reminder) lands on one. */
  initialSelectedId?: string | null;
  heightClassName?: string;
  /**
   * Overrides on the outer card — the rounding and border, for a caller that
   * wants the view flush against the viewport instead of framed. Merged with
   * `cn` so a conflicting utility actually wins rather than depending on which
   * of the two Tailwind emitted last.
   */
  surfaceClassName?: string;
}) {
  const { addNote, editNote, removeNote } = useNotes();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const { toasts, addToast, removeToast } = useToasts();
  // Reported by NoteDetailPane on every keystroke, not on its save debounce.
  const [draftBlank, setDraftBlank] = useState(false);
  // Notes mid-exit: still in the list, already animating out of it.
  const [discardingIds, setDiscardingIds] = useState<string[]>([]);
  // The one note whose Title field should take the caret on open. Held as an id
  // rather than a boolean so it can't leak onto whatever gets selected next.
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  /**
   * The unwritten note, if one is open. Note-shaped so the list and the editor
   * can render it without knowing the difference, but absent from `notes` — it
   * has never been created.
   *
   * Its id is prefixed like a store-minted local id, which is what makes the row
   * animate in like any freshly added note, and is the id the real note is
   * created under when the draft is promoted.
   *
   * `draft !== null` is also the answer to "is there an unwritten note open" —
   * the moment anything is typed the draft becomes a real note and this goes
   * back to null, so there is no separate blank-tracking to keep in step.
   */
  const [draft, setDraft] = useState<Note | null>(null);

  /**
   * Abandoned drafts that are still collapsing out of the list.
   *
   * Held apart from `draft` so that goes null the instant one is dropped rather
   * than when its animation ends — otherwise New Note, clicked during the ~280ms
   * exit, would find a draft still set and "return" you to the row that is
   * halfway through disappearing.
   */
  const [exitingDrafts, setExitingDrafts] = useState<Note[]>([]);

  // Derived, not synced via effect: fall back to the most recently edited
  // note whenever the explicit selection is unset or points at a note that's
  // gone (deleted, filtered out) — matching how the real Notes app never
  // shows a truly blank pane unless the list itself is empty. Mobile is the
  // exception: it starts on the list and only opens a note on an explicit tap.
  const rawSelectedNote = notes.find((n) => n.id === selectedId) ?? null;
  const newestNote = useMemo(
    () =>
      notes.length === 0
        ? null
        : [...notes].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0],
    [notes],
  );
  // The draft is checked first and skips the fallback: it is a deliberate
  // selection, and falling back off it to the newest saved note would swap the
  // pane out from under someone who just clicked New Note.
  const selectedNote =
    draft && selectedId === draft.id ? draft : (rawSelectedNote ?? (isMobile ? null : newestNote));

  /**
   * The draft rides at the top of the list while it is being written, so New
   * Note produces a row you can see rather than just an empty pane.
   *
   * The id filter covers the single render in which promotion lands: the store
   * gains a note under the draft's id in the same batch that clears the draft,
   * and rendering both would put two rows under one React key.
   */
  const listNotes = useMemo(() => {
    const local = draft ? [draft, ...exitingDrafts] : exitingDrafts;
    if (local.length === 0) return notes;
    const localIds = new Set(local.map((n) => n.id));
    return [...local, ...notes.filter((n) => !localIds.has(n.id))];
  }, [draft, exitingDrafts, notes]);

  // `handleSave` is handed down into child closures (the debounced title/body
  // save, the chip editors) that may still fire after `notes` has moved on —
  // merging against `notesRef.current` instead of the `selectedNote` closure
  // keeps every save's merge-base as fresh as possible, so a save that lands
  // late doesn't clobber a different field's edit that landed in between.
  const notesRef = useRef(notes);
  useEffect(() => {
    notesRef.current = notes;
  });

  /**
   * A note is worth keeping only if something was typed into it. A reminder or a
   * client doesn't make it a note.
   *
   * This used to spare a note whose only content was a reminder, on the grounds
   * that a reminder is the one thing you can set without typing. It doesn't
   * hold: flipping the reminder switch fills a date in for you, so "empty note
   * with a reminder" is what you get from touching that switch and changing your
   * mind. The same rule decides when a draft gets promoted, so a note can never
   * come into existence in a state this would immediately throw away.
   */
  const written = (title: string, body: string) => title.trim() !== "" || body.trim() !== "";

  /** Marks the row so it fades and collapses, and only then lets `remove` run —
   * dropping it outright made it blink out of existence mid-click. */
  const discardRow = (id: string, remove: () => void) => {
    setDiscardingIds((prev) => [...prev, id]);
    // The timer is started here, in the click handler, rather than from an
    // effect — an effect keyed on a single "discarding" id would lose the first
    // note if a second one started exiting before its timer fired, and that note
    // would then sit in the list forever.
    setTimeout(remove, DISCARD_REMOVE_MS);
  };

  const dropDraft = (abandoned: Note) => {
    setDraft(null);
    setExitingDrafts((prev) => [...prev, abandoned]);
    discardRow(abandoned.id, () => {
      setExitingDrafts((prev) => prev.filter((d) => d.id !== abandoned.id));
      setDiscardingIds((prev) => prev.filter((x) => x !== abandoned.id));
    });
  };

  const dropEmptiedNote = (id: string) =>
    discardRow(id, () => {
      // Clear the flag only once `removeNote` has settled, never alongside it.
      // `removeNote` doesn't touch `notes` until its DELETE comes back, so
      // dropping the id synchronously left a window where the note was still in
      // the list but no longer marked as leaving — the collapsed row sprang back
      // to full height, then vanished when the response landed. One frame of
      // that locally, and about half a second against a real backend.
      // `finally`, not `then`: if the delete fails the note is still there, so
      // un-marking it is right — the row reopens rather than staying collapsed
      // over a note that never went away. `removeNote` lets its errors out, so
      // the catch is what keeps that from surfacing as an unhandled rejection.
      void removeNote(id)
        .catch((err) => console.warn("[NotesSplitView] discard failed", err))
        .finally(() => setDiscardingIds((prev) => prev.filter((x) => x !== id)));
    });

  /**
   * Whatever is open gets dropped on the way out if nothing was written in it —
   * the way the real Notes app never keeps an untouched "New Note" around once
   * you move on. A draft costs nothing to drop; an existing note that was
   * emptied out has to be deleted for real.
   *
   * Deliberately called from the handlers rather than an unmount cleanup:
   * StrictMode double-mounts in dev, and the throwaway delete would fire on the
   * phantom unmount and take the note the user is still looking at.
   */
  const pruneLeaving = (nextId: string | null) => {
    const leaving = selectedNote;
    if (!leaving || leaving.id === nextId) return;
    if (draft && leaving.id === draft.id) dropDraft(draft);
    else if (draftBlank) dropEmptiedNote(leaving.id);
  };

  /**
   * Apple Notes' rule: while an unwritten note is open, New Note is off. Two
   * shapes count as unwritten, and they are the same thing — a draft that was
   * never typed in, and a saved note whose content has just been deleted. The
   * second re-sorts to the top of the list under the title "New Note" as soon as
   * the emptying saves, so what you are looking at *is* the new note; a second
   * one beside it would be indistinguishable and equally empty.
   *
   * The confusion this used to cause is gone for a different reason: nothing
   * survives navigation any more, so you can only ever meet the disabled button
   * with the blank note it refers to visible on screen.
   */
  const nothingWritten = draft !== null || (selectedNote !== null && draftBlank);

  /** Both branches are backstops behind `nothingWritten` — the button is already
   * disabled in either case. Kept because the disable is a UI decision and this
   * is the invariant it stands for. */
  const handleAdd = () => {
    if (draft) {
      setSelectedId(draft.id);
      return;
    }
    pruneLeaving(null);

    const now = new Date().toISOString();
    const seedClient = lockedClientId !== undefined ? lockedClientId : defaultClientId;
    const id = `${LOCAL_ID_PREFIX}draft-${++draftSeq}`;
    setDraft({
      id,
      clientIds: seedClient ? [seedClient] : [],
      title: null,
      body: "",
      author: NOTE_AUTHOR,
      reminderAt: null,
      reminderDone: false,
      createdAt: now,
      updatedAt: now,
    });
    setSelectedId(id);
    // Starting a note is a statement of intent to write one, so land the caret
    // in Title instead of making the user click into an empty pane.
    setAutoFocusId(id);
  };

  /**
   * The first character is what turns a draft into a note. Reported off the
   * editor's live values, not its save debounce, so the note exists from the
   * keystroke rather than 800ms later — navigating away mid-sentence keeps what
   * was typed instead of losing it with the draft.
   *
   * Created under the draft's own id, which is why nothing remounts: the row and
   * the editor were already keyed on it, so the swap from draft to real note is
   * invisible and the caret stays where it is.
   */
  const promoteDraft = (values: { title: string; body: string }) => {
    if (!draft || !written(values.title, values.body)) return;
    void addNote(
      {
        clientIds: draft.clientIds,
        title: values.title.trim() || null,
        body: values.body,
        author: draft.author,
        reminderAt: draft.reminderAt,
        reminderDone: draft.reminderDone,
      },
      draft.id,
    );
    setDraft(null);
  };

  const handleSelect = (nextId: string | null) => {
    pruneLeaving(nextId);
    setSelectedId(nextId);
    // Picking a note by hand means the user chose where to be; don't yank the
    // caret into Title on top of that.
    setAutoFocusId(null);
  };

  const handleSave = (id: string, patch: Partial<Note>) => {
    // A client or reminder set before a word is typed stays on the draft. Those
    // don't make it a note (see `written`), so they must not be what brings one
    // into existence — otherwise touching the reminder switch and changing your
    // mind leaves a blank note behind, which is the whole thing being avoided.
    if (draft && id === draft.id) {
      setDraft((d) => (d && d.id === id ? { ...d, ...patch } : d));
      return;
    }
    const current = notesRef.current.find((n) => n.id === id);
    if (!current) return;
    editNote({ ...current, ...patch });
  };

  /** Discarding a draft needs no confirmation — there is nothing to delete. */
  const handleDelete = () => {
    if (!selectedNote) return;
    if (draft && selectedNote.id === draft.id) {
      dropDraft(draft);
      setSelectedId(null);
      return;
    }
    setDeleteTarget(selectedNote);
  };

  /**
   * The one destructive action here that leaves no trace of itself. Editing
   * says "Auto saved" in the pane and a discarded blank note visibly collapses
   * out of the list, but a deleted note just isn't there any more — and on the
   * hub you may well be looking at the editor rather than the row that vanished.
   *
   * The failure branch matters as much as the success one: `removeNote` only
   * drops the note from state once its DELETE comes back, so a failed delete
   * leaves the note on screen. Without a toast that reads as the click not
   * having registered, and the natural response is to try again.
   */
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await removeNote(target.id);
      if (target.id === selectedId) setSelectedId(null);
      addToast({ status: "success", message: "Note deleted" });
    } catch (err) {
      console.warn("[NotesSplitView] delete failed", err);
      addToast({ status: "critical", message: "Couldn't delete note. Try again." });
    }
  };

  // Only one flag now: the panes no longer mount and unmount, they slide, so
  // "is the list showing" is just the other side of this.
  const showDetail = !isMobile || Boolean(selectedNote);

  /**
   * What the detail pane renders, which on mobile is not the same question as
   * what is selected.
   *
   * Back clears the selection immediately, but the pane it is sliding away from
   * still needs a note to show for the ~200ms that takes — an empty pane
   * gliding off screen is worse than no animation. So this holds the last note
   * that *was* selected until another one arrives.
   *
   * Adjusted during render rather than in an effect: an effect runs after paint,
   * which is exactly one frame of the blank pane this exists to prevent. Same
   * pattern `CalendarView` uses for its own edit panel.
   */
  const [paneNote, setPaneNote] = useState<Note | null>(null);
  if (selectedNote && selectedNote !== paneNote) setPaneNote(selectedNote);
  else if (!selectedNote && !isMobile && paneNote) setPaneNote(null);

  const sidebarPane = (
    <NotesSidebarList
      notes={listNotes}
      clients={clients}
      selectedId={selectedNote?.id ?? null}
      onSelect={handleSelect}
      onAdd={handleAdd}
      addDisabled={nothingWritten}
      discardingIds={discardingIds}
    />
  );

  const detailPane = paneNote ? (
    <NoteDetailPane
      key={paneNote.id}
      note={paneNote}
      clients={clients}
      pinnedClientId={lockedClientId}
      onBack={isMobile ? () => handleSelect(null) : undefined}
      onSave={(patch) => handleSave(paneNote.id, patch)}
      onEmptyChange={setDraftBlank}
      onValuesChange={promoteDraft}
      autoFocusTitle={paneNote.id === autoFocusId}
      onDelete={handleDelete}
    />
  ) : (
    /*
     * Reachable only when there are no notes at all: `selectedNote` falls back
     * to the newest one whenever the explicit selection is unset, so on desktop
     * this branch means the list itself is empty (on mobile the drill-in never
     * gets here without a note). Hence "no notes yet" rather than "pick one
     * from the list".
     *
     * Uses the shared `EmptyState` primitive; the wrapper is only here to
     * centre it, since the primitive brings a 400px floor rather than filling
     * its parent.
     */
    <div className="flex items-center justify-center h-full p-4">
      <EmptyState
        icon={<NotePencilIcon size={40} className="text-[var(--text-default-placeholder)]" />}
        title="No notes yet"
        body="Write your first note and it will show up in the list on the left."
        actionSlot={
          <Button
            variant="primary"
            size="lg"
            onClick={handleAdd}
            leftIcon={<NotePencilIcon size={18} weight="bold" />}
          >
            New Note
          </Button>
        }
      />
    </div>
  );

  return (
    <>
      {/* Outside the split view's own box, which clips its contents — the
          Toaster is fixed-position and would be cut off inside it. */}
      <Toaster items={toasts} onRemove={removeToast} />

      <div
        className={cn(
          "flex overflow-hidden bg-card rounded-xl border border-border",
          isMobile ? "flex-col" : "flex-row",
          heightClassName,
          surfaceClassName,
        )}
      >
        {isMobile ? (
          /*
           * The drill-in, as one strip that slides rather than two views that
           * swap. Both panes stay mounted and the track moves between them, so
           * New Note and Back read as a step forward and a step back instead of
           * a cut — the same motion the Calendar's alert panel uses.
           *
           * No height animation here, unlike that one: both panes are `h-full`
           * of a container the shell already sized, so only the horizontal
           * position has anything to interpolate.
           */
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              className="flex h-full w-[200%] transition-transform duration-200 ease-out"
              style={{ transform: showDetail ? "translateX(-50%)" : "translateX(0)" }}
            >
              {/* `inert` on whichever pane is off-screen: both are in the DOM
                  the whole time, so without it Tab walks into a pane nobody can
                  see and a screen reader reads out two. */}
              <div className="h-full w-1/2 shrink-0" inert={showDetail}>
                {sidebarPane}
              </div>
              <div className="h-full w-1/2 shrink-0" inert={!showDetail}>
                {detailPane}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-[280px] shrink-0 h-full border-r border-border">{sidebarPane}</div>
            <div className="flex-1 min-w-0 h-full">{detailPane}</div>
          </>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Modal
              variant="alert"
              alertStatus="danger"
              title="Delete note?"
              description="This note will be permanently removed."
              actionLayout="double"
              primaryLabel="Delete"
              secondaryLabel="Cancel"
              onPrimaryClick={confirmDelete}
              onSecondaryClick={() => setDeleteTarget(null)}
              onClose={() => setDeleteTarget(null)}
            />
          </div>
        )}
      </div>
    </>
  );
}
