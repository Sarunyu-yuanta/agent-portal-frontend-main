import Image from "next/image";
import {
  LightningIcon,
  WallIcon,
  FactoryIcon,
  BasketIcon,
  ShirtFoldedIcon,
} from "@phosphor-icons/react";
import { TOP_IDEA_THEMES, type TopIdeaSector } from "./top-idea-data";

const ASSETS = {
  vector: "/products/top-idea/top-idea-wave.svg",
  energy1: "/products/top-idea/top-idea-energy.webp",
  wall1: "/products/top-idea/top-idea-wall-img.svg",
  industrials1: "/products/top-idea/top-idea-industrials.webp",
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

function SectorIcon({ sector }: { sector: TopIdeaSector }) {
  const props = { size: 12 as const, color: "#525252" };
  switch (sector) {
    case "Energy":
      return <LightningIcon {...props} />;
    case "Material":
      return <WallIcon {...props} />;
    case "Industrials":
      return <FactoryIcon {...props} />;
    case "Consumer Discretionary":
      return <BasketIcon {...props} />;
    case "Consumer Staples":
      return <ShirtFoldedIcon {...props} />;
  }
}

const CARD_SHADOW =
  "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)";

export function TopIdeaCard({
  sector,
  fullWidth = false,
  onClick,
}: {
  sector: TopIdeaSector;
  fullWidth?: boolean;
  onClick?: () => void;
}) {
  const theme = TOP_IDEA_THEMES[sector];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`relative overflow-hidden rounded-[8px] ${
        fullWidth ? "w-full h-[98px]" : "shrink-0 w-[171px] md:w-[200px]"
      }${onClick ? " cursor-pointer" : ""}`}
      style={{
        height: 98,
        backgroundColor: "#f3f4f6",
        boxShadow: CARD_SHADOW,
      }}
    >
      <div
        className="absolute flex items-center justify-center pointer-events-none"
        style={{ left: -5.61, top: -20.65, width: 196.729, height: 90.39 }}
      >
        <div style={{ transform: "rotate(176.8deg)", flexShrink: 0 }}>
          <div style={{ width: 192.58, height: 79.778, position: "relative" }}>
            <div
              className="absolute"
              style={{ top: "-25.07%", right: "-12.46%", bottom: "-35.1%", left: "-12.46%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- SVG art layer; the image optimizer rejects SVG */}
              <img alt="" className="block max-w-none w-full h-full" src={ASSETS.vector} />
            </div>
          </div>
        </div>
      </div>

      {sector === "Energy" && (
        <div
          className="absolute pointer-events-none mix-blend-screen"
          style={{ left: 107.19, top: -23.23, width: 60.284, height: 61.408 }}
        >
          <Image alt="" fill sizes="61px" className="object-cover" src={ASSETS.energy1} />
        </div>
      )}
      {sector === "Material" && (
        <div
          className="absolute pointer-events-none"
          style={{ left: 114.08, top: -0.75, width: 63.103, height: 23.21 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG art layer; the image optimizer rejects SVG */}
          <img alt="" className="absolute inset-0 w-full h-full" src={ASSETS.wall1} />
        </div>
      )}
      {sector === "Industrials" &&
        IND_CLOUDS.map((c, i) => (
          <div
            key={i}
            className="absolute pointer-events-none"
            style={{ left: c.l, top: c.t, width: c.w, height: c.h }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG cloud art; the image optimizer rejects SVG */}
            <img alt="" className="absolute inset-0 max-w-none w-full h-full" src={c.src} />
          </div>
        ))}
      {sector === "Consumer Discretionary" && (
        <div
          className="absolute pointer-events-none"
          style={{ left: 106, top: -3.97, width: 68.696, height: 41.109 }}
        >
          <div className="absolute inset-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- Figma effect layer, offset by percentages of this wrapper; `fill` (inset-0 + 100%/100%) cannot express it. Optimizing this one would mean moving the offsets onto an intermediate box, which is a DOM change rather than a swap. */}
            <img
              alt=""
              className="absolute max-w-none"
              style={{
                height: "167.51%",
                left: "-22.85%",
                top: "-14.39%",
                width: "167.05%",
              }}
              src={ASSETS.effect}
            />
          </div>
        </div>
      )}
      {sector === "Consumer Staples" && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{ left: 130, top: -3.64, width: 41.03, height: 27.563, mixBlendMode: "luminosity" }}
        >
          <div style={{ transform: "rotate(-15deg)", flexShrink: 0 }}>
            <div style={{ width: 37.525, height: 18.481, position: "relative" }}>
              <Image
                alt=""
                fill
                sizes="38px"
                className="max-w-none pointer-events-none"
                style={{ objectPosition: "bottom", opacity: 0.8 }}
                src={ASSETS.graphic}
              />
            </div>
          </div>
        </div>
      )}

      <div className="absolute flex items-center gap-1" style={{ left: 4, top: 2, height: 16 }}>
        <div className="shrink-0 flex items-center justify-center" style={{ width: 12, height: 12 }}>
          <SectorIcon sector={sector} />
        </div>
        <p className="whitespace-nowrap" style={{ color: "#525252", fontSize: 14, lineHeight: "20px" }}>
          {sector}
        </p>
      </div>

      <div
        className="absolute flex flex-col justify-between"
        style={{
          left: 2,
          right: 2,
          top: 20,
          height: 76,
          backgroundColor: "white",
          borderRadius: 6,
          paddingTop: 4,
          paddingRight: 8,
          paddingBottom: 4,
          paddingLeft: 8,
        }}
      >
        <p className="font-bold" style={{ color: "#101828", fontSize: 16, lineHeight: "24px" }}>
          {theme}
        </p>
        <div className="flex items-baseline gap-0.5 justify-end whitespace-nowrap">
          <span style={{ color: "#4a5565", fontSize: 14, lineHeight: "20px" }}>up to</span>
          <span className="font-bold" style={{ color: "#008236", fontSize: 20, lineHeight: "28px" }}>
            30.5%
          </span>
        </div>
      </div>
    </div>
  );
}
