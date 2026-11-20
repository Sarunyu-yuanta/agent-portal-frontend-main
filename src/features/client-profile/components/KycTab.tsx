"use client";

import type { Dictionary } from "@/i18n/dictionaries/th";
import { formatAumThb } from "@/lib/client-utils";
import {
  CurrencyCircleDollarIcon,
  IdentificationCardIcon,
  CalendarCheckIcon,
  CalendarXIcon,
  DiamondIcon,
  ShieldCheckIcon,
  CakeIcon,
  HourglassIcon,
  UsersThreeIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  ChatCircleIcon,
  MapPinIcon,
  FilesIcon,
  CheckCircleIcon,
  ClockIcon,
  WarningIcon,
  AlarmIcon,
} from "@phosphor-icons/react";
import { type getClientProfile } from "@/mocks/client-profiles";
import {
  IMPORTANT_FORMS,
  formatKycDate,
  kycExpiry,
} from "@/features/client-profile/lib/client-detail-data";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";

/** How far off the KYC expiry is, in words — the date alone doesn't say. */
function countdownLabel(daysLeft: number, t: Dictionary): string {
  const m = t.dates.kyc;
  if (daysLeft < 0) return m.overdueBy(Math.abs(daysLeft));
  if (daysLeft === 0) return m.dueToday;
  return m.dueIn(daysLeft);
}

