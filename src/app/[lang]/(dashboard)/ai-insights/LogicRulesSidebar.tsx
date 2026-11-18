"use client";

import { useState } from "react";
import { Tag, Toaster, Toggle } from "@sarunyu/system-one";
import { GearSixIcon } from "@phosphor-icons/react";

type ToggleKey = "high" | "revenue" | "engagement";

export function LogicRulesSidebar() {
  const [highPriorityThreshold, setHighPriorityThreshold] = useState("80");
  const [revenueMin, setRevenueMin] = useState("0.5");
  const [engagementDays, setEngagementDays] = useState("14");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({
    high: true,
    revenue: true,
    engagement: true,
  });
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; status: "success" }>>([]);

  const triggerSave = () => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message: "Settings saved", status: "success" }]);
  };

  const handleToggle = (key: ToggleKey) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    triggerSave();
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-border">
        <GearSixIcon size={15} className="text-muted-foreground" />
        <p className="text-body-sm font-semibold text-foreground flex-1">AI Logic Rules</p>
        <Tag text="Active" variant="green" size="small" />
      </div>

      {/* Rules */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-label font-medium text-foreground">High Priority threshold</p>
            <p className="text-meta text-muted-foreground">AI Score ≥</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={highPriorityThreshold}
              onChange={(e) => setHighPriorityThreshold(e.target.value)}
              onBlur={triggerSave}
              className="w-12 text-center text-body-sm font-semibold border border-border rounded-lg py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Toggle label="" checked={toggles.high} onChange={() => handleToggle("high")} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex-1 min-w-0">
            <p className="text-label font-medium text-foreground">Revenue minimum</p>
            <p className="text-meta text-muted-foreground">฿M impact floor</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={revenueMin}
              onChange={(e) => setRevenueMin(e.target.value)}
              onBlur={triggerSave}
              className="w-12 text-center text-body-sm font-semibold border border-border rounded-lg py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Toggle label="" checked={toggles.revenue} onChange={() => handleToggle("revenue")} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-label font-medium text-foreground">Engagement alert</p>
            <p className="text-meta text-muted-foreground">Days without contact</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="text"
              value={engagementDays}
              onChange={(e) => setEngagementDays(e.target.value)}
              onBlur={triggerSave}
              className="w-12 text-center text-body-sm font-semibold border border-border rounded-lg py-1.5 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Toggle label="" checked={toggles.engagement} onChange={() => handleToggle("engagement")} />
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
