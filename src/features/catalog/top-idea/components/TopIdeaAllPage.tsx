"use client";

import { useEffect } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { TopIdeaCard } from "./TopIdeaCard";
import { type TopIdeaSector } from "@/features/catalog/top-idea/lib/top-idea-data";
import { useTopIdeas } from "@/features/catalog/hooks/use-catalog";
import { TopIdeaAllPageSkeleton } from "@/features/catalog/components/ProductDetailSkeletons";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
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
    <div className="flex w-full flex-col items-center gap-8 bg-gradient-to-b from-white from-[43.451%] to-transparent pt-6 pb-20">
      <div className="flex h-[46px] w-full max-w-[1280px] items-center gap-2 px-4 py-2 md:px-8 lg:px-20">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.products.common.back}
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-neutral-900">
          Top idea
        </h1>
      </div>

      {topIdeas.length === 0 ? (
        <div className="w-full max-w-[1280px] px-4 md:px-8 lg:px-20">
          <CatalogSectionEmpty title={t.products.states.noTopIdeas} />
        </div>
      ) : (
        <div className="grid w-full max-w-[1280px] grid-cols-2 gap-4 px-4 md:px-8 lg:grid-cols-3 lg:px-20">
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
