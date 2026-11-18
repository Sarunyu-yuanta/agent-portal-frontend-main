"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, FileTextIcon } from "@phosphor-icons/react";
import { TOP_PICK_ROWS } from "./global-bond-data";
import {
  BORDER_COLOR,
  BondLogo,
  DetailRow,
  TopPickTag,
} from "./fixed-income-shared";
import { GlobalBondListCta } from "./GlobalBondDetailBondList";

export function GlobalBondTopPickAccordion() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  return (
    <div
      className="flex flex-col w-full rounded-xl overflow-hidden bg-white"
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
              className="flex w-full items-center gap-2 p-3 bg-white border-none cursor-pointer text-left"
            >
              <BondLogo src={row.logo} className="size-8 rounded" />
              <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                <span className="text-sm font-bold leading-[24px] text-[#101828] truncate">{row.name}</span>
                <div className="flex gap-0.5 items-center min-h-[18px]">
                  <span className="text-xs leading-[20px] text-[#4a5565]">{row.isin}</span>
                  <TopPickTag small />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
                {expanded ? (
                  <CaretUpIcon size={22} className="text-[#101828]" />
                ) : (
                  <CaretDownIcon size={22} className="text-[#101828]" />
                )}
              </div>
            </button>
            {expanded && (
              <div className="flex flex-col gap-3 items-center px-3 pb-3 w-full">
                <div className="flex flex-col gap-1 rounded-md bg-[#f9fafb] px-3 py-2 w-full">
                  <DetailRow label="Currency" value={row.currency} />
                  <DetailRow label="Coupon Rate" value={row.couponRate} />
                  <DetailRow label="Price" value={row.price} />
                  <DetailRow label="ผลตอบแทนโดยประมาณ" value={row.yieldPct} />
                  <DetailRow label="วันครบกำหนด" value={row.maturity} />
                  <DetailRow label="ระยะเวลา (ปี)" value={row.duration} />
                  <div className="flex gap-3 items-start w-full text-sm leading-[24px]">
                    <span className="flex-1 text-[#4a5565]">เอกสารที่เกี่ยวข้อง</span>
                    <button type="button" className="inline-flex items-center gap-0.5 border-none bg-transparent p-0 cursor-pointer">
                      <span className="text-sm text-[#2b7fff] underline">Factsheet</span>
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
