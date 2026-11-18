"use client";

/**
 * "สร้าง Order" on Order Management's bookable tabs — Fixed Income, Thai and
 * Global Structured, Global Bond — and on "ทั้งหมด".
 *
 * Until now an order could only start from a product's own page. From Order
 * Management the IC already knows what they want to place, so this opens the
 * same booking modal a product page opens (`OrderBookingModal`) with the
 * desk's products as its first step — lead panes on the modal's own track, so
 * asset → product → client → form all slide inside one modal. Toasts still go
 * through `useQuotaBooking`. Product first, then client — the modal's order.
 *
 * **Two jobs, one button.** A toggle on the first step switches the flow from
 * placing an order to sending a Proposal (the same steps the product pages'
 * send dialog has — clients, then channels). Order is the default, so the
 * common path gains no step. A Proposal can also go out for a stock or a fund,
 * which are offered but never booked, so those two assets appear only then.
 *
 * Stock, TFEX and Mutual Fund tabs have no button: they are not booked through
 * the portal (see `bookable-products`).
 */

import { useMemo, useState } from "react";
import { Button, SearchInput, useIsMobile } from "@sarunyu/system-one";
import { CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { MUTUAL_FUND_CATALOG } from "@/app/(dashboard)/client/[id]/mutual-fund-data";
import {
  STOCK_TOP_GAIN,
  STOCK_TOP_LOSS,
  STOCK_TOP_PICK,
} from "@/app/(dashboard)/client/[id]/stock-data";
import {
  bookableProductsForDesk,
  type BookableProduct,
  type Desk,
} from "./bookable-products";
import { offeredProductId } from "./offered-products";
import { isBookingOpen } from "./order-book";
import { useOrderBooks } from "./use-order-books";
import { BackButton } from "./BackButton";
import { OrderBookingModal } from "./OrderBookingModal";
import type { ProposalSubject } from "./SendProposalDialog";
import { useQuotaBooking } from "./useQuotaBooking";

type Mode = "order" | "proposal";

const MODES: { id: Mode; label: string }[] = [
  { id: "order", label: "ส่งคำสั่งซื้อ" },
  { id: "proposal", label: "ส่ง Proposal" },
];

/** Offered but never booked — listed only when sending a Proposal. */
type OfferedAsset = "Stock" | "Mutual Fund";
type Asset = Desk | OfferedAsset;

/** The bookable desks, in Order Management's tab order — the asset step. */
const DESKS: { asset: Desk; label: string }[] = [
  { asset: "Fixed Income", label: "Fixed Income" },
  { asset: "Thai Structured", label: "Thai Structured Product" },
  { asset: "Global Structured", label: "Global Structured Product" },
  { asset: "Global Bond", label: "Global Bond" },
];

const OFFERED: { asset: OfferedAsset; label: string }[] = [
  { asset: "Stock", label: "Stock" },
  { asset: "Mutual Fund", label: "Mutual Fund" },
];

/** One row of the product step, whatever the asset. */
type PickItem = {
  key: string;
  title: string;
  coupon?: string;
  meta: string;
  /** What a Proposal is sent for. */
  subject: ProposalSubject;
  /** What an order books — bookable desks only. */
  bookable?: BookableProduct;
};

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** The stocks the catalogue shows, once each. Subject as `StockProductDetail` sends it. */
const STOCK_ITEMS: PickItem[] = uniqueBy(
  [...STOCK_TOP_PICK, ...STOCK_TOP_GAIN, ...STOCK_TOP_LOSS],
  (s) => s.symbol,
).map((s) => ({
  key: `stock-${s.symbol}`,
  title: s.symbol,
  meta: s.name,
  subject: {
    id: offeredProductId("stock", s.symbol),
    underlying: s.symbol,
    documents: "บทวิเคราะห์หุ้น",
  },
}));

/** Every fund in the catalogue, once each. Subject as `MutualFundDetail` sends it. */
const FUND_ITEMS: PickItem[] = uniqueBy(
  [
    ...Object.values(MUTUAL_FUND_CATALOG.topPerformers).flatMap((funds) => funds ?? []),
    ...MUTUAL_FUND_CATALOG.themes.flatMap((t) => t.funds),
  ],
  (f) => f.symbol,
).map((f) => ({
  key: `fund-${f.symbol}`,
  title: f.symbol,
  meta: f.name,
  subject: {
    id: offeredProductId("mutual-fund", f.symbol),
    underlying: f.symbol,
    documents: "Fund Fact Sheet",
  },
}));

function bookableItem(p: BookableProduct): PickItem {
  return {
    key: p.id,
    title: p.underlying,
    coupon: p.coupon,
    meta: [p.productType, p.currency, p.minInvestment && `ขั้นต่ำ ${p.minInvestment}`]
      .filter(Boolean)
      .join(" · "),
    subject: p,
    bookable: p,
  };
}

/**
 * @param desk The desk this tab is — the picker opens on its products. Left
 *   out on "ทั้งหมด", where there is no desk yet: the dialog asks for the asset
 *   first, and the product list gets a back arrow to it.
 * @param clientId Book for this client only — from the client's profile. The
 *   booking modal skips its client list; a Proposal starts with them ticked.
 */
export function CreateOrderButton({ desk, clientId }: { desk?: Desk; clientId?: string }) {
  const booking = useQuotaBooking();
  const [picking, setPicking] = useState(false);
  const [mode, setMode] = useState<Mode>("order");
  const [search, setSearch] = useState("");
  /** The asset chosen in the dialog, when the tab did not fix one. */
  const [chosenAsset, setChosenAsset] = useState<Asset | null>(null);
  const activeAsset: Asset | null = desk ?? chosenAsset;
  /**
   * The asset the product pane is about, which lags `chosenAsset` on the way
   * back: both panes stay mounted to slide, and clearing it with the selection
   * would empty the product list while it is still sliding out. Set together
   * with `chosenAsset` going forward; never cleared on Back.
   */
  const [shownAsset, setShownAsset] = useState<Asset | null>(null);
  const listAsset: Asset | null = desk ?? shownAsset;
  /** The product chosen to book — which moves the flow on to the client list. */
  const [product, setProduct] = useState<BookableProduct | null>(null);
  /** The product the client panes are about; lags `product` on Back the same
   *  way `shownAsset` lags `chosenAsset`. */
  const [shownProduct, setShownProduct] = useState<BookableProduct | null>(null);
  /** The same pair for a Proposal. */
  const [subject, setSubject] = useState<ProposalSubject | null>(null);
  const [shownSubject, setShownSubject] = useState<ProposalSubject | null>(null);
  const isMobile = useIsMobile();
  const { data: books } = useOrderBooks();
  /**
   * Only what can still be booked. A product that is full, or whose order has
   * gone, is not something to start an order on — it was listed greyed out at
   * first, and the IC had to scroll past the dead ones to find the live.
   *
   * A product with no book yet has had nothing booked on it, so it is open.
   */
  const closed = useMemo(
    () => new Set(books.filter((b) => !isBookingOpen(b)).map((b) => b.productId)),
    [books],
  );
  const itemsFor = (a: Asset): PickItem[] =>
    a === "Stock"
      ? STOCK_ITEMS
      : a === "Mutual Fund"
        ? FUND_ITEMS
        : bookableProductsForDesk(a)
            .filter((p) => !closed.has(p.id))
            .map(bookableItem);
  const items = listAsset ? itemsFor(listAsset) : [];

  const query = search.trim().toLowerCase();
  const shown = query
    ? items.filter((item) =>
        [item.title, item.coupon, item.meta].some((text) =>
          (text ?? "").toLowerCase().includes(query),
        ),
      )
    : items;

  if (!ORDER_BOOKING_ENABLED) return null;

  const close = () => {
    setPicking(false);
    setMode("order");
    setSearch("");
    setChosenAsset(null);
    setShownAsset(null);
    setProduct(null);
    setShownProduct(null);
    setSubject(null);
    setShownSubject(null);
  };

  const backToAssets = () => {
    setChosenAsset(null);
    setSearch("");
  };

  /** A different job is a different flow — start it from its first step. */
  const switchMode = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    setSearch("");
    setChosenAsset(null);
    setProduct(null);
    setSubject(null);
  };

  const assets = mode === "order" ? DESKS : [...DESKS, ...OFFERED];
  const assetLabel = (a: Asset) =>
    [...DESKS, ...OFFERED].find((x) => x.asset === a)?.label ?? a;

  /** Order or Proposal — the same pill toggle as the evidence step's. */
  const modeToggle = (
    <div
      role="group"
      aria-label="ประเภทรายการ"
      className="flex gap-1 rounded-lg bg-[var(--bg-default-secondary)] p-1"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          aria-pressed={mode === m.id}
          onClick={() => switchMode(m.id)}
          className={`flex-1 cursor-pointer rounded-md px-3 py-1.5 text-body-sm font-semibold transition-colors ${
            mode === m.id
              ? "bg-white text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );

  const assetPane = (
    <div className="flex flex-col gap-3 px-4 pb-4 pt-3 md:px-6">
      {modeToggle}
      <p className="pt-1 text-label font-semibold text-muted-foreground">เลือกสินทรัพย์</p>
      <div className="flex flex-col gap-2">
        {assets.map(({ asset: a, label }) => {
          const count = itemsFor(a).length;
          const unit = mode === "order" ? "เปิดรับ" : "มี";
          return (
            <button
              key={a}
              type="button"
              disabled={count === 0}
              onClick={() => {
                setShownAsset(a);
                setChosenAsset(a);
              }}
              className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                count > 0
                  ? "cursor-pointer border-border/60 hover:border-border hover:bg-muted/40"
                  : "cursor-not-allowed border-border/40 opacity-60"
              }`}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-foreground">{label}</span>
                <span className="text-label text-muted-foreground">
                  {count > 0 ? `${unit} ${count} รายการ` : "ไม่มีสินค้าที่เปิดรับ"}
                </span>
              </span>
              <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );

  const productPane = (
    <div className="flex flex-col pb-4">
      {/* Pinned to the modal's scroller, as the client list's search is — the
          list can run for screens and narrowing it is the reason to scroll up. */}
      <div className="sticky top-0 z-10 flex flex-col gap-3 bg-white px-4 pb-2 pt-3 md:px-6">
        {/* On a desk tab this is the first step, so the toggle is here. */}
        {desk && modeToggle}
        {/* A phone's sheet has no arrow in its title row. */}
        {isMobile && !desk && (
          <div>
            <BackButton label="ย้อนกลับ" onClick={backToAssets} />
          </div>
        )}
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="ค้นหาสินค้า"
          size="sm"
          className="w-full"
        />
        <p className="text-label font-semibold text-muted-foreground">
          เลือกสินค้า ({shown.length})
        </p>
      </div>
      <div className="flex flex-col gap-2 px-4 pt-1 md:px-6">
        {shown.length === 0 ? (
          <p className="py-8 text-center text-body-sm text-muted-foreground">
            {query ? "ไม่พบสินค้าที่ค้นหา" : "ไม่มีสินค้าที่เปิดรับอยู่ตอนนี้"}
          </p>
        ) : (
          shown.map((item) => (
            <ProductRow
              key={item.key}
              item={item}
              onPick={() => {
                // Together, so the next pane is about this product before it
                // starts sliding in. The search and the asset are kept, so Back
                // lands on the same list.
                if (mode === "proposal") {
                  setShownSubject(item.subject);
                  setSubject(item.subject);
                } else if (item.bookable) {
                  setShownProduct(item.bookable);
                  setProduct(item.bookable);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );

  const picked = mode === "order" ? product : subject;
  const baseTitle = mode === "order" ? "สร้าง Order" : "ส่ง Proposal";

  return (
    <>
      <Button
        variant="primary"
        size="lg"
        className="shrink-0"
        // Inline, as on the transaction tabs' filter button: the library's
        // fixed height is unlayered and beats a class, and the button has to
        // stand as tall as the search beside it.
        style={{ height: "auto" }}
        leftIcon={<PlusIcon size={16} weight="bold" />}
        onClick={() => setPicking(true)}
      >
        สร้าง Order
      </Button>

      {/* One modal for the whole flow — asset, product, then either the
          booking (client, form, summary) or the Proposal (clients, channels) —
          so each step slides on from the last. */}
      <OrderBookingModal
        open={picking}
        mode={mode}
        product={shownProduct}
        subject={shownSubject}
        lead={{
          panes: desk ? [productPane] : [assetPane, productPane],
          index: picked ? null : desk ? 0 : chosenAsset ? 1 : 0,
          title: activeAsset ? `${baseTitle} · ${assetLabel(activeAsset)}` : baseTitle,
          // Back to the asset step — only where this flow asked for one.
          onBack: !desk && chosenAsset ? backToAssets : undefined,
        }}
        fixedClientId={clientId}
        // From the client list (or a fixed client's form) back to the products.
        onBack={() => (mode === "order" ? setProduct(null) : setSubject(null))}
        onClose={close}
        onNotice={booking.notice}
        onBooked={booking.markBooked}
      />

      {booking.ui}
    </>
  );
}

/** One product to pick — every row here is still open. */
function ProductRow({ item, onPick }: { item: PickItem; onPick: () => void }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-muted/40"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-sm font-semibold text-foreground">
          {item.title}
          {item.coupon && (
            <span className="ml-1.5 font-semibold text-primary-action">{item.coupon}</span>
          )}
        </span>
        {item.meta && <span className="truncate text-label text-muted-foreground">{item.meta}</span>}
      </span>
      <CaretRightIcon size={14} className="shrink-0 text-muted-foreground" />
    </button>
  );
}
