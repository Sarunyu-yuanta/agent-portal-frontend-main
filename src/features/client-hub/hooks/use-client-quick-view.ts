"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/i18n/navigation";
import { setQueryState } from "@/lib/query-state";
import { recordVisit } from "@/features/shell/lib/nav-memory";
import { useToasts } from "@/hooks/use-toasts";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import { ROUTES, clientPath } from "@/lib/routes";

/**
 * The Client Hub's client quick-view panel: which client it shows (owned by
 * the `?client=` param), opening and closing it, and leaving it for that
 * client's Full Profile.
 */
export function useClientQuickView({
  clients,
  isLoading,
  error,
}: {
  clients: Client[];
  isLoading: boolean;
  error: Error | null;
}) {
  const router = useLocalizedRouter();
  const t = useT();
  const searchParams = useSearchParams();

  // Client quick view — URL-owned (`?client=110001`) so refresh, browser back
  // and a shared link all land on the same open panel. The one place that
  // *doesn't* reconstruct it is a return from that client's Full Profile: see
  // `goToProfile`, which clears the param out of the entry it leaves behind.
  const clientParam = searchParams.get("client");
  const selectedClient = (clientParam && clients.find((c) => c.id === clientParam)) || null;
  const drawerOpen = !!selectedClient;
  // The drawer animates out after the param is gone — keep the last client
  // around so it slides away with content instead of collapsing to blank.
  const [panelClient, setPanelClient] = useState<Client | null>(selectedClient);
  if (selectedClient && selectedClient !== panelClient) setPanelClient(selectedClient);
  // Only rewind history if we're the ones who pushed the panel onto it —
  // arriving straight on `?client=…` must not bounce out of the app.
  const pushedPanelRef = useRef(false);

  // A `?client=` that matches no one (a stale link, a client since removed)
  // used to open nothing and say nothing. Once the list has loaded, drop the
  // param and say why, rather than leave a URL that silently does nothing.
  // Not while loading (the list is still empty) and not on a failed load
  // (the client may well exist — the table shows the error instead).
  const { toasts, addToast, removeToast } = useToasts();
  const unknownClientParam =
    !isLoading && !error && clientParam && !selectedClient ? clientParam : null;
  useEffect(() => {
    if (!unknownClientParam) return;
    setQueryState(ROUTES.clientHub, "replace");
    addToast({ status: "warning", message: t.client.hub.clientParamNotFound });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per bad id
  }, [unknownClientParam]);

  function openClient(client: Client) {
    const href = `/client-hub?client=${encodeURIComponent(client.id)}`;
    // Row-to-row within an already-open panel swaps the view rather than
    // stacking history entries the user would have to unwind one by one.
    if (drawerOpen) {
      setQueryState(href, "replace");
    } else {
      pushedPanelRef.current = true;
      setQueryState(href, "push");
    }
  }

  function closeClient() {
    // Back only rewinds the entry we added; landing directly on `?client=…`
    // (refresh, shared link, session restore) must not bounce out of the app.
    if (pushedPanelRef.current) {
      pushedPanelRef.current = false;
      router.back();
    } else {
      setQueryState(ROUTES.clientHub, "replace");
    }
  }

  /**
   * Leaves for a client's Full Profile — and makes sure the entry we leave
   * behind doesn't hold `?client=…`, so coming back lands on the list with
   * nothing over it. The profile is the deeper view of the same client the
   * panel was previewing; finding the preview still stacked on top of the list
   * on the way back is just something to dismiss.
   */
  const goToProfile = (clientId: string, tab?: string) => {
    const href = tab ? clientPath(clientId, tab) : clientPath(clientId);

    if (clientParam) {
      // Two things remember the panel, and both have to forget it — browser
      // back reads the history entry, while the profile's own "Client 360"
      // breadcrumb (and the sidebar entry, coming from another section) reads
      // the section trail. Clearing only the first left the breadcrumb still
      // pointing at `?client=…`.
      //
      // Both writes are synchronous — `setQueryState` is `history.replaceState`
      // and `recordVisit` is a `sessionStorage` write — so they land before the
      // navigation below instead of racing `NavStateMemory`'s effect, which may
      // never run for a URL we leave in the same tick. `recordVisit` is
      // idempotent, so it doesn't matter if that effect fires anyway.
      setQueryState(ROUTES.clientHub, "replace");
      recordVisit(ROUTES.clientHub, ROUTES.clientHub);
    }

    if (pushedPanelRef.current) {
      // We pushed the panel's entry, so spend it on the profile rather than
      // stacking on top: back then goes to the `/client-hub` entry from before
      // the panel opened. Replacing is also what keeps the strip above from
      // leaving two identical `/client-hub` entries to click through.
      pushedPanelRef.current = false;
      router.replace(href);
    } else {
      // The param came from the URL the user arrived on (a refresh with the
      // panel open, a pasted link), so there's no earlier entry to fall back to
      // — the same case `closeClient` guards. The stripped entry above becomes
      // the way back instead.
      router.push(href);
    }
  };

  return {
    drawerOpen,
    panelClient,
    toasts,
    removeToast,
    openClient,
    closeClient,
    goToProfile,
  };
}
