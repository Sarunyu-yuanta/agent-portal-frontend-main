"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "@sarunyu/system-one";
import { CaretDownIcon, CaretUpIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import {
  findBookableGlobalBond,
  globalBondToBookableProduct,
  type GlobalBondRow,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import type { BookableProduct } from "@/features/orders/lib/bookable-products";
import { QuotaBookButton } from "@/features/orders/hooks/use-quota-booking";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS as HEADER_CLS,
  TABLE_SHADOW,
  DetailRow,
  FactsheetButton,
  InvestButton as CreateOrderButton,
  TopPickTag,
} from "@/features/catalog/fixed-income/components/fixed-income-shared";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

const TOP_PICK_COL_CLS = "w-[112px]";

const headerBorder = (opts?: { right?: boolean; left?: boolean }) => ({
  borderBottom: `1px solid ${BORDER_COLOR}`,
  borderRight: opts?.right === false ? undefined : `1px solid ${BORDER_COLOR}`,
  borderLeft: opts?.left ? `1px solid ${BORDER_COLOR}` : undefined,
});

const cellBorder = (opts?: { bottom?: boolean }) => ({
  borderBottom: opts?.bottom === false ? undefined : `1px solid ${BORDER_COLOR}`,
});

function IssuerLogo({ src }: { src: string }) {
  return (
    <div
      className="relative size-8 shrink-0 overflow-hidden rounded"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 32px issuer logo, already ~2KB; matches the fixed-size-logo convention used across the catalog */}
      <img
        alt=""
        className="pointer-events-none absolute inset-0 size-full rounded object-cover"
        src={src}
      />
    </div>
  );
}

/**
 * Where a bond row's CTA books from — provided by the page that owns the
 * booking modal (`useQuotaBooking`). Without a provider the row keeps its old
 * "สนใจลงทุน" interest button.
 */
export const GlobalBondBookingContext = createContext<((product: BookableProduct) => void) | null>(
  null,
);

/**
 * Where a bond row's Proposal is sent from — provided by the page that owns the
 * send dialog (`useSendProposal`). Null means the page does not offer it, and
 * the row shows no send action.
 *
 * A second context rather than one carrying both: the booking flow is already
 * threaded this way, and a page can legitimately offer one without the other
 * (the catalogue lists offer a booking with no product page behind them).
 */
export const GlobalBondProposalContext = createContext<((product: BookableProduct) => void) | null>(
  null,
);

/**
 * Send this bond's Proposal, where the page offers it and the row resolves to
 * an issuer's bond. Secondary to the row's own CTA: the offer comes before the
 * order, but the order is what the row is for.
 */
function ProposalButton({ row, fullWidth }: { row: GlobalBondRow; fullWidth?: boolean }) {
  const t = useT();
  const onSend = useContext(GlobalBondProposalContext);
  const match = onSend ? findBookableGlobalBond(row) : undefined;
  if (!onSend || !match) return null;
  const product = globalBondToBookableProduct(match.issuer, match.row);
  return (
    <Button
      variant="outline"
      size={fullWidth ? "lg" : "xs"}
      className={fullWidth ? "w-full max-w-[343px]" : "whitespace-nowrap"}
      leftIcon={<PaperPlaneTiltIcon size={fullWidth ? 16 : 14} weight="fill" />}
      onClick={(e) => {
        // The row itself expands; this is a separate action on it.
        e.stopPropagation();
        onSend(product);
      }}
    >
      {t.products.common.sendProposal}
    </Button>
  );
}

/**
 * Detail-page CTA. Books the bond straight in when the page provides a
 * booking flow and the row is one of an issuer's own bonds; otherwise the
 * "สนใจลงทุน" interest button, which places nothing.
 */
function InvestButton({ row, fullWidth }: { row: GlobalBondRow; fullWidth?: boolean }) {
  const t = useT();
  const onBook = useContext(GlobalBondBookingContext);
  const match = onBook ? findBookableGlobalBond(row) : undefined;
  if (onBook && match) {
    return (
      <QuotaBookButton
        product={globalBondToBookableProduct(match.issuer, match.row)}
        onBook={onBook}
        size={fullWidth ? "lg" : "xs"}
        className={fullWidth ? "w-full max-w-[343px]" : undefined}
      />
    );
  }
  return (
    <Button
      variant="primary"
      size={fullWidth ? "lg" : "xs"}
      className={fullWidth ? "w-full max-w-[343px]" : "whitespace-nowrap"}
      onClick={(e) => e.stopPropagation()}
    >
      {t.products.common.interested}
    </Button>
  );
}

/**
 * The catalogue lists' CTA (Top Pick, All Overseas Bonds): books the bond when
 * the page provides a booking flow and the row resolves to an issuer's bond,
 * otherwise the old "สร้างคำสั่งซื้อ" link.
 */
export function GlobalBondListCta({
  row,
  fullWidth,
  href,
}: {
  row: GlobalBondRow;
  fullWidth?: boolean;
  href?: string;
}) {
  const t = useT();
  const onBook = useContext(GlobalBondBookingContext);
  const match = onBook ? findBookableGlobalBond(row) : undefined;
  if (onBook && match) {
    return (
      <QuotaBookButton
        product={globalBondToBookableProduct(match.issuer, match.row)}
        onBook={onBook}
        size={fullWidth ? "xl" : "xs"}
        className={fullWidth ? "w-full max-w-[343px]" : undefined}
        label={t.products.common.createOrder}
      />
    );
  }
  return <CreateOrderButton fullWidth={fullWidth} href={href} />;
}

