import { useState } from "react";
import { AlertOverlay, type AlertTarget } from "./AlertOverlay";
import type { DayItem } from "./day-items";
import { useNoteEditModal } from "./use-note-edit-modal";

/**
 * Everywhere a day item gets clicked opens the same two things: a note opens
 * `NoteEditModal` for editing, anything else goes to `AlertOverlay`, which
 * picks the read-only surface that row deserves — an exchange record sheet for
 * a corporate action, the holder panel for a desk event. Four surfaces (the
 * header bell, a client's Overview and Reminders tabs, the Client Hub's quick
 * view) built this same pair — state, dispatch, and both modals —
 * independently; this is the one definition.
 *
 * `pinnedClientId`/`showHolders` carry the same meaning as they do on
 * `NoteEditModal`/`AlertOverlay` themselves: set both from inside a client's
 * own profile (the panel would otherwise be listing the person whose page
 * you're standing on), leave them unset for a cross-client surface like the
 * bell, which doesn't already know whose reminder it's showing.
 */
export function useDayItemModals({
  clients,
  pinnedClientId,
  showHolders,
}: {
  clients: { id: string; name: string }[];
  pinnedClientId?: string | null;
  showHolders?: boolean;
}) {
  const { openNote, modal: noteModal } = useNoteEditModal({ clients, pinnedClientId });
  const [alertTarget, setAlertTarget] = useState<AlertTarget | null>(null);

  const open = (item: DayItem, day: Date) => {
    if (item.noteId) openNote(item.noteId);
    else setAlertTarget({ item, day });
  };

  return {
    open,
    modals: (
      <>
        {noteModal}
        <AlertOverlay
          target={alertTarget}
          clients={clients}
          showHolders={showHolders}
          onClose={() => setAlertTarget(null)}
        />
      </>
    ),
  };
}
