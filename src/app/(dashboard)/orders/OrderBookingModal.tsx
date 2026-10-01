"use client";

/**
 * The booking form: pick the customer, read their four statuses back, enter the
 * notional, book.
 *
 * ## Why the amount is a second step
 *
 * The checks and the amount shared one screen at first, so that an IC on the
 * phone had everything in front of them. Splitting them buys something that
 * reading order could not. On one screen, a client short a document could still
 * be typed an amount for — the form only objected at the very end, with a
 * disabled button under work already done. As a step, the amount is not
 * rejected; it is **unreachable**. The gate stops being a dead button and
 * becomes the shape of the flow.
 *
 * The header (customer, account, IC) rides along on both steps. It is the one
 * thing worth seeing while typing a number, and it is what "ย้อนกลับ" has to
 * leave untouched.
 *
 * There is no step indicator. Two steps, both named by the button that reaches
 * them, is not a journey anyone needs a map of — a rail across the top of a
 * modal this short spends more room on saying where you are than the step
 * itself does.
 *
 * The gate has teeth at both ends: `ถัดไป` is dead until all four pass, and
 * `จองซื้อ` re-checks rather than trusting that it did. A client who is missing
 * something is fixed in the system that owns the record, which is where
 * "ส่งให้ลูกค้าดำเนินการ" sends them — the form has no override.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Input,
  SearchInput,
  type ToastStatus,
} from "@sarunyu/system-one";
import {
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
}: {
  open: boolean;
  product: BookableProduct;
  onClose: () => void;
  /** The host owns the toast stack — a booking closes this, taking its DOM. */
  onNotice: (message: string, status: ToastStatus) => void;
}) {
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
    >
      {/* Remounting per open resets the customer and the amount — a form
          reopened still holding the last client's number is a mis-booking
          waiting to happen. */}
      <BookingForm
        key={open ? "open" : "closed"}
        product={product}
        onClose={onClose}
        onNotice={onNotice}
      />
    </ResponsiveBottomSheetModal>
  );
}

