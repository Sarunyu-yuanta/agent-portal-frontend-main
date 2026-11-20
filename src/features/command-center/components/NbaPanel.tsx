"use client";

import { useLocalizedRouter } from "@/i18n/navigation";
import { Avatar, Tag } from "@sarunyu/system-one";
import {
  CurrencyCircleDollarIcon,
  SparkleIcon,
  UsersIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { getInitials } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import { RowIcon } from "./CardHeader";
import { NBA_ROW_LIMIT, type NbaRow } from "@/features/command-center/lib/dashboard-data";

/**
 * The AI's suggested next move per client, brought over from the Command
 * Center — the one part of that page worth keeping.
 *
 * It answers a different question from the reminders above it, which is why
 * both belong here: a reminder is something already owed, with a date on it,
 * and this is something nobody has asked for yet. The list is short and
 * dismissible on purpose. A suggestion the RM can't wave away stops being a
 * suggestion, and one that can't run out never gets finished.
 *
 * What did *not* come across is the Command Center's "Review & Send" button.
 * It sent nothing there, and a button that does nothing is worse on a page
 * built to hand off — so the row's action is the one real destination it has,
 * the client's profile, and `action` is read for what it actually is: the
 * category of move being suggested.
 */
const CATEGORY: Record<
  string,
  {
    id: "revenue" | "compliance" | "productMatch" | "reengage";
    variant: "green" | "red" | "blue" | "yellow";
    tone: string;
    Icon: React.ElementType;
  }
> = {
  "Review & Send": {
    id: "revenue",
    variant: "green",
    tone: "bg-[var(--fill-emerald-100)] text-[var(--fill-emerald-600)]",
    Icon: CurrencyCircleDollarIcon,
  },
  "Schedule Review": {
    id: "compliance",
    variant: "red",
    tone: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    Icon: WarningCircleIcon,
  },
  "Pitch Product": {
    id: "productMatch",
    variant: "blue",
    tone: "bg-[var(--fill-violet-100)] text-[var(--fill-violet-600)]",
    Icon: SparkleIcon,
  },
  "Re-engage": {
    id: "reengage",
    variant: "yellow",
    tone: "bg-[var(--fill-amber-100)] text-[var(--fill-amber-600)]",
    Icon: UsersIcon,
  },
};

const FALLBACK = {
  variant: "blue" as const,
  tone: "bg-[var(--fill-p1-100)] text-[var(--fill-p1-600)]",
  Icon: SparkleIcon,
};

export function NbaPanel({
  rows,
  limit = NBA_ROW_LIMIT,
  onDismiss,
}: {
  rows: NbaRow[];
  /** How many to draw. The card keeps its shortlist; the sub-page passes the
   *  whole set. */
  limit?: number;
  onDismiss: (id: string) => void;
}) {
  const router = useLocalizedRouter();
  const t = useT();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={
          <SparkleIcon
            size={40}
            weight="duotone"
            className="text-[var(--text-default-placeholder)]"
          />
        }
        title={t.commandCenter.nba.emptyTitle}
        body={t.commandCenter.nba.emptyBody}
      />
    );
  }

  return (
    /* One surface with rules inside it, matching the Call Log and KYC cards.
       The drafted message keeps its own blue tint, which still reads against
       the grey — it is the part of the row that has to look machine-written. */
    <div className="divide-y divide-black/[0.05] overflow-hidden rounded-2xl bg-[var(--bg-default-secondary)]">
      {rows.slice(0, limit).map(({ action, displayName, revenueThbM }) => {
        const category = CATEGORY[action.action];
        const { Icon, tone, variant } = category ?? FALLBACK;
        const href = `/client/${action.clientId}`;

        return (
          <div
            key={action.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(href);
              }
            }}
            className="group flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:bg-[var(--fill-p1-100)]"
          >
            <div className="flex items-start gap-3">
              <RowIcon tone={tone}>
                <Icon size={18} weight="duotone" />
              </RowIcon>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-body font-bold text-foreground">{displayName}</p>
                  <Avatar type="text" initials={getInitials(displayName)} size="xs" />
                  <span className="shrink-0 text-meta text-muted-foreground">{action.tier}</span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag
                    text={category ? t.commandCenter.nba.category[category.id] : action.action}
                    variant={variant}
                    size="small"
                  />
                  <Tag text={action.priority} variant={action.priorityVariant} size="small" />
                </div>
              </div>

              {/* The figure sits where the reference dashboards put a progress
                  number: hard right, on the row's first line, so a column of
                  them can be compared without reading a word. */}
              <div className="flex shrink-0 items-start gap-1">
                <div className="text-right">
                  {revenueThbM !== null ? (
                    <>
                      <p className="text-success text-body-lg leading-none font-bold tabular-nums">
                        ฿{revenueThbM}M
                      </p>
                      <p className="mt-1 text-meta text-muted-foreground">
                        {t.commandCenter.nba.revenueOpportunity}
                      </p>
                    </>
                  ) : (
                    <p className="text-warning text-meta font-medium">{action.revenueImpact}</p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={t.commandCenter.nba.dismissAria}
                  title={t.commandCenter.nba.dismiss}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(action.id);
                  }}
                  className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-white hover:text-foreground focus-visible:opacity-100"
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </div>
            </div>

            <p className="line-clamp-2 text-label leading-relaxed text-muted-foreground">
              {action.insight}
            </p>

            {/* The drafted message, in the same tinted box the Command Center
                framed it in — it is the part of the row the RM is most likely
                to act on, and it has to read as machine-written rather than as
                something the desk already sent. */}
            <div className="bg-primary-action-light flex gap-2 rounded-xl px-3 py-2.5">
              <SparkleIcon
                size={13}
                weight="fill"
                className="text-primary-action mt-0.5 shrink-0"
              />
              <p className="line-clamp-2 text-label leading-relaxed text-foreground">
                {action.aiDraft}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
