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
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

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
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-6.svg",
    l: 152.38,
    t: 15.12,
    w: 10.491,
    h: 3.144,
  },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-7.svg",
    l: 135.08,
    t: 15.71,
    w: 11.948,
    h: 4.152,
  },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-8.svg",
    l: 156.76,
    t: -6.57,
    w: 19.402,
    h: 9.591,
  },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-9.svg",
    l: 107.22,
    t: 10.21,
    w: 20.92,
    h: 11.378,
  },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-10.svg",
    l: 124.83,
    t: 4.46,
    w: 10.394,
    h: 3.428,
  },
  { src: "/products/top-idea/ind-clouds/ind-cloud-11.svg", l: 146.08, t: 8.87, w: 8.628, h: 4.19 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-12.svg", l: 124.48, t: 1.95, w: 8.629, h: 4.192 },
  { src: "/products/top-idea/ind-clouds/ind-cloud-13.svg", l: 169.56, t: -2.93, w: 4.05, h: 1.979 },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-14.svg",
    l: 121.11,
    t: 12.74,
    w: 4.481,
    h: 2.473,
  },
  {
    src: "/products/top-idea/ind-clouds/ind-cloud-15.svg",
    l: 151.23,
    t: -0.3,
    w: 16.212,
    h: 9.972,
  },
];

const BANNER_SHADOW = "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)";

function SectorHeroIcon({ sector }: { sector: TopIdeaSector }) {
  if (sector === "Energy") {
    return (
      <div className="relative size-6 shrink-0 md:size-8 lg:size-10">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG hero icon; the image optimizer rejects SVG */}
        <img alt="" className="block size-full max-w-none" src={ASSETS.heroLightning} />
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
    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#101828] md:size-8 lg:size-10">
      <Icon {...iconSm} className="md:hidden" />
      <Icon {...iconMd} className="hidden md:block lg:hidden" />
      <Icon {...iconLg} className="hidden lg:block" />
    </div>
  );
}

