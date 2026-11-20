"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname, useLocalizedRouter } from "@/i18n/navigation";
import {
  ProductTrendingAllTable,
  ProductTrendingAllTableSkeleton,
} from "@/features/catalog/product-trending/components/ProductTrendingAllTable";
import { useProductTrendingGroups } from "@/features/catalog/hooks/use-catalog";
import { useTrendingSelect } from "@/features/catalog/product-trending/components/ProductTrendingTab";
import {
  DEFAULT_TRENDING_SORT,
  normalizeTrendingSort,
  trendingUpdatedAt,
  TRENDING_SORT_PARAM,
} from "@/features/catalog/product-trending/lib/product-trending-data";
import { setQueryState, withQuery } from "@/lib/query-state";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
import { useT } from "@/i18n/I18nProvider";

export default function ProductTrendingGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const t = useT();
  const { groupId } = use(params);
  const { data: groups, isLoading } = useProductTrendingGroups();
  const id = decodeURIComponent(groupId);
  const group = groups.find((g) => g.id === id);
  const router = useLocalizedRouter();
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  // Arrives in the order the card was showing; changing it here stays here.
  const sort = normalizeTrendingSort(searchParams.get(TRENDING_SORT_PARAM));
  const goBack = useSectionBack();
  const select = useTrendingSelect({
    onMutualFundSelect: (fundId) =>
      router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`),
    onFixedIncomeBondSelect: (bond) => router.push(`/product-catalog/fixed-income/bond/${bond.id}`),
    onThaiProductSelect: (p) =>
      router.push(`/product-catalog/thai-structured/${encodeURIComponent(p.theme)}`),
    onProductSelect: (p) => router.push(`/product-catalog/product/${p.id}`),
    onGlobalBondIssuerSelect: (id) => router.push(`/product-catalog/global-bond/${id}`),
  });

  // Loading above not-found, or every visit flashes "ไม่พบ…" before data lands.
  if (isLoading) return <ProductTrendingAllTableSkeleton />;

  if (!group) {
    return <CatalogNotFound message={t.products.notFound.productGroup} onBack={goBack} />;
  }

  return (
    <ProductTrendingAllTable
      group={group}
      updatedAt={trendingUpdatedAt(group.measure, t)}
      sort={sort}
      onSortChange={(next) =>
        setQueryState(
          withQuery(pathname, searchParams, {
            [TRENDING_SORT_PARAM]: next === DEFAULT_TRENDING_SORT ? null : next,
          }),
        )
      }
      onBack={goBack}
      onSelect={select}
    />
  );
}
