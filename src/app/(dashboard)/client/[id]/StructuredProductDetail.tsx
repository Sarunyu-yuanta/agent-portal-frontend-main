"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, LinearProgress, Toaster, type ToastStatus } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  CaretRightIcon,
  EyeIcon,
  FilePdfIcon,
  PackageIcon,
  ShieldCheckIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { useToasts } from "@/hooks/use-toasts";
import { OrderBookingModal } from "@/app/(dashboard)/orders/OrderBookingModal";
import { useOrderBook } from "@/app/(dashboard)/orders/use-order-books";
import {
  bookProgressPct,
  formatOrderAmount,
} from "@/app/(dashboard)/orders/order-book";
import type { StructuredProduct } from "./structured-product-data";
import { FCNPresentationModal } from "./FCNPresentationModal";
import { PackageFilesModal } from "./PackageFilesModal";

const BORDER_COLOR = "rgba(0,0,0,0.1)";

type DetailRow = {
  label: string;
  value: string;
  link?: boolean;
  multiline?: string[];
};

function isFull(value: string): boolean {
  const parts = value.split("/").map((s) => Number(s.trim().replace(/,/g, "")));
  return parts.length === 2 && parts[0] === parts[1];
}

function AllocationSummary({ requestNotionalSize, confirmedRequest }: { requestNotionalSize: string; confirmedRequest: string }) {
  return (
    <div
      className="grid grid-cols-2 w-full rounded-md overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      <div className="flex flex-col gap-1 px-4 py-3 bg-[#f9fafb] items-center text-center" style={{ borderRight: `1px solid ${BORDER_COLOR}` }}>
        <span className="text-xs leading-4 font-bold text-[#6a7282]">Request / Notional Size</span>
        <span className={`text-base leading-6 font-semibold ${isFull(requestNotionalSize) ? "text-[#0a6ee7]" : "text-[#101828]"}`}>{requestNotionalSize}</span>
      </div>
      <div className="flex flex-col gap-1 px-4 py-3 bg-[#f9fafb] items-center text-center">
        <span className="text-xs leading-4 font-bold text-[#6a7282]">Confirmed / Request</span>
        <span className={`text-base leading-6 font-semibold ${isFull(confirmedRequest) ? "text-[#008236]" : "text-[#101828]"}`}>{confirmedRequest}</span>
      </div>
    </div>
  );
}

function DetailTable({ rows }: { rows: DetailRow[] }) {
  return (
    <div
      className="flex flex-col w-full rounded-md overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex gap-3 items-start px-4 py-2 w-full text-base leading-5 ${
            i % 2 === 0 ? "bg-[#f9fafb]" : "bg-white"
          }`}
        >
          <span className="flex-1 min-w-0 text-[#4a5565]">{row.label}</span>
          {row.multiline ? (
            <div className="flex flex-1 min-w-0 flex-col gap-3 items-start text-[#101828]">
              {row.multiline.map((line) => (
                <span key={line} className="whitespace-nowrap">
                  {line}
                </span>
              ))}
            </div>
          ) : row.link ? (
            <button
              type="button"
              className="flex-1 min-w-0 text-left text-[#0a6ee7] underline border-none bg-transparent p-0 cursor-pointer text-base leading-5"
            >
              {row.value}
            </button>
          ) : (
            <span className="flex-1 min-w-0 text-[#101828]">{row.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

export function StructuredProductDetail({
  product,
  onBack,
}: {
  product: StructuredProduct;
  onBack: () => void;
}) {
  const showPrincipalTag =
    product.tags.includes("รับประกันเงินต้น") || product.id === "aapl-amzn-nflx";

  const [fcnModalOpen, setFcnModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  // The page owns the toast stack rather than the modal: a booking confirms by
  // *closing* the modal, and a toast rendered inside it would leave with it.
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  // Called unconditionally — the flag picks what renders, not which hooks run.
  const { data: book } = useOrderBook(product.id);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.scrollTop = 0;
    } else {
      window.scrollTo(0, 0);
    }
  }, [product.id]);

  const detailRows: DetailRow[] = [
    { label: "อัตราดอกเบี้ย (Coupon)", value: product.coupon },
    { label: "วันเสนอขาย", value: product.offerDate },
    { label: "งวดดอกเบี้ย", value: product.couponPeriod },
    { label: "ระยะเวลาการลงทุน (Tenor)", value: product.detailTenor },
    { label: "ผลิตภัณฑ์", value: product.productName, link: true },
    { label: "ประเภท", value: product.productType },
    { label: "สกุลเงินลงทุน", value: product.currency },
    { label: "ลงทุนขั้นต่ำ", value: product.minInvestment },
    {
      label: "ข้อมูลเพิ่มเติม",
      value: "",
      multiline: [
        `KO: ${product.ko}`,
        `Strike: ${product.strike}`,
        `KI: ${product.ki}`,
      ],
    },
  ];

  return (
    <div
      className="flex flex-col items-center w-full pt-6 pb-20 px-4 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Header — back + title */}
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[998px]">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[26px] text-[#101828] truncate">
          {product.underlying}
        </h1>
      </div>

      {/* White card */}
      <div
        className="flex flex-col gap-14 items-center w-full max-w-[998px] px-6 py-8 md:px-10 lg:px-14 lg:py-8 rounded-xl bg-white"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        {/* Symbol + summary */}
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-2 w-full">
            <div className="flex gap-2 items-center w-full">
              <div className="flex flex-1 min-w-0 gap-1 items-center">
                {product.logos.map((src, i) => (
                  <div
                    key={i}
                    className="relative shrink-0 size-8 rounded overflow-hidden"
                    style={{ border: "1px solid rgba(0,0,0,0.08)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 32px underlying-asset logo, already ~2KB */}
                    <img alt="" className="absolute inset-0 size-full object-cover" src={src} />
                  </div>
                ))}
              </div>
              {showPrincipalTag && (
                <span className="inline-flex items-center gap-0.5 shrink-0 rounded px-2 py-1 bg-[#eff6ff]">
                  <ShieldCheckIcon size={14} weight="fill" color="#2b7fff" className="shrink-0" />
                  <span className="text-xs leading-4 text-[#074ea4] whitespace-nowrap">
                    รับประกันเงินต้น
                  </span>
                </span>
              )}
            </div>

            <div className="flex gap-2 items-center w-full">
              <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                <p className="text-base font-bold leading-6 text-[#101828] truncate w-full">
                  {product.underlying}
                </p>
                <p className="text-xs leading-4 text-[#4a5565]">Underlying</p>
              </div>
              <div className="flex flex-col gap-0.5 items-end shrink-0">
                <p className="text-2xl font-bold leading-8 text-[#0a6ee7] whitespace-nowrap">
                  {product.coupon}
                </p>
                <p className="text-xs leading-4 font-medium text-[#4a5565]">Coupon</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-center w-full">
            <DetailTable rows={detailRows} />
            {product.requestNotionalSize != null && product.confirmedRequest != null && (
              <AllocationSummary
                requestNotionalSize={product.requestNotionalSize}
                confirmedRequest={product.confirmedRequest}
              />
            )}
            <p className="text-xs leading-4 text-[#6a7282] text-center whitespace-nowrap">
              อัปเดตล่าสุด {product.updatedAt}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 items-center w-full">
          <div className="relative w-full max-w-[343px]">
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex w-full items-center h-12 px-4 font-medium text-sm text-white rounded-xl cursor-pointer transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0a6ee7" }}
            >
              <span className="flex-1 text-center">ดาวน์โหลดเอกสาร</span>
              <CaretDownIcon
                size={14}
                color="white"
                style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} role="presentation" />
                <div
                  className="absolute bottom-full mb-2 right-0 w-full rounded-xl overflow-hidden z-20 shadow-lg"
                  style={{ border: "1px solid rgba(0,0,0,0.1)", backgroundColor: "white" }}
                >
                  <button
                    type="button"
                    onClick={() => { setFcnModalOpen(true); setDropdownOpen(false); }}
                    className="group flex items-start gap-3 w-full px-4 py-3 text-left cursor-pointer transition-colors"
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <div className="relative flex shrink-0 size-8 items-center justify-center rounded-lg bg-[#fee2e2] group-hover:bg-transparent transition-colors">
                      <FilePdfIcon size={16} color="#dc2626" className="transition-opacity group-hover:opacity-0" />
                      <EyeIcon size={16} color="#0a6ee7" className="absolute opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[#101828]">Presentation PDF</p>
                      <p className="text-xs text-[#6a7282] mt-0.5">สำหรับนำเสนอลูกค้า</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPackageModalOpen(true); setDropdownOpen(false); }}
                    className="group flex items-start gap-3 w-full px-4 py-3 text-left cursor-pointer transition-colors"
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <div className="relative flex shrink-0 size-8 items-center justify-center rounded-lg bg-[#eff6ff] group-hover:bg-transparent transition-colors">
                      <PackageIcon size={16} color="#0a6ee7" className="transition-opacity group-hover:opacity-0" />
                      <EyeIcon size={16} color="#0a6ee7" className="absolute opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-[#101828]">ชุดเอกสารครบชุด</p>
                      <p className="text-xs text-[#6a7282] mt-0.5">สำหรับปิดการขาย (.zip)</p>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Booking replaces the external hand-off the page used to make.
              With the flag off it goes back to that link, so the catalogue is
              exactly what it was before this feature existed. */}
          {ORDER_BOOKING_ENABLED ? (
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="flex w-full max-w-[343px] items-center justify-center gap-2 h-12 px-4 font-medium text-sm rounded-xl cursor-pointer transition-opacity hover:opacity-90 border bg-transparent"
              style={{ borderColor: "#0a6ee7", color: "#0a6ee7" }}
            >
              <UserPlusIcon size={16} />
              <span>จองซื้อให้ลูกค้า</span>
            </button>
          ) : (
            <a
              href="https://placeholder.example.com/create-order"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full max-w-[343px] items-center justify-center gap-2 h-12 px-4 font-medium text-sm rounded-xl cursor-pointer transition-opacity hover:opacity-90 border"
              style={{ borderColor: "#0a6ee7", color: "#0a6ee7" }}
            >
              <span>สร้างคำสั่งซื้อ</span>
              <ArrowSquareOutIcon size={16} />
            </a>
          )}

          {/* The book, once there is one. Hidden until the first booking
              rather than shown empty: a 0% bar under the button that creates
              the first booking says nothing the button doesn't. */}
          {ORDER_BOOKING_ENABLED && book && book.openBookings.length > 0 && (
            <Link
              href={`/orders/${encodeURIComponent(product.id)}`}
              className="group flex w-full max-w-[343px] flex-col gap-1.5 rounded-xl border border-black/10 bg-white px-4 py-3 transition-colors hover:border-[#0a6ee7]"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 text-xs font-bold leading-4 text-[#6a7282]">
                  ยอดจองของดีลนี้
                </span>
                <span className="text-xs leading-4 text-[#4a5565]">
                  {formatOrderAmount(book.bookedAmount, book.currency)} /{" "}
                  {formatOrderAmount(book.targetAmount, book.currency)}
                </span>
                <CaretRightIcon
                  size={14}
                  className="shrink-0 text-[#6a7282] transition-colors group-hover:text-[#0a6ee7]"
                />
              </div>
              <LinearProgress value={bookProgressPct(book)} />
            </Link>
          )}
        </div>
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
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
