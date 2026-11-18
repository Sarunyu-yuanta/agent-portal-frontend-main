import { useState } from "react";
import { NoteEditModal } from "../notes/NoteEditModal";

/**
 * The `editNoteId` state + `<NoteEditModal>` pair every "open a note by id"
 * surface built by hand. `pinnedClientId` is the caller's own — a client's
 * own profile pages pin themselves, the header bell and other cross-client
 * surfaces leave it unset.
 */
export function useNoteEditModal({
  clients,
  pinnedClientId,
}: {
  clients: { id: string; name: string }[];
  pinnedClientId?: string | null;
}) {
  const [editNoteId, setEditNoteId] = useState<string | null>(null);

  return {
    openNote: (noteId: string) => setEditNoteId(noteId),
    modal: (
      <NoteEditModal
        noteId={editNoteId}
        clients={clients}
        pinnedClientId={pinnedClientId}
        onClose={() => setEditNoteId(null)}
      />
    ),
  };
}
