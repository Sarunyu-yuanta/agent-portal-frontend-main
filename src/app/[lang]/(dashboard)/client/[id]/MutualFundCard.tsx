"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag } from "@sarunyu/system-one";
import { useId, useMemo } from "react";
import { fundHasHighlightTag, fundHasViewTag, getNavHistory, type MutualFund } from "./mutual-fund-data";
import { MF_ASSETS, mutualFundRiskMeterSrc } from "./mutual-fund-assets";

const LIST_CARD_CLASS =
  "shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]";

function mutualFundDetailHref(fundId: string) {
  return `/product-catalog/mutual-fund/${encodeURIComponent(fundId)}`;
}

export { mutualFundDetailHref };

/** Figma Button plain xl — chevron icon (#0A6EE7, 20×20). */
export function MutualFundSeeMoreIcon() {
  return (
    <Image src={MF_ASSETS.arrowRightBlue} alt="" width={20} height={20} className="size-5 shrink-0" />
  );
}

function PickTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#eff6ff] px-1 py-0.5">
      <Image src={MF_ASSETS.performersTagHighlight} alt="" width={11} height={11} className="size-[11px] shrink-0" />
      <span
        className="text-micro leading-[15px] font-normal bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-transparent"
      >
        Pick
      </span>
    </span>
  );
}

/** Figma Risk Meter — 16×16 clip box with inset arc asset (node 36234:961852). */
function RiskMeterIcon({ risk }: { risk: number }) {
  return (
    <span className="relative size-4 shrink-0 overflow-clip">
      <span className="absolute bottom-[29.17%] left-[8.33%] right-[8.33%] top-1/4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mutualFundRiskMeterSrc(risk)}
          alt=""
          className="absolute inset-0 block size-full max-w-none"
        />
      </span>
    </span>
  );
}

/** Figma risk pill — compact badge (node 36234:961677 / 39889:667997). */
export function RiskBadge({ risk, inline }: { risk: number; inline?: boolean }) {
  const pill = (
    <span className="inline-flex h-5 shrink-0 self-start items-center gap-1 rounded-2xl border border-black/10 bg-white px-2">
      <RiskMeterIcon risk={risk} />
      <span className="text-xs font-semibold leading-[20px] text-[#4a5565] whitespace-nowrap">risk: {risk}</span>
    </span>
  );

  if (inline) return pill;

  return (
    <div className="flex w-full shrink-0 gap-1 items-start">
      <div className="flex h-5 shrink-0 flex-col items-start">{pill}</div>
    </div>
  );
}

