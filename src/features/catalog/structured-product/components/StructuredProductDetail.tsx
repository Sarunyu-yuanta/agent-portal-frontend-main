"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, TabGroup, Toaster, type ToastStatus } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/config/feature-flags";
import { useToasts } from "@/hooks/use-toasts";
import { OrderBookingModal } from "@/features/orders/components/OrderBookingModal";
import { ProductOrderNotice } from "@/features/orders/components/ProductOrderNotice";
import { ProductOrderSection } from "@/features/orders/components/ProductOrderSection";
import { DealProgress } from "@/features/orders/components/DealProgress";
import { ProposalTallyLine } from "@/features/orders/components/ProposalTallyLine";
import { useSendProposal } from "@/features/orders/hooks/use-send-proposal";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import { headlineRound, isBookingOpen } from "@/features/orders/lib/order-book";
import {
  STRUCTURED_TAG,
  type StructuredProduct,
} from "@/features/catalog/structured-product/lib/structured-product-data";
import { ProductDocumentActions } from "@/features/catalog/components/ProductDocumentActions";
import { FCNPresentationModal } from "./FCNPresentationModal";
import { PackageFilesModal } from "@/features/catalog/components/PackageFilesModal";
import { useT } from "@/i18n/I18nProvider";
import type { Dictionary } from "@/i18n/dictionaries/th";
import { formatInteger } from "@/lib/format/number";
import { ORDER_ENTRY_URL } from "@/config/external-links";
import { useUtAutoOpen } from "@/lib/usability-test";

const BORDER_COLOR = "rgba(0,0,0,0.1)";

/** The product card's two views — the terms, and who has been booked into them. */
type ProductTab = "detail" | "orders";

const PRODUCT_TABS: ProductTab[] = ["detail", "orders"];

export type DetailRow = {
  label: string;
  value: string;
  link?: boolean;
  multiline?: string[];
};

function isFull(value: string): boolean {
  const parts = value.split("/").map((s) => Number(s.trim().replace(/,/g, "")));
  return parts.length === 2 && parts[0] === parts[1];
}

function AllocationSummary({
  requestNotionalSize,
  confirmedRequest,
}: {
  requestNotionalSize: string;
  confirmedRequest: string;
}) {
  return (
    <div
      className="grid w-full grid-cols-2 overflow-hidden rounded-md"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      <div
        className="flex flex-col items-center gap-1 bg-neutral-50 px-4 py-3 text-center"
        style={{ borderRight: `1px solid ${BORDER_COLOR}` }}
      >
        <span className="text-xs leading-[20px] font-bold text-neutral-500">
          Request / Notional Size
        </span>
        <span
          className={`text-base leading-[28px] font-semibold ${isFull(requestNotionalSize) ? "text-brand-600" : "text-neutral-900"}`}
        >
          {requestNotionalSize}
        </span>
      </div>
      <div className="flex flex-col items-center gap-1 bg-neutral-50 px-4 py-3 text-center">
        <span className="text-xs leading-[20px] font-bold text-neutral-500">
          Confirmed / Request
        </span>
        <span
          className={`text-base leading-[28px] font-semibold ${isFull(confirmedRequest) ? "text-[#008236]" : "text-neutral-900"}`}
        >
          {confirmedRequest}
        </span>
      </div>
    </div>
  );
}

