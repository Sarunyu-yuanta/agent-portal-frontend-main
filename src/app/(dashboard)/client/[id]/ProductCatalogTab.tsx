"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Chip, SearchInput, Tag, TabGroup } from "@sarunyu/system-one";
import { ArrowUpLeftIcon } from "@phosphor-icons/react";
import { ChipScroller } from "@/components/ui/chip-scroller";
import { FixedIncomeTab } from "./FixedIncomeTab";
import { FixedIncomeDetail } from "./FixedIncomeDetail";
import { FixedIncomeCompanyDetail } from "./FixedIncomeCompanyDetail";
import type { FixedIncomeBond } from "./fixed-income-data";
import { GlobalBondTab } from "./GlobalBondTab";
import { MutualFundTab } from "./MutualFundTab";
import { StockTab } from "./StockTab";
import { RoboAdvisoryTab } from "./RoboAdvisoryTab";
import { MutualFundDetail } from "./MutualFundDetail";
import {
  getMutualFund,
  mutualFundGroupHref,
  mutualFundInsightsHref,
  mutualFundThemeHref,
  type MobileFundGroupId,
  type MutualFundThemeId,
} from "./mutual-fund-data";
import { GlobalBondDetail } from "./GlobalBondDetail";
import { GlobalBondAllPage } from "./GlobalBondAllPage";
import { getIssuerIdForBondRow, type GlobalBondIssuerId } from "./global-bond-data";
import { PRODUCT_SEARCH_INDEX, matchesProductQuery, type ProductSearchItem } from "./product-search-index";
import { addRecentSearch, clearRecentSearches, getRecentSearches } from "./recent-product-searches";
import { StructuredProductDetail } from "./StructuredProductDetail";
import { StructuredProductAllPage } from "./StructuredProductAllPage";
import { ThaiStructuredProductTable } from "./ThaiStructuredProductTable";
import { ThaiStructuredProductDetail } from "./ThaiStructuredProductDetail";
import type { ThaiStructuredProduct } from "./thai-structured-data";
import { TopIdeaAllPage } from "./TopIdeaAllPage";
import { TopIdeaDetail } from "./TopIdeaDetail";
import { InvestmentSolutionDetail } from "./InvestmentSolutionDetail";
import type { TopIdeaSector } from "./top-idea-data";
import { PRODUCT_CATEGORIES, advisoryDetailHref } from "@/lib/product-catalog-routes";
import { useScrollThreshold } from "./use-scroll-threshold";
import { useDragScroll } from "./use-drag-scroll";
import { useProductCatalogLoading } from "@/hooks/use-catalog";
import { useRouter } from "next/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { ProductCatalogTabSkeleton } from "./ProductCatalogSkeletons";
import type { StructuredProduct } from "./structured-product-data";
import {
  getInvestmentSolution,
  type InvestmentSolutionId,
} from "./investment-solution-data";
import {
  InvestmentSolutionSection,
  StructuredProductGridSection,
  TopIdeaStrip,
  TopPickSection,
} from "./ProductCatalogSections";

const SEARCH_MODAL_PADDING = 12;
const MAX_SEARCH_RESULTS = 20;

