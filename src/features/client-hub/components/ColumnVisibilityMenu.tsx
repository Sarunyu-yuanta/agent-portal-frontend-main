"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "@sarunyu/system-one";
import { SlidersHorizontalIcon, CheckIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { CustomerColumn } from "./columns";
import type { ColumnId } from "@/features/client-hub/lib/types";
import { useT } from "@/i18n/I18nProvider";

/**
 * Show/Hide column control rendered three ways for one behaviour: a dropdown on
 * desktop (lg+), a centered modal on tablet (md–lg), and a bottom sheet on
 * mobile (< md). Owns its own open state and outside-click dismissal.
 */
export function ColumnVisibilityMenu({
  columns,
  visibleColumns,
  onToggle,
  onReset,
}: {
  columns: CustomerColumn[];
  visibleColumns: Set<ColumnId>;
  onToggle: (id: ColumnId) => void;
  onReset: () => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (window.innerWidth < 1024) return; // tablet uses Modal, mobile uses Sheet — both handle their own closing
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const hiddenCount = columns.length - visibleColumns.size;

  return (
    <div className="relative shrink-0" ref={ref}>
      <Button
        variant="outline"
        size="xl"
        leftIcon={<SlidersHorizontalIcon size={18} />}
        onClick={() => setOpen((p) => !p)}
      >
        {t.client.hub.columnsButton}
        {hiddenCount > 0 && (
          <span className="bg-primary-action ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-meta leading-none font-bold text-white">
            {hiddenCount}
          </span>
        )}
      </Button>

      {/* Desktop dropdown (lg+) */}
      {open && (
        <div className="absolute top-full right-0 z-50 mt-1 hidden w-[260px] overflow-hidden rounded-xl border border-[var(--border-default)] bg-white shadow-lg lg:block">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-3 py-2.5">
            <p className="text-label font-semibold tracking-wider text-muted-foreground uppercase">
              {t.client.hub.showHideColumns}
            </p>
            <Button variant="plain" size="sm" onClick={onReset}>
              {t.client.hub.resetColumns}
            </Button>
          </div>
          <div className="max-h-[360px] overflow-y-auto py-1">
            {columns.map((column) => {
              const checked = visibleColumns.has(column.id);
              return (
                <button
                  key={column.id}
                  type="button"
                  disabled={column.required}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-default-secondary)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                  onClick={() => !column.required && onToggle(column.id)}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      checked
                        ? "bg-primary-action border-primary-action"
                        : "border-[rgba(0,0,0,0.2)] bg-white"
                    }`}
                  >
                    {checked && <CheckIcon size={10} weight="bold" color="white" />}
                  </span>
                  <span className="flex-1 text-body-sm leading-tight text-foreground">
                    {t.clientHub.columns[column.id] ?? column.label}
                  </span>
                  {column.required && (
                    <LockSimpleIcon size={11} className="shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tablet modal (md–lg) */}
      {open && (
        <div
          className="fixed inset-0 z-50 hidden items-center justify-center bg-black/30 p-4 md:flex lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <Modal
            variant="content"
            actionLayout="none"
            title={t.client.hub.showHideColumns}
            onClose={() => setOpen(false)}
          >
            <div className="w-[300px]">
              <button
                type="button"
                className="text-primary-action mb-2 block text-label font-medium hover:underline"
                onClick={onReset}
              >
                {t.client.hub.resetColumns}
              </button>
              <div className="-mx-1 max-h-[calc(var(--vh)*50)] overflow-y-auto">
                {columns.map((column) => {
                  const checked = visibleColumns.has(column.id);
                  return (
                    <button
                      key={column.id}
                      type="button"
                      className="flex w-full items-center gap-2.5 rounded px-1 py-2 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                      onClick={() => onToggle(column.id)}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                          checked
                            ? "bg-primary-action border-primary-action"
                            : "border-[rgba(0,0,0,0.2)] bg-white"
                        }`}
                      >
                        {checked && <CheckIcon size={10} weight="bold" color="white" />}
                      </span>
                      <span className="text-body-sm leading-tight text-foreground">
                        {t.clientHub.columns[column.id] ?? column.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* Mobile bottom sheet (< md) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="pb-safe rounded-t-2xl px-0 md:hidden"
        >
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-3">
            <p className="text-label font-semibold tracking-wider text-muted-foreground uppercase">
              {t.client.hub.showHideColumns}
            </p>
            <Button variant="plain" size="sm" onClick={onReset}>
              {t.client.hub.resetColumns}
            </Button>
          </div>
          <div className="max-h-[calc(var(--vh)*60)] overflow-y-auto py-1">
            {columns.map((column) => {
              const checked = visibleColumns.has(column.id);
              return (
                <button
                  key={column.id}
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--bg-default-secondary)]"
                  onClick={() => onToggle(column.id)}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                      checked
                        ? "bg-primary-action border-primary-action"
                        : "border-[rgba(0,0,0,0.2)] bg-white"
                    }`}
                  >
                    {checked && <CheckIcon size={12} weight="bold" color="white" />}
                  </span>
                  <span className="text-body leading-tight text-foreground">
                    {t.clientHub.columns[column.id] ?? column.label}
                  </span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
