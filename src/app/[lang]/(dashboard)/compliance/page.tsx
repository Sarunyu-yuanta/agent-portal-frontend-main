"use client";

import { KpiBar } from "./KpiBar";
import { AlertCards } from "./AlertCards";
import { KycTable } from "./KycTable";
import { AiGuide } from "./AiGuide";

export default function CompliancePage() {
  return (
    <div className="flex flex-col gap-8">

      <KpiBar />

      <div className="flex flex-col lg:grid lg:[grid-template-columns:1fr_340px] gap-7 lg:gap-[28px] lg:items-start">
        {/* Main — min-w-0 prevents table from overflowing grid column */}
        <div className="flex flex-col gap-10 min-w-0 overflow-hidden">
          <AlertCards />
          <KycTable />
        </div>

        {/* Dark sidebar */}
        <AiGuide />
      </div>

    </div>
  );
}
