"use client";

import { Button, Tag } from "@sarunyu/system-one";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { CATEGORY_CONFIG, confidenceColor, type Insight } from "./insight-config";

export function InsightRow({
  insight,
  isLast,
  isSelected,
  onSelect,
}: {
  insight: Insight;
  isLast: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { isPrivate } = usePrivacy();
  const maskedName = maskName(insight.clientName, isPrivate);
  const config = CATEGORY_CONFIG[insight.type as keyof typeof CATEGORY_CONFIG];
  if (!config) return null;
  const { color, bg, Icon, tagVariant, tagText, primaryAction } = config;
  const confColor = confidenceColor(insight.confidence);
  const isRisk = insight.type === "Risk Alert";

  return (
    <div
      className={`cursor-pointer transition-colors ${isSelected ? "bg-primary-action-light/60" : "hover:bg-muted/40"} ${!isLast ? "border-b border-border" : ""}`}
      onClick={() => onSelect(insight.id)}
    >
      {/* ── Mobile layout ── */}
      <div className="flex flex-col gap-2 px-4 py-4 lg:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
            <Icon size={13} weight="duotone" style={{ color }} />
          </div>
          <Tag text={tagText} variant={tagVariant} size="small" />
          <span className="text-meta font-medium text-muted-foreground">{insight.tier}</span>
        </div>
        <p className="text-body font-semibold text-foreground leading-snug">{maskedName}</p>
        <p className="type-body-2 text-muted-foreground leading-snug">{insight.insight}</p>
        <div className="flex items-center gap-3">
          <span className="text-meta font-semibold tabular-nums" style={{ color: confColor }}>{insight.confidence}% confidence</span>
          {!isRisk && <span className="text-meta font-medium text-success">{insight.revenueImpact} potential</span>}
          {isRisk && <span className="text-meta font-medium" style={{ color: "var(--text-danger-primary)" }}>Risk Reduction</span>}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="plain" size="sm" onClick={(e) => e.stopPropagation()}>Snooze 24h</Button>
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>{primaryAction}</Button>
        </div>
      </div>

      {/* ── Desktop layout (original) ── */}
      <div className="hidden lg:flex items-start gap-4 px-5 py-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: bg }}>
          <Icon size={18} weight="duotone" style={{ color }} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Tag text={tagText} variant={tagVariant} size="small" />
            <span className="text-meta font-medium text-muted-foreground">{insight.tier}</span>
          </div>
          <p className="text-body font-semibold text-foreground leading-snug">{maskedName}</p>
          <p className="type-body-2 text-muted-foreground leading-snug">{insight.insight}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-meta font-semibold tabular-nums" style={{ color: confColor }}>{insight.confidence}% confidence</span>
            {!isRisk && <span className="text-meta font-medium text-success">{insight.revenueImpact} potential</span>}
            {isRisk && <span className="text-meta font-medium" style={{ color: "var(--text-danger-primary)" }}>Risk Reduction</span>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>{primaryAction}</Button>
          <Button variant="plain" size="sm" onClick={(e) => e.stopPropagation()}>Snooze 24h</Button>
        </div>
      </div>
    </div>
  );
}
