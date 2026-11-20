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
import { useOpenProducts } from "@/app/[lang]/(dashboard)/orders/use-order-books";
import { INVESTMENT_SOLUTIONS, type InvestmentSolutionId } from "./investment-solution-data";
import {
  GRAD_BALANCED,
  GRAD_HIGH_CV,
  GRAD_SECURE,
  InvestmentCard,
} from "./ProductCatalogInvestmentCard";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

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
  const t = useT();
  const { ref, onMouseDown, onMouseMove, onMouseUp, onMouseLeave } = drag;
  return (
    <div
      className="flex w-full shrink-0 flex-col items-start gap-4"
      style={{ backgroundColor: "white", paddingTop: 16, paddingBottom: 16 }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 items-center gap-2 px-4 lg:px-6">
        <p
          className="flex-1 overflow-hidden font-bold text-ellipsis whitespace-nowrap"
          style={{ color: "#101828", fontSize: 22, lineHeight: "32px" }}
        >
          Top idea
        </p>
        {TOP_IDEAS.length > 0 && (
          <Button
            variant="plain"
            size="sm"
            rightIcon={<ArrowRightIcon size={18} />}
            className="shrink-0"
            onClick={onAllTopIdeasView}
          >
            {t.products.common.all}
          </Button>
        )}
      </div>
      {TOP_IDEAS.length === 0 ? (
        <div className="mx-auto w-full max-w-[1280px] px-4 lg:px-6">
          <CatalogSectionEmpty title={t.products.states.noTopIdeas} />
        </div>
      ) : (
        <div
          ref={ref}
          className="hide-scrollbar w-full overflow-x-auto pb-3"
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
          <div className="flex min-w-max gap-3.5 pr-4 lg:pr-6">
            {TOP_IDEAS.map((idea, i) => (
              <TopIdeaCard
                key={i}
                sector={idea.sector}
                onClick={() => onTopIdeaSelect(idea.sector)}
              />
            ))}
          </div>
        </div>
      )}
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
  const t = useT();
  return (
    <div
      className="relative w-full shrink-0"
      style={{
        paddingTop: 24,
        paddingBottom: 24,
        backgroundImage: `url(${bgImage ?? IMG_RECOMMEND_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "top",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 flex-col items-start gap-4 px-4 md:px-8 lg:px-6">
        <p
          className="relative w-full shrink-0 overflow-hidden font-bold text-ellipsis whitespace-nowrap"
          style={{ color: "#101828", fontSize: 22, lineHeight: "32px" }}
        >
          Investment Solution
        </p>
        {INVESTMENT_SOLUTIONS.length === 0 ? (
          <div className="w-full rounded-xl bg-white">
            <CatalogSectionEmpty title={t.products.states.noInvestmentSolutions} />
          </div>
        ) : (
          <div className="relative flex w-full shrink-0 flex-col items-start gap-6">
            <div className="flex w-full shrink-0 flex-col gap-4 lg:flex-row">
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
                      isHighConviction ? GRAD_HIGH_CV : isBalanced ? GRAD_BALANCED : GRAD_SECURE
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
        )}
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
  const t = useT();
  const { topPicks } = useStructuredShelf();
  return (
    <div className="w-full" style={{ backgroundColor: "white", paddingTop: 24, paddingBottom: 24 }}>
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 flex-col items-center gap-4 px-4 md:px-8 lg:px-6">
        <div className="flex w-full shrink-0 items-center gap-1">
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
            className="hidden shrink-0 md:block lg:hidden"
          />
          <p
            className="overflow-hidden text-xl leading-[34px] font-bold text-ellipsis whitespace-nowrap md:text-lg md:leading-[28px] lg:text-xl lg:leading-[34px]"
            style={{ color: "#101828" }}
          >
            Top pick
          </p>
        </div>
        {topPicks.length === 0 ? (
          // Every product on the shelf can be booked out.
          <CatalogSectionEmpty title={t.products.states.noOpenProducts} />
        ) : (
          <div className="grid w-full shrink-0 grid-cols-1 gap-4 md:flex md:flex-col lg:grid lg:grid-cols-3">
            {topPicks.map((p) => (
              <StructuredProductCard key={p.id} {...p} onClick={() => onProductSelect(p)} />
            ))}
          </div>
        )}
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
  const t = useT();
  const { grid } = useStructuredShelf();
  return (
    <div
      className="relative flex w-full shrink-0 flex-col items-center gap-4"
      style={{ backgroundColor: "#f9fafb", paddingTop: 24, paddingBottom: 24 }}
    >
      <div className="mx-auto flex w-full max-w-[1280px] shrink-0 items-center gap-2 px-4 lg:px-6">
        <p
          className="flex-1 overflow-hidden font-bold text-ellipsis whitespace-nowrap"
          style={{ color: "#101828", fontSize: 22, lineHeight: "32px" }}
        >
          {title}
        </p>
      </div>
      {grid.length === 0 ? (
        <div className="mx-auto w-full max-w-[1280px] px-4 lg:px-6">
          <CatalogSectionEmpty title={t.products.states.noOpenProducts} />
        </div>
      ) : (
        <>
          <div className="mx-auto grid w-full max-w-[1280px] shrink-0 grid-cols-1 gap-4 px-4 lg:grid-cols-3 lg:px-6">
            {grid.map((p) => (
              <StructuredProductCard key={p.id} {...p} onClick={() => onProductSelect(p)} />
            ))}
          </div>
          <Button variant="plain" size="sm" className="shrink-0" onClick={onAllProductsView}>
            {t.products.common.viewAll}
          </Button>
        </>
      )}
    </div>
  );
}
