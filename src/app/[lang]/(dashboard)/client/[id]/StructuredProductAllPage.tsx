"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button, Chip } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { StructuredProductCard } from "./StructuredProductCard";
import {
  ALL_STRUCTURED_PRODUCTS_COUNT,
  ALL_STRUCTURED_PRODUCTS_UPDATED_AT,
  ALL_STRUCTURED_PRODUCTS_UPDATED_AT_TABLET,
  type StructuredProduct,
} from "./structured-product-data";
import { useStructuredProducts } from "@/hooks/use-catalog";
import { StructuredProductAllPageSkeleton } from "./ProductDetailSkeletons";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

/** Labelled at render from `t.products.structured.couponFilter`. */
const COUPON_FILTERS = ["all", "low", "medium", "high", "ultra"] as const;

type CouponFilter = (typeof COUPON_FILTERS)[number];

export function StructuredProductAllPage({
  onBack,
  onProductSelect,
}: {
  onBack: () => void;
  onProductSelect: (product: StructuredProduct) => void;
}) {
  const t = useT();
  const labels = t.products.structured.all;
  const { data: allProducts, isLoading } = useStructuredProducts();
  const [couponFilter, setCouponFilter] = useState<CouponFilter>("all");

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  if (isLoading) return <StructuredProductAllPageSkeleton />;

  const filteredProducts = allProducts.filter((p) => {
    if (couponFilter === "all") return true;
    const pct = parseFloat(p.coupon.replace("%", ""));
    if (couponFilter === "low") return pct < 15;
    if (couponFilter === "medium") return pct >= 15 && pct < 30;
    if (couponFilter === "high") return pct >= 30 && pct < 40;
    return pct >= 40;
  });

  return (
    <div className="flex w-full flex-col items-center bg-gradient-to-b from-white from-[43.451%] to-transparent pt-4 pb-10 md:pt-4 md:pb-10 lg:pt-6 lg:pb-20">
      <div className="flex w-full max-w-[1280px] flex-col gap-4 px-4 md:px-8 lg:gap-6 lg:px-20">
        {/* Header */}
        <div className="flex h-[46px] items-center gap-2 py-2">
          <Button
            variant="plain"
            size="icon-sm"
            onClick={onBack}
            aria-label={t.products.common.back}
            className="shrink-0"
          >
            <ArrowLeftIcon size={20} />
          </Button>
          <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-[#101828]">
            {labels.title}
          </h1>
        </div>

        {/* Hero banner — tablet: H4 24px / Subtitle2 14px; desktop: H3 32px / Subtitle1 16px */}
        <div className="relative flex w-full flex-col items-start gap-2 overflow-hidden rounded-xl p-4 lg:h-[144px] lg:p-8">
          <Image
            alt=""
            aria-hidden
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="pointer-events-none max-w-none rounded-xl object-cover"
            src="/products/structured-product/structured-products-all-banner-bg.webp"
          />
          <div className="relative z-[1] flex max-w-[220px] flex-col gap-2 md:max-w-none">
            <p className="text-2xl leading-9 font-bold text-[#101828] lg:text-[32px] lg:leading-[48px] lg:text-[rgba(0,0,0,0.85)]">
              {labels.title}
            </p>
            <p className="text-sm leading-[24px] font-bold text-[#4a5565] lg:text-base lg:leading-[28px] lg:text-[rgba(0,0,0,0.75)]">
              {labels.subtitle}
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="-mx-4 overflow-x-auto pb-1 md:-mx-8 lg:mx-0"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex min-w-max gap-2 pr-4 pl-4 md:pr-8 md:pl-8 lg:pr-0 lg:pl-0">
            {COUPON_FILTERS.map((key) => (
              <Chip
                key={key}
                label={t.products.structured.couponFilter[key]}
                size="medium"
                selected={couponFilter === key}
                onClick={() => setCouponFilter(key)}
              />
            ))}
          </div>
        </div>

        {/* Product list — mobile/tablet: single-col vertical cards; desktop: 3-col grid */}
        <div className="flex w-full flex-col gap-3 lg:gap-4">
          <div className="flex w-full items-center justify-between text-xs leading-[20px] text-[#6a7282] lg:text-sm lg:leading-[24px]">
            {/* The feed's total unfiltered; what the chip left once one is picked. */}
            <span>
              {t.products.common.itemCount(
                couponFilter === "all" ? ALL_STRUCTURED_PRODUCTS_COUNT : filteredProducts.length,
              )}
            </span>
            <span className="ml-2 shrink-0 text-right">
              <span className="lg:hidden">
                {t.products.common.updatedAt(ALL_STRUCTURED_PRODUCTS_UPDATED_AT_TABLET)}
              </span>
              <span className="hidden lg:inline">
                {t.products.common.updatedAt(ALL_STRUCTURED_PRODUCTS_UPDATED_AT)}
              </span>
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <CatalogSectionEmpty
              title={t.products.states.noOpenProducts}
              onClearFilters={
                allProducts.length > 0 && couponFilter !== "all"
                  ? () => setCouponFilter("all")
                  : undefined
              }
            />
          ) : (
            <div className="flex w-full flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4">
              {filteredProducts.map((product) => (
                <StructuredProductCard
                  key={product.id}
                  {...product}
                  variant="catalog"
                  onClick={() => onProductSelect(product)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
