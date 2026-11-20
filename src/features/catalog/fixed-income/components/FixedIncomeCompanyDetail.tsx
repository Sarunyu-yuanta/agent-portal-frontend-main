"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import {
  BOND_LOGOS,
  type FixedIncomeBond,
  type FixedIncomeCompany,
} from "@/features/catalog/fixed-income/lib/fixed-income-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  TABLE_SHADOW_SM as TABLE_SHADOW,
  headerBorderStyle,
  cellBorderStyle,
  StatusTag,
  BondLogo,
} from "./fixed-income-shared";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

const GRADIENT_TITLE = "bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-transparent";

const BOND_TABLE_GRID_PRIMARY =
  "145px 80px 109px 71px 76px 93px 128px 116px 106px 106px 82px 97px 116px 145px 72px";

const BOND_TABLE_GRID_SECONDARY =
  "145px 109px 71px 76px 93px 128px 116px 106px 106px 82px 97px 116px 145px 72px";

const getBondTableGrid = (showStatus: boolean) =>
  showStatus ? BOND_TABLE_GRID_PRIMARY : BOND_TABLE_GRID_SECONDARY;

const bondTableRowStyle = (showStatus: boolean) => ({
  display: "grid",
  gridTemplateColumns: getBondTableGrid(showStatus),
  width: "max-content",
  minWidth: "100%",
});

const STICKY_ACTION_HEADER_CLS =
  "sticky right-0 z-20 w-[72px] shrink-0 bg-white border-l border-[rgba(0,0,0,0.1)]";

const STICKY_ACTION_CELL_CLS =
  "sticky right-0 z-10 w-[72px] shrink-0 bg-white group-hover:bg-[#f9fafb] border-l border-[rgba(0,0,0,0.1)] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]";

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded bg-[#f3f4f6] px-2 py-1 text-xs leading-[20px] whitespace-nowrap text-[#4a5565]">
      {label}
    </span>
  );
}

function GuaranteeCell({ value }: { value: string }) {
  if (value === "มีประกัน") {
    return (
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="cursor-pointer border-none bg-transparent p-0 text-sm leading-[24px] whitespace-nowrap text-[#0a6ee7] underline"
      >
        {value}
      </button>
    );
  }
  return <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">{value}</span>;
}

