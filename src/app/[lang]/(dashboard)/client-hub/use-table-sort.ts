"use client";

import { useState } from "react";
import type { SortDir } from "./types";

/**
 * Sort state for one table, in the shape `TableHeaderCell` wants.
 *
 * Both tables on this page drive sorting the same way — a key plus a direction,
 * where clearing the direction clears the key — so they share this instead of
 * keeping two copies that can drift apart.
 *
 * @param onSort Runs after every change. The customer table uses it to return
 *   to page 1, since the row you were looking at is no longer there.
 */
export function useTableSort<K>(onSort?: () => void) {
  const [key, setKey] = useState<K | null>(null);
  const [dir, setDir] = useState<SortDir>("none");

  return {
    key,
    dir,
    /** The direction to show on a header — "none" for every other column. */
    dirFor: (k: K): SortDir => (key === k ? dir : "none"),
    onSortChange: (k: K) => (next: SortDir) => {
      setKey(next === "none" ? null : k);
      setDir(next);
      onSort?.();
    },
  };
}

/** Ascending/descending comparison for two sort values of the same column. */
export function compareBy(
  a: number | string,
  b: number | string,
  dir: SortDir,
): number {
  const cmp = a < b ? -1 : a > b ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}
