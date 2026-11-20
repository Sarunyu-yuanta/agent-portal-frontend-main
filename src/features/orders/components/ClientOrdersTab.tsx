"use client";

/**
 * A client profile's Order tab: Order Management, scoped to one client.
 *
 * The same eight tabs and, under each, the same panel Order Management mounts —
 * chips, filter, search, table and "สร้าง Order" included — each given this
 * client's id. A second implementation would drift from the first; one
 * implementation with a scope cannot.
 *
 * The sub-tab lives in `?otab=`, not `?tab=`: the profile page already uses
 * `tab` for its own tabs (this one is `tab=orders`).
 */

import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { TabGroup } from "@sarunyu/system-one";
import { FadeIn } from "@/components/ui/fade-in";
import { TabsSkeleton } from "@/components/ui/skeleton";
import { useOrders } from "@/features/orders/store/orders-context";
import { useHasLoaded } from "@/hooks/use-api";
import { useTransactions } from "@/features/orders/hooks/use-transactions";
import { catalogListHref } from "@/features/catalog/lib/product-catalog-routes";
import { setQueryState, withQuery } from "@/lib/query-state";
import { AllOrdersPanel } from "./AllOrdersPanel";
import { BasketBooksPanel } from "./BasketBooksPanel";
import { QuotaBooksPanel } from "./QuotaBooksPanel";
import { TransactionsPanel } from "./TransactionsPanel";
import { DEFAULT_ORDER_TAB, ORDER_TABS, normalizeOrderTab } from "@/features/orders/lib/order-tabs";
import { useT } from "@/i18n/I18nProvider";

export function ClientOrdersTab({ clientId }: { clientId: string }) {
  const t = useT();
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const tab = normalizeOrderTab(searchParams.get("otab"));
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
        <div className="transparent-tabs scrollable-tabs">
          <TabGroup
            items={ORDER_TABS.map((tab) => ({
              id: tab.id,
              title: tab.id === "all" ? t.orders.tabAll : tab.title,
            }))}
            activeId={tab.id}
            // Every filter belongs to one sub-tab, so none is carried into the
            // next — only the profile's own `tab` stays.
            onChange={(id) =>
              setQueryState(
                withQuery(pathname, "", {
                  tab: searchParams.get("tab"),
                  otab: id === DEFAULT_ORDER_TAB ? null : id,
                }),
                "replace",
              )
            }
            size="md"
          />
        </div>
      )}

      <FadeIn key={tab.id}>
        {tab.kind === "all" ? (
          <AllOrdersPanel clientId={clientId} />
        ) : tab.kind === "basket" ? (
          <BasketBooksPanel
            desk={tab.desk}
            catalogHref={catalogListHref(tab.id)}
            clientId={clientId}
          />
        ) : tab.kind === "quota" ? (
          <QuotaBooksPanel
            desk={tab.desk}
            catalogHref={catalogListHref(tab.id)}
            clientId={clientId}
          />
        ) : (
          <TransactionsPanel asset={tab.asset} clientId={clientId} />
        )}
      </FadeIn>
    </div>
  );
}
