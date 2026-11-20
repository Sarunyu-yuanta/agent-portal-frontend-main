"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import { useAppPathname } from "@/i18n/navigation";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { ResponsiveBreadcrumb } from "@/features/shell/components/ResponsiveBreadcrumb";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useDefinitPlans } from "@/features/catalog/hooks/use-catalog";
import { usePageBreadcrumb } from "@/features/shell/lib/page-breadcrumbs";
import {
  AdvisoryClientBar,
  AdvisoryClientPicker,
  useAdvisoryClient,
  type AdvisoryClientState,
} from "./AdvisoryClientBar";
import {
  advisoryCta,
  planSuitability,
} from "@/features/catalog/robo-advisory/lib/portfolio-advisory-client";
import {
  AdvisoryCtaButton,
  PLAN_CARD_SHADOW,
  PlanSuitabilityBadge,
  SECTION_SHADOW,
} from "./portfolio-advisory-ui";
import type { DefinitPlan } from "@/features/catalog/robo-advisory/lib/definit-plan-data";
import { AdvisoryDetailSkeleton } from "./AdvisoryDetailSkeleton";
import { DefinitPlanDetailModal } from "./RoboAdvisoryPlanDetailModal";
import { ROBO_ASSETS } from "@/features/catalog/robo-advisory/lib/robo-advisory-assets";
import { RoboRiskLevel } from "./RoboRiskLevel";
import { AdvisoryPlansEmpty } from "./AdvisoryPlansEmpty";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import { useClients, useClientsResource } from "@/features/clients/hooks/use-clients";

const DEFINIT_PROVIDER = "Definit x Yuanta";
/** Figma 34315:85739 — DSS has 3 list items; DGS reserves empty 3rd row height. */
const DEFINIT_FACTOR_SLOTS = 3;
const DEFINIT_FACTOR_LINE_HEIGHT_PX = 20;

/** Figma 34315:85721 — Definit hero gradient. */
const DEFINIT_HERO_BG = "bg-gradient-to-t from-white to-[#4886e0]";

/**
 * Figma 34315:85741 — nested blend on #4886e0 gradient:
 * candlesticks hard-light 20%, line chart color-dodge 20%.
 */
function DefinitChartOverlay({ layout }: { layout: "mobile" | "tablet" | "desktop" }) {
  const lineObjectPosition =
    layout === "tablet"
      ? "object-right-top"
      : layout === "mobile"
        ? "object-[32%_top]"
        : "object-left-top";

  const containerClassName =
    layout === "desktop"
      ? "pointer-events-none absolute left-0 top-0 h-[347px] w-[768px] overflow-hidden mix-blend-color-dodge"
      : "pointer-events-none absolute inset-x-0 top-0 overflow-hidden mix-blend-color-dodge";

  const containerStyle =
    layout === "desktop" ? undefined : { height: layout === "tablet" ? 347 : 280 };

  return (
    <div className={containerClassName} style={containerStyle} aria-hidden>
      <div
        className={`absolute inset-0 ${layout === "desktop" ? "left-[8.53px]" : ""} opacity-20 mix-blend-hard-light`}
      >
        <Image
          src={ROBO_ASSETS.definitCandlesticksBg}
          alt=""
          fill
          priority={layout !== "desktop"}
          sizes={layout === "desktop" ? "768px" : "100vw"}
          className="object-cover object-left-bottom"
        />
      </div>
      <div
        className={`absolute left-0 w-full opacity-20 mix-blend-color-dodge ${layout === "desktop" ? "top-[29.56px] h-[306px]" : "inset-0"}`}
      >
        <Image
          src={ROBO_ASSETS.definitLineChartBg}
          alt=""
          fill
          priority={layout !== "desktop"}
          sizes={layout === "desktop" ? "768px" : "100vw"}
          className={`object-cover ${lineObjectPosition}`}
        />
      </div>
    </div>
  );
}

function DefinitMobileBreadcrumb() {
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
      <h1 className="shrink-0 text-lg leading-[28px] font-bold text-black">Definit x Yuanta</h1>
    </div>
  );
}

