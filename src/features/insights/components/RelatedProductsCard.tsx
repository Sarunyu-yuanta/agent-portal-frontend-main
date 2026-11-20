import { LocaleLink as Link } from "@/i18n/navigation";
import { SparkleIcon } from "@phosphor-icons/react";
import { StructuredProductCard } from "@/features/catalog/structured-product/components/StructuredProductCard";
import {
  BOND_LOGOS,
  type FixedIncomeBond,
} from "@/features/catalog/fixed-income/lib/fixed-income-data";
import { BondLogo } from "@/features/catalog/fixed-income/components/fixed-income-shared";
import type { GlobalBondIssuer } from "@/features/catalog/global-bond/lib/global-bond-data";
import { MutualFundListCard } from "@/features/catalog/mutual-fund/components/MutualFundCard";
import { getRecommendedFundsForInsight } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { getRelatedProducts } from "@/features/insights/lib/house-view-data";
import { useT } from "@/i18n/I18nProvider";

const CARD_STYLE = {
  backgroundColor: "white",
  border: "1px solid rgba(0,0,0,0.1)",
  boxShadow: "0px 1px 3px 0px rgba(0,0,0,0.1), 0px 1px 2px -1px rgba(0,0,0,0.1)",
};

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="text-meta font-bold tracking-wide text-muted-foreground uppercase">{children}</p>
  );
}

function StatRow({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="flex w-full items-center justify-center rounded-lg bg-neutral-50 py-1.5 text-center">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
          style={i < stats.length - 1 ? { borderRight: "1px solid rgba(0,0,0,0.1)" } : {}}
        >
          <p className="w-full truncate text-micro leading-[18px] text-neutral-500">{s.label}</p>
          <p className="w-full truncate text-label leading-[20px] font-semibold text-neutral-600">
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function FixedIncomeRelatedCard({ bond }: { bond: FixedIncomeBond }) {
  const r = useT().research.related;
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl p-4" style={CARD_STYLE}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <BondLogo
            src={BOND_LOGOS[bond.logoIdx]}
            logoCrop={bond.logoCrop}
            className="size-8 rounded"
          />
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-title-sm leading-[28px] font-bold text-neutral-900">
              {bond.symbol}
            </p>
            <p className="truncate text-label leading-[20px] text-neutral-500">
              {bond.companyName}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end whitespace-nowrap">
          <p className="text-title-sm leading-[28px] font-bold text-neutral-900">{bond.ytm}</p>
          <p className="text-label leading-[20px] text-neutral-500">{r.ytm}</p>
        </div>
      </div>
      <StatRow
        stats={[
          { label: r.coupon, value: bond.couponRate },
          { label: r.tenor, value: bond.tenor },
          { label: r.rating, value: bond.bondRating },
        ]}
      />
    </div>
  );
}

function GlobalBondRelatedCard({ issuer }: { issuer: GlobalBondIssuer }) {
  const r = useT().research.related;
  return (
    <div className="flex w-full flex-col gap-3 rounded-xl p-4" style={CARD_STYLE}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="relative size-8 shrink-0 overflow-hidden rounded"
            style={{ border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- tiny fixed-size logo, no responsive sizes needed */}
            <img alt="" className="absolute inset-0 size-full object-cover" src={issuer.logo} />
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-title-sm leading-[28px] font-bold text-neutral-900">
              {issuer.title}
            </p>
            <p className="truncate text-label leading-[20px] text-neutral-500">{issuer.ticker}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end whitespace-nowrap">
          <p className="text-title-sm leading-[28px] font-bold text-neutral-900">
            {issuer.estimatedYield}
          </p>
          <p className="text-label leading-[20px] text-neutral-500">{r.estYield}</p>
        </div>
      </div>
      <StatRow
        stats={[
          { label: r.coupon, value: issuer.couponRateRange },
          { label: r.maturity, value: issuer.maturityRange },
          { label: r.rating, value: issuer.sp },
        ]}
      />
    </div>
  );
}

export function RelatedProductsCard({
  strategy,
  variant = "card",
}: { strategy?: { id?: string; assetClass?: string }; variant?: "card" | "plain" } = {}) {
  const r = useT().research.related;
  const { structured, fixedIncome, globalBond } = getRelatedProducts(strategy);

  // This detail page is shared by the Insights list and by Product Catalog's
  // Mutual Fund tab (`บทวิเคราะห์ทั้งหมด`) — both link straight to
  // `/insights/[id]`. When the strategy being viewed is one the Mutual Fund
  // catalog also tracks as an insight, its recommended funds are added
  // *alongside* whatever the strategy's own asset class already resolves —
  // an insight can genuinely have a mix (e.g. a structured note and a fund
  // both tied to the same call), so this never replaces the other groups,
  // only adds to them. Which groups actually render is entirely data-driven:
  // whatever the backend returns products for is what shows, for every
  // insight regardless of which page linked here — the Insights list is the
  // "show everything" aggregate view, so it must see the same mix.
  const mutualFund = strategy?.id ? getRecommendedFundsForInsight(strategy.id) : [];

  const isEmpty =
    structured.length === 0 &&
    fixedIncome.length === 0 &&
    globalBond.length === 0 &&
    mutualFund.length === 0;

  return (
    <div
      className={
        variant === "card"
          ? "flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"
          : "flex flex-col gap-4"
      }
    >
      <div className="flex items-center gap-2.5">
        <SparkleIcon size={24} weight="fill" className="text-primary-action shrink-0" />
        <p className="type-subtitle-1 font-bold text-foreground">{r.title}</p>
      </div>

      {isEmpty ? (
        <p className="py-4 text-center text-body-sm text-muted-foreground">{r.empty}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {mutualFund.length > 0 && (
            <div className="flex flex-col gap-2">
              <GroupLabel>{r.groups.mutualFund}</GroupLabel>
              <div className="flex flex-col gap-3">
                {mutualFund.map((fund) => (
                  <MutualFundListCard key={fund.id} fund={fund} />
                ))}
              </div>
            </div>
          )}
          {structured.length > 0 && (
            <div className="flex flex-col gap-2">
              <GroupLabel>{r.groups.structured}</GroupLabel>
              <div className="flex flex-col gap-3">
                {structured.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product-catalog/product/${product.id}`}
                    className="block"
                  >
                    <StructuredProductCard {...product} variant="grid" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {fixedIncome.length > 0 && (
            <div className="flex flex-col gap-2">
              <GroupLabel>{r.groups.fixedIncome}</GroupLabel>
              <div className="flex flex-col gap-3">
                {fixedIncome.map((bond) => (
                  <Link
                    key={bond.id}
                    href={`/product-catalog/fixed-income/bond/${bond.id}`}
                    className="block"
                  >
                    <FixedIncomeRelatedCard bond={bond} />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {globalBond.length > 0 && (
            <div className="flex flex-col gap-2">
              <GroupLabel>{r.groups.globalBond}</GroupLabel>
              <div className="flex flex-col gap-3">
                {globalBond.map((issuer) => (
                  <Link
                    key={issuer.id}
                    href={`/product-catalog/global-bond/${issuer.id}`}
                    className="block"
                  >
                    <GlobalBondRelatedCard issuer={issuer} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
