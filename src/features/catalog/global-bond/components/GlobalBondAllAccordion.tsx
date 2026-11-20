"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, FileTextIcon } from "@phosphor-icons/react";
import type { GlobalBondRow } from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  BORDER_COLOR,
  BondLogo,
  DetailRow,
  TopPickTag,
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

function IssuerLogo({ src }: { src: string }) {
  return (
    <div className="flex shrink-0 items-center py-0.5">
      <BondLogo src={src} className="size-8 rounded" />
    </div>
  );
}

function BondCheckbox() {
  return (
    <div className="relative flex size-6 shrink-0 items-center justify-center">
      <div className="size-4 rounded-[2px] border-[1.5px] border-black/10 bg-white" aria-hidden />
    </div>
  );
}

export function GlobalBondAllAccordion({
  bonds,
  onClearFilters,
}: {
  bonds: GlobalBondRow[];
  /** Given only while a filter is narrowing a non-empty list — see `GlobalBondAllPage`. */
  onClearFilters?: () => void;
}) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prevBonds, setPrevBonds] = useState(bonds);
  if (prevBonds !== bonds) {
    setPrevBonds(bonds);
    setExpandedId(null);
  }

  if (bonds.length === 0) {
    return (
      <div
        className="w-full overflow-hidden rounded-lg bg-white px-4"
        style={{ border: `1px solid ${BORDER_COLOR}` }}
      >
        <CatalogSectionEmpty
          title={t.products.states.noGlobalBonds}
          onClearFilters={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-lg bg-white"
      style={{ border: `1px solid rgba(0,0,0,0.08)` }}
    >
      {bonds.map((row, i) => {
        const expanded = expandedId === row.id;
        const isLast = i === bonds.length - 1;
        return (
          <div
            key={row.id}
            className="w-full"
            style={{
              borderBottom: isLast ? undefined : `1px solid ${BORDER_COLOR}`,
            }}
          >
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : row.id)}
              className="flex w-full cursor-pointer items-center gap-2 border-none bg-white p-3 text-left"
            >
              <div
                className="shrink-0"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="presentation"
              >
                <BondCheckbox />
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <IssuerLogo src={row.logo} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm leading-[24px] font-bold text-neutral-600">
                    {row.name}
                  </span>
                  <div className="flex min-h-[18px] items-center gap-0.5">
                    <span className="text-xs leading-[20px] text-neutral-600">{row.isin}</span>
                    {row.topPick && <TopPickTag small />}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm leading-[24px] font-normal text-neutral-600">
                    {row.yieldPct}
                  </span>
                  {expanded ? (
                    <CaretUpIcon size={22} className="text-neutral-600" />
                  ) : (
                    <CaretDownIcon size={22} className="text-neutral-600" />
                  )}
                </div>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
