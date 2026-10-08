"use client";

import type { RefObject } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowRightIcon, FireIcon } from "@phosphor-icons/react";
import { TopIdeaCard } from "./TopIdeaCard";
import { StructuredProductCard } from "./StructuredProductCard";
import { TOP_IDEAS, type TopIdeaSector } from "./top-idea-data";
import {
  STRUCTURED_GRID_COUNT,
  STRUCTURED_SHELF,
  TOP_PICK_COUNT,
  type StructuredProduct,
} from "./structured-product-data";
import { useOpenProducts } from "@/app/(dashboard)/orders/use-order-books";
import {
  INVESTMENT_SOLUTIONS,
  type InvestmentSolutionId,
} from "./investment-solution-data";
import {
  GRAD_BALANCED,
  GRAD_HIGH_CV,
  GRAD_SECURE,
  InvestmentCard,
} from "./ProductCatalogInvestmentCard";

const IMG_SECURE_INCOME = "/products/investment-solution/invest-secure-income.webp";
const IMG_BALANCED_GROWTH = "/products/investment-solution/invest-balanced-growth.webp";
const IMG_HIGH_CONVICTION = "/products/investment-solution/invest-high-conviction.webp";
const IMG_RECOMMEND_BG = "/products/investment-solution/investment-solution-bg.webp";

type DragHandlers = {
  ref: RefObject<HTMLDivElement | null>;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
};

/** Top Idea horizontal scroll strip — used by both "structured" and
 *  "thai-structured" tabs. */
