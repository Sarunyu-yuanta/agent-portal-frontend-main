"use client";

import { useState, Fragment } from "react";
import { Chip, Button, BottomSheet, Modal } from "@sarunyu/system-one";
import {
  ArrowRightIcon,
  FilePdfIcon,
  FileTextIcon,
  FunnelSimpleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { mockHouseViewStrategies } from "@/mocks/mock-data";
import { useMediaQuery } from "@/hooks/use-media-query";
import { FadeIn } from "@/components/ui/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { PlaybookCard } from "./PlaybookCard";
import { PlaybookCardCompact } from "./PlaybookCardCompact";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

// ─── Types & constants ────────────────────────────────────────────────────────

export type AssetClassFilter =
  | "All"
  | "Hot issue"
  | "Buy list"
  | "Asset performance"
  | "Market calendar"
  | "Asset class outlook"
  | "Market outlook";

const ASSET_FILTERS: AssetClassFilter[] = [
  "All",
  "Hot issue",
  "Buy list",
  "Asset performance",
  "Market calendar",
  "Asset class outlook",
  "Market outlook",
];

/** Coerces a URL `?filter=` value to a real chip, falling back to "All". */
export function normalizeAssetFilter(value: string | null | undefined): AssetClassFilter {
  return ASSET_FILTERS.includes(value as AssetClassFilter) ? (value as AssetClassFilter) : "All";
}

const GRID_LIMIT = 4;

/** Same placeholder the Research tab serves — the app has no real report files. */
const FULL_REPORT_PDF_URL = "/mock-reports/sample-report.pdf";

type Strategy = (typeof mockHouseViewStrategies)[number];
type PeriodGroup = { period: string; periodLabel: string; items: Strategy[] };
type ModalGroup = PeriodGroup | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByPeriodLabel(strategies: Strategy[]): PeriodGroup[] {
  const seen = new Set<string>();
  const order: { period: string; periodLabel: string }[] = [];
  for (const s of strategies) {
    const key = `${s.period}__${s.periodLabel}`;
    if (!seen.has(key)) {
      seen.add(key);
      order.push({ period: s.period, periodLabel: s.periodLabel });
    }
  }
  return order.map(({ period, periodLabel }) => ({
    period,
    periodLabel,
    items: strategies.filter((s) => s.period === period && s.periodLabel === periodLabel),
  }));
}

/** English on purpose — it also names the downloaded file. */
function periodBadgeLabel(period: string) {
  return period === "monthly" ? "Monthly" : "Weekly";
}

function periodName(t: Dictionary, period: string) {
  return period === "monthly"
    ? t.research.houseView.period.monthly
    : t.research.houseView.period.weekly;
}

function modalTitle(t: Dictionary, group: PeriodGroup) {
  return t.research.houseView.modalTitle(periodName(t, group.period), group.periodLabel);
}

/** `House-View-Weekly-22–26-มิถุนายน-2569.pdf` — one file per period group. */
function reportFileName(group: PeriodGroup) {
  const label = group.periodLabel.trim().replace(/\s+/g, "-");
  return `House-View-${periodBadgeLabel(group.period)}-${label}.pdf`;
}

function downloadFullReport(group: PeriodGroup) {
  const a = document.createElement("a");
  a.href = FULL_REPORT_PDF_URL;
  a.download = reportFileName(group);
  a.click();
}

/** Shared by the period header and both "ดูทั้งหมด" surfaces. */
function FullReportButton({ group }: { group: PeriodGroup }) {
  const hv = useT().research.houseView;
  return (
    <Button
      size="sm"
      variant="outline"
      leftIcon={<FilePdfIcon size={14} />}
      onClick={() => downloadFullReport(group)}
      className="shrink-0"
    >
      {hv.downloadPdf}
      <span className="hidden sm:inline">&nbsp;{hv.fullEdition}</span>
    </Button>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StrategyPlaybooks({
  filter,
  onFilterChange,
}: {
  /** Owned by the page so it can live in the URL and survive navigation. */
  filter: AssetClassFilter;
  onFilterChange: (filter: AssetClassFilter) => void;
}) {
  const t = useT();
  const hv = t.research.houseView;
  const [modalGroup, setModalGroup] = useState<ModalGroup>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const all = mockHouseViewStrategies;
  const filtered = filter === "All" ? all : all.filter((s) => s.category === filter);
  const isFiltered = filter !== "All";
  const groups = groupByPeriodLabel(filtered);

  return (
    <div className="flex w-full flex-col gap-8">
      {/* Filter chips */}
      <div className="hide-scrollbar -mx-4 overflow-x-auto xl:-mx-6">
        <div className="flex flex-nowrap items-center gap-2 px-4 md:flex-wrap xl:px-6">
          {ASSET_FILTERS.map((f) => (
            <span key={f} className="shrink-0">
              <Chip
                label={hv.category[f] ?? f}
                type="single"
                size="small"
                selected={filter === f}
                onClick={() => onFilterChange(f)}
              />
            </span>
          ))}
        </div>
      </div>

      {/* Period groups */}
      <FadeIn key={filter} className="flex flex-col gap-8">
        {groups.length === 0 &&
          (isFiltered && all.length > 0 ? (
            <EmptyState
              size="compact"
              icon={
                <FunnelSimpleIcon size={32} className="text-[var(--text-default-placeholder)]" />
              }
              title={t.states.noFilterResultTitle}
              body={t.states.noFilterResultBody}
              action={{ label: t.states.clearFilters, onClick: () => onFilterChange("All") }}
            />
          ) : (
            <EmptyState
              size="compact"
              icon={<FileTextIcon size={32} className="text-[var(--text-default-placeholder)]" />}
              title={hv.empty}
            />
          ))}
        {groups.map((group, idx) => {
          const isFirstMonthly = !isFiltered && idx === 0 && group.period === "monthly";
          const [featured, ...rest] = group.items;
          const gridItems = isFirstMonthly ? rest : group.items;
          const hasMore = gridItems.length > GRID_LIMIT;

          return (
            <Fragment key={`${group.period}-${group.periodLabel}`}>
              {idx > 0 && <div className="my-4 border-t border-border" />}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-primary-action-light text-primary-action rounded px-2.5 py-1 text-meta font-bold">
                      {periodName(t, group.period)}
                    </span>
                    <p className="type-subtitle-1 font-bold text-foreground">{group.periodLabel}</p>
                    <FullReportButton group={group} />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {(hasMore && !isFirstMonthly) || isFirstMonthly ? (
                      <Button
                        size="sm"
                        variant="plain"
                        rightIcon={<ArrowRightIcon size={12} />}
                        onClick={() => setModalGroup(group)}
                        className={isFirstMonthly ? "lg:hidden" : ""}
                      >
                        {hv.viewAll}
                      </Button>
                    ) : null}
                  </div>
                </div>

                {isFirstMonthly ? (
                  <>
                    {/* Desktop: combined card */}
                    <div className="hidden flex-col overflow-hidden rounded-2xl border border-border bg-card lg:flex lg:flex-row">
                      <div className="min-w-0 flex-1">
                        <PlaybookCard strategy={featured} noBorder />
                      </div>
                      {rest.length > 0 && (
                        <div className="visible-scrollbar flex max-h-[306px] shrink-0 flex-col overflow-y-auto border-t border-border lg:w-[45%] lg:border-t-0 lg:border-l">
                          <div className="flex flex-col divide-y divide-border">
                            {rest.map((s) => (
                              <PlaybookCardCompact key={s.id} strategy={s} noBorder />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mobile: separate cards + view all */}
                    <div className="flex flex-col gap-3 lg:hidden">
                      <PlaybookCard strategy={featured} />
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {rest.slice(0, 3).map((s) => (
                          <PlaybookCardCompact key={s.id} strategy={s} />
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {gridItems.slice(0, GRID_LIMIT).map((s) => (
                      <PlaybookCardCompact key={s.id} strategy={s} />
                    ))}
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </FadeIn>

      {/* Mobile: BottomSheet */}
      <BottomSheet
        open={!!modalGroup && isMobile}
        onOpenChange={(o) => {
          if (!o) setModalGroup(null);
        }}
        title={modalGroup ? modalTitle(t, modalGroup) : ""}
        showHandle
        showHeader
        rightSide="action"
        actionLabel={hv.downloadPdf}
        onActionClick={() => {
          if (modalGroup) downloadFullReport(modalGroup);
        }}
        contentClassName="overflow-y-auto"
      >
        <div className="flex flex-col gap-3 pb-8">
          {modalGroup?.items.map((s) => (
            <PlaybookCardCompact key={s.id} strategy={s} />
          ))}
        </div>
      </BottomSheet>

      {/* Desktop: centered modal */}
      {modalGroup && !isMobile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          onClick={() => setModalGroup(null)}
          role="presentation"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <Modal
              variant="content"
              title=""
              showClose={false}
              onClose={() => setModalGroup(null)}
              className="w-[calc(var(--vw)*100-2rem)] max-w-[720px]"
            >
              <div className="flex flex-col gap-4">
                {/* Modal's own `title`/`showClose` header only takes a string,
                    so the header is rebuilt here to seat the PDF button beside
                    the title. `-mt-4` collapses the now-empty native header. */}
                <div className="-mt-4 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <p className="truncate text-title leading-[32px] font-bold text-foreground">
                      {modalTitle(t, modalGroup)}
                    </p>
                    <FullReportButton group={modalGroup} />
                  </div>
                  <Button
                    aria-label={hv.closeDialog}
                    className="text-subtle-text h-5 w-5 shrink-0 rounded-none"
                    onClick={() => setModalGroup(null)}
                    size="icon-xs"
                    variant="plain-black"
                  >
                    <XIcon size={20} />
                  </Button>
                </div>
                <div className="hide-scrollbar grid max-h-[calc(var(--vh)*60)] grid-cols-1 gap-4 overflow-y-auto py-1 sm:grid-cols-2">
                  {modalGroup.items.map((s) => (
                    <PlaybookCardCompact key={s.id} strategy={s} />
                  ))}
                </div>
              </div>
            </Modal>
          </div>
        </div>
      )}
    </div>
  );
}
