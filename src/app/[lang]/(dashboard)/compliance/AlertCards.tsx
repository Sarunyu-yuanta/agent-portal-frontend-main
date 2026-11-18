"use client";

import { Tag, Button } from "@sarunyu/system-one";
import { ShieldCheckIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { mockComplianceAlerts } from "@/lib/mock-data";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { useT } from "@/i18n/I18nProvider";

const ALERT_META = {
  critical: { variant: "red"    as const, color: "var(--text-danger-primary)", accentColor: "var(--text-danger-primary)", bg: "var(--bg-danger-light)", Icon: XCircleIcon },
  warning:  { variant: "yellow" as const, color: "var(--text-warning-primary)", accentColor: "var(--text-warning-primary)", bg: "var(--bg-warning-light)", Icon: WarningCircleIcon },
};

/** Hours ago per row — `null` reads as "today". Hard-coded; see compliance-data.ts. */
const ALERT_HOURS_AGO: (number | null)[] = [2, 3, 5, null];

export function AlertCards() {
  const { isPrivate } = usePrivacy();
  const t = useT();
  const timestamp = (i: number) => {
    const h = ALERT_HOURS_AGO[i];
    return h == null ? t.compliance.alerts.today : t.compliance.alerts.hoursAgo(h);
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Section header — inside the card */}
        <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
          <p className="type-subtitle-1 text-foreground">{t.compliance.alerts.title}</p>
          {mockComplianceAlerts.length > 0 && (
            <Tag text={t.compliance.alerts.openCount(4)} variant="red" size="small" />
          )}
        </div>
        {mockComplianceAlerts.length === 0 && (
          <EmptyState
            size="compact"
            icon={<ShieldCheckIcon size={32} className="text-[var(--text-default-placeholder)]" />}
            title={t.compliance.alerts.empty}
          />
        )}
        {mockComplianceAlerts.map((alert, i) => {
          const meta = ALERT_META[alert.type as keyof typeof ALERT_META] ?? ALERT_META.warning;
          const severityLabel = t.compliance.alerts.severity[alert.type === "critical" ? "critical" : "warning"];
          const Icon = meta.Icon;
          const isPrimary = alert.action1 === "Escalate to Compliance" || alert.action1 === "Maintain Block";
          const isLast = i === mockComplianceAlerts.length - 1;

          return (
            <div
              key={alert.id}
              className={`hover:bg-muted/30 transition-colors ${!isLast ? "border-b border-border" : ""}`}
            >
              {/* ── Mobile layout ── */}
              <div className="flex flex-col gap-2 px-4 py-4 lg:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: meta.bg }}>
                      <Icon size={13} weight="fill" style={{ color: meta.color }} />
                    </div>
                    <Tag text={severityLabel} variant={meta.variant} size="small" />
                    <span className="type-caption text-muted-foreground">{maskName(alert.client, isPrivate)}</span>
                  </div>
                  <span className="type-caption text-muted-foreground shrink-0">{timestamp(i)}</span>
                </div>
                <p className="text-body font-semibold text-foreground leading-snug">{alert.title}</p>
                <p className="type-body-2 text-muted-foreground leading-snug">{alert.message}</p>
                <div className="flex items-center justify-end gap-2">
                  {alert.action2 && <Button variant="plain" size="sm">{alert.action2}</Button>}
                  <Button variant={isPrimary ? "primary" : "outline"} size="sm">{alert.action1}</Button>
                </div>
              </div>

              {/* ── Desktop layout (original) ── */}
              <div className="hidden lg:flex">
                <div className="w-1 shrink-0" style={{ background: meta.accentColor }} />
                <div className="flex items-start gap-4 px-5 py-4 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: meta.bg }}>
                    <Icon size={16} weight="fill" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-body font-semibold text-foreground leading-snug">{alert.title}</p>
                      <span className="type-caption text-muted-foreground shrink-0">{timestamp(i)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag text={severityLabel} variant={meta.variant} size="small" />
                      <span className="type-caption text-muted-foreground">{maskName(alert.client, isPrivate)}</span>
                    </div>
                    <p className="type-body-2 text-muted-foreground leading-snug">{alert.message}</p>
                    <div className="flex items-center justify-between gap-3 mt-0.5">
                      <span />
                      <div className="flex items-center gap-2 shrink-0">
                        {alert.action2 && <Button variant="plain" size="sm">{alert.action2}</Button>}
                        <Button variant={isPrimary ? "primary" : "outline"} size="sm">{alert.action1}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
