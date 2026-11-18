"use client";

import { Button, Tag } from "@sarunyu/system-one";
import { ArrowSquareOutIcon, CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { AdvisoryAccountStatus, AdvisoryCta, PlanSuitability } from "./portfolio-advisory-client";

/**
 * The two elevations a Portfolio Advisory detail page uses: one for a plan card
 * in the list, one for the sections around it.
 *
 * Authored once here rather than per page. `RoboAdvisoryDetail` and
 * `DefinitDetail` are the same page shape pointed at two products, and each
 * carried its own byte-identical copy of both values — which is how one of them
 * ends up restyled alone.
 *
 * CSS values rather than Tailwind classes because both pages apply them through
 * `style={{ boxShadow }}`; the catalog's class-based token is `stock-ui`'s
 * `CARD_SHADOW`, and the two are not interchangeable.
 */
export const PLAN_CARD_SHADOW =
  "0px 0px 1px rgba(102, 102, 102, 0.16), 0px 4px 4px rgba(102, 102, 102, 0.12)";
export const SECTION_SHADOW =
  "0px 1px 2px 0px rgba(0, 0, 0, 0.1), 0px 1px 3px 1px rgba(0, 0, 0, 0.05)";

/** Whether the client already holds an account with this service. */
export function AdvisoryAccountTag({ status }: { status: AdvisoryAccountStatus }) {
  const open = status === "open";
  return <Tag text={open ? "เปิดบัญชีแล้ว" : "ยังไม่เปิดบัญชี"} variant={open ? "green" : "gray"} size="small" />;
}

export function PlanSuitabilityBadge({ suitability }: { suitability: PlanSuitability }) {
  const suitable = suitability === "suitable";
  const Icon = suitable ? CheckCircleIcon : WarningCircleIcon;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-meta leading-[20px] ${
        suitable ? "bg-[#dcfce7] text-[#016630]" : "bg-[#fef3c6] text-[#973c00]"
      }`}
    >
      <Icon size={12} weight="fill" />
      {suitable ? "เหมาะกับลูกค้า" : "เกินระดับความเสี่ยง"}
    </span>
  );
}

/**
 * The per-plan action. Opens the external destination in a new tab so the IC
 * keeps the plan list they were comparing from.
 */
export function AdvisoryCtaButton({ cta, className }: { cta: AdvisoryCta; className?: string }) {
  return (
    <Button
      variant={cta.variant}
      size="lg"
      className={className}
      rightIcon={<ArrowSquareOutIcon size={18} />}
      onClick={() => window.open(cta.href, "_blank", "noopener,noreferrer")}
    >
      {cta.label}
    </Button>
  );
}
