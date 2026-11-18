"use client";

import { useRouter } from "next/navigation";
import { Tag } from "@sarunyu/system-one";
import { mockHouseViewStrategies } from "@/lib/mock-data";
import { CATEGORY_TAG_VARIANT, CATEGORY_ACCENT_COLOR, STRATEGY_DETAIL, getCategory } from "./house-view-data";

export function PlaybookCardCompact({ strategy, noBorder }: { strategy: (typeof mockHouseViewStrategies)[number]; noBorder?: boolean }) {
  const cat = getCategory(strategy);
  const rationale = STRATEGY_DETAIL[strategy.id]?.rationale;
  const router = useRouter();
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/insights/${strategy.id}`)}
      onKeyDown={(e) => { if (e.key === "Enter") router.push(`/insights/${strategy.id}`); }}
      className={`overflow-hidden flex w-full min-h-[116px] cursor-pointer hover:bg-muted/30 transition-colors ${noBorder ? "" : "rounded-2xl border border-border bg-card"}`}
    >
      <div className="w-1 shrink-0" style={{ background: CATEGORY_ACCENT_COLOR[cat] ?? "#6b7280" }} />
      <div className="flex-1 p-4 flex flex-col gap-2">
        <Tag text={cat} variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"} size="small" />
        <p className="text-body font-bold text-foreground leading-snug">{strategy.name}</p>
        {rationale && (
          <p className="text-label text-muted-foreground leading-relaxed line-clamp-1">{rationale}</p>
        )}
      </div>
    </div>
  );
}
