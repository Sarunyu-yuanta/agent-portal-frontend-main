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
import { useComplianceAlerts } from "@/features/compliance/hooks/use-compliance-alerts";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import type { KycRecord } from "@/types/compliance";

export function KycDetailPanel({
  row,
  onClose: _onClose,
}: {
  row: KycRecord;
  onClose: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const { data: complianceAlerts } = useComplianceAlerts();
  const t = useT();
  const d = t.compliance.detail;
  const ratingLabel = t.compliance.riskRating[row.riskRating] ?? row.riskRating;
  const statusTag = <StatusTag type={row.kycStatus} text={t.compliance.kycStatus[row.kycStatus]} />;
  const urgent = row.daysUntilExpiry <= 7;
  const soon = row.daysUntilExpiry <= 30;
  const maskedClient = maskName(row.client, isPrivate);
  const initials = getInitialsFromWords(maskedClient);

  const kpis = [
    { label: d.kycStatus, value: statusTag },
    {
      label: d.riskRating,
      value: (
        <Tag
          text={ratingLabel}
          variant={
            row.riskRating === "High" ? "red" : row.riskRating === "Medium" ? "yellow" : "green"
          }
          size="small"
        />
      ),
    },
    { label: d.nextReview, value: row.nextReview, accent: null },
    {
      label: d.expiry,
      value: d.days(row.daysUntilExpiry),
      accent: urgent ? "text-destructive" : soon ? "text-warning" : "text-success",
    },
  ];

  const relatedAlerts = complianceAlerts.filter((a) => a.client === row.client);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--border-default)] px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <Avatar type="text" initials={initials} size="m" />
          <div className="min-w-0 flex-1">
            <p className="type-subtitle-1 leading-tight text-foreground">{maskedClient}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Tag
                text={t.compliance.riskRatingLabel(ratingLabel)}
                variant={
                  row.riskRating === "High"
                    ? "red"
                    : row.riskRating === "Medium"
                      ? "yellow"
                      : "green"
                }
                size="small"
              />
              {statusTag}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: <BellSimpleIcon size={20} />, label: d.actions.remind },
            { icon: <UploadSimpleIcon size={20} />, label: d.actions.upload },
            { icon: <CalendarPlusIcon size={20} />, label: d.actions.schedule },
            { icon: <SparkleIcon size={20} weight="fill" />, label: d.actions.aiBrief },
          ].map(({ icon, label }) => (
            <button
              key={label}
              className="border-primary-action/20 flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-[var(--bg-default-secondary)] px-2 py-2.5 transition-colors hover:border-[var(--bg-brand-primary)] hover:bg-[var(--bg-brand-light)]"
            >
              <span className="text-primary-action">{icon}</span>
              <span className="text-primary-action text-meta leading-none font-medium">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-[var(--bg-default-secondary)] px-5 py-5">
        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="flex min-h-[72px] flex-col justify-between gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default-primary-medium)] p-3"
            >
              <p className="text-meta leading-none font-semibold tracking-wide text-muted-foreground uppercase">
                {kpi.label}
              </p>
              <div>
                {typeof kpi.value === "string" ? (
                  <p
                    className={`type-subtitle-1 leading-tight font-bold ${kpi.accent ?? "text-foreground"}`}
                  >
                    {kpi.value}
                  </p>
                ) : (
                  kpi.value
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expiry alert */}
        {(urgent || soon) && (
          <div
            className={`flex items-start gap-2.5 rounded-xl p-3.5 ${urgent ? "border border-[var(--border-danger)] bg-[var(--bg-danger-light)]" : "border border-[var(--border-warning)] bg-[var(--bg-warning-light)]"}`}
          >
            <ClockIcon
              size={13}
              weight="fill"
              className={`${urgent ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"} mt-0.5 shrink-0`}
            />
            <p
              className={`text-label leading-relaxed ${urgent ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"}`}
            >
              {urgent ? d.expiresUrgent : d.expiresSoon(row.daysUntilExpiry)}
            </p>
          </div>
        )}

        {/* Related compliance alerts */}
        {relatedAlerts.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
              {d.relatedAlerts}
            </p>
            <div className="flex flex-col gap-0.5">
              {relatedAlerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-default-primary-medium)] px-3 py-3"
                >
                  <WarningCircleIcon
                    size={14}
                    weight="fill"
                    className={`${a.type === "critical" ? "text-destructive" : "text-warning"} mt-0.5 shrink-0`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-label leading-tight font-semibold text-foreground">
                      {a.title}
                    </p>
                    <p className="mt-0.5 text-meta leading-snug text-muted-foreground">
                      {a.message}
                    </p>
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
