"use client";

import { useState } from "react";
import { BottomSheet, Button, Popover } from "@sarunyu/system-one";
import { BellIcon, SlidersHorizontalIcon, XIcon } from "@phosphor-icons/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useClientNames } from "@/hooks/use-client-names";
import { ClientAvatarStack } from "@/components/ui/client-avatar-stack";
import { ClientField, ReminderField } from "./NoteAttributeFields";
import { formatDayOnly } from "./note-format";

/**
 * The pill that reads out a note's client and reminder, and opens the fields for
 * changing them.
 *
 * Shared by the quick-note composer and the detail pane so the two are the same
 * control rather than two that happen to look alike. The `open` state is the
 * caller's: the composer needs to know when this is up so its own Escape
 * handling can defer to it.
 *
 * Nesting this popover inside another one works — Radix guards
 * `onPointerDownOutside` with a flag set from `onPointerDownCapture`, and React's
 * synthetic events propagate through the React tree, portals included. This
 * content is a React child of whatever opened it, so a click in here counts as
 * "inside" that layer and it stays open. `modal` is false by default too, so
 * there are no duelling focus traps.
 */
export function NoteAttributesControl({
  clientIds,
  clients,
  pinnedClientId,
  reminderAt,
  open,
  onOpenChange,
  onClientIdsChange,
  onReminderChange,
  onClear,
  side = "top",
}: {
  clientIds: string[];
  clients: { id: string; name: string }[];
  /** A client that can't be removed — see `ClientField`. */
  pinnedClientId?: string | null;
  reminderAt: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientIdsChange: (next: string[]) => void;
  onReminderChange: (next: string | null) => void;
  /**
   * Wipes both in one write.
   *
   * Not `onClientIdsChange([])` followed by `onReminderChange(null)`: in the
   * detail pane each of those is a save, both fire in the same tick, and both
   * merge their patch onto the same snapshot of the note — so whichever lands
   * second puts the other one's field back. One instruction, one write.
   */
  onClear: () => void;
  /**
   * Which way the panel opens. `top` suits the two callers that sit in a bottom
   * corner; the detail pane puts this at the top of the pane on a phone and
   * needs `bottom`.
   *
   * It matters more than a popover's side usually does, because the fields
   * inside open panels of their own — `DropdownMultiple` and `DateInput` place
   * theirs `fixed` below the field with no flip and no viewport clamp. Whichever
   * way this opens has to leave room underneath for those.
   */
  side?: "top" | "bottom";
}) {
  const nothingSet = clientIds.length === 0 && !reminderAt;
  const isMobile = useMediaQuery("(max-width: 767px)");
  const nameFor = useClientNames(clients);
  // Bumped by Clear. The fields hold their own on/off state, so emptying the
  // values is only half of it — see `useResetToggle` in `NoteAttributeFields`.
  const [resetKey, setResetKey] = useState(0);

  const fields = (
        <div className={`flex flex-col gap-3 ${isMobile ? "w-full" : "w-64"}`}>
          {/* Popover only. The sheet has a real header with an action slot and
              uses that instead — same position, but the design system's own
              furniture rather than a button drawn to look like it. A popover has
              no header to put one in, so here it stays inline, top right, where
              a filter panel's reset goes. */}
          {!isMobile && !nothingSet && (
            <button
              type="button"
              onClick={() => {
                onClear();
                setResetKey((k) => k + 1);
              }}
              className="-mb-1 flex items-center gap-1.5 self-end rounded-lg px-2 py-1 type-caption text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
            >
              <XIcon size={12} weight="bold" className="shrink-0" />
              Clear
            </button>
          )}

          <ClientField
            resetToken={resetKey}
            clientIds={clientIds}
            clients={clients}
            pinnedClientId={pinnedClientId}
            onChange={onClientIdsChange}
          />
          <span className="h-px bg-border" />
          <ReminderField
            resetToken={resetKey}
            reminderAt={reminderAt}
            onChange={onReminderChange}
          />
        </div>
  );

  const trigger = (
      <button
        type="button"
        // `rounded-full` + a standing grey fill, so it reads as a control sitting
        // there rather than something that only appears on hover.
        className={`flex min-w-0 shrink items-center gap-2 rounded-full bg-[var(--bg-default-secondary)] px-3 py-1.5 type-caption transition-colors cursor-pointer hover:bg-[var(--bg-default-tertiary)] hover:text-foreground ${
          open ? "bg-[var(--bg-default-tertiary)] text-foreground" : "text-muted-foreground"
        }`}
      >
        <SlidersHorizontalIcon size={16} className="shrink-0" />
        {nothingSet ? (
          <span>Client, reminder</span>
        ) : (
          <>
            <ClientAvatarStack
              names={clientIds.map(nameFor)}
              slots={3}
              size="small"
            />
            {reminderAt && (
              // The faces say "client" on their own; a bare date doesn't say
              // "reminder", so it gets the bell to name it.
              <span className="flex items-center gap-1 truncate">
                <BellIcon size={14} className="shrink-0" />
                {formatDayOnly(reminderAt)}
              </span>
            )}
          </>
        )}
      </button>
  );

  /**
   * A sheet on a phone, a popover above it — the design system's `BottomSheet`,
   * same as every other sheet in the app.
   *
   * It takes one thing to make that possible. `BottomSheet` is a vaul `Drawer`
   * and never forwards `modal`, so it is always modal, and a modal drawer parks
   * `pointer-events: none` on `<body>`. The fields in here open panels that
   * portal *to* `<body>` — `DropdownMultiple`, `DateInput` — so they inherit it
   * and render in full while refusing every click. The fix is one line beside
   * the scroll rule those panels already needed, in `globals.css`:
   * `pointer-events: auto`. See it there.
   */
  if (isMobile) {
    return (
      <>
        <span className="contents" onClick={() => onOpenChange(true)}>
          {trigger}
        </span>
        {/* Clear rides the sheet's own header action rather than a button of
            ours inside the content. Same place it would have been drawn, but it
            inherits the design system's header metrics and styling, and there is
            one less hand-made lookalike in the app.

            `rightSide` goes to "none" when there is nothing set, so the slot
            empties instead of offering an action that would do nothing.

            The title repeats the pill's own label — you tap "Client, reminder"
            and the sheet says the same words back. */}
        <BottomSheet
          open={open}
          onOpenChange={onOpenChange}
          showHeader
          headerType="text"
          title="Client, reminder"
          rightSide={nothingSet ? "none" : "action"}
          // `BottomSheet` gives its content `pt-2`, which leaves the first
          // switch sitting almost on the title. `contentClassName` goes through
          // `cn`, so this replaces that padding rather than adding to it.
          contentClassName="pt-5"
          actionLabel="Clear"
          onActionClick={() => {
            onClear();
            setResetKey((k) => k + 1);
          }}
        >
          <div className="flex min-h-[calc(var(--vh)*62)] flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {fields}
            <Button
              variant="primary"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="mt-auto w-full justify-center"
            >
              Done
            </Button>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange} side={side} align="start" content={fields}>
      {trigger}
    </Popover>
  );
}
