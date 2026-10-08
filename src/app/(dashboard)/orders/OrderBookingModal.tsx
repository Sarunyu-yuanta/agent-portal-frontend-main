"use client";

/**
 * The booking form: pick the customer, read their four statuses back, enter the
 * notional, book.
 *
 * ## One screen, with the amount gated in place
 *
 * The amount used to be a second step behind `ถัดไป`. It is back on the same
 * screen as the checks, so the IC sees the whole order at once — but it is
 * **disabled until all four pass**, faded rather than hidden, so the reader can
 * see what comes next and that it is not yet open to them. That keeps what the
 * step bought (no typing an amount for a client who cannot buy) without the
 * extra click.
 *
 * `จองซื้อ` still re-checks readiness rather than trusting the faded section: a
 * check can expire while the form is open. A client who is missing something is
 * fixed in the system that owns the record, which is where
 * "ส่งให้ลูกค้าดำเนินการ" sends them — the form has no override.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Input,
  SearchInput,
  useIsMobile,
  type ToastStatus,
} from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  PaperPlaneTiltIcon,
  ClockIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { IC_NAME, IC_TEAM } from "@/lib/current-ic";
import { formatThbAmount, getInitial, parseAmount } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type {
  Booking,
  Client,
  ClientReadiness,
  RequirementItem,
  RequirementStatus,
} from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import {
  cashInCurrency,
  clientCashThb,
  formatOrderAmount,
  isBookClosed,
  isBookingOpen,
  minTicketFor,
  USD_THB,
} from "./order-book";
import { requestableKeys } from "./order-requirements";
import { useClientReadiness, useOrderBook, useRosterReadiness } from "./use-order-books";

export function OrderBookingModal({
  open,
  product,
  onClose,
  onNotice,
  onBooked,
}: {
  open: boolean;
  product: BookableProduct;
  onClose: () => void;
  /** The host owns the toast stack — a booking closes this, taking its DOM. */
  onNotice: (message: string, status: ToastStatus) => void;
  /** After a booking lands — the product page uses it to show the new row. */
  onBooked?: (booking: Booking) => void;
}) {
  /**
   * The chosen customer lives here rather than in the form, because the back
   * button that clears it sits in the modal's own title row.
   */
  const [clientId, setClientId] = useState("");
  // Reset on every open, during render rather than in an effect — the same
  // reason the form below remounts: a reopened form must not still hold the
  // last client.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setClientId("");
  }

  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={`ทำรายการจองซื้อ ${product.underlying} ${product.coupon}`}
      titleId="order-booking-title"
      // Two columns of short fields and one amount — past about this width the
      // grid stops being two columns of a form and becomes two columns of a
      // page, with the eye travelling further than any of the values are long.
      desktopMaxWidth="max-w-[614px]"
      // Beside the title, where a back arrow is looked for — only once a
      // customer is chosen, since the list itself has nowhere to go back to.
      desktopTitleIcon={
        clientId ? <BackButton onClick={() => setClientId("")} /> : undefined
      }
    >
      {/* Remounting per open resets the customer and the amount — a form
          reopened still holding the last client's number is a mis-booking
          waiting to happen. */}
      <BookingForm
        key={open ? "open" : "closed"}
        product={product}
        clientId={clientId}
        onClientChange={setClientId}
        onClose={onClose}
        onNotice={onNotice}
        onBooked={onBooked}
      />
    </ResponsiveBottomSheetModal>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="plain-black"
      size="icon-sm"
      onClick={onClick}
      aria-label="ย้อนกลับไปเลือกลูกค้า"
      title="ย้อนกลับไปเลือกลูกค้า"
      className="-ml-1 shrink-0"
    >
      <ArrowLeftIcon size={20} />
    </Button>
  );
}

