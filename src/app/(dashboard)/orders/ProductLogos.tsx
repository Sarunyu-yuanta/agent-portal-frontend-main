"use client";

/**
 * The underlyings' logos, as the Product Catalog's own card draws them.
 *
 * Same markup as `StructuredProductCard`'s `LogoRow` — a rounded square with a
 * hairline border and a placeholder swapped in on a broken file — so a deal
 * recognised by its logos in the catalogue is recognised by the same strip
 * here. Not imported from there because that row also owns the catalogue's
 * "ใกล้เต็ม" / "รับประกันเงินต้น" tags, which a book has no use for.
 *
 * Renders nothing when the product carries no logos: the Thai desk's rows are
 * BBG codes with no imagery anywhere in the app, so there is nothing to draw
 * rather than something missing to apologise for.
 */
export function ProductLogos({
  logos,
  size = 32,
  max = 3,
  className = "",
}: {
  logos: string[];
  /** Pixel edge of each square — 32 on a card, smaller in a table row. */
  size?: number;
  max?: number;
  className?: string;
}) {
  if (logos.length === 0) return null;
  return (
    <div className={`flex shrink-0 items-center gap-1 ${className}`}>
      {logos.slice(0, max).map((src, i) => (
        <span
          key={i}
          className="relative block shrink-0 overflow-hidden rounded"
          style={{ width: size, height: size, border: "1px solid rgba(0,0,0,0.08)" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- swaps in a placeholder by reassigning `currentTarget.src` on error; `next/image` owns that attribute, so the fallback cannot work through it */}
          <img
            alt=""
            className="absolute inset-0 size-full object-cover"
            src={src}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/bond-logos/logo-placeholder.svg";
            }}
          />
        </span>
      ))}
    </div>
  );
}