export function TopIdeaStrip({
  drag,
  onTopIdeaSelect,
  onAllTopIdeasView,
}: {
  drag: DragHandlers;
  onTopIdeaSelect: (sector: TopIdeaSector) => void;
  onAllTopIdeasView: () => void;
}) {
  const { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave } = drag;
  return (
    <div
      className="flex flex-col gap-4 items-start shrink-0 w-full"
      style={{ backgroundColor: "white", paddingTop: 16, paddingBottom: 16 }}
    >
      <div className="flex gap-2 items-center shrink-0 w-full max-w-[1280px] mx-auto px-4 lg:px-6">
        <p
          className="font-bold flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: "#101828", fontSize: 20, lineHeight: "30px" }}
        >
          Top idea
        </p>
        <Button
          variant="plain"
          size="sm"
          rightIcon={<ArrowRightIcon size={18} />}
          className="shrink-0"
          onClick={onAllTopIdeasView}
        >
          ทั้งหมด
        </Button>
      </div>
      <div
        ref={ref}
        className="overflow-x-auto w-full pb-3 hide-scrollbar"
        style={{
          scrollbarWidth: "none",
          cursor: "grab",
          paddingLeft: "max(1rem, calc((100% - 1280px) / 2 + 1.5rem))",
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        <div className="flex gap-3.5 min-w-max pr-4 lg:pr-6">
          {TOP_IDEAS.map((idea, i) => (
            <TopIdeaCard
              key={i}
              sector={idea.sector}
              onClick={() => onTopIdeaSelect(idea.sector)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Investment Solution section — 3 investment cards over a background image. */
export function InvestmentSolutionSection({
  onInvestmentSolutionSelect,
  bgImage,
}: {
  onInvestmentSolutionSelect: (id: InvestmentSolutionId) => void;
  bgImage?: string;
}) {
  return (
    <div
      className="relative shrink-0 w-full"
      style={{
        paddingTop: 24,
        paddingBottom: 24,
        backgroundImage: `url(${bgImage ?? IMG_RECOMMEND_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="flex flex-col gap-4 items-start shrink-0 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-6">
        <p
          className="font-bold relative shrink-0 overflow-hidden text-ellipsis w-full whitespace-nowrap"
          style={{ color: "#101828", fontSize: 20, lineHeight: "30px" }}
        >
          Investment Solution
        </p>
        <div className="flex flex-col gap-6 items-start relative shrink-0 w-full">
          <div className="flex flex-col lg:flex-row gap-4 shrink-0 w-full">
            {INVESTMENT_SOLUTIONS.map((solution) => {
              const isHighConviction = solution.id === "high-conviction";
              const isBalanced = solution.id === "balanced-growth";
              return (
                <InvestmentCard
                  key={solution.id}
                  name={solution.name}
                  desc={solution.desc}
                  coupon={solution.couponRange}
                  tenor={solution.tenor}
                  imgSrc={
                    isHighConviction
                      ? IMG_HIGH_CONVICTION
                      : isBalanced
                        ? IMG_BALANCED_GROWTH
                        : IMG_SECURE_INCOME
                  }
                  gradient={
                    isHighConviction
                      ? GRAD_HIGH_CV
                      : isBalanced
                        ? GRAD_BALANCED
                        : GRAD_SECURE
                  }
                  imgLeft={isHighConviction ? -67 : 12}
                  imgW={isHighConviction ? 198 : 72}
                  imgH={isHighConviction ? 132 : isBalanced ? 103 : 92}
                  highConviction={isHighConviction}
                  crop={
                    !isHighConviction
                      ? {
                          scaleX: isBalanced ? 0.7006 : 0.439,
                          scaleY: 1.0,
                          tx: isBalanced ? 0.1464 : 0,
                          ty: 0,
                        }
                      : undefined
                  }
                  onClick={() => onInvestmentSolutionSelect(solution.id)}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The front page's structured products, closed ones taken out and the rest
 * moved up — see {@link STRUCTURED_SHELF}. Each section reads it on its own;
 * both get the same queue, so neither shows what the other does.
 */
function useStructuredShelf(): { topPicks: StructuredProduct[]; grid: StructuredProduct[] } {
  const open = useOpenProducts(STRUCTURED_SHELF, (p) => p.id);
  return {
    topPicks: open.slice(0, TOP_PICK_COUNT),
    grid: open.slice(TOP_PICK_COUNT, TOP_PICK_COUNT + STRUCTURED_GRID_COUNT),
  };
}

/** Top Pick section — the first three open products on the shelf. */
export function TopPickSection({
  onProductSelect,
}: {
  onProductSelect: (product: StructuredProduct) => void;
}) {
  const { topPicks } = useStructuredShelf();
  return (
    <div
      className="w-full"
      style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="flex flex-col gap-4 items-center shrink-0 w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-6">
        <div className="flex gap-1 items-center shrink-0 w-full">
          <FireIcon
            size={24}
            weight="fill"
            color="#f97316"
            className="shrink-0 md:hidden lg:block"
          />
          <FireIcon
            size={20}
            weight="fill"
            color="#f97316"
            className="shrink-0 hidden md:block lg:hidden"
          />
          <p
            className="font-bold overflow-hidden text-ellipsis whitespace-nowrap text-xl leading-[30px] md:text-lg md:leading-6 lg:text-xl lg:leading-[30px]"
            style={{ color: "#101828" }}
          >
            Top pick
          </p>
        </div>
        <div className="grid grid-cols-1 md:flex md:flex-col lg:grid lg:grid-cols-3 gap-4 shrink-0 w-full">
          {topPicks.map((p) => (
            <StructuredProductCard
              key={p.id}
              {...p}
              onClick={() => onProductSelect(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Structured Product grid section — used by both structured and thai-structured tabs. */
export function StructuredProductGridSection({
  title,
  onProductSelect,
  onAllProductsView,
}: {
  title: string;
  onProductSelect: (product: StructuredProduct) => void;
  onAllProductsView: () => void;
}) {
  const { grid } = useStructuredShelf();
  return (
    <div
      className="flex flex-col gap-4 items-center relative shrink-0 w-full"
      style={{ backgroundColor: "#f9fafb", paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="flex gap-2 items-center shrink-0 w-full max-w-[1280px] mx-auto px-4 lg:px-6">
        <p
          className="font-bold flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
          style={{ color: "#101828", fontSize: 20, lineHeight: "30px" }}
        >
          {title}
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0 w-full max-w-[1280px] mx-auto px-4 lg:px-6">
        {grid.map((p) => (
          <StructuredProductCard
            key={p.id}
            {...p}
            onClick={() => onProductSelect(p)}
          />
        ))}
      </div>
      <Button
        variant="plain"
        size="sm"
        className="shrink-0"
        onClick={onAllProductsView}
      >
        ดูทั้งหมด
      </Button>
    </div>
  );
}
