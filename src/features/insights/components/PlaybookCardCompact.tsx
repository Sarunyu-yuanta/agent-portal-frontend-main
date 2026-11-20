"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { Tag } from "@sarunyu/system-one";
import { type mockHouseViewStrategies } from "@/mocks/mock-data";
import {
  CATEGORY_TAG_VARIANT,
  CATEGORY_ACCENT_COLOR,
  STRATEGY_DETAIL,
  getCategory,
} from "@/features/insights/lib/house-view-data";
import { useT } from "@/i18n/I18nProvider";

export function PlaybookCardCompact({
  strategy,
  noBorder,
}: {
  strategy: (typeof mockHouseViewStrategies)[number];
  noBorder?: boolean;
}) {
  const cat = getCategory(strategy);
  const rationale = STRATEGY_DETAIL[strategy.id]?.rationale;
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
      className={`flex min-h-[116px] w-full cursor-pointer overflow-hidden transition-colors hover:bg-muted/30 ${noBorder ? "" : "rounded-2xl border border-border bg-card"}`}
    >
      <div
        className="w-1 shrink-0"
        style={{ background: CATEGORY_ACCENT_COLOR[cat] ?? "#6b7280" }}
      />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Tag
          text={t.research.houseView.category[cat] ?? cat}
          variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"}
          size="small"
        />
        <p className="text-body leading-snug font-bold text-foreground">{strategy.name}</p>
        {rationale && (
          <p className="line-clamp-1 text-label leading-relaxed text-muted-foreground">
            {rationale}
          </p>
        )}
      </div>
    </div>
  );
}