/** Figma 40544:184598 / 40544:190783 — the "View"/"Highlight" filter chip above the fund list. */
export function TagFilterChip({
  icon,
  label,
  active,
  onClick,
  selectedBadge = true,
}: {
  /** An image URL, or a ready-made 16px icon for chips with no artwork. */
  icon: string | React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  /** The check overlaid on the icon while active. Off where the chips act as
   *  a pick-one switch and the blue outline already says which is on. */
  selectedBadge?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex shrink-0 cursor-pointer items-center gap-0.5 overflow-hidden rounded-full border py-1.5 pl-1.5 pr-2.5 transition-colors ${
        active
          ? "border-[#0a6ee7] bg-[#f3f8fe] hover:bg-[#e4f0fd]!"
          : "border-black/10 bg-white hover:bg-black/[0.03]!"
      }`}
    >
      <span className="relative size-4 shrink-0 overflow-hidden rounded-full">
        {typeof icon === "string" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={icon} alt="" className="absolute inset-0 block size-full max-w-none" />
        ) : (
          icon
        )}
      </span>
      <span className={`text-xs leading-[20px] whitespace-nowrap ${active ? "text-[#0a6ee7]" : "text-[#4a5565]"}`}>
        {label}
      </span>
      {active && selectedBadge ? (
        <span className="pointer-events-none absolute left-[-1px] top-1/2 size-[28px] -translate-y-1/2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MF_ASSETS.tagChipSelectedBadge}
            alt=""
            className="absolute inset-0 block size-full max-w-none"
          />
        </span>
      ) : null}
    </button>
  );
}

function ListCardMetaTag({
  iconSrc,
  label,
  className,
  labelClassName,
}: {
  iconSrc: string;
  label: string;
  className: string;
  labelClassName: string;
}) {
  return (
    <span className={`inline-flex items-center justify-center gap-0.5 overflow-hidden rounded px-1 py-0.5 ${className}`}>
      <span className="relative size-3.5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={iconSrc} alt="" className="absolute inset-0 block size-full max-w-none" />
      </span>
      <span className={`text-micro font-normal leading-[18px] whitespace-nowrap ${labelClassName}`}>{label}</span>
    </span>
  );
}

/** View / Highlight badges for one fund — only the tags it actually carries. */
export function FundTagBadges({ fund }: { fund: MutualFund }) {
  const view = fundHasViewTag(fund);
  const highlight = fundHasHighlightTag(fund);
  if (!view && !highlight) return null;
  return (
    <>
      {view ? (
        <ListCardMetaTag
          iconSrc={MF_ASSETS.performersTagView}
          label="View"
          className="bg-[#f6f3ef]"
          labelClassName="text-[#935737]"
        />
      ) : null}
      {highlight ? (
        <ListCardMetaTag
          iconSrc={MF_ASSETS.performersTagHighlight}
          label="Highlight"
          className="bg-[#eff6ff]"
          labelClassName="text-[#0a6ee7]"
        />
      ) : null}
    </>
  );
}

function ListCardPercentPill({ changePct }: { changePct: string }) {
  const positive = changePct.startsWith("+");
  const value = changePct.replace(/^[+-]/, "");

  return (
    <span
      className={`inline-flex items-center overflow-hidden rounded px-1.5 py-0.5 text-xs leading-[20px] ${
        positive ? "bg-[#dbfce7] text-[#008236]" : "bg-[#fee2e2] text-[#fb2c36]"
      }`}
    >
      {positive ? <span>+</span> : null}
      <span>{value}</span>
    </span>
  );
}

/** Figma 39889:667997 — price row (gain vs neutral abs). */
function ListCardPriceChange({ fund }: { fund: MutualFund }) {
  const absNeutral = fund.changeAbs === "0.0000";
  const absValue = fund.changeAbs.replace(/^\+/, "");

  return (
    <div className="flex shrink-0 flex-col items-end whitespace-nowrap">
      <div className="flex items-center justify-end gap-1 text-sm font-bold leading-[24px] text-[#101828]">
        <span>{fund.price}</span>
        <span>{fund.currency}</span>
      </div>
      {absNeutral ? (
        <div className="flex w-[105px] items-center gap-1">
          <span className="h-4 flex-1 text-right text-xs leading-[20px] text-[#4a5565]">{fund.changeAbs}</span>
          <ListCardPercentPill changePct={fund.changePct} />
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs leading-[20px] text-[#008236]">
          <span className="flex items-center">
            <span>+</span>
            <span>{absValue}</span>
          </span>
          <ListCardPercentPill changePct={fund.changePct} />
        </div>
      )}
    </div>
  );
}

function PriceChange({ fund }: { fund: MutualFund }) {
  const isNeutral = fund.changeAbs === "0.0000";
  const isPositive = !isNeutral && fund.changePct.startsWith("+");
  const valueColor = isNeutral ? "#4a5565" : isPositive ? "#008236" : "#fb2c36";

  return (
    <div className="flex flex-col items-end shrink-0 whitespace-nowrap">
      <div className="flex items-center gap-1 text-sm font-bold leading-[24px] text-[#101828]">
        <span>{fund.price}</span>
        <span>{fund.currency}</span>
      </div>
      <div className="flex items-center gap-1 text-xs leading-[20px]" style={{ color: valueColor }}>
        <span>{fund.changeAbs}</span>
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs leading-[20px] bg-[#dbfce7] text-[#008236]">
          {fund.changePct}
        </span>
      </div>
    </div>
  );
}

const SPARK_W = 48;
const SPARK_H = 30;
const SPARK_SAMPLES = 24;

/**
 * The fund's last year of NAV as a 48×30 line + fade, styled like the original
 * sparkline artwork (Figma "Line Chart"): green when the year closed up, red
 * when down. Same series the detail page charts, so the two always match.
 */
function Sparkline({ fund }: { fund: MutualFund }) {
  const gradientId = useId();
  const points = useMemo(() => {
    const history = getNavHistory(fund.id);
    if (!history || history.points.length < 2) return null;
    const all = history.points;
    const latest = Date.parse(all[all.length - 1].date);
    const year = all.filter((p) => Date.parse(p.date) >= latest - 365 * 86_400_000);
    const series = year.length >= 2 ? year : all;
    const step = Math.max(1, (series.length - 1) / (SPARK_SAMPLES - 1));
    const sampled: number[] = [];
    for (let i = 0; i < SPARK_SAMPLES && Math.round(i * step) < series.length; i += 1) {
      sampled.push(series[Math.round(i * step)].nav);
    }
    if (sampled[sampled.length - 1] !== series[series.length - 1].nav) sampled.push(series[series.length - 1].nav);
    return sampled;
  }, [fund.id]);

  if (!points) return <div className="h-[30px] w-12 shrink-0" />;

  // Floor the vertical range at 4% of the price: a fund that moved 0.7% in a
  // year should look calm, not have its daily noise stretched to full height.
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  const span = Math.max(hi - lo, ((hi + lo) / 2) * 0.04) || 1;
  const min = (hi + lo) / 2 - span / 2;
  const pad = 0.5;
  const coords = points.map((v, i) => [
    pad + (i / (points.length - 1)) * (SPARK_W - pad * 2),
    pad + (1 - (v - min) / span) * (SPARK_H - pad * 2),
  ]);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`).join("");
  const area = `${line}L${(SPARK_W - pad).toFixed(2)} ${SPARK_H - pad}L${pad} ${SPARK_H - pad}Z`;
  const color = points[points.length - 1] >= points[0] ? "#00C951" : "#FB2C36";

  return (
    <svg
      className="h-[30px] w-12 shrink-0 overflow-visible"
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} opacity="0.24" />
      <path d={line} stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Figma 39889:667996 — grid card on performers list page. */
export function MutualFundListCard({
  fund,
  onSelect,
  showView = true,
  showHighlight = true,
}: {
  fund: MutualFund;
  onSelect?: (fundId: string) => void;
  showView?: boolean;
  showHighlight?: boolean;
}) {
  const href = mutualFundDetailHref(fund.id);
  const inner = (
    <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-clip">
      <div className="flex w-full items-start gap-2">
        <div className="flex h-[52px] min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">{fund.symbol}</span>
          <p className="line-clamp-2 text-xs leading-[20px] text-[#4a5565]">{fund.name}</p>
        </div>
        <Sparkline fund={fund} />
        <ListCardPriceChange fund={fund} />
      </div>
      <div className="flex h-5 w-full items-center gap-1">
        <div className="flex h-5 shrink-0 flex-col items-start">
          <RiskBadge risk={fund.risk} inline />
        </div>
        {showView ? (
          <ListCardMetaTag
            iconSrc={MF_ASSETS.performersTagView}
            label="View"
            className="bg-[#f6f3ef]"
            labelClassName="text-[#935737]"
          />
        ) : null}
        {showHighlight ? (
          <ListCardMetaTag
            iconSrc={MF_ASSETS.performersTagHighlight}
            label="Highlight"
            className="bg-[#eff6ff]"
            labelClassName="text-[#0a6ee7]"
          />
        ) : null}
      </div>
    </div>
  );

  const className = `flex w-full cursor-pointer items-center rounded-lg bg-white px-3 py-2 text-left no-underline text-inherit transition-colors hover:bg-black/[0.02]! focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] ${LIST_CARD_CLASS}`;

  if (onSelect) {
    return (
      <Link
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          onSelect(fund.id);
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

/** Figma 40544:186068 (mobile) — flat divider-list row: name + sparkline + tags, no card border. */
export function MutualFundListCardMobile({
  fund,
  onSelect,
  showView = true,
  showHighlight = true,
}: {
  fund: MutualFund;
  onSelect?: (fundId: string) => void;
  showView?: boolean;
  showHighlight?: boolean;
}) {
  const href = mutualFundDetailHref(fund.id);
  const inner = (
    <div className="flex w-full flex-col gap-2">
      <div className="flex w-full items-start justify-end gap-2">
        <div className="flex h-[52px] min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-bold leading-[24px] text-[#101828]">{fund.symbol}</span>
          <p className="line-clamp-2 text-xs leading-[20px] text-[#4a5565]">{fund.name}</p>
        </div>
        <Sparkline fund={fund} />
        <ListCardPriceChange fund={fund} />
      </div>
      <div className="flex w-full items-center gap-1">
        <div className="flex h-5 shrink-0 flex-col items-start">
          <RiskBadge risk={fund.risk} inline />
        </div>
        {showView ? (
          <ListCardMetaTag
            iconSrc={MF_ASSETS.performersTagView}
            label="View"
            className="bg-[#f6f3ef]"
            labelClassName="text-[#935737]"
          />
        ) : null}
        {showHighlight ? (
          <ListCardMetaTag
            iconSrc={MF_ASSETS.performersTagHighlight}
            label="Highlight"
            className="bg-[#eff6ff]"
            labelClassName="text-[#0a6ee7]"
          />
        ) : null}
      </div>
    </div>
  );

  const className =
    "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-left no-underline text-inherit transition-colors hover:bg-black/[0.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7]";

  if (onSelect) {
    return (
      <Link
        href={href}
        className={className}
        onClick={(e) => {
          e.preventDefault();
          onSelect(fund.id);
        }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

/** Figma node 40118:77260 — Mutual fund card row */
export function MutualFundCard({
  fund,
  onSelect,
}: {
  fund: MutualFund;
  onSelect?: (fundId: string) => void;
}) {
  const content = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex min-w-0 items-center gap-1">
            <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">
              {fund.symbol}
            </span>
            {fund.isPick && <PickTag />}
          </div>
          <p className="truncate text-xs leading-[20px] text-[#4a5565]">{fund.name}</p>
        </div>
        <Sparkline fund={fund} />
        <PriceChange fund={fund} />
      </div>
      <RiskBadge risk={fund.risk} />
    </div>
  );

  const href = mutualFundDetailHref(fund.id);
  const rowClassName =
    "block w-full p-3 text-left no-underline text-inherit cursor-pointer hover:bg-black/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-inset";

  if (onSelect) {
    return (
      <Link
        href={href}
        className={rowClassName}
        onClick={(e) => {
          e.preventDefault();
          onSelect(fund.id);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <Link href={href} className={rowClassName}>
      {content}
    </Link>
  );
}

/** Top performers — single white card with row dividers (Figma 40118:77257). */
export function MutualFundPerformerStack({
  funds,
  onFundSelect,
}: {
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
}) {
  const visible = funds.slice(0, 3);
  return (
    <div className="w-full overflow-hidden rounded-lg border border-black/10 bg-white">
      {visible.map((fund, i) => (
        <div key={fund.id} className={i > 0 ? "border-t border-black/10" : ""}>
          <MutualFundCard fund={fund} onSelect={onFundSelect} />
        </div>
      ))}
    </div>
  );
}

/** Figma 360:76672 — theme card row: symbol (no fund name), sparkline, price, then risk + View/Highlight tags. */
function MutualFundThemeRow({
  fund,
  onSelect,
}: {
  fund: MutualFund;
  onSelect?: (fundId: string) => void;
}) {
  const href = mutualFundDetailHref(fund.id);
  const className =
    "block w-full p-3 text-left no-underline text-inherit cursor-pointer hover:bg-black/[0.02] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6ee7] focus-visible:ring-inset";

  return (
    <Link
      href={href}
      className={className}
      onClick={
        onSelect
          ? (e) => {
              e.preventDefault();
              onSelect(fund.id);
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-2">
        <div className="flex w-full items-center gap-2">
          <span className="min-w-0 flex-1 self-start break-words text-sm font-bold leading-[24px] text-[#101828]">
            {fund.symbol}
          </span>
          <Sparkline fund={fund} />
          <ListCardPriceChange fund={fund} />
        </div>
        <div className="flex h-5 w-full items-center gap-1">
          <RiskBadge risk={fund.risk} inline />
          {fundHasViewTag(fund) ? (
            <ListCardMetaTag
              iconSrc={MF_ASSETS.performersTagView}
              label="View"
              className="bg-[#f6f3ef]"
              labelClassName="text-[#935737]"
            />
          ) : null}
          {fundHasHighlightTag(fund) ? (
            <ListCardMetaTag
              iconSrc={MF_ASSETS.performersTagHighlight}
              label="Highlight"
              className="bg-[#eff6ff]"
              labelClassName="text-[#0a6ee7]"
            />
          ) : null}
        </div>
      </div>
    </Link>
  );
}

/** Theme list card — single white container with row dividers (Figma 360:76670). */
export function MutualFundThemeList({
  funds,
  onFundSelect,
}: {
  funds: MutualFund[];
  onFundSelect?: (fundId: string) => void;
}) {
  const visible = funds.slice(0, 3);
  return (
    <div className="w-full shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
      {visible.map((fund, i) => (
        <div key={fund.id} className={i > 0 ? "border-t border-black/10" : ""}>
          <MutualFundThemeRow fund={fund} onSelect={onFundSelect} />
        </div>
      ))}
    </div>
  );
}

/** Insight card fund tag — library Tag for symbol chips only */
export function MutualFundSymbolTag({ symbol }: { symbol: string }) {
  return <Tag text={symbol} variant="blue" size="small" />;
}
