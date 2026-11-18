"use client";

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
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { catalogListHref } from "@/lib/product-catalog-routes";
import { useClients } from "@/hooks/use-api";
import { CatalogNotFound } from "../../../product-catalog/CatalogNotFound";
import { normalizeOrderTab } from "../../order-tabs";
import { ClientOrdersDetail } from "./ClientOrdersDetail";

export default function ClientOrdersPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  // Same gate as the rest of Order Management — above every hook, so flipping
  // the flag cannot change the hook order.
  if (!ORDER_BOOKING_ENABLED) redirect("/product-catalog");
  return (
    <Suspense fallback={null}>
      <ClientOrdersPageInner params={params} />
    </Suspense>
  );
}

function ClientOrdersPageInner({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const id = decodeURIComponent(clientId);
  const searchParams = useSearchParams();
  const clients = useClients();
  const router = useRouter();

  const client = clients.find((c) => c.id === id);
  const tab = normalizeOrderTab(searchParams.get("tab"));

  // A client page only means something under a booking desk: the three
  // transaction tabs and "ทั้งหมด" have no one desk's bookings to list, and a
  // link that landed here from one would have nothing to show.
  if (tab.kind === "transactions" || tab.kind === "all" || !client) {
    return (
      <CatalogNotFound
        message={client ? "หมวดนี้ไม่มีรายการจอง" : "ไม่พบลูกค้ารายนี้"}
        onBack={() => router.push("/orders")}
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
