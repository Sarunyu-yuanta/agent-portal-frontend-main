import { useMemo } from "react";

/**
 * `clientId → name` lookup, falling back to the raw id for an unknown client.
 *
 * The returned function is itself memoized, not just the `Map` backing it —
 * a caller that lists this in a dependency array (e.g. a search filter's
 * `useMemo`) needs a stable reference across renders, or it recomputes every
 * time regardless of whether `clients` actually changed.
 */
export function useClientNames(clients: { id: string; name: string }[]) {
  const nameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients]);
  return useMemo(() => (id: string) => nameById.get(id) ?? id, [nameById]);
}
