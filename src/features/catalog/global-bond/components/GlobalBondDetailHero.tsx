"use client";

import Image from "next/image";
import type {
  GlobalBondIssuer,
  MaturityFilter,
  YieldFilter,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";

const HERO_GRADIENT =
  "linear-gradient(90deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.85) 60.096%, rgba(255,255,255,0.72) 84.135%, rgba(255,255,255,0.6) 100%)";

const ASSET_TAG_ICONS = {
  ticker: "/products/fixed-income/fixed-income-tag-newspaper.svg",
  currency: "/products/global-bond/global-bond-tag-currency.svg",
  rating: "/products/global-bond/global-bond-tag-shield.svg",
} as const;

function yieldFilters(t: Dictionary): { id: YieldFilter; label: string }[] {
  return [
    { id: "all", label: t.products.common.all },
    { id: "lt2", label: "< 2%" },
    { id: "2-3", label: "2–3%" },
    { id: "3-4", label: "3–4%" },
    { id: "gt4", label: "> 4%" },
  ];
}

function maturityFilters(t: Dictionary): { id: MaturityFilter; label: string }[] {
  return [
    { id: "all", label: t.products.common.all },
    { id: "short", label: t.products.globalBond.filter.short },
    { id: "long", label: t.products.globalBond.filter.long },
  ];
}

function AssetTag({
  iconSrc,
  label,
  compact,
}: {
  iconSrc: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded bg-[#f3f4f6] whitespace-nowrap text-[rgba(0,0,0,0.6)] ${
        compact
          ? "px-1 py-0.5 text-micro leading-[18px] md:gap-0.5 md:px-2 md:py-1 md:text-xs md:leading-[22px]"
          : "gap-0.5 px-2 py-1 text-xs leading-[22px]"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 14px SVG tag icon; the image optimizer rejects SVG */}
      <img alt="" src={iconSrc} className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

function FilterPillGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  scrollable?: boolean;
}) {
  const group = (
    <div
      className="inline-flex shrink-0 items-center rounded-lg bg-[#f3f3f3] p-1"
      style={{ boxShadow: "0px 0px 0px 1px #e5e7eb" }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`cursor-pointer rounded-lg border-none px-3 py-1.5 text-sm leading-[26px] font-semibold whitespace-nowrap text-[rgba(0,0,0,0.75)] transition-colors ${
              active ? "bg-white" : "bg-transparent"
            }`}
            style={
              active
                ? {
                    boxShadow: "0px 0px 0px 1px #e5e7eb, 0px 1px 2px 0px rgba(0,0,0,0.05)",
                  }
                : undefined
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  if (!scrollable) return group;

  return (
    <div
      className="hide-scrollbar max-w-full overflow-x-auto md:overflow-visible"
      style={{ scrollbarWidth: "none" }}
    >
      {group}
    </div>
  );
}

export function GlobalBondDetailHero({
  issuer,
  yieldFilter,
  maturityFilter,
  onYieldChange,
  onMaturityChange,
  showFilters = true,
}: {
  issuer: GlobalBondIssuer;
  yieldFilter: YieldFilter;
  maturityFilter: MaturityFilter;
  onYieldChange: (id: YieldFilter) => void;
  onMaturityChange: (id: MaturityFilter) => void;
  /**
   * Whether the yield and maturity pills show.
   *
   * Off on the page's Order tab: they filter the bond *list*, which that tab
   * replaces — left on, the page offered three "ทั้งหมด" pills, two of them
   * for a list nobody could see.
   */
  showFilters?: boolean;
}) {
  const t = useT();
  const labels = t.products.globalBond.hero;
  const heroImage = issuer.heroImage ?? "/products/global-bond/global-bond-apple-hero.webp";
  return (
    <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl px-4 py-6 md:p-8">
      <Image
        alt=""
        src={heroImage}
        fill
        priority
        sizes="(max-width: 1280px) 100vw, 1280px"
        className="pointer-events-none object-cover opacity-80"
      />
      <div className="absolute inset-0 rounded-xl" style={{ background: HERO_GRADIENT }} />

      {/* Block 1: Logo, title, tags, description (tablet/desktop) */}
      <div className="relative flex w-full flex-col gap-2 md:gap-1.5 lg:min-h-[83px] lg:justify-between">
        <div className="flex w-full flex-col gap-2 lg:pb-[9px]">
          <div className="flex w-full flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white md:size-8"
                style={{ boxShadow: "0px 0px 0px 1px #e5e7eb" }}
              >
                {/* Sized by `size-full` against the fixed 28/32px box, not by
                    these attributes — they only give the optimizer an intrinsic
                    ratio, so the parent needs no positioning context. */}
                <Image
                  alt=""
                  src={issuer.logo}
                  width={32}
                  height={32}
                  sizes="32px"
                  className="size-full object-cover"
                />
              </div>
              <h2 className="text-lg leading-[30px] font-bold whitespace-nowrap text-[rgba(0,0,0,0.85)] md:text-[32px] md:leading-[48px]">
                {issuer.title}
              </h2>
            </div>
            <div className="hidden flex-wrap items-center gap-[7px] lg:flex">
              <AssetTag iconSrc={ASSET_TAG_ICONS.ticker} label={labels.ticker(issuer.ticker)} />
              <AssetTag
                iconSrc={ASSET_TAG_ICONS.currency}
                label={labels.currency(issuer.currency)}
              />
              <AssetTag iconSrc={ASSET_TAG_ICONS.rating} label={issuer.creditRating} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-[7px] lg:hidden">
            <AssetTag
              compact
              iconSrc={ASSET_TAG_ICONS.ticker}
              label={labels.ticker(issuer.ticker)}
            />
            <AssetTag
              compact
              iconSrc={ASSET_TAG_ICONS.currency}
              label={labels.currency(issuer.currency)}
            />
            <AssetTag compact iconSrc={ASSET_TAG_ICONS.rating} label={issuer.creditRating} />
          </div>
        </div>
        <p className="hidden text-base leading-[28px] font-semibold text-[rgba(0,0,0,0.75)] md:block">
          {issuer.description}
        </p>
      </div>

      {/* Block 2: Description (mobile) + filters */}
      <div className="relative flex w-full flex-col gap-3 md:gap-2">
        <p className="text-sm leading-[26px] font-semibold text-[rgba(0,0,0,0.75)] md:hidden">
          {issuer.description}
        </p>
        <div
          className={`flex-col gap-3 md:gap-2 lg:flex-row lg:items-start lg:gap-10 ${
            showFilters ? "flex" : "hidden"
          }`}
        >
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-xs leading-[22px] whitespace-nowrap text-[rgba(0,0,0,0.75)] md:text-sm md:leading-[26px]">
              {labels.estimatedYield}
            </span>
            <FilterPillGroup
              scrollable
              options={yieldFilters(t)}
              value={yieldFilter}
              onChange={onYieldChange}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-sm leading-[26px] whitespace-nowrap text-[rgba(0,0,0,0.75)]">
              {labels.timeToMaturity}
            </span>
            <FilterPillGroup
              scrollable
              options={maturityFilters(t)}
              value={maturityFilter}
              onChange={onMaturityChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
