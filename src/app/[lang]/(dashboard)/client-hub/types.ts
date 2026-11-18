/** UI-only view types for the Client Hub page. Domain shapes live in @/types/domain. */

export type ViewFilter = "customer" | "product" | "nine-box";

export type SortDir = "none" | "asc" | "desc";

export type SortKey =
  | "rowIndex"
  | "id"
  | "name"
  | "aum"
  | "thaiStock"
  | "foreignStock"
  | "derivatives"
  | "mutualFund"
  | "bond"
  | "foreignBond"
  | "structuredBond"
  | "plYtd"
  | "liabilities"
  | "cashIdle"
  | "nineBox"
  | null;

/** Sortable columns of the Product tab's table. */
export type ProductSortKey =
  | "rowIndex"
  | "label"
  | "clientCount"
  | "totalAmountThb"
  | "avgAllocationPct"
  | null;

export type ColumnId =
  | "clientId"
  | "client"
  | "aum"
  | "thaiStock"
  | "foreignStock"
  | "derivatives"
  | "mutualFund"
  | "bond"
  | "foreignBond"
  | "structuredBond"
  | "cashIdle"
  | "plYtd"
  | "liabilities"
  | "nineBox";
