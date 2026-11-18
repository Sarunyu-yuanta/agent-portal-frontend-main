"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";

/**
 * A render error anywhere inside a dashboard page.
 *
 * Lives inside `(dashboard)` rather than at the root so the sidebar and top bar
 * stay up: the IC can still move to another page, and only the broken one is
 * replaced. Next 16 hands this `unstable_retry`, which re-fetches and re-renders
 * the segment.
 */
export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard]", error);
  }, [error]);
  const t = useT();

  return (
    <ErrorState
      title={t.states.pageErrorTitle}
      body={t.states.pageErrorBody}
      onRetry={() => unstable_retry()}
    />
  );
}
