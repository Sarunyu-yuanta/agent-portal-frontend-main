"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import { Alert, BottomSheet, Button, Modal, useIsMobile } from "@sarunyu/system-one";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import { AllocationDonut } from "@/components/allocation-donut";
import { AdvisoryCtaButton, PlanSuitabilityBadge } from "./portfolio-advisory-ui";
import type { AdvisoryCta, PlanSuitability } from "./portfolio-advisory-client";
import type { DefinitPlan } from "./definit-plan-data";
import {
  definitPlanToDetailView,
  roboPlanToDetailView,
  type PlanDetailSummary,
  type PortfolioAdvisoryPlanDetailView,
} from "./portfolio-advisory-plan-detail-view";
import { ROBO_ASSETS } from "./robo-advisory-assets";
import type { RoboAdvisoryPlan } from "./robo-advisory-plan-data";
import { RoboRiskLevel } from "./RoboRiskLevel";

/** Figma 33787:150208 / 34315:86459 — desktop body px-36; cancel library Modal body px-4 (16px). */
const MODAL_BODY_BLEED = "-mx-4";
const MODAL_BODY_PX_DESKTOP = "px-9";
const MODAL_BODY_PX_MOBILE = "px-3";

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
          <p className="mb-0 text-xs font-bold leading-[20px] text-[#101828]">{labelLines[0]}</p>
          <p className="text-xs font-bold leading-[20px] text-[#101828]">{labelLines[1]}</p>
        </div>
        <p className={`whitespace-nowrap text-xs leading-[20px] ${valueClassName ?? "text-[#4a5565]"}`}>{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  iconSrc,
  title,
  children,
}: {
  iconSrc: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full gap-3 rounded-lg bg-[#f9fafb] px-3 py-2">
      <Image src={iconSrc} alt="" width={24} height={24} className="size-6 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-[24px] text-[#101828]">{title}</p>
        {children}
      </div>
    </div>
  );
}

function ModalBodyPadding({ isMobile, children }: { isMobile: boolean; children: ReactNode }) {
  return <div className={`pb-6 pt-4 ${isMobile ? "" : MODAL_BODY_PX_DESKTOP}`}>{children}</div>;
}

function DownloadDocumentsButton({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      size="lg"
      leftIcon={<DownloadSimpleIcon size={20} />}
      className={className ?? "shrink-0"}
    >
      ดาวน์โหลดเอกสารเพิ่มเติม
    </Button>
  );
}

