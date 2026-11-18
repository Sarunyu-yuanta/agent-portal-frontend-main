"use client";

import { Tag, StatusTag, Avatar } from "@sarunyu/system-one";
import {
  WarningCircleIcon,
  SparkleIcon,
  ClockIcon,
  BellSimpleIcon,
  UploadSimpleIcon,
  CalendarPlusIcon,
} from "@phosphor-icons/react";
import { mockComplianceAlerts } from "@/lib/mock-data";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import type { KycRow } from "./compliance-data";

export function KycDetailPanel({ row, onClose: _onClose }: { row: KycRow; onClose: () => void }) {
  const { isPrivate } = usePrivacy();
  const urgent = row.daysUntilExpiry <= 7;
  const soon   = row.daysUntilExpiry <= 30;
  const maskedClient = maskName(row.client, isPrivate);
  const initials = getInitialsFromWords(maskedClient);

  const kpis = [
    { label: "KYC Status",   value: <StatusTag type={row.kycStatus} /> },
    { label: "Risk Rating",  value: <Tag text={row.riskRating} variant={row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"} size="small" /> },
    { label: "Next Review",  value: row.nextReview,       accent: null },
    { label: "Expiry",       value: `${row.daysUntilExpiry} days`, accent: urgent ? "text-destructive" : soon ? "text-warning" : "text-success" },
  ];

  const relatedAlerts = mockComplianceAlerts.filter((a) => a.client === row.client);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 px-5 pt-5 pb-4 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-3">
          <Avatar type="text" initials={initials} size="m" />
          <div className="flex-1 min-w-0">
            <p className="type-subtitle-1 text-foreground leading-tight">{maskedClient}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Tag text={`${row.riskRating} Risk`} variant={row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"} size="small" />
              <StatusTag type={row.kycStatus} />
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <BellSimpleIcon size={20} />,   label: "Remind" },
            { icon: <UploadSimpleIcon size={20} />, label: "Upload" },
            { icon: <CalendarPlusIcon size={20} />, label: "Schedule" },
            { icon: <SparkleIcon size={20} weight="fill" />, label: "AI Brief" },
          ].map(({ icon, label }) => (
            <button
              key={label}
              className="flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl bg-[var(--bg-default-secondary)] border border-primary-action/20 hover:bg-[var(--bg-brand-light)] hover:border-[var(--bg-brand-primary)] transition-colors cursor-pointer"
            >
              <span className="text-primary-action">{icon}</span>
              <span className="text-meta font-medium text-primary-action leading-none">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-5 px-5 py-5 flex-1 overflow-y-auto bg-[var(--bg-default-secondary)]">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="flex flex-col justify-between gap-2 p-3 rounded-xl bg-[var(--bg-default-primary-medium)] border border-[var(--border-default)] min-h-[72px]">
              <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide leading-none">{kpi.label}</p>
              <div>
                {typeof kpi.value === "string"
                  ? <p className={`type-subtitle-1 font-bold leading-tight ${kpi.accent ?? "text-foreground"}`}>{kpi.value}</p>
                  : kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Expiry alert */}
        {(urgent || soon) && (
          <div className={`flex items-start gap-2.5 rounded-xl p-3.5 ${urgent ? "bg-[var(--bg-danger-light)] border border-[var(--border-danger)]" : "bg-[var(--bg-warning-light)] border border-[var(--border-warning)]"}`}>
            <ClockIcon size={13} weight="fill" className={`${urgent ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"} shrink-0 mt-0.5`} />
            <p className={`text-label leading-relaxed ${urgent ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"}`}>
              {urgent ? "KYC expires in less than 7 days. Immediate action required." : `KYC expires in ${row.daysUntilExpiry} days. Schedule review soon.`}
            </p>
          </div>
        )}

        {/* Related compliance alerts */}
        {relatedAlerts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide">Compliance Alerts</p>
            <div className="flex flex-col gap-0.5">
              {relatedAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 px-3 py-3 rounded-xl bg-[var(--bg-default-primary-medium)] border border-[var(--border-default)]">
                  <WarningCircleIcon size={14} weight="fill" className={`${a.type === "critical" ? "text-destructive" : "text-warning"} shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-label font-semibold text-foreground leading-tight">{a.title}</p>
                    <p className="text-meta text-muted-foreground leading-snug mt-0.5">{a.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
