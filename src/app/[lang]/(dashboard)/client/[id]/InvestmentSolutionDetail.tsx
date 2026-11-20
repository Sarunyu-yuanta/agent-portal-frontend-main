"use client";

import { useEffect, type CSSProperties } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { StructuredProductCard } from "./StructuredProductCard";
import {
  INVESTMENT_SOLUTION_UPDATED_AT,
  INVESTMENT_SOLUTION_UPDATED_AT_MOBILE,
  type InvestmentSolution,
} from "./investment-solution-data";
import {
  INVESTMENT_SOLUTION_DETAIL_PRODUCTS,
  type StructuredProduct,
} from "./structured-product-data";
import { useOpenProducts } from "@/app/[lang]/(dashboard)/orders/use-order-books";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

function HeroImageContent({
  src,
  width,
  height,
  objectCover,
  imgLeft,
  imgWidth,
  rotation,
}: {
  src: string;
  width: number;
  height: number;
  objectCover?: boolean;
  imgLeft?: string;
  imgWidth?: string;
  rotation?: number;
}) {
  const inner = objectCover ? (
    // `fill` is exactly this layer's old `absolute inset-0 size-full`, and the
    // solution artwork is the heaviest asset in the app — worth optimizing.
    <Image
      alt=""
      fill
      priority
      sizes="(max-width: 1280px) 100vw, 1280px"
      className="pointer-events-none max-w-none object-cover"
      style={{ mixBlendMode: "screen" }}
      src={src}
    />
  ) : (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Stays a plain <img>: this layer is a Figma crop, positioned by a
          computed `left`/`width` pair against its own intrinsic size. `fill`
          hard-codes inset-0 + 100%/100% and cannot express that offset. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- percentage-cropped art layer, see above */}
      <img
        alt=""
        className="absolute top-0 h-full max-w-none"
        style={{ left: imgLeft, width: imgWidth, mixBlendMode: "screen" }}
        src={src}
      />
    </div>
  );

  if (rotation) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div style={{ transform: `rotate(${rotation}deg)`, flexShrink: 0, width, height }}>
          <div className="relative size-full">{inner}</div>
        </div>
      </div>
    );
  }

  return <div className="relative size-full">{inner}</div>;
}

function anchorHeroImageStyle(
  anchorLeftPx: number,
  width: number,
  height: number,
  anchorTopOffset?: number,
): CSSProperties {
  return {
    left: anchorLeftPx,
    top: anchorTopOffset != null ? `calc(50% - ${anchorTopOffset}px)` : "50%",
    transform: "translate(-50%, -50%)",
    width,
    height,
  };
}

function SolutionHeroBannerMobile({ solution }: { solution: InvestmentSolution }) {
  const img = solution.heroBannerImage;
  const mobile = img.mobile;

  const heroImage = (
    <HeroImageContent
      src={solution.heroImage}
      width={mobile.width}
      height={mobile.height}
      objectCover={img.objectCover}
      imgLeft={img.imgLeft}
      imgWidth={img.imgWidth}
      rotation={img.rotation}
    />
  );

  const textBlock = (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <p className="w-full truncate text-title-sm leading-[28px] font-bold text-[#101828]">
        {solution.name}
      </p>
      <p className="w-full truncate text-label leading-[20px] text-[#6a7282]">{solution.desc}</p>
    </div>
  );

  const couponBlock = solution.showCoupon ? (
    <div className="relative z-10 flex shrink-0 flex-col items-end justify-center gap-0.5">
      <div className="flex items-center rounded-md bg-white px-1">
        <span className="text-title leading-[28px] font-bold text-[#008236]">
          {solution.couponRange}
        </span>
      </div>
      <span className="text-xs leading-[20px] text-[#6a7282]">Coupon</span>
    </div>
  ) : null;

  // Figma 34995:49778 — Secure Income & Balanced Growth use fixed icon + text at x=80
  if (mobile.leftPx != null) {
    const textLeftPx = 80;
    const gapAfterIcon = textLeftPx - mobile.leftPx - mobile.width;
    const iconTopOffset = (mobile.topPx ?? 0) - 16; // pt-4 = 16px

    return (
      <div
        className="relative -mb-6 box-border flex w-full shrink-0 items-center overflow-hidden pt-4 pr-3 pb-10 md:hidden"
        style={{
          height: mobile.bannerHeight,
          backgroundImage: solution.heroGradientMobile,
        }}
      >
        <div
          className="pointer-events-none relative z-0 shrink-0 overflow-hidden"
          style={{
            marginLeft: mobile.leftPx,
            marginTop: iconTopOffset,
            width: mobile.width,
            height: mobile.height,
          }}
          aria-hidden
        >
          {heroImage}
        </div>

        <div
          className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center gap-0"
          style={{ marginLeft: gapAfterIcon }}
        >
          <p className="w-full truncate text-title-sm leading-[28px] font-bold text-[#101828]">
            {solution.name}
          </p>
          <p className="w-full truncate text-label leading-[20px] text-[#6a7282]">
            {solution.desc}
          </p>
        </div>

        {couponBlock}
      </div>
    );
  }

  // High Conviction — Figma 34995:49790: anchor at calc(50%-167.56px) = 19.94px on 375px frame
  return (
    <div
      className="relative -mb-6 box-border flex w-full shrink-0 items-center overflow-hidden pt-4 pr-3 pb-10 pl-20 md:hidden"
      style={{
        height: mobile.bannerHeight,
        gap: mobile.gap ?? 16,
        backgroundImage: solution.heroGradientMobile,
      }}
    >
      <div
        className="pointer-events-none absolute z-0 flex items-center justify-center overflow-hidden"
        style={anchorHeroImageStyle(mobile.anchorLeftPx!, mobile.width, mobile.height)}
        aria-hidden
      >
        {heroImage}
      </div>

      {textBlock}
      {couponBlock}
    </div>
  );
}

