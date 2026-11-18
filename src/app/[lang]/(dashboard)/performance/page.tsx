"use client";

import { ChartLineUpIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "../coming-soon-page";

/**
 * The full dashboard (`KpiRow`, `MainColumn`, `DarkSidebar`) is built and still
 * on disk — held back rather than deleted, the same way `lib/feature-flags.ts`
 * gates a finished feature for a later phase. Swap this back to render those
 * once Performance is ready to ship.
 */
export default function PerformancePage() {
  return (
    <ComingSoonPage
      icon={<ChartLineUpIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title="Performance"
      body="Income, pipeline coverage, and target tracking will live here. Not built yet — check back soon."
    />
  );
}
