"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, TabGroup, Toaster, type ToastStatus } from "@sarunyu/system-one";
import { ArrowLeftIcon, ArrowSquareOutIcon, UserPlusIcon } from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { useToasts } from "@/hooks/use-toasts";
import { OrderBookingModal } from "@/features/orders/components/OrderBookingModal";
import { ProductOrderNotice } from "@/features/orders/components/ProductOrderNotice";
import { ProductOrderSection } from "@/features/orders/components/ProductOrderSection";
import { DealProgress } from "@/features/orders/components/DealProgress";
import { ProposalTallyLine } from "@/features/orders/components/ProposalTallyLine";
import { useSendProposal } from "@/features/orders/hooks/use-send-proposal";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { isBookingOpen } from "@/features/orders/lib/order-book";
import {
  toBookableProduct,
  type ThaiStructuredProduct,
} from "@/features/catalog/structured-product/lib/thai-structured-data";
import { ProductDocumentActions } from "@/features/catalog/components/ProductDocumentActions";
import { FCNPresentationModal } from "./FCNPresentationModal";
import { PackageFilesModal } from "@/features/catalog/components/PackageFilesModal";
import { useT } from "@/i18n/I18nProvider";
import { ORDER_ENTRY_URL } from "@/config/external-links";

const BORDER_COLOR = "rgba(0,0,0,0.1)";

function DetailTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-md"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="flex w-full items-center gap-3 px-4 py-2 text-sm leading-[24px]"
          style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "white" }}
        >
          <span className="flex-1 text-neutral-600">{row.label}</span>
          <span className="flex-1 text-right font-medium text-neutral-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** The theme's terms as the Detail tab lists them — shared with Order Management's modal. */
export function thaiProductRows(
  product: ThaiStructuredProduct,
): { label: string; value: string }[] {
  return [
    { label: "Investment Theme", value: product.theme },
    { label: "Product", value: product.product },
    { label: "Currency", value: product.ccy },
    { label: "BBG Code 1", value: product.bbg1 },
    { label: "BBG Code 2", value: product.bbg2 },
    { label: "BBG Code 3", value: product.bbg3 },
    { label: "Coupon p.a. (%)", value: product.couponPa },
    { label: "KO Type", value: product.koType },
    { label: "KO Barrier (%)", value: product.koBarrier },
    { label: "Strike (%)", value: product.strike },
    { label: "KI Barrier", value: product.kiBarrier },
    { label: "Tenor (months)", value: String(product.tenor) },
  ];
}

