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
import { mockClientDetails, mockClients } from "@/lib/mock-data";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords, formatAumThb, formatPlYtdPct } from "@/lib/client-utils";
import { CATEGORY_CONFIG, confidenceColor, type Insight } from "./insight-config";

export function InsightDrawerPanel({ insight }: { insight: Insight }) {
  const { isPrivate } = usePrivacy();
  const maskedName = maskName(insight.clientName, isPrivate);
  const config = CATEGORY_CONFIG[insight.type as keyof typeof CATEGORY_CONFIG];
  const client = mockClients.find((c) => c.id === insight.clientId);
  const detail = client ? mockClientDetails[client.id] : null;

  const tierVariant = client?.tier === "UHNW" ? ("blue" as const) : ("gray" as const);
  const tagVariant = config?.tagVariant ?? "gray";
  const tagText = config?.tagText ?? insight.type;

  const confColor = confidenceColor(insight.confidence);
  const isRisk = insight.type === "Risk Alert";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <Avatar type="text" initials={getInitialsFromWords(maskedName)} size="m" />
          <div className="flex-1 min-w-0">
            <p className="type-subtitle-1 text-foreground leading-tight">{maskedName}</p>
            <div className="flex items-center gap-1.5 mt-1">
              {client && <Tag text={client.tier} variant={tierVariant} size="small" />}
              {client && <Tag text={client.riskProfile} variant="gray" size="small" />}
            </div>
          </div>
          <div className="w-8 shrink-0" />
        </div>
        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <PhoneIcon size={20} />,        label: "Call" },
            { icon: <ChatCircleIcon size={20} />,   label: "Message" },
            { icon: <FileTextIcon size={20} />,     label: "Proposal" },
            { icon: <CalendarPlusIcon size={20} />, label: "Meet" },
          ].map(({ icon, label }) => (
            <button
              key={label}
              onClick={() => {}}
              className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-[var(--bg-default-secondary)] border border-primary-action/20 hover:bg-[var(--bg-brand-light)] hover:border-[var(--bg-brand-primary)] transition-colors cursor-pointer"
            >
              <span className="text-primary-action">{icon}</span>
              <span className="text-meta font-medium text-primary-action leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex flex-col gap-5 px-5 py-5 flex-1 overflow-y-auto bg-[var(--bg-default-secondary)]">
        {/* 1. KPI grid */}
        {client && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total AUM",   value: formatAumThb(client.aum),                sub: null,                                           accent: null },
              { label: "Cash Idle",   value: `${client.cashIdlePct}%`,  sub: client.cashIdlePct > 20 ? "Above 10% target" : null, accent: client.cashIdlePct > 20 ? "text-warning" : "text-success" },
              { label: "YTD P&L",    value: formatPlYtdPct(client.plYtdPct),               sub: null,                                           accent: client.plYtdPct >= 0 ? "text-success" : "text-destructive" },
              { label: "Risk Profile",value: client.riskProfile,         sub: null,                                           accent: null },
            ].map((kpi) => (
              <div key={kpi.label} className="flex flex-col justify-between gap-2 p-3 rounded-xl bg-[var(--bg-default-primary-medium)] border border-[var(--border-default)] min-h-[80px]">
                <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide leading-none">{kpi.label}</p>
                <div className="flex flex-col gap-0.5">
                  <p className={`type-subtitle-1 font-bold leading-tight ${kpi.accent ?? "text-foreground"}`}>{kpi.value}</p>
                  {kpi.sub && <p className={`text-meta font-semibold leading-none ${kpi.accent ?? "text-muted-foreground"}`}>{kpi.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 2. AI Insight */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide">AI Insight</p>
            <div className="inline-flex items-center gap-1 bg-primary-action/10 rounded-full px-1.5 py-0.5">
              <SparkleIcon size={9} className="text-primary-action" weight="fill" />
              <span className="text-micro font-bold text-primary-action">AI</span>
            </div>
            <Tag text={tagText} variant={tagVariant} size="small" />
          </div>
          <div className="bg-[var(--primary-action-light)] border border-[var(--border-brand-primary)] rounded-xl px-3 py-3 flex flex-col gap-3">
            <p className="text-label text-primary-action leading-relaxed">{insight.insight}</p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wide leading-none">Confidence</p>
                <span className="text-body-sm font-bold leading-none" style={{ color: confColor }}>
                  {insight.confidence}%
                </span>
              </div>
              {!isRisk && (
                <div className="flex flex-col gap-0.5 items-end">
                  <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wide leading-none">Revenue Potential</p>
                  <div className="flex items-center gap-1">
                    <CurrencyCircleDollarIcon size={13} weight="fill" className="text-success" />
                    <span className="text-body-sm font-bold text-success leading-none">{insight.revenueImpact}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Portfolio Allocation — individual bars per slice */}
        {detail?.allocationData && (
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide">Asset Allocation</p>
            <div className="bg-[var(--bg-default-primary-medium)] border border-[var(--border-default)] rounded-xl px-3 py-3 flex flex-col gap-3">
              {detail.allocationData.map((slice) => (
                <div key={slice.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-label font-medium text-foreground">{slice.name}</span>
                    <span className="text-label font-bold text-foreground">{slice.value}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[var(--bg-default-secondary)]">
                    <div className="h-full rounded-full" style={{ width: `${slice.value}%`, backgroundColor: slice.fill }} />
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
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
