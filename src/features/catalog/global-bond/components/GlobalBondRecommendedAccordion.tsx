"use client";

import { useState } from "react";
import { Button } from "@sarunyu/system-one";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import {
  RECOMMENDED_ISSUER_ROWS,
  type GlobalBondIssuerId,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import {
  BORDER_COLOR,
  BondLogo,
  DetailRow,
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { useT } from "@/i18n/I18nProvider";

function ViewInfoButton({ onClick }: { onClick?: () => void }) {
  const t = useT();
  return (
    <Button variant="outline" size="xl" className="w-full max-w-[343px]" onClick={onClick}>
      {t.products.common.viewInfo}
    </Button>
  );
}

export function GlobalBondRecommendedAccordion({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {RECOMMENDED_ISSUER_ROWS.map((row, i) => {
        const expanded = expandedIdx === i;
        const isLast = i === RECOMMENDED_ISSUER_ROWS.length - 1;
        return (
          <div
            key={i}
            className="w-full"
            style={{ borderBottom: isLast ? undefined : `1px solid ${BORDER_COLOR}` }}
          >
            <button
              type="button"
              onClick={() => setExpandedIdx(expanded ? null : i)}
              className="flex min-h-12 w-full cursor-pointer items-center gap-2 border-none bg-white p-3 text-left"
            >
              <BondLogo src={row.logo} className="size-8 rounded" />
              <span
                className={`min-w-0 flex-1 truncate text-sm leading-[24px] font-bold ${
                  expanded ? "text-neutral-900" : "text-neutral-600"
                }`}
              >
                {row.issuer}
              </span>
              {expanded ? (
                <CaretUpIcon size={22} className="shrink-0 text-neutral-900" />
              ) : (
                <CaretDownIcon size={22} className="shrink-0 text-neutral-900" />
              )}
            </button>
            {expanded && (
              <div className="flex w-full flex-col items-center gap-3 px-3 pb-3">
                <div className="flex w-full flex-col gap-1 rounded-lg bg-neutral-100 px-3 py-2">
                  <DetailRow label={cols.couponRate} value={row.couponRate} />
                  <DetailRow label={cols.maturity} value={row.maturity} />
                  <hr
                    className="m-0 w-full border-0"
                    style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
                  />
                  <span className="text-xs leading-[20px] text-neutral-500">
                    {cols.creditRating}
                  </span>
                  <DetailRow label="S&P" value={row.sp} />
                  <DetailRow label="Moody's" value={row.moodys} />
                  <DetailRow label="Fitch" value={row.fitch} />
                  <hr
                    className="m-0 w-full border-0"
                    style={{ borderTop: `1px solid ${BORDER_COLOR}` }}
                  />
                  <DetailRow label={cols.estimatedYield} value={row.estimatedYield} />
                </div>
                <ViewInfoButton onClick={() => onIssuerSelect?.(row.id)} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