export function ThaiStructuredProductDetail({
  product,
  onBack,
}: {
  product: ThaiStructuredProduct;
  onBack: () => void;
}) {
  const t = useT();
  const [fcnModalOpen, setFcnModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tab, setTab] = useState<"detail" | "orders">("detail");
  // The booking just placed here — marked on the Order tab. See `ProductOrderSection`.
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  const clearNewBooking = useCallback(() => setNewBookingId(null), []);

  // The page owns the toast stack, not the modal: a booking confirms by
  // *closing* the modal, and a toast rendered inside it would leave with it.
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });
  // Shares this page's toast stack rather than standing up a second one.
  const proposal = useSendProposal({ onNotice: notice });

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, [product.theme]);

  const underlying = [product.bbg1, product.bbg2, product.bbg3].filter(Boolean).join(" - ");
  // Memoised because it is a fresh object every call and feeds a hook's
  // dependency list — recomputing it each render would re-run the readiness
  // derivation behind the booking modal on every keystroke in its search box.
  const adapted = useMemo(() => toBookableProduct(product, t), [product, t]);
  const { data: book } = useOrderBook(adapted.id);
  const canBook = !book || isBookingOpen(book);

  const rows = thaiProductRows(product);

  return (
    <div
      className="flex w-full flex-col items-center px-4 pt-6 pb-20 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Header */}
      <div className="flex h-[46px] w-full max-w-[998px] items-center gap-2 py-2">
        <Button
          variant="plain"
          size="icon-sm"
          onClick={onBack}
          aria-label={t.products.common.back}
          className="shrink-0"
        >
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="min-w-0 flex-1 truncate text-lg leading-[30px] font-bold text-neutral-900">
          {underlying}
        </h1>
      </div>

      {/* Card */}
      <div
        className="flex w-full max-w-[998px] flex-col gap-14 rounded-xl bg-white px-6 py-8 md:px-10 lg:px-14"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        {/* Summary */}
        <div className="flex flex-col gap-4">
          {/* First thing in the card, so the order's state is read before the
              terms of a product that can no longer be booked. */}
          {ORDER_BOOKING_ENABLED && <ProductOrderNotice book={book} />}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-base leading-[28px] font-bold text-neutral-900">{underlying}</p>
              <p className="text-xs leading-[20px] text-neutral-600">Underlying</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <p className="text-2xl leading-8 font-bold whitespace-nowrap text-brand-600">
                {product.couponPa}
              </p>
              <p className="text-xs leading-[20px] font-medium text-neutral-600">Coupon p.a.</p>
            </div>
          </div>

          {/* Same two views as the global desk's detail page. */}
          {ORDER_BOOKING_ENABLED && (
            <TabGroup
              items={[
                { id: "detail", title: t.products.common.detailTabs.detail },
                { id: "orders", title: t.products.common.detailTabs.orders },
              ]}
              activeId={tab}
              onChange={(id) => setTab(id as "detail" | "orders")}
            />
          )}

          {tab === "detail" ? (
            <div className="flex w-full flex-col gap-3">
              <DetailTable rows={rows} />
              <DealProgress productId={adapted.id} />
            </div>
          ) : (
            <ProductOrderSection
              newBookingId={newBookingId}
              onNewBookingSeen={clearNewBooking}
              product={adapted}
              onBook={() => setBookingOpen(true)}
              onNotice={notice}
            />
          )}
        </div>

        {/* CTA — only under Detail; the Order tab carries its own จองซื้อ. */}
        {tab === "detail" && (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full max-w-[343px] flex-col gap-1.5">
              <ProductDocumentActions
                onSendProposal={() => proposal.send(adapted)}
                onPresentation={() => setFcnModalOpen(true)}
                onPackage={() => setPackageModalOpen(true)}
              />
              {/* How the offers on this product have gone. See the component —
                the report proper is Performance's job. */}
              <ProposalTallyLine productId={adapted.id} />
            </div>

            {/* Same swap as the global desk's detail page: booking replaces the
              external hand-off, and the flag puts the old link back. */}
            {ORDER_BOOKING_ENABLED ? (
              // Gone once the order is sent — the notice above the tabs says why.
              canBook ? (
                <button
                  type="button"
                  onClick={() => setBookingOpen(true)}
                  className="flex h-12 w-full max-w-[343px] cursor-pointer items-center justify-center gap-2 rounded-xl border bg-transparent px-4 text-sm font-medium transition-opacity hover:opacity-90"
                  style={{ borderColor: "#0a6ee7", color: "#0a6ee7" }}
                >
                  <UserPlusIcon size={16} />
                  <span>{t.products.common.bookForClient}</span>
                </button>
              ) : null
            ) : (
              <a
                href={ORDER_ENTRY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-12 w-full max-w-[343px] cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-opacity hover:opacity-90"
                style={{ borderColor: "#0a6ee7", color: "#0a6ee7" }}
              >
                <span>{t.products.common.createOrder}</span>
                <ArrowSquareOutIcon size={16} />
              </a>
            )}
          </div>
        )}
      </div>

      <FCNPresentationModal
        product={adapted}
        open={fcnModalOpen}
        onClose={() => setFcnModalOpen(false)}
      />
      <PackageFilesModal
        product={adapted}
        open={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
      />
      {ORDER_BOOKING_ENABLED && (
        <OrderBookingModal
          open={bookingOpen}
          product={adapted}
          onClose={() => setBookingOpen(false)}
          onNotice={notice}
          // Straight to the Order tab with the new row marked, so the IC sees
          // where the booking went rather than staying on Detail.
          onBooked={(booking) => {
            setNewBookingId(booking.id);
            setTab("orders");
          }}
        />
      )}
      {proposal.ui}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
