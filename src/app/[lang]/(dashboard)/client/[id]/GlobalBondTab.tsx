"use client";

import { Button } from "@sarunyu/system-one";
import { FireIcon, ArrowRightIcon } from "@phosphor-icons/react";
import {
  RECOMMENDED_ISSUER_ROWS,
  TOP_PICK_ROWS,
  type GlobalBondIssuerId,
} from "./global-bond-data";
import { GlobalBondTopPickAccordion } from "./GlobalBondTopPickAccordion";
import { GlobalBondRecommendedAccordion } from "./GlobalBondRecommendedAccordion";
import { GlobalBondTopPickTable } from "./GlobalBondTopPickTable";
import { GlobalBondRecommendedTable } from "./GlobalBondRecommendedTable";
import { GlobalBondBookingContext, GlobalBondProposalContext } from "./GlobalBondDetailBondList";
import { useQuotaBooking } from "@/app/[lang]/(dashboard)/orders/useQuotaBooking";
import { useSendProposal } from "@/app/[lang]/(dashboard)/orders/useSendProposal";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { CatalogSectionEmpty } from "./ProductCatalogEmpty";
import { useT } from "@/i18n/I18nProvider";

function TopPickHeading() {
  const t = useT();
  return (
    <div className="flex w-full items-center gap-1 rounded-lg bg-[#fdefe6] px-1 py-0.5">
      <FireIcon size={16} weight="fill" color="#f97316" className="shrink-0" />
      <span className="text-sm leading-[24px] font-bold text-[#101828]">
        {t.products.globalBond.columns.topPick}
      </span>
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
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8 lg:hidden">
          <h2 className="w-full text-lg leading-[28px] font-bold text-[#101828]">{labels.title}</h2>
          <div className="flex w-full flex-col gap-2">
            <TopPickHeading />
            {TOP_PICK_ROWS.length === 0 ? (
              <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
            ) : (
              <GlobalBondTopPickAccordion />
            )}
          </div>
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full items-center justify-between gap-3">
              <h3 className="text-sm leading-[24px] font-bold text-[#101828]">
                {labels.recommended}
              </h3>
              <span className="shrink-0 text-xs leading-[20px] whitespace-nowrap text-[#6a7282]">
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
            className="max-w-[343px] shrink-0 self-center font-semibold"
            onClick={onViewAll}
          >
            {t.products.common.viewAll}
          </Button>
        </div>

        {/* Desktop — tables */}
        <div className="mx-auto hidden w-full max-w-[1280px] flex-col items-center gap-6 px-4 pt-6 pb-10 md:px-8 lg:flex lg:px-6">
          <h2 className="w-full text-lg leading-[28px] font-bold text-[#101828]">{labels.title}</h2>
          <div className="flex w-full flex-col gap-2">
            <TopPickHeading />
            {TOP_PICK_ROWS.length === 0 ? (
              <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
            ) : (
              <GlobalBondTopPickTable onIssuerSelect={onIssuerSelect} />
            )}
          </div>
          <div className="flex w-full flex-col gap-4">
            <div className="flex w-full items-end justify-between gap-3">
              <h3 className="text-base leading-[28px] font-bold text-[#101828]">
                {labels.recommended}
              </h3>
              <span className="shrink-0 text-sm leading-[24px] whitespace-nowrap text-[#6a7282]">
                {t.products.common.updatedAt("25 August 2026 - 09.00")}
              </span>
            </div>
            {RECOMMENDED_ISSUER_ROWS.length === 0 ? (
              <CatalogSectionEmpty title={t.products.states.noGlobalBonds} />
            ) : (
              <GlobalBondRecommendedTable onIssuerSelect={onIssuerSelect} />
            )}
          </div>
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRightIcon size={20} />}
            onClick={onViewAll}
          >
            {t.products.common.viewAll}
          </Button>
        </div>
      </GlobalBondProposalContext.Provider>
    </GlobalBondBookingContext.Provider>
  );
}
