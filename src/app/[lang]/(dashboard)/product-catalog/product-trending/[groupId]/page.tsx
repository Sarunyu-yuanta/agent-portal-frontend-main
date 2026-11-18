"use client";

import { use } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ProductTrendingAllTable,
  ProductTrendingAllTableSkeleton,
} from "../../../client/[id]/ProductTrendingAllTable";
import { useProductTrendingGroups } from "@/hooks/use-catalog";
import { useTrendingSelect } from "../../../client/[id]/ProductTrendingTab";
import {
  DEFAULT_TRENDING_SORT,
  normalizeTrendingSort,
  trendingUpdatedAt,
  TRENDING_SORT_PARAM,
} from "../../../client/[id]/product-trending-data";
import { setQueryState, withQuery } from "@/lib/query-state";
import { useSectionBack } from "@/hooks/use-section-back";
import { CatalogNotFound } from "../../CatalogNotFound";

export default function ProductTrendingGroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = use(params);
  const { data: groups, isLoading } = useProductTrendingGroups();
  const id = decodeURIComponent(groupId);
  const group = groups.find((g) => g.id === id);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Arrives in the order the card was showing; changing it here stays here.
  const sort = normalizeTrendingSort(searchParams.get(TRENDING_SORT_PARAM));
  const goBack = useSectionBack();
  const select = useTrendingSelect({
    onMutualFundSelect: (fundId) =>
      router.push(`/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`),
    onFixedIncomeBondSelect: (bond) =>
      router.push(`/product-catalog/fixed-income/bond/${bond.id}`),
    onThaiProductSelect: (p) =>
      router.push(`/product-catalog/thai-structured/${encodeURIComponent(p.theme)}`),
    onProductSelect: (p) => router.push(`/product-catalog/product/${p.id}`),
    onGlobalBondIssuerSelect: (id) => router.push(`/product-catalog/global-bond/${id}`),
  });

  // Loading above not-found, or every visit flashes "ไม่พบ…" before data lands.
  if (isLoading) return <ProductTrendingAllTableSkeleton />;

  if (!group) {
    return <CatalogNotFound message="ไม่พบหมวดสินค้านี้" onBack={goBack} />;
  }

  return (
    <ProductTrendingAllTable
      group={group}
      updatedAt={trendingUpdatedAt(group.measure)}
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
