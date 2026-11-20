"use client";

import { DOWN, UP } from "@/features/catalog/stock/lib/stock-detail-constants";
import type { StockProductDetail } from "@/features/catalog/stock/lib/stock-product-detail-data";
import { useT } from "@/i18n/I18nProvider";

function DepthSide({
  volume,
  price,
  priceColor,
  barPct,
  barColor,
  align,
}: {
  volume: string;
  price: string;
  priceColor: string;
  barPct: number;
  barColor: string;
  align: "bid" | "offer";
}) {
  return (
    <div className="relative h-[26px] min-w-0 flex-1 overflow-hidden">
      <div
        className="absolute inset-y-0"
        style={
          align === "bid"
            ? { right: 0, width: `${barPct}%`, backgroundColor: barColor }
            : { left: 0, width: `${barPct}%`, backgroundColor: barColor }
        }
      />
      <div className="relative z-10 flex h-full items-center justify-between px-2 py-0.5 text-xs leading-[20px]">
        {align === "bid" ? (
          <>
            <span className="w-[68px] shrink-0 text-[rgba(0,0,0,0.75)]">{volume}</span>
            <span className="text-right whitespace-nowrap" style={{ color: priceColor }}>
              {price}
            </span>
          </>
        ) : (
          <>
            <span className="whitespace-nowrap" style={{ color: priceColor }}>
              {price}
            </span>
            <span className="text-right text-[rgba(0,0,0,0.75)]">{volume}</span>
          </>
        )}
      </div>
    </div>
  );
}

export function OrderBook({ detail }: { detail: StockProductDetail }) {
  const t = useT();
  const ob = t.stock.detail.orderBook;
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-4">
      <h2 className="text-lg leading-[28px] font-bold text-[rgba(0,0,0,0.85)]">{ob.title}</h2>
      <div className="flex w-full flex-col overflow-hidden rounded-xl border border-black/10">
        <div className="flex flex-col gap-2.5 p-4">
          <div className="flex w-full items-center text-xs leading-[20px] text-neutral-500">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.volume}</span>
              <span>{ob.bestBid}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.offer}</span>
              <span>{ob.volume}</span>
            </div>
          </div>
          <div className="flex w-full items-center overflow-hidden rounded">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="w-[68px] text-sm leading-[24px] text-neutral-500">
                {detail.bestBid.volume}
              </span>
              <span className="text-sm leading-[24px] font-bold text-[#2f952a]">
                {detail.bestBid.price}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span className="text-sm leading-[24px] font-bold text-[#f5212d]">
                {detail.bestOffer.price}
              </span>
              <span className="text-sm leading-[24px] text-neutral-500">
                {detail.bestOffer.volume}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-black/10 p-4">
          <div className="flex w-full items-center text-xs leading-[20px] text-neutral-500">
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.volume}</span>
              <span>{ob.bid}</span>
            </div>
            <div className="flex min-w-0 flex-1 items-center justify-between px-2">
              <span>{ob.offer}</span>
              <span>{ob.volume}</span>
            </div>
          </div>
          <div className="flex w-full flex-col">
            {/* As many rows as the deeper side has; a side that runs out shows a
                blank level rather than reading past the end of its array. */}
            {Array.from(
              { length: Math.max(detail.bidLevels.length, detail.offerLevels.length) },
              (_, i) => i,
            ).map((i) => {
              const bid = detail.bidLevels[i] ?? EMPTY_LEVEL;
              const offer = detail.offerLevels[i] ?? EMPTY_LEVEL;
              return (
                <div key={`depth-${i}`} className="flex w-full items-center overflow-hidden">
                  <DepthSide
                    volume={bid.volume}
                    price={bid.price}
                    priceColor={UP}
                    barPct={bid.barPct}
                    barColor="#effce1"
                    align="bid"
                  />
                  <DepthSide
                    volume={offer.volume}
                    price={offer.price}
                    priceColor={DOWN}
                    barPct={offer.barPct}
                    barColor="#fff0f0"
                    align="offer"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** A depth row for the side that has run out of levels. */
const EMPTY_LEVEL = { volume: "", price: "", barPct: 0 };
