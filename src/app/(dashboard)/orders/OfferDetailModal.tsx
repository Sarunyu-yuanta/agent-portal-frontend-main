"use client";

/**
 * One offer, opened from its row — the step before a booking exists.
 *
 * Same receipt as `BookingDetailModal` (`detail-sheet-ui`), with less on it,
 * because that is honestly all an offer is: who it went to, when, and that
 * nobody has answered. No amount, no payment, no email — those start at the
 * booking.
 *
 * The one action is the answer the IC may have been given out of band: the
 * client said no. Nothing here books for them; จองซื้อ is its own flow, with
 * its own checks and its own amount field.
 */

import { useState } from "react";
import { ClockIcon, XIcon } from "@phosphor-icons/react";
import { Button, type ToastStatus } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { getClientProfile } from "@/data/client-profiles";
import { maskName } from "@/lib/mask-name";
import type { ProductOffer } from "@/types/domain";
import type { BookableProduct } from "./bookable-products";
import {
  ClientRow,
  SHEET_PANEL,
  SheetBlock,
  SheetRow,
  StatusDisc,
  TONE,
} from "./detail-sheet-ui";
import { formatLogTime } from "./order-book";

export function OfferDetailModal({
  offer,
  product,
  onClose,
  onNotice,
}: {
  /** `null` keeps the modal closed — it stays mounted so it can animate out. */
  offer: ProductOffer | null;
  product: BookableProduct;
  onClose: () => void;
  /** The page owns the toast stack — declining closes this, taking its DOM. */
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={offer !== null}
      onClose={onClose}
      title={`รายละเอียด Offer ${product.underlying} ${product.coupon}`}
      titleId="offer-detail-title"
      desktopTitleHidden
      desktopMaxWidth="max-w-[460px]"
    >
      {offer && (
        <Body offer={offer} product={product} onClose={onClose} onNotice={onNotice} />
      )}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  offer,
  product,
  onClose,
  onNotice,
}: {
  offer: ProductOffer;
  product: BookableProduct;
  onClose: () => void;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const { isPrivate } = usePrivacy();
  const { declineOffer } = useOrders();
  const [declining, setDeclining] = useState(false);

  const profile = getClientProfile(offer.clientId);
  const name = maskName(offer.clientName, isPrivate);
  const declined = offer.status === "declined";
  const variant = declined ? "gray" : "blue";

  const decline = async () => {
    setDeclining(true);
    await declineOffer(offer.id);
    setDeclining(false);
    onClose();
    onNotice(`บันทึกว่า ${name} ปฏิเสธ Offer นี้แล้ว`, "information");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
          <StatusDisc variant={variant}>
            {declined ? <XIcon size={30} weight="bold" /> : <ClockIcon size={30} weight="fill" />}
          </StatusDisc>
          <p className={`pt-3 text-[20px] leading-7 font-bold ${TONE[variant].text}`}>
            {declined ? "ลูกค้าปฏิเสธ" : "รอลูกค้าตอบรับ"}
          </p>
          {/* `pt-4`, not the 6px it had: the heading is 20px bold and the line
              under it is 16px, and at six pixels apart the two read as one
              run-on phrase rather than a verdict and the thing it is about. */}
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
            <span className="shrink-0 rounded-full bg-[var(--fill-blue-100)] px-2 py-0.5 text-[11px] font-semibold text-[var(--fill-blue-700)]">
              Offer
            </span>
            <span className="text-[16px] leading-6 font-bold text-foreground">
              {product.underlying}
            </span>
            <span className="min-w-0 truncate text-[12px] text-muted-foreground">
              {product.coupon}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-2 md:px-6">
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title="รายละเอียด Offer">
              <ClientRow clientId={offer.clientId} name={name} />
              <SheetRow label="Full Name (TH)" value={maskName(profile.nameTh, isPrivate)} />
              <SheetRow label="Account No" value={profile.accountNo} />
              <SheetRow label="IC Name" value={offer.sentBy} />
              <SheetRow label="ส่งเมื่อ" value={formatLogTime(offer.sentAt)} />
            </SheetBlock>
          </div>

          {/* Only while it is still open. A declined offer has had its answer,
              and the sheet is then a record rather than something to work. */}
          {!declined && (
            <div className="flex justify-center pt-1">
              <Button
                variant={declining ? "disabled" : "plain"}
                size="md"
                disabled={declining}
                onClick={decline}
                className="text-[var(--fill-red-600)]"
              >
                {declining ? "กำลังบันทึก…" : "ลูกค้าปฏิเสธ Offer นี้"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
