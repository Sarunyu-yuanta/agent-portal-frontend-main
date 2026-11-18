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
      className="flex flex-col w-full rounded-md overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex gap-3 items-start px-4 py-2 w-full text-base leading-[24px] ${
            i % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
          }`}
        >
          <span className="flex-1 min-w-0 text-[#4a5565]">{row.label}</span>
          {row.documents ? (
            <div className="flex flex-1 min-w-0 flex-col gap-4 items-start">
              {row.documents.map((doc) => (
                <button
                  key={doc.label}
                  type="button"
                  className="inline-flex items-center gap-0.5 text-[#2b7fff] underline border-none bg-transparent p-0 cursor-pointer text-base leading-[24px]"
                >
                  {doc.label}
                  <FileTextIcon size={14} className="shrink-0" />
                </button>
              ))}
            </div>
          ) : row.link ? (
            <button
              type="button"
              className="flex-1 min-w-0 text-left text-[#0a6ee7] underline border-none bg-transparent p-0 cursor-pointer text-base leading-[24px]"
            >
              {row.value}
            </button>
          ) : (
            <span className="flex-1 min-w-0 text-[#101828]">{row.value}</span>
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
      className="flex flex-col items-center w-full pt-6 pb-20 px-4 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[998px]">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label={t.products.common.back} className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[30px] text-[#101828] truncate">
          Fixed Income
        </h1>
      </div>

      <div
        className="flex flex-col gap-14 items-center w-full max-w-[998px] px-6 py-8 md:px-10 lg:px-14 rounded-xl bg-white"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        <div className="flex flex-col gap-6 w-full">
          <button
            type="button"
            onClick={() => onCompanySelect?.(bond.companyName)}
            className="flex gap-1 items-center w-full pb-2 border-b border-black/10 border-solid border-t-0 border-x-0 bg-transparent p-0 cursor-pointer text-left"
          >
            <span className="flex-1 min-w-0 text-base leading-[24px] text-[#4a5565] truncate">
              {bond.fullCompanyName}
            </span>
            <CaretDoubleRightIcon size={20} className="shrink-0 text-[#101828]" />
          </button>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-3 items-center w-full">
              <BondLogo src={BOND_LOGOS[bond.logoIdx]} logoCrop={bond.logoCrop} className="size-12 rounded-md" />
              <div className="flex flex-1 min-w-0 flex-col gap-1">
                <p className="text-lg font-bold leading-[28px] text-[#101828] truncate w-full">{bond.symbol}</p>
                <div className="flex flex-wrap gap-2 items-center">
                  <StatusTag status={bond.status} label={bond.statusLabel} />
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-[#f3f4f6] text-xs leading-[20px] text-[#4a5565] whitespace-nowrap">
                    {t.products.fixedIncome.category[bond.category]}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end shrink-0">
                <p className="text-lg font-bold leading-[28px] text-[#008236] whitespace-nowrap">{bond.ytm}</p>
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
              <div className="flex flex-col gap-3 items-center w-full">
                <DetailTable bond={bond} />
                <DealProgress productId={adapted.id} />
                <p className="text-sm leading-[24px] text-[#6a7282] text-center whitespace-nowrap">
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
          <div className="flex flex-col gap-3 items-center w-full">
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
