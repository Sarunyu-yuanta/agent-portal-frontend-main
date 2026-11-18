"use client";

import Link from "next/link";
import { Tag, Button } from "@sarunyu/system-one";
import { SparkleIcon, ArrowLeftIcon, FilePdfIcon } from "@phosphor-icons/react";
import { mockHouseViewStrategies, mockAnalysts } from "@/lib/mock-data";
import {
  CATEGORY_TAG_VARIANT,
  getCategory,
  getInsightDetail,
} from "../house-view-data";
import { RelatedProductsCard } from "../RelatedProductsCard";
import { PlaybookCardCompact } from "../PlaybookCardCompact";
import { useSectionBack } from "@/hooks/use-section-back";
import { useInsightStrategy } from "@/hooks/use-catalog";
import { findMutualFundInsightByDetailId } from "../../client/[id]/mutual-fund-data";
import { InsightDetailSkeleton } from "./InsightDetailSkeleton";

export function InsightDetail({ id }: { id: string }) {
  const { data: strategy, isLoading } = useInsightStrategy(id);
  // Called before the early return below — a missing strategy must not skip a hook.
  const goBack = useSectionBack();

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
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="type-subtitle-1 text-foreground">ไม่พบบทวิเคราะห์นี้</p>
        <Link
          href="/insights"
          className="text-body-sm text-primary-action hover:underline"
        >
          กลับไปหน้า Insights
        </Link>
      </div>
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
  const related = mockHouseViewStrategies.filter(
    (s) =>
      s.periodLabel === strategy.periodLabel &&
      s.id !== strategy.id &&
      (!isMutualFundInsight || findMutualFundInsightByDetailId(s.id) !== undefined),
  );

  const pdfButton = (
    <div className="rounded-2xl border border-border bg-primary-action-light p-6 flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <FilePdfIcon
            size={24}
            weight="fill"
            className="text-primary-action shrink-0"
          />
          <p className="type-subtitle-1 font-bold text-foreground">
            รายงานฉบับเต็ม
          </p>
        </div>
        <p className="text-label text-muted-foreground whitespace-nowrap">
          อ่านฉบับเต็มในไฟล์ PDF
        </p>
      </div>
      <Button
        variant="outline"
        size="lg"
        leftIcon={<FilePdfIcon size={18} />}
        className="shrink-0"
        onClick={() => {}}
      >
        View full PDF
      </Button>
    </div>
  );

  const aiSummary = detail.aiSummary && (
    <div
      className="relative rounded-2xl p-[1.5px] overflow-hidden shadow-[0_8px_30px_-8px_rgba(99,102,241,0.35)]"
      style={{
        background:
          "linear-gradient(135deg, #2b7fff 0%, #8b5cf6 50%, #d946ef 100%)",
      }}
    >
      <div
        className="rounded-[calc(1rem-1.5px)] p-6 flex flex-col gap-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(43,127,255,0.06) 0%, rgba(139,92,246,0.08) 100%), var(--card)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center size-9 rounded-xl shrink-0 shadow-[0_4px_14px_-2px_rgba(139,92,246,0.6)]"
            style={{ background: "linear-gradient(135deg, #2b7fff, #8b5cf6)" }}
          >
            <SparkleIcon size={18} weight="fill" className="text-white" />
          </div>
          <p className="type-subtitle-1 font-bold text-foreground">
            AI Summary
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-label text-muted-foreground">
            บทสรุปจาก AI อ้างอิงโดยบทวิเคราะห์
          </p>
          <p className="text-body text-foreground leading-relaxed">
            {detail.aiSummary}
          </p>
        </div>
      </div>
    </div>
  );

  const analystsSection = (
    <div className="flex flex-col gap-4">
      <h2 className="type-subtitle-1 font-bold text-foreground">
        บทวิเคราะห์โดย
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {mockAnalysts.slice(0, 3).map((analyst) => (
          <div key={analyst.id} className="flex items-center gap-3 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size headshot, no responsive sizes needed */}
            <img
              src={analyst.photo}
              alt={analyst.name}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <p className="text-body font-bold text-foreground">
                {analyst.name}
              </p>
              <p className="text-label text-muted-foreground">
                {analyst.title}
              </p>
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
      <div className="flex flex-col gap-6 pb-12 min-w-0 max-lg:max-w-xl max-lg:mx-auto max-lg:w-full">
        {/* Mobile breadcrumb comes from the layout, above this content. */}
        <Button
          variant="plain"
          size="sm"
          leftIcon={<ArrowLeftIcon size={16} />}
          onClick={goBack}
          className="self-start hidden xl:inline-flex"
        >
          กลับ
        </Button>

        <div className="flex flex-col gap-4">
          <Tag
            text={cat}
            variant={CATEGORY_TAG_VARIANT[cat] ?? "gray"}
            size="small"
          />
          <h1 className="type-h4 sm:type-h3 font-bold text-foreground leading-tight">
            {strategy.name}
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
          <p className="type-subtitle-2 text-muted-foreground">
            {detail.subtitle}
          </p>
          <p className="text-body-sm text-muted-foreground sm:shrink-0">
            {detail.date}
          </p>
        </div>
        <div className="border-t border-border" />

        {/* PDF button + AI Summary sit inline on mobile/tablet; on desktop they move to the sticky sidebar */}
        <div className="lg:hidden flex flex-col gap-4">
          {pdfButton}
          {aiSummary}
        </div>

        {detail.sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            <h2 className="type-subtitle-1 font-bold text-foreground">
              {section.heading}
            </h2>
            <p className="text-body text-foreground leading-relaxed">
              {section.content}
            </p>
            {section.image && (
              <div className="rounded-xl border border-border overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mock chart, intrinsic size varies per chart */}
                <img
                  src={section.image}
                  alt={section.heading}
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>
        ))}

        {/* Analysts sit inline on mobile/tablet; on desktop they move to the sticky sidebar, after Related Products */}
        <div className="lg:hidden border-t border-border mt-4" />
        <div className="lg:hidden">{analystsSection}</div>

        {/* Related Products sits before "other analyses" on mobile/tablet; on desktop it's in the sticky sidebar */}
        <div className="lg:hidden border-t border-border mt-4" />
        <div className="lg:hidden">
          <RelatedProductsCard strategy={strategy} variant="plain" />
        </div>

        {related.length > 0 && (
          <div className="flex flex-col gap-4 mt-4">
            <div className="border-t border-border" />
            <h2 className="type-subtitle-1 font-bold text-foreground mt-2">
              บทวิเคราะห์อื่นๆ ประจำ{strategy.periodLabel}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="border-t border-border mt-3 pt-6">
            <RelatedProductsCard strategy={strategy} variant="plain" />
          </div>
          <div className="border-t border-border mt-3 pt-6">
            {analystsSection}
          </div>
        </div>
      </div>
    </div>
  );
}
