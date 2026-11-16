"use client";

import { createContext, useContext, useState } from "react";
import { Button } from "@sarunyu/system-one";
import { CaretDownIcon, CaretUpIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";
import {
  findBookableGlobalBond,
  globalBondToBookableProduct,
  type GlobalBondRow,
} from "./global-bond-data";
import type { BookableProduct } from "@/app/(dashboard)/orders/bookable-products";
import { QuotaBookButton } from "@/app/(dashboard)/orders/useQuotaBooking";
import {
  BORDER_COLOR,
  HEADER_TEXT_CLS as HEADER_CLS,
  TABLE_SHADOW,
  DetailRow,
  FactsheetButton,
  InvestButton as CreateOrderButton,
  TopPickTag,
} from "./fixed-income-shared";

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
      className="relative shrink-0 size-8 rounded overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 32px issuer logo, already ~2KB; matches the fixed-size-logo convention used across the catalog */}
      <img
        alt=""
        className="absolute inset-0 size-full object-cover rounded pointer-events-none"
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
export const GlobalBondBookingContext = createContext<
  ((product: BookableProduct) => void) | null
>(null);

/**
 * Where a bond row's Proposal is sent from — provided by the page that owns the
 * send dialog (`useSendProposal`). Null means the page does not offer it, and
 * the row shows no send action.
 *
 * A second context rather than one carrying both: the booking flow is already
 * threaded this way, and a page can legitimately offer one without the other
 * (the catalogue lists offer a booking with no product page behind them).
 */
export const GlobalBondProposalContext = createContext<
  ((product: BookableProduct) => void) | null
>(null);

/**
 * Send this bond's Proposal, where the page offers it and the row resolves to
 * an issuer's bond. Secondary to the row's own CTA: the offer comes before the
 * order, but the order is what the row is for.
 */
function ProposalButton({ row, fullWidth }: { row: GlobalBondRow; fullWidth?: boolean }) {
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
      ส่ง Proposal
    </Button>
  );
}

/**
 * Detail-page CTA. Books the bond straight in when the page provides a
 * booking flow and the row is one of an issuer's own bonds; otherwise the
 * "สนใจลงทุน" interest button, which places nothing.
 */
function InvestButton({ row, fullWidth }: { row: GlobalBondRow; fullWidth?: boolean }) {
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
      สนใจลงทุน
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
  const onBook = useContext(GlobalBondBookingContext);
  const match = onBook ? findBookableGlobalBond(row) : undefined;
  if (onBook && match) {
    return (
      <QuotaBookButton
        product={globalBondToBookableProduct(match.issuer, match.row)}
        onBook={onBook}
        size={fullWidth ? "xl" : "xs"}
        className={fullWidth ? "w-full max-w-[343px]" : undefined}
        label="สร้างคำสั่งซื้อ"
      />
    );
  }
  return <CreateOrderButton fullWidth={fullWidth} href={href} />;
}

function EmptyBondsCard() {
  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-white px-4 py-10 text-center text-sm text-[#6a7282]"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      ไม่พบรายการที่ตรงกับตัวกรอง
    </div>
  );
}

