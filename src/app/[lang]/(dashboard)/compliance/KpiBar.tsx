"use client";

import { Card, Tag } from "@sarunyu/system-one";
import {
  ShieldCheckIcon,
  FileTextIcon,
  ClockIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

export function KpiBar() {
  const kpis = [
    {
      label: "Critical Alerts",
      value: "2",
      sub: "Require immediate action",
      Icon: XCircleIcon,
      variant: "red" as const,
      valueColor: "text-destructive",
    },
    {
      label: "Pending KYC",
      value: "3",
      sub: "Documents outstanding",
      Icon: FileTextIcon,
      variant: "yellow" as const,
      valueColor: "text-foreground",
    },
    {
      label: "Suitability Flags",
      value: "1",
      sub: "Trade blocked",
      Icon: ShieldCheckIcon,
      variant: "red" as const,
      valueColor: "text-foreground",
    },
    {
      label: "Expiring in 30 Days",
      value: "2",
      sub: "Malee · Wichai",
      Icon: ClockIcon,
      variant: "yellow" as const,
      valueColor: "text-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
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
