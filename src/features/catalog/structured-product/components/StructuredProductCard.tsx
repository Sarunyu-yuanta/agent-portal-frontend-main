import { LocaleLink as Link } from "@/i18n/navigation";
import { FireIcon, HourglassMediumIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useProcessingProductIds } from "@/features/orders/hooks/use-order-books";
import {
  STRUCTURED_TAG,
  type StructuredProduct,
} from "@/features/catalog/structured-product/lib/structured-product-data";
import { useT } from "@/i18n/I18nProvider";

type CardProduct = Pick<
  StructuredProduct,
  "underlying" | "coupon" | "tenor" | "ko" | "strike" | "ki" | "tags" | "logos"
> & {
  /** Read for the order's state — most call sites spread the product, so it comes along. */
  id?: string;
};

const CARD_SHADOW = "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)";

function LogoRow({
  logos,
  tags,
  processing,
}: {
  logos: string[];
  tags: string[];
  /** The product's order is with the back office — see `useProcessingProductIds`. */
  processing: boolean;
}) {
  const t = useT();
  return (
    <div className="flex w-full shrink-0 items-center gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {logos.map((src, i) => (
          <div
            key={i}
            className="relative size-8 shrink-0 overflow-hidden rounded"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
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
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {/* "ใกล้เต็ม" stops being true once the order has gone out — the
            card's status band says what replaced it. */}
        {!processing && tags.includes(STRUCTURED_TAG.almostFull) && (
          <div
            className="flex shrink-0 items-center gap-0.5 overflow-hidden rounded px-1 py-0.5"
            style={{ backgroundColor: "#fdefe6" }}
          >
            <FireIcon size={14} weight="fill" color="#f97316" />
            <p className="text-micro leading-[18px] whitespace-nowrap text-[#101828]">
              {t.products.structured.tags.almostFull}
            </p>
          </div>
        )}
        {tags.includes(STRUCTURED_TAG.principalProtected) && (
          <div
            className="flex shrink-0 items-center gap-0.5 overflow-hidden rounded px-1 py-0.5"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <ShieldCheckIcon size={14} weight="fill" color="#2b7fff" />
            <p className="text-micro leading-[18px] whitespace-nowrap text-[#101828]">
              {t.products.structured.tags.principalProtected}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * "กำลังดำเนินการสั่งซื้อ", as a band across the card's top edge.
 *
 * A band rather than another chip beside "ใกล้เต็ม" and "รับประกันเงินต้น":
 * those describe the product, this describes the order on it, and as a chip it
 * read as one more feature of the note. Absolutely placed so every layout —
 * stacked or the tablet's row — takes it the same way; the card makes room for
 * it with its top padding.
 */
function ProcessingBand() {
  const t = useT();
  return (
    <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-center gap-1 bg-[#eff6ff] text-label leading-[20px] font-medium text-[#0a6ee7]">
      <HourglassMediumIcon size={14} weight="fill" />
      {t.products.common.processingOrder}
    </div>
  );
}

function UnderlyingCouponRow({ underlying, coupon }: { underlying: string; coupon: string }) {
  return (
    <div className="flex w-full shrink-0 items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="w-full truncate text-title-sm leading-[28px] font-bold text-[#101828]">
          {underlying}
        </p>
        <p className="text-label leading-[20px] text-[#6a7282]">Underlying</p>
      </div>
      <div className="flex shrink-0 flex-col items-end whitespace-nowrap">
        <p className="text-title-sm leading-[28px] font-bold text-[#101828]">{coupon}</p>
        <p className="text-label leading-[20px] text-[#6a7282]">Coupon</p>
      </div>
    </div>
  );
}

function StatsGrid({
  stats,
  className = "",
  layout = "default",
}: {
  stats: { label: string; value: string }[];
  className?: string;
  layout?: "default" | "tablet";
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg bg-[#f9fafb] text-center ${className}`}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
          style={i < stats.length - 1 ? { borderRight: "1px solid rgba(0,0,0,0.1)" } : {}}
        >
          <p className="w-full text-micro leading-[18px] text-[#6a7282]">{s.label}</p>
          <p
            className={`w-full text-label leading-[20px] text-[#4a5565] ${
              layout === "tablet"
                ? s.label === "Tenor"
                  ? "font-bold"
                  : "font-normal"
                : "font-semibold"
            }`}
          >
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

const CARD_HOVER = "cursor-pointer transition-colors hover:bg-[#f9fafb]!";

export function StructuredProductCard({
  underlying,
  coupon,
  tenor,
  ko,
  strike,
  ki,
  tags,
  logos,
  onClick,
  href,
  variant = "catalog",
  id,
}: CardProduct & { onClick?: () => void; href?: string; variant?: "catalog" | "grid" }) {
  const processing = useProcessingProductIds().has(id ?? "");
  // Room for the band: its 28px on top of the card's own 20px. Every card is
  // `self-start` so only the one carrying the band grows — a grid would
  // otherwise stretch its neighbours in the row to match.
  const bandPad = processing ? "pt-12" : "";
  const stats = [
    { label: "Tenor", value: tenor },
    { label: "KO", value: ko },
    { label: "Strike", value: strike },
    { label: "KI", value: ki },
  ];

  const isGrid = variant === "grid";
  const clickable = Boolean(onClick || href);

  const interactiveProps =
    onClick && !href
      ? {
          role: "button" as const,
          tabIndex: 0,
          onClick,
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClick();
            }
          },
          className: CARD_HOVER,
        }
      : clickable
        ? { className: CARD_HOVER }
        : {};

  const cardStyle = {
    border: "1px solid rgba(0,0,0,0.1)",
    boxShadow: CARD_SHADOW,
  };

  const card = isGrid ? (
    <div
      {...interactiveProps}
      className={`flex flex-col items-center gap-3 overflow-hidden p-5 ${bandPad} relative w-full self-start rounded-[12px] bg-white ${interactiveProps.className ?? ""}`}
      style={cardStyle}
    >
      {processing && <ProcessingBand />}
      <div className="flex w-full flex-col items-start gap-2">
        <LogoRow logos={logos} tags={tags} processing={processing} />
        <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
      </div>
      <StatsGrid stats={stats} className="w-full py-2" />
    </div>
  ) : (
    <>
      {/* Mobile — vertical stack */}
      <div
        {...interactiveProps}
        className={`flex flex-col items-center gap-3 overflow-hidden p-5 md:hidden ${bandPad} relative w-full self-start rounded-[12px] bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex w-full flex-col items-start gap-2">
          <LogoRow logos={logos} tags={tags} processing={processing} />
          <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
        </div>
        <StatsGrid stats={stats} className="w-full py-2" />
      </div>

      {/* Tablet — horizontal */}
      <div
        {...interactiveProps}
        className={`hidden md:flex lg:hidden ${processing ? "h-[148px]" : "h-[120px]"} box-border items-start gap-4 overflow-hidden p-5 ${bandPad} relative w-full self-start rounded-[12px] bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
          <LogoRow logos={logos} tags={tags} processing={processing} />
          <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
        </div>
        <StatsGrid stats={stats} className="h-full min-w-0 flex-1 py-3" layout="tablet" />
      </div>

      {/* Desktop — vertical grid card */}
      <div
        {...interactiveProps}
        className={`hidden flex-col items-center gap-3 overflow-hidden p-5 lg:flex ${bandPad} relative w-full self-start rounded-[12px] bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex w-full flex-col items-start gap-2">
          <LogoRow logos={logos} tags={tags} processing={processing} />
          <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
        </div>
        <StatsGrid stats={stats} className="w-full py-2" />
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="block w-full self-start text-inherit no-underline">
        {card}
      </Link>
    );
  }
  return card;
}
