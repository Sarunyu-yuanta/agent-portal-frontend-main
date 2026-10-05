"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, TabGroup, Toaster, type ToastStatus } from "@sarunyu/system-one";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  CaretDownIcon,
  EyeIcon,
  FilePdfIcon,
  PackageIcon,
  UserPlusIcon,
} from "@phosphor-icons/react";
import { ORDER_BOOKING_ENABLED } from "@/lib/feature-flags";
import { useToasts } from "@/hooks/use-toasts";
import { OrderBookingModal } from "@/app/(dashboard)/orders/OrderBookingModal";
import { ProductOrderSection } from "@/app/(dashboard)/orders/ProductOrderSection";
import { toBookableProduct, type ThaiStructuredProduct } from "./thai-structured-data";
import { FCNPresentationModal } from "./FCNPresentationModal";
import { PackageFilesModal } from "./PackageFilesModal";

const BORDER_COLOR = "rgba(0,0,0,0.1)";
const INVEST_URL = "https://placeholder.example.com/create-order";

function DetailTable({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div
      className="flex flex-col w-full rounded-md overflow-hidden"
      style={{ border: `1px solid ${BORDER_COLOR}` }}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className="flex gap-3 items-center px-4 py-2 w-full text-sm leading-5"
          style={{ backgroundColor: i % 2 === 0 ? "#f9fafb" : "white" }}
        >
          <span className="flex-1 text-[#4a5565]">{row.label}</span>
          <span className="flex-1 text-right font-medium text-[#101828]">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ThaiStructuredProductDetail({
  product,
  onBack,
}: {
  product: ThaiStructuredProduct;
  onBack: () => void;
}) {
  const [fcnModalOpen, setFcnModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [tab, setTab] = useState<"detail" | "orders">("detail");

  // The page owns the toast stack, not the modal: a booking confirms by
  // *closing* the modal, and a toast rendered inside it would leave with it.
  const { toasts, addToast, removeToast } = useToasts();
  const notice = (message: string, status: ToastStatus) => addToast({ message, status });

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) main.scrollTop = 0;
    else window.scrollTo(0, 0);
  }, [product.theme]);

  const underlying = [product.bbg1, product.bbg2, product.bbg3].filter(Boolean).join(" - ");
  // Memoised because it is a fresh object every call and feeds a hook's
  // dependency list — recomputing it each render would re-run the readiness
  // derivation behind the booking modal on every keystroke in its search box.
  const adapted = useMemo(() => toBookableProduct(product), [product]);


  const rows = [
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

  return (
    <div
      className="flex flex-col items-center w-full pt-6 pb-20 px-4 md:px-8 lg:px-[221px]"
      style={{ backgroundColor: "#f9fafb" }}
    >
      {/* Header */}
      <div className="flex gap-2 items-center h-[46px] py-2 w-full max-w-[998px]">
        <Button variant="plain" size="icon-sm" onClick={onBack} aria-label="กลับ" className="shrink-0">
          <ArrowLeftIcon size={20} />
        </Button>
        <h1 className="flex-1 min-w-0 text-lg font-bold leading-[26px] text-[#101828] truncate">
          {underlying}
        </h1>
      </div>

      {/* Card */}
      <div
        className="flex flex-col gap-14 w-full max-w-[998px] px-6 py-8 md:px-10 lg:px-14 rounded-xl bg-white"
        style={{ boxShadow: "0px 0px 4px rgba(0,0,0,0.02)" }}
      >
        {/* Summary */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-bold leading-6 text-[#101828]">{underlying}</p>
              <p className="text-xs leading-4 text-[#4a5565]">Underlying</p>
            </div>
            <div className="flex flex-col gap-0.5 items-end shrink-0">
              <p className="text-2xl font-bold leading-8 text-[#0a6ee7] whitespace-nowrap">
                {product.couponPa}
              </p>
              <p className="text-xs leading-4 font-medium text-[#4a5565]">Coupon p.a.</p>
            </div>
          </div>

          {/* Same two views as the global desk's detail page. */}
          {ORDER_BOOKING_ENABLED && (
            <TabGroup
              items={[
                { id: "detail", title: "Detail" },
                { id: "orders", title: "Order Management" },
              ]}
              activeId={tab}
              onChange={(id) => setTab(id as "detail" | "orders")}
            />
          )}

          {tab === "detail" ? (
            <DetailTable rows={rows} />
          ) : (
            <ProductOrderSection
              product={adapted}
              onBook={() => setBookingOpen(true)}
              onNotice={notice}
            />
          )}
        </div>

        {/* CTA — only under Detail; Order Management carries its own จองซื้อ. */}
        {tab === "detail" && (
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

          {/* Same swap as the global desk's detail page: booking replaces the
              external hand-off, and the flag puts the old link back. */}
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
              href={INVEST_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full max-w-[343px] items-center justify-center gap-2 h-12 px-4 font-medium text-sm rounded-xl cursor-pointer transition-opacity hover:opacity-90 border"
              style={{ borderColor: "#0a6ee7", color: "#0a6ee7" }}
            >
              <span>สร้างคำสั่งซื้อ</span>
              <ArrowSquareOutIcon size={16} />
            </a>
          )}

        </div>
        )}
      </div>

      <FCNPresentationModal product={adapted} open={fcnModalOpen} onClose={() => setFcnModalOpen(false)} />
      <PackageFilesModal product={adapted} open={packageModalOpen} onClose={() => setPackageModalOpen(false)} />
      {ORDER_BOOKING_ENABLED && (
        <OrderBookingModal
          open={bookingOpen}
          product={adapted}
          onClose={() => setBookingOpen(false)}
          onNotice={notice}
        />
      )}
      <Toaster items={toasts} onRemove={removeToast} />
    </div>
  );
}
