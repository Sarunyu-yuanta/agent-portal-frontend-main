"use client";

/**
 * Putting a product in front of clients — the first step of the flow.
 *
 * Multi-select, where the booking form takes one client at a time, because
 * these two actions are not the same shape: a booking is one client's amount
 * against one set of checks, while an offer is the same message to everyone
 * the IC thinks might want it.
 *
 * **Readiness is not a gate here.** A client missing a KYC can still be asked
 * whether they are interested — finding out they are is what makes chasing the
 * document worth doing. The row says what is missing so the IC knows what will
 * have to happen before the booking, and the booking form holds that line.
 */

import { useMemo, useState } from "react";
import { Avatar, Button, SearchInput, type ToastStatus } from "@sarunyu/system-one";
import { CheckIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { useClients } from "@/hooks/use-api";
import { getClientProfile } from "@/data/client-profiles";
import { getInitial } from "@/lib/client-utils";
import { maskName } from "@/lib/mask-name";
import type { OrderBook } from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import { useRosterReadiness } from "./use-order-books";

export function SendOfferModal({
  open,
  product,
  book,
  onClose,
  onNotice,
}: {
  open: boolean;
  product: BookableProduct;
  /** Who already has an offer or a booking on this product — see `taken`. */
  book: OrderBook;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={open}
      onClose={onClose}
      title={`ส่ง Offer ${product.underlying} ${product.coupon}`}
      titleId="send-offer-title"
      desktopMaxWidth="max-w-[520px]"
    >
      {/* Remounted per open so the selection and the search do not survive a
          close — the same reason the booking form remounts. */}
      {open && (
        <Body
          key={product.id}
          product={product}
          book={book}
          onClose={onClose}
          onNotice={onNotice}
        />
      )}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  product,
  book,
  onClose,
  onNotice,
}: {
  product: BookableProduct;
  book: OrderBook;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const clients = useClients();
  const readiness = useRosterReadiness(clients, product);
  const { isPrivate } = usePrivacy();
  const { sendOffers } = useOrders();
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  /**
   * Clients this product has already been put to, one way or the other.
   *
   * Offered and still waiting, offered and declined, or booked — all three are
   * answered or in flight, and a second offer would be the IC asking a question
   * they have already asked.
   */
  const taken = useMemo(
    () =>
      new Set([
        ...book.offers.map((o) => o.clientId),
        ...book.allBookings.map((b) => b.clientId),
      ]),
    [book],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients
      .filter((c) => !taken.has(c.id))
      .filter((c) => {
        if (!query) return true;
        const profile = getClientProfile(c.id);
        return (
          maskName(c.name, isPrivate).toLowerCase().includes(query) ||
          maskName(profile.nameTh, isPrivate).includes(query) ||
          c.id.includes(query) ||
          profile.accountNo.includes(query)
        );
      });
  }, [clients, taken, search, isPrivate]);

  const send = async () => {
    setSending(true);
    const chosen = clients
      .filter((c) => picked.includes(c.id))
      .map((c) => ({ id: c.id, name: c.name }));
    await sendOffers(product.id, chosen);
    setSending(false);
    onClose();
    onNotice(`ส่ง Offer ให้ลูกค้า ${chosen.length} ราย แล้ว`, "success");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-4 pb-3 pt-1 md:px-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          onClear={() => setSearch("")}
          placeholder="ค้นหาชื่อหรือรหัสลูกค้า"
          className="w-full"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 md:px-6">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            {search ? "ไม่พบลูกค้าที่ค้นหา" : "ลูกค้าทุกรายได้รับ Offer หรือจองสินค้านี้แล้ว"}
          </p>
        ) : (
          <div className="flex flex-col">
            {rows.map((c) => {
              const profile = getClientProfile(c.id);
              const name = maskName(c.name, isPrivate);
              const state = readiness.get(c.id);
              const missing = state?.items.filter((i) => i.status !== "passed").length ?? 0;
              const selected = picked.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    setPicked((prev) =>
                      prev.includes(c.id) ? prev.filter((id) => id !== c.id) : [...prev, c.id],
                    )
                  }
                  aria-pressed={selected}
                  className="-mx-2 flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[var(--fill-gray-100)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0a6ee7]"
                >
                  <Avatar type="text" initials={getInitial(name)} size="s" />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[13px] font-semibold text-foreground">
                      {name}
                    </span>
                    <span className="truncate text-[12px] text-muted-foreground">
                      {c.id} · บัญชี {profile.accountNo}
                      {/* Said, not enforced — see the module note. */}
                      {missing > 0 && ` · ยังขาดข้อมูล ${missing} รายการ`}
                    </span>
                  </span>
                  {/* The tick is the whole selected state: a checkbox beside an
                      avatar and two lines of text made a third column out of
                      one bit of information. */}
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      selected
                        ? "border-transparent bg-[var(--fill-blue-500)] text-white"
                        : "border-[var(--border-default)] text-transparent"
                    }`}
                  >
                    <CheckIcon size={14} weight="bold" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-4 py-3 md:px-6">
        <Button variant="outline" size="md" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={picked.length > 0 && !sending ? "primary" : "disabled"}
          size="md"
          disabled={picked.length === 0 || sending}
          onClick={send}
        >
          {sending ? "กำลังส่ง…" : `ส่ง Offer (${picked.length})`}
        </Button>
      </div>
    </div>
  );
}
