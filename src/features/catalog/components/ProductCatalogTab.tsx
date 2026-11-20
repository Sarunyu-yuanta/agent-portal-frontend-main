"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Button, Chip, SearchInput, Tab, Tag } from "@sarunyu/system-one";
import {
  ArrowUpLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  ChartLineUpIcon,
} from "@phosphor-icons/react";
import { ChipScroller } from "@/components/ui/chip-scroller";
import { EmptyState, NotFoundState } from "@/components/ui/empty-state";
import { FixedIncomeTab } from "@/features/catalog/fixed-income/components/FixedIncomeTab";
import { FixedIncomeDetail } from "@/features/catalog/fixed-income/components/FixedIncomeDetail";
import { FixedIncomeCompanyDetail } from "@/features/catalog/fixed-income/components/FixedIncomeCompanyDetail";
import type { FixedIncomeBond } from "@/features/catalog/fixed-income/lib/fixed-income-data";
import { GlobalBondTab } from "@/features/catalog/global-bond/components/GlobalBondTab";
import { MutualFundTab } from "@/features/catalog/mutual-fund/components/MutualFundTab";
import { StockTab } from "@/features/catalog/stock/components/StockTab";
import { ProductTrendingTab } from "@/features/catalog/product-trending/components/ProductTrendingTab";
import {
  trendingGroupHref,
  type TrendingSort,
} from "@/features/catalog/product-trending/lib/product-trending-data";
import { RoboAdvisoryTab } from "@/features/catalog/robo-advisory/components/RoboAdvisoryTab";
import { MutualFundDetail } from "@/features/catalog/mutual-fund/components/MutualFundDetail";
import {
  getMutualFund,
  mutualFundGroupHref,
  mutualFundInsightsHref,
  mutualFundThemeHref,
  type MobileFundGroupId,
  type MutualFundThemeId,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { GlobalBondDetail } from "@/features/catalog/global-bond/components/GlobalBondDetail";
import { GlobalBondAllPage } from "@/features/catalog/global-bond/components/GlobalBondAllPage";
import {
  getIssuerIdForBondRow,
  type GlobalBondIssuerId,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  PRODUCT_SEARCH_INDEX,
  matchesProductQuery,
  type ProductSearchItem,
} from "@/features/catalog/lib/product-search-index";
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
} from "@/features/catalog/lib/recent-product-searches";
import { StructuredProductDetail } from "@/features/catalog/structured-product/components/StructuredProductDetail";
import { StructuredProductAllPage } from "@/features/catalog/structured-product/components/StructuredProductAllPage";
import { ThaiStructuredProductTable } from "@/features/catalog/structured-product/components/ThaiStructuredProductTable";
import { ThaiStructuredProductDetail } from "@/features/catalog/structured-product/components/ThaiStructuredProductDetail";
import {
  thaiBookableId,
  type ThaiStructuredProduct,
} from "@/features/catalog/structured-product/lib/thai-structured-data";
import { useOpenProducts } from "@/features/orders/hooks/use-order-books";
import { TopIdeaAllPage } from "@/features/catalog/top-idea/components/TopIdeaAllPage";
import { TopIdeaDetail } from "@/features/catalog/top-idea/components/TopIdeaDetail";
import { InvestmentSolutionDetail } from "@/features/catalog/robo-advisory/components/InvestmentSolutionDetail";
import type { TopIdeaSector } from "@/features/catalog/top-idea/lib/top-idea-data";
import {
  PRODUCT_CATEGORIES,
  advisoryDetailHref,
} from "@/features/catalog/lib/product-catalog-routes";
import { useScrollThreshold } from "@/features/catalog/hooks/use-scroll-threshold";
import { useDragScroll } from "@/features/catalog/hooks/use-drag-scroll";
import {
  useFixedIncomeCompanyDetail,
  useGlobalBondIssuer,
  useProductCatalogLoading,
} from "@/features/catalog/hooks/use-catalog";
import { useLocalizedRouter } from "@/i18n/navigation";
import { FadeIn } from "@/components/ui/fade-in";
import { ProductCatalogTabSkeleton } from "./ProductCatalogSkeletons";
import {
  FixedIncomeCompanyDetailSkeleton,
  GlobalBondDetailSkeleton,
} from "./ProductDetailSkeletons";
import { Skeleton, TabsSkeleton } from "@/components/ui/skeleton";
import type { StructuredProduct } from "@/features/catalog/structured-product/lib/structured-product-data";
import {
  getInvestmentSolution,
  type InvestmentSolutionId,
} from "@/features/catalog/robo-advisory/lib/investment-solution-data";
import {
  InvestmentSolutionSection,
  StructuredProductGridSection,
  TopIdeaStrip,
  TopPickSection,
} from "./ProductCatalogSections";
import { pageZoom } from "@/lib/page-zoom";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";
import { useHasLoaded } from "@/lib/api/resource";

