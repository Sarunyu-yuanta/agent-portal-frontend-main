"use client";

import Image from "next/image";
import {
  MF_ASSETS,
  mutualFundRiskMeterSrc,
} from "@/features/catalog/mutual-fund/lib/mutual-fund-assets";
import { useT } from "@/i18n/I18nProvider";

export function RiskTag({ risk }: { risk: number }) {
  const t = useT();
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute top-1/4 right-[8.33%] bottom-[29.17%] left-[8.33%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(risk)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs leading-[20px] font-semibold whitespace-nowrap text-neutral-600">
        {t.fund.tags.risk(risk)}
      </span>
    </span>
  );
}

export function FxRiskTag({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <Image src={MF_ASSETS.coinsIcon} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className="text-xs leading-[20px] font-semibold whitespace-nowrap text-neutral-600">
        {label}
      </span>
    </span>
  );
}

export function CreditCardTag() {
  const t = useT();
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-2xl border border-black/10 bg-white px-2 py-0.5">
      <span className="relative size-5 shrink-0 overflow-clip">
        <span className="absolute top-1/4 right-[8.33%] bottom-[29.17%] left-[8.33%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mutualFundRiskMeterSrc(4)}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      </span>
      <span className="text-xs leading-[20px] font-semibold whitespace-nowrap text-neutral-600">
        {t.fund.tags.creditCard}
      </span>
    </span>
  );
}
