"use client";

import { useState } from "react";
import { CaretDownIcon, CaretUpIcon, FileTextIcon } from "@phosphor-icons/react";
import type { GlobalBondRow } from "./global-bond-data";
import {
  BORDER_COLOR,
  BondLogo,
  DetailRow,
  TopPickTag,
} from "./fixed-income-shared";

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
      <div
        className="size-4 rounded-[2px] border-[1.5px] border-[rgba(0,0,0,0.1)] bg-white"
        aria-hidden
      />
    </div>
  );
}

export function GlobalBondAllAccordion({ bonds }: { bonds: GlobalBondRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [prevBonds, setPrevBonds] = useState(bonds);
  if (prevBonds !== bonds) {
    setPrevBonds(bonds);
    setExpandedId(null);
  }

  if (bonds.length === 0) {
    return (
      <div
        className="w-full rounded-lg overflow-hidden bg-white px-4 py-10 text-center text-sm text-[#6a7282]"
        style={{ border: `1px solid ${BORDER_COLOR}` }}
      >
        ไม่พบรายการที่ตรงกับตัวกรอง
      </div>
    );
  }

  return (
    <div
      className="flex flex-col w-full rounded-lg overflow-hidden bg-white"
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
              className="flex w-full items-center gap-2 p-3 bg-white border-none cursor-pointer text-left"
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
                  <span className="truncate text-sm font-bold leading-[24px] text-[#4a5565]">
                    {row.name}
                  </span>
                  <div className="flex min-h-[18px] items-center gap-0.5">
                    <span className="text-xs leading-[20px] text-[#4a5565]">{row.isin}</span>
                    {row.topPick && <TopPickTag small />}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-normal leading-[24px] text-[#4a5565]">{row.yieldPct}</span>
                  {expanded ? (
                    <CaretUpIcon size={22} className="text-[#4a5565]" />
                  ) : (
                    <CaretDownIcon size={22} className="text-[#4a5565]" />
                  )}
                </div>
              </div>
            </button>
            {expanded && (
              <div className="flex flex-col items-center gap-3 px-3 pb-3 w-full">
                <div className="flex w-full flex-col gap-1 rounded-md bg-[#f9fafb] px-3 py-2">
                  <DetailRow label="Currency" value={row.currency} />
                  <DetailRow label="Coupon Rate" value={row.couponRate} />
                  <DetailRow label="Price" value={row.price} />
                  <DetailRow label="ผลตอบแทนโดยประมาณ" value={row.yieldPct} />
                  <DetailRow label="วันครบกำหนด" value={row.maturity} />
                  <DetailRow label="ระยะเวลา (ปี)" value={row.duration} />
                  <div className="flex w-full items-start gap-3 text-sm leading-[24px]">
                    <span className="flex-1 text-[#4a5565]">เอกสารที่เกี่ยวข้อง</span>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0"
                    >
                      <span className="text-sm text-[#2b7fff] underline">Factsheet</span>
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
