"use client";

import { Tab } from "@sarunyu/system-one";
import { TabsSkeleton } from "@/components/ui/skeleton";
import { PRODUCT_CATEGORIES } from "@/features/catalog/lib/product-catalog-routes";

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
export function CatalogTabBar({
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
