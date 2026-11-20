"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { Avatar, Button, Toaster } from "@sarunyu/system-one";
import { usePrivacy } from "@/contexts/privacy-context";
import { useClientsResource } from "@/hooks/use-api";
import { useToasts } from "@/hooks/use-toasts";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { AdvisoryClientPickerModal } from "./AdvisoryClientPickerModal";
import {
  advisoryAccountStatus,
  riskProfileLabel,
  type AdvisoryService,
} from "./portfolio-advisory-client";
import { AdvisoryAccountTag } from "./portfolio-advisory-ui";
import { useT } from "@/i18n/I18nProvider";

/**
 * Keeps the client a Portfolio Advisory page is being read for in `?clientId`,
 * so a refresh, a shared link or browser back all land on the same client.
 * Arriving without one re-opens the picker rather than showing plans for nobody.
 */
export function useAdvisoryClient(service: AdvisoryService) {
  const t = useT();
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const { data: clients, isLoading, error } = useClientsResource();
  const clientId = searchParams.get("clientId") ?? undefined;
  const client = clients.find((c) => c.id === clientId);
  const [pickerOpen, setPickerOpen] = useState(false);

  // A `?clientId=` that matches no one (a stale link, a client since removed)
  // used to just reopen the picker, as if none had been given. Once the list
  // has loaded, drop the param and say why; the picker still opens. Not while
  // loading (the list is still empty) and not on a failed load (the client may
  // well exist).
  const { toasts, addToast, removeToast } = useToasts();
  const unknownClientId = !isLoading && !error && clientId && !client ? clientId : null;
  useEffect(() => {
    if (!unknownClientId) return;
    setQueryState(withQuery(pathname, searchParams, { clientId: null }));
    addToast({ status: "warning", message: t.products.advisory.picker.clientParamNotFound });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per bad id
  }, [unknownClientId]);

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
    toasts,
    removeToast,
  };
}

export type AdvisoryClientState = ReturnType<typeof useAdvisoryClient>;

/** Renders the picker (and the bad-`?clientId` toast), closing back out of the page when there is nothing to fall back to. */
export function AdvisoryClientPicker({
  state,
  onDismissWithoutClient,
}: {
  state: AdvisoryClientState;
  onDismissWithoutClient?: () => void;
}) {
  return (
    <>
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
      <Toaster items={state.toasts} onRemove={state.removeToast} />
    </>
  );
}

/** Figma-neutral bar above the plan list — who the plans are being read for. */
export function AdvisoryClientBar({ state }: { state: AdvisoryClientState }) {
  const t = useT();
  const { isPrivate } = usePrivacy();
  const { client, service } = state;

  if (!client) return null;

  const displayName = maskName(client.name, isPrivate);

  return (
    <div className="flex w-full items-center gap-3 rounded-lg border border-black/10 bg-white px-3 py-2">
      <Avatar type="text" initials={getInitial(displayName)} size="m" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm leading-[24px] font-bold text-[#101828]">{displayName}</p>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <p className="truncate text-xs leading-[20px] text-[#4a5565]">
            {riskProfileLabel(client, t)}
          </p>
          <AdvisoryAccountTag status={advisoryAccountStatus(client, service)} />
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={state.openPicker} className="shrink-0">
        {t.products.advisory.picker.changeClient}
      </Button>
    </div>
  );
}
