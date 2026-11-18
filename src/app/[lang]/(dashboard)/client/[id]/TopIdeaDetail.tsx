"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  LightningIcon,
  WallIcon,
  FactoryIcon,
  BasketIcon,
  ShirtFoldedIcon,
  FunnelSimpleIcon,
} from "@phosphor-icons/react";
import { StructuredProductCard } from "./StructuredProductCard";
import { type StructuredProduct } from "./structured-product-data";
import {
  TOP_IDEA_THEMES,
  TOP_IDEA_SUBTITLES,
  TOP_IDEA_MAX_COUPON,
  TOP_IDEA_UPDATED_AT,
  TOP_IDEA_UPDATED_AT_MOBILE,
  type TopIdeaSector,
} from "./top-idea-data";
import { useTopIdeaProducts } from "@/hooks/use-catalog";
import { TopIdeaDetailSkeleton } from "./ProductDetailSkeletons";

const ASSETS = {
  detailWave: "/products/top-idea/top-idea-detail-wave.svg",
  detailEnergy: "/products/top-idea/top-idea-energy.webp",
  heroLightning: "/products/top-idea/top-idea-hero-lightning.svg",
  wall1: "/products/top-idea/top-idea-wall-img.svg",
  effect: "/products/top-idea/top-idea-effect.webp",
  graphic: "/products/top-idea/top-idea-graphic.webp",
};