function SolutionHeroBannerTablet({ solution }: { solution: InvestmentSolution }) {
  const img = solution.heroBannerImage;
  const tablet = img.tablet;

  const heroImage = (
    <HeroImageContent
      src={solution.heroImage}
      width={tablet.width}
      height={tablet.height}
      objectCover={img.objectCover}
      imgLeft={img.imgLeft}
      imgWidth={img.imgWidth}
      rotation={img.rotation}
    />
  );

  const textBlock = (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center gap-0">
      <p className="w-full truncate text-title-sm leading-[28px] font-bold text-[#101828]">
        {solution.name}
      </p>
      <p className="w-full truncate text-label leading-[20px] text-[#6a7282]">{solution.desc}</p>
    </div>
  );

  const couponBlock = solution.showCoupon ? (
    <div className="relative z-10 flex shrink-0 flex-col items-end justify-center gap-0.5">
      <div className="flex items-center rounded-md bg-white px-1">
        <span className="text-title leading-[28px] font-bold text-[#008236]">
          {solution.couponRange}
        </span>
      </div>
      <span className="text-xs leading-[20px] text-[#6a7282]">Coupon</span>
    </div>
  ) : null;

  if (tablet.leftPx != null) {
    const textLeftPx = 96;
    const gapAfterIcon = textLeftPx - tablet.leftPx - tablet.width;
    const iconTopOffset = (tablet.topPx ?? 0) - 16;

    return (
      <div
        className="relative -mb-6 box-border hidden w-full shrink-0 items-center overflow-hidden pt-4 pr-8 pb-10 md:flex lg:hidden"
        style={{
          height: tablet.bannerHeight,
          backgroundImage: solution.heroGradientTablet,
        }}
      >
        <div
          className="pointer-events-none relative z-0 shrink-0 overflow-hidden"
          style={{
            marginLeft: tablet.leftPx,
            marginTop: iconTopOffset,
            width: tablet.width,
            height: tablet.height,
          }}
          aria-hidden
        >
          {heroImage}
        </div>

        <div
          className="relative z-10 flex min-w-0 flex-1 flex-col items-start justify-center gap-0"
          style={{ marginLeft: gapAfterIcon }}
        >
          <p className="w-full truncate text-title-sm leading-[28px] font-bold text-[#101828]">
            {solution.name}
          </p>
          <p className="w-full truncate text-label leading-[20px] text-[#6a7282]">
            {solution.desc}
          </p>
        </div>

        {couponBlock}
      </div>
    );
  }

  return (
    <div
      className="relative -mb-6 box-border hidden w-full shrink-0 items-center gap-4 overflow-hidden pt-4 pr-8 pb-10 pl-[96px] md:flex lg:hidden"
      style={{
        height: tablet.bannerHeight,
        backgroundImage: solution.heroGradientTablet,
      }}
    >
      <div
        className="pointer-events-none absolute z-0 flex items-center justify-center overflow-hidden"
        style={anchorHeroImageStyle(tablet.anchorLeftPx!, tablet.width, tablet.height)}
        aria-hidden
      >
        {heroImage}
      </div>

      {textBlock}
      {couponBlock}
    </div>
  );
}

