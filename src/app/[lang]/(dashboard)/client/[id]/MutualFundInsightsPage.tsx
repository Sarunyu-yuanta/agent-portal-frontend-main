"use client";

import { useEffect, useState } from "react";
import { Button, Pagination } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { MutualFundInsightCard } from "./MutualFundInsightsSection";
import { MutualFundInsightsPageSkeleton } from "./MutualFundListPageSkeletons";
import { MutualFundSectionEmpty } from "./mutual-fund-ui";
import { useMutualFundInsights } from "@/hooks/use-catalog";
import { useT } from "@/i18n/I18nProvider";

/** Figma 38285:291118 — mutual fund CIO insights list. */
export function MutualFundInsightsPage({ onBack }: { onBack: () => void }) {
  const t = useT();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: insights, isLoading } = useMutualFundInsights(currentPage);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [currentPage]);

  if (isLoading) return <MutualFundInsightsPageSkeleton />;

  const { items, totalPages } = insights;

  return (
    <div className="flex w-full flex-1 flex-col bg-[#f9fafb] pb-20">
      <div className="mx-auto flex w-full max-w-[996px] items-center gap-2 px-4 pt-8 pb-2 md:px-8 lg:px-0">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.common.back}
          className="size-[30px] shrink-0 rounded-md p-[5px]"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-[#101828]">
          {t.insights.allResearch}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-[996px] px-4 md:px-8 lg:px-0">
        <div className="flex flex-col items-center gap-8 rounded-2xl bg-white px-4 py-8 shadow-[0px_0px_4px_rgba(0,0,0,0.02)] lg:px-14">
          {/* Figma 38285:291674 — 884×756 grid, 430px cards, 24px gap */}
          {items.length === 0 ? (
            <MutualFundSectionEmpty title={t.fund.empty.insights} />
          ) : (
            <div className="mx-auto grid w-full max-w-[884px] grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-6">
              {items.map((item) => (
                <MutualFundInsightCard key={item.id} item={item} elevated list />
              ))}
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex w-full justify-center px-2.5">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
