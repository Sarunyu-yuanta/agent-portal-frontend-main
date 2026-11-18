"use client";

import { useEffect } from "react";
import Image from "next/image";
import { Button } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
} from "@phosphor-icons/react";
import {
  BOND_LOGOS,
  type FixedIncomeBond,
} from "./fixed-income-data";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS,
  TABLE_SHADOW_SM as TABLE_SHADOW,
  headerBorderStyle,
  cellBorderStyle,
  StatusTag,
  BondLogo,
} from "./fixed-income-shared";
import { useFixedIncomeCompanyDetail } from "@/hooks/use-catalog";
import { FixedIncomeCompanyDetailSkeleton } from "./ProductDetailSkeletons";

const GRADIENT_TITLE =
  "bg-gradient-to-r from-[#00a1e9] to-[#004eba] bg-clip-text text-transparent";

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
    <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-[#f3f4f6] text-xs leading-[20px] text-[#4a5565] whitespace-nowrap">
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
        className="text-sm leading-[24px] text-[#0a6ee7] underline border-none bg-transparent p-0 cursor-pointer whitespace-nowrap"
      >
        {value}
      </button>
    );
  }
  return <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">{value}</span>;
}

function ViewInfoButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex items-center justify-center px-1.5 py-1 rounded text-xs font-medium leading-[22px] whitespace-nowrap bg-[#0a6ee7] text-white border-none cursor-pointer"
    >
      ดูข้อมูล
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
      className={`flex h-[44px] items-center px-3 bg-white min-w-0 ${
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
  return (
    <div
      className="flex flex-col h-[44px] min-w-0 overflow-hidden"
      style={{ ...headerBorderStyle(), gridColumn: "span 2" }}
    >
      <div
        className="flex flex-1 items-center justify-center px-3 min-h-0"
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>Ratings</span>
      </div>
      <div className="flex flex-1 items-stretch min-h-0">
        <div
          className="flex flex-1 items-center justify-center px-3"
          style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
        >
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>บริษัท</span>
        </div>
        <div className="flex flex-1 items-center justify-center px-3">
          <span className={`${HEADER_TEXT_CLS} whitespace-nowrap`}>หุ้นกู้</span>
        </div>
      </div>
    </div>
  );
}

function BondTableHeader({ showStatus }: { showStatus: boolean }) {
  return (
    <div className="grid items-stretch bg-white shrink-0 w-max min-w-full" style={bondTableRowStyle(showStatus)}>
      <HeaderCellSimple borderLeft>หุ้นกู้</HeaderCellSimple>
      {showStatus && (
        <HeaderCellSimple align="center">สถานะ</HeaderCellSimple>
      )}
      <HeaderCellSimple>ประเภท</HeaderCellSimple>
      <HeaderCellSimple align="center">YTM</HeaderCellSimple>
      <HeaderCellSimple align="center">Coupon</HeaderCellSimple>
      <HeaderCellSimple>งวดดอกเบี้ย</HeaderCellSimple>
      <HeaderCellSimple>อายุ</HeaderCellSimple>
      <HeaderCellSimple>วันครบกำหนด</HeaderCellSimple>
      <RatingsHeaderCell />
      <HeaderCellSimple>ความเสี่ยง</HeaderCellSimple>
      <HeaderCellSimple>การค้ำประกัน</HeaderCellSimple>
      <HeaderCellSimple>ประเภทเสนอขาย</HeaderCellSimple>
      <HeaderCellSimple>คาดว่าเปิดขาย</HeaderCellSimple>
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
      className="grid items-stretch bg-white cursor-pointer hover:bg-[#f9fafb] transition-colors shrink-0 w-max min-w-full group"
      style={bondTableRowStyle(showStatus)}
    >
      <div className={`${cell} gap-2`} style={border()}>
        <BondLogo src={BOND_LOGOS[bond.logoIdx]} logoCrop={bond.logoCrop} className="size-8 rounded" />
        <span className="flex-1 min-w-0 text-sm font-bold leading-[24px] text-[#101828] truncate">{bond.symbol}</span>
      </div>
      {showStatus && (
        <div className={`${cell} justify-end`} style={border()}>
          <StatusTag status={bond.status} label={bond.statusLabel} />
        </div>
      )}
      <div className={`${cell}`} style={border()}>
        <CategoryTag label={bond.bondCategory} />
      </div>
      <div className={`${cell} justify-end`} style={border()}>
        <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">{bond.ytm}</span>
      </div>
      <div className={`${cell} justify-end`} style={border()}>
        <span className="text-sm font-bold leading-[24px] text-[#101828] whitespace-nowrap">{bond.couponRate}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">{bond.couponPeriod}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">{bond.tenor}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.maturity}</span>
      </div>
      <div className={`${cell} justify-center`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] text-center">{bond.companyRating}</span>
      </div>
      <div className={`${cell} justify-center`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] text-center">{bond.bondRating}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828]">{bond.risk}</span>
      </div>
      <div className={`${cell}`} style={border()}>
        <GuaranteeCell value={bond.guarantee} />
      </div>
      <div className={`${cell}`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap">{bond.offerType}</span>
      </div>
      <div className={`${cell} overflow-hidden`} style={border()}>
        <span className="text-sm leading-[24px] text-[#101828] whitespace-nowrap truncate">
          {bond.subscriptionPeriod}
        </span>
      </div>
      <div className={`${cell} justify-center py-[11px] overflow-hidden ${STICKY_ACTION_CELL_CLS}`} style={border()}>
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
      className="w-full rounded-xl overflow-hidden bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      <div className="overflow-x-auto w-full">
        <div className="flex flex-col w-max min-w-full">
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
    <span className="inline-flex items-center gap-0.5 px-2 py-1 rounded bg-[#f9fafb] text-sm leading-[24px] text-[#4a5565]">
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
  if (bonds.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-col gap-0.5 w-full">
        <h2
          className={`text-2xl font-bold leading-9 ${titleGradient ? GRADIENT_TITLE : "text-[#101828]"}`}
        >
          {title}
        </h2>
        <div className="flex items-center justify-between w-full text-sm leading-[24px] text-[#6a7282]">
          <span>จำนวน {bonds.length} รายการ</span>
          <span className="hidden sm:inline">อัปเดตล่าสุด {updatedAt}</span>
        </div>
      </div>
      <BondTable bonds={bonds} showStatus={showStatus} onBondSelect={onBondSelect} />
    </div>
  );
}

export function FixedIncomeCompanyDetail({
  companyId,
  onBack,
  onBondSelect,
}: {
  companyId: string;
  onBack: () => void;
  onBondSelect: (bond: FixedIncomeBond) => void;
}) {
  // The `if (isLoading)` return below stays *above* the `!company` branch: once
  // this resource is fetched, a not-yet-arrived company must read as loading,
  // not as "ไม่พบข้อมูลบริษัท".
  const { data: detail, isLoading } = useFixedIncomeCompanyDetail(companyId);
  const { company, primaryBonds, secondaryBonds } = detail;

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [companyId]);

  if (isLoading) return <FixedIncomeCompanyDetailSkeleton hasSecondary={secondaryBonds.length > 0} />;

  if (!company) {
    return (
      <div className="flex flex-col items-center w-full pt-6 pb-20 px-4 md:px-8 lg:px-20">
        <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px]">
          <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ">
            <ArrowLeftIcon size={20} />
          </Button>
          <h1 className="text-lg font-bold leading-[30px] text-[#101828]">ไม่พบข้อมูลบริษัท</h1>
        </div>
      </div>
    );
  }

  const logoSrc = BOND_LOGOS[company.logoIdx];

  return (
    <div
      className="flex flex-col items-stretch w-full pt-6 pb-20 px-4 md:px-8 lg:px-20 bg-gradient-to-b from-white from-[43.451%] to-transparent"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[1280px] mx-auto">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[30px] text-[#101828] truncate">
          {company.fullName}
        </h1>
      </div>

      <div className="flex flex-col gap-8 w-full max-w-[1280px] mx-auto">
        <div className="relative flex flex-col gap-6 p-8 rounded-xl overflow-hidden">
          <Image
            alt=""
            src="/products/fixed-income/fixed-income-company-hero.webp"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="object-cover pointer-events-none rounded-xl"
          />
          <div className="relative flex flex-col gap-4 w-full">
            <div className="flex gap-4 items-center w-full">
              <div
                className="relative shrink-0 size-14 rounded-xl overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.08)" }}
              >
                <Image alt="" fill sizes="56px" className="object-cover pointer-events-none" src={logoSrc} />
              </div>
              <h2 className="flex-1 min-w-0 text-[32px] font-bold leading-[1.5] text-[rgba(0,0,0,0.9)]">
                {company.fullName}
              </h2>
            </div>
            {company.description && (
              <p className="text-base leading-[28px] text-[rgba(0,0,0,0.75)]">{company.description}</p>
            )}
          </div>
          <div className="relative flex flex-col gap-4 w-full">
            <p className="text-base font-bold leading-[28px] text-[rgba(0,0,0,0.75)]">รายละเอียดสินทรัพย์</p>
            <div className="flex flex-wrap gap-3 items-start">
              <AssetTag iconSrc={ASSET_TAG_ICONS.ticker} label={`Ticker : ${company.ticker}`} />
              <AssetTag iconSrc={ASSET_TAG_ICONS.offering} label={`ประเภทการเสนอขาย : ${company.offeringType}`} />
              <AssetTag
                iconSrc={ASSET_TAG_ICONS.minSubscription}
                label={`สั่งซื้อขั้นต่ำ : ${company.minSubscription}`}
              />
            </div>
          </div>
        </div>

        <BondSection
          title="หุ้นกู้ตลาดแรก"
          titleGradient
          bonds={primaryBonds}
          showStatus
          updatedAt={company.updatedAt}
          onBondSelect={onBondSelect}
        />

        {secondaryBonds.length > 0 && (
          <div className="-mx-[9999px] px-[9999px] bg-[#f9fafb] py-8">
            <BondSection
              title="หุ้นกู้ตลาดรอง"
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
