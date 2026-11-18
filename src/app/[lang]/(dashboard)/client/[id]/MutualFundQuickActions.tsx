"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@sarunyu/system-one";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MutualFundFilterBottomSheet,
  MutualFundFilterModal,
  EMPTY_FILTER_STATE,
  type MutualFundFilterState,
} from "./MutualFundFilterPanel";
import { navWrite } from "@/lib/nav-session";

export const MUTUAL_FUND_FILTER_STATE_KEY = "nav:mutual-fund-filter-state";

type QuickActionVariant = "search" | "tax";

/** Decorative rings + illustration, positioned per Figma 360:77101 (search) / 360:77110 (tax). */
function QuickActionArt({ variant }: { variant: QuickActionVariant }) {
  const a = MF_ASSETS.quickAction;
  const isSearch = variant === "search";
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isSearch ? a.searchRingOuter : a.taxRingOuter}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute bottom-[-33px] block size-[88px] max-w-none ${isSearch ? "right-[-24.5px]" : "right-[-25px]"}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={isSearch ? a.searchRingInner : a.taxRingInner}
        alt=""
        aria-hidden
        className={`pointer-events-none absolute bottom-[-26px] block size-[68px] max-w-none ${isSearch ? "right-[-17.5px]" : "right-[-18px]"}`}
      />
      {isSearch ? (
        <span className="pointer-events-none absolute bottom-0 right-[4.5px] size-[42px] overflow-hidden origin-bottom-right transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.search} alt="" className="absolute left-[-45.3%] top-[-44.7%] block size-[190%] max-w-none" />
        </span>
      ) : (
        <Image
          src={a.tax}
          alt=""
          width={45}
          height={45}
          className="pointer-events-none absolute bottom-[3px] right-[6px] size-[45px] max-w-none object-cover object-bottom origin-bottom-right transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      )}
    </>
  );
}

function QuickActionCard({
  variant,
  title,
  href,
  onClick,
}: {
  variant: QuickActionVariant;
  /** Two lines, as in the design. */
  title: [string, string];
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <div
      className={`relative flex flex-col gap-1 overflow-clip rounded bg-gradient-to-b to-white px-3 py-2 ${
        variant === "search" ? "from-[#f3f8fe]" : "from-[#fafafa]"
      }`}
    >
      <QuickActionArt variant={variant} />
      <p className="relative text-sm font-bold leading-[24px] text-[#101828]">
        {title[0]}
        <br />
        {title[1]}
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MF_ASSETS.quickAction.arrow}
        alt=""
        className="relative block size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
    </div>
  );

  // Hover: lift 2px + deeper shadow; arrow nudges right and the art grows (see QuickActionArt).
  // Trailing `!` on hover utilities — system-one's unlayered CSS otherwise wins over `hover:`.
  const className =
    "group min-w-0 flex-1 rounded-lg bg-white p-1 no-underline text-inherit lg:w-[280px] lg:flex-none " +
    "shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)] " +
    "transition-[transform,box-shadow] duration-200 ease-out " +
    "hover:-translate-y-0.5! hover:shadow-[0px_0px_2px_rgba(102,102,102,0.2),0px_8px_16px_rgba(102,102,102,0.18)]! " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] " +
    "motion-reduce:transition-none motion-reduce:hover:translate-y-0!";

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={`${className} cursor-pointer text-left`}>
      {body}
    </button>
  );
}

/** Opens the filter panel in place; only navigates to the results page once "ตกลง" is pressed. */
function FilterEntryTile() {
  const router = useRouter();
  const isPhone = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleApply = (state: MutualFundFilterState) => {
    navWrite(MUTUAL_FUND_FILTER_STATE_KEY, JSON.stringify(state));
    router.push("/product-catalog/mutual-fund/tools/filter");
  };

  return (
    <>
      <QuickActionCard
        variant="search"
        title={["ค้นหากองทุน", "ที่คุณสนใจ"]}
        onClick={() => setOpen(true)}
      />
      {isPhone ? (
        <MutualFundFilterBottomSheet
          open={open}
          initialState={EMPTY_FILTER_STATE}
          onOpenChange={setOpen}
          onApply={handleApply}
        />
      ) : (
        <MutualFundFilterModal
          open={open}
          initialState={EMPTY_FILTER_STATE}
          onClose={() => setOpen(false)}
          onApply={handleApply}
        />
      )}
    </>
  );
}

/** Figma 40135:224276 (mobile) / 40118:77384 (desktop) */
export function MutualFundQuickActions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex w-full gap-2.5 lg:justify-center lg:gap-8 ${className}`.trim()}>
      <FilterEntryTile />
      <QuickActionCard
        variant="tax"
        title={["แนะนำกองทุน", "ลดหย่อนภาษี"]}
        href="/product-catalog/mutual-fund/tools/tax-planning"
      />
    </div>
  );
}
