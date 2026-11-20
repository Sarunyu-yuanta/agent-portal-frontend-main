"use client";

import { useLocale } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

/**
 * Order Management — one tab per asset class, each in the shape that asset is
 * tracked in (see `order-tabs.ts`):
 *
 * - structured products: books filling a basket (`BasketBooksPanel`)
 * - bonds: books drawing down a quota (`QuotaBooksPanel`)
 * - stock, TFEX, mutual funds: clients' own transactions (`TransactionsPanel`)
 */

import { Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { FadeIn } from "@/components/ui/fade-in";
import { TabsSkeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/features/orders/store/orders-context";
import { useTransactions } from "@/features/orders/hooks/use-transactions";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { catalogListHref } from "@/features/catalog/lib/product-catalog-routes";
import { setQueryState, withQuery } from "@/lib/query-state";
import { BasketBooksPanel } from "@/features/orders/components/BasketBooksPanel";
import { QuotaBooksPanel } from "@/features/orders/components/QuotaBooksPanel";
import { TransactionsPanel } from "@/features/orders/components/TransactionsPanel";
import { AllOrdersPanel } from "@/features/orders/components/AllOrdersPanel";
import { DEFAULT_ORDER_TAB, ORDER_TABS, normalizeOrderTab } from "@/features/orders/lib/order-tabs";
import { useT } from "@/i18n/I18nProvider";
import { useHasLoaded } from "@/lib/api/resource";
import { ROUTES } from "@/lib/routes";

export function OrdersView() {
  const locale = useLocale();
  // Gated like `/notes` and `/calendar` are: the route keeps existing and
  // redirects somewhere real, so a bookmarked link doesn't 404 when the flag
  // is off. The page body is a separate component so this guard sits above
  // every hook rather than in front of them.
  if (!ORDER_BOOKING_ENABLED) redirect(localizePath(ROUTES.productCatalog, locale));
  return (
    // `useSearchParams` suspends. The tab and every filter live in the URL so a
    // book's "back to Order Management" lands on the tab it came from.
    <Suspense fallback={null}>
      <OrdersPageInner />
    </Suspense>
  );
}

function OrdersPageInner() {
  const t = useT();
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const tab = normalizeOrderTab(searchParams.get("tab"));
  // First load (the order records and trades the panels read): the tab strip
  // is bars too. After that it stays live; a panel still waiting on its own
  // data skeletons only its content.
  const { isLoading: ordersLoading } = useOrders();
  const stock = useTransactions("stock");
  const tfex = useTransactions("tfex");
  const fund = useTransactions("mutual-fund");
  const hasLoaded = useHasLoaded(
    ordersLoading || stock.isLoading || tfex.isLoading || fund.isLoading,
  );

  return (
    <div className="flex flex-col gap-4">
      {!hasLoaded ? (
        <TabsSkeleton count={ORDER_TABS.length} />
      ) : (
        <div className="transparent-tabs scrollable-tabs -mx-4 pl-4 xl:-mx-6 xl:pl-6">
          <TabGroup
            items={ORDER_TABS.map((tab) => ({
              id: tab.id,
              title: tab.id === "all" ? t.orders.tabAll : tab.title,
            }))}
            activeId={tab.id}
            // `push`: a tab is a destination, and the back button should walk out
            // of it rather than off the page. Every other param belongs to one
            // tab's own filters, so none is carried into the next.
            onChange={(id) =>
              setQueryState(
                withQuery(pathname, "", { tab: id === DEFAULT_ORDER_TAB ? null : id }),
                "push",
              )
            }
            size="md"
          />
        </div>
      )}

      <FadeIn key={tab.id}>
        {tab.kind === "all" ? (
          <AllOrdersPanel />
        ) : tab.kind === "basket" ? (
          <BasketBooksPanel desk={tab.desk} catalogHref={catalogListHref(tab.id)} />
        ) : tab.kind === "quota" ? (
          <QuotaBooksPanel desk={tab.desk} catalogHref={catalogListHref(tab.id)} />
        ) : (
          <TransactionsPanel asset={tab.asset} />
        )}
      </FadeIn>
    </div>
  );
}
