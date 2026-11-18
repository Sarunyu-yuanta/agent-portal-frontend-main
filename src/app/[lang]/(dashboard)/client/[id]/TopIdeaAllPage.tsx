"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { TopIdeaCard } from "./TopIdeaCard";
import { type TopIdeaSector } from "./top-idea-data";
import { useTopIdeas } from "@/hooks/use-catalog";
import { TopIdeaAllPageSkeleton } from "./ProductDetailSkeletons";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

export function TopIdeaAllPage({
  onBack,
  onSelect,
}: {
  onBack: () => void;
  onSelect: (sector: TopIdeaSector) => void;
}) {
  const t = useT();
  const { data: topIdeas, isLoading } = useTopIdeas();

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  if (isLoading) return <TopIdeaAllPageSkeleton />;

  return (
    <div className="flex flex-col items-center gap-8 w-full pt-6 pb-20 bg-gradient-to-b from-white from-[43.451%] to-transparent">
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label={t.products.common.back} className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[30px] text-[#101828] truncate">
          Top idea
        </h1>
      </div>

      {topIdeas.length === 0 ? (
        <div className="w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
          <CatalogSectionEmpty title={t.products.states.noTopIdeas} />
        </div>
      ) : (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
        {topIdeas.map((item, i) => (
          <TopIdeaCard
            key={`${item.sector}-${i}`}
            sector={item.sector}
            fullWidth
            onClick={() => onSelect(item.sector)}
          />
        ))}
      </div>
      )}
    </div>
  );
}
