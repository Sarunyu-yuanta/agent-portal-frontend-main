"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import type { MutualFundDividend } from "./mutual-fund-data";

function DividendHistoryTable({ rows }: { rows: MutualFundDividend[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full border-b border-black/10">
        {[
          { label: "วันที่ปิดสมุด", align: "left" as const },
          { label: "วันที่จ่ายปันผล", align: "center" as const },
          { label: "บาท/หน่วย", align: "right" as const },
        ].map((col) => (
          <div
            key={col.label}
            className={`flex flex-1 items-center px-4 py-3 ${
              col.align === "center" ? "justify-center text-center" : col.align === "right" ? "justify-end text-right" : ""
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
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title="ประวัติการจ่ายปันผล"
        showHandle
        rightSide="action"
        actionLabel="Close"
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
          title="ประวัติการจ่ายปันผล"
          showClose
          onClose={onClose}
          actionLayout="none"
          className="!max-w-[552px] w-[calc(var(--vw)*100-3rem)]"
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
  const previewRows = rows.slice(0, 5);
  const showViewAll = rows.length > 5;

  return (
    <div className="overflow-hidden rounded-lg border border-black/10">
      <div className="flex w-full border-b border-black/10">
        {[
          { label: "วันที่ปิดสมุด", align: "left" as const },
          { label: "วันที่จ่ายปันผล", align: "center" as const },
          { label: "บาท/หน่วย", align: "right" as const },
        ].map((col) => (
          <div
            key={col.label}
            className={`flex flex-1 items-center px-4 py-3 ${
              col.align === "center" ? "justify-center text-center" : col.align === "right" ? "justify-end text-right" : ""
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
          className="flex h-[38px] w-full items-center justify-center border-none bg-white px-4 py-3.5 text-sm leading-[24px] text-[#0a6ee7] cursor-pointer"
        >
          ดูทั้งหมด
        </button>
      )}
    </div>
  );
}
