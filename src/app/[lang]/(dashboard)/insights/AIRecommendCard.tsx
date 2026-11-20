"use client";

import { SparkleIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

export function AIRecommendCard() {
  const a = useT().research.aiRecommend;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-6 text-center">
      <div className="bg-primary-action-light flex size-10 items-center justify-center rounded-xl">
        <SparkleIcon size={20} weight="fill" className="text-primary-action" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="type-subtitle-2 font-bold text-foreground">{a.title}</p>
        <p className="type-caption leading-relaxed text-muted-foreground">{a.body}</p>
      </div>
      <p className="text-primary-action text-meta font-semibold tracking-widest uppercase">
        {a.comingSoon}
      </p>
    </div>
  );
}