export function KycTab({
  client,
  profile,
}: {
  client: Client;
  profile: ReturnType<typeof getClientProfile>;
}) {
  const locale = useLocale();
  const t = useT();
  const expiry = kycExpiry(client.id);
  // No profile on file is said as such — never filled from a template.
  const NA = t.common.noData;
  const k = t.client.kyc;

  return (
    <div className="w-full pt-8">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* ── Single profile card ── */}
        <div className="overflow-hidden rounded-[6px] border border-border bg-card shadow-sm md:rounded-[8px]">
          {/* Stat tiles — 3 rows of 2. Wealth Status sits beside the KYC expiry
            because six tiles fill the grid exactly; the expiry had the last row
            to itself while there were five, and a balanced grid is worth more
            than the emphasis that gave it. Its colour and alarm icon are what
            actually carry the urgency anyway. */}
          <div className="grid grid-cols-2 divide-x divide-y divide-blue-100 bg-blue-50">
            {[
              {
                icon: (
                  <CurrencyCircleDollarIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.totalAum,
                value: formatAumThb(client.aum),
                sub: null,
                valueClass: "text-foreground",
              },
              {
                icon: (
                  <IdentificationCardIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.clientId,
                value: client.id,
                sub: null,
                valueClass: "text-foreground",
              },
              {
                icon: (
                  <CalendarCheckIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.accountOpened,
                value: profile?.relationshipSince ?? NA,
                sub: null,
                valueClass: "text-foreground",
              },
              {
                icon: (
                  <ShieldCheckIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.riskProfile,
                value: profile?.riskProfile ?? NA,
                sub: null,
                valueClass: "text-foreground",
              },
              // The client's segment — UHNW / HNW / Affluent. Plain text like the
              // Risk Profile beside it: both are classifications, and the segment
              // colours the client hub uses are for telling slices of a chart
              // apart, which one tile has nothing to be apart from.
              {
                icon: (
                  <DiamondIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.wealthStatus,
                value: client.tier,
                sub: null,
                valueClass: "text-foreground",
              },
              {
                // A calendar that reads as an alarm once the date is close — the
                // date alone doesn't say whether it's a note or a deadline.
                icon: expiry?.dueSoon ? (
                  <AlarmIcon
                    size={20}
                    weight="fill"
                    className={
                      expiry.urgent
                        ? "text-[var(--text-danger-primary)]"
                        : "text-[var(--text-warning-primary)]"
                    }
                  />
                ) : (
                  <CalendarXIcon
                    size={20}
                    weight="fill"
                    className="text-[var(--text-brand-primary)]"
                  />
                ),
                label: k.expiryDate,
                value: expiry ? formatKycDate(expiry.date, locale) : "—",
                // Parenthesised because it now sits on the date's own line, where
                // it reads as an aside about that date rather than a value of its
                // own. The no-record message is a statement, not an aside, so it
                // stays bare.
                sub: !expiry
                  ? k.noRecord
                  : expiry.daysLeft === null
                    ? null
                    : k.countdownAside(countdownLabel(expiry.daysLeft, t)),
                valueClass: expiry?.urgent
                  ? "text-[var(--text-danger-primary)]"
                  : expiry?.dueSoon
                    ? "text-[var(--text-warning-primary)]"
                    : "text-foreground",
              },
            ].map(({ icon, label, value, sub, valueClass }) => (
              <div key={label} className="flex items-center gap-3 px-5 py-4">
                <div className="shrink-0">{icon}</div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="type-caption text-[var(--text-brand-primary)]">{label}</p>
                  {/* Value and its note share a line: the countdown qualifies the
                    date rather than being a second fact under it.
                    `items-baseline` so 13px and 11px text sit on one baseline
                    instead of one being optically high, and `flex-wrap` so a
                    narrow tile drops the note to its own line rather than
                    squeezing the date it belongs to. */}
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                    <p className={`type-body-2 !font-semibold ${valueClass}`}>{value}</p>
                    {sub && <p className="type-caption text-muted-foreground">{sub}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail sections */}
          <div className="grid grid-cols-1 divide-y divide-border border-t border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            {/* Personal */}
            <div className="flex flex-col gap-3 p-4 md:p-6">
              <p className="type-caption font-bold tracking-widest text-muted-foreground uppercase">
                {k.personal}
              </p>
              <div className="flex flex-col divide-y divide-border">
                {[
                  {
                    icon: <CakeIcon size={15} weight="fill" />,
                    label: k.birthday,
                    value: profile?.birthday ?? NA,
                  },
                  {
                    icon: <HourglassIcon size={15} weight="fill" />,
                    label: k.age,
                    value: profile ? k.ageYears(profile.age) : NA,
                  },
                  {
                    icon: <UsersThreeIcon size={15} weight="fill" />,
                    label: k.nationality,
                    value: profile?.nationality ?? NA,
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3 py-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                      {icon}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <p className="type-caption text-muted-foreground">{label}</p>
                      <p className="type-body-2 !font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="flex flex-col gap-3 p-4 md:p-6">
              <p className="type-caption font-bold tracking-widest text-muted-foreground uppercase">
                {k.contact}
              </p>
              <div className="flex flex-col divide-y divide-border">
                {[
                  {
                    icon: <PhoneIcon size={15} weight="fill" />,
                    label: k.phone,
                    value: profile?.phone ?? NA,
                    href: profile ? `tel:${profile.phone}` : undefined,
                  },
                  {
                    icon: <EnvelopeSimpleIcon size={15} weight="fill" />,
                    label: k.email,
                    value: profile?.email ?? NA,
                    href: profile ? `mailto:${profile.email}` : undefined,
                  },
                  ...(profile?.lineId
                    ? [
                        {
                          icon: <ChatCircleIcon size={15} weight="fill" />,
                          label: k.line,
                          value: profile.lineId,
                          href: undefined,
                        },
                      ]
                    : []),
                  {
                    icon: <MapPinIcon size={15} weight="fill" />,
                    label: k.address,
                    value: profile?.address ?? NA,
                    href: undefined,
                  },
                ].map(({ icon, label, value, href }) => (
                  <div key={label} className="flex items-start gap-3 py-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                      {icon}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0">
                      <p className="type-caption text-muted-foreground">{label}</p>
                      {href ? (
                        <a
                          href={href}
                          className="type-body-2 hover:text-primary-action !font-semibold text-foreground transition-colors"
                        >
                          {value}
                        </a>
                      ) : (
                        <p className="type-body-2 leading-snug !font-semibold text-foreground">
                          {value}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Important Forms ── */}
        <div className="pb-2">
          <div className="overflow-hidden rounded-[6px] border border-border bg-card shadow-sm md:rounded-[8px]">
            <div className="border-b border-border px-4 py-3 md:px-6 md:py-4">
              <p className="type-subtitle-2 font-bold text-foreground">{k.importantForms}</p>
            </div>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:p-4">
              {IMPORTANT_FORMS.map(({ id, updatedAt, status }) => (
                <div
                  key={id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3"
                >
                  <FilesIcon size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="type-body-2 line-clamp-2 leading-snug font-bold text-foreground">
                        {k.forms[id].title}
                      </p>
                      {status === "done" && (
                        <CheckCircleIcon
                          size={18}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-green-500"
                        />
                      )}
                      {status === "pending" && (
                        <ClockIcon
                          size={18}
                          weight="regular"
                          className="mt-0.5 shrink-0 text-muted-foreground"
                        />
                      )}
                      {status === "not-done" && (
                        <WarningIcon
                          size={18}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-orange-500"
                        />
                      )}
                      {status === "oncoming" && (
                        <AlarmIcon
                          size={18}
                          weight="fill"
                          className="mt-0.5 shrink-0 text-blue-500"
                        />
                      )}
                    </div>
                    <p className="type-caption line-clamp-2 leading-snug text-muted-foreground">
                      {k.forms[id].description}
                    </p>
                    <p className="type-caption text-muted-foreground/60">
                      {k.formUpdated(updatedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* end grid */}
    </div>
  );
}
