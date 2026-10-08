import Link from "next/link";
import { FireIcon, HourglassMediumIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { useProcessingProductIds } from "@/app/(dashboard)/orders/use-order-books";
import type { StructuredProduct } from "./structured-product-data";

type CardProduct = Pick<
  StructuredProduct,
  "underlying" | "coupon" | "tenor" | "ko" | "strike" | "ki" | "tags" | "logos"
> & {
  /** Read for the order's state — most call sites spread the product, so it comes along. */
  id?: string;
};

const CARD_SHADOW =
  "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)";

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
  return (
    <div className="flex gap-2 items-center w-full shrink-0">
      <div className="flex gap-1 items-center flex-1 min-w-0">
        {logos.map((src, i) => (
          <div
            key={i}
            className="relative shrink-0 size-8 rounded overflow-hidden"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- swaps in a placeholder by reassigning `currentTarget.src` on error; `next/image` owns that attribute, so the fallback cannot work through it */}
            <img alt="" className="absolute inset-0 size-full object-cover" src={src} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/bond-logos/logo-placeholder.svg"; }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 items-center shrink-0">
        {/* "ใกล้เต็ม" stops being true once the order has gone out — the
            card's status band says what replaced it. */}
        {!processing && tags.includes("ใกล้เต็ม") && (
          <div
            className="flex gap-0.5 items-center overflow-hidden px-1 py-0.5 rounded shrink-0"
            style={{ backgroundColor: "#fdefe6" }}
          >
            <FireIcon size={14} weight="fill" color="#f97316" />
            <p className="whitespace-nowrap text-[9px] leading-[14px] text-[#101828]">ใกล้เต็ม</p>
          </div>
        )}
        {tags.includes("รับประกันเงินต้น") && (
          <div
            className="flex gap-0.5 items-center overflow-hidden px-1 py-0.5 rounded shrink-0"
            style={{ backgroundColor: "#eff6ff" }}
          >
            <ShieldCheckIcon size={14} weight="fill" color="#2b7fff" />
            <p className="whitespace-nowrap text-[9px] leading-[14px] text-[#101828]">รับประกันเงินต้น</p>
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
  return (
    <div className="absolute inset-x-0 top-0 flex h-7 items-center justify-center gap-1 bg-[#eff6ff] text-[12px] font-medium leading-4 text-[#0a6ee7]">
      <HourglassMediumIcon size={14} weight="fill" />
      กำลังดำเนินการสั่งซื้อ
    </div>
  );
}

function UnderlyingCouponRow({ underlying, coupon }: { underlying: string; coupon: string }) {
  return (
    <div className="flex gap-2 items-center w-full shrink-0">
      <div className="flex flex-col flex-1 min-w-0">
        <p className="font-bold text-[16px] leading-6 text-[#101828] truncate w-full">{underlying}</p>
        <p className="text-[12px] leading-4 text-[#6a7282]">Underlying</p>
      </div>
      <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
        <p className="font-bold text-[16px] leading-6 text-[#101828]">{coupon}</p>
        <p className="text-[12px] leading-4 text-[#6a7282]">Coupon</p>
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
      className={`flex items-center justify-center text-center bg-[#f9fafb] rounded-lg ${className}`}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex flex-col gap-0.5 items-center justify-center flex-1 min-w-0 h-full"
          style={i < stats.length - 1 ? { borderRight: "1px solid rgba(0,0,0,0.1)" } : {}}
        >
          <p className="text-[9px] leading-[14px] text-[#6a7282] w-full">{s.label}</p>
          <p
            className={`text-[12px] leading-4 text-[#4a5565] w-full ${
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

  const interactiveProps = onClick && !href
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
        className={`flex flex-col items-center gap-3 overflow-hidden p-5 ${bandPad} relative rounded-[12px] w-full self-start bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex flex-col gap-2 items-start w-full">
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
        className={`flex md:hidden flex-col items-center gap-3 overflow-hidden p-5 ${bandPad} relative rounded-[12px] w-full self-start bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex flex-col gap-2 items-start w-full">
          <LogoRow logos={logos} tags={tags} processing={processing} />
          <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
        </div>
        <StatsGrid stats={stats} className="w-full py-2" />
      </div>

      {/* Tablet — horizontal */}
      <div
        {...interactiveProps}
        className={`hidden md:flex lg:hidden ${processing ? "h-[148px]" : "h-[120px]"} box-border items-start gap-4 overflow-hidden p-5 ${bandPad} relative rounded-[12px] w-full self-start bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex flex-1 flex-col gap-2 items-start min-w-0">
          <LogoRow logos={logos} tags={tags} processing={processing} />
          <UnderlyingCouponRow underlying={underlying} coupon={coupon} />
        </div>
        <StatsGrid stats={stats} className="flex-1 h-full min-w-0 py-3" layout="tablet" />
      </div>

      {/* Desktop — vertical grid card */}
      <div
        {...interactiveProps}
        className={`hidden lg:flex flex-col items-center gap-3 overflow-hidden p-5 ${bandPad} relative rounded-[12px] w-full self-start bg-white ${interactiveProps.className ?? ""}`}
        style={cardStyle}
      >
        {processing && <ProcessingBand />}
        <div className="flex flex-col gap-2 items-start w-full">
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
