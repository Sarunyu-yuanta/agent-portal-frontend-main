"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { TabGroup, SearchInput, Pagination } from "@sarunyu/system-one";
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { useClientsResource, useHasLoaded } from "@/hooks/use-api";
import { usePrivacy } from "@/contexts/privacy-context";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { setQueryState } from "@/lib/query-state";
import { recordVisit } from "@/lib/nav-memory";
import { useStoredIds } from "@/hooks/use-stored-ids";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { FadeIn } from "@/components/ui/fade-in";
import { NineBoxTab, type NineBoxCellInfo } from "./NineBoxTab";
import { ColumnVisibilityMenu } from "./ColumnVisibilityMenu";
import { CUSTOMER_COLUMNS } from "./columns";
import { getSortValue, getProductSortValue, buildProductRows } from "./client-hub-data";
import { compareBy, useTableSort } from "./use-table-sort";
import { ClientSummaryCards } from "./ClientSummaryCards";
import { CustomerTable } from "./CustomerTable";
import { ProductTable } from "./ProductTable";
import { ProductDetailDrawer } from "./ProductDetailDrawer";
import { NineBoxCellDrawer } from "./NineBoxCellDrawer";
import { ClientDetailPanel } from "./ClientDetailPanel";
import type { ColumnId, ProductSortKey, SortKey, ViewFilter } from "./types";
import type { Client, ProductRow } from "@/types/domain";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * The Columns menu is remembered as the set of *hidden* columns, not visible
 * ones: an empty preference then means "show everything", which is both the
 * default and what a column added later should do for someone who set their
 * preference before it existed.
 */
const HIDDEN_COLUMNS_PREF = "client-hub:hidden-columns";
const isColumnId = (id: string) => CUSTOMER_COLUMNS.some((c) => c.id === id);

/**
 * Whether a press landed on a client row in the customer table — the one kind
 * of "outside" press the open quick-view panel must not treat as a dismissal.
 * The attribute is set in `CustomerTable`; matched with `closest` because the
 * press lands on a cell's contents, not the row itself.
 */
function isClientRowPress(event: Event): boolean {
  const target = event.target;
  return target instanceof Element && target.closest("[data-client-row]") !== null;
}

/**
 * A `SearchInput` paired with the spinner that marks "typed, not yet applied" —
 * i.e. `value` has moved on but the debounced value the list actually filters
 * on hasn't caught up yet.
 */
