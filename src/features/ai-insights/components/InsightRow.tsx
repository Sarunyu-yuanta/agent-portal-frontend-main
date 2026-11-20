"use client";

import { Button, Tag } from "@sarunyu/system-one";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { useT } from "@/i18n/I18nProvider";
import {
  CATEGORY_CONFIG,
  confidenceColor,
  type Insight,
} from "@/features/ai-insights/lib/insight-config";

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
  const t = useT();
  const ai = t.research.aiInsights;
  const maskedName = maskName(insight.clientName, isPrivate);
  const config = CATEGORY_CONFIG[insight.type as keyof typeof CATEGORY_CONFIG];
  if (!config) return null;
  const { color, bg, Icon, tagVariant } = config;
  const tagText = ai.category[insight.type] ?? insight.type;
  const primaryAction = ai.primaryAction[insight.type];
  const confColor = confidenceColor(insight.confidence);
  const isRisk = insight.type === "Risk Alert";

  return (
    <div
      className={`cursor-pointer transition-colors ${isSelected ? "bg-primary-action-light/60" : "hover:bg-muted/40"} ${!isLast ? "border-b border-border" : ""}`}
      onClick={() => onSelect(insight.id)}
    >
      {/* ── Mobile layout ── */}
      <div className="flex flex-col gap-2 px-4 py-4 lg:hidden">
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: bg }}
          >
            <Icon size={13} weight="duotone" style={{ color }} />
          </div>
          <Tag text={tagText} variant={tagVariant} size="small" />
          <span className="text-meta font-medium text-muted-foreground">{insight.tier}</span>
        </div>
        <p className="text-body leading-snug font-semibold text-foreground">{maskedName}</p>
        <p className="type-body-2 leading-snug text-muted-foreground">{insight.insight}</p>
        <div className="flex items-center gap-3">
          <span className="text-meta font-semibold tabular-nums" style={{ color: confColor }}>
            {ai.row.confidence(insight.confidence)}
          </span>
          {!isRisk && (
            <span className="text-success text-meta font-medium">
              {ai.row.potential(insight.revenueImpact)}
            </span>
          )}
          {isRisk && (
            <span className="text-meta font-medium" style={{ color: "var(--text-danger-primary)" }}>
              {ai.row.riskReduction}
            </span>
          )}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="plain" size="sm" onClick={(e) => e.stopPropagation()}>
            {ai.row.snooze}
          </Button>
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
            {primaryAction}
          </Button>
        </div>
      </div>

      {/* ── Desktop layout (original) ── */}
      <div className="hidden items-start gap-4 px-5 py-4 lg:flex">
        <div
          className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: bg }}
        >
          <Icon size={18} weight="duotone" style={{ color }} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Tag text={tagText} variant={tagVariant} size="small" />
            <span className="text-meta font-medium text-muted-foreground">{insight.tier}</span>
          </div>
          <p className="text-body leading-snug font-semibold text-foreground">{maskedName}</p>
          <p className="type-body-2 leading-snug text-muted-foreground">{insight.insight}</p>
          <div className="mt-0.5 flex items-center gap-3">
            <span className="text-meta font-semibold tabular-nums" style={{ color: confColor }}>
              {ai.row.confidence(insight.confidence)}
            </span>
            {!isRisk && (
              <span className="text-success text-meta font-medium">
                {ai.row.potential(insight.revenueImpact)}
              </span>
            )}
            {isRisk && (
              <span
                className="text-meta font-medium"
                style={{ color: "var(--text-danger-primary)" }}
              >
                {ai.row.riskReduction}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
            {primaryAction}
          </Button>
          <Button variant="plain" size="sm" onClick={(e) => e.stopPropagation()}>
            {ai.row.snooze}
          </Button>
        </div>
      </div>
    </div>
  );
}