export function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <div
      className="flex w-full flex-col overflow-hidden rounded-md"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex w-full items-start gap-3 px-4 py-2 text-base leading-[24px] ${
            i % 2 === 0 ? "bg-neutral-50" : "bg-white"
          }`}
        >
          <span className="min-w-0 flex-1 text-neutral-600">{row.label}</span>
          {row.multiline ? (
            <div className="flex min-w-0 flex-1 flex-col items-start gap-3 text-neutral-900">
              {row.multiline.map((line) => (
                <span key={line} className="whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>
          ) : row.link ? (
            <button
              type="button"
              className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-base leading-[24px] text-brand-600 underline"
            >
              {row.value}
            </button>
          ) : (
            <span className="min-w-0 flex-1 text-neutral-900">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * The product's terms as the Detail tab lists them — exported so Order
 * Management's "ดูรายละเอียดสินค้า" modal shows the same rows, not a copy.
 */
export function structuredProductRows(product: StructuredProduct, t: Dictionary): DetailRow[] {
  const labels = t.products.structured.detail;
  return [
    { label: labels.coupon, value: product.coupon },
    { label: labels.offerDate, value: product.offerDate },
    { label: labels.couponPeriod, value: product.couponPeriod },
    { label: labels.tenor, value: product.detailTenor },
    { label: labels.productName, value: product.productName, link: true },
    { label: labels.productType, value: product.productType },
    { label: labels.currency, value: product.currency },
    { label: labels.minInvestment, value: product.minInvestment },
    {
      label: labels.moreInfo,
      value: "",
      multiline: [`KO: ${product.ko}`, `Strike: ${product.strike}`, `KI: ${product.ki}`],
    },
  ];
}

export function StructuredProductDetail({
  product,
  onBack,
}: {
  product: StructuredProduct;
  onBack: () => void;
}) {
  const t = useT();
  const showPrincipalTag =
    product.tags.includes(STRUCTURED_TAG.principalProtected) || product.id === "aapl-amzn-nflx";

  const [fcnModalOpen, setFcnModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tab, setTab] = useState<ProductTab>("detail");
  // The booking just placed here — marked on the Order tab. See `ProductOrderSection`.
  const [newBookingId, setNewBookingId] = useState<string | null>(null);
  const clearNewBooking = useCallback(() => setNewBookingId(null), []);

  // Called unconditionally — the flag picks what renders, not which hooks run.
  const { data: book } = useOrderBook(product.id);
  const canBook = !book || isBookingOpen(book);
  // With booking on, the allocation box reads the live book, round by round,
  // instead of the figures frozen into the product's JSON — those never moved
  // when someone booked, so the box and the Order tab disagreed.
  const round = ORDER_BOOKING_ENABLED && book ? headlineRound(book) : null;

  // The page owns the toast stack rather than the modal: a booking confirms by
  // *closing* the modal, and a toast rendered inside it would leave with it.
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });
  // Shares this page's toast stack rather than standing up a second one.
  const proposal = useSendProposal({ onNotice: notice });
  // USABILITY-TEST ONLY (temporary; revert after testing): `?ut_open=` opens the modal on load.
  useUtAutoOpen("booking", () => setBookingOpen(true), ORDER_BOOKING_ENABLED && canBook);
  useUtAutoOpen("proposal", () => proposal.send(product), ORDER_BOOKING_ENABLED);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [product.id]);

  const detailRows = structuredProductRows(product, t);

  return (
    <div
      className="flex w-full flex-col items-center px-4 pt-6 pb-20 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Header — back + title */}
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
          {product.underlying}
        </h1>
      </div>

      {/* White card */}
      <div
        className="flex w-full max-w-[998px] flex-col items-center gap-14 rounded-xl bg-white px-6 py-8 md:px-10 lg:px-14 lg:py-8"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        {/* Symbol + summary */}
        <div className="flex w-full flex-col gap-4">
          {/* First thing in the card, so the order's state is read before the
              terms of a product that can no longer be booked. */}
          {ORDER_BOOKING_ENABLED && <ProductOrderNotice book={book} />}
          <div className="flex w-full flex-col gap-2">
            <div className="flex w-full items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1">
                {product.logos.map((src, i) => (
                  <div
                    key={i}
                    className="relative size-8 shrink-0 overflow-hidden rounded"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 32px underlying-asset logo, already ~2KB */}
                    <img alt="" className="absolute inset-0 size-full object-cover" src={src} />
                  </div>
                ))}
              </div>
              {showPrincipalTag && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded bg-[#eff6ff] px-2 py-1">
                  <ShieldCheckIcon size={14} weight="fill" color="#2b7fff" className="shrink-0" />
                  <span className="text-xs leading-[20px] whitespace-nowrap text-brand-800">
                    {t.products.structured.tags.principalProtected}
                  </span>
                </span>
              )}
            </div>

            <div className="flex w-full items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="w-full truncate text-base leading-[28px] font-bold text-neutral-900">
                  {product.underlying}
                </p>
                <p className="text-xs leading-[20px] text-neutral-600">Underlying</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <p className="text-2xl leading-8 font-bold whitespace-nowrap text-brand-600">
                  {product.coupon}
                </p>
                <p className="text-xs leading-[20px] font-medium text-neutral-600">Coupon</p>
              </div>
            </div>
          </div>

          {/* Tabs under the symbol and coupon, which stay put: both views are
              about this one deal, and the header is what says which. */}
          {ORDER_BOOKING_ENABLED && (
            <TabGroup
              items={PRODUCT_TABS.map((id) => ({ id, title: t.products.common.detailTabs[id] }))}
              activeId={tab}
              onChange={(id) => setTab(id as ProductTab)}
            />
          )}

          {tab === "detail" ? (
            <div className="flex w-full flex-col items-center gap-3">
              <DetailTable rows={detailRows} />
              <DealProgress productId={product.id} />
              {round && book ? (
                <AllocationSummary
                  requestNotionalSize={`${formatInteger(round.amount)} / ${formatInteger(book.targetAmount)}`}
                  confirmedRequest={`${formatInteger(round.confirmed)} / ${formatInteger(round.amount)}`}
                />
              ) : (
                product.requestNotionalSize != null &&
                product.confirmedRequest != null && (
                  <AllocationSummary
                    requestNotionalSize={product.requestNotionalSize}
                    confirmedRequest={product.confirmedRequest}
                  />
                )
              )}
              <p className="text-center text-xs leading-[20px] whitespace-nowrap text-neutral-500">
                {round
                  ? round.previousRef
                    ? t.products.structured.sentRef(round.previousRef)
                    : t.products.structured.notSentYet
                  : t.products.common.updatedAt(product.updatedAt)}
              </p>
            </div>
          ) : (
            <ProductOrderSection
              newBookingId={newBookingId}
              onNewBookingSeen={clearNewBooking}
              product={product}
              onBook={() => setBookingOpen(true)}
              onNotice={notice}
            />
          )}
        </div>

        {/* CTA — the product's own actions, so only under Detail; the Order
            Management tab carries its own จองซื้อ. */}
        {tab === "detail" && (
          <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full max-w-[343px] flex-col gap-1.5">
              <ProductDocumentActions
                onSendProposal={() => proposal.send(product)}
                onPresentation={() => setFcnModalOpen(true)}
                onPackage={() => setPackageModalOpen(true)}
              />
              {/* How the offers on this product have gone. See the component —
                  the report proper is Performance's job. */}
              <ProposalTallyLine productId={product.id} />
            </div>
            {/* Booking replaces the external hand-off the page used to make.
                With the flag off it goes back to that link, so the catalogue is
                exactly what it was before this feature existed. */}
            {ORDER_BOOKING_ENABLED ? (
              // Gone once the order is sent — the notice above the tabs says why.
              canBook ? (
                <button
                  type="button"
                  // USABILITY-TEST ONLY (temporary; revert after testing): stable id for Useberry triggers.
                  id="booking-open"
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
        product={product}
        open={fcnModalOpen}
        onClose={() => setFcnModalOpen(false)}
      />
      <PackageFilesModal
        product={product}
        open={packageModalOpen}
        onClose={() => setPackageModalOpen(false)}
      />
      {ORDER_BOOKING_ENABLED && (
        <OrderBookingModal
          open={bookingOpen}
          product={product}
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
