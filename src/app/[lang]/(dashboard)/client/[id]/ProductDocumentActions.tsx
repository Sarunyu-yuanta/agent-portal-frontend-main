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
import { useT } from "@/i18n/I18nProvider";

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
  const t = useT();
  const labels = t.products.documentActions;
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="flex h-12 w-full items-stretch overflow-hidden rounded-xl text-white"
        style={{ backgroundColor: "#0a6ee7" }}
      >
        <button
          type="button"
          onClick={onSendProposal}
          className="flex flex-1 cursor-pointer items-center justify-center gap-2 px-4 text-sm font-medium transition-opacity hover:opacity-90"
        >
          <PaperPlaneTiltIcon size={16} weight="fill" />
          <span>{t.products.common.sendProposalToClient}</span>
        </button>
        {/* Divided, so the caret reads as a second control rather than as
            decoration on the first — pressing it must not send anything. */}
        <span aria-hidden className="my-2 w-px shrink-0 bg-white/30" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={labels.download}
          title={labels.download}
          className="flex shrink-0 cursor-pointer items-center justify-center px-3.5 transition-opacity hover:opacity-90"
        >
          <CaretDownIcon
            size={14}
            color="white"
            style={{
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} role="presentation" />
          <div
            className="absolute right-0 bottom-full z-20 mb-2 w-full overflow-hidden rounded-xl shadow-lg"
            style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "white" }}
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPresentation();
              }}
              className="group flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#fee2e2] transition-colors group-hover:bg-transparent">
                <FilePdfIcon
                  size={16}
                  color="#dc2626"
                  className="transition-opacity group-hover:opacity-0"
                />
                <EyeIcon
                  size={16}
                  color="#0a6ee7"
                  className="absolute opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#101828]">{labels.presentation}</p>
                <p className="mt-0.5 text-xs text-[#6a7282]">{labels.presentationHint}</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onPackage();
              }}
              className="group flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
            >
              <div className="relative flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] transition-colors group-hover:bg-transparent">
                <PackageIcon
                  size={16}
                  color="#0a6ee7"
                  className="transition-opacity group-hover:opacity-0"
                />
                <EyeIcon
                  size={16}
                  color="#0a6ee7"
                  className="absolute opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-[#101828]">
                  {t.products.packageFiles.title}
                </p>
                <p className="mt-0.5 text-xs text-[#6a7282]">{labels.packageHint}</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
