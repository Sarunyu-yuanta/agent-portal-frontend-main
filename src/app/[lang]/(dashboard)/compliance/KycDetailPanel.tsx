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
import { useT } from "@/i18n/I18nProvider";

export function KycDetailPanel({ row, onClose: _onClose }: { row: KycRow; onClose: () => void }) {
  const { isPrivate } = usePrivacy();
  const t = useT();
  const d = t.compliance.detail;
  const ratingLabel = t.compliance.riskRating[row.riskRating] ?? row.riskRating;
  const statusTag = <StatusTag type={row.kycStatus} text={t.compliance.kycStatus[row.kycStatus]} />;
  const urgent = row.daysUntilExpiry <= 7;
  const soon   = row.daysUntilExpiry <= 30;
  const maskedClient = maskName(row.client, isPrivate);
  const initials = getInitialsFromWords(maskedClient);

  const kpis = [
    { label: d.kycStatus,   value: statusTag },
    { label: d.riskRating,  value: <Tag text={ratingLabel} variant={row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"} size="small" /> },
    { label: d.nextReview,  value: row.nextReview,       accent: null },
    { label: d.expiry,       value: d.days(row.daysUntilExpiry), accent: urgent ? "text-destructive" : soon ? "text-warning" : "text-success" },
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
              <Tag text={t.compliance.riskRatingLabel(ratingLabel)} variant={row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"} size="small" />
              {statusTag}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <BellSimpleIcon size={20} />,   label: d.actions.remind },
            { icon: <UploadSimpleIcon size={20} />, label: d.actions.upload },
            { icon: <CalendarPlusIcon size={20} />, label: d.actions.schedule },
            { icon: <SparkleIcon size={20} weight="fill" />, label: d.actions.aiBrief },
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
              {urgent ? d.expiresUrgent : d.expiresSoon(row.daysUntilExpiry)}
            </p>
          </div>
        )}

        {/* Related compliance alerts */}
        {relatedAlerts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide">{d.relatedAlerts}</p>
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
