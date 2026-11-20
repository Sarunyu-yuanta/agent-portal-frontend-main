"use client";

/**
 * The quota desks' tab body — Fixed Income or Global Bond: every client this IC
 * has sent an order for on that desk.
 *
 * Same frame as `BasketBooksPanel` (search, chips, one row per record), with
 * the chips in this desk's own wording: a bond order starts life already sent,
 * where a basket booking starts by waiting for the basket. See
 * `bookingPhaseSteps` and {@link ORDER_WORDS}.
 *
 * These desks lose the least in the inversion: a bond order is one client's
 * whole transaction, so "this client's records" and "this client's orders" are
 * the same list, where on a basket desk a booking is a share of someone else's
 * deal.
 */

import { OrdersPanelSkeleton } from "./OrdersPanelSkeleton";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, Chip, SearchInput } from "@sarunyu/system-one";
import { LocaleLink as Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { FadeIn } from "@/components/ui/fade-in";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { getAccountIdentity } from "@/mocks/client-profiles";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { OrderRecordsTable } from "./OrderRecordsTable";
import { CreateOrderButton } from "./CreateOrderButton";
import { bookingPhaseSteps, ownBookings } from "@/features/orders/lib/order-book";
import { hasOwnWorkAt } from "@/features/orders/lib/order-proposals";
import { IC_NAME } from "@/features/auth/lib/current-ic";
import { useOrders } from "@/features/orders/store/orders-context";
import { useOrderBooks } from "@/features/orders/hooks/use-order-books";
import { bookingModeForDesk, type Desk } from "@/features/orders/lib/bookable-products";
import { useT } from "@/i18n/I18nProvider";

export function QuotaBooksPanel({
  desk,
  clientId,
  catalogHref,
  productIds,
}: {
  desk: Desk;
  /**
   * One client's records only — the client profile's Order tab, which mounts
   * this same panel so its chips, search and table match Order Management.
   * Booking from it ("สร้าง Order") books for this client.
   */
  clientId?: string;
  /**
   * Where the empty state sends the IC to start an order — the desk's
   * catalogue tab. Omitted where the IC is *already* looking at the products:
   * an issuer's page offers no link back to a list it is a page of.
   */
  catalogHref?: string;
  /**
   * Narrow to these books, by product id.
   *
   * Order Management's tab passes nothing and gets the whole desk. An issuer's
   * page passes its own bonds, so its Order tab answers "what have I ordered
   * from this issuer" with the same chips and the same table as the desk tab —
   * one implementation, two scopes.
   */
  productIds?: string[];
}) {
  const t = useT();
  const pathname = useAppPathname();
  const searchParams = useSearchParams();
  const { data: books, isLoading } = useOrderBooks();
  // Offers are part of this list now — see `hasOwnWorkAt`.
  const { proposals } = useOrders();
  // One desk per panel, so one mode — the chips and the table both read it.
  const mode = bookingModeForDesk(desk);
  // Memoised on the mode: `step` is an object picked out of this array and
  // feeds the filter below, so a fresh array every render would cost the
  // memoisation of the whole list.
  const STEPS = useMemo(() => bookingPhaseSteps(mode, t, { offers: true }), [mode, t]);
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");

  const step = STEPS.find((s) => s.id === searchParams.get("step")) ?? STEPS[0];
  /** `null` on "ทั้งหมด" — what the filters read as "no step filter". */
  const step_ = step.id === "all" ? null : step.id;

  const matching = useMemo(() => {
    // This desk, the step's phase, and only the IC's own bookings — the same
    // filter the table groups by, so the two cannot disagree about whether a
    // desk is empty. See `ownBookings`.
    const ofDesk = books.filter(
      (book) =>
        book.desk === desk &&
        (!productIds || productIds.includes(book.productId)) &&
        hasOwnWorkAt(book, IC_NAME, step_, proposals, clientId),
    );
    const query = search.trim().toLowerCase();
    if (!query) return ofDesk;
    return ofDesk.filter((book) =>
      [
        // The client leads — see `BasketBooksPanel` for why.
        ...ownBookings(book, IC_NAME).flatMap((b) => [
          b.clientId,
          maskName(b.clientName, isPrivate),
          getAccountIdentity(b.clientId).accountNo,
        ]),
        book.productName,
        book.productType,
        ...book.submissions.map((s) => s.backendRef),
      ].some((text) => text.toLowerCase().includes(query)),
    );
  }, [books, desk, search, isPrivate, step_, proposals, productIds, clientId]);

  if (isLoading) return <OrdersPanelSkeleton withCreate />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollable-tabs flex min-w-0 flex-1 items-center gap-2">
          {STEPS.map((s) => (
            <Chip
              key={s.id}
              label={s.label}
              type="single"
              selected={s.id === step.id}
              onClick={() =>
                setQueryState(
                  withQuery(pathname, searchParams, { step: s.id === "all" ? null : s.id }),
                  "replace",
                )
              }
            />
          ))}
        </div>
        {/* Same fixed width as `BasketBooksPanel`'s, for the same reason. */}
        <div className="flex items-stretch gap-2.5 lg:shrink-0">
          <div className="min-w-0 flex-1 lg:w-[220px] lg:flex-none">
            <SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              // The same words as the transaction tabs' box: all seven tabs of
              // Order Management search the same two things, and "Search All" was
              // the only English left on the page.
              placeholder={t.orders.list.searchPlaceholder}
              className="w-full"
            />
          </div>
          {/* Bookable desks only — see `CreateOrderButton`. */}
          <CreateOrderButton desk={desk} clientId={clientId} />
        </div>
      </div>

      {isLoading ? (
        <OrderRecordsTable books={[]} mode={mode} step={step_} isLoading />
      ) : matching.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search.trim() ? t.states.noResultTitle : step.empty}
          action={
            search.trim()
              ? { label: t.states.clearFilters, onClick: () => setSearch("") }
              : undefined
          }
          body={
            search.trim()
              ? t.orders.books.searchHint
              : catalogHref
                ? t.orders.books.quotaEmptyHint
                : t.orders.books.quotaEmptyHintInline
          }
          actionSlot={
            search.trim() || !catalogHref ? undefined : (
              <Link href={catalogHref}>
                <Button variant="outline" size="md">
                  {t.orders.books.goToCatalog}
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <FadeIn key={step.id}>
          <OrderRecordsTable books={matching} mode={mode} step={step_} clientId={clientId} />
        </FadeIn>
      )}
    </div>
  );
}
