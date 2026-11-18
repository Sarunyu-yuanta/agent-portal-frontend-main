"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeftIcon, BellIcon, TrashIcon, UserIcon, XIcon } from "@phosphor-icons/react";
import { Tooltip } from "@sarunyu/system-one";
import type { TagVariant } from "@sarunyu/system-one";
import { ClientAvatarStack } from "@/components/ui/client-avatar-stack";
import type { Note } from "@/types/domain";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useClientNames } from "@/hooks/use-client-names";
import { ClientField, ReminderField } from "./NoteAttributeFields";
import { NoteAttributesControl } from "./NoteAttributesControl";
import { NoteEditorFields } from "./NoteEditorFields";
import { formatDateTime, reminderTag, TAG_CHIP_TONE } from "./note-format";

/**
 * A tag that can carry a real icon.
 *
 * `Tag` itself takes `icon` as a *boolean* — it draws a small coloured dot and
 * offers no way to pass a glyph — so the person/bell icons that name these two
 * chips can't go inside one. Sized to `Tag`'s `large` metrics (12px text) rather
 * than `small`: `small` is 9px, which an icon beside it dwarfs.
 */
function SummaryChip({
  icon,
  variant,
  children,
}: {
  icon: ReactNode;
  variant: TagVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-[4px] px-2 py-1 text-xs leading-[20px] whitespace-nowrap ${TAG_CHIP_TONE[variant]}`}
    >
      <span className="shrink-0 flex items-center">{icon}</span>
      {children}
    </span>
  );
}

/**
 * Quiet time after the last keystroke before the note is written back — and
 * therefore also how long before "Saving…" replaces the resting label. Long
 * enough that ordinary typing never shows it; short enough that a pause to think
 * gets the work committed.
 */
const SAVE_DEBOUNCE_MS = 800;

/** How many clients still get a named chip before the row switches to a stack. */
const CLIENT_CHIP_LIMIT = 3;

/**
 * Slots the avatar stack occupies. Past this the last slot stops being a face
 * and becomes a "+N", so the row's width is fixed no matter the count.
 */
const AVATAR_SLOTS = 4;

export function NoteDetailPane({
  note,
  clients,
  pinnedClientId,
  onBack,
  onSave,
  onEmptyChange,
  autoFocusTitle = false,
  layout = "side",
  onDelete,
  onAttributesOpenChange,
  manualSave = false,
  onValuesChange,
}: {
  note: Note;
  /** Selectable clients. The dropdown resolves the current one's name from this. */
  clients: { id: string; name: string }[];
  /**
   * A client this note is pinned to — set when the pane is open on that client's
   * own page. They can't be removed; other clients stay editable. See
   * `ClientField`.
   */
  pinnedClientId?: string | null;
  /** Shown as a back arrow next to the date — mobile drill-in only. */
  onBack?: () => void;
  onSave: (patch: Partial<Note>) => void;
  /**
   * Whether the editor is currently blank. Reported off the live field values
   * rather than the 500ms save debounce below, so the parent never decides to
   * throw the note away based on text the user has already typed.
   */
  onEmptyChange?: (isEmpty: boolean) => void;
  /**
   * Put the caret in the Title field on mount. Set only for a note that was
   * just created, so opening an existing one never steals focus from wherever
   * the user actually is.
   */
  autoFocusTitle?: boolean;
  /**
   * Where the client/reminder fields and the delete button sit.
   *
   * - `side` (default) — fields in a card beside the editor, delete at the top
   *   right. The Notes hub, which is full-width and has room for both, and where
   *   a delete button along the bottom edge would land under the floating New
   *   Note button. Below `xl` there is no room for a column beside the editor,
   *   so the card gives way to the same pill the footer layout uses, above the
   *   editor rather than below it — see the block down there for why.
   * - `footer` — fields behind a pill and delete on one row under the editor.
   *   The drawer on a client's page: ~30vw wide, where a 256px side card would
   *   take a third of the writing area.
   */
  layout?: "side" | "footer";
  onDelete?: () => void;
  /**
   * Fired synchronously whenever the attributes popover opens or closes. The
   * parent drawer uses this to know that "outside" clicks might actually be
   * inside a portal spawned by the popover (e.g. the client `DropdownMultiple`
   * list, which portals to `document.body` rather than staying inside the Radix
   * wrapper the drawer already guards against).
   */
  onAttributesOpenChange?: (open: boolean) => void;
  /** Disable the debounced auto-save. The parent is responsible for saving explicitly. */
  manualSave?: boolean;
  /** Called on every keystroke with the current title and body — lets the parent read values for a manual save. */
  onValuesChange?: (values: { title: string; body: string }) => void;
}) {
  const [title, setTitle] = useState(note.title ?? "");
  const [body, setBody] = useState(note.body);

  // Held here rather than inside the control so the pill can show an active
  // state while its popover is up.
  const [attributesOpen, setAttributesOpen] = useState(false);
  // Bumped by the side card's Clear — the pill's panel keeps its own copy.
  const [attributesReset, setAttributesReset] = useState(0);
  // Matches the `xl` breakpoint the side layout stacks at — the card and the
  // pill have to swap at exactly the point the row becomes a column, or the
  // card ends up alone in a full-width strip above the editor.
  const isNarrow = useMediaQuery("(max-width: 1279px)");

  // The pane is keyed by note id by its callers, so mounting *is* "a note just
  // opened" — no need to diff anything. `preventScroll` because focusing the
  // field is meant to place the caret, not to move the view.
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocusTitle) titleRef.current?.focus({ preventScroll: true });
  }, [autoFocusTitle]);

  // Always the freshest `note`/`onSave` — read inside the debounce timeout
  // below so a save that fires after a chip edit landed merges against that
  // update instead of the snapshot from whenever typing started.
  const latestRef = useRef({ note, onSave, onEmptyChange });
  useEffect(() => {
    latestRef.current = { note, onSave, onEmptyChange };
  });

  /**
   * Nothing written yet. Drives two things, from one place so they can't
   * disagree: the parent's New Note lock / discard-on-leave, and whether the
   * save status is shown at all.
   */
  const blank = title.trim() === "" && body.trim() === "";

  // Not debounced, and read through the ref so a new parent closure doesn't
  // re-fire it: the parent gates its "New Note" button on this, and locks/
  // unlocks it the moment the first character lands.
  useEffect(() => {
    latestRef.current.onEmptyChange?.(blank);
  }, [blank]);

  /**
   * The note's `updatedAt` at the moment a write was kicked off.
   *
   * Keyed on that rather than a plain "saving" boolean cleared by an effect:
   * every save bumps `updatedAt`, so the new value arriving *is* the
   * acknowledgement, and `saving` falls out of comparing the two. A boolean
   * would have needed an effect watching `note.updatedAt` just to switch itself
   * off — mirroring a prop into state, which is exactly what you get told off
   * for, and one more thing that can be left stuck on.
   *
   * Tracking the write rather than "the fields differ from the note" is also
   * what gives the label its delay: the difference is there from the first
   * keystroke, but the write only starts once you've paused, so the debounce
   * below doubles as the quiet period before "Saving…" shows up.
   */
  const [savingFrom, setSavingFrom] = useState<string | null>(null);
  const saving = savingFrom !== null && savingFrom === note.updatedAt;

  // Title and body save together, debounced, rather than independently on
  // blur: two independent saves fired close together (tabbing from Title
  // straight into the body) can resolve out of order, and whichever lands
  // second — still holding the *other* field's old value — clobbers it.
  useEffect(() => {
    if (manualSave) return;
    const timer = setTimeout(() => {
      const { note: current, onSave: save } = latestRef.current;
      const nextTitle = title.trim() || null;
      const patch: Partial<Note> = {};
      if (nextTitle !== current.title) patch.title = nextTitle;
      if (body !== current.body) patch.body = body;
      if (Object.keys(patch).length > 0) {
        setSavingFrom(current.updatedAt);
        save(patch);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [title, body, manualSave]);

  useEffect(() => {
    onValuesChange?.({ title, body });
  }, [title, body, onValuesChange]);

  // Resolved from `clients` rather than taken as a prop — the pane already has
  // the list it feeds the dropdown, so a second `clientName` prop would be the
  // same fact arriving twice and able to disagree with itself. Falls back to the
  // raw id so an unknown client still shows something rather than vanishing.
  //
  // Every client on the note is named, the pinned one included. It was left out
  // on the grounds that you're already on their page — but a note listing only
  // the *other* people reads as though they're the whole story, and the pinned
  // client is the one the note is chiefly about.
  //
  // Pinned first, whatever order `clientIds` happens to be in: the pin guard in
  // `ClientField` re-appends it when the dropdown drops it, so left alone the
  // note's owner would drift to the end of their own chip row.
  const nameFor = useClientNames(clients);
  const clientLabels = [
    ...(pinnedClientId && note.clientIds.includes(pinnedClientId) ? [pinnedClientId] : []),
    ...note.clientIds.filter((id) => id !== pinnedClientId),
  ].map(nameFor);
  const reminder = reminderTag(note);


  return (
    <div className="flex flex-col h-full min-h-0">
      {/* The date is centred with an `absolute` sibling rather than by sitting in
          a flex row: the back arrow only exists on mobile, so flex/grid centring
          would land the date in the middle of the *leftover* space and shift it
          depending on whether the arrow is there. Absolute centring is against
          the pane, which is what "centred" means. */}
      <div className="relative flex shrink-0 items-center justify-center px-4 pt-4 pb-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="absolute left-3 flex items-center justify-center size-7 rounded-lg hover:bg-[var(--bg-default-secondary)] transition-colors text-foreground cursor-pointer"
          >
            <ArrowLeftIcon size={18} />
          </button>
        )}
        {/* Date on top, save status under it — two facts rather than one run-on
            line: when the note was last touched, and that you don't have to do
            anything to keep it that way. */}
        <div className="flex min-w-0 flex-col items-center gap-0.5 px-10">
          <p className="type-caption text-muted-foreground truncate">
            {formatDateTime(note.updatedAt)}
          </p>
          {/* Hidden until something has been written — on a note you've only just
              created there is nothing to have saved, and claiming otherwise is
              untrue.

              `invisible` rather than not rendering it: the line keeps its space,
              so the title and body don't jump up the moment you type the first
              character and back down if you delete it. `visibility: hidden` also
              takes it out of the accessibility tree, so it isn't read out while
              it's saying nothing — which `opacity-0` wouldn't have done. */}
          <p
            // Announced politely so a screen reader hears the status land
            // without being interrupted mid-sentence while typing. Only this
            // line is live — the date above it isn't news.
            aria-live="polite"
            // Green at rest, plain grey while in flight: the colour is there to
            // confirm, and there's nothing to confirm until the write lands.
            className={`type-caption truncate ${
              blank || manualSave
                ? "invisible"
                : saving
                  ? "text-muted-foreground"
                  : "text-[var(--text-success-primary)]"
            }`}
          >
            {/* "Auto saved" rather than "Saved": the job of the resting state
                is to say there is no Save button to look for, which past tense
                alone doesn't. */}
            {saving ? "Saving…" : "Auto saved"}
          </p>
        </div>
        {layout === "side" && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete note"
            className="absolute right-3 flex items-center justify-center size-7 rounded-lg hover:bg-[var(--bg-default-secondary)] transition-colors text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <TrashIcon size={16} />
          </button>
        )}
      </div>

      <div
        className={`flex flex-1 min-h-0 flex-col overflow-y-auto px-4 py-4 ${
          layout === "side" ? "gap-4 xl:flex-row xl:gap-6" : ""
        }`}
      >
        <div className="order-2 flex min-w-0 flex-1 flex-col gap-2 xl:order-1">
          {/* What's been picked, restated above the title — read-only. The
              control is where you change it; this is the note saying what it is,
              in full names and with the reminder's urgency colour, which the
              pill can't fit.
              Renders nothing when neither is set, so an untouched note keeps a
              clean top edge.

              Dropped entirely on a phone. There the control *is* the pill, sat
              directly above this, already showing the same faces and the same
              date — two rows of chips restating the row above them is a third of
              the screen spent saying it twice. The trade is full names for
              initials, which is what tapping the pill is for. */}
          {!isNarrow && (clientLabels.length > 0 || reminder) && (
            /* `mb-2` on top of the column's `gap-2`, so the summary sits 16px
               clear of the title without also loosening the title-to-body gap
               that raising the column's own `gap` would have. */
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {/* Up to three clients get a chip each — names are the useful
                  thing and they fit. Past that the chips wrapped onto a second
                  and third row and pushed the title down the page, so the stack
                  takes over: it stays one row at any count, and `AvatarStack`
                  folds the overflow into its own "+N". The names aren't lost,
                  just moved to the tooltip.
                  `blue` on the chips, and the reminder's scheduled state moved
                  to green to trade with it (see `reminderTag`). Blue is now the
                  client's alone: the reminder's remaining variants are yellow
                  due today, red overdue and gray done, so the two can never end
                  up the same colour beside each other. */}
              {clientLabels.length > CLIENT_CHIP_LIMIT ? (
                <ClientAvatarStack names={clientLabels} slots={AVATAR_SLOTS} size="large" />
              ) : (
                clientLabels.map((label) => (
                  <SummaryChip key={label} variant="blue" icon={<UserIcon size={12} />}>
                    {label}
                  </SummaryChip>
                ))
              )}
              {reminder && (
                <SummaryChip variant={reminder.variant} icon={<BellIcon size={12} />}>
                  {reminder.label}
                </SummaryChip>
              )}
            </div>
          )}
          <NoteEditorFields
            titleRef={titleRef}
            title={title}
            body={body}
            onTitleChange={setTitle}
            onBodyChange={setBody}
          />
        </div>

        {/* Side layout: the fields get a column of their own beside the editor.
            `sticky` keeps them at the top while a long note scrolls past.
            `xl:` only — below that the pill takes over and there is no column
            to stick. Editor first in the DOM
            either way, so tabbing starts where you type. */}
        {/* `order-1` under `md`, so this sits *above* the editor when the row
            stacks into a column.

            Not cosmetic. `DropdownMultiple` and `DateInput` position their
            panels `fixed`, below the field, with no flip and no viewport clamp —
            the design system offers no prop for either. Under the editor these
            controls land at the bottom of the pane, and opening the client list
            pushed ~300px of it off the screen with no way to reach it. Above the
            editor there is a whole pane's worth of room underneath, and the
            problem stops existing rather than being worked around.

            Order, not DOM position: the editor stays first in the markup, so tab
            order still starts where you type. `xl:order-1/2` restores the
            desktop arrangement, where the two are side by side anyway. */}
        {layout === "side" && (
          <div className="order-1 shrink-0 xl:order-2 xl:w-80 xl:sticky xl:top-0 xl:self-start">
            {isNarrow ? (
              /* The pill, not the card, on a phone: the card is a 256px block of
                 chrome above the note, and the two fields it holds are usually
                 both off. Same control the composer and the footer layout use,
                 so filing a note is one thing wherever you meet it. Opens
                 downward here — it is at the top of the pane, and its fields
                 need the room below (see the note above). */
              <div className="flex">
                <NoteAttributesControl
                  clientIds={note.clientIds}
                  clients={clients}
                  pinnedClientId={pinnedClientId}
                  reminderAt={note.reminderAt}
                  side="bottom"
                  open={attributesOpen}
                  onOpenChange={(open) => {
                    setAttributesOpen(open);
                    onAttributesOpenChange?.(open);
                  }}
                  onClientIdsChange={(clientIds) => onSave({ clientIds })}
                  onReminderChange={(reminderAt) => onSave({ reminderAt, reminderDone: false })}
                  onClear={() => onSave({ clientIds: [], reminderAt: null, reminderDone: false })}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 shadow-md">
                {/* The same Clear the pill's panel carries, in the same
                    top-right spot. This card is the desktop face of that panel
                    and had been missed when Clear was added — leaving the one
                    place with the most room the only one you couldn't reset
                    from. `resetToken` because the fields own their on/off state;
                    see `useResetToggle`. */}
                {(note.clientIds.length > 0 || note.reminderAt) && (
                  <button
                    type="button"
                    onClick={() => {
                      onSave({ clientIds: [], reminderAt: null, reminderDone: false });
                      setAttributesReset((k) => k + 1);
                    }}
                    className="-mb-1 flex items-center gap-1.5 self-end rounded-lg px-2 py-1 type-caption text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-default-secondary)]! hover:text-foreground"
                  >
                    <XIcon size={12} weight="bold" className="shrink-0" />
                    Clear
                  </button>
                )}
                <ClientField
                  resetToken={attributesReset}
                  clientIds={note.clientIds}
                  clients={clients}
                  pinnedClientId={pinnedClientId}
                  onChange={(clientIds) => onSave({ clientIds })}
                />
                <span className="h-px bg-border" />
                <ReminderField
                  resetToken={attributesReset}
                  reminderAt={note.reminderAt}
                  onChange={(reminderAt) => onSave({ reminderAt, reminderDone: false })}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer layout: attributes left, delete right, one row. The same pill the
          quick-note composer uses, so the control for filing a note is one thing
          wherever you meet it. Delete sits at the far end because it's the one
          action here you can't undo. The `border-t` is what separates it from the
          writing area; the strip itself takes the pane's own background. */}
      {layout === "footer" && (
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border px-4 py-3">
        <NoteAttributesControl
          clientIds={note.clientIds}
          clients={clients}
          pinnedClientId={pinnedClientId}
          reminderAt={note.reminderAt}
          open={attributesOpen}
          onOpenChange={(open) => {
            setAttributesOpen(open);
            onAttributesOpenChange?.(open);
          }}
          onClientIdsChange={(clientIds) => onSave({ clientIds })}
          onReminderChange={(reminderAt) => onSave({ reminderAt, reminderDone: false })}
          onClear={() => onSave({ clientIds: [], reminderAt: null, reminderDone: false })}
        />
        <Tooltip content="Delete note" side="top">
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete note"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-default-secondary)] text-muted-foreground transition-colors cursor-pointer hover:bg-[var(--bg-danger-light)] hover:text-destructive"
          >
            <TrashIcon size={16} />
          </button>
        </Tooltip>
      </div>
      )}
    </div>
  );
}
