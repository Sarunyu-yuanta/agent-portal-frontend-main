"use client";

import { useState, type ComponentProps } from "react";
import { Chip, Dropdown, DateInput, SearchInput } from "@sarunyu/system-one";
import {
  SparkleIcon,
  SunIcon,
  BroadcastIcon,
  BriefcaseIcon,
  BuildingsIcon,
  NotePencilIcon,
  FileTextIcon,
  LightningIcon,
  ChartLineUpIcon,
  FactoryIcon,
  GlobeIcon,
  TrophyIcon,
  PuzzlePieceIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { FadeIn } from "@/components/ui/fade-in";
import { EmptyState } from "@/components/ui/empty-state";
import { type AnalystItem } from "@/mocks/mock-data";
import { useResearch } from "@/features/catalog/hooks/use-catalog";
import { useHasLoaded } from "@/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

// ─── Data ─────────────────────────────────────────────────────────────────────

/** The "every category" pseudo-option. An id, so it can be labelled per
 *  language; the rest are the categories reports carry, from the data. */
const ALL_RESEARCH = "__all__";

const RESEARCH_CATS = [
  ALL_RESEARCH,
  "Wealth Designs Daily",
  "Chart Perspective Morning",
  "Chart Perspective Afternoon",
  "Derivative",
  "บทวิเคราะห์หุ้นรายตัว",
  "บทวิเคราะห์อุตสาหกรรม",
  "ความเห็นนักวิเคราะห์",
  "Theme Strategy",
  "Trading Portfolio",
  "Wealth Compass",
  "ELN Pick",
  "Technical Trading Portfolio",
  "SBL IDEA",
  "Top 5 DCA",
  "Yuanta Universe",
  "เอกสารการสัมมนา",
  "จับข่าวมาเล่าหุ้น",
  "Yuanta Global Wealth",
  "Commodities Highlight",
  "Power Investing",
] as const;

const MOCK_PDF_URL = "/mock-reports/sample-report.pdf";
const RESEARCH_HOME_OPTION = "__home__";

/** Title and subtitle: `t.research.research.tiles[id]`. */
type LandingTile = { id: TileId; icon: PhosphorIcon; color: string; span?: string };

type TileId = keyof Dictionary["research"]["research"]["tiles"];

const RESEARCH_LANDING_TILES: LandingTile[] = [
  {
    id: "t01",
    icon: SparkleIcon,
    color: "#f59e0b",
    span: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
  },
  { id: "t02", icon: SunIcon, color: "#f97316" },
  { id: "t03", icon: BroadcastIcon, color: "#06b6d4" },
  { id: "t04", icon: BriefcaseIcon, color: "#64748b" },
  { id: "t13", icon: PuzzlePieceIcon, color: "#6366f1" },
  { id: "t10", icon: FactoryIcon, color: "#3f3f46" },
  { id: "t05", icon: BuildingsIcon, color: "#0ea5e9" },
  {
    id: "t07",
    icon: FileTextIcon,
    color: "#71717a",
    span: "lg:col-start-3 lg:row-start-3 lg:row-span-2",
  },
  {
    id: "t08",
    icon: LightningIcon,
    color: "#ef4444",
    span: "lg:col-start-1 lg:row-start-4 lg:col-span-2",
  },
  {
    id: "t09",
    icon: ChartLineUpIcon,
    color: "#8b5cf6",
    span: "lg:col-start-1 lg:row-start-5 lg:row-span-2",
  },
  { id: "t06", icon: NotePencilIcon, color: "#10b981" },
  { id: "t11", icon: GlobeIcon, color: "#0891b2" },
  {
    id: "t12",
    icon: TrophyIcon,
    color: "#52525b",
    span: "lg:col-start-2 lg:row-start-6 lg:col-span-2",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tintIcon(IconComp: PhosphorIcon, color: string) {
  function TintedIcon({ className, style, ...props }: ComponentProps<PhosphorIcon>) {
    return <IconComp className={className} style={{ ...style, color }} {...props} />;
  }
  return TintedIcon;
}

function formatBuddhistDate(d: Date): string {
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = (d.getFullYear() + 543).toString();
  return `${day}/${month}/${year}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnalystCard({ analyst }: { analyst: AnalystItem }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/30 sm:gap-4 sm:p-5">
      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size headshot, no responsive sizes needed */}
      <img
        src={analyst.photo}
        alt={analyst.name}
        className="h-14 w-14 shrink-0 rounded-lg object-cover sm:h-24 sm:w-24"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-body-sm font-bold text-foreground">{analyst.name}</p>
        <p className="text-label leading-snug text-muted-foreground">{analyst.title}</p>
      </div>
    </div>
  );
}

function ResearchLandingGrid() {
  const r = useT().research.research;
  return (
    <div className="hide-scrollbar flex-1 overflow-y-auto p-4">
      <BentoGrid className="grid-flow-dense auto-rows-[130px] grid-cols-2 gap-2 lg:auto-rows-[150px] lg:grid-cols-3 lg:gap-3">
        {RESEARCH_LANDING_TILES.map((tile) => (
          <BentoCard
            key={tile.id}
            name={r.tiles[tile.id].title}
            description={r.tiles[tile.id].subtitle}
            href={MOCK_PDF_URL}
            cta={r.openDocument}
            Icon={tintIcon(tile.icon, tile.color)}
            className={tile.span ?? "col-span-1 row-span-1"}
            background={
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  background: `radial-gradient(140% 140% at 100% 0%, ${tile.color}, transparent 60%)`,
                }}
              />
            }
          />
        ))}
      </BentoGrid>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Research() {
  const t = useT();
  const r = t.research.research;
  const [subTab, setSubTab] = useState<"research" | "analyst">("research");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchDate, setSearchDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateInputResetKey, setDateInputResetKey] = useState(0);

  const goHome = () => {
    setActiveCategory(null);
    setSearchQuery("");
    setSearchDate(undefined);
    setDateInputResetKey((k) => k + 1);
  };

  /** Clears the search and date, keeping the category. */
  const clearSearch = () => {
    setSearchQuery("");
    setSearchDate(undefined);
    setDateInputResetKey((k) => k + 1);
  };

  const isSearching = searchQuery.trim().length > 0;
  const showList = activeCategory !== null || isSearching || searchDate !== undefined;

  const { data: feed, isLoading } = useResearch();
  const hasLoaded = useHasLoaded(isLoading);

  const filtered = feed.reports.filter((item) => {
    const catOk =
      activeCategory === null ||
      activeCategory === ALL_RESEARCH ||
      item.category === activeCategory;
    const dateOk = !searchDate || item.date === formatBuddhistDate(searchDate);
    const searchOk =
      !isSearching || item.title.toLowerCase().includes(searchQuery.trim().toLowerCase());
    return catOk && dateOk && searchOk;
  });

  // The sub-tab chips are navigation, so they stay live; everything that acts
  // on the feed (search, date, categories, the reports) waits for it.
  const subTabs = (
    <div className="flex items-center gap-2 pb-2">
      <Chip
        label={r.research}
        type="single"
        selected={subTab === "research"}
        onClick={() => setSubTab("research")}
      />
      <Chip
        label={r.analystContact}
        type="single"
        selected={subTab === "analyst"}
        onClick={() => setSubTab("analyst")}
      />
    </div>
  );

  // Chips are bars too until the feed has loaded once.
  if (isLoading) {
    return (
      <ResearchSkeleton
        subTabs={
          hasLoaded ? (
            subTabs
          ) : (
            <div className="flex items-center gap-2 pb-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
          )
        }
      />
    );
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card md:max-h-[calc(var(--vh)*72)]">
      {/* Sub-tabs + desktop search bar */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-3 pt-2">
        {subTabs}
        <div
          className={`hidden items-center gap-2 pb-2 md:flex ${subTab === "research" ? "" : "invisible"}`}
        >
          <SearchInput
            placeholder={r.searchStock}
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
            size="lg"
            className="w-80"
          />
          <DateInput
            key={dateInputResetKey}
            mode="single"
            placeholder={r.pickDate}
            value={searchDate}
            onChange={setSearchDate}
            className="w-56"
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Desktop category sidebar — research tab only */}
        {subTab === "research" && (
          <div className="hide-scrollbar hidden w-52 shrink-0 flex-col overflow-y-auto border-r border-border md:flex">
            <button
              type="button"
              onClick={goHome}
              className={`cursor-pointer border-b border-border/40 px-4 py-2.5 text-left text-body-sm transition-colors ${
                !showList
                  ? "bg-primary-action-light text-primary-action font-semibold"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {r.home}
            </button>
            {RESEARCH_CATS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`cursor-pointer border-b border-border/40 px-4 py-2.5 text-left text-body-sm transition-colors last:border-0 ${
                  activeCategory === cat
                    ? "bg-primary-action-light text-primary-action font-semibold"
                    : "text-foreground hover:bg-muted/50"
                }`}
              >
                {cat === ALL_RESEARCH ? t.insights.allResearch : cat}
              </button>
            ))}
          </div>
        )}

        {/* Content area */}
        <FadeIn
          key={`${subTab}-${activeCategory}-${showList}`}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
        >
          {subTab === "analyst" ? (
            <div className="hide-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {feed.analysts.map((analyst) => (
                  <AnalystCard key={analyst.id} analyst={analyst} />
                ))}
              </div>
              {feed.analysts.length === 0 && (
                <EmptyState
                  size="compact"
                  icon={<UsersIcon size={32} className="text-[var(--text-default-placeholder)]" />}
                  title={r.noAnalysts}
                />
              )}
            </div>
          ) : (
            <>
              {/* Mobile category picker */}
              <div className="flex shrink-0 flex-col gap-2 border-b border-border p-3 md:hidden">
                <SearchInput
                  placeholder={r.searchStock}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onClear={() => setSearchQuery("")}
                  className="w-full"
                />
                <DateInput
                  key={dateInputResetKey}
                  mode="single"
                  placeholder={r.pickDate}
                  value={searchDate}
                  onChange={setSearchDate}
                  className="w-full"
                />
                <Dropdown
                  value={activeCategory ?? RESEARCH_HOME_OPTION}
                  onChange={(v) => {
                    if (v === RESEARCH_HOME_OPTION) goHome();
                    else setActiveCategory(v);
                  }}
                  options={[
                    { label: r.homeOption, value: RESEARCH_HOME_OPTION },
                    ...RESEARCH_CATS.map((c) => ({
                      label: c === ALL_RESEARCH ? t.insights.allResearch : c,
                      value: c,
                    })),
                  ]}
                  placeholder={r.pickCategory}
                />
              </div>

              {!showList ? (
                <ResearchLandingGrid />
              ) : (
                <>
                  {/* Column headers — desktop */}
                  <div
                    className="hidden shrink-0 border-b border-border bg-muted/40 px-5 py-2.5 md:grid"
                    style={{ gridTemplateColumns: "110px 180px 1fr" }}
                  >
                    <span className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
                      {r.columns.date}
                    </span>
                    <span className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
                      {r.columns.report}
                    </span>
                    <span className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
                      {r.columns.detail}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="hide-scrollbar flex-1 divide-y divide-border overflow-y-auto">
                    {filtered.length === 0 ? (
                      // A search or date that matched nothing can be cleared; a
                      // category with no reports in it is simply empty.
                      isSearching || searchDate !== undefined ? (
                        <EmptyState
                          size="compact"
                          icon={
                            <MagnifyingGlassIcon
                              size={32}
                              className="text-[var(--text-default-placeholder)]"
                            />
                          }
                          title={t.states.noResultTitle}
                          body={t.states.noResultBody}
                          action={{ label: t.states.clearFilters, onClick: clearSearch }}
                        />
                      ) : (
                        <EmptyState
                          size="compact"
                          icon={
                            <FileTextIcon
                              size={32}
                              className="text-[var(--text-default-placeholder)]"
                            />
                          }
                          title={r.emptyCategory}
                        />
                      )
                    ) : (
                      filtered.map((item) => (
                        <a
                          key={item.id}
                          href={MOCK_PDF_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="group flex flex-col gap-0.5 px-5 py-3.5 transition-colors hover:bg-muted/30 md:grid md:gap-4"
                          style={{ gridTemplateColumns: "110px 180px 1fr" }}
                        >
                          <span className="text-label text-muted-foreground">{item.date}</span>
                          <span className="text-body-sm text-foreground">{item.category}</span>
                          <span className="text-primary-action text-body-sm leading-snug group-hover:underline">
                            {item.title}
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </FadeIn>
      </div>
    </div>
  );
}

/** The Research card while its feed loads: the real sub-tab chips, then
 *  search + date, category sidebar and the landing tiles as bars. */
function ResearchSkeleton({ subTabs }: { subTabs: React.ReactNode }) {
  return (
    <div
      aria-busy="true"
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card md:max-h-[calc(var(--vh)*72)]"
    >
      <div className="flex items-center justify-between gap-4 border-b border-border px-3 pt-2">
        {subTabs}
        <div className="hidden items-center gap-2 pb-2 md:flex">
          <Skeleton className="h-12 w-80 rounded-lg" />
          <Skeleton className="h-12 w-56 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="hidden w-52 shrink-0 flex-col gap-3 border-r border-border p-4 md:flex">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
        <div className="grid min-w-0 flex-1 auto-rows-[130px] grid-cols-2 gap-3 p-4 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-full w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
