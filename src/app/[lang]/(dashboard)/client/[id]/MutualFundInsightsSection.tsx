"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, PaginationBanner } from "@sarunyu/system-one";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { MutualFundSeeMoreIcon, MutualFundSymbolTag } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  mutualFundInsightDetailHref,
  mutualFundInsightsHref,
  type MutualFundInsight,
} from "./mutual-fund-data";
import { CARD_SHADOW } from "./stock-ui";
import { useDragScroll } from "./use-drag-scroll";

function getInsightActiveIndex(container: HTMLElement, count: number): number {
  const cards = container.querySelectorAll<HTMLElement>("[data-insight-card]");
  if (cards.length === 0) return 0;

  const maxScroll = container.scrollWidth - container.clientWidth;
  if (container.scrollLeft >= maxScroll - 1) return count - 1;

  let bestIndex = 0;
  let bestDistance = Infinity;
  cards.forEach((card, index) => {
    const distance = Math.abs(card.offsetLeft - container.scrollLeft);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function scrollInsightToIndex(container: HTMLElement, index: number) {
  const card = container.querySelectorAll<HTMLElement>("[data-insight-card]")[index];
  if (!card) return;
  container.scrollTo({ left: card.offsetLeft, behavior: "smooth" });
}

/** The catalog's card elevation, from the one place it is authored. Its own
 *  copy of the same string lived here until it was noticed — and `stock-ui`'s
 *  token already documents itself as matching `MutualFundCard`'s, so this side
 *  was never meant to differ. */
const INSIGHT_CARD_SHADOW = CARD_SHADOW;

const INSIGHT_LIST_CARD_INTERACTIVE =
  "cursor-pointer no-underline text-inherit transition-[box-shadow,background-color,border-color] hover:border-[#0a6ee7]/25 hover:bg-[#f9fafb] hover:shadow-[0px_0px_4px_0px_rgba(102,102,102,0.18),0px_6px_12px_0px_rgba(102,102,102,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-offset-2";

function isHoldListInsight(title: string) {
  return title.startsWith("Hold List");
}

/** Figma 40118:77268 carousel card / 38285:291675 list card (430×174 / 430×168) */
export function MutualFundInsightCard({
  item,
  className,
  elevated = false,
  carousel = false,
  list = false,
}: {
  item: MutualFundInsight;
  className?: string;
  elevated?: boolean;
  carousel?: boolean;
  /** Figma 38285:291118 — fixed-size grid card on the insights list page */
  list?: boolean;
}) {
  const holdList = isHoldListInsight(item.title);

  if (list) {
    return (
      <Link
        href={mutualFundInsightDetailHref(item.detailId)}
        className={`relative block w-full shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white p-3 ${
          elevated ? INSIGHT_CARD_SHADOW : ""
        } ${holdList ? "h-[168px]" : "h-[174px]"} flex flex-col ${
          holdList ? "gap-2" : "gap-2.5"
        } ${INSIGHT_LIST_CARD_INTERACTIVE} ${className ?? ""}`}
      >
        <h3 className="line-clamp-2 h-12 shrink-0 text-base font-bold leading-[28px] text-[#0c244a]">
          {item.title}
        </h3>
        <p className="shrink-0 text-xs leading-[20px] text-[#0c244a]">{item.date}</p>
        <div className="flex h-2 shrink-0 w-full items-center">
          <div className="h-px w-full bg-black/10" />
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <p className="text-xs leading-[20px] text-[#0c244a]">กองทุนแนะนำ</p>
          <div className="flex flex-wrap gap-2">
            {item.recommendedFunds.map((symbol) => (
              <MutualFundSymbolTag key={symbol} symbol={symbol} />
            ))}
          </div>
        </div>
        <Image
          src={MF_ASSETS.insightCardChart}
          alt=""
          width={100}
          height={92}
          className={`pointer-events-none absolute size-[100px] opacity-30 ${
            holdList ? "-right-[43px] -top-5" : "-right-[3px] -top-11"
          }`}
        />
      </Link>
    );
  }

  return (
    <Link
      href={mutualFundInsightDetailHref(item.detailId)}
      data-insight-card={carousel ? true : undefined}
      className={`relative block shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white p-3 ${
        elevated ? INSIGHT_CARD_SHADOW : ""
      } ${carousel ? "w-[266.5px] lg:w-[343px]" : "w-full"} ${INSIGHT_LIST_CARD_INTERACTIVE} ${className ?? ""}`}
    >
      <h3 className="line-clamp-3 text-base font-bold leading-[28px] text-[#0c244a]">{item.title}</h3>
      <p className="mt-2.5 text-xs leading-[20px] text-[#0c244a]">{item.date}</p>
      <div className="my-2.5 h-2 w-full">
        <div className="h-px w-full bg-black/10" />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs leading-[20px] text-[#0c244a]">กองทุนแนะนำ</p>
        <div className="flex flex-wrap gap-2">
          {item.recommendedFunds.map((symbol) => (
            <MutualFundSymbolTag key={symbol} symbol={symbol} />
          ))}
        </div>
      </div>
      <Image
        src={MF_ASSETS.insightCardChart}
        alt=""
        width={100}
        height={92}
        className="pointer-events-none absolute -right-11 -top-11 size-[100px] opacity-30"
      />
    </Link>
  );
}

/** Figma 40118:77268 (desktop) / 40135:224291 (mobile) */
export function MutualFundInsightsSection({
  insights,
  onSeeAll,
}: {
  insights: MutualFundInsight[];
  onSeeAll?: () => void;
}) {
  const seeAllHref = mutualFundInsightsHref();
  const drag = useDragScroll();
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = drag.ref.current;
    if (!el) return;
    const update = () => {
      setActiveIndex(getInsightActiveIndex(el, insights.length));
      setCanScrollLeft(el.scrollLeft > 1);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [drag.ref, insights.length]);

  const scrollByCard = (dir: -1 | 1) => {
    const el = drag.ref.current;
    if (!el) return;
    const nextIndex = Math.min(Math.max(activeIndex + dir, 0), insights.length - 1);
    scrollInsightToIndex(el, nextIndex);
  };

  return (
    <section className="relative flex w-full min-w-0 flex-col gap-4">
      {/* lg:flex-1 — stretch to the desktop grid row so the background matches the performers column's height */}
      <div className="relative flex min-h-[342px] flex-col gap-4 overflow-hidden py-4 lg:flex-1 lg:gap-8 lg:py-0">
        <Image
          src={MF_ASSETS.insightsSectionBgMobile}
          alt=""
          fill
          className="pointer-events-none object-cover object-top lg:hidden"
          sizes="100vw"
        />
        <Image
          src={MF_ASSETS.insightsSectionBg}
          alt=""
          fill
          // Anchor right: the cream stripes live on the image's right side, and the box is now taller
          // than the 568×342 art, so object-cover scales it up and would crop the stripes off a left anchor.
          className="pointer-events-none hidden object-cover object-right-top lg:block"
          sizes="568px"
        />

        <div className="relative z-10 flex items-center gap-4 px-0 lg:px-0">
          <div className="flex min-w-0 flex-1 flex-col gap-0 lg:gap-1">
            <div className="flex items-center gap-1">
              <Image src={MF_ASSETS.bookOpen} alt="" width={20} height={20} className="size-5 shrink-0" />
              <h2 className="flex-1 text-lg font-bold leading-[32px] bg-gradient-to-r from-[#73442b] to-[#b58063] bg-clip-text text-transparent">
                <span className="lg:hidden">เจาะลึกโอกาสลงทุน</span>
                <span className="hidden lg:inline">เจาะลึกโอกาสลงทุนเด่น</span>
              </h2>
            </div>
            <p className="text-sm leading-[24px] bg-gradient-to-r from-[#73442b] to-[#b58063] bg-clip-text text-transparent">
              บทวิเคราะห์จาก Yuanta CIO
            </p>
          </div>
          <Link
            href={seeAllHref}
            className="hidden w-fit shrink-0 no-underline lg:inline-flex"
            onClick={
              onSeeAll
                ? (e) => {
                    e.preventDefault();
                    onSeeAll();
                  }
                : undefined
            }
          >
            <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0">
              ดูเพิ่มเติม
            </Button>
          </Link>
        </div>

        <div className="relative z-10 flex flex-col gap-4 lg:gap-6">
          <div
            ref={drag.ref}
            className="overflow-x-auto hide-scrollbar"
            style={{ scrollbarWidth: "none", cursor: "grab" }}
            onMouseDown={drag.onMouseDown}
            onMouseMove={drag.onMouseMove}
            onMouseUp={drag.onMouseUp}
            onMouseLeave={drag.onMouseLeave}
          >
            <div className="flex w-max gap-2.5">
              {insights.map((item) => (
                <MutualFundInsightCard key={item.id} item={item} carousel />
              ))}
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <PaginationBanner
              count={insights.length}
              activeIndex={activeIndex}
              className="w-fit"
              onIndexChange={(index) => {
                const el = drag.ref.current;
                if (el) scrollInsightToIndex(el, index);
              }}
            />
            <div className="absolute right-4 hidden items-center gap-2 lg:flex">
              <Button
                variant="outline"
                size="icon-md"
                aria-label="เลื่อนซ้าย"
                className={canScrollLeft ? "" : "invisible"}
                onClick={() => scrollByCard(-1)}
              >
                <CaretLeftIcon size={20} />
              </Button>
              <Button
                variant="outline"
                size="icon-md"
                aria-label="เลื่อนขวา"
                className={canScrollRight ? "" : "invisible"}
                onClick={() => scrollByCard(1)}
              >
                <CaretRightIcon size={20} />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex w-full justify-center lg:hidden">
          <Link
            href={seeAllHref}
            className="inline-flex w-fit shrink-0 no-underline"
            onClick={
              onSeeAll
                ? (e) => {
                    e.preventDefault();
                    onSeeAll();
                  }
                : undefined
            }
          >
            <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0">
              ดูเพิ่มเติม
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
