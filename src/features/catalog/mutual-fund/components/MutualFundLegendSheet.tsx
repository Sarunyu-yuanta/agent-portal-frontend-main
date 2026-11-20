"use client";

import Image from "next/image";
import { BottomSheet, Modal } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";
import { MF_ASSETS } from "@/features/catalog/mutual-fund/lib/mutual-fund-assets";
import { useT } from "@/i18n/I18nProvider";

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
    <div className="flex w-full flex-col items-start gap-0.5 rounded-xl bg-[#f9fafb] py-2.5 pr-4 pl-3">
      <div className="flex items-center gap-1.5">
        <p className="text-sm leading-[24px] font-bold text-[#101828]">{label}</p>
        <div className={`flex items-center gap-0.5 rounded px-1 py-0.5 ${tagClassName}`}>
          <Image src={icon} alt="" width={14} height={14} className="size-3.5 shrink-0" />
          <span className={`text-micro leading-[18px] whitespace-nowrap ${tagTextClassName}`}>
            {label}
          </span>
        </div>
      </div>
      <p className="text-sm leading-[24px] font-normal text-[#6a7282]">{description}</p>
    </div>
  );
}

function MutualFundLegendContent() {
  const t = useT();
  return (
    <div className="flex w-full flex-col gap-4">
      <LegendRow
        icon={MF_ASSETS.performersTagView}
        label={t.fund.tags.view}
        tagClassName="bg-[#f6f3ef]"
        tagTextClassName="text-[#935737]"
        description={t.fund.legend.viewDescription}
      />
      <LegendRow
        icon={MF_ASSETS.performersTagHighlight}
        label={t.fund.tags.highlight}
        tagClassName="bg-[#eff6ff]"
        tagTextClassName="text-[#0a6ee7]"
        description={t.fund.legend.highlightDescription}
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
  const t = useT();
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t.fund.legend.title}
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
export function MutualFundLegendModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
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
          title={t.fund.legend.title}
          showClose
          onClose={onClose}
          className="w-[calc(var(--vw)*100-3rem)] !max-w-[440px]"
        >
          <MutualFundLegendContent />
        </Modal>
      </div>
    </div>
  );
}
