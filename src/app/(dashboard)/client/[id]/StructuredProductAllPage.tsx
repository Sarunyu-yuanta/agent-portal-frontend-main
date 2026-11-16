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

const COUPON_FILTERS = [
  { key: "all", label: "ALL" },
  { key: "low", label: "Low Coupon [0-15%]" },
  { key: "medium", label: "Medium Coupon [15-30%]" },
  { key: "high", label: "High Coupon [30-40%]" },
  { key: "ultra", label: "Ultra High Coupon [40% ++]" },
] as const;

type CouponFilter = typeof COUPON_FILTERS[number]["key"];

export function StructuredProductAllPage({
  onBack,
  onProductSelect,
}: {
  onBack: () => void;
  onProductSelect: (product: StructuredProduct) => void;
}) {
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
    <div className="flex flex-col items-center w-full pt-4 pb-10 md:pt-4 md:pb-10 lg:pt-6 lg:pb-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      <div className="flex flex-col gap-4 lg:gap-6 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
        {/* Header */}
        <div className="flex gap-2 items-center h-[46px] py-2">
          <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
            <ArrowLeftIcon size={20} />
          </Button>
          <h1 className="flex-1 min-w-0 text-lg font-bold leading-[30px] text-[#101828] truncate">
            Structured Products ทั้งหมด
          </h1>
        </div>

        {/* Hero banner — tablet: H4 24px / Subtitle2 14px; desktop: H3 32px / Subtitle1 16px */}
        <div className="relative flex w-full flex-col gap-2 items-start overflow-hidden rounded-xl p-4 lg:h-[144px] lg:p-8">
          <Image
            alt=""
            aria-hidden
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="max-w-none object-cover pointer-events-none rounded-xl"
            src="/products/structured-product/structured-products-all-banner-bg.webp"
          />
          <div className="relative z-[1] flex max-w-[220px] flex-col gap-2 md:max-w-none">
            <p className="text-2xl font-bold leading-9 text-[#101828] lg:text-[32px] lg:leading-[48px] lg:text-[rgba(0,0,0,0.85)]">
              All Structured Products
            </p>
            <p className="text-sm font-bold leading-[24px] text-[#4a5565] lg:text-base lg:leading-[28px] lg:text-[rgba(0,0,0,0.75)]">
              รวม Structured Products ทั้งหมด ที่สามารถทำการซื้อขายได้
            </p>
          </div>
        </div>

        {/* Filter chips */}
        <div className="-mx-4 md:-mx-8 lg:mx-0 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <div className="flex gap-2 min-w-max pl-4 md:pl-8 lg:pl-0 pr-4 md:pr-8 lg:pr-0">
            {COUPON_FILTERS.map(({ key, label }) => (
              <Chip
                key={key}
                label={label}
                size="medium"
                selected={couponFilter === key}
                onClick={() => setCouponFilter(key)}
              />
            ))}
          </div>
        </div>

        {/* Product list — mobile/tablet: single-col vertical cards; desktop: 3-col grid */}
        <div className="flex flex-col gap-3 lg:gap-4 w-full">
          <div className="flex items-center justify-between w-full text-xs leading-[20px] lg:text-sm lg:leading-[24px] text-[#6a7282]">
            <span>จำนวน {ALL_STRUCTURED_PRODUCTS_COUNT} รายการ</span>
            <span className="text-right shrink-0 ml-2">
              <span className="lg:hidden">อัปเดตล่าสุด {ALL_STRUCTURED_PRODUCTS_UPDATED_AT_TABLET}</span>
              <span className="hidden lg:inline">อัปเดตล่าสุด {ALL_STRUCTURED_PRODUCTS_UPDATED_AT}</span>
            </span>
          </div>

          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-4 w-full">
            {filteredProducts.map((product) => (
              <StructuredProductCard
                key={product.id}
                {...product}
                variant="catalog"
                onClick={() => onProductSelect(product)}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