function BookingForm({
  product,
  onClose,
  onNotice,
}: {
  product: BookableProduct;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const clients = useClients();
  const { isPrivate } = usePrivacy();
  const { bookOrder } = useOrders();

  const [clientId, setClientId] = useState<string>("");
  const [raw, setRaw] = useState("");
  const [booking, setBooking] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const client = clients.find((c) => c.id === clientId) ?? null;
  const readiness = useClientReadiness(client ?? PLACEHOLDER_CLIENT, product);
  /** The gate between the two steps — and the one on the booking itself. */
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
              // A different customer is a different check — never land them on
              // step 2 holding the last one's verdict.
              setStep(1);
            }}
          />
        ) : (
          <div className="px-4 md:px-6">
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

            {/* The header above stays on both steps — knowing whose order this
                is matters most while typing the amount, which is the one number
                that cannot be undone by going back. */}
            {step === 1 ? (
              <StatusGrid product={product} client={client} onNotice={onNotice} />
            ) : (
              <AmountSection
                product={product}
                client={client}
                raw={raw}
                onRawChange={setRaw}
              />
            )}
          </div>
        )}
      </div>

      <Footer
        step={step}
        ready={ready}
        onStep={setStep}
        product={product}
        client={client}
        raw={raw}
        booking={booking}
        onCancel={onClose}
        onBooked={async (amount) => {
          if (!client) return;
          setBooking(true);
          await bookOrder({
            productId: product.id,
            clientId: client.id,
            clientName: client.name,
            amount,
          });
          setBooking(false);
          onClose();
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
function FieldCard({
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
function StatusField({ item }: { item: RequirementItem }) {
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
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <FieldCard label={label}>
      <span className="type-body-2 truncate !font-semibold text-foreground">{value}</span>
    </FieldCard>
  );
}

// ── Amount ───────────────────────────────────────────────────────────────────

/** The amount's own validity, shared by the field and the submit button. */
function amountCheck(
  product: BookableProduct,
  remaining: number,
  raw: string,
): { amount: number; tooSmall: boolean; tooBig: boolean; ok: boolean } {
  const amount = parseAmount(raw);
  const tooSmall = amount > 0 && amount < minTicketFor(product);
  const tooBig = remaining > 0 && amount > remaining;
  return { amount, tooSmall, tooBig, ok: amount > 0 && !tooSmall && !tooBig };
}

function AmountSection({
  product,
  client,
  raw,
  onRawChange,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  onRawChange: (next: string) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const currency = product.currency;
  const minTicket = minTicketFor(product);
  const target = book?.targetAmount ?? 0;
  const remaining = Math.max(0, target - (book?.bookedAmount ?? 0));

  const cashThb = clientCashThb(client);
  const cashHere = cashInCurrency(cashThb, currency);
  const { amount, tooSmall, tooBig } = amountCheck(product, remaining, raw);

  // Cash is a warning, not a gate. `cashIdlePct` is idle cash in the portfolio,
  // not the settlement account balance, and a client who intends to wire funds
  // for a ticket is an ordinary case — blocking it would be the portal
  // overruling the IC on a fact it doesn't have.
  const overCash = amount > 0 && amount > cashHere;

  const setAmount = (next: string) => {
    const digits = next.replace(/[^0-9]/g, "");
    onRawChange(digits ? Number(digits).toLocaleString("en-US") : "");
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label={`Notional Amount (${currency})`}
          required
          value={raw}
          onChange={setAmount}
          placeholder="Enter Amount"
          inputMode="numeric"
          forceState={tooSmall || tooBig ? "error" : "default"}
          errorMessage={
            tooSmall
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
                ≈ {formatOrderAmount(Math.floor(cashHere), currency)} @ {USD_THB}
              </span>
            )}
          </div>
        </FieldCard>
      </div>

      {overCash && (
        <Alert
          status="warning"
          message="จำนวนที่จองมากกว่าเงินสดคงเหลือของลูกค้า — ยืนยันแหล่งเงินกับลูกค้าก่อนส่งคำสั่งซื้อ"
          multiline
        />
      )}

      <p className="type-caption leading-snug text-muted-foreground">
        การจองนี้เป็นคำสั่งซื้อล่วงหน้า ยังไม่ส่งเข้าระบบหลังบ้านจนกว่ายอดรวมของดีลจะครบ{" "}
        {formatOrderAmount(target, currency)}
      </p>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

function Footer({
  step,
  ready,
  onStep,
  product,
  client,
  raw,
  booking,
  onCancel,
  onBooked,
}: {
  step: 1 | 2;
  /** Whether all four checks pass — the gate on reaching step 2 at all. */
  ready: boolean;
  onStep: (next: 1 | 2) => void;
  product: BookableProduct;
  client: Client | null;
  raw: string;
  booking: boolean;
  onCancel: () => void;
  onBooked: (amount: number) => void;
}) {
  const { data: book } = useOrderBook(product.id);
  const remaining = Math.max(0, (book?.targetAmount ?? 0) - (book?.bookedAmount ?? 0));
  const { amount, ok } = amountCheck(product, remaining, raw);

  if (step === 1) {
    return (
      <FooterBar>
        <Button variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        {/* The step gate. A client who is missing something cannot reach the
            amount at all — which is stricter than the old single screen, where
            an IC could type a number and only then find the submit dead. The
            disabled label says what is in the way rather than repeating the
            action; a greyed "ถัดไป" is a button that will not say why. */}
        <Button
          variant={ready ? "primary" : "disabled"}
          size="md"
          disabled={!ready}
          onClick={() => onStep(2)}
        >
          {ready ? "ถัดไป" : "ข้อมูลยังไม่ครบ"}
        </Button>
      </FooterBar>
    );
  }

  // `ready` is checked again here, not just on the way in: a request can come
  // back from the store while the IC is on step 2, and an expiry can land
  // between the two steps. The gate has to hold at the moment of booking.
  const canBook = Boolean(client) && ready && ok && !booking;

  return (
    <FooterBar>
      <Button variant="outline" size="md" onClick={() => onStep(1)}>
        ย้อนกลับ
      </Button>
      <Button
        variant={canBook ? "primary" : "disabled"}
        size="md"
        disabled={!canBook}
        onClick={() => onBooked(amount)}
      >
        {booking ? "กำลังจอง…" : "จองซื้อ"}
      </Button>
    </FooterBar>
  );
}

function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 md:px-6">
      {children}
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