function DefinitStatItem({
  iconSrc,
  labelLines,
  labelSingle,
  value,
  valueClassName,
  compact,
}: {
  iconSrc: string;
  labelLines?: [string, string];
  labelSingle?: string;
  value: string;
  valueClassName?: string;
  compact?: boolean;
}) {
  const labelClassName = compact
    ? "text-center text-xs font-bold leading-[20px] text-[#101828]"
    : "text-center text-sm font-bold leading-[24px] text-[#101828]";
  const valueTextClassName = compact ? "text-xs leading-[20px]" : "text-sm leading-[24px]";

  return (
    <div className="flex min-w-0 flex-[1_0_0] flex-col items-center gap-1">
      <div className="flex shrink-0 items-center justify-center rounded-full bg-[#eff6ff] p-2.5">
        <Image src={iconSrc} alt="" width={20} height={20} className="size-5 shrink-0" />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        {compact && labelSingle ? (
          <p className={labelClassName}>{labelSingle}</p>
        ) : (
          <p className={labelClassName}>
            {labelLines?.[0]}
            <br />
            {labelLines?.[1]}
          </p>
        )}
        <p
          className={`whitespace-nowrap ${valueTextClassName} ${valueClassName ?? "text-[#4a5565]"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function DefinitPlanDescription({ plan }: { plan: DefinitPlan }) {
  return (
    <div className="text-sm leading-[24px] text-[#4a5565]">
      <p className="mb-0">{plan.intro}</p>
      <ol
        className="list-decimal pl-[21px]"
        style={{ minHeight: DEFINIT_FACTOR_SLOTS * DEFINIT_FACTOR_LINE_HEIGHT_PX }}
      >
        {plan.factors.map((factor) => (
          <li key={factor} className="mb-0 last:mb-0">
            {factor}
          </li>
        ))}
      </ol>
    </div>
  );
}

type DefinitPlanCardLayout = "mobile" | "tablet" | "desktop";

/** Figma 34068:65795 tablet px-24 py-16 (567071); 34315:85739 desktop px-24 py-16 (567116). */
function DefinitPlanCard({
  plan,
  client,
  onDetailsClick,
  layout = "desktop",
}: {
  plan: DefinitPlan;
  client: Client;
  onDetailsClick: () => void;
  layout?: DefinitPlanCardLayout;
}) {
  const t = useT();
  const stats = t.products.advisory.stats;
  const isCompact = layout !== "desktop";
  const paddingClassName =
    layout === "mobile" ? "p-4" : layout === "tablet" ? "px-6 py-4" : "px-6 py-4";

  return (
    <div
      className={`box-border flex h-full w-full flex-col gap-4 rounded-lg bg-white ${paddingClassName} ${layout === "desktop" ? "lg:min-w-0 lg:flex-[1_0_0]" : "max-lg:h-auto"}`}
      style={{ boxShadow: PLAN_CARD_SHADOW }}
    >
      <div className="flex w-full flex-1 flex-col gap-4">
        <div className="flex w-full flex-1 flex-col gap-2">
          <div className={`flex w-full flex-1 flex-col ${isCompact ? "gap-1" : "gap-2"}`}>
            <div className="flex flex-col gap-1 pt-1">
              <p
                className={
                  isCompact
                    ? "text-micro leading-[18px] text-[#4a5565]"
                    : "text-xs leading-[20px] text-[#4a5565]"
                }
              >
                {DEFINIT_PROVIDER}
              </p>
              <p className="bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-lg leading-[28px] font-bold text-transparent">
                {plan.name}
              </p>
            </div>
            <DefinitPlanDescription plan={plan} />
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <RoboRiskLevel tier={plan.riskTier} />
            <PlanSuitabilityBadge suitability={planSuitability(client, plan.riskTier)} />
            <div className="flex min-w-0 flex-1 items-center justify-end gap-1 whitespace-nowrap">
              <p
                className={
                  isCompact
                    ? "text-xs leading-[20px] font-bold text-[#101828]"
                    : "text-sm leading-[24px] font-bold text-[#101828]"
                }
              >
                Available Room
              </p>
              <p
                className={
                  isCompact
                    ? "text-xs leading-[20px] text-[#4a5565]"
                    : "text-sm leading-[24px] text-[#4a5565]"
                }
              >
                {plan.availableRoom}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full items-end">
          <DefinitStatItem
            iconSrc={ROBO_ASSETS.iconMoney}
            labelLines={stats.minInvestmentLines}
            labelSingle={stats.minInvestment}
            value={plan.minInvestment}
            compact={isCompact}
          />
          <div className="h-[58px] w-px shrink-0 bg-black/10" />
          <DefinitStatItem
            iconSrc={ROBO_ASSETS.iconClock}
            labelLines={stats.holdingPeriodLines}
            labelSingle={stats.holdingPeriod}
            value={plan.holdingPeriod}
            compact={isCompact}
          />
          <div className="h-[58px] w-px shrink-0 bg-black/10" />
          <DefinitStatItem
            iconSrc={ROBO_ASSETS.iconChartLineDown}
            labelLines={["Max ", "Drawdown "]}
            labelSingle="Max Drawdown "
            value={plan.maxDrawdown}
            valueClassName="text-[#fb2c36]"
            compact={isCompact}
          />
        </div>
      </div>

      <div className="flex w-full shrink-0 flex-wrap items-center justify-between gap-2">
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
        <AdvisoryCtaButton cta={advisoryCta(client, "definit")} className="shrink-0" />
      </div>
    </div>
  );
}

/** Figma 34315:85727 — definit-finno.png composite, full bleed on hero right. */
function DefinitHeroDecoration({ compact }: { compact?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute overflow-visible ${compact ? "top-2 right-0 h-[120px] w-[160px] md:h-[150px] md:w-[200px]" : "top-[30px] right-0 hidden h-[180px] w-[min(420px,45%)] lg:block"}`}
      aria-hidden
    >
      <Image
        src={ROBO_ASSETS.definitFinno}
        alt=""
        fill
        priority={!compact}
        className="object-contain object-right-top mix-blend-screen"
        sizes={compact ? "200px" : "420px"}
      />
    </div>
  );
}

