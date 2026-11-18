"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "@sarunyu/system-one";
import { SlidersHorizontalIcon, CheckIcon, LockSimpleIcon } from "@phosphor-icons/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { CustomerColumn } from "./columns";
import type { ColumnId } from "./types";

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
        Columns
        {hiddenCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary-action text-white text-meta font-bold w-4 h-4 leading-none">
            {hiddenCount}
          </span>
        )}
      </Button>

      {/* Desktop dropdown (lg+) */}
      {open && (
        <div className="hidden lg:block absolute right-0 top-full mt-1 z-50 bg-white border border-[var(--border-default)] rounded-xl shadow-lg w-[260px] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-default)]">
            <p className="text-label font-semibold text-muted-foreground uppercase tracking-wider">
              Show / Hide Columns
            </p>
            <Button variant="plain" size="sm" onClick={onReset}>
              Reset
            </Button>
          </div>
          <div className="py-1 max-h-[360px] overflow-y-auto">
            {columns.map((column) => {
              const checked = visibleColumns.has(column.id);
              return (
                <button
                  key={column.id}
                  type="button"
                  disabled={column.required}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left hover:bg-[var(--bg-default-secondary)] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                  onClick={() => !column.required && onToggle(column.id)}
                >
                  <span
                    className={`flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0 ${
                      checked
                        ? "bg-primary-action border-primary-action"
                        : "border-[rgba(0,0,0,0.2)] bg-white"
                    }`}
                  >
                    {checked && <CheckIcon size={10} weight="bold" color="white" />}
                  </span>
                  <span className="text-body-sm text-foreground leading-tight flex-1">
                    {column.label}
                  </span>
                  {column.required && (
                    <LockSimpleIcon size={11} className="text-muted-foreground shrink-0" />
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
          className="hidden md:flex lg:hidden fixed inset-0 z-50 items-center justify-center bg-black/30 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <Modal
            variant="content"
            actionLayout="none"
            title="Show / Hide Columns"
            onClose={() => setOpen(false)}
          >
            <div className="w-[300px]">
              <button
                type="button"
                className="text-label text-primary-action hover:underline font-medium mb-2 block"
                onClick={onReset}
              >
                Reset
              </button>
              <div className="max-h-[calc(var(--vh)*50)] overflow-y-auto -mx-1">
                {columns.map((column) => {
                  const checked = visibleColumns.has(column.id);
                  return (
                    <button
                      key={column.id}
                      type="button"
                      className="flex items-center gap-2.5 w-full px-1 py-2 text-left hover:bg-[var(--bg-default-secondary)] rounded transition-colors"
                      onClick={() => onToggle(column.id)}
                    >
                      <span
                        className={`flex items-center justify-center w-4 h-4 rounded border transition-colors shrink-0 ${
                          checked
                            ? "bg-primary-action border-primary-action"
                            : "border-[rgba(0,0,0,0.2)] bg-white"
                        }`}
                      >
                        {checked && <CheckIcon size={10} weight="bold" color="white" />}
                      </span>
                      <span className="text-body-sm text-foreground leading-tight">
                        {column.label}
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
        <SheetContent side="bottom" showCloseButton={false} className="md:hidden rounded-t-2xl px-0 pb-safe">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
            <p className="text-label font-semibold text-muted-foreground uppercase tracking-wider">
              Show / Hide Columns
            </p>
            <Button variant="plain" size="sm" onClick={onReset}>
              Reset
            </Button>
          </div>
          <div className="py-1 max-h-[calc(var(--vh)*60)] overflow-y-auto">
            {columns.map((column) => {
              const checked = visibleColumns.has(column.id);
              return (
                <button
                  key={column.id}
                  type="button"
                  className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[var(--bg-default-secondary)] transition-colors"
                  onClick={() => onToggle(column.id)}
                >
                  <span
                    className={`flex items-center justify-center w-5 h-5 rounded border transition-colors shrink-0 ${
                      checked
                        ? "bg-primary-action border-primary-action"
                        : "border-[rgba(0,0,0,0.2)] bg-white"
                    }`}
                  >
                    {checked && <CheckIcon size={12} weight="bold" color="white" />}
                  </span>
                  <span className="text-body text-foreground leading-tight">
                    {column.label}
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
