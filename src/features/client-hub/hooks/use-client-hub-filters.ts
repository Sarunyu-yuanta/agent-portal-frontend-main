"use client";

import { useMemo, useState } from "react";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { CUSTOMER_COLUMNS } from "@/features/client-hub/components/columns";
import {
  getSortValue,
  getProductSortValue,
  buildProductRows,
} from "@/features/client-hub/lib/client-hub-data";
import { compareBy, useTableSort } from "@/features/client-hub/hooks/use-table-sort";
import type {
  ColumnId,
  ProductSortKey,
  SortKey,
  ViewFilter,
} from "@/features/client-hub/lib/types";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { ProductRow } from "@/types/portfolio";
import { pageCount, pageSlice } from "@/lib/pagination";

/**
 * The Columns menu is remembered as the set of *hidden* columns, not visible
 * ones: an empty preference then means "show everything", which is both the
 * default and what a column added later should do for someone who set their
 * preference before it existed.
 */
const HIDDEN_COLUMNS_PREF = "client-hub:hidden-columns";
const isColumnId = (id: string) => CUSTOMER_COLUMNS.some((c) => c.id === id);

/**
 * The Client Hub's list state: which view is showing, the customer and product
 * searches, column visibility, sorting and pagination — and the rows each of
 * those leaves on screen.
 */
export function useClientHubFilters(clients: Client[]) {
  const t = useT();

  // Customer view
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("customer");
  const [hiddenColumns, setHiddenColumns] = useStoredIds<ColumnId>(HIDDEN_COLUMNS_PREF, isColumnId);
  const visibleColumns = useMemo(
    () => new Set(CUSTOMER_COLUMNS.filter((c) => !hiddenColumns.has(c.id)).map((c) => c.id)),
    [hiddenColumns],
  );

  // Product view
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch, 300);

  const toggleColumn = (id: ColumnId) => {
    if (CUSTOMER_COLUMNS.find((c) => c.id === id)?.required) return;
    const next = new Set(hiddenColumns);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setHiddenColumns(next);
  };

  const tableWidth = useMemo(() => {
    const NO_COL_WIDTH = 60;
    return (
      NO_COL_WIDTH +
      CUSTOMER_COLUMNS.reduce((sum, c) => sum + (visibleColumns.has(c.id) ? c.width : 0), 0)
    );
  }, [visibleColumns]);

  // Sorting moves rows across pages, so start again from the first one.
  const customerSort = useTableSort<SortKey>(() => setCurrentPage(1));
  const productSort = useTableSort<ProductSortKey>();

  const sorted = useMemo(() => {
    let list = clients;

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.tier.toLowerCase().includes(q) ||
          c.riskProfile.toLowerCase().includes(q),
      );
    }

    const { key, dir } = customerSort;
    if (key && dir !== "none") {
      const origIdx = key === "rowIndex" ? new Map(clients.map((c, i) => [c.id, i])) : null;
      list = [...list].sort((a, b) =>
        compareBy(
          origIdx ? (origIdx.get(a.id) ?? 0) : getSortValue(a, key),
          origIdx ? (origIdx.get(b.id) ?? 0) : getSortValue(b, key),
          dir,
        ),
      );
    }

    return list;
  }, [debouncedSearch, customerSort, clients]);

  const originalIndexMap = useMemo(() => new Map(clients.map((c, i) => [c.id, i + 1])), [clients]);

  const totalPages = pageCount(sorted.length, pageSize);
  const safePage = Math.min(currentPage, totalPages);
  const paged = pageSlice(sorted, safePage, pageSize);

  const productRows = useMemo(() => buildProductRows(clients), [clients]);

  /** Row numbers from the unsorted list, so "No." identifies a product, not a position. */
  const productIndexMap = useMemo(
    () => new Map(productRows.map((r, i) => [r.label, i + 1])),
    [productRows],
  );

  const filteredProductRows = useMemo(() => {
    const q = debouncedProductSearch.trim().toLowerCase();
    let list = q ? productRows.filter((r) => r.label.toLowerCase().includes(q)) : productRows;

    const { key, dir } = productSort;
    if (key && dir !== "none") {
      const valueOf = (r: ProductRow) =>
        key === "rowIndex" ? (productIndexMap.get(r.label) ?? 0) : getProductSortValue(r, key, t);
      list = [...list].sort((a, b) => compareBy(valueOf(a), valueOf(b), dir));
    }

    return list;
  }, [productRows, debouncedProductSearch, productSort, productIndexMap, t]);

  return {
    search,
    setSearch,
    debouncedSearch,
    setCurrentPage,
    pageSize,
    setPageSize,
    viewFilter,
    setViewFilter,
    setHiddenColumns,
    visibleColumns,
    productSearch,
    setProductSearch,
    debouncedProductSearch,
    toggleColumn,
    tableWidth,
    customerSort,
    productSort,
    sorted,
    originalIndexMap,
    totalPages,
    safePage,
    paged,
    productIndexMap,
    filteredProductRows,
  };
}
