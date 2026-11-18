"use client";

import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { ArrowRightIcon } from "@phosphor-icons/react";

export type CropTransform = { scaleX: number; scaleY: number; tx: number; ty: number };

// ─── Investment Solution gradient backgrounds ────────────────────────────────
export const GRAD_SECURE =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 389 132' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(30.4 6.2 -6.6 47.4 66.3 69.8)'><stop stop-color='%23f6f7fb'/><stop offset='1' stop-color='%23c5dbe8'/></radialGradient></defs></svg>\")";
export const GRAD_BALANCED =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 389 132' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(30.4 6.2 -6.6 47.4 66.3 69.8)'><stop stop-color='%23ffedfc'/><stop offset='1' stop-color='%23f8d0d8'/></radialGradient></defs></svg>\")";
export const GRAD_HIGH_CV =
  "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 389 132' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect width='100%25' height='100%25' fill='url(%23g)'/><defs><radialGradient id='g' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(30.4 6.2 -6.6 47.4 66.3 69.8)'><stop stop-color='%23e5e3fe'/><stop offset='1' stop-color='%23d5beff'/></radialGradient></defs></svg>\")";

export function InvestmentCard({
  name,
  desc,
  coupon,
  tenor,
  imgSrc,
  gradient,
  imgLeft,
  imgW,
  imgH,
  highConviction,
  crop,
  onClick,
}: {
  name: string;
  desc: string;
  coupon: string;
  tenor: string;
  imgSrc: string;
  gradient: string;
  imgLeft: number;
  imgW: number;
  imgH: number;
  highConviction?: boolean;
  crop?: CropTransform;
  onClick?: () => void;
}) {
  const isHighConviction = !!highConviction;
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
      className={`relative overflow-hidden rounded-xl flex gap-4 p-3 flex-1
        md:flex-none md:w-full md:h-30 md:gap-6 md:px-8 md:py-3
        lg:flex-1 lg:h-auto lg:gap-4 lg:p-3
        items-center${onClick ? " cursor-pointer" : ""}`}
      style={{
        backgroundImage: gradient,
        boxShadow:
          "0px 4px 6px -1px rgba(0,0,0,0.1),0px 2px 4px -2px rgba(0,0,0,0.1)",
      }}
    >
      {/* Secure Income / Balanced Growth: image in fixed container on left */}
      {crop && (
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: 72, height: imgH }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- Figma crop layer: `left`/`width` are computed from the crop transform against the image's own intrinsic size, which `fill` (inset-0 + 100%/100%) cannot express */}
          <img
            alt=""
            className="absolute h-full max-w-none top-0 pointer-events-none"
            style={{
              left: `${((-crop.tx / crop.scaleX) * 100).toFixed(1)}%`,
              width: `${(100 / crop.scaleX).toFixed(1)}%`,
            }}
            src={imgSrc}
          />
        </div>
      )}
      {/* High Conviction: invisible spacer — aligns content with other cards' 72px image slot */}
      {isHighConviction && (
        <div
          className="shrink-0 relative z-10"
          style={{ width: 72 }}
          aria-hidden
        />
      )}
      {/* High Conviction: absolute image behind content */}
      {isHighConviction && (
        <div
          className="absolute z-0 flex items-center justify-center pointer-events-none"
          style={{ left: imgLeft, top: 0, width: imgW, height: imgH }}
        >
          <div style={{ transform: "rotate(180deg)", flexShrink: 0 }}>
            {/* Explicitly sized, so `width`/`height` reproduce the old box exactly
                while letting the optimizer serve a card-sized file instead of the
                full-resolution solution artwork. */}
            <Image
              alt=""
              className="object-cover"
              width={imgW}
              height={imgH}
              sizes={`${imgW}px`}
              style={{ width: imgW, height: imgH }}
              src={imgSrc}
            />
          </div>
        </div>
      )}
      {/* Content — mobile/desktop: flex-col; tablet (md): flex-row */}
      <div
        className={`flex flex-col gap-3 items-start min-w-0 flex-1
        ${isHighConviction ? "relative z-10" : ""}
        md:flex-row md:gap-6 md:items-center
        lg:flex-col lg:gap-3 lg:items-start`}
      >
        {/* Name + Desc — mobile/desktop: row with button; tablet: col without button */}
        <div
          className="flex gap-2 items-center shrink-0 w-full
          md:flex-col md:items-start md:gap-0 md:flex-1 md:min-w-0 md:w-auto md:shrink-0
          lg:flex-row lg:gap-2 lg:items-center lg:w-full lg:shrink-0"
        >
          <div className="flex flex-col flex-1 min-w-0 whitespace-nowrap">
            <p
              className="font-bold truncate"
              style={{ color: "#101828", fontSize: 18, lineHeight: "28px" }}
            >
              {name}
            </p>
            <p
              className="truncate"
              style={{ color: "#6a7282", fontSize: 14, lineHeight: "20px" }}
            >
              {desc}
            </p>
          </div>
          {/* Mobile + Desktop only button (hidden on tablet) */}
          <Button
            variant="outline"
            size="icon-xs"
            aria-label="ดูรายละเอียด"
            className="md:hidden lg:flex"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <ArrowRightIcon size={16} />
          </Button>
        </div>
        {/* Stats — mobile/desktop: full-width below; tablet: flex-1 beside name */}
        <div
          className="flex gap-4 items-start justify-center shrink-0 w-full
          md:flex-1 md:w-auto md:shrink
          lg:shrink-0 lg:w-full"
          style={{
            backgroundColor: "rgba(255,255,255,0.5)",
            borderRadius: 8,
            padding: 8,
          }}
        >
          <div className="flex flex-col items-center flex-1 min-w-0 text-center">
            <p style={{ color: "#6a7282", fontSize: 14, lineHeight: "20px" }}>
              Coupon
            </p>
            <p
              className="font-bold"
              style={{ color: "#101828", fontSize: 18, lineHeight: "28px" }}
            >
              {coupon}
            </p>
          </div>
          <div
            style={{
              width: 1,
              alignSelf: "stretch",
              backgroundColor: "rgba(0,0,0,0.1)",
            }}
          />
          <div className="flex flex-col items-center flex-1 min-w-0 text-center">
            <p style={{ color: "#6a7282", fontSize: 14, lineHeight: "20px" }}>
              Tenor
            </p>
            <p
              className="font-bold"
              style={{ color: "#101828", fontSize: 18, lineHeight: "28px" }}
            >
              {tenor}
            </p>
          </div>
        </div>
        {/* Tablet-only button (after stats) */}
        <Button
          variant="outline"
          size="icon-xs"
          aria-label="ดูรายละเอียด"
          className="hidden md:flex lg:hidden shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <ArrowRightIcon size={16} />
        </Button>
      </div>
    </div>
  );
}
