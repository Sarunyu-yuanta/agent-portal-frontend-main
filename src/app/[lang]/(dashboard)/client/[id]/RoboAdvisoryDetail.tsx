"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useAppPathname } from "@/i18n/navigation";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, FunnelSimpleIcon } from "@phosphor-icons/react";
import { ResponsiveBreadcrumb } from "@/components/layout/ResponsiveBreadcrumb";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients, useClientsResource } from "@/hooks/use-api";
import { useRoboAdvisoryPlans } from "@/hooks/use-catalog";
import type { Client } from "@/types/domain";
import { usePageBreadcrumb } from "../../page-breadcrumbs";
import {
  AdvisoryClientBar,
  AdvisoryClientPicker,
  useAdvisoryClient,
  type AdvisoryClientState,
} from "./AdvisoryClientBar";
import { advisoryCta, planSuitability } from "./portfolio-advisory-client";
import {
  AdvisoryCtaButton,
  PLAN_CARD_SHADOW,
  PlanSuitabilityBadge,
  SECTION_SHADOW,
} from "./portfolio-advisory-ui";
import { ROBO_ASSETS } from "./robo-advisory-assets";
import type { RoboAdvisoryPlan } from "./robo-advisory-plan-data";
import { AdvisoryDetailSkeleton } from "./AdvisoryDetailSkeleton";
import {
  EMPTY_ROBO_ADVISORY_FILTERS,
  filterRoboAdvisoryPlans,
  type RoboAdvisoryFilters,
} from "./robo-advisory-filter-data";
import { RoboAdvisoryFilterModal } from "./RoboAdvisoryFilterModal";
import { RoboAdvisoryPlanDetailModal } from "./RoboAdvisoryPlanDetailModal";
import { RoboRiskLevel } from "./RoboRiskLevel";
import { AdvisoryPlansEmpty } from "./AdvisoryPlansEmpty";
import { useT } from "@/i18n/I18nProvider";

/** Hidden pending sign-off on the filter behavior — flip to true to re-enable. */
const SHOW_ROBO_FILTER_BUTTON = false;

/** Figma 34174:773574 / 33787:149487 — back arrow + title above 996px section. */
function DesktopBackHeader({ onBack }: { onBack: () => void }) {
  const t = useT();
  return (
    <div className="flex w-full items-center gap-3 rounded-lg p-2">
      <Button
        variant="plain"
        size="icon-sm"
        onClick={onBack}
        aria-label={t.products.common.back}
        className="size-[34px] shrink-0 p-2"
      >
        <ArrowLeftIcon size={18} />
      </Button>
      <h1 className="shrink-0 text-lg leading-[28px] font-bold text-black">Robo Advisory</h1>
    </div>
  );
}