function DefinitHeroMobile({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
}: {
  plans: DefinitPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: DefinitPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
}) {
  const t = useT();
  // Figma mobile — compact hero lines.
  const DEFINIT_MOBILE_HERO_LINES = t.products.advisory.definit.tagline.heroMobile;
  return (
    <div
      className={`relative flex w-full flex-1 flex-col items-center overflow-x-clip pb-20 ${DEFINIT_HERO_BG}`}
    >
      <DefinitChartOverlay layout="mobile" />
      <div className="relative z-10 flex min-h-[170px] w-full shrink-0 flex-col justify-center py-4 pr-4 pl-5">
        <DefinitHeroDecoration compact />
        <div className="relative flex max-w-[75%] min-w-0 flex-col gap-2 text-white">
          <p className="text-2xl leading-9 font-bold">Definit x Yuanta</p>
          <div className="w-full text-sm leading-[24px]">
            {DEFINIT_MOBILE_HERO_LINES.map((line, index) => (
              <p
                key={line}
                className={index < DEFINIT_MOBILE_HERO_LINES.length - 1 ? "mb-0" : undefined}
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
        <div className="flex w-full items-center px-4">
          <p className="text-base leading-[28px] font-bold text-white">
            {t.products.advisory.allPlans(plans.length)}
          </p>
        </div>
        <div className="flex w-[343px] max-w-[calc(100%-32px)] flex-col gap-3">
          {plans.length === 0
            ? empty
            : plans.map((plan) => (
                <DefinitPlanCard
                  key={plan.id}
                  plan={plan}
                  client={client}
                  layout="mobile"
                  onDetailsClick={() => onPlanDetails(plan)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function DefinitHeroTablet({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
}: {
  plans: DefinitPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: DefinitPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
}) {
  const t = useT();
  // Figma 34315:85726 — desktop hero subtitle (2 lines).
  const DEFINIT_HERO_DESCRIPTION_LINES = t.products.advisory.definit.tagline.heroDesktop;
  return (
    <div
      className={`relative flex min-h-[910px] w-full flex-1 flex-col gap-3 overflow-x-clip pb-20 ${DEFINIT_HERO_BG}`}
    >
      <DefinitChartOverlay layout="tablet" />
      <div className="relative z-10 flex min-h-[170px] w-full shrink-0 flex-col justify-center px-8 py-6">
        <DefinitHeroDecoration compact />
        <div className="relative flex max-w-[65%] min-w-0 flex-col gap-2 text-white">
          <p className="text-2xl leading-9 font-bold">Definit x Yuanta</p>
          <p className="text-base leading-[24px]">{DEFINIT_HERO_DESCRIPTION_LINES.join(" ")}</p>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-col gap-4 px-8">
        <AdvisoryClientBar state={advisory} />
        <div className="flex w-full items-center">
          <p className="text-base leading-[28px] font-bold text-white">
            {t.products.advisory.allPlans(plans.length)}
          </p>
        </div>
        <div className="flex w-full flex-col gap-4">
          {plans.length === 0
            ? empty
            : plans.map((plan) => (
                <DefinitPlanCard
                  key={plan.id}
                  plan={plan}
                  client={client}
                  layout="tablet"
                  onDetailsClick={() => onPlanDetails(plan)}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

/** Figma 34315:85721 — 996px section, gradient to #4886e0. */
function DefinitHeroDesktop({
  plans,
  advisory,
  client,
  onPlanDetails,
  empty,
}: {
  plans: DefinitPlan[];
  advisory: AdvisoryClientState;
  client: Client;
  onPlanDetails: (plan: DefinitPlan) => void;
  /** Shown in place of the cards when `plans` is empty. */
  empty: ReactNode;
}) {
  const t = useT();
  // Figma 34315:85726 — desktop hero subtitle (2 lines).
  const DEFINIT_HERO_DESCRIPTION_LINES = t.products.advisory.definit.tagline.heroDesktop;
  return (
    <div
      className={`relative flex w-full flex-col items-center overflow-clip px-14 pb-12 ${DEFINIT_HERO_BG}`}
    >
      <DefinitChartOverlay layout="desktop" />
      <div className="relative z-10 flex w-full flex-col items-center">
        <div className="relative w-full shrink-0 py-8 pr-8">
          <DefinitHeroDecoration />
          <div className="relative flex max-w-[55%] min-w-0 flex-col gap-2 text-white">
            <p className="text-2xl leading-9 font-bold">Definit x Yuanta</p>
            <div className="text-base leading-[28px] font-bold">
              {DEFINIT_HERO_DESCRIPTION_LINES.map((line, index) => (
                <p
                  key={line}
                  className={index < DEFINIT_HERO_DESCRIPTION_LINES.length - 1 ? "mb-0" : undefined}
                >
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex w-full max-w-[884px] flex-col gap-4">
          <AdvisoryClientBar state={advisory} />
          <div className="flex w-full items-center">
            <p className="text-base leading-[28px] font-bold text-white">
              {t.products.advisory.allPlans(plans.length)}
            </p>
          </div>

          <div className="flex w-full items-stretch gap-6">
            {plans.length === 0
              ? empty
              : plans.map((plan) => (
                  <DefinitPlanCard
                    key={plan.id}
                    plan={plan}
                    client={client}
                    layout="desktop"
                    onDetailsClick={() => onPlanDetails(plan)}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Figma 34315:84889 — Definit x Yuanta detail from Portfolio Advisory tab. */
export function DefinitDetail({ onBack }: { onBack?: () => void }) {
  const [detailPlan, setDetailPlan] = useState<DefinitPlan | null>(null);
  const { data: plans, isLoading: plansLoading } = useDefinitPlans();
  const { isLoading: clientsLoading } = useClientsResource();
  const advisory = useAdvisoryClient("definit");
  const client = advisory.client;
  // Definit has no filter, so an empty list can only mean "no plans".
  const plansEmpty = <AdvisoryPlansEmpty />;

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
    return <AdvisoryDetailSkeleton cards={2} stats={3} cardMinHeightClass="min-h-[360px]" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col max-lg:min-h-[calc(var(--dvh)*100-60px)] max-lg:overflow-x-clip max-lg:bg-white lg:bg-[#f9fafb] lg:pt-2 lg:pb-20">
      <div className="flex min-h-[calc(var(--dvh)*100-60px)] w-full flex-1 flex-col lg:hidden">
        <DefinitMobileBreadcrumb />
        {client ? (
          <>
            <div className="md:hidden">
              <DefinitHeroMobile
                plans={plans}
                advisory={advisory}
                client={client}
                onPlanDetails={setDetailPlan}
                empty={plansEmpty}
              />
            </div>
            <div className="hidden md:block">
              <DefinitHeroTablet
                plans={plans}
                advisory={advisory}
                client={client}
                onPlanDetails={setDetailPlan}
                empty={plansEmpty}
              />
            </div>
          </>
        ) : null}
      </div>

      <div className="mx-auto hidden w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:flex lg:px-0">
        {onBack ? <DesktopBackHeader onBack={onBack} /> : null}

        {client ? (
          <div className="w-full overflow-clip rounded-xl" style={{ boxShadow: SECTION_SHADOW }}>
            <DefinitHeroDesktop
              plans={plans}
              advisory={advisory}
              client={client}
              onPlanDetails={setDetailPlan}
              empty={plansEmpty}
            />
          </div>
        ) : null}
      </div>

      <AdvisoryClientPicker state={advisory} onDismissWithoutClient={onBack} />

      <DefinitPlanDetailModal
        plan={detailPlan}
        open={detailPlan != null}
        onClose={() => setDetailPlan(null)}
        cta={client ? advisoryCta(client, "definit") : undefined}
        suitability={
          client && detailPlan ? planSuitability(client, detailPlan.riskTier) : undefined
        }
      />
    </div>
  );
}
