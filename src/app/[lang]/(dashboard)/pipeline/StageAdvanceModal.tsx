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
  const maskedClient = maskName(deal.client, isPrivate);
  const checklist = ADVANCE_CHECKLIST[deal.stage as Stage] ?? [];
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const doneCount = checked.size;
  const total = checklist.length;
  const allDone = total > 0 && doneCount === total;

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
        title="ก่อนไปขั้นตอนถัดไป"
        actionLayout="none"
        onClose={onCancel}
      >
        <div className="flex flex-col gap-4">
          {/* Stage transition */}
          <div className="-mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_META[deal.stage as Stage]?.dot }} />
            <span className="text-label text-muted-foreground">{deal.stage}</span>
            <ArrowRightIcon size={11} className="text-muted-foreground/30" weight="bold" />
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STAGE_META[next]?.dot }} />
            <span className="text-label font-semibold text-foreground">{next}</span>
          </div>

          {/* Deal summary strip */}
          <div className="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2.5">
            <Avatar type="text" initials={getInitialsFromWords(maskedClient)} size="s" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-foreground truncate">{maskedClient}</p>
              <p className="text-meta text-muted-foreground truncate">{deal.dealSize} · {deal.product}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-meta font-semibold text-muted-foreground uppercase tracking-wide">
                รายการที่ต้องทำก่อน
              </p>
              <span className={`text-label font-bold tabular-nums transition-colors ${allDone ? "text-success" : "text-muted-foreground"}`}>
                {doneCount} / {total}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${allDone ? "bg-success" : "bg-primary-action"}`}
                style={{ width: `${(doneCount / total) * 100}%` }}
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
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors ${done ? "bg-success/10" : "hover:bg-muted/60"}`}
                >
                  <Checkbox checked={done} onChange={() => toggle(item.id)} />
                  <p className={`text-body-sm leading-snug flex-1 transition-colors ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <Button variant="outline" size="xl" className="flex-1" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button
              variant="primary"
              size="xl"
              className="flex-1"
              disabled={!allDone}
              rightIcon={<ArrowRightIcon size={14} weight="bold" />}
              onClick={onConfirm}
            >
              {advance?.label ?? "Advance"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
