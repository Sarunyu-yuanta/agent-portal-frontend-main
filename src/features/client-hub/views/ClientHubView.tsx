"use client";

import { Suspense, useState } from "react";
import { TabGroup, Pagination, Toaster } from "@sarunyu/system-one";
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { FadeIn } from "@/components/ui/fade-in";
import { NineBoxTab, type NineBoxCellInfo } from "@/features/client-hub/components/NineBoxTab";
import { ColumnVisibilityMenu } from "@/features/client-hub/components/ColumnVisibilityMenu";
import { CUSTOMER_COLUMNS } from "@/features/client-hub/components/columns";
import { DebouncedSearchField } from "@/features/client-hub/components/DebouncedSearchField";
import { ClientSummaryCards } from "@/features/client-hub/components/ClientSummaryCards";
import { CustomerTable } from "@/features/client-hub/components/CustomerTable";
import { ProductTable } from "@/features/client-hub/components/ProductTable";
import { ProductDetailDrawer } from "@/features/client-hub/components/ProductDetailDrawer";
import { NineBoxCellDrawer } from "@/features/client-hub/components/NineBoxCellDrawer";
import { ClientDetailPanel } from "@/features/client-hub/components/ClientDetailPanel";
import { useClientHubFilters } from "@/features/client-hub/hooks/use-client-hub-filters";
import { useClientQuickView } from "@/features/client-hub/hooks/use-client-quick-view";
import type { ViewFilter } from "@/features/client-hub/lib/types";
import { useT } from "@/i18n/I18nProvider";
import type { ProductRow } from "@/types/portfolio";
import { useClientsResource } from "@/features/clients/hooks/use-clients";
import { useHasLoaded } from "@/lib/api/resource";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";

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

export function ClientHubView() {
  return (
    <Suspense fallback={null}>
      <ClientHubPageInner />
    </Suspense>
  );
}

function ClientHubPageInner() {
  const t = useT();
  const { data: clients, isLoading, error } = useClientsResource();
  const hasLoaded = useHasLoaded(isLoading);
  const { isPrivate } = usePrivacy();

  const {
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
  } = useClientHubFilters(clients);

  const { drawerOpen, panelClient, toasts, removeToast, openClient, closeClient, goToProfile } =
    useClientQuickView({ clients, isLoading, error });

  // Drawers
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [productDrawerOpen, setProductDrawerOpen] = useState(false);
  const [nineBoxCell, setNineBoxCell] = useState<NineBoxCellInfo | null>(null);
  const [nineBoxDrawerOpen, setNineBoxDrawerOpen] = useState(false);

  return (
    <>
      {/* Hero — own padding + max-width */}
      <div className="pt-4 pb-2 xl:pt-6 xl:pb-2">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 xl:px-6">
          <ClientSummaryCards clients={clients} isLoading={isLoading} />
        </div>
      </div>

      {/* White section — full-width background, content constrained to max-w */}
      <section className="flex-1 rounded-t-[16px] bg-white xl:rounded-t-2xl">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 pt-4 pb-6 xl:px-6 xl:pt-6">
          {/* Toolbar. First load: tabs are bars too — nothing is clickable
              yet. After that the tabs stay live; their counts and the Columns /
              Search controls (which act on the rows) wait for data. */}
          <div className="flex min-h-10 flex-wrap items-center gap-3">
            {!hasLoaded ? (
              <TabsSkeleton count={2} className="h-10" />
            ) : (
              <TabGroup
                items={[
                  {
                    id: "customer",
                    title: isLoading
                      ? t.client.hub.customerTab
                      : t.client.hub.customerTabCount(sorted.length),
                  },
                  {
                    id: "product",
                    title: isLoading
                      ? t.client.hub.productTab
                      : t.client.hub.productTabCount(filteredProductRows.length),
                  },
                ]}
                activeId={viewFilter}
                size="md"
                onChange={(id) => setViewFilter(id as ViewFilter)}
              />
            )}
            {isLoading ? (
              <div className="flex w-full items-center gap-2 lg:ml-auto lg:w-auto" aria-busy="true">
                {viewFilter === "customer" && <Skeleton className="h-10 w-[120px] rounded-lg" />}
                <Skeleton className="h-10 flex-1 rounded-lg lg:w-64" />
              </div>
            ) : (
              <>
                {viewFilter === "customer" && (
                  <div className="flex w-full items-center gap-2 lg:ml-auto lg:w-auto">
                    <ColumnVisibilityMenu
                      columns={CUSTOMER_COLUMNS}
                      visibleColumns={visibleColumns}
                      onToggle={toggleColumn}
                      onReset={() => setHiddenColumns(new Set())}
                    />
                    <DebouncedSearchField
                      className="flex-1 lg:w-64"
                      inputClassName="!h-10"
                      placeholder={t.client.hub.searchClients}
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
                    className="w-full lg:ml-auto lg:w-56"
                    placeholder={t.client.hub.searchProducts}
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
                  isFiltered={!!debouncedSearch.trim()}
                />

                {isLoading ? (
                  <div
                    className="flex flex-wrap-reverse items-center justify-end gap-3"
                    aria-hidden
                  >
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-[120px] rounded-lg" />
                  </div>
                ) : (
                  sorted.length > 0 && (
                    <div className="flex flex-wrap-reverse items-center justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <p className="text-label whitespace-nowrap text-muted-foreground">
                          {t.client.hub.perPage}
                        </p>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="focus:ring-primary-action cursor-pointer rounded-md border border-border bg-background px-2 py-1 text-label text-foreground focus:ring-1 focus:outline-none"
                        >
                          {PAGE_SIZE_OPTIONS.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-label text-muted-foreground">
                          {t.client.hub.showingClients(
                            <span key="from" className="font-medium text-foreground">
                              {(safePage - 1) * pageSize + 1}
                            </span>,
                            <span key="to" className="font-medium text-foreground">
                              {Math.min(safePage * pageSize, sorted.length)}
                            </span>,
                            <span key="total" className="font-medium text-foreground">
                              {sorted.length}
                            </span>,
                          )}
                        </p>
                        <Pagination
                          totalPages={totalPages}
                          currentPage={safePage}
                          onPageChange={setCurrentPage}
                        />
                      </div>
                    </div>
                  )
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
                isFiltered={!!debouncedProductSearch.trim()}
              />
            )}
          </FadeIn>
        </div>
      </section>

      <Toaster items={toasts} onRemove={removeToast} />

      {/* Client Detail Drawer */}
      <DetailDrawer
        className="flex flex-col overflow-hidden"
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
        className="flex flex-col overflow-hidden"
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
        className="flex flex-col overflow-hidden"
        open={nineBoxDrawerOpen}
        onOpenChange={(open) => {
          setNineBoxDrawerOpen(open);
          if (!open) setNineBoxCell(null);
        }}
      >
        {nineBoxCell && <NineBoxCellDrawer cell={nineBoxCell} onViewFullProfile={goToProfile} />}
      </DetailDrawer>
    </>
  );
}
