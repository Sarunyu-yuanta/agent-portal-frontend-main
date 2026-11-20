"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { Tag } from "@sarunyu/system-one";
import { type mockHouseViewStrategies } from "@/lib/mock-data";
import {
  CATEGORY_TAG_VARIANT,
  CATEGORY_ACCENT_COLOR,
  STRATEGY_DETAIL,
  getCategory,
} from "./house-view-data";
import { useT } from "@/i18n/I18nProvider";

type Strategy = (typeof mockHouseViewStrategies)[number];

export function PlaybookCard({ strategy, noBorder }: { strategy: Strategy; noBorder?: boolean }) {
  const cat = getCategory(strategy);
  const router = useLocalizedRouter();
  const t = useT();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/insights/${strategy.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(`/insights/${strategy.id}`);
      }}
      className={`flex h-full cursor-pointer overflow-hidden transition-colors hover:bg-muted/30 ${noBorder ? "" : "rounded-2xl border border-border bg-card"}`}
    >
      <div
        className="w-1 shrink-0"
        style={{ background: CATEGORY_ACCENT_COLOR[cat] ?? "#6b7280" }}
      />
      <div className="flex flex-1 flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <Tag
            text={t.research.houseView.category[cat] ?? cat}
            variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"}
            size="small"
          />
          <p className="text-title-lg leading-tight font-bold text-foreground">{strategy.name}</p>
        </div>
        <p className="text-label leading-relaxed text-foreground">
          {STRATEGY_DETAIL[strategy.id]?.rationale}
        </p>
      </div>
    </div>
  );
}