function StatItem({
  iconSrc,
  labelLines,
  value,
  valueClassName,
  labelWidth,
}: {
  iconSrc: string;
  labelLines: [string, string];
  value: string;
  valueClassName?: string;
  labelWidth?: number;
}) {
  return (
    <div className="flex min-w-0 flex-[1_0_0] flex-col items-center gap-1">
      <div className="flex shrink-0 items-center justify-center rounded-full bg-[#eff6ff] p-2.5">
        <Image src={iconSrc} alt="" width={20} height={20} className="size-5 shrink-0" />
      </div>
      <div
        className="flex flex-col items-center gap-1 text-center"
        style={labelWidth != null ? { width: labelWidth } : undefined}
      >
        <div className="text-center leading-none">
          <p className="mb-0 text-xs leading-[20px] font-bold text-[#101828]">{labelLines[0]}</p>
          <p className="text-xs leading-[20px] font-bold text-[#101828]">{labelLines[1]}</p>
        </div>
        <p
          className={`text-xs leading-[20px] whitespace-nowrap ${valueClassName ?? "text-[#4a5565]"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/** Mobile/tablet breadcrumb — px-16 mobile, px-32 tablet (layout owns this route). */
function RoboAdvisoryMobileBreadcrumb() {
  const pathname = useAppPathname();
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const breadcrumb = usePageBreadcrumb(pathname, { clients, isPrivate });

  if (!breadcrumb) return null;

  return (
    <div className="shrink-0 bg-white px-4 pt-4 pb-3 md:px-8 lg:hidden">
      <ResponsiveBreadcrumb items={breadcrumb} />
    </div>
  );
}

/** Figma 33787:149512 — flex-[1_0_0] in 884px row → 436×302; tablet 33777:105243 p-16. */
function RoboPlanCard({
  plan,
  client,
  onDetailsClick,
}: {
  plan: RoboAdvisoryPlan;
  client: Client;
  onDetailsClick: () => void;
}) {
  const t = useT();
  const stats = t.products.advisory.stats;
  return (
    <div
      className="box-border flex min-h-[302px] w-full flex-col gap-4 rounded-lg bg-white p-4 lg:h-full lg:min-w-0 lg:flex-[1_0_0] lg:p-3"
      style={{ boxShadow: PLAN_CARD_SHADOW }}
    >
      <div className="flex w-full shrink-0 flex-col gap-4">
        <div className="flex w-full flex-col gap-1">
          <div className="flex w-full flex-col gap-1">
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-micro leading-[18px] text-[#4a5565]">{plan.provider}</p>
              <p className="bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-lg leading-[28px] font-bold text-transparent">
                {plan.name}
              </p>
            </div>
            <p className="text-sm leading-[24px] text-[#4a5565]">{plan.description}</p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
            <RoboRiskLevel tier={plan.riskTier} />
            <PlanSuitabilityBadge suitability={planSuitability(client, plan.riskTier)} />
            <div className="flex min-w-0 flex-[1_0_0] items-center justify-end gap-1 whitespace-nowrap">
              <p className="text-xs leading-[20px] font-bold text-[#101828]">Available Room</p>
              <p className="text-xs leading-[20px] text-[#4a5565]">{plan.availableRoom}</p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-end">
          <StatItem
            iconSrc={ROBO_ASSETS.iconMoney}
            labelLines={stats.minInvestmentLines}
            value={plan.minInvestment}
          />
          <div className="h-[58px] w-px shrink-0 bg-black/10" />
          <StatItem
            iconSrc={ROBO_ASSETS.iconClock}
            labelLines={stats.holdingPeriodLines}
            value={plan.holdingPeriod}
          />
          <div className="h-[58px] w-px shrink-0 bg-black/10" />
          <StatItem
            iconSrc={ROBO_ASSETS.iconHandCoins}
            labelLines={stats.dividendLines}
            value={plan.dividendPerYear}
            labelWidth={50}
          />
          <div className="h-[58px] w-px shrink-0 bg-black/10" />
          <StatItem
            iconSrc={ROBO_ASSETS.iconChartLineDown}
            labelLines={["Max ", "Drawdown "]}
            value={plan.maxDrawdown}
            valueClassName="text-[#c10007]"
          />
        </div>
      </div>

      <div className="mt-auto flex w-full shrink-0 flex-wrap items-center justify-between gap-2">
        <Button
          variant="plain"
          size="lg"
          onClick={onDetailsClick}
          className="gap-1 pr-2.5 pl-3.5"
          rightIcon={
            <Image
              src={ROBO_ASSETS.iconCaretDown}
              alt=""
              width={20}
              height={20}
              className="size-5 shrink-0"
            />
          }
        >
          {t.products.common.details}
        </Button>
        <AdvisoryCtaButton cta={advisoryCta(client, "robo")} className="shrink-0" />
      </div>
    </div>
  );
}

/** Figma 33777:105245 — chart decoration over gradient; fades out so no hard edge. */
function RoboAdvisoryChartOverlay({ layout }: { layout: "mobile" | "tablet" }) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
      style={{ height: layout === "tablet" ? 347 : 280 }}
      aria-hidden
    >
      <Image
        src={ROBO_ASSETS.detailChartBg}
        alt=""
        fill
        priority
        sizes="100vw"
        className={
          layout === "tablet" ? "object-cover object-right-top" : "object-cover object-[32%_top]"
        }
      />
    </div>
  );
}

function RoboAdvisoryHeroMobile({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
  onFilterClick,
}: {
  plans: RoboAdvisoryPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: RoboAdvisoryPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
  onFilterClick: () => void;
}) {
  const t = useT();
  // Figma 33772:197802 — mobile hero 233×40 (2×20px lines, body-2 14px).
  const ROBO_DETAIL_MOBILE_HERO_LINES = t.products.advisory.robo.tagline.heroMobile;
  return (
    <div className="relative flex w-full flex-1 flex-col items-center overflow-x-clip bg-gradient-to-t from-white to-[#063f84] pb-20">
      <RoboAdvisoryChartOverlay layout="mobile" />

      <div className="relative z-10 flex h-[170px] w-full shrink-0 items-center gap-2 py-4 pr-4 pl-5">
        <div className="relative h-[138px] w-[98px] shrink-0">
          <Image
            src={ROBO_ASSETS.roboIllustration}
            alt=""
            width={98}
            height={138}
            priority
            className="pointer-events-none h-[138px] w-[98px] object-contain object-bottom"
          />
        </div>
        <div className="flex min-w-0 flex-[1_0_0] flex-col gap-2 text-white">
          <p className="text-2xl leading-9 font-bold whitespace-nowrap">Robo Advisory</p>
          <div className="w-full text-sm leading-[24px]">
            {ROBO_DETAIL_MOBILE_HERO_LINES.map((line, index) => (
              <p
                key={line}
                className={index < ROBO_DETAIL_MOBILE_HERO_LINES.length - 1 ? "mb-0" : undefined}
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col items-center gap-3">
        <div className="w-full px-4">
          <AdvisoryClientBar state={advisory} />
        </div>
        <div className="flex w-full items-center justify-between px-4">
          <p className="text-base leading-[28px] font-bold text-white">
            {t.products.advisory.allPlans(plans.length)}
          </p>
          {SHOW_ROBO_FILTER_BUTTON ? (
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label={t.products.common.filter}
              onClick={onFilterClick}
            >
              <FunnelSimpleIcon size={18} />
            </Button>
          ) : null}
        </div>
        <div className="flex w-[343px] max-w-[calc(100%-32px)] flex-col gap-3">
          {plans.length === 0
            ? empty
            : plans.map((plan) => (
                <RoboPlanCard
                  key={plan.id}
                  plan={plan}
                  client={client}
                  onDetailsClick={() => onPlanDetails(plan)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

/** Figma 33777:105223 — tablet full-bleed hero, 704px stacked plan cards. */
function RoboAdvisoryHeroTablet({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
  onFilterClick,
}: {
  plans: RoboAdvisoryPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: RoboAdvisoryPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
  onFilterClick: () => void;
}) {
  const t = useT();
  return (
    <div className="relative flex min-h-[910px] w-full flex-1 flex-col gap-3 overflow-x-clip bg-gradient-to-t from-white to-[#063f84] pb-20">
      <RoboAdvisoryChartOverlay layout="tablet" />

      <div className="relative z-10 flex h-[170px] w-full shrink-0 items-center gap-2 px-8 py-6">
        <div className="relative h-[138px] w-[98px] shrink-0">
          <Image
            src={ROBO_ASSETS.roboIllustration}
            alt=""
            width={98}
            height={138}
            priority
            className="pointer-events-none h-[138px] w-[98px] object-contain object-bottom"
          />
        </div>
        <div className="flex min-w-0 flex-[1_0_0] flex-col gap-2 text-white">
          <p className="text-2xl leading-9 font-bold">Robo Advisory</p>
          <p className="text-base leading-[24px]">{t.products.advisory.robo.tagline.full}</p>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-4 px-8">
        <AdvisoryClientBar state={advisory} />
        <div className="flex w-full items-center justify-between">
          <p className="text-base leading-[28px] font-bold text-white">
            {t.products.advisory.allPlans(plans.length)}
          </p>
          {SHOW_ROBO_FILTER_BUTTON ? (
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label={t.products.common.filter}
              onClick={onFilterClick}
            >
              <FunnelSimpleIcon size={18} />
            </Button>
          ) : null}
        </div>
        <div className="flex w-full flex-col gap-4">
          {plans.length === 0
            ? empty
            : plans.map((plan) => (
                <RoboPlanCard
                  key={plan.id}
                  plan={plan}
                  client={client}
                  onDetailsClick={() => onPlanDetails(plan)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

/** Figma 33787:149490 — gradient hero inside 996px white section. */
function RoboAdvisoryHeroDesktop({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
  onFilterClick,
}: {
  plans: RoboAdvisoryPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: RoboAdvisoryPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
  onFilterClick: () => void;
}) {
  const t = useT();
  return (
    <div className="relative flex w-full flex-col items-center bg-gradient-to-t from-white to-[#063f84] px-14 pb-12">
      <div
        className="pointer-events-none absolute top-0 left-[214px] h-[347px] w-[768px] overflow-hidden"
        aria-hidden
      >
        <Image
          src={ROBO_ASSETS.detailChartBg}
          alt=""
          fill
          className="object-cover object-left-top"
          sizes="768px"
        />
      </div>

      <div className="relative z-10 flex w-full items-center gap-6 px-10 py-8">
        <div className="relative h-[153px] w-[101px] shrink-0">
          <Image
            src={ROBO_ASSETS.roboIllustration}
            alt=""
            fill
            priority
            className="pointer-events-none object-contain object-bottom"
          />
        </div>
        <div className="flex min-w-0 flex-[1_0_0] flex-col gap-2 text-white">
          <p className="text-2xl leading-9 font-bold">Robo Advisory</p>
          <p className="text-base leading-[24px]">{t.products.advisory.robo.tagline.full}</p>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-4">
        <AdvisoryClientBar state={advisory} />
        <div className="flex w-full items-center justify-between">
          <p className="text-base leading-[28px] font-bold text-white">
            {t.products.advisory.allPlans(plans.length)}
          </p>
          {SHOW_ROBO_FILTER_BUTTON ? (
            <Button
              variant="outline-black"
              size="icon-sm"
              aria-label={t.products.common.filter}
              onClick={onFilterClick}
            >
              <FunnelSimpleIcon size={18} />
            </Button>
          ) : null}
        </div>

        <div className="flex w-full items-stretch gap-3">
          {plans.length === 0
            ? empty
            : plans.map((plan) => (
                <RoboPlanCard
                  key={plan.id}
                  plan={plan}
                  client={client}
                  onDetailsClick={() => onPlanDetails(plan)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

/** Figma 33787:149486 — 996px column; breadcrumb from layout, desktop back bar in-page. */
export function RoboAdvisoryDetail({ onBack }: { onBack?: () => void }) {
  const [detailPlan, setDetailPlan] = useState<RoboAdvisoryPlan | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<RoboAdvisoryFilters>(EMPTY_ROBO_ADVISORY_FILTERS);
  const { data: plans, isLoading: plansLoading } = useRoboAdvisoryPlans();
  const { isLoading: clientsLoading } = useClientsResource();
  const filteredPlans = filterRoboAdvisoryPlans(plans, filters);
  const advisory = useAdvisoryClient("robo");
  const client = advisory.client;
  // Every plan filtered away reads differently from there being none.
  const plansEmpty = (
    <AdvisoryPlansEmpty
      onClearFilters={plans.length > 0 ? () => setFilters(EMPTY_ROBO_ADVISORY_FILTERS) : undefined}
    />
  );

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  // Whole page stands as a skeleton until the plans and the client list are
  // in — otherwise the picker would open over an empty list (no client yet).
  if (plansLoading || clientsLoading) {
    return (
      <AdvisoryDetailSkeleton
        cards={2}
        stats={4}
        cardMinHeightClass="min-h-[302px]"
        showFilterButton={SHOW_ROBO_FILTER_BUTTON}
      />
    );
  }

  return (
    <div className="flex w-full flex-1 flex-col max-lg:min-h-[calc(var(--dvh)*100-60px)] max-lg:overflow-x-clip max-lg:bg-white lg:bg-[#f9fafb] lg:pt-2 lg:pb-20">
      <div className="flex min-h-[calc(var(--dvh)*100-60px)] w-full flex-1 flex-col lg:hidden">
        <RoboAdvisoryMobileBreadcrumb />
        {client ? (
          <>
            <div className="md:hidden">
              <RoboAdvisoryHeroMobile
                plans={filteredPlans}
                advisory={advisory}
                client={client}
                onPlanDetails={setDetailPlan}
                empty={plansEmpty}
                onFilterClick={() => setFiltersOpen(true)}
              />
            </div>
            <div className="hidden md:block">
              <RoboAdvisoryHeroTablet
                plans={filteredPlans}
                advisory={advisory}
                client={client}
                onPlanDetails={setDetailPlan}
                empty={plansEmpty}
                onFilterClick={() => setFiltersOpen(true)}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="mx-auto hidden w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:flex lg:px-0">
        {onBack ? <DesktopBackHeader onBack={onBack} /> : null}

        {client ? (
          <div
            className="w-full overflow-clip rounded-xl bg-white"
            style={{ boxShadow: SECTION_SHADOW }}
          >
            <RoboAdvisoryHeroDesktop
              plans={filteredPlans}
              advisory={advisory}
              client={client}
              onPlanDetails={setDetailPlan}
              empty={plansEmpty}
              onFilterClick={() => setFiltersOpen(true)}
            />
          </div>
        ) : null}
      </div>

      <AdvisoryClientPicker state={advisory} onDismissWithoutClient={onBack} />

      <RoboAdvisoryFilterModal
        open={filtersOpen}
        filters={filters}
        onClose={() => setFiltersOpen(false)}
        onApply={(nextFilters) => {
          setFilters(nextFilters);
          setFiltersOpen(false);
        }}
      />

      <RoboAdvisoryPlanDetailModal
        plan={detailPlan}
        open={detailPlan != null}
        onClose={() => setDetailPlan(null)}
        cta={client ? advisoryCta(client, "robo") : undefined}
        suitability={
          client && detailPlan ? planSuitability(client, detailPlan.riskTier) : undefined
        }
      />
    </div>
  );
}
