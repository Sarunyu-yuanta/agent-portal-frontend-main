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
import { mockPerformanceData } from "@/lib/mock-data";
import { PRODUCT_COLORS } from "./performance-data";

export function IncomeTracker() {
  const total = mockPerformanceData.incomeByProduct.reduce((s, d) => s + d.revenue, 0);
  const maxRevenue = Math.max(...mockPerformanceData.incomeByProduct.map((d) => d.revenue));

  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CurrencyCircleDollarIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">Income Tracker</p>
        </div>

        {/* Hero commission */}
        <div className="flex flex-col gap-1.5 pb-4 border-b border-border">
          <p className="type-caption text-muted-foreground">Est. Commission (YTD)</p>
          <div className="flex items-baseline gap-2.5">
            <p className="type-h3 text-foreground leading-none">฿{total.toFixed(1)}M</p>
            <span className="text-meta text-muted-foreground">+฿2.4M vs last Q</span>
          </div>
        </div>

        {/* Revenue by product — horizontal bars */}
        <div className="flex flex-col gap-1.5">
          <p className="text-meta font-semibold text-muted-foreground">Revenue by Product Type</p>
          <div className="flex flex-col gap-2.5 mt-1">
            {mockPerformanceData.incomeByProduct.map((d) => (
              <div key={d.product} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PRODUCT_COLORS[d.product] }} />
                    <span className="text-label text-foreground">{d.product}</span>
                  </div>
                  <span className="text-label font-semibold text-foreground tabular-nums">฿{d.revenue}M</span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(d.revenue / maxRevenue) * 100}%`, background: PRODUCT_COLORS[d.product] }}
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
  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <ChartBarIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">Pipeline Coverage</p>
        </div>

        <div className="flex justify-center py-2">
          <CircleProgress size="lg" value={90} />
        </div>

        <div className="flex flex-col gap-2 p-3.5 rounded-xl border border-border bg-muted/30">
          <div className="flex items-start gap-2">
            <SparkleIcon size={13} weight="fill" className="text-primary-action shrink-0 mt-0.5" />
            <p className="text-label text-foreground leading-relaxed">
              Your pipeline can cover <span className="font-semibold">90% of your revenue gap</span> if executed. Focus on closing the 2 deals in Negotiation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Deals in Pipeline", value: "8" },
            { label: "Weighted Value",   value: "฿8.2M" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5 p-3 rounded-xl bg-muted">
              <p className="text-meta font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <p className="text-title font-semibold text-foreground leading-none">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function CrossSellDiagnostics() {
  return (
    <Card variant="default">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ArrowsLeftRightIcon size={16} className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">Cross-Sell Diagnostics</p>
        </div>

        <div className="flex flex-col divide-y divide-border">
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-body-sm font-medium text-foreground">Single Product Clients</p>
              <p className="type-caption text-muted-foreground mt-0.5">High flight risk</p>
            </div>
            <p className="text-[24px] font-semibold text-destructive leading-none">42%</p>
          </div>
          <div className="flex items-center justify-between gap-4 py-3.5">
            <div>
              <p className="text-body-sm font-medium text-foreground">Multi-Product Clients (3+)</p>
              <p className="type-caption text-muted-foreground mt-0.5">Highly retained</p>
            </div>
            <p className="text-[24px] font-semibold text-success leading-none">18%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <WarningCircleIcon size={12} weight="fill" className="text-[var(--text-warning-primary)] shrink-0" />
          <p className="text-meta text-muted-foreground">Over-reliance on Equities (62% of book).</p>
        </div>
      </div>
    </Card>
  );
}

export function ClientEngagement() {
  return (
    <Card variant="default" className="h-full">
      <div className="flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <UsersThreeIcon size={16} className="text-muted-foreground" />
            <p className="type-subtitle-1 text-foreground">Client Engagement</p>
          </div>
          <Tag text="2 At Risk" variant="red" size="small" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted">
            <p className="type-caption text-muted-foreground">Active</p>
            <div className="flex items-baseline gap-1">
              <p className="text-[28px] font-semibold text-foreground leading-none">6</p>
              <p className="type-caption text-muted-foreground">/ 8</p>
            </div>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted">
            <p className="type-caption text-muted-foreground">Dormant &gt;30D</p>
            <p className="text-[28px] font-semibold text-foreground leading-none">2</p>
          </div>
        </div>

        {/* Segmented bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <div className="rounded-full bg-[var(--bg-success-primary)]" style={{ flex: 6 }} />
            <div className="rounded-full bg-[var(--bg-danger-primary)]" style={{ flex: 2 }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--bg-success-primary)] shrink-0" />
              <span className="type-caption text-muted-foreground">Active 75%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--bg-danger-primary)] shrink-0" />
              <span className="type-caption text-muted-foreground">Dormant 25%</span>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <Button variant="outline" size="sm" leftIcon={<CalendarCheckIcon size={13} />} className="w-full justify-center">
          View Dormant Clients
        </Button>
      </div>
    </Card>
  );
}

export function OutcomeSimulator() {
  const [deals, setDeals] = useState(0);
  const projected = Math.min(81 + deals * 2, 100);
  const commission = (24.2 + deals * 0.85).toFixed(1);

  return (
    <Card variant="default">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <LightningIcon size={15} weight="fill" className="text-muted-foreground" />
          <p className="type-subtitle-1 text-foreground">Outcome Simulator</p>
        </div>
        <p className="text-label text-muted-foreground -mt-2">Adjust closed deals to see impact on Q2 target.</p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label font-medium text-foreground">Deals Closed from Pipeline</p>
            <span className="text-body-sm font-semibold text-foreground tabular-nums">
              {deals} {deals === 1 ? "deal" : "deals"}
            </span>
          </div>
          <div className="px-3">
            <Slider value={deals} onChange={setDeals} min={0} max={10} showSteps size="lg" />
          </div>
          <div className="flex items-center justify-between px-3 text-meta text-muted-foreground">
            <span>0</span><span>All 10</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted">
            <p className="type-caption text-muted-foreground">Projected Target %</p>
            <p className="text-[24px] font-semibold text-foreground leading-none">{projected}%</p>
          </div>
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-muted">
            <p className="type-caption text-muted-foreground">Est. Total Comm.</p>
            <p className="text-[24px] font-semibold text-foreground leading-none">฿{commission}M</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
