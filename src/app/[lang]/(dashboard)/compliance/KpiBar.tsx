"use client";

import { Card, Tag } from "@sarunyu/system-one";
import { ShieldCheckIcon, FileTextIcon, ClockIcon, XCircleIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

export function KpiBar() {
  const t = useT();
  const k = t.compliance.kpi;
  const kpis = [
    {
      label: k.criticalAlerts,
      value: "2",
      sub: k.criticalAlertsSub,
      Icon: XCircleIcon,
      variant: "red" as const,
      valueColor: "text-destructive",
    },
    {
      label: k.pendingKyc,
      value: "3",
      sub: k.pendingKycSub,
      Icon: FileTextIcon,
      variant: "yellow" as const,
      valueColor: "text-foreground",
    },
    {
      label: k.suitabilityFlags,
      value: "1",
      sub: k.suitabilityFlagsSub,
      Icon: ShieldCheckIcon,
      variant: "red" as const,
      valueColor: "text-foreground",
    },
    {
      label: k.expiring30,
      value: "2",
      sub: "Malee · Wichai",
      Icon: ClockIcon,
      variant: "yellow" as const,
      valueColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 items-stretch gap-4 lg:grid-cols-4">
      {kpis.map((k) => (
        <Card key={k.label} variant="default" className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <p className="type-caption text-muted-foreground">{k.label}</p>
            <Tag text={k.value} variant={k.variant} size="small" />
          </div>
          <p className={`type-h3 leading-none ${k.valueColor}`}>{k.value}</p>
          <p className="type-caption text-[var(--text-default-disabled)]">{k.sub}</p>
        </Card>
      ))}
    </div>
  );
}
