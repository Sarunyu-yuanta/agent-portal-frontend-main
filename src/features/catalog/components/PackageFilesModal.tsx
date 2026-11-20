"use client";

import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import { DownloadSimpleIcon, FilePdfIcon, FileXlsIcon } from "@phosphor-icons/react";
import type { StructuredProduct } from "@/features/catalog/structured-product/lib/structured-product-data";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

type PackageFile = {
  name: string;
  type: "pdf" | "xlsx";
  description: string;
  size: string;
};

function getPackageFiles(slug: string, t: Dictionary): PackageFile[] {
  const docs = t.products.packageFiles.docs;
  return [
    {
      name: `FCN_Presentation_${slug}.pdf`,
      type: "pdf",
      description: docs.presentation,
      size: "1.2 MB",
    },
    { name: `Term_Sheet_${slug}.pdf`, type: "pdf", description: docs.termSheet, size: "0.8 MB" },
    { name: `Prospectus_${slug}.pdf`, type: "pdf", description: docs.prospectus, size: "3.4 MB" },
    {
      name: `Risk_Disclosure_${slug}.pdf`,
      type: "pdf",
      description: docs.riskDisclosure,
      size: "0.5 MB",
    },
    { name: `KFS_${slug}.pdf`, type: "pdf", description: docs.kfs, size: "0.3 MB" },
    {
      name: `Subscription_Form_${slug}.xlsx`,
      type: "xlsx",
      description: docs.subscriptionForm,
      size: "0.1 MB",
    },
  ];
}

function FileIcon({ type }: { type: PackageFile["type"] }) {
  if (type === "xlsx") {
    return (
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: "#dcfce7" }}
      >
        <FileXlsIcon size={22} weight="fill" color="#16a34a" />
      </div>
    );
  }
  return (
    <div
      className="flex size-10 shrink-0 items-center justify-center rounded-lg"
      style={{ backgroundColor: "#fee2e2" }}
    >
      <FilePdfIcon size={22} weight="fill" color="#dc2626" />
    </div>
  );
}

function FileList({ files, slug }: { files: PackageFile[]; slug: string }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-0">
      <p className="mb-3 text-xs text-[#6a7282]">
        {t.products.packageFiles.summary(
          files.length,
          (s) => (
            <strong className="text-[#4a5565]">{s}</strong>
          ),
          `${slug}_Package.zip`,
        )}
      </p>
      <div className="flex flex-col gap-1">
        {files.map((file, i) => (
          <div
            key={file.name}
            className="flex items-center gap-3 rounded-xl px-3 py-3"
            style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "white" }}
          >
            <FileIcon type={file.type} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-[#101828]">{file.name}</p>
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
  const t = useT();
  const labels = t.products.packageFiles;
  const isMobile = useIsMobile();
  const slug = product.underlying.replace(/ - /g, "-");
  const files = getPackageFiles(slug, t);

  const handleDownload = () => {
    onClose();
    alert(labels.downloading(`${slug}_Package.zip`, files.length));
  };

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        headerType="icon"
        leftIcon={<DownloadSimpleIcon size={20} color="#0a6ee7" />}
        title={labels.title}
        rightSide="action"
        actionLabel={labels.downloadZip}
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
          title={labels.title}
          showClose
          onClose={onClose}
          actionLayout="single"
          primaryLabel={labels.downloadAll}
          onPrimaryClick={handleDownload}
          className="w-[calc(var(--vw)*100-2rem)] max-w-[480px]"
        >
          <FileList files={files} slug={slug} />
        </Modal>
      </div>
    </div>
  );
}
