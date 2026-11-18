import Image from "next/image";
import { mobileGroupHero } from "./mutual-fund-assets";
import type { MobileFundGroupId } from "./mutual-fund-data";

/**
 * Figma mobile tab-group hero graphic (glow circle + one decorative icon,
 * some rotated) — shared by the mobile page and the desktop page, which now
 * mirrors the mobile tab taxonomy. Positioned relative to whatever Header
 * Section-equivalent box wraps it (375×126 on mobile, reused as-is on desktop).
 */
export function MutualFundGroupHeroGraphic({
  groupId,
  scale = 1,
}: {
  groupId: MobileFundGroupId;
  /** Multiplies glow size and layer bottom/right/width/height — used by desktop to render a larger graphic than the mobile-calibrated pixel values. */
  scale?: number;
}) {
  const hero = mobileGroupHero(groupId);

  return (
    <>
      <div
        className="pointer-events-none absolute z-0 rounded-full bg-[#eff6ff]"
        style={{
          bottom: hero.glow.bottom * scale,
          right: hero.glow.right * scale,
          width: hero.glow.size * scale,
          height: hero.glow.size * scale,
        }}
        aria-hidden
      />
      {hero.layers.map((layer, index) => (
        <div
          key={`${groupId}-${index}`}
          className="pointer-events-none absolute z-10 flex items-center justify-center"
          style={{
            bottom: layer.bottom * scale,
            right: layer.right * scale,
            width: layer.width * scale,
            height: layer.height * scale,
          }}
          aria-hidden
        >
          <div
            className="relative"
            style={{
              width: layer.width * scale,
              height: layer.height * scale,
              transform: layer.rotationDeg ? `rotate(${layer.rotationDeg}deg)` : undefined,
            }}
          >
            <Image
              src={layer.src}
              alt=""
              fill
              className="object-contain"
              sizes={`${layer.width * scale}px`}
              priority
            />
          </div>
        </div>
      ))}
    </>
  );
}