function ViewInfoButton({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex cursor-pointer items-center justify-center rounded border-none bg-[#0a6ee7] px-1.5 py-1 text-xs leading-[22px] font-medium whitespace-nowrap text-white"
    >
      {t.products.common.viewInfo}
    </button>
  );
}

function HeaderCellSimple({
  children,
  className = "",
  align = "left",
  borderLeft,
  borderRight = true,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
  borderLeft?: boolean;
  borderRight?: boolean;
}) {
  return (
    <div
      className={`flex h-[44px] min-w-0 items-center bg-white px-3 ${
        align === "center" ? "justify-center" : align === "right" ? "justify-end" : ""
      } ${className}`}
      style={{
        ...headerBorderStyle({ left: borderLeft, right: borderRight ? undefined : false }),
      }}
    >
      {children != null && children !== "" && (
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>{children}</span>
      )}
    </div>
  );
}

function RatingsHeaderCell() {
  const t = useT();
  return (
    <div
      className="flex h-[44px] min-w-0 flex-col overflow-hidden"
      style={{ ...headerBorderStyle(), gridColumn: "span 2" }}
    >
      <div
        className="flex min-h-0 flex-1 items-center justify-center px-3"
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Ratings</span>
      </div>
      <div className="flex min-h-0 flex-1 items-stretch">
        <div
          className="flex flex-1 items-center justify-center px-3"
          style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
        >
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
            {t.products.fixedIncome.columns.company}
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>
            {t.products.fixedIncome.columns.bond}
          </span>
        </div>
      </div>
    </div>
  );
}

function BondTableHeader({ showStatus }: { showStatus: boolean }) {
  const t = useT();
  const cols = t.products.fixedIncome.columns;
  return (
    <div
      className="grid w-max min-w-full shrink-0 items-stretch bg-white"
      style={bondTableRowStyle(showStatus)}
    >
      <HeaderCellSimple borderLeft>{cols.bond}</HeaderCellSimple>
      {showStatus && <HeaderCellSimple align="center">{cols.status}</HeaderCellSimple>}
      <HeaderCellSimple>{cols.type}</HeaderCellSimple>
      <HeaderCellSimple align="center">YTM</HeaderCellSimple>
      <HeaderCellSimple align="center">Coupon</HeaderCellSimple>
      <HeaderCellSimple>{cols.couponPeriod}</HeaderCellSimple>
      <HeaderCellSimple>{cols.tenor}</HeaderCellSimple>
      <HeaderCellSimple>{cols.maturity}</HeaderCellSimple>
      <RatingsHeaderCell />
      <HeaderCellSimple>{cols.risk}</HeaderCellSimple>
      <HeaderCellSimple>{cols.guarantee}</HeaderCellSimple>
      <HeaderCellSimple>{cols.offerType}</HeaderCellSimple>
      <HeaderCellSimple>{cols.expectedOpen}</HeaderCellSimple>
      <HeaderCellSimple align="center" borderRight={false} className={STICKY_ACTION_HEADER_CLS} />
    </div>
  );
}

function BondTableRow({
  bond,
  isLast,
  showStatus,
  onSelect,
}: {
  bond: FixedIncomeBond;
  isLast?: boolean;
  showStatus: boolean;
  onSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  const border = () => cellBorderStyle({ bottom: !isLast });

  const cell = "flex items-center px-3 py-3.5 min-w-0";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(bond)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(bond);
        }
      }}
      className="group grid w-max min-w-full shrink-0 cursor-pointer items-stretch bg-white transition-colors hover:bg-[#f9fafb]"
      style={bondTableRowStyle(showStatus)}
    >
      <div className={`${cell} gap-2`} style={border()}>
        <BondLogo
          src={BOND_LOGOS[bond.logoIdx]}
          logoCrop={bond.logoCrop}
          className="size-8 rounded"
        />
        <span className="min-w-0 flex-1 truncate text-sm leading-[24px] font-bold text-[#101828]">
          {bond.symbol}
        </span>
      </div>
      {showStatus && (
        <div className={`${cell} justify-end`} style={border()}>
          <StatusTag status={bond.status} label={bond.statusLabel} />
        </div>
      )}
      <div className={`${cell}`} style={border()}>
        <CategoryTag label={t.products.fixedIncome.category[bond.category]} />
      </div>
      <div className={`${cell} justify-end`} style={border()}>
        <span className="text-sm leading-[24px] font-bold whitespace-nowrap text-[#101828]">
          {bond.ytm}
        </span>
      </div>
      <div className={`${cell} justify-end`} style={border()}>
        <span className="text-sm leading-[24px] font-bold whitespace-nowrap text-[#101828]">
          {bond.couponRate}
        </span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.couponPeriod}
        </span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.tenor}
        </span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.maturity}</span>
      </div>
      <div className={`${cell} justify-center`} style={border()}>
        <span className="text-center text-sm leading-[24px] text-[#101828]">
          {bond.companyRating}
        </span>
      </div>
      <div className={`${cell} justify-center`} style={border()}>
        <span className="text-center text-sm leading-[24px] text-[#101828]">{bond.bondRating}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.risk}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <GuaranteeCell value={bond.guarantee} />
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.offerType}
        </span>
      </div>
      <div className={`${cell} overflow-hidden`} style={border()}>
        <span className="truncate text-sm leading-[24px] whitespace-nowrap text-[#101828]">
          {bond.subscriptionPeriod}
        </span>
      </div>
      <div
        className={`${cell} justify-center overflow-hidden py-[11px] ${STICKY_ACTION_CELL_CLS}`}
        style={border()}
      >
        <ViewInfoButton onClick={() => onSelect(bond)} />
      </div>
    </div>
  );
}

