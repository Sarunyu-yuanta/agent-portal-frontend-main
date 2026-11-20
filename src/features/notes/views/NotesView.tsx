"use client";

import { useLocale } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

import { Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { useNotes } from "@/features/notes/store/notes-context";
import { NOTES_ENABLED } from "@/config/feature-flags";
import { NotesSplitView } from "@/features/notes/components/NotesSplitView";
import { Skeleton } from "@/components/ui/skeleton";
import { useClients } from "@/features/clients/hooks/use-clients";

/**
 * The full note history — every note the RM has written, client-linked or
 * general. Client 360's Notes tab is the same data filtered to one client;
 * this page is where general (non-client) notes actually live.
 */
export function NotesView() {
  const locale = useLocale();
  // Out of the current delivery phase (see `lib/feature-flags`). The sidebar
  // entry is gone, so this only catches a pasted or bookmarked URL — and it
  // sends it somewhere real rather than showing a feature that isn't shipping
  // yet. `redirect` during a Client Component's render is supported and turns
  // into a server-side redirect on a cold load.
  if (!NOTES_ENABLED) redirect(localizePath("/client-hub", locale));

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
    return <NotesPageSkeleton />;
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
      // The shell gives `/notes` no padding at any size (`isEdgeToEdge` in
      // `page-chrome`), so the frame goes too: rounded corners and a border
      // pressed against the content edge read as a rendering fault. `!` because
      // `@sarunyu/system-one` ships plain `.rounded-xl`/`.border` that load
      // after `globals.css` — see `SELECTED_ROW` in `NotesSidebarList`.
      surfaceClassName="rounded-none! border-0!"
    />
  );
}

/**
 * Mirrors `NotesSplitView` at rest: the same framed box, the 280px sidebar
 * (search, New Note, the All/Clients/Reminders switch, a few note rows) and the
 * detail pane's centered empty state. Below md the split view shows only the
 * sidebar, so the detail column drops out here too.
 */
function NotesPageSkeleton() {
  return (
    <div aria-busy="true" className="flex min-h-0 flex-1 overflow-hidden bg-card">
      <div className="flex w-full shrink-0 flex-col md:w-[280px]! md:border-r md:border-border">
        <div className="flex flex-col gap-2 p-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
        <div className="px-3 pb-2">
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-1 pt-3">
          <Skeleton className="mx-4 mb-1 h-4 w-20" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="mx-2 flex flex-col gap-1.5 px-2.5 py-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      <div className="hidden min-w-0 flex-1 flex-col items-center justify-center gap-3 md:flex">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-1 h-9 w-32 rounded-lg" />
      </div>
    </div>
  );
}
