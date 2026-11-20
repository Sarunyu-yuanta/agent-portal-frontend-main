"use client";

import { useLocale, useT } from "@/i18n/I18nProvider";
import { localizePath } from "@/i18n/locale-path";

/**
 * One client's orders on one desk — see `ClientOrdersDetail` for why this rung
 * exists.
 *
 * `/orders/client/:id` sits beside `/orders/:productId`, and the static segment
 * wins over the dynamic one, so a book whose product id were literally
 * "client" would be unreachable. None is, and the ids are desk-prefixed
 * (`thai-`, `fi-`, `gb-`) or authored slugs — see `bookable-products.ts`.
 *
 * Resolving the client and the desk is this route's job, which is why the
 * not-found branch is here rather than inside the body: a component handed both
 * has nothing left to fail at. Same split as `/orders/[productId]`.
 */

import { Suspense, use } from "react";
import { redirect, useSearchParams } from "next/navigation";
import { useLocalizedRouter } from "@/i18n/navigation";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { catalogListHref } from "@/features/catalog/lib/product-catalog-routes";
import { ErrorState } from "@/components/ui/empty-state";
import { OrdersPanelSkeleton } from "@/features/orders/components/OrdersPanelSkeleton";
import { CatalogNotFound } from "@/features/catalog/components/CatalogNotFound";
import { normalizeOrderTab } from "@/features/orders/lib/order-tabs";
import { ClientOrdersDetail } from "@/features/orders/components/ClientOrdersDetail";
import { useClientsResource } from "@/features/clients/hooks/use-clients";
import { ROUTES } from "@/lib/routes";

export default function ClientOrdersPage({ params }: { params: Promise<{ clientId: string }> }) {
  const locale = useLocale();
  // Same gate as the rest of Order Management — above every hook, so flipping
  // the flag cannot change the hook order.
  if (!ORDER_BOOKING_ENABLED) redirect(localizePath(ROUTES.productCatalog, locale));
  return (
    <Suspense fallback={null}>
      <ClientOrdersPageInner params={params} />
    </Suspense>
  );
}

function ClientOrdersPageInner({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const id = decodeURIComponent(clientId);
  const t = useT();
  const searchParams = useSearchParams();
  const { data: clients, isLoading, error, retry } = useClientsResource();
  const router = useLocalizedRouter();

  const tab = normalizeOrderTab(searchParams.get("tab"));
  // Loading before not-found, so a slow client list never flashes
  // "ไม่พบลูกค้ารายนี้".
  if (isLoading) return <OrdersPanelSkeleton />;
  if (error) return <ErrorState onRetry={retry} />;
  const client = clients.find((c) => c.id === id);

  // A client page only means something under a booking desk: the three
  // transaction tabs and "ทั้งหมด" have no one desk's bookings to list, and a
  // link that landed here from one would have nothing to show.
  if (tab.kind === "transactions" || tab.kind === "all" || !client) {
    return (
      <CatalogNotFound
        message={client ? t.orders.clientPage.noBookingsInDesk : t.states.notFoundClient}
        onBack={() => router.push(ROUTES.orders)}
      />
    );
  }

  return (
    <ClientOrdersDetail
      client={client}
      desk={tab.desk}
      tabId={tab.id}
      catalogHref={catalogListHref(tab.id)}
    />
  );
}