function EnergyHeroGlow() {
  return (
    <div
      className="pointer-events-none absolute -translate-x-1/2 max-md:bottom-[40px] max-md:left-[calc(50%+42.5px)] max-md:h-[82px] max-md:w-[80px] md:max-lg:bottom-[30px] md:max-lg:left-[calc(50%+6.42px)] md:max-lg:h-[118px] md:max-lg:w-[115.839px] lg:bottom-[75px] lg:left-[calc(50%-329.08px)] lg:h-[118px] lg:w-[115.839px]"
      aria-hidden
    >
      <div className="absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- Figma glow layer at percentage offsets under `mix-blend-mode: screen`; `fill` cannot express the offset and moving it to a wrapper would change the blend's stacking context */}
        <img
          alt=""
          className="absolute top-0 h-full w-[100.62%] max-w-none"
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
        className="pointer-events-none absolute flex items-center justify-center md:hidden"
        style={{ left: -4.79, top: -12, width: 381.418, height: 79.998 }}
        aria-hidden
      >
        <div className="flex-none rotate-[178.69deg]">
          <div className="relative h-[71.33px] w-[379.886px]">
            <div className="absolute inset-[-28.04%_-6.32%_-39.25%_-6.32%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG wave art; the image optimizer rejects SVG */}
              <img alt="" className="block size-full max-w-none" src={ASSETS.detailWave} />
            </div>
          </div>
        </div>
      </div>
      <div
        className="pointer-events-none absolute hidden h-[93.968px] items-center justify-center md:flex"
        style={{ left: -5.63, top: -14.22, width: 552.711 }}
        aria-hidden
      >
        <div className="flex-none rotate-[178.69deg]">
          <div className="relative h-[81.39px] w-[550.994px]">
            <div className="absolute inset-[-24.57%_-4.36%_-34.4%_-4.36%]">
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG wave art; the image optimizer rejects SVG */}
              <img alt="" className="block size-full max-w-none" src={ASSETS.detailWave} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TopIdeaHeroBanner({ sector }: { sector: TopIdeaSector }) {
  const t = useT();
  const theme = TOP_IDEA_THEMES[sector];
  const subtitle = TOP_IDEA_SUBTITLES[sector];

  return (
    <div
      className="relative -mb-6 flex min-h-[100px] w-full items-center pt-3 pb-10 md:pt-4 md:pb-10 lg:min-h-[155px] lg:pt-8 lg:pb-14"
      style={{ backgroundColor: "#f3f4f6", boxShadow: BANNER_SHADOW }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <DetailHeroWave />
        {sector === "Energy" && <EnergyHeroGlow />}
        {sector === "Material" && (
          <div
            className="pointer-events-none absolute max-md:top-4 max-md:right-4 md:top-5 md:right-20"
            style={{ width: 180, height: 66 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG art layer; the image optimizer rejects SVG */}
            <img alt="" className="absolute inset-0 h-full w-full" src={ASSETS.wall1} />
          </div>
        )}
        {sector === "Industrials" &&
          IND_CLOUDS.map((c, i) => (
            <div
              key={i}
              className="pointer-events-none absolute max-md:hidden"
              style={{
                right: 40 + (171 - c.l) * 0.5,
                top: 10 + c.t * 0.5,
                width: c.w * 1.5,
                height: c.h * 1.5,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG cloud art; the image optimizer rejects SVG */}
              <img alt="" className="absolute inset-0 h-full w-full max-w-none" src={c.src} />
            </div>
          ))}
        {sector === "Consumer Discretionary" && (
          <div
            className="pointer-events-none absolute overflow-hidden max-md:top-2 max-md:right-0 md:top-2 md:right-16"
            style={{ width: 140, height: 84 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Figma effect layer at percentage offsets under `mix-blend-mode: screen`; `fill` cannot express the offset and hoisting it to a wrapper would change the blend's stacking context */}
            <img
              alt=""
              className="absolute max-w-none"
              style={{
                height: "167.51%",
                left: "-22.85%",
                top: "-14.39%",
                width: "167.05%",
                mixBlendMode: "screen",
              }}
              src={ASSETS.effect}
            />
          </div>
        )}
        {sector === "Consumer Staples" && (
          <div
            className="pointer-events-none absolute flex items-center justify-center max-md:right-4 md:right-20"
            style={{ top: 16, width: 80, height: 54, mixBlendMode: "luminosity" }}
          >
            <div style={{ transform: "rotate(-15deg)", flexShrink: 0 }}>
              <Image
                alt=""
                width={75}
                height={37}
                sizes="75px"
                className="max-w-none opacity-80"
                style={{ width: 75, height: 37 }}
                src={ASSETS.graphic}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content — mobile/tablet: 16px/12px; desktop lg: 18px/14px, coupon 20px */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-1 items-center gap-2 px-4 md:px-8 lg:gap-4 lg:px-20">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
          <SectorHeroIcon sector={sector} />
          <div className="flex min-w-[141px] flex-1 flex-col items-start justify-center gap-0.5 max-md:max-w-[210px] md:gap-1 lg:gap-2">
            <p className="w-full truncate text-base leading-[28px] font-bold text-[#101828] lg:text-lg lg:leading-[28px]">
              {theme}
            </p>
            <p className="w-full truncate text-xs leading-[20px] text-[#6a7282] lg:text-sm lg:leading-[24px]">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="relative flex shrink-0 flex-col items-end justify-center gap-0.5 lg:gap-2">
          <div className="flex items-center gap-0.5 rounded-md bg-white px-1 lg:gap-1">
            <span className="text-xs leading-[20px] text-[#6a7282] lg:text-sm lg:leading-[24px]">
              {t.products.topIdea.upTo}
            </span>
            <span className="text-lg leading-[28px] font-bold text-[#008236] lg:text-xl lg:leading-[34px]">
              {TOP_IDEA_MAX_COUPON}
            </span>
          </div>
          <span className="text-xs leading-[20px] text-[#6a7282] lg:text-sm lg:leading-[24px]">
            Coupon
          </span>
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
  const t = useT();
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
          {theme}
        </h1>
      </div>

      <TopIdeaHeroBanner sector={sector} />

      <div className="relative z-10 w-full rounded-t-[24px] bg-white pt-4 pb-10 lg:pt-6">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-2 px-4 md:px-8 lg:px-20">
          <div className="flex w-full items-center gap-3">
            <p className="min-w-0 flex-1 text-sm leading-[24px] text-[#4a5565] lg:text-base lg:leading-[24px]">
              {t.products.common.items(products.length)}
            </p>
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label={t.products.common.filter}
              className="shrink-0 md:hidden"
            >
              <FunnelSimpleIcon size={18} />
            </Button>
            <Button
              variant="outline-black"
              size="sm"
              leftIcon={<FunnelSimpleIcon size={18} />}
              className="hidden shrink-0 md:inline-flex"
            >
              {t.products.common.filter}
            </Button>
          </div>
          <p className="w-full text-micro leading-[18px] text-[#6a7282] lg:text-xs lg:leading-[20px]">
            <span className="lg:hidden">
              {t.products.common.updatedAt(TOP_IDEA_UPDATED_AT_MOBILE)}
            </span>
            <span className="hidden lg:inline">
              {t.products.common.updatedAt(TOP_IDEA_UPDATED_AT)}
            </span>
          </p>

          {/* mobile/tablet: single-col horizontal cards; desktop: 3-col vertical grid cards */}
          {products.length === 0 ? (
            <CatalogSectionEmpty title={t.products.states.noOpenProducts} />
          ) : (
            <div className="flex w-full flex-col gap-3 lg:grid lg:grid-cols-3 lg:gap-3">
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
  );
}
