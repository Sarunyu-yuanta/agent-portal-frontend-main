import { CALL_LOG_DATA, type CallLogEntry } from "@/data/call-log-data";
import { maskName } from "@/lib/mask-name";
import type { Client } from "@/types/domain";

/**
 * Every logged call across the whole book, newest first.
 *
 * A client's own Call Log tab answers "what have I said to this person". This
 * is the other half of that question — "what has the desk been doing" — and it
 * is the only place in the app that asks it, since nothing else reads more than
 * one client's log at a time.
 */
export type CallLogRow = {
  /** `CallLogEntry.id` is only unique within a client (`c1` repeats), so the
   *  key has to carry the client too. */
  id: string;
  clientId: string;
  /** Masked when privacy mode is on. */
  clientName: string;
  entry: CallLogEntry;
  /** `entry.date` parsed, for sorting. */
  at: Date;
};

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

/** `"14 Jul 2026"` plus `"10:30"` as a sortable instant. The date format is the
 *  display string the mock ships; a real feed would send a timestamp and this
 *  goes away. */
function entryDate(entry: CallLogEntry): Date {
  const [d, m, y] = entry.date.split(" ");
  const [hh, mm] = entry.time.split(":");
  return new Date(Number(y), MONTHS[m] ?? 0, Number(d), Number(hh) || 0, Number(mm) || 0);
}

/**
 * The merged feed.
 *
 * Reads `CALL_LOG_DATA` directly rather than `getCallLogs`. That helper falls
 * back to a shared `DEFAULT_LOGS` for the three clients who have no entries —
 * fine on a client's own page, where it stands in for "no history yet", and
 * wrong here: merging through it would print the same four invented calls three
 * times over, under three different names, as though they had happened. A
 * client with no logged calls simply does not appear.
 */
export function buildCallLog(clients: Client[], isPrivate: boolean): CallLogRow[] {
  const nameById = new Map(clients.map((c) => [c.id, c.name]));

  return Object.entries(CALL_LOG_DATA)
    .flatMap(([clientId, entries]) =>
      entries.map((entry) => ({
        id: `${clientId}:${entry.id}`,
        clientId,
        clientName: maskName(nameById.get(clientId) ?? clientId, isPrivate),
        entry,
        at: entryDate(entry),
      })),
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime());
}