function SolutionHeroBannerDesktop({ solution }: { solution: InvestmentSolution }) {
  const img = solution.heroBannerImage;

  const imageStyle: CSSProperties =
    img.anchorLeftPx != null
      ? anchorHeroImageStyle(
          img.anchorLeftPx,
          img.containerWidth,
          img.containerHeight,
          img.topOffset,
        )
      : {
          left: img.leftPx,
          top: `calc(50% - ${img.topOffset}px)`,
          transform: "translateY(-50%)",
          width: img.containerWidth,
          height: img.containerHeight,
        };

  return (
    <div
      className="relative -mb-6 box-border hidden h-[146px] w-full shrink-0 overflow-hidden lg:flex"
      style={{ backgroundImage: solution.heroGradient }}
    >
      <div className="relative mx-auto flex h-full w-full max-w-[1280px] items-center gap-4 pt-4 pr-8 pb-10">
        <div
          className="pointer-events-none absolute z-0 overflow-hidden"
          style={imageStyle}
          aria-hidden
        >
          <HeroImageContent
            src={solution.heroImage}
            width={img.containerWidth}
            height={img.containerHeight}
            objectCover={img.objectCover}
            imgLeft={img.imgLeft}
            imgWidth={img.imgWidth}
            rotation={img.rotation}
          />
        </div>

        <div className="relative z-10 flex min-w-[141px] flex-1 flex-col items-start justify-center gap-2 pl-[120px]">
          <p className="w-full truncate text-lg leading-[28px] font-bold text-[#101828]">
            {solution.name}
          </p>
          <p className="w-full truncate text-sm leading-[24px] text-[#6a7282]">{solution.desc}</p>
        </div>

        {solution.showCoupon && (
          <div className="relative z-10 flex shrink-0 flex-col items-end justify-center gap-2">
            <div className="flex items-center rounded-md bg-white px-1">
              <span className="text-xl leading-[34px] font-bold text-[#008236]">
                {solution.couponRange}
              </span>
            </div>
            <span className="text-xs leading-[20px] text-[#6a7282]">Coupon</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SolutionHeroBanner({ solution }: { solution: InvestmentSolution }) {
  return (
    <>
      <SolutionHeroBannerMobile solution={solution} />
      <SolutionHeroBannerTablet solution={solution} />
      <SolutionHeroBannerDesktop solution={solution} />
    </>
  );
}

export function InvestmentSolutionDetail({
  solution,
  onBack,
  onProductSelect,
}: {
  solution: InvestmentSolution;
  onBack: () => void;
  onProductSelect: (product: StructuredProduct) => void;
}) {
  const t = useT();
  const products = useOpenProducts(INVESTMENT_SOLUTION_DETAIL_PRODUCTS, (p) => p.id);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [solution.id]);

  return (
    <div className="flex w-full flex-col gap-2 bg-white pt-4 md:pt-6">
      <div className="mx-auto flex h-[46px] w-full max-w-[1280px] items-center gap-2 px-4 py-2 md:px-8 lg:px-20">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.products.common.back}
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-base leading-[28px] font-bold text-[#101828] lg:text-lg lg:leading-[30px]">
          <span className="md:hidden">Investment Solution</span>
          <span className="hidden md:inline">{solution.name}</span>
        </h1>
      </div>

      <div className="max-md:relative max-md:overflow-visible md:max-lg:relative md:max-lg:overflow-visible md:max-lg:pb-6">
        <SolutionHeroBanner solution={solution} />

        <div className="relative z-10 w-full rounded-t-[24px] bg-white pt-4 pb-10 md:max-lg:px-8 md:max-lg:pt-4 lg:pt-6">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-2 px-4 md:px-8 md:max-lg:px-0 lg:px-20">
            <div className="flex w-full items-center gap-3">
              <p className="min-w-0 flex-1 text-sm leading-[24px] text-[#4a5565] lg:text-base lg:leading-[24px]">
                {t.products.common.items(products.length)}
              </p>
              {/* Mobile filter */}
              <Button
                variant="outline-black"
                size="icon-sm"
                aria-label={t.products.common.filter}
                className="shrink-0 md:hidden"
              >
                <FunnelSimpleIcon size={18} />
              </Button>
              {/* Tablet filter — icon only 32px Figma 23025:51744 */}
              <Button
                variant="outline-black"
                size="icon-sm"
                aria-label={t.products.common.filter}
                className="hidden size-8 shrink-0 md:max-lg:flex"
              >
                <FunnelSimpleIcon size={18} />
              </Button>
              {/* Desktop filter */}
              <Button
                variant="outline-black"
                size="sm"
                leftIcon={<FunnelSimpleIcon size={18} />}
                className="hidden shrink-0 lg:inline-flex"
              >
                {t.products.common.filter}
              </Button>
            </div>
            <p className="w-full text-micro leading-[18px] text-[#6a7282] lg:text-xs lg:leading-[20px]">
              <span className="lg:hidden">
                {t.products.common.updatedAt(INVESTMENT_SOLUTION_UPDATED_AT_MOBILE)}
              </span>
              <span className="hidden lg:inline">
                {t.products.common.updatedAt(INVESTMENT_SOLUTION_UPDATED_AT)}
              </span>
            </p>

            {products.length === 0 ? (
              <CatalogSectionEmpty title={t.products.states.noOpenProducts} />
            ) : (
              <div className="flex w-full flex-col gap-3 md:max-lg:gap-3 lg:grid lg:grid-cols-3 lg:gap-3">
                {products.map((product) => (
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
    </div>
  );
}
