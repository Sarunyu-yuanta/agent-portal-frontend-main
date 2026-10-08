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
import { useOpenProducts } from "@/app/(dashboard)/orders/use-order-books";

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
      className="max-w-none object-cover pointer-events-none"
      style={{ mixBlendMode: "screen" }}
      src={src}
    />
  ) : (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Stays a plain <img>: this layer is a Figma crop, positioned by a
          computed `left`/`width` pair against its own intrinsic size. `fill`
          hard-codes inset-0 + 100%/100% and cannot express that offset. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- percentage-cropped art layer, see above */}
      <img
        alt=""
        className="absolute h-full max-w-none top-0"
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
    <div className="relative z-10 flex flex-1 flex-col gap-0 items-start justify-center min-w-0">
      <p className="font-bold text-[16px] leading-6 text-[#101828] truncate w-full">{solution.name}</p>
      <p className="text-[12px] leading-4 text-[#6a7282] truncate w-full">{solution.desc}</p>
    </div>
  );

  const couponBlock = solution.showCoupon ? (
    <div className="relative z-10 flex flex-col gap-0.5 items-end justify-center shrink-0">
      <div className="flex items-center px-1 rounded-md bg-white">
        <span className="font-bold text-[18px] leading-6 text-[#008236]">{solution.couponRange}</span>
      </div>
      <span className="text-xs leading-4 text-[#6a7282]">Coupon</span>
    </div>
  ) : null;

  // Figma 34995:49778 — Secure Income & Balanced Growth use fixed icon + text at x=80
  if (mobile.leftPx != null) {
    const textLeftPx = 80;
    const gapAfterIcon = textLeftPx - mobile.leftPx - mobile.width;
    const iconTopOffset = (mobile.topPx ?? 0) - 16; // pt-4 = 16px

    return (
      <div
        className="relative flex md:hidden w-full shrink-0 box-border items-center pr-3 pt-4 pb-10 -mb-6 overflow-hidden"
        style={{
          height: mobile.bannerHeight,
          backgroundImage: solution.heroGradientMobile,
        }}
      >
        <div
          className="relative shrink-0 overflow-hidden pointer-events-none z-0"
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
          className="relative z-10 flex flex-1 flex-col gap-0 items-start justify-center min-w-0"
          style={{ marginLeft: gapAfterIcon }}
        >
          <p className="font-bold text-[16px] leading-6 text-[#101828] truncate w-full">{solution.name}</p>
          <p className="text-[12px] leading-4 text-[#6a7282] truncate w-full">{solution.desc}</p>
        </div>

        {couponBlock}
      </div>
    );
  }

  // High Conviction — Figma 34995:49790: anchor at calc(50%-167.56px) = 19.94px on 375px frame
  return (
    <div
      className="relative flex md:hidden w-full shrink-0 box-border items-center pl-20 pr-3 pt-4 pb-10 -mb-6 overflow-hidden"
      style={{
        height: mobile.bannerHeight,
        gap: mobile.gap ?? 16,
        backgroundImage: solution.heroGradientMobile,
      }}
    >
      <div
        className="absolute flex items-center justify-center pointer-events-none z-0 overflow-hidden"
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
    <div className="relative z-10 flex flex-1 flex-col gap-0 items-start justify-center min-w-0">
      <p className="font-bold text-[16px] leading-6 text-[#101828] truncate w-full">{solution.name}</p>
      <p className="text-[12px] leading-4 text-[#6a7282] truncate w-full">{solution.desc}</p>
    </div>
  );

  const couponBlock = solution.showCoupon ? (
    <div className="relative z-10 flex flex-col gap-0.5 items-end justify-center shrink-0">
      <div className="flex items-center px-1 rounded-md bg-white">
        <span className="font-bold text-[18px] leading-6 text-[#008236]">{solution.couponRange}</span>
      </div>
      <span className="text-xs leading-4 text-[#6a7282]">Coupon</span>
    </div>
  ) : null;

  if (tablet.leftPx != null) {
    const textLeftPx = 96;
    const gapAfterIcon = textLeftPx - tablet.leftPx - tablet.width;
    const iconTopOffset = (tablet.topPx ?? 0) - 16;

    return (
      <div
        className="relative hidden md:flex lg:hidden w-full shrink-0 box-border items-center pr-8 pt-4 pb-10 -mb-6 overflow-hidden"
        style={{
          height: tablet.bannerHeight,
          backgroundImage: solution.heroGradientTablet,
        }}
      >
        <div
          className="relative shrink-0 overflow-hidden pointer-events-none z-0"
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
          className="relative z-10 flex flex-1 flex-col gap-0 items-start justify-center min-w-0"
          style={{ marginLeft: gapAfterIcon }}
        >
          <p className="font-bold text-[16px] leading-6 text-[#101828] truncate w-full">{solution.name}</p>
          <p className="text-[12px] leading-4 text-[#6a7282] truncate w-full">{solution.desc}</p>
        </div>

        {couponBlock}
      </div>
    );
  }

  return (
    <div
      className="relative hidden md:flex lg:hidden w-full shrink-0 box-border items-center gap-4 pl-[96px] pr-8 pt-4 pb-10 -mb-6 overflow-hidden"
      style={{
        height: tablet.bannerHeight,
        backgroundImage: solution.heroGradientTablet,
      }}
    >
      <div
        className="absolute flex items-center justify-center pointer-events-none z-0 overflow-hidden"
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

  const imageStyle: CSSProperties = img.anchorLeftPx != null
    ? anchorHeroImageStyle(img.anchorLeftPx, img.containerWidth, img.containerHeight, img.topOffset)
    : {
        left: img.leftPx,
        top: `calc(50% - ${img.topOffset}px)`,
        transform: "translateY(-50%)",
        width: img.containerWidth,
        height: img.containerHeight,
      };

  return (
    <div
      className="relative hidden lg:flex w-full h-[146px] shrink-0 box-border -mb-6 overflow-hidden"
      style={{ backgroundImage: solution.heroGradient }}
    >
      <div className="relative flex items-center gap-4 w-full max-w-[1280px] mx-auto h-full pt-4 pb-10 pr-8">
        <div
          className="absolute pointer-events-none z-0 overflow-hidden"
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

        <div className="relative z-10 flex flex-1 flex-col gap-2 items-start justify-center min-w-[141px] pl-[120px]">
          <p className="font-bold text-lg leading-6 text-[#101828] truncate w-full">{solution.name}</p>
          <p className="text-sm leading-5 text-[#6a7282] truncate w-full">{solution.desc}</p>
        </div>

        {solution.showCoupon && (
          <div className="relative z-10 flex flex-col gap-2 items-end justify-center shrink-0">
            <div className="flex items-center px-1 rounded-md bg-white">
              <span className="font-bold text-xl leading-[30px] text-[#008236]">{solution.couponRange}</span>
            </div>
            <span className="text-xs leading-4 text-[#6a7282]">Coupon</span>
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
    <div className="flex flex-col gap-2 w-full bg-white pt-4 md:pt-6">
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-base font-bold leading-6 text-[#101828] truncate lg:text-lg lg:leading-[26px]">
          <span className="md:hidden">Investment Solution</span>
          <span className="hidden md:inline">{solution.name}</span>
        </h1>
      </div>

      <div className="max-md:relative max-md:overflow-visible md:max-lg:relative md:max-lg:overflow-visible md:max-lg:pb-6">
        <SolutionHeroBanner solution={solution} />

        <div className="relative z-10 w-full bg-white rounded-t-[24px] pt-4 pb-10 md:max-lg:pt-4 md:max-lg:px-8 lg:pt-6">
        <div className="flex flex-col gap-2 items-center w-full max-w-[1280px] mx-auto px-4 md:max-lg:px-0 md:px-8 lg:px-20">
          <div className="flex gap-3 items-center w-full">
            <p className="flex-1 min-w-0 text-sm leading-5 text-[#4a5565] lg:text-base lg:leading-5">
              {products.length} รายการ
            </p>
            {/* Mobile filter */}
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label="ตัวกรอง"
              className="shrink-0 md:hidden"
            >
              <FunnelSimpleIcon size={18} />
            </Button>
            {/* Tablet filter — icon only 32px Figma 23025:51744 */}
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label="ตัวกรอง"
              className="shrink-0 hidden md:max-lg:flex size-8"
            >
              <FunnelSimpleIcon size={18} />
            </Button>
            {/* Desktop filter */}
            <Button
              variant="outline-black"
              size="sm"
              leftIcon={<FunnelSimpleIcon size={18} />}
              className="shrink-0 hidden lg:inline-flex"
            >
              ตัวกรอง
            </Button>
          </div>
          <p className="w-full text-[9px] leading-[14px] text-[#6a7282] lg:text-xs lg:leading-4">
            <span className="lg:hidden">อัปเดตล่าสุด {INVESTMENT_SOLUTION_UPDATED_AT_MOBILE}</span>
            <span className="hidden lg:inline">อัปเดตล่าสุด {INVESTMENT_SOLUTION_UPDATED_AT}</span>
          </p>

          <div className="flex flex-col gap-3 md:max-lg:gap-3 w-full lg:grid lg:grid-cols-3 lg:gap-3">
            {products.map((product) => (
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
    </div>
  );
}
