"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { NotFoundState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";

/**
 * `notFound()` called from a dashboard page. Rendered inside the dashboard
 * layout, so the sidebar stays and the IC is one click from anywhere — unlike
 * the root `app/not-found.tsx`, which is a full-screen page for URLs that match
 * no route at all.
 */
export default function DashboardNotFound() {
  const router = useLocalizedRouter();
  const t = useT();
  return (
    <NotFoundState
      message={t.states.notFoundPage}
      onBack={() => router.push("/command-center")}
      backLabel={t.common.backHome}
    />
  );
}