function BondTable({
  bonds,
  showStatus,
  onBondSelect,
}: {
  bonds: FixedIncomeBond[];
  showStatus: boolean;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  if (bonds.length === 0) return null;

  return (
    <div
      className="w-full overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      <div className="w-full overflow-x-auto">
        <div className="flex w-max min-w-full flex-col">
          <BondTableHeader showStatus={showStatus} />
          {bonds.map((bond, i) => (
            <BondTableRow
              key={bond.id}
              bond={bond}
              isLast={i === bonds.length - 1}
              showStatus={showStatus}
              onSelect={onBondSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const ASSET_TAG_ICONS = {
  ticker: "/products/fixed-income/fixed-income-tag-newspaper.svg",
  offering: "/products/fixed-income/fixed-income-tag-users.svg",
  minSubscription: "/products/fixed-income/fixed-income-tag-money.svg",
} as const;

function AssetTag({ iconSrc, label }: { iconSrc: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded bg-[#f9fafb] px-2 py-1 text-sm leading-[24px] text-[#4a5565]">
      {/* eslint-disable-next-line @next/next/no-img-element -- 14px SVG tag icon; the image optimizer rejects SVG */}
      <img alt="" src={iconSrc} className="size-3.5 shrink-0" />
      {label}
    </span>
  );
}

function BondSection({
  title,
  titleGradient,
  bonds,
  showStatus,
  updatedAt,
  onBondSelect,
}: {
  title: string;
  titleGradient?: boolean;
  bonds: FixedIncomeBond[];
  showStatus: boolean;
  updatedAt: string;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  if (bonds.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full flex-col gap-0.5">
        <h2
          className={`text-2xl leading-9 font-bold ${titleGradient ? GRADIENT_TITLE : "text-[#101828]"}`}
        >
          {title}
        </h2>
        <div className="flex w-full items-center justify-between text-sm leading-[24px] text-[#6a7282]">
          <span>{t.products.common.itemCount(bonds.length)}</span>
          <span className="hidden sm:inline">{t.products.common.updatedAt(updatedAt)}</span>
        </div>
      </div>
      <BondTable bonds={bonds} showStatus={showStatus} onBondSelect={onBondSelect} />
    </div>
  );
}

/**
 * Handed a resolved company: the lookup, its loading and its not-found belong
 * to whoever resolves the id (`fixed-income/company/[companyId]/page.tsx`), the
 * same split as the other catalog detail routes.
 */
export function FixedIncomeCompanyDetail({
  company,
  primaryBonds,
  secondaryBonds,
  onBack,
  onBondSelect,
}: {
  company: FixedIncomeCompany;
  primaryBonds: FixedIncomeBond[];
  secondaryBonds: FixedIncomeBond[];
  onBack: () => void;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  const t = useT();
  const companyId = company.id;

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [companyId]);

  const logoSrc = BOND_LOGOS[company.logoIdx];

  return (
    <div
      className="flex w-full flex-col items-stretch bg-gradient-to-b from-white from-[43.451%] to-transparent px-4 pt-6 pb-20 md:px-8 lg:px-20"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="mx-auto flex h-[46px] w-full max-w-[1280px] items-center gap-2 py-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.products.common.back}
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-[#101828]">
          {company.fullName}
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8">
        <div className="relative flex flex-col gap-6 overflow-hidden rounded-xl p-8">
          <Image
            alt=""
            src="/products/fixed-income/fixed-income-company-hero.webp"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="pointer-events-none rounded-xl object-cover"
          />
          <div className="relative flex w-full flex-col gap-4">
            <div className="flex w-full items-center gap-4">
              <div
                className="relative size-14 shrink-0 overflow-hidden rounded-xl"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              >
                {logoSrc && (
                  <Image
                    alt=""
                    fill
                    sizes="56px"
                    className="pointer-events-none object-cover"
                    src={logoSrc}
                  />
                )}
              </div>
              <h2 className="min-w-0 flex-1 text-[32px] leading-[1.5] font-bold text-[rgba(0,0,0,0.9)]">
                {company.fullName}
              </h2>
            </div>
            {company.description && (
              <p className="text-base leading-[28px] text-[rgba(0,0,0,0.75)]">
                {company.description}
              </p>
            )}
          </div>
          <div className="relative flex w-full flex-col gap-4">
            <p className="text-base leading-[28px] font-bold text-[rgba(0,0,0,0.75)]">
              {t.products.fixedIncome.company.assetDetails}
            </p>
            <div className="flex flex-wrap items-start gap-3">
              <AssetTag
                iconSrc={ASSET_TAG_ICONS.ticker}
                label={t.products.fixedIncome.company.ticker(company.ticker)}
              />
              <AssetTag
                iconSrc={ASSET_TAG_ICONS.offering}
                label={t.products.fixedIncome.company.offeringType(company.offeringType)}
              />
              <AssetTag
                iconSrc={ASSET_TAG_ICONS.minSubscription}
                label={t.products.fixedIncome.company.minSubscription(company.minSubscription)}
              />
            </div>
          </div>
        </div>

        {/* Each market's section is left out when it has no bonds; with
            neither, say so rather than end the page after the hero. */}
        {primaryBonds.length === 0 && secondaryBonds.length === 0 && (
          <CatalogSectionEmpty title={t.products.states.noBonds} />
        )}

        <BondSection
          title={t.products.fixedIncome.category.primary}
          titleGradient
          bonds={primaryBonds}
          showStatus
          updatedAt={company.updatedAt}
          onBondSelect={onBondSelect}
        />

        {secondaryBonds.length > 0 && (
          <div className="-mx-[9999px] bg-[#f9fafb] px-[9999px] py-8">
            <BondSection
              title={t.products.fixedIncome.category.secondary}
              bonds={secondaryBonds}
              showStatus={false}
              updatedAt={company.updatedAt}
              onBondSelect={onBondSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}