const SEARCH_MODAL_PADDING = 12;
const MAX_SEARCH_RESULTS = 20;

/**
 * Tabs whose nav shape shipped ahead of their content — the catalog reads as
 * complete while the data behind them is still being built, the same bargain
 * the coming-soon sidebar pages make. Each renders nothing but an empty state;
 * drop the entry here once the tab has a real view to show.
 */
const EMPTY_CATALOG_TABS: Record<string, { icon: ReactNode }> = {
  // Title and body: `t.products.catalog.emptyTabs[id]`.
  tfex: {
    icon: <ChartLineUpIcon size={40} className="text-[var(--text-default-placeholder)]" />,
  },
};

/** The one tab that spans every asset class instead of naming one — and so the
 *  one tab that doesn't look like the rest. See `.tab-shimmer` in `globals.css`. */
const TRENDING_TAB_ID = "product-trending";

/**
 * The catalog's tab bar: `TabGroup`'s own `role="tablist"` + `Tab` children,
 * spelled out here rather than delegated to it.
 *
 * `TabGroup` renders every item identically and `TabItem.title` is a plain
 * string, so there is no per-item hook to hang the Product Trending treatment
 * on. Mapping the items here is the smallest way to get one: same `Tab`
 * component, same order, same spacing — one of them carries an icon and a
 * class the others don't. (Rendering that tab beside a `TabGroup` holding the
 * rest would nest two tablists, which is worse than not using `TabGroup`.)
 */
