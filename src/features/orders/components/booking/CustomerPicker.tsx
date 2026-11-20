"use client";

import { useEffect, useMemo, useState } from "react";

import { Avatar, SearchInput } from "@sarunyu/system-one";
import {
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import { shortRequirementLabel } from "@/features/orders/lib/order-requirements";
import { useRosterReadiness } from "@/features/orders/hooks/use-order-books";
import { useClientsResource } from "@/features/clients/hooks/use-clients";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { ClientReadiness } from "@/types/order";

// ── Choosing the customer ────────────────────────────────────────────────────

/**
 * The customer list, in place of a dropdown.
 *
 * A dropdown can only show a name, so the IC picks someone and *then* finds out
 * they are three documents short. A list has room to answer that up front —
 * every row carries its own verdict against this product — which turns "pick a
 * customer" into "pick a customer who can actually buy this".
 *
 * That is also why the ready ones sort to the top rather than the roster
 * staying in id order: the list is being read to find someone bookable, and the
 * ones who are not are the answer to a different question.
 */
export function CustomerPicker({
  product,
  scrollerRef,
  onSelect,
}: {
  product: BookableProduct;
  /** The modal body — see the scroll reset below. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (clientId: string) => void;
}) {
  const t = useT();
  const {
    data: clients,
    isLoading: clientsLoading,
    error: clientsError,
    retry: retryClients,
  } = useClientsResource();
  const { isPrivate } = usePrivacy();
  const [search, setSearch] = useState("");
  const readiness = useRosterReadiness(clients, product);

  /**
   * Back to the top whenever the list changes under the reader.
   *
   * Typing a search while scrolled down a long book leaves the scroll position
   * where it was, and the browser only clamps it to the new, much shorter
   * list — so the matches open halfway down, with the first row cut off under
   * the sticky header. Returning on mount covers the same thing in reverse:
   * coming back from the form via "เปลี่ยน" would otherwise land wherever the
   * list was left.
   */
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
  }, [search, scrollerRef]);

  const results = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched = query
      ? clients.filter(
          (c) => maskName(c.name, isPrivate).toLowerCase().includes(query) || c.id.includes(query),
        )
      : clients;
    // Stable within each group — `sort` is stable in every engine this runs
    // on, so the roster's own order survives inside "ready" and "not ready".
    return [...matched].sort((a, b) => {
      const aReady = readiness.get(a.id)?.status === "ready" ? 0 : 1;
      const bReady = readiness.get(b.id)?.status === "ready" ? 0 : 1;
      return aReady - bReady;
    });
  }, [clients, search, isPrivate, readiness]);

  // Counts describe what is on screen, not the whole book — with a search
  // active, "2 จาก 8" beside a list of three is a number about something the
  // reader cannot see.
  const readyCount = results.filter((c) => readiness.get(c.id)?.status === "ready").length;

  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* Pinned to the top of the modal's scroller. With a long book the list
          scrolls for screens, and a search box that scrolls away with it means
          scrolling back to the top to narrow the list — which is the one thing
          a long list makes you want to do.
          It carries the same padding as the list below, so the two line up: the
          scroller and the pane around it are both unpadded precisely so this can
          be stated once per side rather than as a margin cancelling one. */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 pt-3 pb-2 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="type-body-2 !font-semibold text-foreground">
            {t.orders.booking.pickClient}
          </span>
          <span className="type-caption text-muted-foreground tabular-nums">
            {t.orders.words[bookingModeFor(product)].readyCount(readyCount, results.length)}
          </span>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder={t.orders.booking.searchClient}
          size="sm"
          className="w-full"
        />
      </div>

      <div className="px-4 md:px-6">
        {clientsLoading ? (
          <p className="type-body-2 py-10 text-center leading-5 text-muted-foreground">
            {t.orders.booking.loadingClients}
          </p>
        ) : clientsError ? (
          <ErrorState
            size="compact"
            title={t.orders.booking.clientsLoadFailed}
            onRetry={retryClients}
          />
        ) : results.length === 0 ? (
          // "Nothing matched" only when there was a search; an empty book is
          // a different fact and gets its own words.
          search.trim() ? (
            <EmptyState
              size="compact"
              icon={
                <MagnifyingGlassIcon size={32} className="text-[var(--text-default-placeholder)]" />
              }
              title={t.orders.booking.noClientMatch(search.trim())}
              action={{ label: t.states.clearFilters, onClick: () => setSearch("") }}
            />
          ) : (
            <p className="type-body-2 py-10 text-center leading-5 text-muted-foreground">
              {t.orders.booking.noClients}
            </p>
          )
        ) : (
          /* One frame, divided inside, rather than eight floating cards. The
             rows are a single list read top to bottom — gaps between them made
             each one its own object and put eight pairs of rounded corners in
             the way of that. `overflow-hidden` lets the first and last row take
             the frame's corners. */
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-neutral-100">
            {results.map((client) => (
              <CustomerRow
                key={client.id}
                client={client}
                readiness={readiness.get(client.id)}
                onSelect={() => onSelect(client.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * The three answers a row can give, in words rather than as a score.
 *
 * `ready` is the one the list exists to find, so it is the only green; the
 * other two are both "not yet" and differ in who the next move belongs to —
 * `in-review` is waiting on an approver (yellow, the same colour the status
 * chips use for `pending`), `blocked` is waiting on the IC (red). The prefix is
 * how the names that follow are read: "รอผล KYC" and "ยังขาด KYC" are the same
 * four records in two different states.
 */
const READINESS_VERDICT: Record<
  ClientReadiness["status"],
  { icon: typeof CheckCircleIcon; chip: string }
> = {
  ready: {
    icon: CheckCircleIcon,
    chip: "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]",
  },
  "in-review": {
    icon: ClockIcon,
    chip: "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]",
  },
  blocked: {
    icon: XCircleIcon,
    chip: "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]",
  },
};

function CustomerRow({
  client,
  readiness,
  onSelect,
}: {
  client: Client;
  readiness: ClientReadiness | undefined;
  onSelect: () => void;
}) {
  const t = useT();
  const { isPrivate } = usePrivacy();
  const displayName = maskName(client.name, isPrivate);
  const status = readiness?.status ?? "blocked";
  const verdict = READINESS_VERDICT[status];
  // Named, not counted. "2/4" says how much is wrong without saying what, and
  // the answer is four words away — the IC had to open the client to find out
  // whether this was a form to send or a KYC review they cannot start.
  const outstanding = (readiness?.outstanding ?? [])
    .map((i) => shortRequirementLabel(i.label))
    .join(", ");

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        // No fill and no radius of its own — both belong to the frame now.
        // The hover is what the row still owns, and it reaches the frame's
        // edges because the row is the full width of it.
        // `py-4`, where the single-line pair it was built for took `py-3`: a
        // chip sitting right on top of the line that explains it reads as one
        // stacked object, and the row needed the height for them to be two.
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-[var(--fill-neutral-200)] focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none focus-visible:ring-inset"
      >
        <Avatar type="text" initials={getInitial(displayName)} size="m" />
        {/* Still tight. A name and the tier under it are one label in two
            lines, and loosening them would undo that to match a gap on the
            other side of the row that is doing a different job. */}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-2 truncate !font-semibold text-foreground">
            {client.id} - {displayName}
          </span>
          {/* Who the client is, and only that. What is outstanding used to be
              appended here, dot-separated and changing colour halfway, which
              put a second heavy line under a bold name and made the list harder
              to read than the "2/4" it replaced. */}
          <span className="type-caption truncate text-muted-foreground">
            {client.tier} · {client.riskProfile}
          </span>
        </span>
        {/* The verdict, and under it the reason — one column, because they are
            one answer. The row has to say "can I book this one" before anything
            else, and a ratio made the reader derive it (4/4 only means yes if
            you also know the total is four); what is missing is the follow-up
            question, so it sits directly under the word that raises it.

            A filled chip rather than coloured text, and the same fill the next
            screen's status cards use: one shape to find down the column, at a
            contrast 12px type can carry. The reason under it stays grey — the
            chip is the only alarm in the row. */}
        <span className="flex min-w-0 shrink flex-col items-end gap-2">
          <span
            className={`type-caption flex shrink-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 !font-semibold ${verdict.chip}`}
          >
            <verdict.icon size={14} weight="fill" />
            {t.orders.readiness[status].text}
          </span>
          {outstanding && (
            <span className="type-caption max-w-full truncate text-muted-foreground">
              {t.orders.readiness[status].outstanding(outstanding)}
            </span>
          )}
        </span>
        <CaretRightIcon size={16} className="shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}
