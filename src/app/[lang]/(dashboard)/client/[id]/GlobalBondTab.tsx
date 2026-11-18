"use client";

import { Button } from "@sarunyu/system-one";
import { FireIcon, ArrowRightIcon } from "@phosphor-icons/react";
import { RECOMMENDED_ISSUER_ROWS, TOP_PICK_ROWS, type GlobalBondIssuerId } from "./global-bond-data";
import { GlobalBondTopPickAccordion } from "./GlobalBondTopPickAccordion";
import { GlobalBondRecommendedAccordion } from "./GlobalBondRecommendedAccordion";
import { GlobalBondTopPickTable } from "./GlobalBondTopPickTable";
import { GlobalBondRecommendedTable } from "./GlobalBondRecommendedTable";
import {
  GlobalBondBookingContext,
  GlobalBondProposalContext,
} from "./GlobalBondDetailBondList";
import { useQuotaBooking } from "@/app/[lang]/(dashboard)/orders/useQuotaBooking";
import { useSendProposal } from "@/app/[lang]/(dashboard)/orders/useSendProposal";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

function TopPickHeading() {
  const t = useT();
  return (
    <div className="flex gap-1 items-center w-full px-1 py-0.5 rounded-lg bg-[#fdefe6]">
      <FireIcon size={16} weight="fill" color="#f97316" className="shrink-0" />
      <span className="text-sm font-bold leading-[24px] text-[#101828]">{t.products.globalBond.columns.topPick}</span>
    </div>
  );
}

export function GlobalBondTab({
  onIssuerSelect,
  onViewAll,
}: {
  onIssuerSelect?: (issuerId: GlobalBondIssuerId) => void;
  onViewAll?: () => void;
}) {
  const t = useT();
  const labels = t.products.globalBond.tab;
  const booking = useQuotaBooking();
  // Its own stack: the page mounts no toaster of its own, and a send has to be
  // able to report. See `useSendProposal`.
  const proposal = useSendProposal();
  return (
    <GlobalBondBookingContext.Provider value={ORDER_BOOKING_ENABLED ? booking.book : null}>
      <GlobalBondProposalContext.Provider value={ORDER_BOOKING_ENABLED ? proposal.send : null}>
      {booking.ui}
      {proposal.ui}
      {/* Tablet + mobile — accordion cards */}
      <div className="lg:hidden flex flex-col gap-6 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 pt-6 pb-10">
        <h2 className="w-full text-lg font-bold leading-[28px] text-[#101828]">
          {labels.title}
        </h2>
        <div className="flex flex-col gap-2 w-full">
          <TopPickHeading />
          {TOP_PICK_ROWS.length === 0 ? (
            <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
          ) : (
            <GlobalBondTopPickAccordion />
          )}
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between w-full gap-3">
            <h3 className="text-sm font-bold leading-[24px] text-[#101828]">{labels.recommended}</h3>
            <span className="text-xs leading-[20px] text-[#6a7282] whitespace-nowrap shrink-0">
              {t.products.common.updatedAt("25 Aug 2026 - 09.00")}
            </span>
          </div>
          {RECOMMENDED_ISSUER_ROWS.length === 0 ? (
            <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
          ) : (
            <GlobalBondRecommendedAccordion onIssuerSelect={onIssuerSelect} />
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          rightIcon={<ArrowRightIcon size={20} weight="bold" />}
          className="shrink-0 self-center max-w-[343px] font-semibold"
          onClick={onViewAll}
        >
          {t.products.common.viewAll}
        </Button>
      </div>

      {/* Desktop — tables */}
      <div className="hidden lg:flex flex-col gap-6 items-center w-full max-w-[1280px] mx-auto px-4 md:px-8 lg:px-6 pt-6 pb-10">
        <h2 className="w-full text-lg font-bold leading-[28px] text-[#101828]">
          {labels.title}
        </h2>
        <div className="flex flex-col gap-2 w-full">
          <TopPickHeading />
          {TOP_PICK_ROWS.length === 0 ? (
            <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
          ) : (
            <GlobalBondTopPickTable onIssuerSelect={onIssuerSelect} />
          )}
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex items-end justify-between w-full gap-3">
            <h3 className="text-base font-bold leading-[28px] text-[#101828]">{labels.recommended}</h3>
            <span className="text-sm leading-[24px] text-[#6a7282] whitespace-nowrap shrink-0">
              {t.products.common.updatedAt("25 August 2026 - 09.00")}
            </span>
          </div>
          {RECOMMENDED_ISSUER_ROWS.length === 0 ? (
            <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
          ) : (
            <GlobalBondRecommendedTable onIssuerSelect={onIssuerSelect} />
          )}
        </div>
        <Button variant="primary" size="lg" rightIcon={<ArrowRightIcon size={20} />} onClick={onViewAll}>
          {t.products.common.viewAll}
        </Button>
      </div>
      </GlobalBondProposalContext.Provider>
    </GlobalBondBookingContext.Provider>
  );
}
