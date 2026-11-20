"use client";

import { KpiBar } from "./KpiBar";
import { AlertCards } from "./AlertCards";
import { KycTable } from "./KycTable";
import { AiGuide } from "./AiGuide";

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-8">
      <KpiBar />

      <div className="flex flex-col gap-7 lg:grid lg:[grid-template-columns:1fr_340px] lg:items-start lg:gap-[28px]">
        {/* Main — min-w-0 prevents table from overflowing grid column */}
        <div className="flex min-w-0 flex-col gap-10 overflow-hidden">
          <AlertCards />
          <KycTable />
        </div>

        {/* Dark sidebar */}
        <AiGuide />
      </div>
    </div>
  );
}
