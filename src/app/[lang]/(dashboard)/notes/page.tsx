"use client";

import { Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { useClients } from "@/hooks/use-api";
import { useNotes } from "@/contexts/notes-context";
import { NOTES_ENABLED } from "@/lib/feature-flags";
import { NotesSplitView } from "./NotesSplitView";

/**
 * The full note history — every note the RM has written, client-linked or
 * general. Client 360's Notes tab is the same data filtered to one client;
 * this page is where general (non-client) notes actually live.
 */
export default function NotesPage() {
  // Out of the current delivery phase (see `lib/feature-flags`). The sidebar
  // entry is gone, so this only catches a pasted or bookmarked URL — and it
  // sends it somewhere real rather than showing a feature that isn't shipping
  // yet. `redirect` during a Client Component's render is supported and turns
  // into a server-side redirect on a cold load.
  if (!NOTES_ENABLED) redirect("/client-hub");

  return (
    <Suspense fallback={null}>
      <NotesPageInner />
    </Suspense>
  );
}

function NotesPageInner() {
  const clients = useClients();
  const { notes, isLoading } = useNotes();
  // `?note=` opens straight on that note — how the Calendar's reminder pills
  // jump here. Read once at mount (`NotesSplitView` owns selection after
  // that): the hub's own list clicks never touch the URL, so re-reading this
  // on every render would fight the user the moment they pick a different note.
  const initialSelectedId = useSearchParams().get("note");

  if (isLoading) {
    return <p className="type-body-2 text-muted-foreground text-center py-10">Loading notes…</p>;
  }

  // The dashboard shell hands `/notes` a flex-column content area sized to the
  // viewport below the top bar (`isFullHeight` in `page-chrome`), so the split
  // view claims what's left rather than guessing a vh fraction.
  return (
    <NotesSplitView
      notes={notes}
      clients={clients}
      initialSelectedId={initialSelectedId}
      heightClassName="flex-1 min-h-0"
      // Below `xl` the shell drops its padding and its page title for this
      // route (`isMobileFullBleed` in `page-chrome`), so the frame has to go
      // too: rounded corners and a border pressed against the screen edge read
      // as a rendering fault rather than a card.
      //
      // Written as `max-xl:` overrides with `!`, not as `rounded-none
      // xl:rounded-xl`. That form left the corners square at every width: both
      // are 0-1-0 specificity, and `@sarunyu/system-one`'s stylesheet — which
      // ships plain `.rounded-none` and loads after `globals.css` — wins the tie
      // against a Tailwind responsive variant. Same cascade trap `SELECTED_ROW`
      // in `NotesSidebarList` documents.
      surfaceClassName="max-xl:rounded-none! max-xl:border-0!"
    />
  );
}
