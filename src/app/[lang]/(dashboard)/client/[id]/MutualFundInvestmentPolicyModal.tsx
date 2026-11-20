"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import { useT } from "@/i18n/I18nProvider";

/** Figma 37712:119199 / 39824:512747 — investment policy read-more modal */
export function MutualFundInvestmentPolicyModal({
  open,
  policy,
  onClose,
}: {
  open: boolean;
  policy: string;
  onClose: () => void;
}) {
  const t = useT();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={t.fund.detail.investmentPolicy}
        showHandle
        rightSide="action"
        actionLabel={t.common.close}
        onActionClick={onClose}
        contentClassName="flex max-h-[calc(var(--dvh)*100-10rem)] flex-col overflow-y-auto pt-0 pb-10"
      >
        <p className="text-sm leading-[24px] whitespace-pre-wrap text-[#4a5565]">{policy}</p>
      </BottomSheet>
    );
  }

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
          title={t.fund.detail.investmentPolicy}
          showClose
          onClose={onClose}
          actionLayout="none"
          className="w-[calc(var(--vw)*100-3rem)] !max-w-[460px]"
        >
          <div className="max-h-[260px] overflow-y-auto">
            <p className="text-sm leading-[24px] whitespace-pre-wrap text-[#4a5565]">{policy}</p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
