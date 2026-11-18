"use client";

import { useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Avatar, Button } from "@sarunyu/system-one";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClients } from "@/hooks/use-api";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { AdvisoryClientPickerModal } from "./AdvisoryClientPickerModal";
import { advisoryAccountStatus, riskProfileLabel, type AdvisoryService } from "./portfolio-advisory-client";
import { AdvisoryAccountTag } from "./portfolio-advisory-ui";

/**
 * Keeps the client a Portfolio Advisory page is being read for in `?clientId`,
 * so a refresh, a shared link or browser back all land on the same client.
 * Arriving without one re-opens the picker rather than showing plans for nobody.
 */
export function useAdvisoryClient(service: AdvisoryService) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clients = useClients();
  const clientId = searchParams.get("clientId") ?? undefined;
  const client = clients.find((c) => c.id === clientId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectClient = useCallback(
    (nextId: string) => {
      setQueryState(withQuery(pathname, searchParams, { clientId: nextId }));
      setPickerOpen(false);
    },
    [pathname, searchParams],
  );

  return {
    service,
    client,
    pickerOpen: pickerOpen || !client,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
    selectClient,
  };
}

export type AdvisoryClientState = ReturnType<typeof useAdvisoryClient>;

/** Renders the picker, closing back out of the page when there is nothing to fall back to. */
export function AdvisoryClientPicker({
  state,
  onDismissWithoutClient,
}: {
  state: AdvisoryClientState;
  onDismissWithoutClient?: () => void;
}) {
  return (
    <AdvisoryClientPickerModal
      open={state.pickerOpen}
      service={state.service}
      selectedClientId={state.client?.id}
      onClose={() => {
        if (state.client) state.closePicker();
        else onDismissWithoutClient?.();
      }}
      onConfirm={state.selectClient}
    />
  );
}

/** Figma-neutral bar above the plan list — who the plans are being read for. */
export function AdvisoryClientBar({ state }: { state: AdvisoryClientState }) {
  const { isPrivate } = usePrivacy();
  const { client, service } = state;

  if (!client) return null;

  const displayName = maskName(client.name, isPrivate);

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white px-3 py-2">
      <Avatar type="text" initials={getInitial(displayName)} size="m" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-bold leading-[24px] text-[#101828]">{displayName}</p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-xs leading-[20px] text-[#4a5565]">{riskProfileLabel(client)}</p>
          <AdvisoryAccountTag status={advisoryAccountStatus(client, service)} />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={state.openPicker} className="shrink-0">
        เปลี่ยนลูกค้า
      </Button>
    </div>
  );
}
