"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { Button, Card, Toaster } from "@sarunyu/system-one";
import { ArrowLeftIcon, ShieldCheckIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollTopOnChange } from "@/hooks/use-scroll-top";
import { useSectionBack } from "@/features/shell/hooks/use-section-back";
import { setQueryState, withQuery } from "@/lib/query-state";
import {
  RiskAlertRowItem,
  RiskCategoryTabs,
  RiskSeverityStrip,
} from "@/features/command-center/components/RiskAlertsPanel";
import { RiskAlertDetail } from "@/features/command-center/components/RiskAlertDetail";
import { parseRiskCategory, SEVERITY_ORDER } from "@/features/command-center/lib/risk-config";
import {
  countRiskByCategory,
  countRiskBySeverity,
  type RiskAlertRow,
} from "@/features/command-center/lib/risk-feed";
import { useRiskAlertRows } from "@/features/command-center/hooks/use-risk-alert-rows";
import { useRiskCta } from "@/features/command-center/hooks/use-risk-cta";
import { ErrorState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";
import type { RiskSeverity } from "@/types/risk-alert";

/**
 * Every risk finding across the book, filtered.
 *
 * The Command Center card names the most pressing few; this is where "ดูทั้งหมด"
 * lands — and it is also the only place a finding that has been acknowledged
 * can be found again, which is why the card links here even when nothing has
 * been cut.
 *
 * Drawn with the card's own rows rather than a table, for the reason
 * `next-best-actions/page.tsx` gives about this folder: these rows are not all
 * the same shape. Most carry no deadline, one carries no client at all, and the
 * figure that triggered one is not the figure that triggered the next — a fixed
 * column set would be mostly empty cells. It also means no mobile/desktop
 * split: a flex row drops its figure under `sm` and truncates, where a table's
 * columns cannot shrink below their own content.
 */
export function RiskAlertsView() {
  // The filters live in the URL, so a bookmarked "critical only" view reopens as
  // one and the Dashboard card's severity strip can link straight into it.
  // `useSearchParams` suspends, hence the boundary.
  return (
    <Suspense fallback={<RiskAlertsSkeleton />}>
      <RiskAlertsPageInner />
    </Suspense>
  );
}

function RiskAlertsPageInner() {
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const t = useT();
  const { rows, isLoading, error, retry, acknowledge } = useRiskAlertRows();
  // Falls back to the Command Center on a cold entry — a pasted link, or a
  // session restored straight onto this page with no trail to walk up.
  const goBack = useSectionBack(() => "/command-center");
  // Opened from a Dashboard that was scrolled down.
  useScrollTopOnChange([]);

  const [detail, setDetail] = useState<RiskAlertRow | null>(null);
  /** The same mocked CTA the card's rows fire — one definition, so the button
   *  does not quietly mean something else once you have clicked through. */
  const { act, toasts, removeToast } = useRiskCta();

  const category = parseRiskCategory(searchParams.get("category"));
  const severityParam = searchParams.get("severity");
  const severity: RiskSeverity | null = SEVERITY_ORDER.includes(severityParam as RiskSeverity)
    ? (severityParam as RiskSeverity)
    : null;

  // `replace`, not `push` — narrowing a list is a refinement, not a
  // destination, and it should not fill history with entries the reader has to
  // click back through to leave the page.
  const update = (patch: Record<string, string | null>) =>
    setQueryState(withQuery(pathname, searchParams, patch), "replace");

  /** Open findings only. A "รวมรายการที่รับทราบแล้ว" toggle used to fold the
   *  acknowledged ones back in from a second list; it is gone, and with it the
   *  `ack` param, so this page and the card it is reached from now show the
   *  same set of rows and differ only in how many of them fit. */
  const pool = rows;

  const visible = useMemo(
    () =>
      pool.filter(
        (row) =>
          (category === "all" || row.alert.category === category) &&
          (severity === null || row.alert.severity === severity),
      ),
    [pool, category, severity],
  );

  const categoryCounts = useMemo(() => countRiskByCategory(pool), [pool]);
  /** Severity counts follow the chosen category, so the chip numbers describe
   *  the list the reader is actually looking at. */
  const severityCounts = useMemo(
    () =>
      countRiskBySeverity(
        category === "all" ? pool : pool.filter((row) => row.alert.category === category),
      ),
    [pool, category],
  );

  const filtered = category !== "all" || severity !== null;

  // The whole page, not just the list: the category tabs and severity strip
  // carry counts from this feed, so they wait for it too.
  if (isLoading) return <RiskAlertsSkeleton />;
  if (error) return <ErrorState onRetry={retry} />;

  return (
    /* `xl:pb-20` clears the floating "New note" button the shell pins at
       `bottom-8 right-8` from `xl` up — see the Call Log page for the same. */
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <div className="flex items-center gap-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={goBack}
          aria-label={t.commandCenter.backToDashboard}
          className="shrink-0"
        >
          <ArrowLeftIcon size={18} />
        </Button>
        {/* `type-h6` here and `type-subtitle-1` on the card is deliberate: this is
            a page title, matching the Call Log and Next Best Actions pages, where
            the card heading matches the cards beside it. */}
        {/* No count beside the title, matching the card this page is reached
            from. The strip below already opens with "ทั้งหมด N" and breaks it
            down by severity; a badge up here was a second, thinner answer to
            the same question. */}
        <h1 className="type-h6 text-foreground">{t.commandCenter.risk.title}</h1>
      </div>

      {/* Category first — it is the *kind of thing*, which is what a tab strip
          is for, and the per-family counts are what makes the handoff from the
          card worth taking. The same strip the card carries, from one
          definition, so arriving here from it changes nothing but the scope. */}
      <RiskCategoryTabs
        counts={categoryCounts}
        total={pool.length}
        value={category}
        onChange={(next) => update({ category: next === "all" ? null : next })}
      />

      {/* Severity, as the same strip the Command Center card carries — one
          definition of this control, so the two surfaces cannot disagree about
          what the levels are or how many of each there are. It replaced a
          second row of `Chip`s that sat here doing the identical job.

          `total` follows the chosen category, so the strip describes the list
          under it rather than the whole book. */}
      <RiskSeverityStrip
        counts={severityCounts}
        total={category === "all" ? pool.length : categoryCounts[category]}
        value={severity}
        onChange={(next) => update({ severity: next })}
      />

      <Card variant="default" className="gap-4">
        {/* Loading above empty — the project-wide rule. The other order flashes
            "ไม่มีรายการความเสี่ยง" on every visit the moment this feed has a
            real endpoint. */}
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[62px] rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={
              <ShieldCheckIcon
                size={40}
                weight="duotone"
                className="text-[var(--text-default-placeholder)]"
              />
            }
            title={
              filtered ? t.commandCenter.risk.noFilterResultTitle : t.commandCenter.risk.emptyTitle
            }
            body={
              filtered ? t.commandCenter.risk.noFilterResultBody : t.commandCenter.risk.emptyBody
            }
            action={
              filtered
                ? {
                    label: t.states.clearFilters,
                    onClick: () => update({ category: null, severity: null }),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Keyed on the filters, so switching either replays the fade — the
                rows change completely in both cases. Same as `orders`. */}
            <FadeIn key={`${category}|${severity}`}>
              <div className="divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)]">
                {visible.map((row) => (
                  <RiskAlertRowItem
                    key={row.alert.id}
                    row={row}
                    onOpen={() => setDetail(row)}
                    onAct={act}
                  />
                ))}
              </div>
            </FadeIn>
          </>
        )}
      </Card>

      <Toaster items={toasts} onRemove={removeToast} />

      <RiskAlertDetail
        row={detail}
        onAct={act}
        onClose={() => setDetail(null)}
        onAcknowledge={(alert) => {
          setDetail(null);
          acknowledge(alert);
        }}
      />
    </div>
  );
}

function RiskAlertsSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:gap-5 xl:pb-20">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full max-w-[560px] rounded-xl" />
      <Skeleton className="h-7 w-[320px] rounded-full" />
      <Card variant="default" className="gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[62px] rounded-xl" />
        ))}
      </Card>
    </div>
  );
}
