import { SparkleIcon } from "@phosphor-icons/react";

export function AIRecommendCard() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 flex flex-col items-center gap-3 text-center">
      <div className="size-10 rounded-xl bg-primary-action-light flex items-center justify-center">
        <SparkleIcon size={20} weight="fill" className="text-primary-action" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="type-subtitle-2 font-bold text-foreground">AI Recommend</p>
        <p className="type-caption text-muted-foreground leading-relaxed">AI-powered client matching and recommendations will appear here.</p>
      </div>
      <p className="text-meta font-semibold text-primary-action uppercase tracking-widest">Coming Soon</p>
    </div>
  );
}
