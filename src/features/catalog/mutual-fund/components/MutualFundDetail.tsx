"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import type { MutualFundDetail as MutualFundDetailData } from "@/features/catalog/mutual-fund/lib/mutual-fund-data";
import { FundTagBadges } from "./MutualFundCard";
import { DETAIL_TABS, DetailBody, type DetailTab } from "./fund-detail/DetailBody";
import { FundNavSummary } from "./fund-detail/FundNavSummary";
import { SendProposalButton } from "@/features/orders/components/SendProposalButton";
import { offeredProductId } from "@/features/orders/lib/offered-products";
import { pageZoom } from "@/lib/page-zoom";
import { useT } from "@/i18n/I18nProvider";

export function MutualFundDetail({
  fund,
  onBack,
}: {
  fund: MutualFundDetailData;
  onBack: () => void;
}) {
  const t = useT();
  const [activeTab, setActiveTab] = useState<DetailTab>("overview");

  // The tab bar parks directly under the identity block, so its sticky offset
  // is that block's height — measured rather than hardcoded, since the block
  // is taller on a phone (the fund name wraps) than on a desktop. Measuring
  // also sidesteps a trap: `system-one`'s stylesheet is unlayered, so its
  // plain `.top-12` outranks every `lg:top-*` in Tailwind's utilities layer.
  // An inline `top` answers to nobody.
  const [identityEl, setIdentityEl] = useState<HTMLDivElement | null>(null);
  const [tabsEl, setTabsEl] = useState<HTMLDivElement | null>(null);
  const [tabsAnchorEl, setTabsAnchorEl] = useState<HTMLDivElement | null>(null);
  const [tabsTop, setTabsTop] = useState(0);
  // No min-height floor on the panel: a short tab ends where its content does
  // (design ask — no empty band under a fund with no dividends). The cost is
  // that switching to a short tab from deep in a long one can't park the bar
  // at the top; the browser clamps the scroll and the page settles lower.

  useEffect(() => {
    if (!identityEl || !tabsEl) return;
    // The bar parks under the identity block below `lg` — see its classes.
    const measure = () => setTabsTop(identityEl.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(identityEl);
    observer.observe(tabsEl);
    return () => observer.disconnect();
  }, [identityEl, tabsEl]);

  /**
   * How far the page is from having the tab bar parked: negative once the bar
   * has travelled up and stuck, zero or positive while it is still below.
   *
   * The bar is sticky, so its own rect reads as "already at the top" the whole
   * way down — hence the zero-height anchor right above it, which stays put in
   * the flow and gives the distance the bar really travelled. The resting
   * offset comes off the computed style rather than the breakpoint, so it is
   * whatever CSS says: the identity block's height on a phone, 0 on a desktop.
   */
  const tabsDelta = () => {
    const main = document.querySelector("main");
    if (!main || !tabsEl || !tabsAnchorEl) return null;
    const stickyTop = parseFloat(getComputedStyle(tabsEl).top) || 0;
    // The rects are screen pixels; `stickyTop` and `scrollTop` are the page's
    // own (see `pageZoom`).
    return (
      (tabsAnchorEl.getBoundingClientRect().top - main.getBoundingClientRect().top) / pageZoom() -
      stickyTop
    );
  };

  const scrollTabsIntoPlace = () => {
    const main = document.querySelector("main");
    const delta = tabsDelta();
    if (!main || delta === null || Math.abs(delta) <= 0.5) return;
    main.scrollTop += delta;
  };

  /**
   * Switching tabs deep in a long one leaves you halfway down the new one, so
   * bring the bar back to where it parks — but only ever upward. Read from the
   * top of the fund the bar has not moved yet, and dragging the page down
   * there would swallow the NAV you are looking at.
   *
   * When it does move, it runs twice: once now, once after the new panel has
   * laid out. The first pass moves while the old panel is still up; if the new
   * one is shorter the browser can clamp the scroll back, and the second pass
   * puts it right. When nothing clamps, the second pass is a no-op.
   */
  const selectTab = (tab: DetailTab) => {
    const delta = tabsDelta();
    setActiveTab(tab);
    if (delta === null || delta >= -0.5) return;
    scrollTabsIntoPlace();
    requestAnimationFrame(scrollTabsIntoPlace);
  };

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [fund.id]);

  return (
    <div className="flex w-full flex-col pb-20 max-lg:bg-white lg:bg-neutral-50 lg:pt-2">
      <div className="mx-auto flex w-full max-w-[996px] flex-col gap-2 px-4 md:px-8 lg:px-0">
        {/* Desktop keeps its own bar above the card: there the card's title
            block is fully visible anyway, so a back arrow parked next to the
            content would just be a second copy of it. Below `lg` the card's
            own title does this job instead — see the row inside it. */}
        {/* `hidden lg:flex`, never `flex max-lg:hidden`: `system-one` ships an
            unlayered `.flex` that outranks any `max-lg:hidden` in Tailwind's
            utilities layer, so the bar would show at every width. */}
        <div className="hidden min-h-[46px] items-center gap-2 py-2 pr-2 lg:flex">
          <Button
            variant="plain"
            size="icon-sm"
            onClick={onBack}
            aria-label={t.common.back}
            className="shrink-0"
          >
            <ArrowLeftIcon size={18} />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <p className="shrink-0 text-base leading-[28px] font-bold text-neutral-900">
              {fund.symbol}
            </p>
            <p className="min-w-0 flex-1 truncate text-sm leading-[24px] text-neutral-600">
              {fund.name}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col lg:rounded-t-3xl lg:bg-white lg:px-14 lg:py-8 lg:shadow-[0px_0px_8px_0px_rgba(0,0,0,0.02)]">
          {/* Below `lg` this row is the page's only header, so it carries the
              back arrow and sticks; the full name stays behind because three
              lines of Thai is too much to keep pinned on a phone. At `lg` the
              arrow moves to the bar above and this goes back to being a plain
              title. */}
          <div
            ref={setIdentityEl}
            className="flex items-center gap-2 bg-white pt-4 max-lg:sticky max-lg:top-0 max-lg:z-30 lg:pt-0"
          >
            <Button
              variant="plain"
              size="icon-sm"
              onClick={onBack}
              aria-label={t.common.back}
              className="shrink-0 lg:hidden"
            >
              <ArrowLeftIcon size={18} />
            </Button>
            {/* Figma 360:64854 — View / Highlight sit right after the symbol */}
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <h1 className="min-w-0 text-lg leading-[32px] font-bold text-neutral-900">
                {fund.symbol}
              </h1>
              <FundTagBadges fund={fund} />
            </div>
          </div>
          {/* `pl-9` keeps the name under the symbol rather than under the
              arrow — the 28px button plus the row's 8px gap. */}
          <p className="pt-1.5 pb-3 pl-9 text-sm leading-[24px] text-neutral-600 lg:pl-0">
            {fund.name}
          </p>

          <FundNavSummary fund={fund} />

          {/* Below `lg` the strip runs edge to edge — the negative margins
              cancel the page gutter its container paints — and scrolls
              sideways when four Thai labels outrun a phone. */}
          {/* Zero-height, so it costs nothing in the column — it exists only to
              mark where the tab bar sits when it is not stuck. */}
          <div ref={setTabsAnchorEl} aria-hidden />
          <div
            ref={setTabsEl}
            className="sticky z-20 -mx-4 flex overflow-x-auto border-b border-black/10 bg-white max-lg:top-[var(--tabs-top)] md:-mx-8 md:overflow-visible lg:top-0 lg:mx-0"
            style={{ "--tabs-top": `${tabsTop}px`, scrollbarWidth: "none" } as CSSProperties}
          >
            {DETAIL_TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => selectTab(tab)}
                  className={`flex shrink-0 items-center justify-center border-b-[1.5px] px-3 py-2.5 text-sm leading-[24px] font-bold whitespace-nowrap md:min-w-[80px] md:flex-1 md:shrink lg:min-w-[80px] lg:flex-1 ${
                    active ? "border-brand-600 text-brand-600" : "border-black/10 text-black/60"
                  }`}
                >
                  {t.catalog.fundDetailTabs[tab]}
                </button>
              );
            })}
          </div>

          {/* `overflowAnchor: none` keeps Chrome's scroll anchoring out of the
              swap — left on, it re-adjusts the scroll to hold whatever row was
              on screen, undoing the jump we just made. */}
          <div className="flex w-full flex-col" style={{ overflowAnchor: "none" }}>
            <DetailBody fund={fund} activeTab={activeTab} />

            {/* Offered, never booked — see `SendProposalButton`. Under every
                tab, since all four are about the one fund. */}
            <SendProposalButton
              subject={{
                id: offeredProductId("mutual-fund", fund.symbol),
                underlying: fund.symbol,
                documents: "Fund Fact Sheet",
              }}
              className="pt-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