/** "All categories" plus the catalog's own tabs, reused as the search modal's filter chips. */
const SEARCH_FILTER_CHIPS = [
  { id: null as string | null, title: "ทั้งหมด" },
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

export type CatalogNavigation = {
  onProductSelect: (product: StructuredProduct) => void;
  onAllProductsView: () => void;
  onTopIdeaSelect: (sector: TopIdeaSector) => void;
  onAllTopIdeasView: () => void;
  onInvestmentSolutionSelect: (id: InvestmentSolutionId) => void;
  onFixedIncomeBondSelect: (bond: FixedIncomeBond) => void;
  onGlobalBondIssuerSelect: (issuerId: GlobalBondIssuerId) => void;
  onAllGlobalBondsView: () => void;
  onThaiProductSelect: (product: ThaiStructuredProduct) => void;
  onMutualFundSelect: (fundId: string) => void;
  onMutualFundTopPerformersSeeAll: (groupId: MobileFundGroupId) => void;
  onMutualFundInsightsSeeAll: () => void;
  onMutualFundThemeSeeAll: (themeId: MutualFundThemeId) => void;
  onRoboAdvisorySelect: (clientId: string) => void;
  onDefinitSelect: (clientId: string) => void;
};

export function ProductCatalogTab({
  searchValue: searchValueProp,
  onSearchChange,
  searchOpen: searchOpenProp,
  onSearchOpenChange,
  searchAnchorRef,
  onDetailViewChange,
  navigation,
  activeCategory,
  onCategoryChange,
}: {
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  /** Overlay open state when the host owns it (e.g. it hosts its own search bar); uncontrolled otherwise. */
  searchOpen?: boolean;
  onSearchOpenChange?: (open: boolean) => void;
  /**
   * A search bar rendered outside this component (the sticky header slot) that
   * the overlay should anchor to. Takes priority over the in-page bars, which
   * are collapsed away whenever that header bar is the visible one.
   */
  searchAnchorRef?: RefObject<HTMLDivElement | null>;
  onDetailViewChange?: (isDetail: boolean) => void;
  navigation?: CatalogNavigation;
  /** Category tab id when the host owns it (URL-driven); uncontrolled otherwise. */
  activeCategory?: string;
  onCategoryChange?: (id: string) => void;
} = {}) {
  const router = useRouter();
  const [activeTabInternal, setActiveTabInternal] = useState("structured");
  const activeProductTab = activeCategory ?? activeTabInternal;
  const [selectedFixedIncomeBond, setSelectedFixedIncomeBond] = useState<FixedIncomeBond | null>(null);
  const [selectedFixedIncomeCompany, setSelectedFixedIncomeCompany] = useState<string | null>(null);
  const [fixedIncomeView, setFixedIncomeView] = useState<"bond" | "company" | null>(null);
  const [selectedGlobalBondIssuer, setSelectedGlobalBondIssuer] = useState<GlobalBondIssuerId | null>(null);
  const [showAllGlobalBonds, setShowAllGlobalBonds] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [selectedTopIdea, setSelectedTopIdea] = useState<TopIdeaSector | null>(null);
  const [selectedInvestmentSolution, setSelectedInvestmentSolution] = useState<InvestmentSolutionId | null>(null);
  const [showAllTopIdeas, setShowAllTopIdeas] = useState(false);
  const [showAllStructuredProducts, setShowAllStructuredProducts] = useState(false);
  const [selectedThaiProduct, setSelectedThaiProduct] = useState<ThaiStructuredProduct | null>(null);
  const [selectedMutualFundId, setSelectedMutualFundId] = useState<string | null>(null);

  const [searchValueInternal, setSearchValueInternal] = useState("");
  const searchValue = searchValueProp ?? searchValueInternal;
  const setSearchValue = onSearchChange ?? setSearchValueInternal;
  const [searchOpenInternal, setSearchOpenInternal] = useState(false);
  const searchOpen = searchOpenProp ?? searchOpenInternal;
  const setSearchOpen = onSearchOpenChange ?? setSearchOpenInternal;
  const [searchCategory, setSearchCategory] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getRecentSearches());

  const searchResults = useMemo(() => {
    const byCategory = searchCategory
      ? PRODUCT_SEARCH_INDEX.filter((item) => item.kind === searchCategory)
      : PRODUCT_SEARCH_INDEX;
    const query = searchValue.trim();
    const byQuery = query ? byCategory.filter((item) => matchesProductQuery(item, query)) : byCategory;
    return byQuery.slice(0, MAX_SEARCH_RESULTS);
  }, [searchValue, searchCategory]);

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
  const [anchorRect, setAnchorRect] = useState<{ top: number; left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    if (!searchOpen) return;
    const measure = () => {
      const el =
        [
          searchAnchorRef?.current,
          mobileSearchWrapRef.current,
          desktopSearchWrapRef.current,
        ].find((node) => node && node.offsetParent !== null) ?? null;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setAnchorRect({ top: rect.top, left: rect.left, width: rect.width });
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

  const mobileScrolled = useScrollThreshold();
  const drag = useDragScroll();
  const isLoading = useProductCatalogLoading();

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

  const isDetailView = !!(
    showAllGlobalBonds ||
    selectedGlobalBondIssuer ||
    (fixedIncomeView === "bond" && selectedFixedIncomeBond) ||
    (fixedIncomeView === "company" && selectedFixedIncomeCompany) ||
    selectedProduct ||
    selectedTopIdea ||
    selectedInvestmentSolution ||
    showAllTopIdeas ||
    showAllStructuredProducts ||
    selectedThaiProduct ||
    selectedMutualFundId
  );

  useEffect(() => {
    onDetailViewChange?.(isDetailView);
  }, [isDetailView, onDetailViewChange]);

  // Unified navigation handlers — use URL-based navigation when provided, else internal state
  const nav = {
    onProductSelect: navigation?.onProductSelect ?? setSelectedProduct,
    onAllProductsView: navigation?.onAllProductsView ?? (() => setShowAllStructuredProducts(true)),
    onTopIdeaSelect: navigation?.onTopIdeaSelect ?? setSelectedTopIdea,
    onAllTopIdeasView: navigation?.onAllTopIdeasView ?? (() => setShowAllTopIdeas(true)),
    onInvestmentSolutionSelect: navigation?.onInvestmentSolutionSelect ?? setSelectedInvestmentSolution,
    onFixedIncomeBondSelect: navigation?.onFixedIncomeBondSelect ?? ((bond: FixedIncomeBond) => {
      setSelectedFixedIncomeBond(bond);
      setFixedIncomeView("bond");
    }),
    onGlobalBondIssuerSelect: navigation?.onGlobalBondIssuerSelect ?? setSelectedGlobalBondIssuer,
    onAllGlobalBondsView: navigation?.onAllGlobalBondsView ?? (() => setShowAllGlobalBonds(true)),
    onThaiProductSelect: navigation?.onThaiProductSelect ?? setSelectedThaiProduct,
    onMutualFundSelect:
      navigation?.onMutualFundSelect ?? ((fundId: string) => setSelectedMutualFundId(fundId)),
    onMutualFundTopPerformersSeeAll:
      navigation?.onMutualFundTopPerformersSeeAll ??
      ((groupId: MobileFundGroupId) => router.push(mutualFundGroupHref(groupId))),
    onMutualFundInsightsSeeAll:
      navigation?.onMutualFundInsightsSeeAll ?? (() => router.push(mutualFundInsightsHref())),
    onMutualFundThemeSeeAll:
      navigation?.onMutualFundThemeSeeAll ??
      ((themeId: MutualFundThemeId) => router.push(mutualFundThemeHref(themeId))),
    onRoboAdvisorySelect:
      navigation?.onRoboAdvisorySelect ??
      ((clientId) => router.push(advisoryDetailHref("/product-catalog/robo-advisory", clientId))),
    onDefinitSelect:
      navigation?.onDefinitSelect ??
      ((clientId) => router.push(advisoryDetailHref("/product-catalog/definit", clientId))),
  };

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
        if (issuerId) nav.onGlobalBondIssuerSelect(issuerId);
        break;
      }
    }
  }

  const resetFixedIncomeNav = () => {
    setSelectedFixedIncomeBond(null);
    setSelectedFixedIncomeCompany(null);
    setFixedIncomeView(null);
  };

  const handleProductTabChange = (id: string) => {
    if (onCategoryChange) onCategoryChange(id);
    else setActiveTabInternal(id);
    setSelectedProduct(null);
    setShowAllTopIdeas(false);
    setSelectedTopIdea(null);
    setSelectedInvestmentSolution(null);
    setShowAllStructuredProducts(false);
    resetFixedIncomeNav();
    setSelectedGlobalBondIssuer(null);
    setShowAllGlobalBonds(false);
    setSelectedThaiProduct(null);
    setSelectedMutualFundId(null);
  };

  // ── State-based detail views ────────────────────────────────────────────────
  // Only used when URL navigation is not provided (e.g. client pages).

  if (!navigation && selectedMutualFundId) {
    const fund = getMutualFund(selectedMutualFundId);
    if (fund) {
      return (
        <div className="flex flex-col w-full">
          <MutualFundDetail fund={fund} onBack={() => setSelectedMutualFundId(null)} />
        </div>
      );
    }
  }

  if (!navigation && selectedThaiProduct) {
    return (
      <div className="flex flex-col w-full">
        <ThaiStructuredProductDetail
          product={selectedThaiProduct}
          onBack={() => setSelectedThaiProduct(null)}
        />
      </div>
    );
  }

  if (!navigation && showAllGlobalBonds) {
    return (
      <div className="flex flex-col w-full">
        <GlobalBondAllPage onBack={() => setShowAllGlobalBonds(false)} />
      </div>
    );
  }

  if (!navigation && selectedGlobalBondIssuer) {
    return (
      <div className="flex flex-col w-full">
        <GlobalBondDetail
          issuerId={selectedGlobalBondIssuer}
          onBack={() => setSelectedGlobalBondIssuer(null)}
          onIssuerSelect={setSelectedGlobalBondIssuer}
        />
      </div>
    );
  }

  if (!navigation && fixedIncomeView === "bond" && selectedFixedIncomeBond) {
    return (
      <div className="flex flex-col w-full">
        <FixedIncomeDetail
          bond={selectedFixedIncomeBond}
          onBack={() => {
            if (selectedFixedIncomeCompany) {
              setSelectedFixedIncomeBond(null);
              setFixedIncomeView("company");
            } else {
              resetFixedIncomeNav();
            }
          }}
          onCompanySelect={(companyId) => {
            setSelectedFixedIncomeCompany(companyId);
            setFixedIncomeView("company");
          }}
        />
      </div>
    );
  }

  if (!navigation && fixedIncomeView === "company" && selectedFixedIncomeCompany) {
    return (
      <div className="flex flex-col w-full">
        <FixedIncomeCompanyDetail
          companyId={selectedFixedIncomeCompany}
          onBack={() => {
            if (selectedFixedIncomeBond) {
              setSelectedFixedIncomeCompany(null);
              setFixedIncomeView("bond");
            } else {
              resetFixedIncomeNav();
            }
          }}
          onBondSelect={(bond) => {
            setSelectedFixedIncomeBond(bond);
            setFixedIncomeView("bond");
          }}
        />
      </div>
    );
  }

  if (!navigation && selectedProduct) {
    return (
      <div className="flex flex-col w-full">
        <StructuredProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      </div>
    );
  }

  if (!navigation && selectedTopIdea) {
    return (
      <div className="flex flex-col w-full">
        <TopIdeaDetail
          sector={selectedTopIdea}
          onBack={() => setSelectedTopIdea(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  if (!navigation && selectedInvestmentSolution) {
    return (
      <div className="flex flex-col w-full">
        <InvestmentSolutionDetail
          solution={getInvestmentSolution(selectedInvestmentSolution)}
          onBack={() => setSelectedInvestmentSolution(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  if (!navigation && showAllTopIdeas) {
    return (
      <div className="flex flex-col w-full">
        <TopIdeaAllPage
          onBack={() => setShowAllTopIdeas(false)}
          onSelect={(sector) => setSelectedTopIdea(sector)}
        />
      </div>
    );
  }

  if (!navigation && showAllStructuredProducts) {
    return (
      <div className="flex flex-col w-full">
        <StructuredProductAllPage
          onBack={() => setShowAllStructuredProducts(false)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  return (
    // Root: full-bleed — negative margin + matching width expansion
    <div className="flex flex-col flex-1 w-full" style={{ backgroundColor: "white" }}>
      {/* ── Mobile/Tablet: sticky search + tab bar — always expanded, never collapses ── */}
      <div
        className="sticky top-0 z-30 flex flex-col lg:hidden"
        style={{ backgroundColor: "#f3f4f6" }}
      >
        <div className="px-4 pt-6 pb-4" onFocus={() => setSearchOpen(true)}>
          <div ref={mobileSearchWrapRef}>
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="ค้นหาสินทรัพย์"
              className="w-full"
            />
          </div>
        </div>
        <div
          className="overflow-x-auto"
          style={{
            scrollbarWidth: "none",
            ["--bg-default-primary" as string]: "transparent",
          }}
        >
          <TabGroup
            items={PRODUCT_CATEGORIES}
            activeId={activeProductTab}
            onChange={handleProductTabChange}
            size="md"
            className="w-max"
          />
        </div>
      </div>

      {/* ── Desktop: search + tab bar, one shared section ────────────── */}
      <div className={`hidden lg:flex flex-col shrink-0 w-full bg-gradient-to-t from-[#f7f7f7] to-white sticky top-0 z-30 transition-shadow duration-300 ease-out ${mobileScrolled ? "shadow-sm" : ""}`}>
        <div
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${mobileScrolled ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}
        >
          <div className="overflow-hidden min-h-0">
            <div
              className="flex flex-col items-center justify-center px-6"
              style={{ height: 120, paddingTop: 32, paddingBottom: 24 }}
              onFocus={() => setSearchOpen(true)}
            >
              <div ref={desktopSearchWrapRef} className="w-full max-w-[792px]">
                <SearchInput
                  value={searchValue}
                  onChange={setSearchValue}
                  placeholder="ค้นหาสินทรัพย์"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        <div
          className={`max-w-[1280px] mx-auto w-full px-4 lg:px-6 overflow-x-auto [--bg-default-primary:transparent] transition-[padding] duration-300 ease-out ${mobileScrolled ? "pt-6" : ""}`}
          style={{ scrollbarWidth: "none" }}
        >
          <TabGroup
            items={PRODUCT_CATEGORIES}
            activeId={activeProductTab}
            onChange={handleProductTabChange}
            size="md"
            className="w-max"
          />
        </div>
      </div>

      {/* ── Search overlay: focusing either search bar above pops this open as a floating modal overlapping it ── */}
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
          className="fixed z-50 flex flex-col rounded-2xl overflow-hidden shadow-lg"
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
              borderBottom: searchValue.trim() === "" && recentSearches.length > 0 ? undefined : "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <SearchInput
              value={searchValue}
              onChange={setSearchValue}
              placeholder="ค้นหาสินทรัพย์"
              className="w-full"
            />
          </div>
          {searchValue.trim() === "" && recentSearches.length > 0 && (
            <div
              className="flex flex-col gap-2 pt-3 pb-2"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
            >
              <div className="flex items-center justify-between px-3">
                <span className="type-caption text-muted-foreground">ค้นหาล่าสุด</span>
                <button
                  type="button"
                  onClick={() => setRecentSearches(clearRecentSearches())}
                  className="type-caption text-primary-action hover:underline cursor-pointer"
                >
                  ล้างประวัติ
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
                    className="group shrink-0 flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 type-caption text-foreground transition-colors cursor-pointer hover:bg-[var(--fill-gray-200)] active:bg-[var(--fill-gray-300)]"
                  >
                    {term}
                    {/* ↖ is the conventional "put this term back in the search
                        field" affordance — which is exactly what this does; it
                        fills the input rather than opening a result. */}
                    <ArrowUpLeftIcon
                      size={12}
                      className="shrink-0 text-[var(--text-default-tertiary)] group-hover:text-[var(--text-default-secondary)] transition-colors"
                    />
                  </button>
                ))}
              </ChipScroller>
            </div>
          )}
          <ChipScroller style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            {SEARCH_FILTER_CHIPS.map((chip) => (
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
          <div className="flex flex-col max-h-[420px] overflow-y-auto py-2">
            {searchResults.length === 0 ? (
              <p className="px-4 py-8 text-center type-caption text-muted-foreground">
                ไม่พบสินทรัพย์{searchValue.trim() ? `ที่ตรงกับ “${searchValue}”` : "ในหมวดนี้"}
              </p>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSearchSelect(item)}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="type-subtitle-2 text-foreground truncate">
                      {highlightMatch(item.title, searchValue)}
                    </span>
                    <span className="type-caption text-muted-foreground truncate">
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

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <FadeIn key={activeProductTab} className="flex flex-col w-full">
        {/* Stock and Robo Advisory have no loading state to speak of (their
            data is local mock content, not fetched), so both skip straight
            past the catalog's shared loading skeleton. */}
        {activeProductTab === "stock" ? (
          <StockTab />
        ) : activeProductTab === "robo-advisory" ? (
          <RoboAdvisoryTab
            onRoboAdvisorySelect={nav.onRoboAdvisorySelect}
            onDefinitSelect={nav.onDefinitSelect}
          />
        ) : isLoading ? (
          <ProductCatalogTabSkeleton tab={activeProductTab} />
        ) : (
          <>
            {activeProductTab === "fixed-income" && (
              <FixedIncomeTab onBondSelect={nav.onFixedIncomeBondSelect} />
            )}

            {activeProductTab === "global-bond" && (
              <GlobalBondTab
                onIssuerSelect={nav.onGlobalBondIssuerSelect}
                onViewAll={nav.onAllGlobalBondsView}
              />
            )}

            {activeProductTab === "structured" && (
              <div className="flex flex-col gap-6 items-center w-full" style={{ paddingTop: 24 }}>
                <TopIdeaStrip
                  drag={drag}
                  onTopIdeaSelect={nav.onTopIdeaSelect}
                  onAllTopIdeasView={nav.onAllTopIdeasView}
                />
                <InvestmentSolutionSection onInvestmentSolutionSelect={nav.onInvestmentSolutionSelect} />
                <TopPickSection onProductSelect={nav.onProductSelect} />
                <StructuredProductGridSection
                  title="All Global Structured Product"
                  onProductSelect={nav.onProductSelect}
                  onAllProductsView={nav.onAllProductsView}
                />
              </div>
            )}

            {activeProductTab === "thai-structured" && (
              <div className="flex flex-col gap-6 items-center w-full" style={{ paddingTop: 24 }}>
                <TopIdeaStrip
                  drag={drag}
                  onTopIdeaSelect={nav.onTopIdeaSelect}
                  onAllTopIdeasView={nav.onAllTopIdeasView}
                />
                <InvestmentSolutionSection
                  onInvestmentSolutionSelect={nav.onInvestmentSolutionSelect}
                  bgImage="/products/structured-product/thai-structure-bg.webp"
                />
                <TopPickSection onProductSelect={nav.onProductSelect} />

                {/* ── Thai FCN Table ─────────────────────────────────────────────────── */}
                <div className="w-full" style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}>
                  <div className="flex flex-col gap-4 w-full max-w-[1280px] mx-auto px-4 lg:px-6">
                    <p
                      className="font-bold"
                      style={{ color: "#101828", fontSize: 20, lineHeight: "30px" }}
                    >
                      All Thai FCN
                    </p>
                    <ThaiStructuredProductTable onRowClick={nav.onThaiProductSelect} />
                  </div>
                </div>
              </div>
            )}

            {activeProductTab === "mutual-fund" && (
              <MutualFundTab
                onFundSelect={nav.onMutualFundSelect}
                onTopPerformersSeeAll={nav.onMutualFundTopPerformersSeeAll}
                onInsightsSeeAll={nav.onMutualFundInsightsSeeAll}
                onThemeSeeAll={nav.onMutualFundThemeSeeAll}
              />
            )}
          </>
        )}
      </FadeIn>
    </div>
  );
}
