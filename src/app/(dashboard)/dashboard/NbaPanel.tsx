"use client";

import { useRouter } from "next/navigation";
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
import { RowIcon } from "./CardHeader";
import { NBA_ROW_LIMIT, type NbaRow } from "./dashboard-data";

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
  { label: string; variant: "green" | "red" | "blue" | "yellow"; tone: string; Icon: React.ElementType }
> = {
  "Review & Send": {
    label: "โอกาสสร้างรายได้",
    variant: "green",
    tone: "bg-[var(--fill-emerald-100)] text-[var(--fill-emerald-600)]",
    Icon: CurrencyCircleDollarIcon,
  },
  "Schedule Review": {
    label: "ความเสี่ยงด้าน Compliance",
    variant: "red",
    tone: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
    Icon: WarningCircleIcon,
  },
  "Pitch Product": {
    label: "สินค้าที่ตรงกับลูกค้า",
    variant: "blue",
    tone: "bg-[var(--fill-violet-100)] text-[var(--fill-violet-600)]",
    Icon: SparkleIcon,
  },
  "Re-engage": {
    label: "กลับมาติดต่อ",
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
  onDismiss,
}: {
  rows: NbaRow[];
  onDismiss: (id: string) => void;
}) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<SparkleIcon size={40} weight="duotone" className="text-[var(--text-default-placeholder)]" />}
        title="ไม่มีข้อเสนอค้างอยู่"
        body="AI จะเสนอ action ใหม่เมื่อมีสัญญาณจากพอร์ตหรือพฤติกรรมของลูกค้า"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {rows.slice(0, NBA_ROW_LIMIT).map(({ action, displayName, revenueThbM }) => {
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
            className="group flex flex-col gap-3 rounded-2xl border border-border p-4 cursor-pointer transition-colors hover:border-primary-action/40 hover:bg-[var(--fill-p1-100)]"
          >
            <div className="flex items-start gap-3">
              <RowIcon tone={tone}>
                <Icon size={18} weight="duotone" />
              </RowIcon>

              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">
                    {displayName}
                  </p>
                  <Avatar type="text" initials={getInitials(displayName)} size="xs" />
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {action.tier}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag text={category?.label ?? action.action} variant={variant} size="small" />
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
                      <p className="text-[15px] font-bold leading-none text-success tabular-nums">
                        ฿{revenueThbM}M
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">โอกาสรายได้</p>
                    </>
                  ) : (
                    <p className="text-[11px] font-medium text-warning">
                      {action.revenueImpact}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="ไม่สนใจข้อเสนอนี้"
                  title="ไม่สนใจ"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(action.id);
                  }}
                  className="shrink-0 cursor-pointer rounded-md p-1 text-muted-foreground opacity-0 transition-all hover:bg-white hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <XIcon size={14} weight="bold" />
                </button>
              </div>
            </div>

            <p className="text-[12.5px] text-muted-foreground leading-relaxed line-clamp-2">
              {action.insight}
            </p>

            {/* The drafted message, in the same tinted box the Command Center
                framed it in — it is the part of the row the RM is most likely
                to act on, and it has to read as machine-written rather than as
                something the desk already sent. */}
            <div className="flex gap-2 rounded-xl bg-primary-action-light px-3 py-2.5">
              <SparkleIcon
                size={13}
                weight="fill"
                className="mt-0.5 shrink-0 text-primary-action"
              />
              <p className="text-[12px] leading-relaxed text-foreground line-clamp-2">
                {action.aiDraft}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
