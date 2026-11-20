"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { setQueryState, withQuery } from "@/lib/query-state";
import { navRead, navWrite } from "@/lib/nav-session";
import { INSIGHTS_FILTER_KEY } from "@/features/shell/lib/nav-memory";
import { useInsightStrategies, useResearch } from "@/features/catalog/hooks/use-catalog";
import { useHasLoaded } from "@/hooks/use-api";
import { TabsSkeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/fade-in";
import {
  StrategyPlaybooksSkeleton,
  AIRecommendCardSkeleton,
} from "@/features/insights/components/InsightsSkeletons";
import {
  StrategyPlaybooks,
  normalizeAssetFilter,
  type AssetClassFilter,
} from "@/features/insights/components/StrategyPlaybooks";
import { AIRecommendCard } from "@/features/insights/components/AIRecommendCard";
import { Research } from "@/features/insights/components/Research";
import { useT } from "@/i18n/I18nProvider";

/** The Insights tab's "playbooks + sidebar" two-column split. */
function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-8 lg:grid lg:gap-6"
      style={{ gridTemplateColumns: "1fr 300px", alignItems: "start" }}
    >
      {children}
    </div>
  );
}

/** Sticky wrapper the sidebar and its skeleton share. */
function SidebarColumn({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-6 mx-auto flex w-full max-w-sm flex-col gap-5 lg:mx-0 lg:max-w-none">
      {children}
    </div>
  );
}

export function InsightsView() {
  return (
    <Suspense fallback={null}>
      <InsightsPageInner />
    </Suspense>
  );
}

/**
 * The filter chip is session memory, not a URL param.
 *
 * Reading an article and coming back keeps it (the component remounts and reads
 * this), but a reload drops it — `nav-session` clears every `nav:` key on a
 * fresh document load, which is the rule the user asked for: only Client 360's
 * column filter is remembered for good. The trade-off they accepted is that a
 * shared link can't carry a filter.
 */
const FILTER_KEY = INSIGHTS_FILTER_KEY;

function InsightsPageInner() {
  const searchParams = useSearchParams();
  const t = useT();
  // First load: the tab strip is bars until the open tab's data arrives.
  // After that the tabs stay live and each tab's body skeletons on its own.
  const { isLoading: strategiesLoading } = useInsightStrategies();
  const { isLoading: researchLoading } = useResearch();

  // The tab stays in the URL — it's a destination, not a refinement.
  const activeTab = searchParams.get("tab") === "research" ? "research" : "insights";

  // Seeded from storage rather than held there: on a fresh load it has just
  // been cleared, so the server and the client both start at "All" and
  // hydration matches.
  const [filter, setFilterState] = useState<AssetClassFilter>(() =>
    normalizeAssetFilter(navRead(FILTER_KEY)),
  );
  const setFilter = useCallback((next: AssetClassFilter) => {
    setFilterState(next);
    navWrite(FILTER_KEY, next);
  }, []);

  // `replace`, not `push` — refining a list shouldn't fill up history with
  // entries the user has to click through to leave the page.
  const hasLoaded = useHasLoaded(activeTab === "insights" ? strategiesLoading : researchLoading);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) =>
      setQueryState(withQuery("/insights", searchParams, updates), "replace"),
    [searchParams],
  );

  return (
    <div className="flex flex-col gap-6">
      {!hasLoaded ? (
        <TabsSkeleton count={2} />
      ) : (
        <div className="transparent-tabs scrollable-tabs -mx-4 pl-4 xl:-mx-6 xl:pl-6">
          <TabGroup
            items={[
              { id: "insights", title: t.research.tabs.houseView },
              { id: "research", title: t.research.tabs.research },
            ]}
            activeId={activeTab}
            onChange={(id) => updateQuery({ tab: id === "insights" ? null : id })}
            size="md"
          />
        </div>
      )}

      <FadeIn key={activeTab}>
        {/* Research renders its own skeleton; this one is House View's. */}
        {activeTab === "insights" && strategiesLoading ? (
          <InsightsLayout>
            <StrategyPlaybooksSkeleton />
            <SidebarColumn>
              <AIRecommendCardSkeleton />
            </SidebarColumn>
          </InsightsLayout>
        ) : activeTab === "insights" ? (
          <InsightsLayout>
            <StrategyPlaybooks filter={filter} onFilterChange={setFilter} />
            <SidebarColumn>
              <AIRecommendCard />
            </SidebarColumn>
          </InsightsLayout>
        ) : (
          <Research />
        )}
      </FadeIn>
    </div>
  );
}