function BookingForm({
  product,
  clientId,
  onClientChange: setClientId,
  onClose,
  onNotice,
  onBooked: onBookedProp,
}: {
  product: BookableProduct;
  clientId: string;
  onClientChange: (id: string) => void;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
  onBooked?: (booking: Booking) => void;
}) {
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const { bookOrder } = useOrders();

  const isMobile = useIsMobile();
  const [raw, setRaw] = useState("");
  const [booking, setBooking] = useState(false);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const readiness = useClientReadiness(client ?? PLACEHOLDER_CLIENT, product);
  /** The gate on the amount section — and the one on the booking itself. */
  const ready = Boolean(client) && readiness.status === "ready";

  /** The modal's scroller — the customer list needs it to reset on search. */
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* No horizontal padding here — each branch pads itself.
          The sticky header inside the picker has to bleed to the modal's edges
          to cover the rows passing under it, and doing that from inside a
          padded scroller meant cancelling the padding with a negative margin.
          That pair has to match at every breakpoint, and it did not: the block
          ended up 8px further in than the list below it. Padding the branches
          instead means there is no pair to keep in step. */}
      <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto pb-4 pt-3">
        {/* The form is two screens in one modal: choose, then fill in. Until a
            customer is chosen there is nothing to show but their statuses, and
            every one of them would read "—" — so the list gets the whole body
            instead of sitting in a dropdown above four empty cards. */}
        {!client ? (
          <CustomerPicker
            product={product}
            scrollerRef={bodyRef}
            onSelect={(id) => {
              setClientId(id);
              // A different customer is a different order — never carry the
              // last one's amount over to them.
              setRaw("");
            }}
          />
        ) : (
          <div className="px-4 md:px-6">
            {/* The bottom sheet's header is its own and takes no icon, so on a
                phone the back arrow opens the body instead of sharing the
                title row. */}
            {isMobile && (
              <div className="mb-2">
                <BackButton onClick={() => setClientId("")} />
              </div>
            )}
            {/* A wider row gap than column gap: the columns are already far
                apart across the modal, where the rows are two lines of text
                that would otherwise run together. */}
            <div className="grid grid-cols-1 gap-x-3 gap-y-4 md:grid-cols-2">
              <FieldCard label="Customer">
                {/* The link trails the name, not the label. "เปลี่ยน" acts on
                    the customer, and the customer is the line below the
                    caption — put it up there and it reads as an action on the
                    word "Customer" instead. `flex-wrap` lets it drop to its own
                    line rather than squeezing a long name. */}
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="type-body-2 min-w-0 truncate !font-semibold text-foreground">
                    {client.id} - {maskName(client.name, isPrivate)}
                  </span>
                  <ActionLink
                    label="เปลี่ยน"
                    disabled={false}
                    onClick={() => setClientId("")}
                  />
                </div>
              </FieldCard>
              <ReadOnlyField
                label="Account No"
                value={getClientProfile(client.id).accountNo}
              />
              {/* The IC sits with the customer, above the checks, because the
                  four of them together are the header of the order: who it is
                  for, on which account, placed by whom, from which desk. None
                  of it is a decision — putting it after the checks made the
                  reader step over a block of facts to reach the amount. */}
              <ReadOnlyField label="IC Name" value={IC_NAME} />
              <ReadOnlyField label="IC Team" value={IC_TEAM} />
            </div>

            <StatusGrid product={product} client={client} onNotice={onNotice} />
            <AmountSection
              product={product}
              client={client}
              raw={raw}
              onRawChange={setRaw}
              disabled={!ready}
              passed={readiness.items.filter((i) => i.status === "passed").length}
              total={readiness.items.length}
            />
          </div>
        )}
      </div>

      <Footer
        ready={ready}
        product={product}
        client={client}
        raw={raw}
        booking={booking}
        onCancel={onClose}
        onBooked={async (amount) => {
          if (!client) return;
          setBooking(true);
          const placed = await bookOrder({
            productId: product.id,
            clientId: client.id,
            clientName: client.name,
            amount,
            checks: readiness.items,
            fundsAvailable: cashInCurrency(clientCashThb(client), product.currency),
          });
          setBooking(false);
          onClose();
          onBookedProp?.(placed);
          onNotice(
            `จอง ${formatOrderAmount(amount, product.currency)} ให้ ${maskName(client.name, isPrivate)} แล้ว`,
            "success",
          );
        }}
      />
    </div>
  );
}

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
function CustomerPicker({
  product,
  scrollerRef,
  onSelect,
}: {
  product: BookableProduct;
  /** The modal body — see the scroll reset below. */
  scrollerRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (clientId: string) => void;
}) {
  const clients = useClients();
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
          (c) =>
            maskName(c.name, isPrivate).toLowerCase().includes(query) ||
            c.id.includes(query),
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
    <div className="flex flex-col gap-3">
      {/* Pinned to the top of the modal's scroller. With a long book the list
          scrolls for screens, and a search box that scrolls away with it means
          scrolling back to the top to narrow the list — which is the one thing
          a long list makes you want to do.
          It carries the same `px` as the list below, so the two line up; the
          scroller itself is unpadded precisely so this can be stated once per
          side instead of as a margin cancelling a padding. `-mt-3 pt-3` is the
          one cancelled pair left, and it is vertical — a single value, with no
          breakpoint to keep in step. */}
      <div className="sticky top-0 z-10 -mt-3 flex flex-col gap-3 bg-white px-4 pb-2 pt-3 md:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="type-body-2 !font-semibold text-foreground">เลือกลูกค้า</span>
          <span className="type-caption text-muted-foreground tabular-nums">
            จองได้เลย {readyCount} จาก {results.length} ราย
          </span>
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="ค้นหาชื่อหรือรหัสลูกค้า"
          size="sm"
          className="w-full"
        />
      </div>

      <div className="px-4 md:px-6">
        {results.length === 0 ? (
          <p className="type-body-2 py-10 text-center leading-5 text-muted-foreground">
            ไม่พบลูกค้าที่ค้นหา
          </p>
        ) : (
          /* One frame, divided inside, rather than eight floating cards. The
             rows are a single list read top to bottom — gaps between them made
             each one its own object and put eight pairs of rounded corners in
             the way of that. `overflow-hidden` lets the first and last row take
             the frame's corners. */
          <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl bg-[#f3f4f6]">
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

function CustomerRow({
  client,
  readiness,
  onSelect,
}: {
  client: Client;
  readiness: ClientReadiness | undefined;
  onSelect: () => void;
}) {
  const { isPrivate } = usePrivacy();
  const displayName = maskName(client.name, isPrivate);
  const ready = readiness?.status === "ready";
  const passed = readiness?.items.filter((i) => i.status === "passed").length ?? 0;
  const total = readiness?.items.length ?? 0;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        // No fill and no radius of its own — both belong to the frame now.
        // The hover is what the row still owns, and it reaches the frame's
        // edges because the row is the full width of it.
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--fill-gray-200)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7]"
      >
        <Avatar type="text" initials={getInitial(displayName)} size="m" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="type-body-2 truncate !font-semibold text-foreground">
            {client.id} - {displayName}
          </span>
          <span className="type-caption truncate text-muted-foreground">
            {client.tier} · {client.riskProfile}
          </span>
        </span>
        {/* How far along, not how far short — and the same `passed / total`
            the form's own counter uses once a customer is picked, so the two
            screens are read the same way rather than one counting up and the
            other counting down. `tabular-nums` keeps the column from shifting
            as the digits change. */}
        <span
          className={`type-caption shrink-0 !font-semibold tabular-nums ${
            ready ? "text-[var(--fill-green-600)]" : "text-muted-foreground"
          }`}
        >
          {passed}/{total}
        </span>
        <CaretRightIcon size={16} className="shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
}

// ── The status block ─────────────────────────────────────────────────────────

function StatusGrid({
  product,
  client,
  onNotice,
}: {
  product: BookableProduct;
  client: Client;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { isPrivate } = usePrivacy();
  const { sendRequirementRequest } = useOrders();
  const readiness = useClientReadiness(client, product);
  const sendable = requestableKeys(readiness);
  const displayName = maskName(client.name, isPrivate);
  const [sending, setSending] = useState(false);

  /**
   * Sends the client off to complete everything outstanding, in one request.
   *
   * One request rather than one per record: they go out together, they come
   * back together, and the IC has no reason to send half of them. In the real
   * screen each record lives in its own system (Wealth Declare, Risk Consent) —
   * that is a routing detail of the request, not a decision for whoever is on
   * the phone. Here there is nowhere to route to, so the store answers on a
   * timer; same round trip, minus the other applications. See
   * `contexts/orders-context`.
   */
  const sendAll = async () => {
    setSending(true);
    await sendRequirementRequest({
      clientId: client.id,
      clientName: client.name,
      productId: product.id,
      keys: sendable,
    });
    setSending(false);
    onNotice(
      `ส่งให้ ${displayName} ดำเนินการ ${sendable.length} รายการแล้ว — จะแจ้งเตือนเมื่อลูกค้าทำเสร็จ`,
      "success",
    );
  };

  const ready = readiness.items.filter((i) => i.status === "passed").length;

  return (
    <>
      {/* A heading over the four, with the count. The chips answer each row;
          this answers the grid — "3 จาก 4" is what the IC repeats back on the
          phone, and it saves re-counting colours every time the form re-renders
          under them. */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-4">
        <span className="type-body-2 !font-semibold text-foreground">
          ข้อมูลที่ต้องมีก่อนจองซื้อ
        </span>
        {/* Same `passed / total` the customer list shows per row, in the same
            format. One ratio written two ways is a ratio the reader has to
            translate between. */}
        <span
          className={`type-caption rounded-full px-2 py-0.5 tabular-nums ${
            readiness.status === "ready"
              ? "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]"
              : "bg-[var(--fill-gray-100)] text-muted-foreground"
          }`}
        >
          {ready}/{readiness.items.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 pt-3 md:grid-cols-2">
        {readiness.items.map((item) => (
          <StatusField key={item.key} item={item} />
        ))}
      </div>

      {/* One button for the whole set, where each card used to carry its own
          link. Those links were per-field because each record lives in its own
          system, but the IC's move is the same either way — send the client off
          to finish what is missing — and one button is that move stated once.
          It also means the cards hold nothing clickable, which is what lets the
          big icon on the right read as the only thing in them.

          Hidden when there is nothing to send: everything passed, or the only
          thing left is a risk rating no form can change (the alert below says
          so instead). */}
      {sendable.length > 0 && (
        /* Right-aligned, under the grid it acts on — the same edge the modal's
           own `จองซื้อ` sits on, so the two actions line up as one column of
           "what happens next" rather than one starting at each margin.
           Full-width on a phone, where there is no second column to align to
           and a 280px button floated right just looks stranded. */
        <div className="flex justify-end pt-3">
          <Button
            variant={sending ? "disabled" : "primary"}
            size="md"
            disabled={sending}
            onClick={sendAll}
            leftIcon={<PaperPlaneTiltIcon size={18} />}
            className="w-full md:w-auto"
          >
            {sending
              ? "กำลังส่ง…"
              : `ส่งให้ลูกค้าดำเนินการ (${sendable.length} รายการ)`}
          </Button>
        </div>
      )}

      {/* One line under the grid, only when the grid alone would leave the IC
          guessing why the button is dead. The red boxes say *what* is wrong;
          these say what to do about it. */}
      {readiness.status === "blocked" && sendable.length === 0 && (
        <Alert
          status="critical"
          title="ลูกค้ารายนี้ยังซื้อผลิตภัณฑ์นี้ไม่ได้"
          message={`ระดับความเสี่ยงที่ลูกค้ารับได้ (${client.riskProfile}) ต่ำกว่าที่ผลิตภัณฑ์นี้กำหนด — ต้องให้ลูกค้าทำแบบประเมินความเสี่ยงใหม่ก่อน`}
          multiline
          className="mt-4"
        />
      )}
      {readiness.status === "in-review" && (
        <Alert
          status="information"
          message="ลูกค้าดำเนินการแล้ว อยู่ระหว่างรอผลตรวจสอบ — จะแจ้งเตือนเมื่อผ่าน"
          multiline
          className="mt-4"
        />
      )}
    </>
  );
}

/**
 * How each status reads: a tinted chip with an icon, not a text box.
 *
 * These fields were boxes once, which was wrong twice over. A bordered box the
 * height of an input invites a click and a keystroke, and none of them takes
 * one — only Notional Amount does. And a box can only say "wrong" by turning
 * its outline red, which leaves "right" saying nothing at all: the IC had to
 * read four values to work out that three were fine.
 *
 * A chip answers "มีแล้วหรือยัง" before the value is read. Green is on file,
 * red is not, and the two states that are neither get their own colour rather
 * than being rounded towards one of them — amber for *waiting on an approver*
 * (the client has already acted; chasing them would be chasing the wrong
 * person) and orange for *expired* (it was on file, which is a different
 * conversation from never having had it).
 */
const STATUS_CHIP: Record<
  RequirementStatus,
  { icon: typeof CheckCircleIcon; bg: string; fg: string }
> = {
  passed: {
    icon: CheckCircleIcon,
    bg: "bg-[var(--fill-green-100)]",
    fg: "text-[var(--fill-green-600)]",
  },
  pending: {
    icon: ClockIcon,
    bg: "bg-[var(--fill-yellow-100)]",
    fg: "text-[var(--fill-yellow-600)]",
  },
  expired: {
    icon: WarningCircleIcon,
    bg: "bg-[var(--fill-orange-100)]",
    fg: "text-[var(--fill-orange-600)]",
  },
  missing: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
  failed: {
    icon: XCircleIcon,
    bg: "bg-[var(--fill-red-100)]",
    fg: "text-[var(--fill-red-600)]",
  },
};

/**
 * The grey panel every read-only value sits on.
 *
 * This is what separates the two kinds of field at a glance: **white with a
 * border means you can type in it** (the customer dropdown, the notional
 * amount), **filled grey means the system is telling you something**. The
 * statuses had an input's shape once, which invited a click none of them takes;
 * a filled panel with the label inside it reads as a card rather than a field,
 * so the invitation goes away without the information going with it.
 *
 * No border, deliberately — an outline is the other half of what made these
 * read as inputs, and the fill alone is enough to bound a card. That is also
 * why the grey is `#f3f4f6` rather than the `#f9fafb` used elsewhere in this
 * app: with an outline to define the edge, the lighter grey is plenty; without
 * one it is close enough to the modal's white that the cards stop reading as
 * separate surfaces at all.
 */
export function FieldCard({
  label,
  trailing,
  variant = "fact",
  className = "",
  children,
}: {
  label: string;
  /**
   * Which of the two things this card is — they differ in more than one way, so
   * they are one choice rather than a handful of booleans that always move
   * together.
   *
   * **status** — one of the four checks. Sits on a grey panel, because the four
   * of them are a group being scanned, and leads with its label: the verdict
   * has moved to the icon on the right, so what is left on the left is the name
   * of the thing being judged.
   *
   * **fact** — an account number, an IC, a cash balance. No panel: there is
   * nothing to scan and nothing to decide, and giving it the same surface as a
   * check made the grid read as eight equal things when only four of them are
   * the point. The value leads and the label captions it.
   */
  variant?: "status" | "fact";
  /**
   * Pinned to the card's right edge and centred against its full height — the
   * status icon. Separate from `children` so it stays beside the label *and*
   * the value rather than below one of them.
   */
  trailing?: React.ReactNode;
  /** `self-start` where the card must not stretch to its grid row's height. */
  className?: string;
  children: React.ReactNode;
}) {
  return (
    /* The card is a flex container and its row fills it, so `items-center`
       centres against the card rather than against the row's own content.
       Without that, a card whose content is shorter than its grid row-mate's
       keeps its natural height and sits at the top: the risk card's text
       trailing is 20px where the others' icons are 28px, which left it — and
       its label — 4px above where every neighbouring card put theirs. */
    <div
      className={`flex ${
        // A fact has no padding at all. It had the status card's `py-3` back
        // when the two shared a grid row and had to sit level; they no longer
        // do, and with no panel to pad the padding only showed up as 36px of
        // dead space between two rows of plain text. The grid's own row gap is
        // the spacing now.
        variant === "status" ? "rounded-xl bg-[#f3f4f6] px-4 py-3" : ""
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-h-5 items-center">
            {/* Both labels are 12px — the design system's caption size. A
                status label carries its card, so it takes the bold cut and the
                dark ink; a fact label captions a value below it, so it stays
                regular and grey. Size is what the two have in common; weight
                and colour are what tell them apart. */}
            <span
              className={
                variant === "status"
                  ? "type-caption-bold text-foreground"
                  : "type-caption text-muted-foreground"
              }
            >
              {label}
            </span>
          </div>
          {children}
        </div>
        {trailing}
      </div>
    </div>
  );
}

/**
 * One status: label and value on the left, the verdict as a single large icon
 * on the right.
 *
 * The icon carries the state on its own now, which is why the value beside it
 * is plain foreground rather than tinted: one accent per card reads as a
 * verdict, two read as decoration. At this size it is also legible from the
 * far edge of the card, so a grid of four can be checked down its right-hand
 * column without reading a word.
 */
export function StatusField({ item }: { item: RequirementItem }) {
  const chip = STATUS_CHIP[item.status];
  const Icon = chip.icon;

  return (
    <FieldCard
      label={item.label}
      variant="status"
      /* A rating takes the icon's place rather than sitting beside it:
         "Aggressive" already answers the row, and an icon next to it would be a
         second verdict about a value that is its own. The tone does the work
         the icon was doing, so the column still reads green or red straight
         down. Every other row has no rating and gets the icon. */
      trailing={
        item.value ? (
          <span className={`type-body-2 shrink-0 !font-bold ${chip.fg}`}>{item.value}</span>
        ) : (
          <Icon size={28} weight="fill" className={`shrink-0 ${chip.fg}`} />
        )
      }
    >
      {/* Only ever a sentence about something being wrong — a passing card is a
          label and a tick, which is the whole of what it has to say. */}
      {item.detail && (
        <span className="type-caption text-muted-foreground">{item.detail}</span>
      )}
    </FieldCard>
  );
}

/** A quiet blue link, greyed when the thing it opens would do nothing. */
function ActionLink({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="cursor-pointer text-xs leading-4 font-medium text-[#0a6ee7] hover:underline disabled:cursor-default disabled:text-muted-foreground/50 disabled:no-underline"
    >
      {label}
    </button>
  );
}

/**
 * A plain fact — account number, IC, team — on the same grey card.
 *
 * Same surface as a status, no icon and no colour: there is no state to report.
 * These are always present and never block anything, so giving them a tone
 * would spend attention on rows that never need it, and the four that do carry
 * a verdict would stop standing out for carrying one.
 */
export function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldCard label={label}>
      <span className="type-body-2 truncate !font-semibold text-foreground">{value}</span>
    </FieldCard>
  );
}

// ── Amount ───────────────────────────────────────────────────────────────────

/**
 * The amount's own validity, shared by the field and the submit button.
 *
 * `full` — the round has already reached the target — is its own answer rather
 * than a very large `tooBig`. The over-limit test used to read
 * `remaining > 0 && amount > remaining`, which switched itself off at exactly
 * the moment it was needed most: with nothing left to book, every amount
 * passed, and a 100,000 book took another 500,000 under a helper line still
 * reading "ยังจองได้ 0 USD".
 */
/** Anything in the field besides digits and the commas it groups them with. */
const hasNonDigit = (raw: string) => /[^0-9,]/.test(raw);

function amountCheck(
  product: BookableProduct,
  remaining: number,
  raw: string,
): {
  amount: number;
  full: boolean;
  invalid: boolean;
  tooSmall: boolean;
  tooBig: boolean;
  ok: boolean;
} {
  // Not a number at all: the size checks would be measuring whatever digits
  // happened to be in it, so they stand down and this is the one error shown.
  const invalid = hasNonDigit(raw);
  const amount = invalid ? 0 : parseAmount(raw);
  const full = remaining <= 0;
  const tooSmall = amount > 0 && amount < minTicketFor(product);
  const tooBig = !full && amount > remaining;
  return {
    amount,
    full,
    invalid,
    tooSmall,
    tooBig,
    ok: !invalid && amount > 0 && !full && !tooSmall && !tooBig,
  };
}

function AmountSection({
  product,
  client,
  raw,
  onRawChange,
  disabled,
  passed,
  total,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  onRawChange: (next: string) => void;
  /**
   * The checks have not all passed. The section stays on screen, faded, so the
   * IC can see the amount is the next thing and that it is not open yet.
   */
  disabled: boolean;
  /** The same `passed / total` the status heading shows. */
  passed: number;
  total: number;
}) {
  const { data: book } = useOrderBook(product.id);
  const currency = product.currency;
  const minTicket = minTicketFor(product);
  const target = book?.targetAmount ?? 0;
  const sent = book ? !isBookingOpen(book) : false;
  const remaining = sent ? 0 : Math.max(0, target - (book?.bookedAmount ?? 0));

  const cashThb = clientCashThb(client);
  const cashHere = cashInCurrency(cashThb, currency);
  const { amount, full, invalid, tooSmall, tooBig } = amountCheck(product, remaining, raw);
  /**
   * Two different reasons the amount is closed, and they do not stack: a client
   * who is short a document cannot book whatever the round's state, so that
   * message wins and the round's is not also shown.
   */
  const blocked = disabled || full;

  // Cash is a warning here, not a gate: the gate is the funds check every
  // booking goes through afterwards (see `Booking.credit`), which holds the
  // product before sending. Warning now saves the IC finding out from that.
  const overCash = !disabled && amount > 0 && amount > cashHere;

  /**
   * Digits are grouped with commas as they are typed. Anything else is kept
   * exactly as typed rather than dropped — a key that silently did nothing read
   * as a broken field — and the field flags it (see `amountCheck`) until it is
   * fixed. Regrouping a value that is not a number would rewrite what the IC
   * is looking at, so it is left alone.
   */
  const setAmount = (next: string) => {
    if (hasNonDigit(next)) {
      onRawChange(next);
      return;
    }
    const digits = next.replace(/,/g, "");
    onRawChange(digits ? Number(digits).toLocaleString("en-US") : "");
  };

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
      {/* On top of the faded block it explains, and outside it so it stays at
          full strength — the one thing in this section that is not disabled. */}
      {disabled && (
        <Alert
          status="warning"
          message={`ข้อมูลที่ต้องมีก่อนจองซื้อยังไม่ครบ (${passed}/${total}) จึงยังกรอกจำนวนเงินและจองซื้อไม่ได้`}
        />
      )}
      {/* The deal is full, or already sent. Not an error on the amount — there
          is no amount that would be right — so it closes the field the same way
          a missing document does. A product is booked once: nothing reopens it. */}
      {!disabled && full && (
        <Alert
          status="information"
          message={
            !sent
              ? `ครบยอด ${formatOrderAmount(target, currency)} แล้ว — ไม่สามารถจองเพิ่มได้`
              : book && isBookClosed(book)
                ? `ส่งคำสั่งซื้อของ ${product.underlying} แล้ว — สินค้านี้ปิดรับจอง`
                : `คำสั่งซื้อของ ${product.underlying} กำลังดำเนินการที่ระบบหลังบ้าน — ไม่สามารถจองเพิ่มได้`
          }
          multiline
        />
      )}
      {/* Faded and inert, not removed — `inert` takes it out of the tab order
          and the accessibility tree as well as the pointer's reach. */}
      <div
        inert={blocked}
        aria-disabled={blocked}
        className={`flex flex-col gap-3 transition-opacity ${
          blocked ? "pointer-events-none select-none opacity-40" : ""
        }`}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label={`Notional Amount (${currency})`}
            required
            value={raw}
            onChange={setAmount}
            placeholder="Enter Amount"
            inputMode="numeric"
            disabled={blocked}
            forceState={
              blocked ? "disabled" : invalid || tooSmall || tooBig ? "error" : "default"
            }
            errorMessage={
              invalid
                ? "กรอกได้เฉพาะตัวเลข 0–9 เท่านั้น"
                : tooSmall
                  ? `ต่ำกว่าขั้นต่ำ ${formatOrderAmount(minTicket, currency)}`
                  : `เกินยอดที่ยังจองได้ ${formatOrderAmount(remaining, currency)}`
            }
            // The deal's total is deliberately left off: the sentence under this
            // section already names it, and repeating it here is what pushed the
            // helper onto a second line.
            helperText={`ขั้นต่ำ ${formatOrderAmount(minTicket, currency)} · ยังจองได้ ${formatOrderAmount(remaining, currency)}`}
          />
          {/* The number the IC checks the amount against, so it sits beside the
            input — and on a grey card, because it is the system talking back
            rather than somewhere to type. */}
          <FieldCard label="เงินสดคงเหลือของลูกค้า" className="self-start">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="type-body-2 !font-semibold text-foreground">
                ฿ {formatThbAmount(cashThb)}
              </span>
              {currency !== "THB" && (
                <span className="type-caption text-muted-foreground">
                  ≈ {formatOrderAmount(Math.floor(cashHere), currency)} @{" "}
                  {USD_THB}
                </span>
              )}
            </div>
          </FieldCard>
        </div>

        {overCash && (
          <Alert
            status="warning"
            message="จำนวนที่จองมากกว่าเงินสดคงเหลือของลูกค้า — การจองนี้จะไม่ผ่านการตรวจสอบวงเงิน และต้องยกเลิกก่อนส่งคำสั่งซื้อ"
            multiline
          />
        )}

        <p className="type-caption leading-snug text-muted-foreground">
          การจองนี้เป็นคำสั่งซื้อล่วงหน้า
          ยังไม่ส่งเข้าระบบหลังบ้านจนกว่ายอดรวมของดีลจะครบ{" "}
          {formatOrderAmount(target, currency)}
        </p>
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  ready,
  product,
  client,
  raw,
  booking,
  onCancel,
  onBooked,
}: {
  /** Whether all four checks pass — the gate on the amount and the booking. */
  ready: boolean;
  product: BookableProduct;
  client: Client | null;
  raw: string;
  booking: boolean;
  onCancel: () => void;
  onBooked: (amount: number) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const remaining =
    book && !isBookingOpen(book)
      ? 0
      : Math.max(0, (book?.targetAmount ?? 0) - (book?.bookedAmount ?? 0));
  const { amount, ok } = amountCheck(product, remaining, raw);

  // `ready` is checked here as well as on the amount section: a check can
  // expire while the form is open, and the gate has to hold at the moment of
  // booking.
  const canBook = Boolean(client) && ready && ok && !booking;

  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border px-4 py-3 md:px-6">
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant={canBook ? "primary" : "disabled"}
          size="md"
          disabled={!canBook}
          onClick={() => onBooked(amount)}
        >
          {booking ? "กำลังจอง…" : "จองซื้อ"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Stands in while no customer is chosen, so {@link useClientReadiness} can be
 * called unconditionally.
 *
 * Its verdict is never read — the button is already disabled on `client` being
 * null — and it is deliberately a client who would fail every check, so that a
 * future edit that *did* start reading it could not accidentally let a booking
 * through with nobody selected.
 */
const PLACEHOLDER_CLIENT = {
  id: "",
  name: "",
  riskProfile: "",
  aum: 0,
  cashIdlePct: 0,
} as unknown as Client;
