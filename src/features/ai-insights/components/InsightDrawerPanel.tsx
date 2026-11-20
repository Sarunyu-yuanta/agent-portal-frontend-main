"use client";

import { Avatar, Button, Tag } from "@sarunyu/system-one";
import {
  CalendarPlusIcon,
  ChatCircleIcon,
  CurrencyCircleDollarIcon,
  FileTextIcon,
  PhoneIcon,
  SparkleIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { mockClientDetails, mockClients } from "@/mocks/mock-data";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords, formatAumThb, formatPlYtdPct } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import { CATEGORY_CONFIG, confidenceColor } from "@/features/ai-insights/lib/insight-config";
import type { AiInsight } from "@/types/sales";

export function InsightDrawerPanel({ insight }: { insight: AiInsight }) {
  const { isPrivate } = usePrivacy();
  const t = useT();
  const ai = t.research.aiInsights;
  const d = ai.drawer;
  const maskedName = maskName(insight.clientName, isPrivate);
  const config = CATEGORY_CONFIG[insight.type as keyof typeof CATEGORY_CONFIG];
  const client = mockClients.find((c) => c.id === insight.clientId);
  const detail = client ? mockClientDetails[client.id] : null;

  const tierVariant = client?.tier === "UHNW" ? ("blue" as const) : ("gray" as const);
  const tagVariant = config?.tagVariant ?? "gray";
  const tagText = ai.category[insight.type] ?? insight.type;

  const confColor = confidenceColor(insight.confidence);
  const isRisk = insight.type === "Risk Alert";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-default)] px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Avatar type="text" initials={getInitialsFromWords(maskedName)} size="m" />
          <div className="min-w-0 flex-1">
            <p className="type-subtitle-1 leading-tight text-foreground">{maskedName}</p>
            <div className="mt-1 flex items-center gap-1.5">
              {client && <Tag text={client.tier} variant={tierVariant} size="small" />}
              {client && <Tag text={client.riskProfile} variant="gray" size="small" />}
            </div>
          </div>
          <div className="w-8 shrink-0" />
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <PhoneIcon size={20} />, label: d.actions.call },
            { icon: <ChatCircleIcon size={20} />, label: d.actions.message },
            { icon: <FileTextIcon size={20} />, label: d.actions.proposal },
            { icon: <CalendarPlusIcon size={20} />, label: d.actions.meet },
          ].map(({ icon, label }) => (
            <button
              key={label}
              onClick={() => {}}
              className="border-primary-action/20 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-[var(--bg-default-secondary)] px-2 py-2.5 transition-colors hover:border-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-light)]"
            >
              <span className="text-primary-action">{icon}</span>
              <span className="text-primary-action text-meta leading-none font-medium">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-[var(--bg-default-secondary)] px-5 py-5">
        {/* 1. KPI grid */}
        {client && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: d.totalAum, value: formatAumThb(client.aum), sub: null, accent: null },
              {
                label: d.cashIdle,
                value: `${client.cashIdlePct}%`,
                sub: client.cashIdlePct > 20 ? d.aboveTarget : null,
                accent: client.cashIdlePct > 20 ? "text-warning" : "text-success",
              },
              {
                label: d.ytdPl,
                value: formatPlYtdPct(client.plYtdPct),
                sub: null,
                accent: client.plYtdPct >= 0 ? "text-success" : "text-destructive",
              },
              { label: d.riskProfile, value: client.riskProfile, sub: null, accent: null },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="flex min-h-[80px] flex-col justify-between gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default-primary-medium)] p-3"
              >
                <p className="text-meta leading-none font-semibold tracking-wide text-muted-foreground uppercase">
                  {kpi.label}
                </p>
                <div className="flex flex-col gap-0.5">
                  <p
                    className={`type-subtitle-1 leading-tight font-bold ${kpi.accent ?? "text-foreground"}`}
                  >
                    {kpi.value}
                  </p>
                  {kpi.sub && (
                    <p
                      className={`text-meta leading-none font-semibold ${kpi.accent ?? "text-muted-foreground"}`}
                    >
                      {kpi.sub}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. AI AiInsight */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
              {d.aiInsight}
            </p>
            <div className="bg-primary-action/10 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5">
              <SparkleIcon size={9} className="text-primary-action" weight="fill" />
              <span className="text-primary-action text-micro font-bold">AI</span>
            </div>
            <Tag text={tagText} variant={tagVariant} size="small" />
          </div>
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-brand-primary)] bg-[var(--primary-action-light)] px-3 py-3">
            <p className="text-primary-action text-label leading-relaxed">{insight.insight}</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-micro leading-none font-semibold tracking-wide text-muted-foreground uppercase">
                  {d.confidence}
                </p>
                <span className="text-body-sm leading-none font-bold" style={{ color: confColor }}>
                  {insight.confidence}%
                </span>
              </div>
              {!isRisk && (
                <div className="flex flex-col items-end gap-0.5">
                  <p className="text-micro leading-none font-semibold tracking-wide text-muted-foreground uppercase">
                    {d.revenuePotential}
                  </p>
                  <div className="flex items-center gap-1">
                    <CurrencyCircleDollarIcon size={13} weight="fill" className="text-success" />
                    <span className="text-success text-body-sm leading-none font-bold">
                      {insight.revenueImpact}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Portfolio Allocation — individual bars per slice */}
        {detail?.allocationData && (
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
              {d.assetAllocation}
            </p>
            <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default-primary-medium)] px-3 py-3">
              {detail.allocationData.map((slice) => (
                <div key={slice.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-label font-medium text-foreground">{slice.name}</span>
                    <span className="text-label font-bold text-foreground">{slice.value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-default-secondary)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${slice.value}%`, backgroundColor: slice.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-[var(--border-default)] px-5 py-4">
        <Button variant="outline" size="lg" className="w-full" leftIcon={<UserIcon size={16} />}>
          {d.viewProfile}
        </Button>
      </div>
    </div>
  );
}
