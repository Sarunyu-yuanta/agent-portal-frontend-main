"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Chip } from "@sarunyu/system-one";
import { CardsIcon, CaretDownIcon, FireIcon, TableIcon } from "@phosphor-icons/react";
import { ChipScroller } from "@/components/ui/chip-scroller";
import { setQueryState, withQuery } from "@/lib/query-state";
import { StockMiniChart } from "./StockMiniChart";
import { StructuredProductCard } from "./StructuredProductCard";
import { ThaiStructuredProductTable } from "./ThaiStructuredProductTable";
import { MutualFundListCard } from "./MutualFundCard";
import { BondLogo } from "./fixed-income-shared";
import { BOND_LOGOS, type FixedIncomeBond } from "./fixed-income-data";
import { getIssuerIdForBondRow, type GlobalBondRow } from "./global-bond-data";
import {
  RELATED_PRODUCT_CHIP_LABEL,
  relatedProductKinds,
  type RelatedDerivativeBundle,
  type RelatedDrBundle,
  type RelatedDrRow,
  type RelatedFutureContract,
  type RelatedProductKind,
  type RelatedProducts,
} from "./stock-product-detail-data";
import type { ThaiStructuredProduct } from "./thai-structured-data";
import { TOP_PICKS, type StructuredProduct } from "./structured-product-data";
import type { MutualFund } from "./mutual-fund-data";

const ASSETS = {
  yuantaMark: "/products/stock/detail/yuanta-logo-mark-white.svg",
  yuantaWord: "/products/stock/detail/yuanta-logo-word-white.svg",
} as const;

const ROW_HOVER =
  "cursor-pointer transition-colors hover:bg-[#f9fafb] focus-visible:outline-none focus-visible:bg-[#f9fafb]";

function MiniPercentPill({ value }: { value: string }) {
  const body = value.replace(/^[+-]/, "");
  return (
    <span className="inline-flex items-center overflow-hidden rounded bg-[#effce1] px-1 py-0.5 text-[9px] leading-[14px] text-[#21761d]">
      <span>+</span>
      <span>{body}</span>
    </span>
  );
}

function YuantaWordmark() {
  return (
    <div className="relative h-5 w-[91px] shrink-0 overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.yuantaMark}
        alt=""
        width={20.0227}
        height={20}
        className="absolute top-0 left-0"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ASSETS.yuantaWord}
        alt=""
        width={64.3368}
        height={14.2004}
        className="absolute"
        style={{ left: "29.34%", top: "14.58%" }}
      />
    </div>
  );
}