/**
 * `onClearFilters` given → the hero's filters matched nothing; omitted → the
 * issuer has no open bonds at all, and there is no filter to blame.
 */
function EmptyBondsCard({ onClearFilters }: { onClearFilters?: () => void }) {
  const t = useT();
  return (
    <div
      className="w-full overflow-hidden rounded-xl bg-white px-4"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      <CatalogSectionEmpty
        title={t.products.states.noGlobalBonds}
        onClearFilters={onClearFilters}
      />
    </div>
  );
}

type BondListProps = {
  bonds: GlobalBondRow[];
  /** Given only while a filter is narrowing a non-empty list. */
  onClearFilters?: () => void;
};

export function GlobalBondDetailAccordion({ bonds, onClearFilters }: BondListProps) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  const [expandedId, setExpandedId] = useState<string | null>(bonds[0]?.id ?? null);
  const [prevBonds, setPrevBonds] = useState(bonds);
  if (prevBonds !== bonds) {
    setPrevBonds(bonds);
    setExpandedId(bonds[0]?.id ?? null);
  }

  if (bonds.length === 0) return <EmptyBondsCard onClearFilters={onClearFilters} />;

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
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
              className="flex w-full cursor-pointer items-start gap-2 border-none bg-white p-3 text-left"
            >
              <div className="flex shrink-0 items-center py-0.5">
                <IssuerLogo src={row.logo} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm leading-[26px] font-semibold text-neutral-900">
                  {row.name}
                </span>
                <span className="text-xs leading-[22px] text-neutral-600">{row.isin}</span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm leading-[26px] text-neutral-900">{row.yieldPct}</span>
                {expanded ? (
                  <CaretUpIcon size={22} className="text-neutral-900" />
                ) : (
                  <CaretDownIcon size={22} className="text-neutral-900" />
                )}
              </div>
            </button>
            {expanded && (
              <div className="flex w-full flex-col items-center gap-3 px-3 pb-3">
                <div className="flex w-full flex-col gap-1 rounded-md bg-neutral-50 px-3 py-2">
                  <DetailRow label={cols.currency} value={row.currency} />
                  <DetailRow label={cols.couponRate} value={row.couponRate} />
                  <DetailRow label={cols.price} value={row.price} />
                  <DetailRow label={cols.estimatedYield} value={row.yieldPct} />
                  <DetailRow label={cols.maturity} value={row.maturity} />
                  <DetailRow label={cols.durationYears} value={row.duration} />
                </div>
                <InvestButton row={row} fullWidth />
                <ProposalButton row={row} fullWidth />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function GlobalBondDetailTable({ bonds, onClearFilters }: BondListProps) {
  const t = useT();
  const cols = t.products.globalBond.columns;
  if (bonds.length === 0) return <EmptyBondsCard onClearFilters={onClearFilters} />;

  const isLastRow = (i: number) => (i === bonds.length - 1 ? false : undefined);

  return (
    <div
      className="w-full overflow-hidden rounded-xl bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      <div className="overflow-x-auto">
        <div className="flex min-w-[1280px] items-stretch">
          <div className="flex min-w-[220px] flex-1 flex-col">
            <div
              className="flex h-11 items-center px-4"
              style={headerBorder({ left: true, right: false })}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.bonds}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] min-w-0 items-center gap-2 overflow-hidden px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <IssuerLogo src={row.logo} />
                <span className="min-w-0 flex-1 truncate text-sm leading-[24px] text-neutral-900">
                  {row.name}
                </span>
              </div>
            ))}
          </div>
          <div className={`flex shrink-0 flex-col ${TOP_PICK_COL_CLS}`}>
            <div className="flex h-11 items-center justify-center px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} opacity-0`} aria-hidden>
                Top Pick
              </span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-center px-4 py-3"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                {row.topPick && <TopPickTag />}
              </div>
            ))}
          </div>
          <div className="flex w-[138px] shrink-0 flex-col">
            <div className="flex h-11 items-center px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.isin}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.isin}</span>
              </div>
            ))}
          </div>
          <div className="flex w-[80px] shrink-0 flex-col">
            <div className="flex h-11 items-center justify-center px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.currency}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-center px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.currency}</span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.couponRate}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.couponRate}</span>
              </div>
            ))}
          </div>
          <div className="flex w-[76px] shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.price}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.price}</span>
              </div>
            ))}
          </div>
          <div className="flex w-[165px] shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.estimatedYield}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.yieldPct}</span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.maturity}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-center px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.maturity}</span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col">
            <div className="flex h-11 items-center justify-end px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.durationYears}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-end px-4 py-3.5"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-neutral-900">{row.duration}</span>
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col">
            <div className="flex items-center justify-center p-3" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>{cols.documents}</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-center px-3 py-[11px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <FactsheetButton />
              </div>
            ))}
          </div>
          <div className="flex shrink-0 flex-col">
            <div
              className="flex items-center justify-end p-3"
              style={headerBorder({ right: false })}
            >
              <span className={`${HEADER_CLS} opacity-0`} aria-hidden>
                Action
              </span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex min-h-[52px] flex-1 items-center justify-center gap-1.5 px-4 py-[11px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                {/* The offer first, the order second — left to right in the
                    order they happen. Both `xs`, so the pair fits the cell the
                    single button was sized for. */}
                <ProposalButton row={row} />
                <InvestButton row={row} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
