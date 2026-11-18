"use client";

import { useState } from "react";
import { Card, Chip, Tag, TabGroup } from "@sarunyu/system-one";
import { BrainIcon, SparkleIcon } from "@phosphor-icons/react";
import { mockInsights } from "@/lib/mock-data";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { InsightRow } from "./InsightRow";
import { InsightDrawerPanel } from "./InsightDrawerPanel";
import { LogicRulesSidebar } from "./LogicRulesSidebar";
import type { SortOption, TabId } from "./insight-config";

function KpiBar() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
      {[
        { label: "High Priority Actions", tag: "Urgent",   tagV: "red"    as const, value: "3",       sub: "Requires action today" },
        { label: "Est. Revenue Impact",   tag: "+฿ 9.5M", tagV: "green"  as const, value: "฿ 9.5M",  sub: "Across 8 insights" },
        { label: "Critical Risk Alerts",  tag: "2 New",    tagV: "red"    as const, value: "2",       sub: "Portfolio concentration" },
        { label: "Engagement Drops",      tag: "Watch",    tagV: "yellow" as const, value: "1",       sub: "Avg 14 days silent" },
      ].map((k) => (
        <Card key={k.label} variant="default" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="type-caption text-muted-foreground">{k.label}</p>
            <Tag text={k.tag} variant={k.tagV} size="small" />
          </div>
          <div className="flex flex-col gap-1 mt-auto">
            <p className="type-h3 text-foreground leading-none">{k.value}</p>
            <p className="type-caption text-[var(--text-default-disabled)]">{k.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AiSummaryCard() {
  return (
    <Card variant="default" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SparkleIcon size={16} weight="duotone" className="text-foreground" />
        <p className="type-subtitle-1 text-foreground">Today&apos;s AI Summary</p>
      </div>
      <p className="text-label text-muted-foreground leading-relaxed">
        8 active insights across your book. Focus on{" "}
        <span className="font-semibold text-foreground">Somchai</span> and{" "}
        <span className="font-semibold text-foreground">Nattaporn</span> — highest revenue potential at ฿ 5.6M combined.
      </p>
      <div className="flex flex-col gap-2 pt-1 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">Model updated</span>
          <span className="text-meta font-medium text-foreground">Today, 08:30</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">Avg confidence</span>
          <span className="text-meta font-semibold text-success">83%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">Clients analyzed</span>
          <span className="text-meta font-medium text-foreground">24</span>
        </div>
      </div>
    </Card>
  );
}

function AiModelStats() {
  const stats = [
    { label: "Product Match", count: 3, color: "var(--text-brand-primary)" },
    { label: "Risk Alert", count: 2, color: "var(--text-danger-primary)" },
    { label: "Engagement", count: 2, color: "var(--text-warning-primary)" },
    { label: "Portfolio", count: 1, color: "var(--text-brand-secondary)" },
  ];

  return (
    <Card variant="default" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BrainIcon size={15} className="text-muted-foreground" />
        <p className="type-subtitle-1 text-foreground">Breakdown</p>
      </div>
      <div className="flex flex-col gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-label text-muted-foreground flex-1">{s.label}</span>
            <span className="text-label font-semibold text-foreground tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const TAB_ITEMS = [
  { id: "all", title: "All" },
  { id: "product", title: "Product Match", notification: 4 },
  { id: "risk", title: "Risk Alert", notification: 2 },
  { id: "engagement", title: "Engagement", notification: 1 },
  { id: "portfolio", title: "Portfolio", notification: 1 },
];

const TAB_TYPE_FILTER: Record<Exclude<TabId, "all">, string> = {
  product: "Product Match",
  risk: "Risk Alert",
  engagement: "Engagement",
  portfolio: "Portfolio",
};

export default function AiInsightsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSelectInsight(id: string) {
    setSelectedInsightId(id);
    setDrawerOpen(true);
  }

  const selectedInsight = mockInsights.find((i) => i.id === selectedInsightId);

  const filteredInsights = mockInsights.filter((insight) => {
    if (activeTab === "all") return true;
    return insight.type === TAB_TYPE_FILTER[activeTab];
  });

  const sortedInsights =
    sortBy === "priority"
      ? [...filteredInsights].sort((a, b) => b.confidence - a.confidence)
      : filteredInsights;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* KPI Bar */}
        <KpiBar />

        {/* Body: 2-col */}
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          {/* Main feed */}
          <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4">
            <div className="scrollable-tabs transparent-tabs">
              <TabGroup
                items={TAB_ITEMS}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as TabId)}
                size="md"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="type-caption text-muted-foreground">Sort:</span>
                <Chip
                  label="AI Priority"
                  type="single"
                  size="small"
                  selected={sortBy === "priority"}
                  onClick={() => setSortBy("priority")}
                />
                <Chip
                  label="Most Recent"
                  type="single"
                  size="small"
                  selected={sortBy === "recent"}
                  onClick={() => setSortBy("recent")}
                />
              </div>
              <span className="type-caption text-muted-foreground">
                {sortedInsights.length} insights
              </span>
            </div>

            {/* Insight feed */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden w-full max-w-full">
              {sortedInsights.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="type-body-2 text-muted-foreground">No insights in this category</p>
                </div>
              ) : (
                sortedInsights.map((insight, i) => (
                  <InsightRow
                    key={insight.id}
                    insight={insight}
                    isLast={i === sortedInsights.length - 1}
                    isSelected={selectedInsightId === insight.id}
                    onSelect={handleSelectInsight}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-72 lg:shrink-0 flex flex-col gap-4">
            <AiSummaryCard />
            <AiModelStats />
            <LogicRulesSidebar />
          </div>
        </div>
      </div>

      {/* Client Profile Drawer */}
      <DetailDrawer
        size="narrow"
        className="overflow-y-auto"
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelectedInsightId(null);
        }}
      >
        {selectedInsight && <InsightDrawerPanel insight={selectedInsight} />}
      </DetailDrawer>
    </>
  );
}
