"use client";

/**
 * "ดาวน์โหลดเอกสาร" — the button and the two documents it offers: the
 * presentation PDF and the full closing package.
 *
 * One component for every place a product's documents are offered — both desks'
 * detail pages and Order Management's product modal — so the menu reads the
 * same wherever an IC reaches for it. The host owns the document modals and
 * opens them from the two callbacks.
 *
 * The menu opens upward: every host puts the button at the bottom of its
 * content.
 */

import { useState } from "react";
import { CaretDownIcon, EyeIcon, FilePdfIcon, PackageIcon } from "@phosphor-icons/react";

export function DocumentDownloadMenu({
  onPresentation,
  onPackage,
  className = "",
}: {
  onPresentation: () => void;
  onPackage: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center h-12 px-4 font-medium text-sm text-white rounded-xl cursor-pointer transition-opacity hover:opacity-90"
        style={{ backgroundColor: "#0a6ee7" }}
      >
        <span className="flex-1 text-center">ดาวน์โหลดเอกสาร</span>
        <CaretDownIcon
          size={14}
          color="white"
          style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

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
