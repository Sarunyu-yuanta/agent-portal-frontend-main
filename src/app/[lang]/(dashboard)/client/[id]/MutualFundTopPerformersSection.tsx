"use client";

import Image from "next/image";
import Link from "next/link";
import { Button, Chip } from "@sarunyu/system-one";
import { ChipScroller } from "@/components/ui/chip-scroller";
import { MutualFundPerformerStack, MutualFundSeeMoreIcon } from "./MutualFundCard";
import { MF_ASSETS } from "./mutual-fund-assets";
import {
  MOBILE_FUND_GROUPS,
  mutualFundGroupHref,
  type MobileFundGroupId,
  type MutualFund,
} from "./mutual-fund-data";

/** Figma 40118:77235 — 568×458 left column */
export function MutualFundTopPerformersSection({
  groupId,
  onGroupChange,
  funds,
  onFundSelect,
  onSeeAll,
}: {
  groupId: MobileFundGroupId;
  onGroupChange: (id: MobileFundGroupId) => void;
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
  onSeeAll?: (groupId: MobileFundGroupId) => void;
}) {
  const seeAllHref = mutualFundGroupHref(groupId);
  return (
    <section className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Image
            src={MF_ASSETS.thumbsUp}
            alt=""
            width={18}
            height={16}
            className="h-[15.625px] w-[17.5px] shrink-0 object-contain"
          />
          <h2 className="flex-1 text-lg font-bold leading-[32px] text-[#101828]">กองทุนผลตอบแทนเด่น</h2>
        </div>

        <div className="-mx-4 md:-mx-8 lg:mx-0">
          <ChipScroller leadInset rowClassName="">
            {MOBILE_FUND_GROUPS.map((group) => (
              <Chip
                key={group.id}
                label={group.label}
                type="single"
                size="small"
                selected={groupId === group.id}
                onClick={() => onGroupChange(group.id)}
                className="shrink-0"
              />
            ))}
          </ChipScroller>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-xl bg-[#f3f4f6] p-2">
        <div className="flex h-8 items-center justify-end px-3">
          <span className="text-xs font-semibold leading-[20px] text-[#101828]">
            ผลดำเนินงานย้อนหลัง 1 ปี
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <MutualFundPerformerStack funds={funds} onFundSelect={onFundSelect} />
          {funds.length > 0 ? (
            <Link
              href={seeAllHref}
              className="inline-flex w-fit shrink-0 no-underline"
              onClick={
                onSeeAll
                  ? (e) => {
                      e.preventDefault();
                      onSeeAll(groupId);
                    }
                  : undefined
              }
            >
              <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0">
                ดูเพิ่มเติม
              </Button>
            </Link>
          ) : (
            <Button variant="plain" size="xl" rightIcon={<MutualFundSeeMoreIcon />} className="w-fit shrink-0" disabled>
              ดูเพิ่มเติม
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
