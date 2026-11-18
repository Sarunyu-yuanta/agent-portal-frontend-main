"use client";

import { useCallback, useMemo } from "react";
import { useNBAActions } from "@/hooks/use-api";
import { usePrivacy } from "@/contexts/privacy-context";
import { useStoredIds } from "@/hooks/use-stored-ids";
import {
  buildNbaRows,
  isNbaId,
  HIDDEN_NBA_IDS_PREF,
  type NbaRow,
} from "./dashboard-data";

/**
 * The AI's suggested next moves, ranked, with the dismissed ones gone.
 *
 * Every surface that shows these needs the same four pieces wired together —
 * the actions, the privacy flag that masks the names, the dismissal store, and
 * `buildNbaRows` to rank them — and the Dashboard and a client's Overview had
 * each wired their own. That is the shape that lets one of them quietly stop
 * honouring a dismissal, or start masking names the other does not.
 *
 * @param clientId narrows to one client's suggestions. Omit for the whole book.
 * Passing it is what makes the client's own card a filtered view of the
 * Dashboard's rather than a second, separately-derived list.
 */
export function useNbaRows(clientId?: string): {
  rows: NbaRow[];
  /** Clears a suggestion everywhere, since the store behind it is shared. */
  dismiss: (id: string) => void;
} {
  const actions = useNBAActions();
  const { isPrivate } = usePrivacy();
  const [dismissed, setDismissed] = useStoredIds<string>(
    HIDDEN_NBA_IDS_PREF,
    isNbaId,
  );

  const rows = useMemo(
    () =>
      buildNbaRows(actions, isPrivate).filter(
        (row) =>
          !dismissed.has(row.action.id) &&
          (clientId === undefined || row.action.clientId === clientId),
      ),
    [actions, isPrivate, dismissed, clientId],
  );

  const dismiss = useCallback(
    (id: string) => setDismissed(new Set([...dismissed, id])),
    [dismissed, setDismissed],
  );

  return { rows, dismiss };
}
