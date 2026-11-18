"use client";

/**
 * The basket desks' tab body — Thai Structured or Global Structured: every
 * client this IC has booked into a product of that desk.
 *
 * One row per record, not per product (see `OrderRecordsTable`). The books are
 * still assembled per product and still filtered here by desk and by
 * availability; the table is what inverts them into one row per person.
 *
 * The catalogue is where a deal is found; this is where one that has already
 * been started is tracked. A product with no booking, no submission and no
 * outstanding request is therefore not listed at all (see `useOrderBooks`) — an
 * empty list means there is no work in progress, not that the catalogue is
 * empty.
 */

import { OrdersPanelSkeleton } from "./OrdersPanelSkeleton";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppPathname } from "@/i18n/navigation";
import { ClipboardTextIcon } from "@phosphor-icons/react";
import { Button, Chip, SearchInput } from "@sarunyu/system-one";
import { LocaleLink as Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { usePrivacy } from "@/contexts/privacy-context";
import { getAccountIdentity } from "@/data/client-profiles";
import { FadeIn } from "@/components/ui/fade-in";
import { maskName } from "@/lib/mask-name";
import { setQueryState, withQuery } from "@/lib/query-state";
import { OrderRecordsTable } from "./OrderRecordsTable";
import { CreateOrderButton } from "./CreateOrderButton";
import { bookingPhaseSteps, ownBookings } from "./order-book";
import { hasOwnWorkAt } from "./order-proposals";
import { IC_NAME } from "@/lib/current-ic";
import { useOrders } from "@/contexts/orders-context";
import { useOrderBooks } from "./use-order-books";
import { bookingModeForDesk, type Desk } from "./bookable-products";
import { useT } from "@/i18n/I18nProvider";

export function BasketBooksPanel({
  desk,
  clientId,
  catalogHref,
}: {
  desk: Desk;
  /**
   * One client's records only — the client profile's Order tab, which mounts
   * this same panel so its chips, search and table match Order Management.
   * Booking from it ("สร้าง Order") books for this client.
   */
  clientId?: string;
  /** Where the empty state sends the IC to start a booking — the desk's catalogue tab. */
  catalogHref: string;
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

  // A refinement rather than a destination, so `replace` — the back button
  // should leave the page, not step back through every chip clicked on it. In
  // the URL all the same, so a book's "back to Order Management" lands on the
  // step it was opened from.
  const requestedStep = searchParams.get("step");
  const step = STEPS.find((s) => s.id === requestedStep) ?? STEPS[0];
  /** `null` on "ทั้งหมด" — what the filters read as "no step filter". */
  const step_ = step.id === "all" ? null : step.id;

  // "Search All" — anything a row is recognised by. The client leads, because
  // the list is read by client now: their name, id and account number, then the
  // products they hold and the order references those produced.
  const matching = useMemo(() => {
    // This desk, the step, and only the IC's own work — the same predicate
    // the table groups by, so the two cannot disagree about whether a desk is
    // empty. See `hasOwnWorkAt`.
    const ofType = books.filter(
      (book) => book.desk === desk && hasOwnWorkAt(book, IC_NAME, step_, proposals, clientId),
    );
    const query = search.trim().toLowerCase();
    if (!query) return ofType;
    return ofType.filter((book) =>
      [
        ...ownBookings(book, IC_NAME).flatMap((b) => [
          b.clientId,
          maskName(b.clientName, isPrivate),
          getAccountIdentity(b.clientId).accountNo,
        ]),
        book.productName,
        book.productType,
        book.desk,
        ...book.submissions.map((s) => s.backendRef),
      ].some((text) => text.toLowerCase().includes(query)),
    );
  }, [books, desk, search, isPrivate, step_, proposals, clientId]);



  if (isLoading) return <OrdersPanelSkeleton withCreate />;

  return (
    <div className="flex flex-col gap-4">
      {/* Steps on the left, search on the right; stacked below `lg`. */}
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
        {/* A fixed width rather than the row's leftovers: a query is a few
            characters, and a bar as wide as the page read as the page's
            main control. Width on the wrapper — the library's own `.w-full`
            outranks a Tailwind width set on the component. */}
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

      {/* Loading sits above the empty check — otherwise, once orders have a real
          endpoint, every visit flashes "ยังไม่มีรายการจอง" before the data
          lands. The project-wide rule, see `docs/handover.md`. */}
      {isLoading ? (
        <OrderRecordsTable books={[]} mode={mode} step={step_} isLoading />
      ) : matching.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon size={40} className="text-[var(--text-default-placeholder)]" />}
          title={search.trim() ? t.states.noResultTitle : step.empty}
          action={search.trim() ? { label: t.states.clearFilters, onClick: () => setSearch("") } : undefined}
          body={
            search.trim()
              ? t.orders.books.searchHint
              : t.orders.books.basketEmptyHint
          }
          actionSlot={
            search.trim() ? undefined : (
              <Link href={catalogHref}>
                <Button variant="outline" size="md">
                  {t.orders.books.goToCatalog}
                </Button>
              </Link>
            )
          }
        />
      ) : (
        // Keyed on the step, so switching it replays the fade — the rows change
        // completely.
        <FadeIn key={step.id}>
          <OrderRecordsTable books={matching} mode={mode} step={step_} clientId={clientId} />
        </FadeIn>
      )}
    </div>
  );
}