function PlanSummary({ summary }: { summary: PlanDetailSummary }) {
  if (summary.kind === "paragraph") {
    return <p className="text-sm leading-[24px] text-[#4a5565]">{summary.text}</p>;
  }

  return (
    <div className="text-sm leading-[24px] text-[#4a5565]">
      <p className="mb-0 whitespace-pre-wrap">{summary.intro}</p>
      <ol className="list-decimal pl-[21px]">
        {summary.factors.map((factor) => (
          <li key={factor} className="mb-0 last:mb-0">
            {factor}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlanDetailContent({
  plan,
  isMobile,
  suitability,
}: {
  plan: PortfolioAdvisoryPlanDetailView;
  isMobile: boolean;
  suitability?: PlanSuitability;
}) {
  const { detail, presentation } = plan;
  const drawdownColor = presentation.showDividendStat ? "text-[#c10007]" : "text-[#fb2c36]";

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-1">
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0 flex flex-1 flex-col gap-1">
            <p className="text-micro leading-[18px] text-black/60">{plan.provider}</p>
            <p className="bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-lg font-bold leading-[28px] text-transparent">
              {plan.name}
            </p>
          </div>
          {!isMobile ? <DownloadDocumentsButton /> : null}
        </div>
        <PlanSummary summary={plan.summary} />
        <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
          <RoboRiskLevel tier={plan.riskTier} />
          {suitability ? <PlanSuitabilityBadge suitability={suitability} /> : null}
          <div className="flex min-w-0 flex-[1_0_0] items-center justify-end gap-1 whitespace-nowrap">
            <p className="text-xs font-bold leading-[20px] text-black/75">Available Room</p>
            <p className="text-xs leading-[20px] text-black/60">{plan.availableRoom}</p>
          </div>
        </div>
      </div>

      <div className="flex w-full items-end">
        <StatItem iconSrc={ROBO_ASSETS.iconMoney} labelLines={["เงินตั้งต้น", "ขั้นต่ำ (บาท)"]} value={plan.minInvestment} />
        <div className="h-[58px] w-px shrink-0 bg-black/10" />
        <StatItem iconSrc={ROBO_ASSETS.iconClock} labelLines={["ระยะเวลา", "ถือครอง"]} value={plan.holdingPeriod} />
        {presentation.showDividendStat && plan.dividendPerYear ? (
          <>
            <div className="h-[58px] w-px shrink-0 bg-black/10" />
            <StatItem
              iconSrc={ROBO_ASSETS.iconHandCoins}
              labelLines={["เงินปันผล", "ต่อปี"]}
              value={plan.dividendPerYear}
              labelWidth={50}
            />
          </>
        ) : null}
        <div className="h-[58px] w-px shrink-0 bg-black/10" />
        <StatItem
          iconSrc={ROBO_ASSETS.iconChartLineDown}
          labelLines={["Max ", "Drawdown "]}
          value={plan.maxDrawdown}
          valueClassName={drawdownColor}
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <DetailRow iconSrc={ROBO_ASSETS.modalIconHeadCircuit} title="Trading style:">
          <p className="text-sm leading-[24px] text-[#4a5565]">{detail.tradingStyle}</p>
        </DetailRow>
        {presentation.showMarketTiming ? (
          <DetailRow iconSrc={ROBO_ASSETS.modalIconClockAfternoon} title="Market Timing">
            <p className="text-sm leading-[24px] text-[#4a5565]">{detail.marketTiming}</p>
          </DetailRow>
        ) : null}
        <DetailRow iconSrc={ROBO_ASSETS.modalIconTimer} title="Timing">
          <p className="text-sm leading-[24px] text-[#4a5565]">{detail.timing}</p>
        </DetailRow>
        <DetailRow iconSrc={ROBO_ASSETS.modalIconMoneyWavy} title="ยอดขั้นต่ำสำหรับการเพิ่มทุน (ต่อครั้ง)">
          <p className="text-sm leading-[24px] text-[#4a5565]">{detail.topUpMin}</p>
        </DetailRow>
        <DetailRow iconSrc={ROBO_ASSETS.modalIconBrain} title="Knowledge style:">
          <ul className="list-disc pl-5 text-sm leading-[24px] text-[#4a5565]">
            {detail.knowledgeStyles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DetailRow>
        <DetailRow iconSrc={ROBO_ASSETS.modalIconSealCheck} title="แผนที่เหมาะกับนักลงทุนแบบไหน:">
          <ul className="list-disc pl-5 text-sm leading-[24px] text-[#4a5565]">
            {detail.targetInvestors.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DetailRow>

        <div
          className="w-full overflow-hidden rounded-lg bg-white"
          style={{
            boxShadow:
              "0px 0px 2px rgba(102, 102, 102, 0.16), 0px 4px 8px rgba(102, 102, 102, 0.12)",
          }}
        >
          <div className="bg-[#f3f4f6] px-3 py-2">
            <p className="text-sm font-bold leading-[24px] text-[#101828]">สัดส่วนการลงทุน</p>
          </div>
          <div className="flex flex-col items-center gap-3 px-3 pb-4 pt-3">
            <p className="w-full text-xs leading-[20px] text-[#4a5565]">การลงทุนทั้งหมด = 100%</p>
            <div className="flex w-full items-center justify-between px-2 max-sm:flex-col max-sm:gap-4">
              <AllocationDonut slices={detail.allocation} className="size-[120px]" />
              <div className="flex flex-col gap-2">
                {detail.allocation.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    <div className="flex w-[115px] items-center gap-1 px-2 py-1">
                      <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs leading-[20px] text-[#4a5565]">{item.label}</span>
                    </div>
                    <span className="text-xs leading-[20px] text-[#4a5565]">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className="flex items-center gap-1">
          <p className="text-sm font-bold leading-[24px] text-[#101828]">ค่าธรรมเนียม</p>
          <Image src={ROBO_ASSETS.modalIconInfo} alt="" width={16} height={16} className="size-4 shrink-0" />
        </div>
        <div className="flex w-full flex-col gap-1">
          <div className="overflow-hidden rounded-lg bg-[#eff6ff]">
            {detail.fees.map((fee, index) => (
              <div
                key={fee.label}
                className={`flex items-center gap-1 p-2 ${
                  index < detail.fees.length - 1 ? "border-b border-dashed border-black/10" : ""
                }`}
              >
                <p className="min-w-0 flex-1 text-xs leading-[20px] text-[#101828]">{fee.label}</p>
                <p className="shrink-0 text-sm font-bold leading-[24px] text-[#0a6ee7]">{fee.value}</p>
              </div>
            ))}
          </div>
          {presentation.showFeeFootnote && detail.feeFootnote ? (
            <p className="text-micro leading-[18px] text-[#4a5565]">{detail.feeFootnote}</p>
          ) : null}
        </div>
      </div>

      <Alert status="warning" message={detail.accountOpeningNote} className="w-full" />

      {isMobile ? <DownloadDocumentsButton className="w-full" /> : null}
    </div>
  );
}

/** Pinned below the scroll area so the CTA stays reachable however long the plan is. */
function PlanDetailFooter({ cta, paddingClassName }: { cta: AdvisoryCta; paddingClassName: string }) {
  return (
    <div className={`shrink-0 border-t border-black/10 bg-white py-4 ${paddingClassName}`}>
      <AdvisoryCtaButton cta={cta} className="w-full" />
    </div>
  );
}

/** Shared plan detail modal — Robo Advisory (33787:150203) & Definit (34315:86458). */
export function PortfolioAdvisoryPlanDetailModal({
  plan,
  open,
  onClose,
  cta,
  suitability,
}: {
  plan: PortfolioAdvisoryPlanDetailView | null;
  open: boolean;
  onClose: () => void;
  cta?: AdvisoryCta;
  suitability?: PlanSuitability;
}) {
  const isMobile = useIsMobile();

  if (!plan) return null;

  const content = (
    <ModalBodyPadding isMobile={isMobile}>
      <PlanDetailContent plan={plan} isMobile={isMobile} suitability={suitability} />
    </ModalBodyPadding>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title="รายละเอียด"
        showHandle
        rightSide="action"
        actionLabel="Close"
        onActionClick={onClose}
        contentClassName={`flex max-h-[calc(var(--dvh)*100-10rem)] flex-col overflow-hidden ${MODAL_BODY_BLEED} pt-0`}
      >
        <div className={`min-h-0 flex-1 overflow-y-auto ${MODAL_BODY_PX_MOBILE}`}>{content}</div>
        {cta ? <PlanDetailFooter cta={cta} paddingClassName={MODAL_BODY_PX_MOBILE} /> : null}
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="max-h-[calc(var(--vh)*100-8rem)] w-full max-w-[720px] overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <Modal
          variant="content"
          title="รายละเอียด"
          showClose
          onClose={onClose}
          actionLayout="none"
          className="!max-w-[720px] w-full"
        >
          {/* -mb-6 cancels Modal's own body padding so the footer sits on the modal's bottom edge. */}
          <div className={`${MODAL_BODY_BLEED} ${cta ? "-mb-6" : ""} flex flex-col`}>
            <div
              className={`${cta ? "max-h-[calc(var(--vh)*100-19rem)]" : "max-h-[calc(var(--vh)*100-14rem)]"} overflow-y-auto [scrollbar-gutter:stable]`}
            >
              {content}
            </div>
            {cta ? <PlanDetailFooter cta={cta} paddingClassName={MODAL_BODY_PX_DESKTOP} /> : null}
          </div>
        </Modal>
      </div>
    </div>
  );
}

/** Opens from Robo Advisory plan card "รายละเอียด". */
export function RoboAdvisoryPlanDetailModal({
  plan,
  open,
  onClose,
  cta,
  suitability,
}: {
  plan: RoboAdvisoryPlan | null;
  open: boolean;
  onClose: () => void;
  cta?: AdvisoryCta;
  suitability?: PlanSuitability;
}) {
  return (
    <PortfolioAdvisoryPlanDetailModal
      plan={plan ? roboPlanToDetailView(plan) : null}
      open={open}
      onClose={onClose}
      cta={cta}
      suitability={suitability}
    />
  );
}

/** Opens from Definit plan card "รายละเอียด". */
export function DefinitPlanDetailModal({
  plan,
  open,
  onClose,
  cta,
  suitability,
}: {
  plan: DefinitPlan | null;
  open: boolean;
  onClose: () => void;
  cta?: AdvisoryCta;
  suitability?: PlanSuitability;
}) {
  return (
    <PortfolioAdvisoryPlanDetailModal
      plan={plan ? definitPlanToDetailView(plan) : null}
      open={open}
      onClose={onClose}
      cta={cta}
      suitability={suitability}
    />
  );
}
