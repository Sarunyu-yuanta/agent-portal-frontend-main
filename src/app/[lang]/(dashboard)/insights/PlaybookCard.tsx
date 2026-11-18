"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { Tag } from "@sarunyu/system-one";
import { mockHouseViewStrategies } from "@/lib/mock-data";
import { CATEGORY_TAG_VARIANT, CATEGORY_ACCENT_COLOR, STRATEGY_DETAIL, getCategory } from "./house-view-data";
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
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/insights/${strategy.id}`); }}
      className={`overflow-hidden flex h-full cursor-pointer hover:bg-muted/30 transition-colors ${noBorder ? "" : "rounded-2xl border border-border bg-card"}`}
    >
      <div className="w-1 shrink-0" style={{ background: CATEGORY_ACCENT_COLOR[cat] ?? "#6b7280" }} />
      <div className="flex-1 p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Tag text={t.research.houseView.category[cat] ?? cat} variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"} size="small" />
          <p className="text-title-lg font-bold text-foreground leading-tight">{strategy.name}</p>
        </div>
        <p className="text-label text-foreground leading-relaxed">{STRATEGY_DETAIL[strategy.id]?.rationale}</p>
      </div>
    </div>
  );
}
