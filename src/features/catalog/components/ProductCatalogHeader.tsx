"use client";

import { SearchInput } from "@sarunyu/system-one";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCatalogSearch } from "@/features/catalog/hooks/use-product-catalog-search";
import { useT } from "@/i18n/I18nProvider";
import { CatalogTabBar } from "./CatalogTabBar";
import { TabStripScroller } from "./TabStripScroller";

/**
 * The catalog's sticky search bar + category tab bar — one layout for
 * mobile/tablet, another for desktop.
 */
export function ProductCatalogHeader({
  search: { searchValue, setSearchValue, setSearchOpen, mobileSearchWrapRef, desktopSearchWrapRef },
  isLoading,
  hasLoaded,
  activeProductTab,
  onTabChange: handleProductTabChange,
  mobileScrolled,
}: {
  search: ProductCatalogSearch;
  isLoading: boolean;
  hasLoaded: boolean;
  activeProductTab: string;
  onTabChange: (id: string) => void;
  mobileScrolled: boolean;
}) {
  const t = useT();
  const labels = t.products.catalog;
  return (
    <>
      {/* ── Mobile/Tablet: sticky search + tab bar — always expanded, never collapses ── */}
      <div
        className="sticky top-0 z-30 flex flex-col lg:hidden"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div className="px-4 pt-6 pb-4" onFocus={() => setSearchOpen(true)}>
          <div ref={mobileSearchWrapRef}>
            {isLoading ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : (
              <SearchInput
                value={searchValue}
                onChange={setSearchValue}
                placeholder={labels.searchPlaceholder}
                className="w-full"
              />
            )}
          </div>
        </div>
        <div
          className="overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            ["--bg-default-primary" as string]: "transparent",
          }}
        >
          <CatalogTabBar
            activeId={activeProductTab}
            onChange={handleProductTabChange}
            hasLoaded={hasLoaded}
          />
        </div>
      </div>

      {/* ── Desktop: search + tab bar, one shared section ────────────── */}
      <div
        className={`sticky top-0 z-30 hidden w-full shrink-0 flex-col bg-gradient-to-t from-[#f7f7f7] to-white transition-shadow duration-300 ease-out lg:flex ${mobileScrolled ? "shadow-sm" : ""}`}
      >
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${mobileScrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className="flex flex-col items-center justify-center px-6"
              style={{ height: 120, paddingTop: 32, paddingBottom: 24 }}
              onFocus={() => setSearchOpen(true)}
            >
              <div ref={desktopSearchWrapRef} className="w-full max-w-[792px]">
                {/* Skeleton while loading: there is nothing to search yet. */}
                {isLoading ? (
                  <Skeleton className="h-12 w-full rounded-lg" />
                ) : (
                  <SearchInput
                    value={searchValue}
                    onChange={setSearchValue}
                    placeholder={labels.searchPlaceholder}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        <TabStripScroller
          activeKey={hasLoaded ? activeProductTab : undefined}
          className={`mx-auto w-full max-w-[1280px] transition-[padding] duration-300 ease-out ${mobileScrolled ? "pt-6" : ""}`}
        >
          <CatalogTabBar
            activeId={activeProductTab}
            onChange={handleProductTabChange}
            hasLoaded={hasLoaded}
          />
        </TabStripScroller>
      </div>
    </>
  );
}