const IND_CLOUDS = [
  { src: "/products/top-idea/ind-clouds/ind-cloud-0.svg", l: 151.37, t: 8.09, w: 8.922, h: 6.592 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-1.svg", l: 133.79, t: 6.4, w: 8.908, h: 7.031 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-2.svg", l: 135.75, t: 4.32, w: 15.023, h: 6.273 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-3.svg", l: 118.8, t: -1.36, w: 16.574, h: 9.961 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-4.svg", l: 117.86, t: 5.52, w: 7.324, h: 7.471 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-5.svg", l: 145.58, t: 2.1, w: 8.981, h: 6.981 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-6.svg", l: 152.38, t: 15.12, w: 10.491, h: 3.144 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-7.svg", l: 135.08, t: 15.71, w: 11.948, h: 4.152 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-8.svg", l: 156.76, t: -6.57, w: 19.402, h: 9.591 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-9.svg", l: 107.22, t: 10.21, w: 20.92, h: 11.378 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-10.svg", l: 124.83, t: 4.46, w: 10.394, h: 3.428 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-11.svg", l: 146.08, t: 8.87, w: 8.628, h: 4.19 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-12.svg", l: 124.48, t: 1.95, w: 8.629, h: 4.192 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-13.svg", l: 169.56, t: -2.93, w: 4.05, h: 1.979 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-14.svg", l: 121.11, t: 12.74, w: 4.481, h: 2.473 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-15.svg", l: 151.23, t: -0.3, w: 16.212, h: 9.972 },
];

const BANNER_SHADOW =
  "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)";

function SectorHeroIcon({ sector }: { sector: TopIdeaSector }) {
  if (sector === "Energy") {
    return (
      <div className="relative shrink-0 size-6 md:size-8 lg:size-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG hero icon; the image optimizer rejects SVG */}
        <img alt="" className="block max-w-none size-full" src={ASSETS.heroLightning} />
      </div>
    );
  }

  const iconSm = { size: 12 as const, color: "white", weight: "fill" as const };
  const iconMd = { size: 16 as const, color: "white", weight: "fill" as const };
  const iconLg = { size: 20 as const, color: "white", weight: "fill" as const };
  let Icon;
  switch (sector) {
    case "Material":
      Icon = WallIcon;
      break;
    case "Industrials":
      Icon = FactoryIcon;
      break;
    case "Consumer Discretionary":
      Icon = BasketIcon;
      break;
    case "Consumer Staples":
      Icon = ShirtFoldedIcon;
      break;
    default:
      Icon = LightningIcon;
  }
  return (
    <div className="flex items-center justify-center size-6 md:size-8 lg:size-10 rounded-full bg-[#101828] shrink-0">
      <Icon {...iconSm} className="md:hidden" />
      <Icon {...iconMd} className="hidden md:block lg:hidden" />
      <Icon {...iconLg} className="hidden lg:block" />
    </div>
  );
}

function EnergyHeroGlow() {
  return (
    <div
      className="absolute pointer-events-none -translate-x-1/2
        max-md:left-[calc(50%+42.5px)] max-md:bottom-[40px] max-md:h-[82px] max-md:w-[80px]
        md:max-lg:left-[calc(50%+6.42px)] md:max-lg:bottom-[30px] md:max-lg:h-[118px] md:max-lg:w-[115.839px]
        lg:left-[calc(50%-329.08px)] lg:bottom-[75px] lg:h-[118px] lg:w-[115.839px]"
      aria-hidden
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma glow layer at percentage offsets under `mix-blend-mode: screen`; `fill` cannot express the offset and moving it to a wrapper would change the blend's stacking context */}
        <img
          alt=""
          className="absolute h-full max-w-none top-0 w-[100.62%]"
          style={{ left: "-0.31%", mixBlendMode: "screen" }}
          src={ASSETS.detailEnergy}
        />
      </div>
    </div>
  );
}

function DetailHeroWave() {
  return (
    <>
      <div
        className="absolute flex items-center justify-center pointer-events-none md:hidden"
        style={{ left: -4.79, top: -12, width: 381.418, height: 79.998 }}
        aria-hidden
      >
        <div className="flex-none rotate-[178.69deg]">
          <div className="relative h-[71.33px] w-[379.886px]">
            <div className="absolute inset-[-28.04%_-6.32%_-39.25%_-6.32%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG wave art; the image optimizer rejects SVG */}
              <img alt="" className="block max-w-none size-full" src={ASSETS.detailWave} />
            </div>
          </div>
        </div>
      </div>
      <div
        className="absolute hidden md:flex h-[93.968px] items-center justify-center pointer-events-none"
        style={{ left: -5.63, top: -14.22, width: 552.711 }}
        aria-hidden
      >
        <div className="flex-none rotate-[178.69deg]">
          <div className="relative h-[81.39px] w-[550.994px]">
            <div className="absolute inset-[-24.57%_-4.36%_-34.4%_-4.36%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG wave art; the image optimizer rejects SVG */}
              <img alt="" className="block max-w-none size-full" src={ASSETS.detailWave} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TopIdeaHeroBanner({ sector }: { sector: TopIdeaSector }) {
  const theme = TOP_IDEA_THEMES[sector];
  const subtitle = TOP_IDEA_SUBTITLES[sector];

  return (
    <div
      className="relative flex w-full items-center -mb-6 min-h-[100px] pt-3 pb-10 md:pt-4 md:pb-10 lg:min-h-[155px] lg:pt-8 lg:pb-14"
      style={{ backgroundColor: "#f3f4f6", boxShadow: BANNER_SHADOW }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <DetailHeroWave />
        {sector === "Energy" && <EnergyHeroGlow />}
        {sector === "Material" && (
          <div
            className="absolute pointer-events-none max-md:right-4 max-md:top-4 md:right-20 md:top-5"
            style={{ width: 180, height: 66 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG art layer; the image optimizer rejects SVG */}
            <img alt="" className="absolute inset-0 w-full h-full" src={ASSETS.wall1} />
          </div>
        )}
        {sector === "Industrials" &&
          IND_CLOUDS.map((c, i) => (
            <div
              key={i}
              className="absolute pointer-events-none max-md:hidden"
              style={{
                right: 40 + (171 - c.l) * 0.5,
                top: 10 + c.t * 0.5,
                width: c.w * 1.5,
                height: c.h * 1.5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG cloud art; the image optimizer rejects SVG */}
              <img alt="" className="absolute inset-0 max-w-none w-full h-full" src={c.src} />
            </div>
          ))}
        {sector === "Consumer Discretionary" && (
          <div
            className="absolute pointer-events-none overflow-hidden max-md:right-0 max-md:top-2 md:right-16 md:top-2"
            style={{ width: 140, height: 84 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Figma effect layer at percentage offsets under `mix-blend-mode: screen`; `fill` cannot express the offset and hoisting it to a wrapper would change the blend's stacking context */}
            <img
              alt=""
              className="absolute max-w-none"
              style={{ height: "167.51%", left: "-22.85%", top: "-14.39%", width: "167.05%", mixBlendMode: "screen" }}
              src={ASSETS.effect}
            />
          </div>
        )}
        {sector === "Consumer Staples" && (
          <div
            className="absolute pointer-events-none flex items-center justify-center max-md:right-4 md:right-20"
            style={{ top: 16, width: 80, height: 54, mixBlendMode: "luminosity" }}
          >
            <div style={{ transform: "rotate(-15deg)", flexShrink: 0 }}>
              <Image alt="" width={75} height={37} sizes="75px" className="max-w-none opacity-80" style={{ width: 75, height: 37 }} src={ASSETS.graphic} />
            </div>
          </div>
        )}
      </div>

      {/* Content — mobile/tablet: 16px/12px; desktop lg: 18px/14px, coupon 20px */}
      <div className="relative z-[1] flex flex-1 gap-2 lg:gap-4 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
        <div className="flex flex-1 gap-2 lg:gap-4 items-center min-w-0">
          <SectorHeroIcon sector={sector} />
          <div className="flex flex-1 flex-col gap-0.5 md:gap-1 lg:gap-2 items-start justify-center min-w-[141px] max-md:max-w-[210px]">
            <p className="font-bold text-base leading-[28px] lg:text-lg lg:leading-[28px] text-[#101828] truncate w-full">
              {theme}
            </p>
            <p className="text-xs leading-[20px] lg:text-sm lg:leading-[24px] text-[#6a7282] truncate w-full">{subtitle}</p>
          </div>
        </div>
        <div className="relative flex flex-col gap-0.5 lg:gap-2 items-end justify-center shrink-0">
          <div className="flex items-center gap-0.5 lg:gap-1 px-1 rounded-md bg-white">
            <span className="text-xs leading-[20px] lg:text-sm lg:leading-[24px] text-[#6a7282]">up to</span>
            <span className="font-bold text-lg leading-[28px] lg:text-xl lg:leading-[34px] text-[#008236]">
              {TOP_IDEA_MAX_COUPON}
            </span>
          </div>
          <span className="text-xs leading-[20px] lg:text-sm lg:leading-[24px] text-[#6a7282]">Coupon</span>
        </div>
      </div>
    </div>
  );
}

export function TopIdeaDetail({
  sector,
  onBack,
  onProductSelect,
}: {
  sector: TopIdeaSector;
  onBack: () => void;
  onProductSelect: (product: StructuredProduct) => void;
}) {
  const { data: products, isLoading } = useTopIdeaProducts(sector);
  const theme = TOP_IDEA_THEMES[sector];

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [sector]);

  if (isLoading) return <TopIdeaDetailSkeleton />;

  return (
    <div className="flex flex-col gap-2 w-full bg-white pt-4 md:pt-6">
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-base font-bold leading-[28px] text-[#101828] truncate lg:text-lg lg:leading-[30px]">
          {theme}
        </h1>
      </div>

      <TopIdeaHeroBanner sector={sector} />

      <div className="relative z-10 w-full bg-white rounded-t-[24px] pt-4 pb-10 lg:pt-6">
        <div className="flex flex-col gap-2 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-20">
          <div className="flex gap-3 items-center w-full">
            <p className="flex-1 min-w-0 text-sm leading-[24px] lg:text-base lg:leading-[24px] text-[#4a5565]">
              {products.length} รายการ
            </p>
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label="ตัวกรอง"
              className="shrink-0 md:hidden"
            >
              <FunnelSimpleIcon size={18} />
            </Button>
            <Button
              variant="outline-black"
              size="sm"
              leftIcon={<FunnelSimpleIcon size={18} />}
              className="shrink-0 hidden md:inline-flex"
            >
              ตัวกรอง
            </Button>
          </div>
          <p className="w-full text-micro leading-[18px] lg:text-xs lg:leading-[20px] text-[#6a7282]">
            <span className="lg:hidden">อัปเดตล่าสุด {TOP_IDEA_UPDATED_AT_MOBILE}</span>
            <span className="hidden lg:inline">อัปเดตล่าสุด {TOP_IDEA_UPDATED_AT}</span>
          </p>

          {/* mobile/tablet: single-col horizontal cards; desktop: 3-col vertical grid cards */}
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-3 w-full">
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
  );
}