function RelatedDrRowView({ row }: { row: RelatedDrRow }) {
  const amountColor = row.amountTone === "flat" ? "rgba(0,0,0,0.35)" : "#21761d";
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-3 border-b border-black/10 bg-white px-3 py-4 ${ROW_HOVER}`}>
      <div className="flex min-w-0 flex-1 flex-col">
        <p className="h-6 max-w-[119px] truncate text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">
          {row.symbol}
        </p>
        <p className="w-full truncate text-xs leading-4 text-black/40">{row.subtitle}</p>
      </div>
      <StockMiniChart series={row.series} trend="up" width={48} height={30} className="h-[30px] w-12 shrink-0" />
      <div className="flex w-24 max-w-[240px] shrink-0 flex-col items-end">
        <div className="flex items-center gap-1 text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">
          <span>{row.price}</span>
          <span>THB</span>
        </div>
        <div className="flex h-5 items-center justify-end gap-1">
          <span className="truncate text-xs leading-4" style={{ color: amountColor }}>
            {row.changeAmount}
          </span>
          <MiniPercentPill value={row.changePercent} />
        </div>
      </div>
    </div>
  );
}

function RelatedDrBody({ dr }: { dr: RelatedDrBundle }) {
  return (
    <div className="flex w-full flex-col gap-8">
      {dr.yuanta ? (
        <div className="w-full max-w-[434px] rounded-lg bg-gradient-to-r from-[#00a1e9] to-[#004eba] p-1.5">
          <div className="flex items-center justify-between px-1.5">
            <p className="truncate text-sm font-bold leading-5 text-white">DR issued by Yuanta</p>
            <YuantaWordmark />
          </div>
          <div className="mt-2 overflow-hidden rounded-lg">
            <RelatedDrRowView row={dr.yuanta} />
          </div>
        </div>
      ) : null}

      {dr.others.length > 0 ? (
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-center gap-3">
            <p className="truncate text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">
              DR issued by other brokers
            </p>
            <span className="h-[22px] w-px shrink-0 bg-black/10" aria-hidden />
            <p className="shrink-0 text-sm leading-5 text-[rgba(0,0,0,0.75)]">
              {dr.others.length} Symbols
            </p>
          </div>
          <div className="h-px w-full bg-black/10" />
          <div className="grid w-full grid-cols-1 overflow-hidden md:grid-cols-2 md:gap-x-4">
            {dr.others.map((row) => (
              <RelatedDrRowView key={row.symbol} row={row} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FutureCard({ contract }: { contract: RelatedFutureContract }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2 ${ROW_HOVER}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{contract.symbol}</p>
          <p className="truncate text-xs leading-4 text-black/40">IM: {contract.im}</p>
        </div>
        <div className="flex max-w-24 min-w-0 flex-1 flex-col items-end justify-center gap-0.5">
          <div className="flex items-center justify-end gap-1">
            <span className="truncate text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">
              {contract.lastPrice}
            </span>
            <span className="text-[9px] leading-[14px] text-black/40">points</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-[#21761d]">
            <span className="truncate text-xs leading-4">{contract.change}</span>
            <MiniPercentPill value={contract.changePercent} />
          </div>
        </div>
      </div>
      <CaretDownIcon size={20} className="shrink-0 text-[#4a5565]" aria-hidden />
    </div>
  );
}

function FuturesRemark() {
  return (
    <div className="flex max-w-[480px] flex-col gap-0.5 text-[rgba(0,0,0,0.75)]">
      <p className="text-xs font-medium leading-[18px]">Remark</p>
      <ul className="flex flex-col text-xs leading-4">
        <li className="flex gap-1">
          <span className="font-semibold">• Price:</span>
          <span className="font-medium leading-[18px]">Exclude Block Trade Transaction</span>
        </li>
        <li className="flex gap-1">
          <span className="font-semibold">• Chg (Change):</span>
          <span className="font-medium leading-[18px]">Change from Prior Settlement Price</span>
        </li>
        <li>
          <span className="font-semibold">• OI (Open Interest):</span>
          <p className="mt-0">- During Day Session, Open Interest is the value as of the Night Session of previous day.</p>
          <p>- During Night Session, Open Interest is the value as of the Afternoon Session of current day.</p>
        </li>
        <li className="flex gap-1">
          <span className="font-semibold">• IM:</span>
          <span>Initial Margin</span>
        </li>
      </ul>
    </div>
  );
}

const TABLE_COLS = [
  { key: "lastTradingDay", label: "Last Trading Day" },
  { key: "lastPrice", label: "Last Price", align: "right" },
  { key: "im", label: "IM", align: "right" },
  { key: "change", label: "Change", align: "right", tone: "up" },
  { key: "changePercent", label: "% Change", align: "right", tone: "up" },
  { key: "open", label: "Open", align: "right" },
  { key: "high", label: "High", align: "right" },
  { key: "low", label: "Low", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
  { key: "openInterest", label: "Open Interest", align: "right" },
  { key: "settlementPrice", label: "Settlement Price", align: "right" },
] as const;

function headerLabel(label: string) {
  if (label === "Last Trading Day") {
    return (
      <>
        Last Trading
        <br />
        Day
      </>
    );
  }
  if (label === "Open Interest") {
    return (
      <>
        Open
        <br />
        Interest
      </>
    );
  }
  if (label === "Settlement Price") {
    return (
      <>
        Settlement
        <br />
        Price
      </>
    );
  }
  return label;
}

function FuturesTable({
  contracts,
  totals,
}: {
  contracts: RelatedFutureContract[];
  totals: RelatedDerivativeBundle["totals"];
}) {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[1080px] border-collapse text-sm leading-[22px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-[1] border-b border-r border-black/10 bg-white px-4 py-2 text-left font-normal text-black/40">
              Symbol
            </th>
            {TABLE_COLS.map((col) => (
              <th
                key={col.key}
                className={`border-b border-black/10 bg-white px-4 py-2 font-normal whitespace-nowrap text-black/40 ${
                  "align" in col && col.align === "right" ? "text-right" : "text-center"
                }`}
              >
                {headerLabel(col.label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contracts.map((row) => (
            <tr key={row.symbol} className="group/row cursor-pointer hover:bg-[#f9fafb] transition-colors">
              <td className="sticky left-0 z-[1] border-b border-r border-black/10 bg-white px-4 py-2.5 font-semibold whitespace-nowrap text-[#0a6ee7] group-hover/row:bg-[#f9fafb]">
                {row.symbol}
              </td>
              {TABLE_COLS.map((col) => {
                const value = row[col.key];
                const tone = "tone" in col && col.tone === "up";
                const right = "align" in col && col.align === "right";
                return (
                  <td
                    key={col.key}
                    className={`border-b border-black/10 px-4 py-2.5 whitespace-nowrap ${
                      right ? "text-right" : "text-center"
                    } ${tone ? "text-[#2f952a]" : "text-[rgba(0,0,0,0.75)]"}`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-[#f3f3f3]">
            <td
              colSpan={9}
              className="border-b border-black/10 px-4 py-1 font-semibold whitespace-nowrap text-[rgba(0,0,0,0.85)]"
            >
              Total Futures
            </td>
            <td className="border-b border-black/10 px-4 py-1 text-right font-semibold text-[#0a6ee7]">
              {totals.volume}
            </td>
            <td className="border-b border-black/10 px-4 py-1 text-right font-semibold text-[#0a6ee7]">
              {totals.openInterest}
            </td>
            <td className="border-b border-black/10 px-4 py-1" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function ViewModeMenu({
  mode,
  onChange,
}: {
  mode: "card" | "table";
  onChange: (mode: "card" | "table") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex cursor-pointer items-center justify-center gap-0.5 rounded-md border border-black/10 bg-white px-2 py-1 text-sm font-semibold leading-[22px] text-[#4a5565] transition-colors hover:bg-[#f9fafb]"
      >
        <TableIcon size={20} className="shrink-0" />
        View Mode
        <CaretDownIcon size={20} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-20 mt-1 flex w-40 flex-col rounded-lg bg-white p-2 shadow-[0px_0px_1px_rgba(102,102,102,0.16),0px_4px_4px_rgba(102,102,102,0.12)]"
        >
          {(
            [
              { id: "table" as const, label: "Table", Icon: TableIcon },
              { id: "card" as const, label: "Card", Icon: CardsIcon },
            ] as const
          ).map((opt) => {
            const selected = mode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(opt.id);
                  setOpen(false);
                }}
                className={`flex h-12 w-full cursor-pointer items-center gap-2 px-4 py-3 text-left text-sm leading-5 ${
                  selected ? "bg-[#eff6ff] text-[#101828]" : "bg-white text-[#101828] hover:bg-[#f9fafb]"
                }`}
              >
                <opt.Icon size={24} className={`shrink-0 ${selected ? "text-[#0a6ee7]" : "text-[#4a5565]"}`} />
                <span className="min-w-0 flex-1">{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function RelatedDerivativeBody({ data }: { data: RelatedDerivativeBundle }) {
  const [mode, setMode] = useState<"card" | "table">("card");

  return (
    <div className="flex w-full flex-col gap-4 pb-6">
      <div className="flex w-full flex-col gap-6">
        <div className="flex w-full items-end justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-lg font-bold leading-6 text-[rgba(0,0,0,0.85)]">Related Futures</h2>
            <span className="h-4 w-px shrink-0 bg-black/10" aria-hidden />
            <p className="shrink-0 text-xs leading-4 text-[rgba(0,0,0,0.75)]">
              {data.contracts.length} Contracts
            </p>
          </div>
          <ViewModeMenu mode={mode} onChange={setMode} />
        </div>
        <div className="h-px w-full bg-black/10" />
        {mode === "card" ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full max-w-[343px] items-start gap-6 overflow-hidden rounded-lg bg-[#f9f9f9] p-2">
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <p className="truncate text-[9px] leading-[14px] text-[rgba(0,0,0,0.75)]">Volume (Contracts)</p>
                <p className="text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{data.totals.volume}</p>
              </div>
              <span className="w-px self-stretch bg-black/10" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col items-center">
                <p className="truncate text-[9px] leading-[14px] text-[rgba(0,0,0,0.75)]">Open Interest (Contracts)</p>
                <p className="text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{data.totals.openInterest}</p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
              {data.contracts.map((contract) => (
                <FutureCard key={contract.symbol} contract={contract} />
              ))}
            </div>
            <p className="text-xs leading-4 text-black/40">{data.updated}</p>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3">
            <FuturesTable contracts={data.contracts} totals={data.totals} />
            <p className="text-xs leading-4 text-black/40">{data.updated}</p>
          </div>
        )}
      </div>
      <FuturesRemark />
    </div>
  );
}

function RelatedStructuredBody({ products }: { products: StructuredProduct[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
      {products.map((product) => (
        <StructuredProductCard
          key={product.id}
          {...product}
          variant="grid"
          href={`/product-catalog/product/${product.id}`}
        />
      ))}
    </div>
  );
}

function thaiStructuredHref(product: ThaiStructuredProduct) {
  return `/product-catalog/thai-structured/${encodeURIComponent(product.theme)}`;
}

function RelatedThaiStructuredBody({ products }: { products: ThaiStructuredProduct[] }) {
  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-col gap-4">
        <div className="flex items-center gap-1">
          <FireIcon size={24} weight="fill" color="#f97316" className="shrink-0" />
          <p className="truncate text-xl font-bold leading-[30px] text-[#101828]">Top pick</p>
        </div>
        <div className="grid w-full grid-cols-1 gap-4 md:flex md:flex-col lg:grid lg:grid-cols-3">
          {TOP_PICKS.map((product) => (
            <StructuredProductCard
              key={product.id}
              {...product}
              href={`/product-catalog/product/${product.id}`}
            />
          ))}
        </div>
      </div>
      <div className="flex w-full flex-col gap-4">
        <p className="truncate text-xl font-bold leading-[30px] text-[#101828]">All Thai FCN</p>
        <ThaiStructuredProductTable products={products} getRowHref={thaiStructuredHref} />
      </div>
    </div>
  );
}

function RelatedFixedIncomeBody({ bonds }: { bonds: FixedIncomeBond[] }) {
  return (
    <div className="flex w-full flex-col">
      {bonds.map((bond) => (
        <Link
          key={bond.id}
          href={`/product-catalog/fixed-income/bond/${bond.id}`}
          className={`flex items-center gap-3 border-b border-black/10 px-1 py-3 text-inherit no-underline ${ROW_HOVER}`}
        >
          <BondLogo
            src={BOND_LOGOS[bond.logoIdx]}
            logoCrop={bond.logoCrop}
            className="size-10 rounded"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{bond.symbol}</p>
            <p className="truncate text-xs leading-4 text-black/40">{bond.companyName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{bond.couponRate}</p>
            <p className="text-xs leading-4 text-black/40">{bond.tenor}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

function RelatedGlobalBondBody({ bonds }: { bonds: GlobalBondRow[] }) {
  return (
    <div className="flex w-full flex-col">
      {bonds.map((bond) => {
        const issuerId = getIssuerIdForBondRow(bond);
        const inner = (
          <>
            <BondLogo src={bond.logo} className="size-10 rounded" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{bond.name}</p>
              <p className="truncate text-xs leading-4 text-black/40">
                {bond.ticker ? `${bond.ticker} · ${bond.isin}` : bond.isin}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold leading-5 text-[rgba(0,0,0,0.85)]">{bond.yieldPct}</p>
              <p className="text-xs leading-4 text-black/40">Yield</p>
            </div>
          </>
        );
        const className = `flex items-center gap-3 border-b border-black/10 px-1 py-3 text-inherit no-underline ${ROW_HOVER}`;
        return issuerId ? (
          <Link key={bond.isin} href={`/product-catalog/global-bond/${issuerId}`} className={className}>
            {inner}
          </Link>
        ) : (
          <div key={bond.isin} className={className}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

function RelatedMutualFundBody({ funds }: { funds: MutualFund[] }) {
  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-4">
      {funds.map((fund) => (
        <div key={fund.id} className="min-w-0">
          <MutualFundListCard fund={fund} showView={false} showHighlight={false} />
        </div>
      ))}
    </div>
  );
}

function RelatedProductPanel({ related, kind }: { related: RelatedProducts; kind: RelatedProductKind }) {
  switch (kind) {
    case "dr":
      return related.dr ? <RelatedDrBody dr={related.dr} /> : null;
    case "derivative":
      return related.derivative ? <RelatedDerivativeBody data={related.derivative} /> : null;
    case "structured":
      return related.structured?.length ? <RelatedStructuredBody products={related.structured} /> : null;
    case "thai-structured":
      return related.thaiStructured?.length ? (
        <RelatedThaiStructuredBody products={related.thaiStructured} />
      ) : null;
    case "fixed-income":
      return related.fixedIncome?.length ? <RelatedFixedIncomeBody bonds={related.fixedIncome} /> : null;
    case "global-bond":
      return related.globalBond?.length ? <RelatedGlobalBondBody bonds={related.globalBond} /> : null;
    case "mutual-fund":
      return related.mutualFund?.length ? <RelatedMutualFundBody funds={related.mutualFund} /> : null;
  }
}

export function StockRelatedProductTab({ related }: { related: RelatedProducts }) {
  const kinds = useMemo(() => relatedProductKinds(related), [related]);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const relatedParam = searchParams.get("related");
  const filter: RelatedProductKind =
    relatedParam && kinds.includes(relatedParam as RelatedProductKind)
      ? (relatedParam as RelatedProductKind)
      : (kinds[0] ?? "dr");

  useEffect(() => {
    if (!kinds.length) return;
    if (relatedParam && kinds.includes(relatedParam as RelatedProductKind)) return;
    setQueryState(
      withQuery(pathname, searchParams, { tab: "related", related: kinds[0] }),
    );
  }, [kinds, relatedParam, pathname, searchParams]);

  if (kinds.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-6">
      <ChipScroller rowClassName="">
        {kinds.map((id) => (
          <Chip
            key={id}
            type="single"
            size="small"
            label={RELATED_PRODUCT_CHIP_LABEL[id]}
            selected={filter === id}
            onClick={() =>
              setQueryState(withQuery(pathname, searchParams, { tab: "related", related: id }))
            }
            className="shrink-0"
          />
        ))}
      </ChipScroller>
      <RelatedProductPanel related={related} kind={filter} />
    </div>
  );
}
