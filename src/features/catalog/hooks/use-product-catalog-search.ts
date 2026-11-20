"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { getIssuerIdForBondRow } from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  PRODUCT_SEARCH_INDEX,
  matchesProductQuery,
  type ProductSearchItem,
} from "@/features/catalog/lib/product-search-index";
import { addRecentSearch, getRecentSearches } from "@/features/catalog/lib/recent-product-searches";
import { thaiBookableId } from "@/features/catalog/structured-product/lib/thai-structured-data";
import type { CatalogNavigation } from "@/features/catalog/components/ProductCatalogTab";
import { useOpenProducts } from "@/features/orders/hooks/use-order-books";
import { pageZoom } from "@/lib/page-zoom";

export const SEARCH_MODAL_PADDING = 12;
const MAX_SEARCH_RESULTS = 20;

/**
 * The catalog's product search: the query and overlay state (each controlled by
 * the host when it passes them, uncontrolled otherwise), the category filter,
 * recent searches, the results, and where the floating overlay anchors.
 */
export function useProductCatalogSearch({
  searchValue: searchValueProp,
  onSearchChange,
  searchOpen: searchOpenProp,
  onSearchOpenChange,
  searchAnchorRef,
  mobileScrolled,
  nav,
}: {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  searchAnchorRef?: RefObject<HTMLDivElement | null>;
  /** Whether the page has scrolled far enough to swap which search bar is on screen. */
  mobileScrolled: boolean;
  nav: Pick<
    CatalogNavigation,
    | "onProductSelect"
    | "onThaiProductSelect"
    | "onFixedIncomeBondSelect"
    | "onGlobalBondIssuerSelect"
    | "onAllGlobalBondsView"
  >;
}) {
  const [searchValueInternal, setSearchValueInternal] = useState("");
  const searchValue = searchValueProp ?? searchValueInternal;
  const setSearchValue = onSearchChange ?? setSearchValueInternal;
  const [searchOpenInternal, setSearchOpenInternal] = useState(false);
  const searchOpen = searchOpenProp ?? searchOpenInternal;
  const setSearchOpen = onSearchOpenChange ?? setSearchOpenInternal;
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  // A product whose order has gone out is no longer on offer, so search stops
  // finding it too — the same rule the shelves follow.
  const searchIndex = useOpenProducts(PRODUCT_SEARCH_INDEX, (item) =>
    item.kind === "structured"
      ? item.product.id
      : item.kind === "thai-structured"
        ? thaiBookableId(item.product.theme)
        : item.key,
  );
  const searchResults = useMemo(() => {
    const byCategory = searchCategory
      ? searchIndex.filter((item) => item.kind === searchCategory)
      : searchIndex;
    const query = searchValue.trim();
    const byQuery = query
      ? byCategory.filter((item) => matchesProductQuery(item, query))
      : byCategory;
    return byQuery.slice(0, MAX_SEARCH_RESULTS);
  }, [searchIndex, searchValue, searchCategory]);

  /**
   * Closing counts as "having searched" whenever text was actually typed —
   * whether or not a result got picked. Clearing the field on the way out
   * means the next open starts fresh, showing the recent-searches row again
   * instead of picking up wherever the last search left off.
   */
  function closeSearch() {
    if (searchValue.trim()) setRecentSearches(addRecentSearch(searchValue));
    setSearchValue("");
    setSearchOpen(false);
  }

  // Anchors the floating search modal to whichever search bar the user
  // actually focused, so it pops up overlapping that bar's real position
  // instead of a fixed viewport guess. The host's header bar comes first:
  // when it is on screen the in-page bars are collapsed to zero height but
  // still laid out, so they'd otherwise win the `offsetParent` check.
  const mobileSearchWrapRef = useRef<HTMLDivElement>(null);
  const desktopSearchWrapRef = useRef<HTMLDivElement>(null);
  const modalSearchWrapRef = useRef<HTMLDivElement>(null);
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!searchOpen) return;
    const measure = () => {
      const el =
        [searchAnchorRef?.current, mobileSearchWrapRef.current, desktopSearchWrapRef.current].find(
          (node) => node && node.offsetParent !== null,
        ) ?? null;
      if (!el) return;
      // Screen pixels, converted to the page's own for `style` (see `pageZoom`).
      const rect = el.getBoundingClientRect();
      const zoom = pageZoom();
      setAnchorRect({ top: rect.top / zoom, left: rect.left / zoom, width: rect.width / zoom });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [searchOpen, searchAnchorRef]);

  // Focus the modal's own search field the instant it appears — the DS
  // `SearchInput` doesn't forward a ref to its native `<input>`, so reach in
  // through the wrapper instead.
  useEffect(() => {
    if (!searchOpen) return;
    modalSearchWrapRef.current?.querySelector("input")?.focus();
  }, [searchOpen]);

  // Scrolling swaps which search bar is on screen (the in-page one collapses
  // away, the host's sticky header one takes over, and back again) — so the
  // overlay shouldn't linger, anchored to a field that moved out from under
  // it. Kept in an effect rather than adjusted during render because
  // `setSearchOpen` may be the host's setter, and a child can't update another
  // component's state mid-render.
  const prevMobileScrolledRef = useRef(mobileScrolled);
  useEffect(() => {
    if (prevMobileScrolledRef.current === mobileScrolled) return;
    prevMobileScrolledRef.current = mobileScrolled;
    setSearchOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `setSearchOpen` can be an unstable host callback; listing it would close the overlay on every render instead of only on the scroll transition.
  }, [mobileScrolled]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-subscribes on every keystroke so Escape always sees the latest searchValue; closeSearch is a plain function, not stable, so it can't be listed.
  }, [searchOpen, searchValue]);

  function handleSearchSelect(item: ProductSearchItem) {
    closeSearch();
    switch (item.kind) {
      case "structured":
        nav.onProductSelect(item.product);
        break;
      case "thai-structured":
        nav.onThaiProductSelect(item.product);
        break;
      case "fixed-income":
        nav.onFixedIncomeBondSelect(item.bond);
        break;
      case "global-bond": {
        const issuerId = getIssuerIdForBondRow(item.bond);
        // A bond with no issuer page still has a home: the full overseas list
        // it is part of. Picking it used to close the overlay and do nothing.
        if (issuerId) nav.onGlobalBondIssuerSelect(issuerId);
        else nav.onAllGlobalBondsView();
        break;
      }
    }
  }

  return {
    searchValue,
    setSearchValue,
    searchOpen,
    setSearchOpen,
    searchCategory,
    setSearchCategory,
    recentSearches,
    setRecentSearches,
    searchResults,
    closeSearch,
    handleSearchSelect,
    mobileSearchWrapRef,
    desktopSearchWrapRef,
    modalSearchWrapRef,
    anchorRect,
  };
}

export type ProductCatalogSearch = ReturnType<typeof useProductCatalogSearch>;
