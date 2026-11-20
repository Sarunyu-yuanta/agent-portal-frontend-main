"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { Tag, Button } from "@sarunyu/system-one";
import { SparkleIcon, ArrowLeftIcon, FilePdfIcon } from "@phosphor-icons/react";
import {
  CATEGORY_TAG_VARIANT,
  getCategory,
  getInsightDetail,
} from "@/features/insights/lib/house-view-data";
import { RelatedProductsCard } from "./RelatedProductsCard";
import { PlaybookCardCompact } from "./PlaybookCardCompact";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { findMutualFundInsightByDetailId } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { InsightDetailSkeleton } from "./InsightDetailSkeleton";
import { useT } from "@/i18n/I18nProvider";
import { NotFoundState } from "@/components/ui/empty-state";
import {
  useAnalysts,
  useInsightStrategies,
  useInsightStrategy,
} from "@/features/insights/hooks/use-insights";
import { ROUTES } from "@/lib/routes";

export function InsightDetail({ id }: { id: string }) {
  const { data: strategy, isLoading } = useInsightStrategy(id);
  const { data: allStrategies } = useInsightStrategies();
  const { data: analysts } = useAnalysts();
  // Called before the early return below — a missing strategy must not skip a hook.
  const goBack = useSectionBack();
  const router = useLocalizedRouter();
  const t = useT();
  const d = t.research.detail;

  // Ahead of the `!strategy` branch, not after it as it used to be: an insight
  // that simply has not arrived yet is loading, not missing. While this
  // resource is bundled the distinction is invisible (`isLoading` is never
  // true), but the moment it is fetched the old order would have flashed
  // "ไม่พบบทวิเคราะห์นี้" on every visit before the data landed.
  if (isLoading) {
    return <InsightDetailSkeleton />;
  }

  if (!strategy) {
    return (
      <NotFoundState
        message={d.notFound}
        onBack={() => router.push(ROUTES.insights)}
        backLabel={d.backToInsights}
      />
    );
  }

  const cat = getCategory(strategy);
  const detail = getInsightDetail(strategy);
  // Mutual Fund's own insight catalog (Product Catalog → Mutual Fund →
  // "บทวิเคราะห์ทั้งหมด") tracks a subset of these House View strategies by
  // `detailId`. When the strategy being viewed is one of them, "บทวิเคราะห์
  // อื่นๆ" below must stay scoped to that same subset — a reader who came
  // from the Mutual Fund tab should only ever be offered more Mutual Fund
  // analyses, not the full, unrelated House View catalog. Strategies reached
  // any other way (e.g. from the Insights list, which is the "everything"
  // aggregate) keep seeing every other strategy from the same period, same
  // as before.
  const isMutualFundInsight = findMutualFundInsightByDetailId(strategy.id) !== undefined;
  const related = allStrategies.filter(
    (s) =>
      s.periodLabel === strategy.periodLabel &&
      s.id !== strategy.id &&
      (!isMutualFundInsight || findMutualFundInsightByDetailId(s.id) !== undefined),
  );

  const pdfButton = (
    <div className="bg-primary-action-light flex items-center justify-between gap-4 rounded-2xl border border-border p-6">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <FilePdfIcon size={24} weight="fill" className="text-primary-action shrink-0" />
          <p className="type-subtitle-1 font-bold text-foreground">{d.fullReport}</p>
        </div>
        <p className="text-label whitespace-nowrap text-muted-foreground">{d.fullReportBody}</p>
      </div>
      <Button
        variant="outline"
        size="lg"
        leftIcon={<FilePdfIcon size={18} />}
        className="shrink-0"
        onClick={() => {}}
      >
        {d.viewFullPdf}
      </Button>
    </div>
  );

  const aiSummary = detail.aiSummary && (
    <div
      className="relative overflow-hidden rounded-2xl p-[1.5px] shadow-[0_8px_30px_-8px_rgba(99,102,241,0.35)]"
      style={{
        background: "linear-gradient(135deg, #2b7fff 0%, #8b5cf6 50%, #d946ef 100%)",
      }}
    >
      <div
        className="flex flex-col gap-4 rounded-[calc(1rem-1.5px)] p-6"
        style={{
          background:
            "linear-gradient(135deg, rgba(43,127,255,0.06) 0%, rgba(139,92,246,0.08) 100%), var(--card)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-[0_4px_14px_-2px_rgba(139,92,246,0.6)]"
            style={{ background: "linear-gradient(135deg, #2b7fff, #8b5cf6)" }}
          >
            <SparkleIcon size={18} weight="fill" className="text-white" />
          </div>
          <p className="type-subtitle-1 font-bold text-foreground">{d.aiSummary}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">{d.aiSummaryNote}</p>
          <p className="text-body leading-relaxed text-foreground">{detail.aiSummary}</p>
        </div>
      </div>
    </div>
  );

  const analystsSection = (
    <div className="flex flex-col gap-4">
      <h2 className="type-subtitle-1 font-bold text-foreground">{d.analysedBy}</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-1">
        {analysts.slice(0, 3).map((analyst) => (
          <div key={analyst.id} className="flex min-w-0 items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size headshot, no responsive sizes needed */}
            <img
              src={analyst.photo}
              alt={analyst.name}
              className="h-16 w-16 shrink-0 rounded-lg object-cover"
            />
            <div className="flex min-w-0 flex-col">
              <p className="text-body font-bold text-foreground">{analyst.name}</p>
              <p className="text-label text-muted-foreground">{analyst.title}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="flex flex-col gap-8 lg:grid lg:gap-6"
      style={{ gridTemplateColumns: "1fr 400px" }}
    >
      <div className="flex min-w-0 flex-col gap-6 pb-12 max-lg:mx-auto max-lg:w-full max-lg:max-w-xl">
        {/* Mobile breadcrumb comes from the layout, above this content. */}
        <Button
          variant="plain"
          size="sm"
          leftIcon={<ArrowLeftIcon size={16} />}
          onClick={goBack}
          className="hidden self-start xl:inline-flex"
        >
          {t.common.back}
        </Button>

        <div className="flex flex-col gap-4">
          <Tag
            text={t.research.houseView.category[cat] ?? cat}
            variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"}
            size="small"
          />
          <h1 className="type-h4 sm:type-h3 leading-tight font-bold text-foreground">
            {strategy.name}
          </h1>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <p className="type-subtitle-2 text-muted-foreground">{detail.subtitle}</p>
          <p className="text-body-sm text-muted-foreground sm:shrink-0">{detail.date}</p>
        </div>
        <div className="border-t border-border" />

        {/* PDF button + AI Summary sit inline on mobile/tablet; on desktop they move to the sticky sidebar */}
        <div className="flex flex-col gap-4 lg:hidden">
          {pdfButton}
          {aiSummary}
        </div>

        {detail.sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <h2 className="type-subtitle-1 font-bold text-foreground">{section.heading}</h2>
            <p className="text-body leading-relaxed text-foreground">{section.content}</p>
            {section.image && (
              <div className="overflow-hidden rounded-xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mock chart, intrinsic size varies per chart */}
                <img src={section.image} alt={section.heading} className="h-auto w-full" />
              </div>
            )}
          </div>
        ))}

        {/* Analysts sit inline on mobile/tablet; on desktop they move to the sticky sidebar, after Related Products */}
        <div className="mt-4 border-t border-border lg:hidden" />
        <div className="lg:hidden">{analystsSection}</div>

        {/* Related Products sits before "other analyses" on mobile/tablet; on desktop it's in the sticky sidebar */}
        <div className="mt-4 border-t border-border lg:hidden" />
        <div className="lg:hidden">
          <RelatedProductsCard strategy={strategy} variant="plain" />
        </div>

        {related.length > 0 && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="border-t border-border" />
            <h2 className="type-subtitle-1 mt-2 font-bold text-foreground">
              {d.otherInPeriod(strategy.periodLabel)}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {related.map((s) => (
                <PlaybookCardCompact key={s.id} strategy={s} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="flex flex-col gap-5">
          {pdfButton}
          {aiSummary}
          <div className="mt-3 border-t border-border pt-6">
            <RelatedProductsCard strategy={strategy} variant="plain" />
          </div>
          <div className="mt-3 border-t border-border pt-6">{analystsSection}</div>
        </div>
      </div>
    </div>
  );
}
