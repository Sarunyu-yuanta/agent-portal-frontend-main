"use client";

import { useState } from "react";
import { Card, Chip, Tag, TabGroup } from "@sarunyu/system-one";
import { BrainIcon, SparkleIcon } from "@phosphor-icons/react";
import { useAiInsights } from "@/features/ai-insights/hooks/use-ai-insights";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { InsightRow } from "@/features/ai-insights/components/InsightRow";
import { InsightDrawerPanel } from "@/features/ai-insights/components/InsightDrawerPanel";
import { LogicRulesSidebar } from "@/features/ai-insights/components/LogicRulesSidebar";
import type { SortOption, TabId } from "@/features/ai-insights/lib/insight-config";
import { useT } from "@/i18n/I18nProvider";

function KpiBar() {
  const k = useT().research.aiInsights.kpi;
  return (
    <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
      {[
        {
          label: k.highPriority,
          tag: k.highPriorityTag,
          tagV: "red" as const,
          value: "3",
          sub: k.highPrioritySub,
        },
        {
          label: k.revenueImpact,
          tag: "+฿ 9.5M",
          tagV: "green" as const,
          value: "฿ 9.5M",
          sub: k.revenueImpactSub(8),
        },
        {
          label: k.riskAlerts,
          tag: k.riskAlertsTag(2),
          tagV: "red" as const,
          value: "2",
          sub: k.riskAlertsSub,
        },
        {
          label: k.engagementDrops,
          tag: k.engagementDropsTag,
          tagV: "yellow" as const,
          value: "1",
          sub: k.engagementDropsSub(14),
        },
      ].map((k) => (
        <Card key={k.label} variant="default" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="type-caption text-muted-foreground">{k.label}</p>
            <Tag text={k.tag} variant={k.tagV} size="small" />
          </div>
          <div className="mt-auto flex flex-col gap-1">
            <p className="type-h3 leading-none text-foreground">{k.value}</p>
            <p className="type-caption text-[var(--text-default-disabled)]">{k.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AiSummaryCard() {
  const s = useT().research.aiInsights.summary;
  return (
    <Card variant="default" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <SparkleIcon size={16} weight="duotone" className="text-foreground" />
        <p className="type-subtitle-1 text-foreground">{s.title}</p>
      </div>
      <p className="text-label leading-relaxed text-muted-foreground">
        8 active insights across your book. Focus on{" "}
        <span className="font-semibold text-foreground">Somchai</span> and{" "}
        <span className="font-semibold text-foreground">Nattaporn</span> — highest revenue potential
        at ฿ 5.6M combined.
      </p>
      <div className="flex flex-col gap-2 border-t border-border pt-1">
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">{s.modelUpdated}</span>
          <span className="text-meta font-medium text-foreground">{s.todayAt("08:30")}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">{s.avgConfidence}</span>
          <span className="text-success text-meta font-semibold">83%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-meta text-muted-foreground">{s.clientsAnalyzed}</span>
          <span className="text-meta font-medium text-foreground">24</span>
        </div>
      </div>
    </Card>
  );
}

function AiModelStats() {
  const ai = useT().research.aiInsights;
  const stats = [
    { label: ai.category["Product Match"], count: 3, color: "var(--text-brand-primary)" },
    { label: ai.category["Risk Alert"], count: 2, color: "var(--text-danger-primary)" },
    { label: ai.category["Engagement"], count: 2, color: "var(--text-warning-primary)" },
    { label: ai.category["Portfolio"], count: 1, color: "var(--text-brand-secondary)" },
  ];

  return (
    <Card variant="default" className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <BrainIcon size={15} className="text-muted-foreground" />
        <p className="type-subtitle-1 text-foreground">{ai.breakdown}</p>
      </div>
      <div className="flex flex-col gap-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2.5">
            <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="flex-1 text-label text-muted-foreground">{s.label}</span>
            <span className="text-label font-semibold text-foreground tabular-nums">{s.count}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Tab titles come from the dictionary at render. */
const TAB_ITEMS: { id: TabId; notification?: number }[] = [
  { id: "all" },
  { id: "product", notification: 4 },
  { id: "risk", notification: 2 },
  { id: "engagement", notification: 1 },
  { id: "portfolio", notification: 1 },
];

const TAB_TYPE_FILTER: Record<Exclude<TabId, "all">, string> = {
  product: "Product Match",
  risk: "Risk Alert",
  engagement: "Engagement",
  portfolio: "Portfolio",
};

export function AiInsightsView() {
  const t = useT();
  const ai = t.research.aiInsights;
  const tabItems = TAB_ITEMS.map((tab) => ({
    ...tab,
    title: tab.id === "all" ? ai.tabs.all : ai.category[TAB_TYPE_FILTER[tab.id]],
  }));
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [sortBy, setSortBy] = useState<SortOption>("priority");
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: insights } = useAiInsights();

  function handleSelectInsight(id: string) {
    setSelectedInsightId(id);
    setDrawerOpen(true);
  }

  const selectedInsight = insights.find((i) => i.id === selectedInsightId);

  const filteredInsights = insights.filter((insight) => {
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Main feed */}
          <div className="flex w-full min-w-0 flex-col gap-4 lg:flex-1">
            <div className="scrollable-tabs transparent-tabs">
              <TabGroup
                items={tabItems}
                activeId={activeTab}
                onChange={(id) => setActiveTab(id as TabId)}
                size="md"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="type-caption text-muted-foreground">{ai.sort}</span>
                <Chip
                  label={ai.sortPriority}
                  type="single"
                  size="small"
                  selected={sortBy === "priority"}
                  onClick={() => setSortBy("priority")}
                />
                <Chip
                  label={ai.sortRecent}
                  type="single"
                  size="small"
                  selected={sortBy === "recent"}
                  onClick={() => setSortBy("recent")}
                />
              </div>
              <span className="type-caption text-muted-foreground">
                {ai.count(sortedInsights.length)}
              </span>
            </div>

            {/* Insight feed */}
            <div className="w-full max-w-full overflow-hidden rounded-2xl border border-border bg-card">
              {sortedInsights.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <p className="type-body-2 text-muted-foreground">{ai.empty}</p>
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
          <div className="flex w-full flex-col gap-4 lg:w-72 lg:shrink-0">
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
