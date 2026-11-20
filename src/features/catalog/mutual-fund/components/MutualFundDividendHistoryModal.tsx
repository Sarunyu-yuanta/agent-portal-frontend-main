"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import type { MutualFundDividend } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { useT } from "@/i18n/I18nProvider";

function DividendHistoryTable({ rows }: { rows: MutualFundDividend[] }) {
  const t = useT();
  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full border-b border-black/10">
        {[
          { label: t.fund.dividend.bookCloseDate, align: "left" as const },
          { label: t.fund.dividend.paymentDate, align: "center" as const },
          { label: t.fund.dividend.perUnit, align: "right" as const },
        ].map((col) => (
          <div
            key={col.label}
            className={`flex flex-1 items-center px-4 py-3 ${
              col.align === "center"
                ? "justify-center text-center"
                : col.align === "right"
                  ? "justify-end text-right"
                  : ""
            }`}
          >
            <span className="text-xs leading-[20px] text-[#6a7282]">{col.label}</span>
          </div>
        ))}
      </div>
      {rows.map((row, index) => (
        <div key={`${row.bookCloseDate}-${row.paymentDate}-${index}`} className="flex w-full">
          {[
            { id: "bookClose", value: row.bookCloseDate, align: "left" as const },
            { id: "payment", value: row.paymentDate, align: "center" as const },
            { id: "amount", value: row.amountPerUnit, align: "right" as const },
          ].map((cell) => (
            <div
              key={cell.id}
              className={`flex h-[38px] flex-1 items-center border-b border-black/10 px-4 py-3.5 last:border-b-0 ${
                index % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
              } ${cell.align === "center" ? "justify-center text-center" : cell.align === "right" ? "justify-end text-right" : ""}`}
            >
              <span className="text-sm leading-[24px] text-[#101828]">{cell.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Figma 37700:118238 / 39824:512758 — dividend history "ดูทั้งหมด" modal */
export function MutualFundDividendHistoryModal({
  open,
  rows,
  onClose,
}: {
  open: boolean;
  rows: MutualFundDividend[];
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
        title={t.fund.dividend.historyTitle}
        showHandle
        rightSide="action"
        actionLabel={t.common.close}
        onActionClick={onClose}
        contentClassName="flex max-h-[calc(var(--dvh)*100-10rem)] flex-col overflow-y-auto pt-0 pb-10"
      >
        <DividendHistoryTable rows={rows} />
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
          title={t.fund.dividend.historyTitle}
          showClose
          onClose={onClose}
          actionLayout="none"
          className="w-[calc(var(--vw)*100-3rem)] !max-w-[552px]"
        >
          <div className="max-h-[min(460px,calc(var(--dvh)*100-8rem))] overflow-y-auto">
            <DividendHistoryTable rows={rows} />
          </div>
        </Modal>
      </div>
    </div>
  );
}

export function DividendHistoryPreview({
  rows,
  onViewAll,
}: {
  rows: MutualFundDividend[];
  onViewAll: () => void;
}) {
  const t = useT();
  const previewRows = rows.slice(0, 5);
  const showViewAll = rows.length > 5;

  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full border-b border-black/10">
        {[
          { label: t.fund.dividend.bookCloseDate, align: "left" as const },
          { label: t.fund.dividend.paymentDate, align: "center" as const },
          { label: t.fund.dividend.perUnit, align: "right" as const },
        ].map((col) => (
          <div
            key={col.label}
            className={`flex flex-1 items-center px-4 py-3 ${
              col.align === "center"
                ? "justify-center text-center"
                : col.align === "right"
                  ? "justify-end text-right"
                  : ""
            }`}
          >
            <span className="text-xs leading-[20px] text-[#6a7282]">{col.label}</span>
          </div>
        ))}
      </div>
      {previewRows.map((row, index) => (
        <div key={`${row.bookCloseDate}-${row.paymentDate}-${index}`} className="flex w-full">
          {[
            { id: "bookClose", value: row.bookCloseDate, align: "left" as const },
            { id: "payment", value: row.paymentDate, align: "center" as const },
            { id: "amount", value: row.amountPerUnit, align: "right" as const },
          ].map((cell) => (
            <div
              key={cell.id}
              className={`flex h-[38px] flex-1 items-center border-b border-black/10 px-4 py-3.5 ${
                index % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
              } ${cell.align === "center" ? "justify-center text-center" : cell.align === "right" ? "justify-end text-right" : ""}`}
            >
              <span className="text-sm leading-[24px] text-[#101828]">{cell.value}</span>
            </div>
          ))}
        </div>
      ))}
      {showViewAll && (
        <button
          type="button"
          onClick={onViewAll}
          className="flex h-[38px] w-full cursor-pointer items-center justify-center border-none bg-white px-4 py-3.5 text-sm leading-[24px] text-[#0a6ee7]"
        >
          {t.fund.list.viewAll}
        </button>
      )}
    </div>
  );
}
