/** Number of pages for `total` items — never less than 1, so "page 1 of 1" holds for an empty list. */
export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** The items on 1-based `page`. */
export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
