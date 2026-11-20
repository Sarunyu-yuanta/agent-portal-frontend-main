"use client";

import { useState } from "react";
import { Button, Modal, Checkbox, Avatar } from "@sarunyu/system-one";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { usePrivacy } from "@/contexts/privacy-context";
import { maskName } from "@/lib/mask-name";
import { getInitialsFromWords } from "@/lib/client-utils";
import {
  STAGE_META,
  STAGE_ADVANCE,
  ADVANCE_CHECKLIST,
  type Deal,
  type Stage,
} from "./pipeline-data";
import { useT } from "@/i18n/I18nProvider";

export function StageAdvanceModal({
  deal,
  next,
  onConfirm,
  onCancel,
}: {
  deal: Deal;
  next: Stage;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const t = useT();
  const maskedClient = maskName(deal.client, isPrivate);
  const checklist = ADVANCE_CHECKLIST[deal.stage as Stage] ?? [];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const doneCount = checked.size;
  const total = checklist.length;
  // A stage with no checklist has nothing to tick, so it can advance — it used
  // to stay disabled for good, with no explanation.
  const allDone = doneCount === total;

  function toggle(id: string) {
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  const advance = STAGE_ADVANCE[deal.stage as Stage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Modal
        variant="content"
        title={t.pipeline.advanceModal.title}
        actionLayout="none"
        onClose={onCancel}
      >
        <div className="flex flex-col gap-4">
          {/* Stage transition */}
          <div className="-mt-2 flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STAGE_META[deal.stage as Stage]?.dot }}
            />
            <span className="text-label text-muted-foreground">
              {t.pipeline.stage[deal.stage as Stage] ?? deal.stage}
            </span>
            <ArrowRightIcon size={11} className="text-muted-foreground/30" weight="bold" />
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: STAGE_META[next]?.dot }}
            />
            <span className="text-label font-semibold text-foreground">
              {t.pipeline.stage[next]}
            </span>
          </div>

          {/* Deal summary strip */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2.5">
            <Avatar type="text" initials={getInitialsFromWords(maskedClient)} size="s" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-foreground">{maskedClient}</p>
              <p className="truncate text-meta text-muted-foreground">
                {deal.dealSize} · {deal.product}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-meta font-semibold tracking-wide text-muted-foreground uppercase">
                {t.pipeline.advanceModal.checklist}
              </p>
              <span
                className={`text-label font-bold tabular-nums transition-colors ${allDone ? "text-success" : "text-muted-foreground"}`}
              >
                {doneCount} / {total}
              </span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-300 ${allDone ? "bg-success" : "bg-primary-action"}`}
                style={{ width: `${total > 0 ? (doneCount / total) * 100 : 100}%` }}
              />
            </div>
          </div>

          {/* Checklist */}
          <div className="flex flex-col gap-1">
            {checklist.map((item) => {
              const done = checked.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggle(item.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 transition-colors ${done ? "bg-success/10" : "hover:bg-muted/60"}`}
                >
                  <Checkbox checked={done} onChange={() => toggle(item.id)} />
                  <p
                    className={`flex-1 text-body-sm leading-snug transition-colors ${done ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {t.pipeline.checklist[item.id]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" size="xl" className="flex-1" onClick={onCancel}>
              {t.common.cancel}
            </Button>
            <Button
              variant="primary"
              size="xl"
              className="flex-1"
              disabled={!allDone}
              rightIcon={<ArrowRightIcon size={14} weight="bold" />}
              onClick={onConfirm}
            >
              {advance
                ? t.pipeline.advance[deal.stage as keyof typeof t.pipeline.advance]
                : t.pipeline.advanceFallback}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