function CatalogTabBar({
  activeId,
  onChange,
  hasLoaded,
}: {
  activeId: string;
  onChange: (id: string) => void;
  /** False until the catalog's first load — the strip is bars until then. */
  hasLoaded: boolean;
}) {
  if (!hasLoaded) return <TabsSkeleton count={PRODUCT_CATEGORIES.length} className="w-max" />;
  return (
    <div role="tablist" className="flex w-max">
      {PRODUCT_CATEGORIES.map((category) => {
        const isActive = activeId === category.id;
        // Once selected it reads like any other active tab; the shimmer is
        // only there to draw the eye while it isn't.
        const shimmer = category.id === TRENDING_TAB_ID && !isActive;
        return (
          <Tab
            key={category.id}
            title={category.title}
            size="md"
            active={isActive}
            onClick={() => onChange(category.id)}
            className={shimmer ? "tab-shimmer" : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * The desktop tab strip outgrows the 1280px column once every category is
 * shown, and a mouse has no horizontal axis to scroll it with — so, like
 * `ChipScroller`, it gets caret buttons on whichever side still has tabs
 * hidden. The fade matches the strip's own background (the bottom of the
 * header's white→#f7f7f7 gradient) and stops above the tabs' underline.
 */
function TabStripScroller({
  className = "",
  activeKey,
  children,
}: {
  className?: string;
  /** Changes when the selected tab changes — the strip then scrolls it fully into view. */
  activeKey?: string;
  children: ReactNode;
}) {
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  // A wrapper that outlives its children: the strip swaps from skeleton bars to
  // the real tabs, which changes its width without resizing the viewport.
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const update = () =>
      setOverflow({
        left: el.scrollLeft > 1,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(content);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  // Bring the selected tab clear of the edge fades when it's clipped. Done by
  // hand rather than `scrollIntoView`, which would also scroll the page
  // vertically to reach it.
  useEffect(() => {
    const el = scrollRef.current;
    const tab = el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!el || !tab) return;
    const FADE = 48;
    const view = el.getBoundingClientRect();
    const box = tab.getBoundingClientRect();
    let delta = 0;
    if (box.right > view.right - FADE) delta = box.right - (view.right - FADE);
    else if (box.left < view.left + FADE) delta = box.left - (view.left + FADE);
    if (delta !== 0) el.scrollBy({ left: delta, behavior: "smooth" });
  }, [activeKey]);

  const step = (direction: 1 | -1) =>
    scrollRef.current?.scrollBy({
      left: direction * Math.round(scrollRef.current.clientWidth * 0.6),
      behavior: "smooth",
    });

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={scrollRef}
          className="overflow-x-auto pl-4 [--bg-default-primary:transparent] lg:pl-6"
          style={{ scrollbarWidth: "none" }}
        >
          <div ref={contentRef} className="w-max">
            {children}
          </div>
        </div>
        {(["left", "right"] as const).map((side) => {
          if (!overflow[side]) return null;
          const isLeft = side === "left";
          return (
            <div
              key={side}
              className={`pointer-events-none absolute top-0 bottom-[2px] flex items-center ${
                isLeft
                  ? "left-0 bg-gradient-to-r from-[#f7f7f7] via-[#f7f7f7] to-transparent pr-8 pl-1.5"
                  : "right-0 bg-gradient-to-l from-[#f7f7f7] via-[#f7f7f7] to-transparent pr-1.5 pl-8"
              }`}
            >
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => step(isLeft ? -1 : 1)}
                aria-label={
                  isLeft ? t.products.common.scrollTabsLeft : t.products.common.scrollTabsRight
                }
                className="pointer-events-auto"
              >
                {isLeft ? <CaretLeftIcon size={16} /> : <CaretRightIcon size={16} />}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  onTrendingSeeAll: (groupId: string, sort: TrendingSort) => void;
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
  const t = useT();
  const labels = t.products.catalog;
  const router = useLocalizedRouter();
  const [activeTabInternal, setActiveTabInternal] = useState("structured");
  const activeProductTab = activeCategory ?? activeTabInternal;
  const [selectedFixedIncomeBond, setSelectedFixedIncomeBond] = useState<FixedIncomeBond | null>(
    null,
  );
  const [selectedFixedIncomeCompany, setSelectedFixedIncomeCompany] = useState<string | null>(null);
  const [fixedIncomeView, setFixedIncomeView] = useState<"bond" | "company" | null>(null);
  const [selectedGlobalBondIssuer, setSelectedGlobalBondIssuer] =
    useState<GlobalBondIssuerId | null>(null);
  const [showAllGlobalBonds, setShowAllGlobalBonds] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StructuredProduct | null>(null);
  const [selectedTopIdea, setSelectedTopIdea] = useState<TopIdeaSector | null>(null);
  const [selectedInvestmentSolution, setSelectedInvestmentSolution] =
    useState<InvestmentSolutionId | null>(null);
  const [showAllTopIdeas, setShowAllTopIdeas] = useState(false);
  const [showAllStructuredProducts, setShowAllStructuredProducts] = useState(false);
  const [selectedThaiProduct, setSelectedThaiProduct] = useState<ThaiStructuredProduct | null>(
    null,
  );
  const [selectedMutualFundId, setSelectedMutualFundId] = useState<string | null>(null);

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

  const mobileScrolled = useScrollThreshold();
  const drag = useDragScroll();
  const isLoading = useProductCatalogLoading();
  const hasLoaded = useHasLoaded(isLoading);

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
    onInvestmentSolutionSelect:
      navigation?.onInvestmentSolutionSelect ?? setSelectedInvestmentSolution,
    onFixedIncomeBondSelect:
      navigation?.onFixedIncomeBondSelect ??
      ((bond: FixedIncomeBond) => {
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
    onTrendingSeeAll:
      navigation?.onTrendingSeeAll ??
      ((groupId: string, sort: TrendingSort) => router.push(trendingGroupHref(groupId, sort))),
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
        // A bond with no issuer page still has a home: the full overseas list
        // it is part of. Picking it used to close the overlay and do nothing.
        if (issuerId) nav.onGlobalBondIssuerSelect(issuerId);
        else nav.onAllGlobalBondsView();
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
        <div className="flex w-full flex-col">
          <MutualFundDetail fund={fund} onBack={() => setSelectedMutualFundId(null)} />
        </div>
      );
    }
  }

  if (!navigation && selectedThaiProduct) {
    return (
      <div className="flex w-full flex-col">
        <ThaiStructuredProductDetail
          product={selectedThaiProduct}
          onBack={() => setSelectedThaiProduct(null)}
        />
      </div>
    );
  }

  if (!navigation && showAllGlobalBonds) {
    return (
      <div className="flex w-full flex-col">
        <GlobalBondAllPage onBack={() => setShowAllGlobalBonds(false)} />
      </div>
    );
  }

  if (!navigation && selectedGlobalBondIssuer) {
    return (
      <div className="flex w-full flex-col">
        <InlineGlobalBondDetail
          issuerId={selectedGlobalBondIssuer}
          onBack={() => setSelectedGlobalBondIssuer(null)}
          onIssuerSelect={setSelectedGlobalBondIssuer}
        />
      </div>
    );
  }

  if (!navigation && fixedIncomeView === "bond" && selectedFixedIncomeBond) {
    return (
      <div className="flex w-full flex-col">
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
      <div className="flex w-full flex-col">
        <InlineFixedIncomeCompanyDetail
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
      <div className="flex w-full flex-col">
        <StructuredProductDetail
          product={selectedProduct}
          onBack={() => setSelectedProduct(null)}
        />
      </div>
    );
  }

  if (!navigation && selectedTopIdea) {
    return (
      <div className="flex w-full flex-col">
        <TopIdeaDetail
          sector={selectedTopIdea}
          onBack={() => setSelectedTopIdea(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  const pickedSolution = selectedInvestmentSolution
    ? getInvestmentSolution(selectedInvestmentSolution)
    : undefined;
  if (!navigation && pickedSolution) {
    return (
      <div className="flex w-full flex-col">
        <InvestmentSolutionDetail
          solution={pickedSolution}
          onBack={() => setSelectedInvestmentSolution(null)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  if (!navigation && showAllTopIdeas) {
    return (
      <div className="flex w-full flex-col">
        <TopIdeaAllPage
          onBack={() => setShowAllTopIdeas(false)}
          onSelect={(sector) => setSelectedTopIdea(sector)}
        />
      </div>
    );
  }

  if (!navigation && showAllStructuredProducts) {
    return (
      <div className="flex w-full flex-col">
        <StructuredProductAllPage
          onBack={() => setShowAllStructuredProducts(false)}
          onProductSelect={(product) => setSelectedProduct(product)}
        />
      </div>
    );
  }

  return (
    // Root: full-bleed — negative margin + matching width expansion
    <div className="flex w-full flex-1 flex-col" style={{ backgroundColor: "white" }}>
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

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <FadeIn key={activeProductTab} className="flex w-full flex-col">
        {/* Stock and Robo Advisory skip the catalog's shared loading
            skeleton: Stock reads its market through `useMarketCatalog` and
            renders its own (`StockTabSkeleton`); Robo Advisory's data is local
            mock content, but its cards open a client picker, so it shows its
            own skeleton until the client list is in. */}
        {activeProductTab === "stock" ? (
          <StockTab />
        ) : activeProductTab === "product-trending" ? (
          /* Renders its own skeleton (via `useProductTrendingGroups`), so it
             skips the catalog's shared one alongside Stock. */
          <ProductTrendingTab nav={nav} />
        ) : EMPTY_CATALOG_TABS[activeProductTab] ? (
          /* Sits in the no-skeleton branch because there is nothing to wait for. */
          <div className="w-full bg-white">
            <div className="mx-auto w-full max-w-[1280px] px-4 py-12 lg:px-6">
              <EmptyState
                {...EMPTY_CATALOG_TABS[activeProductTab]}
                title={labels.emptyTabs[activeProductTab]?.title ?? ""}
                body={labels.emptyTabs[activeProductTab]?.body ?? ""}
              />
            </div>
          </div>
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
              <div className="flex w-full flex-col items-center gap-6" style={{ paddingTop: 24 }}>
                <TopIdeaStrip
                  drag={drag}
                  onTopIdeaSelect={nav.onTopIdeaSelect}
                  onAllTopIdeasView={nav.onAllTopIdeasView}
                />
                <InvestmentSolutionSection
                  onInvestmentSolutionSelect={nav.onInvestmentSolutionSelect}
                />
                <TopPickSection onProductSelect={nav.onProductSelect} />
                <StructuredProductGridSection
                  title={labels.allGlobalStructured}
                  onProductSelect={nav.onProductSelect}
                  onAllProductsView={nav.onAllProductsView}
                />
              </div>
            )}

            {activeProductTab === "thai-structured" && (
              <div className="flex w-full flex-col items-center gap-6" style={{ paddingTop: 24 }}>
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
                <div
                  className="w-full"
                  style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}
                >
                  <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 px-4 lg:px-6">
                    <p
                      className="font-bold"
                      style={{ color: "#101828", fontSize: 22, lineHeight: "32px" }}
                    >
                      {labels.allThaiFcn}
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

/**
 * The state-based (client page) counterparts of the catalog's
 * `global-bond/[issuerId]` and `fixed-income/company/[companyId]` routes: the
 * same lookup, in the same order — skeleton, then not-found, then the detail.
 */
function InlineGlobalBondDetail({
  issuerId,
  onBack,
  onIssuerSelect,
}: {
  issuerId: GlobalBondIssuerId;
  onBack: () => void;
  onIssuerSelect: (issuerId: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const { data: issuer, isLoading } = useGlobalBondIssuer(issuerId);
  if (isLoading) return <GlobalBondDetailSkeleton />;
  if (!issuer) return <NotFoundState message={t.products.notFound.issuer} onBack={onBack} />;
  return <GlobalBondDetail issuer={issuer} onBack={onBack} onIssuerSelect={onIssuerSelect} />;
}

function InlineFixedIncomeCompanyDetail({
  companyId,
  onBack,
  onBondSelect,
}: {
  companyId: string;
  onBack: () => void;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  const { data: detail, isLoading } = useFixedIncomeCompanyDetail(companyId);
  if (isLoading) {
    return <FixedIncomeCompanyDetailSkeleton hasSecondary={detail.secondaryBonds.length > 0} />;
  }
  if (!detail.company)
    return <NotFoundState message={t.products.notFound.company} onBack={onBack} />;
  return (
    <FixedIncomeCompanyDetail
      company={detail.company}
      primaryBonds={detail.primaryBonds}
      secondaryBonds={detail.secondaryBonds}
      onBack={onBack}
      onBondSelect={onBondSelect}
    />
  );
}
