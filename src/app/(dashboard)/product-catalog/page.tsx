"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { SearchInput } from "@sarunyu/system-one";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ProductCatalogTab,
  type CatalogNavigation,
} from "../client/[id]/ProductCatalogTab";
import {
  advisoryDetailHref,
  catalogListHref,
  CATALOG_PATH,
  normalizeProductCategory,
} from "@/lib/product-catalog-routes";
import { useSetHeaderSlot } from "../header-slot-context";
import { useScrollThreshold } from "../client/[id]/use-scroll-threshold";
import { rememberCatalogList } from "@/lib/nav-memory";
import { setQueryState, withQuery } from "@/lib/query-state";

export default function ProductCatalogPage() {
  return (
    <Suspense fallback={null}>
      <ProductCatalogPageInner />
    </Suspense>
  );
}

function ProductCatalogPageInner() {
  const [searchValue, setSearchValue] = useState("");
  // The header search bar lives up in the dashboard chrome, but the overlay it
  // opens belongs to the catalog below — so both the open state and the anchor
  // element are owned here and handed down.
  const [searchOpen, setSearchOpen] = useState(false);
  const headerSearchWrapRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollThreshold();
  const setHeaderSlot = useSetHeaderSlot();
  const router = useRouter();
  const searchParams = useSearchParams();

  // The category tab lives in the URL, so browser back/forward, a refresh and
  // sidebar re-entry all land on the tab the user actually had open.
  const category = normalizeProductCategory(searchParams.get("category"));
  // Keeps the rest of the query (a tab's own view state, e.g. Stock's
  // `?market=`) on the remembered list URL, so a detail page's back button
  // restores the tab *as the user left it*, not just which tab it was.
  const listUrl = withQuery(CATALOG_PATH, searchParams, { category });

  useEffect(() => {
    rememberCatalogList(listUrl);
  }, [listUrl]);

  useEffect(() => {
    if (scrolled) {
      setHeaderSlot(
        <div
          ref={headerSearchWrapRef}
          className="w-full"
          onFocus={() => setSearchOpen(true)}
        >
          <SearchInput
            value={searchValue}
            onChange={setSearchValue}
            placeholder="ค้นหาสินทรัพย์"
            size="sm"
            className="w-full"
          />
        </div>,
      );
    } else {
      setHeaderSlot(null);
    }
    return () => setHeaderSlot(null);
  }, [scrolled, searchValue, setSearchValue, setHeaderSlot]);

  const navigation: CatalogNavigation = {
    onProductSelect: (p) => router.push(`/product-catalog/product/${p.id}`),
    onAllProductsView: () => router.push("/product-catalog/product"),
    onTopIdeaSelect: (sector) =>
      router.push(`/product-catalog/top-idea/${encodeURIComponent(sector)}`),
    onAllTopIdeasView: () => router.push("/product-catalog/top-idea"),
    onInvestmentSolutionSelect: (id) =>
      router.push(`/product-catalog/investment-solution/${id}`),
    onFixedIncomeBondSelect: (bond) =>
      router.push(`/product-catalog/fixed-income/bond/${bond.id}`),
    onGlobalBondIssuerSelect: (id) =>
      router.push(`/product-catalog/global-bond/${id}`),
    onAllGlobalBondsView: () => router.push("/product-catalog/global-bond"),
    onThaiProductSelect: (p) =>
      router.push(
        `/product-catalog/thai-structured/${encodeURIComponent(p.theme)}`,
      ),
    onMutualFundSelect: (fundId) =>
      router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`),
    onMutualFundTopPerformersSeeAll: (groupId) =>
      router.push(`/product-catalog/mutual-fund/top-performers/${encodeURIComponent(groupId)}`),
    onMutualFundInsightsSeeAll: () => router.push("/product-catalog/mutual-fund/insights"),
    onMutualFundThemeSeeAll: (themeId) =>
      router.push(`/product-catalog/mutual-fund/themes/${encodeURIComponent(themeId)}`),
    onRoboAdvisorySelect: (clientId) =>
      router.push(advisoryDetailHref("/product-catalog/robo-advisory", clientId)),
    onDefinitSelect: (clientId) =>
      router.push(advisoryDetailHref("/product-catalog/definit", clientId)),
  };

  return (
    <ProductCatalogTab
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchOpen={searchOpen}
      onSearchOpenChange={setSearchOpen}
      searchAnchorRef={headerSearchWrapRef}
      activeCategory={category}
      onCategoryChange={(id) =>
        // Deliberately drops the rest of the query rather than merging it: a
        // tab's own view state (Stock's `?market=`) belongs to the visit the
        // user set it in. It comes back when they drill into something and
        // press back — not when they leave via the tab bar and wander in again,
        // which starts the tab at its default.
        setQueryState(catalogListHref(id), "push")
      }
      navigation={navigation}
    />
  );
}