function DebouncedSearchField({
  className,
  inputClassName,
  placeholder,
  value,
  debouncedValue,
  onChange,
  onClear,
}: {
  className: string;
  inputClassName?: string;
  placeholder: string;
  value: string;
  debouncedValue: string;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 min-w-0">
        <SearchInput
          size="sm"
          className={inputClassName}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onClear={onClear}
        />
      </div>
      {value !== debouncedValue && (
        <CircleNotchIcon size={16} className="shrink-0 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}

export default function ClientHubPage() {
  return (
    <Suspense fallback={null}>
      <ClientHubPageInner />
    </Suspense>
  );
}

function ClientHubPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: clients, isLoading } = useClientsResource();
  const hasLoaded = useHasLoaded(isLoading);
  const { isPrivate } = usePrivacy();

  // Customer view
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("customer");
  const [hiddenColumns, setHiddenColumns] = useStoredIds<ColumnId>(
    HIDDEN_COLUMNS_PREF,
    isColumnId,
  );
  const visibleColumns = useMemo(
    () =>
      new Set(
        CUSTOMER_COLUMNS.filter((c) => !hiddenColumns.has(c.id)).map((c) => c.id),
      ),
    [hiddenColumns],
  );

  // Product view
  const [productSearch, setProductSearch] = useState("");
  const debouncedProductSearch = useDebouncedValue(productSearch, 300);


  // Client quick view — URL-owned (`?client=110001`) so refresh, browser back
  // and a shared link all land on the same open panel. The one place that
  // *doesn't* reconstruct it is a return from that client's Full Profile: see
  // `goToProfile`, which clears the param out of the entry it leaves behind.
  const clientParam = searchParams.get("client");
  const selectedClient =
    (clientParam && clients.find((c) => c.id === clientParam)) || null;
  const drawerOpen = !!selectedClient;
  // The drawer animates out after the param is gone — keep the last client
  // around so it slides away with content instead of collapsing to blank.
  const [panelClient, setPanelClient] = useState<Client | null>(selectedClient);
  if (selectedClient && selectedClient !== panelClient) setPanelClient(selectedClient);
  // Only rewind history if we're the ones who pushed the panel onto it —
  // arriving straight on `?client=…` must not bounce out of the app.
  const pushedPanelRef = useRef(false);

  // Drawers
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [nineBoxCell, setNineBoxCell] = useState<NineBoxCellInfo | null>(null);
  const [nineBoxDrawerOpen, setNineBoxDrawerOpen] = useState(false);

  const toggleColumn = (id: ColumnId) => {
    if (CUSTOMER_COLUMNS.find((c) => c.id === id)?.required) return;
    const next = new Set(hiddenColumns);
    if (next.has(id)) next.delete(id); else next.add(id);
    setHiddenColumns(next);
  };

  const tableWidth = useMemo(() => {
    const NO_COL_WIDTH = 60;
    return NO_COL_WIDTH + CUSTOMER_COLUMNS.reduce(
      (sum, c) => sum + (visibleColumns.has(c.id) ? c.width : 0),
      0,
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
      const origIdx = key === "rowIndex"
        ? new Map(clients.map((c, i) => [c.id, i]))
        : null;
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

  const originalIndexMap = useMemo(
    () => new Map(clients.map((c, i) => [c.id, i + 1])),
    [clients],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const productRows = useMemo(() => buildProductRows(clients), [clients]);

  /** Row numbers from the unsorted list, so "No." identifies a product, not a position. */
  const productIndexMap = useMemo(
    () => new Map(productRows.map((r, i) => [r.label, i + 1])),
    [productRows],
  );

  const filteredProductRows = useMemo(() => {
    const q = debouncedProductSearch.trim().toLowerCase();
    let list = q
      ? productRows.filter((r) => r.label.toLowerCase().includes(q))
      : productRows;

    const { key, dir } = productSort;
    if (key && dir !== "none") {
      const valueOf = (r: ProductRow) =>
        key === "rowIndex"
          ? (productIndexMap.get(r.label) ?? 0)
          : getProductSortValue(r, key);
      list = [...list].sort((a, b) => compareBy(valueOf(a), valueOf(b), dir));
    }

    return list;
  }, [productRows, debouncedProductSearch, productSort, productIndexMap]);

  function openClient(client: Client) {
    const href = `/client-hub?client=${encodeURIComponent(client.id)}`;
    // Row-to-row within an already-open panel swaps the view rather than
    // stacking history entries the user would have to unwind one by one.
    if (drawerOpen) {
      setQueryState(href, "replace");
    } else {
      pushedPanelRef.current = true;
      setQueryState(href, "push");
    }
  }

  function closeClient() {
    // Back only rewinds the entry we added; landing directly on `?client=…`
    // (refresh, shared link, session restore) must not bounce out of the app.
    if (pushedPanelRef.current) {
      pushedPanelRef.current = false;
      router.back();
    } else {
      setQueryState("/client-hub", "replace");
    }
  }

  /**
   * Leaves for a client's Full Profile — and makes sure the entry we leave
   * behind doesn't hold `?client=…`, so coming back lands on the list with
   * nothing over it. The profile is the deeper view of the same client the
   * panel was previewing; finding the preview still stacked on top of the list
   * on the way back is just something to dismiss.
   */
  const goToProfile = (clientId: string, tab?: string) => {
    const href = tab ? `/client/${clientId}?tab=${tab}` : `/client/${clientId}`;

    if (clientParam) {
      // Two things remember the panel, and both have to forget it — browser
      // back reads the history entry, while the profile's own "Client 360"
      // breadcrumb (and the sidebar entry, coming from another section) reads
      // the section trail. Clearing only the first left the breadcrumb still
      // pointing at `?client=…`.
      //
      // Both writes are synchronous — `setQueryState` is `history.replaceState`
      // and `recordVisit` is a `sessionStorage` write — so they land before the
      // navigation below instead of racing `NavStateMemory`'s effect, which may
      // never run for a URL we leave in the same tick. `recordVisit` is
      // idempotent, so it doesn't matter if that effect fires anyway.
      setQueryState("/client-hub", "replace");
      recordVisit("/client-hub", "/client-hub");
    }

    if (pushedPanelRef.current) {
      // We pushed the panel's entry, so spend it on the profile rather than
      // stacking on top: back then goes to the `/client-hub` entry from before
      // the panel opened. Replacing is also what keeps the strip above from
      // leaving two identical `/client-hub` entries to click through.
      pushedPanelRef.current = false;
      router.replace(href);
    } else {
      // The param came from the URL the user arrived on (a refresh with the
      // panel open, a pasted link), so there's no earlier entry to fall back to
      // — the same case `closeClient` guards. The stripped entry above becomes
      // the way back instead.
      router.push(href);
    }
  };

  return (
    <>
      {/* Hero — own padding + max-width */}
      <div className="pt-4 pb-2 xl:pt-6 xl:pb-2">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-6 flex flex-col gap-4">
          <ClientSummaryCards clients={clients} isLoading={isLoading} />
        </div>
      </div>

      {/* White section — full-width background, content constrained to max-w */}
      <section className="flex-1 bg-white rounded-t-[16px] xl:rounded-t-2xl">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-6 flex flex-col gap-3 pt-4 xl:pt-6 pb-6">
          {/* Toolbar. First load: tabs are bars too — nothing is clickable
              yet. After that the tabs stay live; their counts and the Columns /
              Search controls (which act on the rows) wait for data. */}
          <div className="flex flex-wrap items-center gap-3 min-h-10">
            {!hasLoaded ? (
              <TabsSkeleton count={2} className="h-10" />
            ) : (
            <TabGroup
              items={[
                {
                  id: "customer",
                  title: isLoading ? "Customer" : `Customer (${sorted.length})`,
                },
                {
                  id: "product",
                  title: isLoading ? "Product" : `Product (${filteredProductRows.length})`,
                },
              ]}
              activeId={viewFilter}
              size="md"
              onChange={(id) => setViewFilter(id as ViewFilter)}
            />
            )}
            {isLoading ? (
              <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto" aria-busy="true">
                {viewFilter === "customer" && <Skeleton className="h-10 w-[120px] rounded-lg" />}
                <Skeleton className="h-10 flex-1 lg:w-64 rounded-lg" />
              </div>
            ) : (
              <>
              {viewFilter === "customer" && (
                <div className="flex items-center gap-2 w-full lg:w-auto lg:ml-auto">
                  <ColumnVisibilityMenu
                    columns={CUSTOMER_COLUMNS}
                    visibleColumns={visibleColumns}
                    onToggle={toggleColumn}
                    onReset={() => setHiddenColumns(new Set())}
                  />
                  <DebouncedSearchField
                    className="flex-1 lg:w-64"
                    inputClassName="!h-10"
                    placeholder="Search clients…"
                    value={search}
                    debouncedValue={debouncedSearch}
                    onChange={(val) => {
                      setSearch(val);
                      setCurrentPage(1);
                    }}
                    onClear={() => {
                      setSearch("");
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
              {viewFilter === "product" && (
                <DebouncedSearchField
                  className="w-full lg:w-56 lg:ml-auto"
                  placeholder="Search products…"
                  value={productSearch}
                  debouncedValue={debouncedProductSearch}
                  onChange={setProductSearch}
                  onClear={() => setProductSearch("")}
                />
              )}
              </>
            )}
          </div>

          <FadeIn key={viewFilter} className="flex flex-col gap-3">
            {viewFilter === "nine-box" ? (
              <NineBoxTab
                clients={sorted}
                onCellOpen={(info) => {
                  setNineBoxCell(info);
                  setNineBoxDrawerOpen(true);
                }}
              />
            ) : viewFilter === "customer" ? (
              <>
                <CustomerTable
                  rows={paged}
                  visibleColumns={visibleColumns}
                  originalIndexMap={originalIndexMap}
                  tableWidth={tableWidth}
                  isPrivate={isPrivate}
                  isLoading={isLoading}
                  dirFor={customerSort.dirFor}
                  onSort={customerSort.onSortChange}
                  onRowClick={openClient}
                  onClearFilters={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                />

                {isLoading ? (
                  <div className="flex flex-wrap-reverse items-center justify-end gap-3" aria-hidden>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-[120px] rounded-lg" />
                  </div>
                ) : (
                <div className="flex flex-wrap-reverse items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <p className="text-label text-muted-foreground whitespace-nowrap">Show per page</p>
                    <select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="text-label border border-border rounded-md px-2 py-1 bg-background text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary-action"
                    >
                      {PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-label text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {(safePage - 1) * pageSize + 1}
                      </span>
                      {" – "}
                      <span className="font-medium text-foreground">
                        {Math.min(safePage * pageSize, sorted.length)}
                      </span>
                      {" of "}
                      <span className="font-medium text-foreground">
                        {sorted.length}
                      </span>{" "}
                      clients
                    </p>
                    <Pagination
                      totalPages={totalPages}
                      currentPage={safePage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                </div>
                )}
              </>
            ) : (
              <ProductTable
                rows={filteredProductRows}
                originalIndexMap={productIndexMap}
                isLoading={isLoading}
                dirFor={productSort.dirFor}
                onSort={productSort.onSortChange}
                onRowClick={(row) => {
                  setSelectedProduct(row);
                  setProductDrawerOpen(true);
                }}
                onClearFilters={() => setProductSearch("")}
              />
            )}
          </FadeIn>
        </div>
      </section>

      {/* Client Detail Drawer */}
      <DetailDrawer
        className="overflow-hidden flex flex-col"
        open={drawerOpen}
        onOpenChange={(open, details) => {
          if (open) return;
          // Pressing another client's row is a *switch*, not a dismissal.
          //
          // Base UI decides "pressed outside" on pointerdown, which lands
          // before the row's own click, so the two fought and the dismissal
          // won: `closeClient`'s `router.back()` resolved after `openClient`
          // had already swapped `?client=…`, so the first press only closed the
          // panel and the user had to press the same row again to reopen it.
          //
          // Refusing the close here leaves the row's click to do the only thing
          // that should happen — swap the param, and with it the panel's
          // contents. Pressing anywhere else still dismisses.
          if (details.reason === "outside-press" && isClientRowPress(details.event)) {
            details.cancel();
            return;
          }
          closeClient();
        }}
      >
        {panelClient && (
          <ClientDetailPanel
            client={panelClient}
            onViewFull={() => goToProfile(panelClient.id)}
            onViewCallLog={() => goToProfile(panelClient.id, "call-log")}
            onViewReminders={() => goToProfile(panelClient.id, "reminders")}
            onViewNotes={() => goToProfile(panelClient.id, "notes")}
          />
        )}
      </DetailDrawer>

      {/* Product Detail Drawer */}
      <DetailDrawer
        className="overflow-hidden flex flex-col"
        open={productDrawerOpen}
        onOpenChange={(open) => {
          setProductDrawerOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      >
        {selectedProduct && (
          <ProductDetailDrawer
            product={selectedProduct}
            clients={clients}
            onViewFullProfile={goToProfile}
          />
        )}
      </DetailDrawer>

      {/* Nine Box Cell Drawer */}
      <DetailDrawer
        className="overflow-hidden flex flex-col"
        open={nineBoxDrawerOpen}
        onOpenChange={(open) => {
          setNineBoxDrawerOpen(open);
          if (!open) setNineBoxCell(null);
        }}
      >
        {nineBoxCell && (
          <NineBoxCellDrawer cell={nineBoxCell} onViewFullProfile={goToProfile} />
        )}
      </DetailDrawer>
    </>
  );
}
