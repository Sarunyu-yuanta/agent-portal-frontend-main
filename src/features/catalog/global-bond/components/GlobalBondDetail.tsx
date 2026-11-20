"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, TabGroup } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import {
  filterGlobalBonds,
  globalBondBookableId,
  type GlobalBondIssuer,
  type GlobalBondIssuerId,
  type MaturityFilter,
  type YieldFilter,
} from "@/features/catalog/global-bond/lib/global-bond-data";
import { GlobalBondDetailHero } from "./GlobalBondDetailHero";
import {
  GlobalBondBookingContext,
  GlobalBondDetailAccordion,
  GlobalBondDetailTable,
  GlobalBondProposalContext,
} from "./GlobalBondDetailBondList";
import { useOpenProducts } from "@/features/orders/hooks/use-order-books";
import { useQuotaBooking } from "@/features/orders/hooks/use-quota-booking";
import { useSendProposal } from "@/features/orders/hooks/use-send-proposal";
import { QuotaBooksPanel } from "@/features/orders/components/QuotaBooksPanel";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { GlobalBondDetailRecommended } from "./GlobalBondDetailRecommended";
import { useT } from "@/i18n/I18nProvider";

/**
 * Handed a resolved issuer: the lookup, its loading and its not-found belong
 * to whoever resolves the id (`global-bond/[issuerId]/page.tsx`), the same
 * split as the other catalog detail routes.
 */
export function GlobalBondDetail({
  issuer,
  onBack,
  onIssuerSelect,
}: {
  issuer: GlobalBondIssuer;
  onBack: () => void;
  onIssuerSelect?: (issuerId: GlobalBondIssuerId) => void;
}) {
  const t = useT();
  const issuerId = issuer.id;
  const [yieldFilter, setYieldFilter] = useState<YieldFilter>("all");
  const [maturityFilter, setMaturityFilter] = useState<MaturityFilter>("all");

  const [tab, setTab] = useState<"detail" | "orders">("detail");
  const booking = useQuotaBooking();
  // Its own stack: the page mounts no toaster of its own, and a send has to be
  // able to report. See `useSendProposal`.
  const proposal = useSendProposal();
  // A bond whose quota is used up has nothing left to sell — off the list.
  const openBonds = useOpenProducts(issuer.bonds, globalBondBookableId);
  /**
   * Every bond of this issuer, as book ids — the Order tab's scope.
   *
   * `issuer.bonds`, not `openBonds`: a bond whose quota is spent drops off the
   * list to sell from, but the orders already placed on it are still this
   * issuer's and still the IC's to read.
   */
  const bookIds = useMemo(() => issuer.bonds.map((row) => globalBondBookableId(row)), [issuer]);
  const filteredBonds = useMemo(
    () => filterGlobalBonds(openBonds, yieldFilter, maturityFilter),
    [openBonds, yieldFilter, maturityFilter],
  );

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [issuerId]);

  const [prevIssuerId, setPrevIssuerId] = useState(issuerId);
  if (prevIssuerId !== issuerId) {
    setPrevIssuerId(issuerId);
    setYieldFilter("all");
    setMaturityFilter("all");
    setTab("detail");
  }

  // The filters emptied the list, versus an issuer with no open bonds at all.
  const clearFilters =
    openBonds.length > 0 && (yieldFilter !== "all" || maturityFilter !== "all")
      ? () => {
          setYieldFilter("all");
          setMaturityFilter("all");
        }
      : undefined;

  const updatedAtMobile = issuer.updatedAt.replace("September", "Sep").replace("August", "Aug");

  return (
    <div className="flex w-full flex-col items-stretch bg-gradient-to-b from-white from-[43.451%] to-transparent px-4 pt-4 pb-10 md:px-8 md:pt-6 md:pb-20 lg:px-20">
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
        <h1 className="min-w-0 flex-1 truncate text-left text-base leading-[28px] font-bold text-[#101828] lg:text-lg lg:leading-[30px]">
          {issuer.title}
        </h1>
      </div>

      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-4 md:gap-8 lg:gap-8">
        <GlobalBondDetailHero
          issuer={issuer}
          yieldFilter={yieldFilter}
          maturityFilter={maturityFilter}
          onYieldChange={setYieldFilter}
          onMaturityChange={setMaturityFilter}
          // They filter the bond list, which the Order tab replaces.
          showFilters={tab === "detail"}
        />

        <div className="flex w-full flex-col gap-4 lg:gap-12">
          {/* The same two views the rest of the catalogue's product pages
              carry. This one is an *issuer*, not a single bond, so Order is
              scoped to all of its bonds — the chips and the table are Order
              Management's own, narrowed by `productIds`. */}
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

          {tab === "orders" ? (
            <QuotaBooksPanel desk="Global Bond" productIds={bookIds} />
          ) : (
            <>
              <div className="flex w-full flex-col gap-4">
                <div className="flex w-full items-center justify-between gap-3">
                  <p className="text-sm leading-[24px] font-bold text-[#101828] md:text-base md:leading-[28px]">
                    {t.products.common.itemCount(filteredBonds.length)}
                  </p>
                  <span className="shrink-0 text-xs leading-[20px] whitespace-nowrap text-[#6a7282] md:text-sm md:leading-[24px]">
                    <span className="md:hidden">
                      {t.products.common.updatedAt(updatedAtMobile)}
                    </span>
                    <span className="hidden md:inline">
                      {t.products.common.updatedAt(issuer.updatedAt)}
                    </span>
                  </span>
                </div>
                <GlobalBondBookingContext.Provider
                  value={ORDER_BOOKING_ENABLED ? booking.book : null}
                >
                  <GlobalBondProposalContext.Provider
                    value={ORDER_BOOKING_ENABLED ? proposal.send : null}
                  >
                    <div className="lg:hidden">
                      <GlobalBondDetailAccordion
                        bonds={filteredBonds}
                        onClearFilters={clearFilters}
                      />
                    </div>
                    <div className="hidden lg:block">
                      <GlobalBondDetailTable bonds={filteredBonds} onClearFilters={clearFilters} />
                    </div>
                  </GlobalBondProposalContext.Provider>
                </GlobalBondBookingContext.Provider>
              </div>

              <GlobalBondDetailRecommended issuerId={issuerId} onIssuerSelect={onIssuerSelect} />
            </>
          )}
          {booking.ui}
          {proposal.ui}
        </div>
      </div>
    </div>
  );
}
