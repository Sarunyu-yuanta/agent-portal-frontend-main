"use client";

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
import { getClientProfile } from "@/data/client-profiles";
import { IMPORTANT_FORMS, kycExpiry } from "./client-detail-data";
import type { Client } from "@/types/domain";

/** How far off the KYC expiry is, in words — the date alone doesn't say. */
function countdownLabel(daysLeft: number): string {
  if (daysLeft < 0) return `Overdue by ${Math.abs(daysLeft)} days`;
  if (daysLeft === 0) return "Due today";
  if (daysLeft === 1) return "in 1 day";
  return `in ${daysLeft} days`;
}

export function KycTab({
  client,
  profile,
}: {
  client: Client;
  profile: ReturnType<typeof getClientProfile>;
}) {
  const expiry = kycExpiry(client.id);

  return (
    <div className="pt-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* ── Single profile card ── */}
      <div className="rounded-[6px] md:rounded-[8px] border border-border bg-card overflow-hidden shadow-sm">

        {/* Stat tiles — 3 rows of 2. Wealth Status sits beside the KYC expiry
            because six tiles fill the grid exactly; the expiry had the last row
            to itself while there were five, and a balanced grid is worth more
            than the emphasis that gave it. Its colour and alarm icon are what
            actually carry the urgency anyway. */}
        <div className="grid grid-cols-2 divide-x divide-y divide-blue-100 bg-blue-50">
          {[
            { icon: <CurrencyCircleDollarIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />, label: "Total AUM", value: formatAumThb(client.aum), sub: null, valueClass: "text-foreground" },
            { icon: <IdentificationCardIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />, label: "Client ID", value: client.id, sub: null, valueClass: "text-foreground" },
            { icon: <CalendarCheckIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />, label: "Account Opened", value: profile.relationshipSince, sub: null, valueClass: "text-foreground" },
            { icon: <ShieldCheckIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />, label: "Risk Profile", value: profile.riskProfile, sub: null, valueClass: "text-foreground" },
            // The client's segment — UHNW / HNW / Affluent. Plain text like the
            // Risk Profile beside it: both are classifications, and the segment
            // colours the client hub uses are for telling slices of a chart
            // apart, which one tile has nothing to be apart from.
            { icon: <DiamondIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />, label: "Wealth Status", value: client.tier, sub: null, valueClass: "text-foreground" },
            {
              // A calendar that reads as an alarm once the date is close — the
              // date alone doesn't say whether it's a note or a deadline.
              icon: expiry?.dueSoon
                ? <AlarmIcon size={20} weight="fill" className={expiry.urgent ? "text-[var(--text-danger-primary)]" : "text-[var(--text-warning-primary)]"} />
                : <CalendarXIcon size={20} weight="fill" className="text-[var(--text-brand-primary)]" />,
              label: "KYC Expired Date",
              value: expiry?.date ?? "—",
              // Parenthesised because it now sits on the date's own line, where
              // it reads as an aside about that date rather than a value of its
              // own. The no-record message is a statement, not an aside, so it
              // stays bare.
              sub: !expiry
                ? "No KYC record for this client"
                : expiry.daysLeft === null
                  ? null
                  : `(${countdownLabel(expiry.daysLeft)})`,
              valueClass: expiry?.urgent
                ? "text-[var(--text-danger-primary)]"
                : expiry?.dueSoon
                  ? "text-[var(--text-warning-primary)]"
                  : "text-foreground",
            },
          ].map(({ icon, label, value, sub, valueClass }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4">
              <div className="shrink-0">{icon}</div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <p className="type-caption text-[var(--text-brand-primary)]">{label}</p>
                {/* Value and its note share a line: the countdown qualifies the
                    date rather than being a second fact under it.
                    `items-baseline` so 13px and 11px text sit on one baseline
                    instead of one being optically high, and `flex-wrap` so a
                    narrow tile drops the note to its own line rather than
                    squeezing the date it belongs to. */}
                <div className="flex flex-wrap items-baseline gap-x-2 min-w-0">
                  <p className={`type-body-2 !font-semibold ${valueClass}`}>{value}</p>
                  {sub && <p className="type-caption text-muted-foreground">{sub}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detail sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border border-t border-border">

          {/* Personal */}
          <div className="p-4 md:p-6 flex flex-col gap-3">
            <p className="type-caption font-bold text-muted-foreground uppercase tracking-widest">Personal</p>
            <div className="flex flex-col divide-y divide-border">
              {[
                { icon: <CakeIcon size={15} weight="fill" />, label: "Birthday", value: profile.birthday },
                { icon: <HourglassIcon size={15} weight="fill" />, label: "Age", value: `${profile.age} years old` },
                { icon: <UsersThreeIcon size={15} weight="fill" />, label: "Nationality", value: profile.nationality },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                    {icon}
                  </div>
                  <div className="flex flex-col gap-0 flex-1 min-w-0">
                    <p className="type-caption text-muted-foreground">{label}</p>
                    <p className="type-body-2 !font-semibold text-foreground">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="p-4 md:p-6 flex flex-col gap-3">
            <p className="type-caption font-bold text-muted-foreground uppercase tracking-widest">Contact</p>
            <div className="flex flex-col divide-y divide-border">
              {[
                { icon: <PhoneIcon size={15} weight="fill" />, label: "Phone", value: profile.phone, href: `tel:${profile.phone}` },
                { icon: <EnvelopeSimpleIcon size={15} weight="fill" />, label: "Email", value: profile.email, href: `mailto:${profile.email}` },
                ...(profile.lineId ? [{ icon: <ChatCircleIcon size={15} weight="fill" />, label: "LINE", value: profile.lineId, href: undefined }] : []),
                { icon: <MapPinIcon size={15} weight="fill" />, label: "Address", value: profile.address, href: undefined },
              ].map(({ icon, label, value, href }) => (
                <div key={label} className="flex items-start gap-3 py-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <div className="flex flex-col gap-0 flex-1 min-w-0">
                    <p className="type-caption text-muted-foreground">{label}</p>
                    {href ? (
                      <a href={href} className="type-body-2 !font-semibold text-foreground hover:text-primary-action transition-colors">{value}</a>
                    ) : (
                      <p className="type-body-2 !font-semibold text-foreground leading-snug">{value}</p>
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
        <div className="rounded-[6px] md:rounded-[8px] border border-border bg-card overflow-hidden shadow-sm">
          <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border">
            <p className="type-subtitle-2 font-bold text-foreground">Important Forms</p>
          </div>
          <div className="p-3 md:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {IMPORTANT_FORMS.map(({ title, description, date, status }) => (
              <div key={title} className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                <FilesIcon size={20} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col flex-1 min-w-0 gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="type-body-2 font-bold text-foreground leading-snug line-clamp-2">{title}</p>
                    {status === "done"     && <CheckCircleIcon size={18} weight="fill" className="text-green-500 shrink-0 mt-0.5" />}
                    {status === "pending"  && <ClockIcon       size={18} weight="regular" className="text-muted-foreground shrink-0 mt-0.5" />}
                    {status === "not-done" && <WarningIcon     size={18} weight="fill" className="text-orange-500 shrink-0 mt-0.5" />}
                    {status === "oncoming" && <AlarmIcon       size={18} weight="fill" className="text-blue-500 shrink-0 mt-0.5" />}
                  </div>
                  <p className="type-caption text-muted-foreground leading-snug line-clamp-2">{description}</p>
                  <p className="type-caption text-muted-foreground/60">{date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>{/* end grid */}
    </div>
  );
}
