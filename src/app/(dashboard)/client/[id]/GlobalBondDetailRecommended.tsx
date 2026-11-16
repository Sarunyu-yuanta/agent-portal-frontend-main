"use client";

import { Button } from "@sarunyu/system-one";
import {
  DETAIL_RECOMMENDED_CARDS,
  DETAIL_RECOMMENDED_ISSUERS,
  type DetailRecommendedCard,
  type GlobalBondIssuerId,
} from "./global-bond-data";
import { TABLE_SHADOW } from "./fixed-income-shared";

function CardLogo({ card }: { card: DetailRecommendedCard }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[rgba(0,0,0,0.08)]">
      {card.logoVariant === "meta-infinity" ? (
        // eslint-disable-next-line @next/next/no-img-element -- 32px issuer logo, already ~2KB
        <img
          alt=""
          src={card.logoSrc}
          className="h-[15.5px] w-8 object-contain"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- 30px issuer logo, already ~2KB
        <img
          alt=""
          src={card.logoSrc}
          className="size-[30px] rounded object-cover"
        />
      )}
    </div>
  );
}

function RecommendedBondCard({
  card,
  highlighted,
  onSelect,
}: {
  card: DetailRecommendedCard;
  highlighted: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={`box-border flex min-h-[194px] w-[320px] md:w-[416px] shrink-0 lg:w-full lg:min-w-0 flex-col items-center justify-between gap-4 rounded-xl bg-white p-4 ${
        highlighted ? "border-2 border-[#51a2ff]" : "border-0"
      }`}
      style={{ boxShadow: TABLE_SHADOW }}
    >
      <div className="flex w-full shrink-0 flex-col items-start gap-3">
        <div className="flex w-full items-start gap-2">
          <CardLogo card={card} />
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <p className="w-full truncate text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.75)]">
              {card.title}
            </p>
            <div className="flex w-full items-start gap-0.5 whitespace-nowrap text-xs leading-[22px] text-[rgba(0,0,0,0.6)]">
              <span>Ticker:</span>
              <span>{card.ticker}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 items-start justify-center gap-4 rounded-lg bg-[#f9f9f9] p-2">
          <div className="flex min-w-0 flex-1 flex-col items-center self-stretch text-center">
            <p className="w-full text-xs leading-[22px] text-[rgba(0,0,0,0.4)]">
              ผลตอบแทนโดยประมาณ
            </p>
            <p className="w-full text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.75)]">
              {card.estimatedYield}
            </p>
          </div>
          <div className="w-px shrink-0 self-stretch bg-black/10" />
          <div className="flex min-w-0 flex-1 flex-col items-center self-stretch text-center">
            <p className="w-full text-xs leading-[22px] text-[rgba(0,0,0,0.4)]">
              วันครบกำหนด
            </p>
            <p className="w-full text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.75)]">
              {card.maturityRange}
            </p>
          </div>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full shrink-0"
        onClick={onSelect}
      >
        รายละเอียด
      </Button>
    </div>
  );
}

export function GlobalBondDetailRecommended({
  issuerId,
  onIssuerSelect,
}: {
  issuerId: GlobalBondIssuerId;
  onIssuerSelect?: (issuerId: GlobalBondIssuerId) => void;
}) {
  const highlightedIssuerId = DETAIL_RECOMMENDED_ISSUERS.includes(issuerId)
    ? issuerId
    : DETAIL_RECOMMENDED_ISSUERS[0];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-2 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- 20px SVG icon; the image optimizer rejects SVG */}
        <img
          alt=""
          src="/products/global-bond/global-bond-sparkle.svg"
          className="size-5 shrink-0"
        />
        <h3 className="text-sm font-semibold leading-[26px] text-[rgba(0,0,0,0.85)] md:text-xl md:font-bold md:leading-[32px] md:tracking-[-0.5px]">
          Recommended Bonds
        </h3>
      </div>
      <div className="overflow-x-auto hide-scrollbar -mx-4 w-[calc(100%+2rem)] md:-mx-8 md:w-[calc(100%+4rem)] lg:mx-0 lg:w-full lg:overflow-visible">
        <div className="flex gap-4 min-w-max px-4 md:px-8 lg:min-w-0 lg:w-full lg:grid lg:grid-cols-3 lg:px-0">
          {DETAIL_RECOMMENDED_CARDS.map((card) => (
            <RecommendedBondCard
              key={card.id}
              card={card}
              highlighted={card.id === highlightedIssuerId}
              onSelect={() => onIssuerSelect?.(card.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
