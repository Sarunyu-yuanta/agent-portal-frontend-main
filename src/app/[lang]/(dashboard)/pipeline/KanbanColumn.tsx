"use client";

import { useState } from "react";
import { Button, Avatar } from "@sarunyu/system-one";
import {
  WarningCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import { STAGE_META, STAGE_ADVANCE, columnTotal, type Deal, type Stage } from "./pipeline-data";

function DealCard({ deal, onAdvanceRequest }: { deal: Deal; onAdvanceRequest: (id: string, next: Stage) => void }) {
  const { isPrivate } = usePrivacy();
  const maskedClient = maskName(deal.client, isPrivate);
  const isClosedWon = deal.stage === "Closed Won";
  const isClosedLost = deal.stage === "Closed Lost";
  const advance = STAGE_ADVANCE[deal.stage as Stage];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`border border-border rounded-xl p-4 flex flex-col gap-3 shadow-sm transition-colors duration-150 ${advance ? "cursor-pointer" : ""}`}
      style={{ backgroundColor: hovered ? "var(--bg-default-hover)" : "var(--card)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => advance && onAdvanceRequest(deal.id, advance.next)}
    >
      {/* Top row: avatar + client + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar type="text" initials={getInitialsFromWords(maskedClient)} size="xs" />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-foreground leading-snug truncate">{maskedClient}</p>
            <p className="text-meta text-muted-foreground leading-snug truncate">{deal.product}</p>
          </div>
        </div>
        {deal.stalled && <WarningCircleIcon size={16} weight="fill" className="text-[var(--text-warning-primary)] shrink-0 mt-0.5" />}
        {isClosedWon && <CheckCircleIcon size={16} weight="fill" className="text-[var(--text-success-primary)] shrink-0 mt-0.5" />}
        {isClosedLost && <XCircleIcon size={16} weight="fill" className="text-muted-foreground shrink-0 mt-0.5" />}
      </div>

      {/* Deal size */}
      <p className="type-h6 text-foreground leading-none">{deal.dealSize}</p>

      {/* Days / status */}
      <div className="flex items-center gap-2">
        {deal.stalled ? (
          <span className="text-meta font-semibold text-[var(--text-warning-primary)]">Stalled · {deal.daysInStage}d</span>
        ) : isClosedWon ? (
          <span className="text-meta font-semibold text-[var(--text-success-primary)]">Won</span>
        ) : isClosedLost ? (
          <span className="text-meta text-muted-foreground">Lost</span>
        ) : deal.daysInStage > 0 ? (
          <span className="text-meta text-muted-foreground">{deal.daysInStage}d in stage</span>
        ) : null}
      </div>

      {/* Action button */}
      {advance ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          rightIcon={<ArrowRightIcon size={13} weight="bold" />}
          onClick={(e) => { e.stopPropagation(); onAdvanceRequest(deal.id, advance.next); }}
        >
          {advance.label}
        </Button>
      ) : isClosedLost ? (
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
          Reopen
        </Button>
      ) : null}
    </div>
  );
}

export function KanbanColumn({ stage, deals, dimmed = false, onAdvanceRequest }: {
  stage: Stage;
  deals: Deal[];
  dimmed?: boolean;
  onAdvanceRequest: (id: string, next: Stage) => void;
}) {
  const meta = STAGE_META[stage];

  return (
    <div className={`flex flex-col min-w-[272px] w-[272px] shrink-0 transition-opacity ${dimmed ? "opacity-50" : ""}`}>
      <div className="flex flex-col rounded-2xl border border-border bg-muted overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: meta.dot }} />
            <p className="text-body-sm font-semibold text-foreground">{meta.label}</p>
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-meta font-bold text-muted-foreground tabular-nums leading-none">
                {deals.length}
              </span>
            </span>
          </div>
          <p className="text-label font-medium text-muted-foreground tabular-nums">{columnTotal(deals)}</p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2.5 p-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onAdvanceRequest={onAdvanceRequest} />
          ))}
          {deals.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl py-10 flex items-center justify-center">
              <p className="text-label text-muted-foreground/60">No deals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
