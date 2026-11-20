"use client";

import { useState } from "react";
import { Button, Avatar } from "@sarunyu/system-one";
import {
  WarningCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
} from "@phosphor-icons/react";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import { useT } from "@/i18n/I18nProvider";
import {
  STAGE_META,
  STAGE_ADVANCE,
  columnTotal,
  type Stage,
} from "@/features/pipeline/lib/pipeline-data";
import type { PipelineDeal } from "@/types/sales";

function DealCard({
  deal,
  onAdvanceRequest,
}: {
  deal: PipelineDeal;
  onAdvanceRequest: (id: string, next: Stage) => void;
}) {
  const { isPrivate } = usePrivacy();
  const t = useT();
  const maskedClient = maskName(deal.client, isPrivate);
  const isClosedWon = deal.stage === "Closed Won";
  const isClosedLost = deal.stage === "Closed Lost";
  const advance = STAGE_ADVANCE[deal.stage as Stage];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border border-border p-4 shadow-sm transition-colors duration-150 ${advance ? "cursor-pointer" : ""}`}
      style={{ backgroundColor: hovered ? "var(--bg-default-hover)" : "var(--card)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => advance && onAdvanceRequest(deal.id, advance.next)}
    >
      {/* Top row: avatar + client + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar type="text" initials={getInitialsFromWords(maskedClient)} size="xs" />
          <div className="min-w-0">
            <p className="truncate text-body-sm leading-snug font-semibold text-foreground">
              {maskedClient}
            </p>
            <p className="truncate text-meta leading-snug text-muted-foreground">{deal.product}</p>
          </div>
        </div>
        {deal.stalled && (
          <WarningCircleIcon
            size={16}
            weight="fill"
            className="mt-0.5 shrink-0 text-[var(--text-warning-primary)]"
          />
        )}
        {isClosedWon && (
          <CheckCircleIcon
            size={16}
            weight="fill"
            className="mt-0.5 shrink-0 text-[var(--text-success-primary)]"
          />
        )}
        {isClosedLost && (
          <XCircleIcon size={16} weight="fill" className="mt-0.5 shrink-0 text-muted-foreground" />
        )}
      </div>

      {/* PipelineDeal size */}
      <p className="type-h6 leading-none text-foreground">{deal.dealSize}</p>

      {/* Days / status */}
      <div className="flex items-center gap-2">
        {deal.stalled ? (
          <span className="text-meta font-semibold text-[var(--text-warning-primary)]">
            {t.pipeline.card.stalled(deal.daysInStage)}
          </span>
        ) : isClosedWon ? (
          <span className="text-meta font-semibold text-[var(--text-success-primary)]">
            {t.pipeline.card.won}
          </span>
        ) : isClosedLost ? (
          <span className="text-meta text-muted-foreground">{t.pipeline.card.lost}</span>
        ) : deal.daysInStage > 0 ? (
          <span className="text-meta text-muted-foreground">
            {t.pipeline.card.daysInStage(deal.daysInStage)}
          </span>
        ) : null}
      </div>

      {/* Action button */}
      {advance ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          rightIcon={<ArrowRightIcon size={13} weight="bold" />}
          onClick={(e) => {
            e.stopPropagation();
            onAdvanceRequest(deal.id, advance.next);
          }}
        >
          {t.pipeline.advance[deal.stage as keyof typeof t.pipeline.advance]}
        </Button>
      ) : isClosedLost ? (
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
          {t.pipeline.card.reopen}
        </Button>
      ) : null}
    </div>
  );
}

export function KanbanColumn({
  stage,
  deals,
  dimmed = false,
  onAdvanceRequest,
}: {
  stage: Stage;
  deals: PipelineDeal[];
  dimmed?: boolean;
  onAdvanceRequest: (id: string, next: Stage) => void;
}) {
  const t = useT();
  const meta = STAGE_META[stage];

  return (
    <div
      className={`flex w-[272px] min-w-[272px] shrink-0 flex-col transition-opacity ${dimmed ? "opacity-50" : ""}`}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-muted">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: meta.dot }} />
            <p className="text-body-sm font-semibold text-foreground">{t.pipeline.stage[stage]}</p>
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted px-1.5">
              <span className="text-meta leading-none font-bold text-muted-foreground tabular-nums">
                {deals.length}
              </span>
            </span>
          </div>
          <p className="text-label font-medium text-muted-foreground tabular-nums">
            {columnTotal(deals)}
          </p>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-2.5 p-3">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onAdvanceRequest={onAdvanceRequest} />
          ))}
          {deals.length === 0 && (
            <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-border py-10">
              <p className="text-label text-muted-foreground/60">{t.pipeline.card.noDeals}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
