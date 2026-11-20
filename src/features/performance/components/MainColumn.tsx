"use client";

import { useState } from "react";
import { Card, Tag, Button, CircleProgress, Slider } from "@sarunyu/system-one";
import {
  SparkleIcon,
  ChartBarIcon,
  CurrencyCircleDollarIcon,
  WarningCircleIcon,
  CalendarCheckIcon,
  UsersThreeIcon,
  ArrowsLeftRightIcon,
  LightningIcon,
} from "@phosphor-icons/react";
import { mockPerformanceData } from "@/mocks/mock-data";
import { PRODUCT_COLORS } from "@/features/performance/lib/performance-data";
import { useT } from "@/i18n/I18nProvider";

export function IncomeTracker() {
  const t = useT();
  const total = mockPerformanceData.incomeByProduct.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(...mockPerformanceData.incomeByProduct.map((d) => d.revenue));

  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CurrencyCircleDollarIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">{t.performance.income.title}</p>
        </div>

        {/* Hero commission */}
        <div className="flex flex-col gap-1.5 border-b border-border pb-4">
          <p className="type-caption text-muted-foreground">{t.performance.income.estCommission}</p>
          <div className="flex items-baseline gap-2.5">
            <p className="type-h3 leading-none text-foreground">฿{total.toFixed(1)}M</p>
            <span className="text-meta text-muted-foreground">
              {t.performance.income.vsLastQuarter("+฿2.4M")}
            </span>
          </div>
        </div>

        {/* Revenue by product — horizontal bars */}
        <div className="flex flex-col gap-1.5">
          <p className="text-meta font-semibold text-muted-foreground">
            {t.performance.income.byProduct}
          </p>
          <div className="mt-1 flex flex-col gap-2.5">
            {mockPerformanceData.incomeByProduct.map((d) => (
              <div key={d.product} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: PRODUCT_COLORS[d.product] }}
                    />
                    <span className="text-label text-foreground">{d.product}</span>
                  </div>
                  <span className="text-label font-semibold text-foreground tabular-nums">
                    ฿{d.revenue}M
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(d.revenue / maxRevenue) * 100}%`,
                      background: PRODUCT_COLORS[d.product],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PipelineCoverage() {
  const t = useT();
  const c = t.performance.coverage;
  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <ChartBarIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">{c.title}</p>
        </div>

        <div className="flex justify-center py-2">
          <CircleProgress size="lg" value={90} />
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-3.5">
          <div className="flex items-start gap-2">
            <SparkleIcon size={13} weight="fill" className="text-primary-action mt-0.5 shrink-0" />
            <p className="text-label leading-relaxed text-foreground">
              {c.insightBefore} <span className="font-semibold">{c.insightEmphasis(90)}</span>{" "}
              {c.insightAfter(2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: c.dealsInPipeline, value: "8" },
            { label: c.weightedValue, value: "฿8.2M" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 rounded-xl bg-muted p-3">
              <p className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
                {s.label}
              </p>
              <p className="text-title leading-none font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function CrossSellDiagnostics() {
  const t = useT();
  const x = t.performance.crossSell;
  return (
    <Card variant="default">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ArrowsLeftRightIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">{x.title}</p>
        </div>

        <div className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-body-sm font-medium text-foreground">{x.singleProduct}</p>
              <p className="type-caption mt-0.5 text-muted-foreground">{x.singleProductSub}</p>
            </div>
            <p className="text-[24px] leading-none font-semibold text-destructive">42%</p>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-body-sm font-medium text-foreground">{x.multiProduct}</p>
              <p className="type-caption mt-0.5 text-muted-foreground">{x.multiProductSub}</p>
            </div>
            <p className="text-success text-[24px] leading-none font-semibold">18%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <WarningCircleIcon
            size={12}
            weight="fill"
            className="shrink-0 text-[var(--text-warning-primary)]"
          />
          <p className="text-meta text-muted-foreground">{x.overReliance(x.equities, "62%")}</p>
        </div>
      </div>
    </Card>
  );
}

export function ClientEngagement() {
  const t = useT();
  const e = t.performance.engagement;
  return (
    <Card variant="default" className="h-full">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UsersThreeIcon size={16} className="text-muted-foreground" />
            <p className="type-subtitle-1 text-foreground">{e.title}</p>
          </div>
          <Tag text={e.atRisk(2)} variant="red" size="small" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
            <p className="type-caption text-muted-foreground">{e.active}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-[28px] leading-none font-semibold text-foreground">6</p>
              <p className="type-caption text-muted-foreground">/ 8</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
            <p className="type-caption text-muted-foreground">{e.dormant}</p>
            <p className="text-[28px] leading-none font-semibold text-foreground">2</p>
          </div>
        </div>

        {/* Segmented bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            <div className="rounded-full bg-[var(--bg-success-primary)]" style={{ flex: 6 }} />
            <div className="rounded-full bg-[var(--bg-danger-primary)]" style={{ flex: 2 }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bg-success-primary)]" />
              <span className="type-caption text-muted-foreground">{e.activePct(75)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--bg-danger-primary)]" />
              <span className="type-caption text-muted-foreground">{e.dormantPct(25)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          leftIcon={<CalendarCheckIcon size={13} />}
          className="w-full justify-center"
        >
          {e.viewDormant}
        </Button>
      </div>
    </Card>
  );
}

export function OutcomeSimulator() {
  const t = useT();
  const s = t.performance.simulator;
  const [deals, setDeals] = useState(0);
  const projected = Math.min(81 + deals * 2, 100);
  const commission = (24.2 + deals * 0.85).toFixed(1);

  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <LightningIcon size={15} weight="fill" className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">{s.title}</p>
        </div>
        <p className="-mt-2 text-label text-muted-foreground">{s.subtitle}</p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label font-medium text-foreground">{s.dealsClosed}</p>
            <span className="text-body-sm font-semibold text-foreground tabular-nums">
              {s.deals(deals)}
            </span>
          </div>
          <div className="px-3">
            <Slider value={deals} onChange={setDeals} min={0} max={10} showSteps size="lg" />
          </div>
          <div className="flex items-center justify-between px-3 text-meta text-muted-foreground">
            <span>0</span>
            <span>{s.all(10)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
            <p className="type-caption text-muted-foreground">{s.projectedTarget}</p>
            <p className="text-[24px] leading-none font-semibold text-foreground">{projected}%</p>
          </div>
          <div className="flex flex-col gap-1 rounded-xl bg-muted p-4">
            <p className="type-caption text-muted-foreground">{s.estTotalCommission}</p>
            <p className="text-[24px] leading-none font-semibold text-foreground">฿{commission}M</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