export function GlobalBondDetailAccordion({ bonds }: { bonds: GlobalBondRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(
    bonds[0]?.id ?? null,
  );
  const [prevBonds, setPrevBonds] = useState(bonds);
  if (prevBonds !== bonds) {
    setPrevBonds(bonds);
    setExpandedId(bonds[0]?.id ?? null);
  }

  if (bonds.length === 0) return <EmptyBondsCard />;

  return (
    <div
      className="flex flex-col w-full rounded-xl overflow-hidden bg-white"
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
              className="flex w-full items-start gap-2 p-3 bg-white border-none cursor-pointer text-left"
            >
              <div className="flex items-center py-0.5 shrink-0">
                <IssuerLogo src={row.logo} />
              </div>
              <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold leading-[26px] text-[#101828] truncate">
                  {row.name}
                </span>
                <span className="text-xs leading-[22px] text-[#4a5565]">
                  {row.isin}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="text-sm leading-[26px] text-[#101828]">
                  {row.yieldPct}
                </span>
                {expanded ? (
                  <CaretUpIcon size={22} className="text-[#101828]" />
                ) : (
                  <CaretDownIcon size={22} className="text-[#101828]" />
                )}
              </div>
            </button>
            {expanded && (
              <div className="flex flex-col gap-3 items-center px-3 pb-3 w-full">
                <div className="flex flex-col gap-1 rounded-md bg-[#f9fafb] px-3 py-2 w-full">
                  <DetailRow label="Currency" value={row.currency} />
                  <DetailRow label="Coupon Rate" value={row.couponRate} />
                  <DetailRow label="Price" value={row.price} />
                  <DetailRow label="ผลตอบแทนโดยประมาณ" value={row.yieldPct} />
                  <DetailRow label="วันครบกำหนด" value={row.maturity} />
                  <DetailRow label="ระยะเวลา (ปี)" value={row.duration} />
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

export function GlobalBondDetailTable({ bonds }: { bonds: GlobalBondRow[] }) {
  if (bonds.length === 0) return <EmptyBondsCard />;

  const isLastRow = (i: number) => (i === bonds.length - 1 ? false : undefined);

  return (
    <div
      className="w-full rounded-xl overflow-hidden bg-white"
      style={{ border: `1px solid ${BORDER_COLOR}`, boxShadow: TABLE_SHADOW }}
    >
      <div className="overflow-x-auto">
        <div className="flex items-stretch min-w-[1280px]">
          <div className="flex flex-col flex-1 min-w-[220px]">
            <div
              className="flex h-11 items-center px-4"
              style={headerBorder({ left: true, right: false })}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>Bonds</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex items-center gap-2 min-w-0 px-4 py-3.5 min-h-[52px] overflow-hidden"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <IssuerLogo src={row.logo} />
                <span className="min-w-0 flex-1 truncate text-sm leading-[24px] text-[#101828]">
                  {row.name}
                </span>
              </div>
            ))}
          </div>
          <div className={`flex flex-col shrink-0 ${TOP_PICK_COL_CLS}`}>
            <div
              className="flex h-11 items-center justify-center px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} opacity-0`} aria-hidden>
                Top Pick
              </span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-center px-4 py-3 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                {row.topPick && <TopPickTag />}
              </div>
            ))}
          </div>
          <div className="flex flex-col w-[138px] shrink-0">
            <div className="flex h-11 items-center px-4" style={headerBorder()}>
              <span className={`${HEADER_CLS} whitespace-nowrap`}>ISIN</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.isin}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col w-[80px] shrink-0">
            <div
              className="flex h-11 items-center justify-center px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>Currency</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.currency}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col shrink-0">
            <div
              className="flex h-11 items-center justify-end px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>Coupon Rate</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.couponRate}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col w-[76px] shrink-0">
            <div
              className="flex h-11 items-center justify-end px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>Price</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.price}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col w-[165px] shrink-0">
            <div
              className="flex h-11 items-center justify-end px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>ผลตอบแทนโดยประมาณ</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.yieldPct}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col shrink-0">
            <div
              className="flex h-11 items-center justify-end px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>วันครบกำหนด</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-center px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.maturity}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col shrink-0">
            <div
              className="flex h-11 items-center justify-end px-4"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>ระยะเวลา (ปี)</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-end px-4 py-3.5 min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <span className="text-sm leading-[24px] text-[#101828]">{row.duration}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col shrink-0">
            <div
              className="flex items-center justify-center p-3"
              style={headerBorder()}
            >
              <span className={`${HEADER_CLS} whitespace-nowrap`}>เอกสาร</span>
            </div>
            {bonds.map((row, i) => (
              <div
                key={row.id}
                className="flex flex-1 items-center justify-center px-3 py-[11px] min-h-[52px]"
                style={cellBorder({ bottom: isLastRow(i) })}
              >
                <FactsheetButton />
              </div>
            ))}
          </div>
          <div className="flex flex-col shrink-0">
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
                className="flex flex-1 items-center justify-center gap-1.5 px-4 py-[11px] min-h-[52px]"
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
