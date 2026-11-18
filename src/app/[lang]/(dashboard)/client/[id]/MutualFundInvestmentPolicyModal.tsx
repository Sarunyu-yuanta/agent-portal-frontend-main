"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";

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
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title="นโยบายการลงทุน"
        showHandle
        rightSide="action"
        actionLabel="Close"
        onActionClick={onClose}
        contentClassName="flex max-h-[calc(var(--dvh)*100-10rem)] flex-col overflow-y-auto pt-0 pb-10"
      >
        <p className="text-sm leading-[24px] text-[#4a5565] whitespace-pre-wrap">{policy}</p>
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
          title="นโยบายการลงทุน"
          showClose
          onClose={onClose}
          actionLayout="none"
          className="!max-w-[460px] w-[calc(var(--vw)*100-3rem)]"
        >
          <div className="max-h-[260px] overflow-y-auto">
            <p className="text-sm leading-[24px] text-[#4a5565] whitespace-pre-wrap">{policy}</p>
          </div>
        </Modal>
      </div>
    </div>
  );
}
