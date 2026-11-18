"use client";

import { useState } from "react";
import { Button, Chip, SearchInput } from "@sarunyu/system-one";
import { FunnelSimpleIcon, XIcon } from "@phosphor-icons/react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type {
  CampaignFormat,
  CampaignProduct,
  ClientSegment,
} from "@/types/domain";
import {
  FORMAT_LABEL,
  PRODUCT_LABEL,
  SEGMENT_LABEL,
  type CampaignFilters as Filters,
  type CampaignTab,
} from "./campaign-data";

/**
 * Search in the open, the four narrowing axes behind a button.
 *
 * They used to sit inline as five controls across the top of the list, which
 * cost a whole band of the page to a thing the IC sets once and then reads
 * past. Search stays out — it is typed at, constantly, and hiding it would be
 * the wrong trade — but product, status, segment and format now live in a
 * dialog.
 *
 * Two consequences the design has to answer, because hiding controls is not
 * free:
 *
 * 1. **You can't see what's applied.** So anything active comes back as a
 *    removable chip under the row. The button carries a count as well, for the
 *    moment the chips have scrolled off.
 * 2. **You can't see the list while you choose.** So the dialog holds a *draft*
 *    rather than applying live — committing on every keystroke would be
 *    rewriting a list nobody can see — and its primary action previews how many
 *    campaigns the draft would leave, so an IC can tell they are about to
 *    filter down to nothing before they close it.
 */

/** Just the dialog's four — search is applied live and never drafted. */
export type DropdownFilters = Omit<Filters, "search">;

/** A label record as the chip row renders it, in declaration order. */
function chipOptions<T extends string>(
  labels: Record<T, string>,
): { value: T; label: string }[] {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({
    value,
    label,
  }));
}

const PRODUCT_OPTIONS = chipOptions(PRODUCT_LABEL);
const SEGMENT_OPTIONS = chipOptions(SEGMENT_LABEL);
const FORMAT_OPTIONS = chipOptions(FORMAT_LABEL);

const NO_DROPDOWNS: DropdownFilters = {
  product: null,
  status: null,
  segment: null,
  format: null,
};

/**
 * One filter axis as a row of chips.
 *
 * Chips rather than a dropdown because every one of these lists is short
 * enough to show whole — two to six options — and a dropdown spends a click
 * hiding that. Seeing all the choices at once is most of the value of putting
 * the filters in a dialog in the first place.
 *
 * Single-select, with "ทั้งหมด" as a real chip rather than an implicit
 * "nothing selected" state: a user who picked หุ้น needs somewhere obvious to
 * click to undo it, and toggling the selected chip off is a gesture nobody
 * discovers.
 */
function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (next: T | null) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-label font-semibold text-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        <Chip
          label="ทั้งหมด"
          type="single"
          size="medium"
          selected={value === null}
          onClick={() => onChange(null)}
        />
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            type="single"
            size="medium"
            selected={value === option.value}
            onClick={() => onChange(option.value)}
          />
        ))}
      </div>
    </div>
  );
}

/** The chips under the row — one per applied dropdown, in dialog order. */
function activeChips(filters: Filters): {
  key: keyof DropdownFilters;
  label: string;
}[] {
  const chips: { key: keyof DropdownFilters; label: string }[] = [];
  if (filters.product) {
    chips.push({ key: "product", label: PRODUCT_LABEL[filters.product] });
  }
  if (filters.segment) {
    chips.push({ key: "segment", label: SEGMENT_LABEL[filters.segment] });
  }
  if (filters.format) {
    chips.push({ key: "format", label: FORMAT_LABEL[filters.format] });
  }
  return chips;
}

