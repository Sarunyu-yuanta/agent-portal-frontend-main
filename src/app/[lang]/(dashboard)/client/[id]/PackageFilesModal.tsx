"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import { DownloadSimpleIcon, FilePdfIcon, FileXlsIcon } from "@phosphor-icons/react";
import type { StructuredProduct } from "./structured-product-data";

type PackageFile = {
  name: string;
  type: "pdf" | "xlsx";
  description: string;
  size: string;
};

function getPackageFiles(slug: string): PackageFile[] {
  return [
    { name: `FCN_Presentation_${slug}.pdf`, type: "pdf", description: "เอกสารนำเสนอ FCN", size: "1.2 MB" },
    { name: `Term_Sheet_${slug}.pdf`, type: "pdf", description: "Term Sheet", size: "0.8 MB" },
    { name: `Prospectus_${slug}.pdf`, type: "pdf", description: "หนังสือชี้ชวน", size: "3.4 MB" },
    { name: `Risk_Disclosure_${slug}.pdf`, type: "pdf", description: "เอกสารเปิดเผยความเสี่ยง", size: "0.5 MB" },
    { name: `KFS_${slug}.pdf`, type: "pdf", description: "Key Fact Statement (KFS)", size: "0.3 MB" },
    { name: `Subscription_Form_${slug}.xlsx`, type: "xlsx", description: "แบบฟอร์มสมัครลงทุน", size: "0.1 MB" },
  ];
}

function FileIcon({ type }: { type: PackageFile["type"] }) {
  if (type === "xlsx") {
    return (
      <div className="flex shrink-0 size-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#dcfce7" }}>
        <FileXlsIcon size={22} weight="fill" color="#16a34a" />
      </div>
    );
  }
  return (
    <div className="flex shrink-0 size-10 items-center justify-center rounded-lg" style={{ backgroundColor: "#fee2e2" }}>
      <FilePdfIcon size={22} weight="fill" color="#dc2626" />
    </div>
  );
}

function FileList({ files, slug }: { files: PackageFile[]; slug: string }) {
  return (
    <div className="flex flex-col gap-0">
      <p className="text-xs text-[#6a7282] mb-3">
        {files.length} ไฟล์ · จะถูกรวมใน{" "}
        <strong className="text-[#4a5565]">{slug}_Package.zip</strong>
      </p>
      <div className="flex flex-col gap-1">
        {files.map((file, i) => (
          <div
            key={file.name}
            className="flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "white" }}
          >
            <FileIcon type={file.type} />
            <div className="flex flex-1 min-w-0 flex-col gap-0.5">
              <p className="text-sm font-medium text-[#101828] truncate">{file.name}</p>
              <p className="text-xs text-[#6a7282]">{file.description}</p>
            </div>
            <span className="shrink-0 text-xs text-[#9ca3af]">{file.size}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type PackageFilesModalProps = {
  product: StructuredProduct;
  open: boolean;
  onClose: () => void;
};

export function PackageFilesModal({ product, open, onClose }: PackageFilesModalProps) {
  const isMobile = useIsMobile();
  const slug = product.underlying.replace(/ - /g, "-");
  const files = getPackageFiles(slug);

  const handleDownload = () => {
    onClose();
    alert(`กำลังดาวน์โหลด ${slug}_Package.zip\n(${files.length} ไฟล์)`);
  };

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => { if (!next) onClose(); }}
        headerType="icon"
        leftIcon={<DownloadSimpleIcon size={20} color="#0a6ee7" />}
        title="ชุดเอกสารครบชุด"
        rightSide="action"
        actionLabel="ดาวน์โหลด .zip"
        onActionClick={handleDownload}
        showHandle
        contentClassName="flex flex-col gap-0 overflow-y-auto pb-4 px-2"
      >
        <FileList files={files} slug={slug} />
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Modal
          variant="content"
          title="ชุดเอกสารครบชุด"
          showClose
          onClose={onClose}
          actionLayout="single"
          primaryLabel="ดาวน์โหลดทั้งหมด (.zip)"
          onPrimaryClick={handleDownload}
          className="w-[calc(var(--vw)*100-2rem)] max-w-[480px]"
        >
          <FileList files={files} slug={slug} />
        </Modal>
      </div>
    </div>
  );
}
