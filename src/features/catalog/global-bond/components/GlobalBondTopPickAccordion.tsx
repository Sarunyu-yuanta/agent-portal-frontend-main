"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, FileTextIcon } from "@phosphor-icons/react";
import { TOP_PICK_ROWS } from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  BORDER_COLOR,
  BondLogo,
  DetailRow,
  TopPickTag,
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { GlobalBondListCta } from "./GlobalBondDetailBondList";
import { useT } from "@/i18n/I18nProvider";

export function GlobalBondTopPickAccordion() {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {TOP_PICK_ROWS.map((row, i) => {
        const expanded = expandedIdx === i;
        const isLast = i === TOP_PICK_ROWS.length - 1;
        return (
          <div
            key={i}
            className="w-full"
            style={{ borderBottom: isLast ? undefined : `1px solid ${BORDER_COLOR}` }}
          >
            <button
              type="button"
              onClick={() => setExpandedIdx(expanded ? null : i)}
              className="flex w-full cursor-pointer items-center gap-2 border-none bg-white p-3 text-left"
            >
              <BondLogo src={row.logo} className="size-8 rounded" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm leading-[24px] font-bold text-neutral-900">
                  {row.name}
                </span>
                <div className="flex min-h-[18px] items-center gap-0.5">
                  <span className="text-xs leading-[20px] text-neutral-600">{row.isin}</span>
                  <TopPickTag small />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm leading-[24px] text-neutral-900">{row.yieldPct}</span>
                {expanded ? (
                  <CaretUpIcon size={22} className="text-neutral-900" />
                ) : (
                  <CaretDownIcon size={22} className="text-neutral-900" />
                )}
              </div>
            </button>
            {expanded && (
              <div className="flex w-full flex-col items-center gap-3 px-3 pb-3">
                <div className="flex w-full flex-col gap-1 rounded-md bg-neutral-50 px-3 py-2">
                  <DetailRow label={cols.currency} value={row.currency} />
                  <DetailRow label={cols.couponRate} value={row.couponRate} />
                  <DetailRow label={cols.price} value={row.price} />
                  <DetailRow label={cols.estimatedYield} value={row.yieldPct} />
                  <DetailRow label={cols.maturity} value={row.maturity} />
                  <DetailRow label={cols.durationYears} value={row.duration} />
                  <div className="flex w-full items-start gap-3 text-sm leading-[24px]">
                    <span className="flex-1 text-neutral-600">
                      {t.products.common.relatedDocuments}
                    </span>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0"
                    >
                      <span className="text-sm text-[#2b7fff] underline">
                        {t.products.common.factsheet}
                      </span>
                      <FileTextIcon size={14} color="#2b7fff" />
                    </button>
                  </div>
                </div>
                <GlobalBondListCta row={row} fullWidth />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
