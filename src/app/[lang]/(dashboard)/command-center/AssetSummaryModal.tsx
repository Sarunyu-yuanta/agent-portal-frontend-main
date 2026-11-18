"use client";

import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import type { Client } from "@/types/domain";
import { AssetSummaryPanel } from "./AssetSummaryPanel";
import { useT } from "@/i18n/I18nProvider";

export function AssetSummaryModal({
  open,
  clients,
  onClose,
}: {
  open: boolean;
  clients: Client[];
  onClose: () => void;
}) {
  const t = useT();
  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={t.commandCenter.assetSummary.title}
      titleId="dashboard-asset-summary"
      desktopMaxWidth="max-w-[420px]"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <AssetSummaryPanel clients={clients} />
      </div>
    </ResponsiveBottomSheetModal>
  );
}
