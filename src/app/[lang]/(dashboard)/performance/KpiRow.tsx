"use client";

import { Card, Tag } from "@sarunyu/system-one";
import { mockPerformanceData } from "@/lib/mock-data";
import { statusVariant } from "./performance-data";
import { useT } from "@/i18n/I18nProvider";

export function KpiRow() {
  const t = useT();
  const k = t.performance.kpi;
  const metrics = [
    { id: "revenueYtd", label: k.revenueYtd, ...mockPerformanceData.revenueYtd },
    { id: "aumGrowth", label: k.aumGrowth, ...mockPerformanceData.aumGrowth },
    { id: "netNewMoney", label: k.netNewMoney, ...mockPerformanceData.netNewMoney },
    {
      id: "productPenetration",
      label: k.productPenetration,
      ...mockPerformanceData.productPenetration,
    },
  ];
  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[160px_1fr_1fr_1fr_1fr]">
      {/* Grade card — hidden on mobile, shown on desktop */}
      <div
        className="hidden h-full flex-col items-center justify-center gap-2 rounded-2xl p-5 lg:flex"
        style={{ background: "#1e2337" }}
      >
        <p className="text-[48px] leading-none font-bold tracking-tight text-white">B+</p>
        <p
          className="text-meta font-bold tracking-[0.15em] uppercase"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {k.overall}
        </p>
      </div>
      {/* KPI Cards — 2 per row on mobile, each takes 1fr on desktop */}
      <div className="grid grid-cols-2 gap-4 lg:contents">
        {metrics.map((m) => (
          <Card key={m.id} variant="default" className="flex h-full flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <p className="type-caption text-muted-foreground">{m.label}</p>
              <Tag
                text={t.performance.status[m.status] ?? m.status}
                variant={statusVariant(m.status)}
                size="small"
              />
            </div>
            <p className="type-h3 leading-none text-foreground">{m.value}</p>
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary-action h-full rounded-full"
                  style={{ width: `${m.progress}%` }}
                />
              </div>
              <p className="type-caption text-[var(--text-default-disabled)]">
                {k.progressTarget(m.progress, m.target)}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