export function CampaignFilters({
  tabs,
  tab,
  filters,
  onChange,
  onClear,
  previewCount,
}: {
  /**
   * The list's tab strip, rendered at the left of the same row as search and
   * the filter button.
   *
   * Taken as a slot rather than left for the page to lay out beside this,
   * because the three controls share one row and one set of breakpoints — and
   * because the chips below them belong to the same block. The page still owns
   * what the tabs *are*.
   */
  tabs?: React.ReactNode;
  /**
   * Which axes the dialog offers. Format is event-only, since a promotion has
   * none. Status is not here at all — it is the chip row over the grid.
   */
  tab: CampaignTab;
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
  /** How many campaigns a draft would leave, for the dialog's primary action. */
  previewCount: (draft: DropdownFilters) => number;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DropdownFilters>(NO_DROPDOWNS);

  const chips = activeChips(filters);

  // Seeded on open rather than kept in sync: the dialog is a scratch copy, and
  // a chip removed behind it must not rewrite a draft being edited.
  const openDialog = () => {
    setDraft({
      product: filters.product,
      status: filters.status,
      segment: filters.segment,
      format: filters.format,
    });
    setOpen(true);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const previewed = previewCount(draft);

  return (
    <div className="flex flex-col gap-3">
      {/* The list's toolbar: tabs on the left, search and filter pushed to the
          right. One row from `md` — below that there is no width for both, so
          the controls drop under the tabs and the search takes the full line. */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        {tabs && (
          // The bleed lets the tab strip scroll past the page padding on a
          // phone. From `md` the tabs fit, so it is cancelled rather than left
          // to eat into the row beside them.
          <div className="transparent-tabs scrollable-tabs -mx-4 min-w-0 pl-4 md:mx-0 md:pl-0">
            {tabs}
          </div>
        )}

        {/* `items-center` because the two are not quite the same height — the
            small search box is 38px and the button 36px. */}
        <div className="flex items-center gap-2.5 md:ml-auto md:shrink-0">
          <SearchInput
            placeholder="ค้นหาชื่อแคมเปญ"
            value={filters.search}
            onChange={(search) => onChange({ search })}
            onClear={() => onChange({ search: "" })}
            // `sm`, not the default `lg`: at 44px the field towered over the
            // button beside it and over the tabs it shares the row with.
            size="sm"
            className="min-w-0 flex-1 md:w-[320px] md:flex-none"
          />
          <Button
            variant="outline"
            size="lg"
            className="shrink-0"
            leftIcon={<FunnelSimpleIcon size={16} weight="bold" />}
            onClick={openDialog}
          >
            ตัวกรอง
            {chips.length > 0 && (
              <span className="ml-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-primary-action px-1 text-meta font-bold tabular-nums text-on-primary-action">
                {chips.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ [chip.key]: null } as Partial<Filters>)}
              aria-label={`เอาตัวกรอง ${chip.label} ออก`}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-border bg-card py-1 pl-2.5 pr-1.5 text-label font-medium text-foreground transition-colors hover:bg-muted"
            >
              {chip.label}
              <XIcon size={13} weight="bold" className="text-muted-foreground" />
            </button>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="cursor-pointer px-1 text-label font-medium text-primary-action hover:underline"
          >
            ล้างทั้งหมด
          </button>
        </div>
      )}

      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title="ตัวกรอง"
        // On the title row rather than beside the primary action: it undoes
        // the whole dialog, so pairing it with "ดูผลลัพธ์" read as the other
        // half of one decision when it is really the opposite of all of them.
        headerAction={{
          label: "ล้างทั้งหมด",
          // The status chip lives outside the dialog; keep it.
          onClick: () => setDraft((d) => ({ ...NO_DROPDOWNS, status: d.status })),
        }}
        closeOnBackdrop
        desktopContentClassName="w-[440px] max-w-full"
      >
        <div className="flex flex-col gap-4 pt-1">
          <ChipGroup
            label="สินทรัพย์"
            options={PRODUCT_OPTIONS}
            value={draft.product}
            onChange={(product: CampaignProduct | null) =>
              setDraft((d) => ({ ...d, product }))
            }
          />
          <ChipGroup
            label="กลุ่มลูกค้า"
            options={SEGMENT_OPTIONS}
            value={draft.segment}
            onChange={(segment: ClientSegment | null) =>
              setDraft((d) => ({ ...d, segment }))
            }
          />
          {tab === "event" && (
            <ChipGroup
              label="รูปแบบงาน"
              options={FORMAT_OPTIONS}
              value={draft.format}
              onChange={(format: CampaignFormat | null) =>
                setDraft((d) => ({ ...d, format }))
              }
            />
          )}

          {/* The count is the point of committing rather than applying live:
              it is the only way to know the draft leaves anything before the
              dialog closes over the list. Alone on its row now that clearing
              has moved up to the title. */}
          <div className="mt-1 border-t border-border pt-4">
            <Button variant="primary" size="lg" className="w-full" onClick={apply}>
              ดูผลลัพธ์ ({previewed})
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </div>
  );
}
