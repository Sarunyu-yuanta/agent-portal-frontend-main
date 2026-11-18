"use client";

import { useEffect, useState, type ReactNode } from "react";
import { BellIcon, UserIcon } from "@phosphor-icons/react";
import { Alert, DateInput, DropdownMultiple, Toggle } from "@sarunyu/system-one";
import { defaultReminderDate, reminderAtFromDate } from "./note-format";

/**
 * The two things a note carries besides its text.
 *
 * Both take a plain value and an `onChange` rather than a `Note` and a save
 * callback, so they work the same on a note that exists (the detail pane, where
 * every change is a save) and on one that doesn't yet (the quick-note dialog,
 * where they edit a draft until it's submitted).
 */

/**
 * Switches the field back off when the caller's Clear is pressed.
 *
 * A token rather than remounting the field on a `key`, and rather than deriving
 * the switch from the value. Both of those were tried:
 *
 * - Deriving `enabled` from `clientIds.length > 0` loses a real state — Client
 *   switched on with nobody picked yet, which is where you are for the second
 *   between opening the field and choosing someone.
 * - Remounting on a key reads the values back at the moment of the reset, and
 *   the reset is what *causes* them to change. The save is a round trip, so the
 *   fresh mount initialises from the old values and the switch springs back on.
 *
 * A token doesn't ask what the values are. It says what happened.
 */
function useResetToggle(token: number | undefined, off: () => void) {
  useEffect(() => {
    // `0` is the initial value, so mounting isn't a reset.
    if (token) off();
    // Only the token: `off` is a fresh closure every render, and re-running on
    // that would switch the field off the moment anything else changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);
}

/** Small icon + text heading above each control. */
function FieldLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 type-body-2 text-muted-foreground">
      <span className="shrink-0 flex items-center">{icon}</span>
      {children}
    </span>
  );
}

export function ClientField({
  clientIds,
  clients,
  pinnedClientId,
  onChange,
  resetToken,
}: {
  clientIds: string[];
  clients: { id: string; name: string }[];
  /**
   * A client that can't be taken off the note — set when this is open on that
   * client's own page.
   *
   * The other clients are still editable, because it's the same note either way
   * and a conversation that turns out to involve someone else shouldn't send you
   * to a different screen to say so. Only this one is held: the client page
   * filters its notes by `clientIds.includes(...)`, so dropping it would make
   * the note vanish off the wall and close the panel you were typing in.
   */
  pinnedClientId?: string | null;
  onChange: (next: string[]) => void;
  resetToken?: number;
}) {
  // Before the early return below, so the hook order can't shift with the props.
  const [enabled, setEnabled] = useState(clientIds.length > 0);
  useResetToggle(resetToken, () => setEnabled(false));

  // No "General note (no client)" entry — the switch is what says general, so
  // leaving it in the list would be a second way to say the same thing, and the
  // two could disagree.
  const options = clients.map((c) => ({ label: c.name, value: c.id }));

  if (pinnedClientId) {
    const pinnedName =
      clients.find((c) => c.id === pinnedClientId)?.name ?? pinnedClientId;
    return (
      <div className="flex flex-col gap-1.5">
        {/* No switch here: the note always has at least the pinned client, so
            there is no "general note" state to toggle into. */}
        <FieldLabel icon={<UserIcon size={16} />}>Client</FieldLabel>
        <DropdownMultiple
          placeholder="Select clients"
          value={clientIds}
          options={options}
          onChange={(next) =>
            onChange(next.includes(pinnedClientId) ? next : [...next, pinnedClientId])
          }
        />
        <Alert status="information" message={`${pinnedName} stays on this note`} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Toggle
        size="sm"
        checked={enabled}
        onChange={(next) => {
          setEnabled(next);
          // Switching off is a complete instruction, so it reports. Switching on
          // isn't: unlike the reminder, where tomorrow is a fair default, there
          // is no sensible default client to pick on someone's behalf — so the
          // note stays general until at least one is actually chosen.
          if (!next) onChange([]);
        }}
        label={<FieldLabel icon={<UserIcon size={16} />}>Client</FieldLabel>}
      />
      {enabled && (
        <DropdownMultiple
          placeholder="Select clients"
          value={clientIds}
          options={options}
          onChange={onChange}
        />
      )}
    </div>
  );
}

export function ReminderField({
  reminderAt,
  onChange,
  resetToken,
}: {
  reminderAt: string | null;
  onChange: (next: string | null) => void;
  resetToken?: number;
}) {
  const [date, setDate] = useState<Date | undefined>(
    reminderAt ? new Date(reminderAt) : undefined,
  );
  /**
   * The switch's own state rather than `Boolean(reminderAt)`, so it responds to
   * the click itself instead of waiting on a round trip through the note.
   */
  const [enabled, setEnabled] = useState(Boolean(reminderAt));
  // The date goes too, not just the switch: it is kept across an off/on so a
  // date you chose survives a mis-tap, and Clear is the one gesture that means
  // you don't want it back.
  useResetToggle(resetToken, () => {
    setEnabled(false);
    setDate(undefined);
  });

  return (
    <div className="flex flex-col gap-1.5">
      <Toggle
        size="sm"
        checked={enabled}
        onChange={(next) => {
          setEnabled(next);
          if (!next) {
            onChange(null);
            return;
          }
          // Switching on lands on tomorrow when nothing is set yet, so the
          // reminder is real from the first click and the date is there to
          // adjust rather than to supply. Keeps any date already chosen.
          const target = date ?? defaultReminderDate();
          setDate(target);
          onChange(reminderAtFromDate(target));
        }}
        label={<FieldLabel icon={<BellIcon size={16} />}>Reminder</FieldLabel>}
      />
      {enabled && (
        <DateInput
          placeholder="Date"
          value={date}
          onChange={(next) => {
            setDate(next);
            // Clearing the field clears the reminder too. Otherwise the note
            // keeps one the empty input says isn't there.
            onChange(next ? reminderAtFromDate(next) : null);
          }}
        />
      )}
    </div>
  );
}
