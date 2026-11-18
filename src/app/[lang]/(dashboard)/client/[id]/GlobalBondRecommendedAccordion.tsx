"use client";

import { useState } from "react";
import { Button } from "@sarunyu/system-one";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { RECOMMENDED_ISSUER_ROWS, type GlobalBondIssuerId } from "./global-bond-data";
import { BORDER_COLOR, BondLogo, DetailRow } from "./fixed-income-shared";

function ViewInfoButton({ onClick }: { onClick?: () => void }) {
  return (
    <Button variant="outline" size="xl" className="w-full max-w-[343px]" onClick={onClick}>
      ดูข้อมูล
    </Button>
  );
}

export function GlobalBondRecommendedAccordion({
  onIssuerSelect,
}: {
  onIssuerSelect?: (id: GlobalBondIssuerId) => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div
      className="flex flex-col w-full rounded-xl overflow-hidden bg-white"
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
              className="flex w-full items-center gap-2 p-3 bg-white border-none cursor-pointer text-left min-h-12"
            >
              <BondLogo src={row.logo} className="size-8 rounded" />
              <span
                className={`flex-1 min-w-0 text-sm font-bold leading-[24px] truncate ${
                  expanded ? "text-[#101828]" : "text-[#4a5565]"
                }`}
              >
                {row.issuer}
              </span>
              {expanded ? (
                <CaretUpIcon size={22} className="shrink-0 text-[#101828]" />
              ) : (
                <CaretDownIcon size={22} className="shrink-0 text-[#101828]" />
              )}
            </button>
            {expanded && (
              <div className="flex flex-col gap-3 items-center px-3 pb-3 w-full">
                <div className="flex flex-col gap-1 rounded-lg bg-[#f3f4f6] px-3 py-2 w-full">
                  <DetailRow label="Coupon Rate" value={row.couponRate} />
                  <DetailRow label="วันครบกำหนด" value={row.maturity} />
                  <hr className="w-full border-0 m-0" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
                  <span className="text-xs leading-[20px] text-[#6a7282]">Credit Rating</span>
                  <DetailRow label="S&P" value={row.sp} />
                  <DetailRow label="Moody's" value={row.moodys} />
                  <DetailRow label="Fitch" value={row.fitch} />
                  <hr className="w-full border-0 m-0" style={{ borderTop: `1px solid ${BORDER_COLOR}` }} />
                  <DetailRow label="ผลตอบแทนโดยประมาณ" value={row.estimatedYield} />
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
