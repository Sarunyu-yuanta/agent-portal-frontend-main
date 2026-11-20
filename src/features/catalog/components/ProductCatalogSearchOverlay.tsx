"use client";

import type { ReactNode } from "react";
import { Chip, SearchInput, Tag } from "@sarunyu/system-one";
import { ArrowUpLeftIcon } from "@phosphor-icons/react";
import { ChipScroller } from "@/components/ui/chip-scroller";
import { PRODUCT_CATEGORIES } from "@/features/catalog/lib/product-catalog-routes";
import { clearRecentSearches } from "@/features/catalog/lib/recent-product-searches";
import {
  SEARCH_MODAL_PADDING,
  type ProductCatalogSearch,
} from "@/features/catalog/hooks/use-product-catalog-search";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

/** "All categories" plus the catalog's own tabs, reused as the search modal's filter chips. */
const searchFilterChips = (t: Dictionary) => [
  { id: null as string | null, title: t.products.common.all },
  ...PRODUCT_CATEGORIES,
];

/** Wraps every occurrence of `query` inside `text` in the brand color, case-insensitively. */
function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = q.toLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let idx = lowerText.indexOf(lowerQuery, cursor);
  if (idx === -1) return text;
  let key = 0;
  while (idx !== -1) {
    if (idx > cursor) parts.push(text.slice(cursor, idx));
    parts.push(
      <span key={key++} className="text-primary-action font-semibold">
        {text.slice(idx, idx + q.length)}
      </span>,
    );
    cursor = idx + q.length;
    idx = lowerText.indexOf(lowerQuery, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

/** The search overlay: focusing either search bar pops this open as a floating modal overlapping it. */
export function ProductCatalogSearchOverlay({
  search: {
    searchValue,
    setSearchValue,
    searchOpen,
    searchCategory,
    setSearchCategory,
    recentSearches,
    setRecentSearches,
    searchResults,
    closeSearch,
    handleSearchSelect,
    modalSearchWrapRef,
    anchorRect,
  },
}: {
  search: ProductCatalogSearch;
}) {
  const t = useT();
  const labels = t.products.catalog;
  return (
    <>
      {searchOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(2px)" }}
          onClick={closeSearch}
          role="presentation"
        />
      )}
      {searchOpen && anchorRect && (
        <div
          className="fixed z-50 flex flex-col overflow-hidden rounded-2xl shadow-lg"
          style={{
            // Clamped so anchoring to the slim header bar — which sits only a
            // few pixels below the viewport top — doesn't push the modal flush
            // against the edge.
            top: Math.max(anchorRect.top - SEARCH_MODAL_PADDING, 8),
            left: anchorRect.left - SEARCH_MODAL_PADDING,
            width: anchorRect.width + SEARCH_MODAL_PADDING * 2,
            border: "1px solid rgba(0,0,0,0.1)",
            backgroundColor: "white",
          }}
        >
          <div
            ref={modalSearchWrapRef}
            style={{
              padding: SEARCH_MODAL_PADDING,
              borderBottom:
                searchValue.trim() === "" && recentSearches.length > 0
                  ? undefined
                  : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder={labels.searchPlaceholder}
              className="w-full"
            />
          </div>
          {searchValue.trim() === "" && recentSearches.length > 0 && (
            <div
              className="flex flex-col gap-2 pt-3 pb-2"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between px-3">
                <span className="type-caption text-muted-foreground">{labels.recentSearches}</span>
                <button
                  type="button"
                  onClick={() => setRecentSearches(clearRecentSearches())}
                  className="type-caption text-primary-action cursor-pointer hover:underline"
                >
                  {labels.clearHistory}
                </button>
              </div>
              <ChipScroller rowClassName="px-3">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setSearchValue(term)}
                    // A gray pill on white has to darken on hover, not fade:
                    // the old `bg-muted/70` went *lighter* and read as
                    // disabled. Same gray-200/300 pair the notes sidebar
                    // chips use.
                    className="group type-caption flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-foreground transition-colors hover:bg-[var(--fill-gray-200)] active:bg-[var(--fill-gray-300)]"
                  >
                    {term}
                    {/* ↖ is the conventional "put this term back in the search
                        field" affordance — which is exactly what this does; it
                        fills the input rather than opening a result. */}
                    <ArrowUpLeftIcon
                      size={12}
                      className="shrink-0 text-[var(--text-default-tertiary)] transition-colors group-hover:text-[var(--text-default-secondary)]"
                    />
                  </button>
                ))}
              </ChipScroller>
            </div>
          )}
          <ChipScroller style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            {searchFilterChips(t).map((chip) => (
              <Chip
                key={chip.id ?? "all"}
                label={chip.title}
                selected={searchCategory === chip.id}
                onClick={() => setSearchCategory(chip.id)}
                size="small"
                className="shrink-0"
              />
            ))}
          </ChipScroller>
          <div className="flex max-h-[420px] flex-col overflow-y-auto py-2">
            {searchResults.length === 0 ? (
              <p className="type-caption px-4 py-8 text-center text-muted-foreground">
                {searchValue.trim() ? labels.noMatchFor(searchValue) : labels.noneInCategory}
              </p>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="type-subtitle-2 truncate text-foreground">
                      {highlightMatch(item.title, searchValue)}
                    </span>
                    <span className="type-caption truncate text-muted-foreground">
                      {highlightMatch(item.subtitle, searchValue)}
                    </span>
                  </div>
                  <Tag text={item.categoryLabel} variant="gray" size="small" className="shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
