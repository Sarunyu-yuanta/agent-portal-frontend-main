"use client";

import { Card, Tag } from "@sarunyu/system-one";
import { mockPerformanceData } from "@/lib/mock-data";
import { statusVariant } from "./performance-data";

export function KpiRow() {
  const metrics = [
    { label: "YTD Revenue",         ...mockPerformanceData.revenueYtd },
    { label: "AUM Growth",          ...mockPerformanceData.aumGrowth },
    { label: "Net New Money",       ...mockPerformanceData.netNewMoney },
    { label: "Product Penetration", ...mockPerformanceData.productPenetration },
  ];
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[160px_1fr_1fr_1fr_1fr]">
      {/* Grade card — hidden on mobile, shown on desktop */}
      <div className="hidden lg:flex rounded-2xl p-5 flex-col items-center justify-center gap-2 h-full" style={{ background: "#1e2337" }}>
        <p className="text-[48px] font-bold text-white leading-none tracking-tight">B+</p>
        <p className="text-meta font-bold uppercase tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.35)" }}>Overall</p>
      </div>
      {/* KPI Cards — 2 per row on mobile, each takes 1fr on desktop */}
      <div className="grid grid-cols-2 gap-4 lg:contents">
        {metrics.map((m) => (
          <Card key={m.label} variant="default" className="flex flex-col gap-3 h-full">
            <div className="flex items-start justify-between gap-2">
              <p className="type-caption text-muted-foreground">{m.label}</p>
              <Tag text={m.status} variant={statusVariant(m.status)} size="small" />
            </div>
            <p className="type-h3 text-foreground leading-none">{m.value}</p>
            <div className="flex flex-col gap-1">
              <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary-action" style={{ width: `${m.progress}%` }} />
              </div>
              <p className="type-caption text-[var(--text-default-disabled)]">{m.progress}% · Target {m.target}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
