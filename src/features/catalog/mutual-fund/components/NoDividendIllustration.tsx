/**
 * Figma 360:64503 — the "กองทุนนี้ไม่มีการจ่ายปันผล" illustration, 100×70.
 * Figma exports it as 18 layered vectors; they are merged into one SVG at their
 * exported positions. Blended to luminosity, as in the design.
 */
export function NoDividendIllustration() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/products/mutual-fund/no-dividend.svg"
      alt=""
      aria-hidden
      width={100}
      height={70}
      className="block h-[70.09px] w-[100px] max-w-none shrink-0 mix-blend-luminosity"
    />
  );
}
