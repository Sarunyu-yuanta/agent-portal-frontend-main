"use client";

/**
 * What an IC can do with a product's documents: **send them to a client**, or
 * download them.
 *
 * It used to be "ดาวน์โหลดเอกสาร" alone — the IC downloaded the presentation
 * and sent it to the client however they liked, so an offer left no trace and
 * nothing about it could be counted. Sending is now the headline and the
 * portal does it (`useSendProposal`), which is what makes an offer a thing with
 * an outcome: see `orders/order-proposals`.
 *
 * So this is a **split button**. The label half sends; the caret half opens the
 * two downloads, which are unchanged and still there for a meeting, a printout,
 * a client who wants it by hand. Two hit areas rather than one, because one
 * surface cannot both act and disclose.
 *
 * One component for every place a product's documents are offered — all four
 * desks — so it reads the same wherever an IC reaches for it. The host owns the
 * document modals, the send dialog and the toasts, and opens them from the
 * callbacks.
 *
 * The menu opens upward: every host puts the button at the bottom of its
 * content.
 */

import { useState } from "react";
import {
  CaretDownIcon,
  EyeIcon,
  FilePdfIcon,
  PackageIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";

export function ProductDocumentActions({
  onSendProposal,
  onPresentation,
  onPackage,
  className = "",
}: {
  /** Opens the send dialog — the primary half. */
  onSendProposal: () => void;
  onPresentation: () => void;
  onPackage: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="flex w-full items-stretch h-12 rounded-xl overflow-hidden text-white"
        style={{ backgroundColor: "#0a6ee7" }}
      >
        <button
          type="button"
          onClick={onSendProposal}
          className="flex flex-1 items-center justify-center gap-2 px-4 font-medium text-sm cursor-pointer transition-opacity hover:opacity-90"
        >
          <PaperPlaneTiltIcon size={16} weight="fill" />
          <span>ส่ง Proposal ให้ลูกค้า</span>
        </button>
        {/* Divided, so the caret reads as a second control rather than as
            decoration on the first — pressing it must not send anything. */}
        <span aria-hidden className="my-2 w-px shrink-0 bg-white/30" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="ดาวน์โหลดเอกสาร"
          title="ดาวน์โหลดเอกสาร"
          className="flex shrink-0 items-center justify-center px-3.5 cursor-pointer transition-opacity hover:opacity-90"
        >
          <CaretDownIcon
            size={14}
            color="white"
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} role="presentation" />
          <div
            className="absolute bottom-full mb-2 right-0 w-full rounded-xl overflow-hidden z-20 shadow-lg"
            style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "white" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPresentation();
              }}
              className="group flex items-start gap-3 w-full px-4 py-3 text-left cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <div className="relative flex shrink-0 size-8 items-center justify-center rounded-lg bg-[#fee2e2] group-hover:bg-transparent transition-colors">
                <FilePdfIcon size={16} color="#dc2626" className="transition-opacity group-hover:opacity-0" />
                <EyeIcon size={16} color="#0a6ee7" className="absolute opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="font-medium text-sm text-[#101828]">Presentation PDF</p>
                <p className="text-xs text-[#6a7282] mt-0.5">สำหรับนำเสนอลูกค้า</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPackage();
              }}
              className="group flex items-start gap-3 w-full px-4 py-3 text-left cursor-pointer transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <div className="relative flex shrink-0 size-8 items-center justify-center rounded-lg bg-[#eff6ff] group-hover:bg-transparent transition-colors">
                <PackageIcon size={16} color="#0a6ee7" className="transition-opacity group-hover:opacity-0" />
                <EyeIcon size={16} color="#0a6ee7" className="absolute opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="font-medium text-sm text-[#101828]">ชุดเอกสารครบชุด</p>
                <p className="text-xs text-[#6a7282] mt-0.5">สำหรับปิดการขาย (.zip)</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
