"use client";

import Image from "next/image";
import { BottomSheet, Modal } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";
import { MF_ASSETS } from "./mutual-fund-assets";

const LEGEND_TITLE = "คำอธิบายสถานะการแนะนำกองทุน";

function LegendRow({
  icon,
  label,
  tagClassName,
  tagTextClassName,
  description,
}: {
  icon: string;
  label: string;
  tagClassName: string;
  tagTextClassName: string;
  description: string;
}) {
  return (
    <div className="flex w-full flex-col items-start gap-0.5 rounded-xl bg-[#f9fafb] py-2.5 pl-3 pr-4">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-bold leading-[24px] text-[#101828]">{label}</p>
        <div className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${tagClassName}`}>
          <Image src={icon} alt="" width={14} height={14} className="size-3.5 shrink-0" />
          <span className={`text-micro leading-[18px] whitespace-nowrap ${tagTextClassName}`}>{label}</span>
        </div>
      </div>
      <p className="text-sm font-normal leading-[24px] text-[#6a7282]">{description}</p>
    </div>
  );
}

function MutualFundLegendContent() {
  return (
    <div className="flex w-full flex-col gap-4">
      <LegendRow
        icon={MF_ASSETS.performersTagView}
        label="View"
        tagClassName="bg-[#f6f3ef]"
        tagTextClassName="text-[#935737]"
        description="แสดงกองทุนแนะนำตามมุมมองของ CIO Office ที่วิเคราะห์จากแนวโน้มเศรษฐกิจและทิศทางสินทรัพย์"
      />
      <LegendRow
        icon={MF_ASSETS.performersTagHighlight}
        label="Highlight"
        tagClassName="bg-[#eff6ff]"
        tagTextClassName="text-[#0a6ee7]"
        description="แสดงกองทุนแนะนำตามทีมผลิตภัณฑ์กองทุนของ Yuanta"
      />
    </div>
  );
}

/** Figma 40555:363444 — "ดูคำอธิบาย" legend explainer, mobile bottom sheet. */
export function MutualFundLegendBottomSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={LEGEND_TITLE}
      showHandle
      showHeader
      rightSide="icon"
      rightIcon={<XIcon size={18} weight="bold" />}
      contentClassName="pb-6"
    >
      <MutualFundLegendContent />
    </BottomSheet>
  );
}

/** Figma 40555:363444 — "ดูคำอธิบาย" legend explainer, desktop centered modal. */
export function MutualFundLegendModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-[2px]"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div onMouseDown={(e) => e.stopPropagation()}>
        <Modal
          variant="content"
          title={LEGEND_TITLE}
          showClose
          onClose={onClose}
          className="!max-w-[440px] w-[calc(var(--vw)*100-3rem)]"
        >
          <MutualFundLegendContent />
        </Modal>
      </div>
    </div>
  );
}
