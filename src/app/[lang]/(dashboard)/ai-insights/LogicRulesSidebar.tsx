"use client";

import { useState } from "react";
import { Tag, Toaster, Toggle } from "@sarunyu/system-one";
import { GearSixIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

type ToggleKey = "high" | "revenue" | "engagement";

export function LogicRulesSidebar() {
  const dict = useT();
  const r = dict.research.aiInsights.rules;
  const [highPriorityThreshold, setHighPriorityThreshold] = useState("80");
  const [revenueMin, setRevenueMin] = useState("0.5");
  const [engagementDays, setEngagementDays] = useState("14");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    high: true,
    revenue: true,
    engagement: true,
  });
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; status: "success" }>>(
    [],
  );

  const triggerSave = () => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message: r.saved, status: "success" }]);
  };

  const handleToggle = (key: ToggleKey) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    triggerSave();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3.5">
        <GearSixIcon size={15} className="text-muted-foreground" />
        <p className="flex-1 text-body-sm font-semibold text-foreground">{r.title}</p>
        <Tag text={r.active} variant="green" size="small" />
      </div>

      {/* Rules */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-label font-medium text-foreground">{r.highPriority}</p>
            <p className="text-meta text-muted-foreground">{r.highPrioritySub}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <input
              type="text"
              value={highPriorityThreshold}
              onChange={(e) => setHighPriorityThreshold(e.target.value)}
              onBlur={triggerSave}
              className="w-12 rounded-lg border border-border bg-background py-1.5 text-center text-body-sm font-semibold text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            />
            <Toggle label="" checked={toggles.high} onChange={() => handleToggle("high")} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-label font-medium text-foreground">{r.revenueMin}</p>
            <p className="text-meta text-muted-foreground">{r.revenueMinSub}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <input
              type="text"
              value={revenueMin}
              onChange={(e) => setRevenueMin(e.target.value)}
              onBlur={triggerSave}
              className="w-12 rounded-lg border border-border bg-background py-1.5 text-center text-body-sm font-semibold text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            />
            <Toggle label="" checked={toggles.revenue} onChange={() => handleToggle("revenue")} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-label font-medium text-foreground">{r.engagement}</p>
            <p className="text-meta text-muted-foreground">{r.engagementSub}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <input
              type="text"
              value={engagementDays}
              onChange={(e) => setEngagementDays(e.target.value)}
              onBlur={triggerSave}
              className="w-12 rounded-lg border border-border bg-background py-1.5 text-center text-body-sm font-semibold text-foreground focus:ring-1 focus:ring-ring focus:outline-none"
            />
            <Toggle
              label=""
              checked={toggles.engagement}
              onChange={() => handleToggle("engagement")}
            />
          </div>
        </div>
      </div>

      <Toaster
        items={toasts}
        onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
