"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, TabGroup } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  CaretDoubleRightIcon,
  FileTextIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react";
import { BOND_LOGOS, type FixedIncomeBond } from "./fixed-income-data";
import { BORDER_COLOR, StatusTag, BondLogo } from "./fixed-income-shared";
import { fixedIncomeToBookableProduct } from "./fixed-income-data";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { ProductOrderSection } from "@/app/[lang]/(dashboard)/orders/ProductOrderSection";
import { DealProgress } from "@/app/[lang]/(dashboard)/orders/DealProgress";
import { ProposalTallyLine } from "@/app/[lang]/(dashboard)/orders/ProposalTallyLine";
import { useSendProposal } from "@/app/[lang]/(dashboard)/orders/useSendProposal";
import { QuotaBookButton, useQuotaBooking } from "@/app/[lang]/(dashboard)/orders/useQuotaBooking";
import { useT } from "@/i18n/I18nProvider";

function DetailTable({ bond }: { bond: FixedIncomeBond }) {
  const t = useT();
  const labels = t.products.fixedIncome.detail;
  const rows: {
    label: string;
    value?: string;
    link?: boolean;
    documents?: { label: string; href?: string }[];
  }[] = [
    { label: labels.ytm, value: bond.ytm },
    { label: labels.couponRate, value: bond.couponRate },
    { label: labels.couponPeriod, value: bond.couponPeriod },
    { label: labels.tenor, value: bond.tenor },
    { label: labels.maturity, value: bond.maturity },
    { label: labels.companyRating, value: bond.companyRating },
    { label: labels.bondRating, value: bond.bondRating },
    { label: labels.risk, value: bond.risk },
    { label: labels.guarantee, value: bond.guarantee, link: true },
    { label: labels.offerType, value: bond.offerType },
    { label: labels.subscriptionPeriod, value: bond.subscriptionPeriod },
    { label: labels.documents, documents: bond.documents },
  ];

  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-md"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex w-full items-start gap-3 px-4 py-2 text-base leading-[24px] ${
            i % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
          }`}
        >
          <span className="min-w-0 flex-1 text-[#4a5565]">{row.label}</span>
          {row.documents ? (
            <div className="flex min-w-0 flex-1 flex-col items-start gap-4">
              {row.documents.map((doc) => (
                <button
                  key={doc.label}
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-base leading-[24px] text-[#2b7fff] underline"
                >
                  {doc.label}
                  <FileTextIcon size={14} className="shrink-0" />
                </button>
              ))}
            </div>
          ) : row.link ? (
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-base leading-[24px] text-[#0a6ee7] underline"
            >
              {row.value}
            </button>
          ) : (
            <span className="min-w-0 flex-1 text-[#101828]">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function FixedIncomeDetail({
  bond,
  onBack,
  onCompanySelect,
}: {
  bond: FixedIncomeBond;
  onBack: () => void;
  onCompanySelect?: (companyId: string) => void;
}) {
  const t = useT();
  const isFollowed = bond.action === "followed";
  const [tab, setTab] = useState<"detail" | "orders">("detail");
  // The order just placed here — marked on the Order tab, the same hand-off the
  // structured desks' product pages make. See `ProductOrderSection`.
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  const clearNewBooking = useCallback(() => setNewBookingId(null), []);
  const booking = useQuotaBooking({
    onPlaced: (placed) => {
      setNewBookingId(placed.id);
      // Straight to the tab that shows it: on this desk the press *sent* the
      // order, so the thing the IC wants next is the record and its reference,
      // not the terms they have just finished reading.
      setTab("orders");
    },
  });
  // Memoised: a fresh object every render feeds a hook's dependency list, and
  // would re-run the readiness derivation behind the Order tab's modal on
  // every keystroke in its search box.
  const adapted = useMemo(() => fixedIncomeToBookableProduct(bond), [bond]);
  // Shares the booking hook's toast stack rather than standing up a second one.
  const proposal = useSendProposal({ onNotice: booking.notice });

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [bond.id]);

  return (
    <div
      className="flex w-full flex-col items-center px-4 pt-6 pb-20 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="flex h-[46px] w-full max-w-[998px] items-center gap-2 py-2">
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
          Fixed Income
        </h1>
      </div>

      <div
        className="flex w-full max-w-[998px] flex-col items-center gap-14 rounded-xl bg-white px-6 py-8 md:px-10 lg:px-14"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        <div className="flex w-full flex-col gap-6">
          <button
            type="button"
            onClick={() => onCompanySelect?.(bond.companyName)}
            className="flex w-full cursor-pointer items-center gap-1 border-x-0 border-t-0 border-b border-solid border-black/10 bg-transparent p-0 pb-2 text-left"
          >
            <span className="min-w-0 flex-1 truncate text-base leading-[24px] text-[#4a5565]">
              {bond.fullCompanyName}
            </span>
            <CaretDoubleRightIcon size={20} className="shrink-0 text-[#101828]" />
          </button>

          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-center gap-3">
              <BondLogo
                src={BOND_LOGOS[bond.logoIdx]}
                logoCrop={bond.logoCrop}
                className="size-12 rounded-md"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="w-full truncate text-lg leading-[28px] font-bold text-[#101828]">
                  {bond.symbol}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag status={bond.status} label={bond.statusLabel} />
                  <span className="inline-flex items-center justify-center rounded bg-[#f3f4f6] px-2 py-1 text-xs leading-[20px] whitespace-nowrap text-[#4a5565]">
                    {t.products.fixedIncome.category[bond.category]}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-lg leading-[28px] font-bold whitespace-nowrap text-[#008236]">
                  {bond.ytm}
                </p>
                <p className="text-sm leading-[24px] text-[#4a5565]">YTM</p>
              </div>
            </div>

            {/* Same two views as every other product page in the catalogue —
                the bond's terms, and what has been ordered on it. Only behind
                the flag: with ordering off there is no Order tab to show, and
                the page is the terms alone as it was before. */}
            {ORDER_BOOKING_ENABLED && (
              <TabGroup
                items={[
                  { id: "detail", title: t.products.common.detailTabs.detail },
                  { id: "orders", title: t.products.common.detailTabs.orders },
                ]}
                activeId={tab}
                onChange={(id) => setTab(id as "detail" | "orders")}
              />
            )}

            {tab === "detail" ? (
              <div className="flex w-full flex-col items-center gap-3">
                <DetailTable bond={bond} />
                <DealProgress productId={adapted.id} />
                <p className="text-center text-sm leading-[24px] whitespace-nowrap text-[#6a7282]">
                  {t.products.common.updatedAt(bond.updatedAt)}
                </p>
              </div>
            ) : (
              <ProductOrderSection
                newBookingId={newBookingId}
                onNewBookingSeen={clearNewBooking}
                product={adapted}
                onBook={() => booking.book(adapted)}
                onNotice={booking.notice}
              />
            )}
          </div>
        </div>

        {/* Under Detail only — the Order tab carries its own ส่งคำสั่งซื้อ, and
            two primaries for the same action read as two different ones. */}
        {tab === "detail" && (
          <div className="flex w-full flex-col items-center gap-3">
            {/* The offer, above the order it is trying to produce. A bond's
                documents are the rows in its own table above (`bond.documents`),
                so this carries no download menu — sending is all of it. */}
            {ORDER_BOOKING_ENABLED && (
              <div className="flex w-full max-w-[343px] flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="xl"
                  className="w-full"
                  leftIcon={<PaperPlaneTiltIcon size={16} weight="fill" />}
                  onClick={() => proposal.send(adapted)}
                >
                  {t.products.common.sendProposalToClient}
                </Button>
                <ProposalTallyLine productId={adapted.id} />
              </div>
            )}
            {/* Open for subscription: order for a client straight from here
                (see `useQuotaBooking`). Otherwise the follow action, as
                before. */}
            {ORDER_BOOKING_ENABLED && bond.action === "invest" ? (
              <QuotaBookButton
                product={adapted}
                onBook={booking.book}
                size="xl"
                className="w-full max-w-[343px]"
                label={t.products.fixedIncome.action[bond.action]}
              />
            ) : (
              <Button
                variant="primary"
                size="xl"
                disabled={isFollowed}
                className="w-full max-w-[343px]"
              >
                {t.products.fixedIncome.action[bond.action]}
              </Button>
            )}
          </div>
        )}
        {proposal.ui}
        {booking.ui}
      </div>
    </div>
  );
}
