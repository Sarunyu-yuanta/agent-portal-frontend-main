"use client";

import { InfoIcon } from "@phosphor-icons/react";
import { BottomSheet, useIsMobile } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ui/responsive-bottom-sheet-modal";
import { DashedDivider } from "@/components/ui/finance-ui";
import { useT } from "@/i18n/I18nProvider";

function NetValueInfoContent({ mobile = false }: { mobile?: boolean }) {
  const t = useT();
  const m = t.client.netValueInfo;
  const titleClass = mobile
    ? "type-subtitle-1 font-bold text-[var(--text-default-primary)] leading-6"
    : "type-subtitle-1 font-bold text-[rgba(0,0,0,0.75)] leading-6";
  const descriptionClass = mobile
    ? "type-subtitle-2 text-[var(--text-default-tertiary)] leading-5"
    : "type-body-2 text-[rgba(0,0,0,0.6)] leading-5";
  const bodyClass = mobile
    ? "type-body-2 text-[var(--text-default-tertiary)] leading-5"
    : "type-body-2 text-[rgba(0,0,0,0.6)] leading-5";
  const boldClass = mobile
    ? "font-bold text-[var(--text-default-secondary)]"
    : "font-bold text-[rgba(0,0,0,0.75)]";

  return (
    <div className={`flex flex-col ${mobile ? "gap-4" : "gap-4"} w-full`}>
      <div className="flex w-full flex-col gap-1">
        <p className={titleClass}>{m.heading}</p>
        <p className={descriptionClass}>
          {m.description((text) => (
            <span key={text} className={boldClass}>
              {text}
            </span>
          ))}
        </p>
        <DashedDivider />
        <p className={bodyClass}>{m.notesLabel}</p>
        <ul className={`list-disc ps-[21px] ${bodyClass}`}>
          {m.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="flex w-full items-start gap-1.5 rounded bg-[var(--bg-info-light)] px-2 py-1 pr-3 pl-2">
        <InfoIcon size={16} weight="fill" className="mt-0.5 shrink-0 text-[var(--fill-blue-700)]" />
        <p className="type-body-2 min-w-0 flex-1 leading-5 text-[var(--fill-blue-700)]">
          {m.fxNote}
        </p>
      </div>
    </div>
  );
}

export function NetValueSummaryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        headerType="icon"
        leftIcon={<InfoIcon size={22} className="shrink-0 text-[var(--text-default-primary)]" />}
        title={t.client.netValueInfo.title}
        showHandle
        rightSide="action"
        actionLabel={t.common.close}
        onActionClick={onClose}
        contentClassName="flex min-h-0 max-h-[calc(var(--dvh)*100-10rem)] flex-col overflow-y-auto pt-0"
      >
        <div className="pt-3 pb-10">
          <NetValueInfoContent mobile />
        </div>
      </BottomSheet>
    );
  }

  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={t.client.netValueInfo.title}
      titleId="net-value-info-title"
      desktopMaxWidth="max-w-[380px]"
      desktopRoundedClassName="rounded-[24px]"
      desktopTitleClassName="text-[rgba(0,0,0,0.85)] leading-6"
      desktopTitleIcon={
        <InfoIcon size={24} className="shrink-0 text-[var(--text-default-tertiary)]" />
      }
    >
      <div className="overflow-y-auto p-4 pb-6">
        <NetValueInfoContent />
      </div>
    </ResponsiveBottomSheetModal>
  );
}
