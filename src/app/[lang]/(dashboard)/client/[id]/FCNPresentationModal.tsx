"use client";

import { useRef } from "react";
import { BottomSheet, Modal, useIsMobile } from "@sarunyu/system-one";
import { PhoneIcon, WarningIcon } from "@phosphor-icons/react";
import type { StructuredProduct } from "./structured-product-data";

const TICKER_INFO: Record<string, { name: string; sector: string }> = {
  KO: { name: "The Coca-Cola Company", sector: "Consumer Staples" },
  WMT: { name: "Walmart Inc.", sector: "Consumer Staples" },
  AAPL: { name: "Apple Inc.", sector: "Information Technology" },
  AMZN: { name: "Amazon.com Inc.", sector: "Consumer Discretionary" },
  NFLX: { name: "Netflix Inc.", sector: "Communication Services" },
  MSFT: { name: "Microsoft Corp.", sector: "Information Technology" },
  META: { name: "Meta Platforms Inc.", sector: "Communication Services" },
  NVDA: { name: "NVIDIA Corp.", sector: "Information Technology" },
  GOOGL: { name: "Alphabet Inc.", sector: "Communication Services" },
  TSLA: { name: "Tesla Inc.", sector: "Consumer Discretionary" },
  JPM: { name: "JPMorgan Chase & Co.", sector: "Financials" },
  BAC: { name: "Bank of America Corp.", sector: "Financials" },
  V: { name: "Visa Inc.", sector: "Financials" },
  JNJ: { name: "Johnson & Johnson", sector: "Health Care" },
  PFE: { name: "Pfizer Inc.", sector: "Health Care" },
  BABA: { name: "Alibaba Group", sector: "Consumer Discretionary" },
  TSM: { name: "Taiwan Semiconductor", sector: "Information Technology" },
  INTC: { name: "Intel Corp.", sector: "Information Technology" },
  AMD: { name: "Advanced Micro Devices", sector: "Information Technology" },
  DIS: { name: "The Walt Disney Company", sector: "Communication Services" },
};

function parseTickers(underlying: string): string[] {
  return underlying.split(" - ").map((t) => t.trim());
}

function YuantaLogoMark() {
  // eslint-disable-next-line @next/next/no-img-element -- SVG wordmark; the image optimizer rejects SVG
  return <img src="/brand/yuanta-logo.svg" alt="Yuanta Securities" className="h-10 w-auto shrink-0" />;
}

function FooterIconCircle({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", backgroundColor: color, position: "relative", marginTop: 2 }}>
      {children}
    </div>
  );
}

function FCNCard({ product }: { product: StructuredProduct }) {
  const tickers = parseTickers(product.underlying);
  const issuer = product.issuer ?? "NOMURA";

  const couponRows: { label: string; value: string; valueColor: string }[] = [
    { label: "Coupon (%P.A.)", value: product.coupon, valueColor: "#008236" },
    { label: "KO Barrier", value: product.ko, valueColor: "#008236" },
    { label: "Put Strike", value: product.strike, valueColor: "#0a6ee7" },
    { label: "KI Barrier", value: product.ki, valueColor: "#e47200" },
    { label: "Tenor", value: product.tenor, valueColor: "#101828" },
    { label: "Currency", value: product.currency, valueColor: "#101828" },
    { label: "Issuer", value: issuer, valueColor: "#101828" },
  ];

  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: "linear-gradient(140deg, #dbeafe 0%, #e0e7ff 45%, #fce7f3 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.6)" }}>
        <YuantaLogoMark />
        <div className="text-right">
          <p className="font-bold text-[#0a6ee7] text-sm leading-[24px]">FCN Pricing</p>
          <p className="text-[#0a6ee7] text-xs leading-[20px]">as of {product.offerDate}</p>
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 py-4">
        {/* Left: Underlying Assets */}
        <div className="flex flex-col gap-2">
          <p className="font-bold text-[#0a6ee7] text-sm text-center">Underlying Assets</p>
          <div className="flex flex-col gap-2">
            {tickers.map((ticker, i) => {
              const info = TICKER_INFO[ticker];
              const logoSrc = product.logos[i] ?? "/bond-logos/logo-placeholder.svg";
              const name = product.underlyingNames?.[i] ?? info?.name ?? ticker;
              const sector = product.underlyingSectors?.[i] ?? info?.sector ?? "";
              return (
                <div key={`${ticker}-${i}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.72)" }}>
                  <div className="relative shrink-0 size-9 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- placeholder fallback reassigns `currentTarget.src`, which `next/image` controls; also rendered into a jsPDF snapshot */}
                    <img alt={name} className="absolute inset-0 size-full object-cover" src={logoSrc}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/bond-logos/logo-placeholder.svg"; }} />
                  </div>
                  <div className="flex flex-1 min-w-0 flex-col gap-0.5">
                    <p className="font-semibold text-[#101828] text-xs leading-[20px] truncate">{name}</p>
                    <p className="text-[#6a7282] text-meta leading-[20px] truncate">{sector}</p>
                  </div>
                  <span className="shrink-0 font-bold text-[#0a6ee7] text-xs">{ticker}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Fixed Coupon Note */}
        <div className="flex flex-col gap-2">
          <p className="font-bold text-[#0a6ee7] text-sm text-center">Fixed Coupon Note</p>
          <div className="flex flex-col rounded-xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.72)" }}>
            {couponRows.map((row, i) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-3 py-2"
                style={{ borderBottom: i < couponRows.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none" }}
              >
                <span className="text-[#4a5565] text-xs">{row.label}</span>
                <span className="font-bold text-xs" style={{ color: row.valueColor }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-4">
        <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.72)" }}>
          <FooterIconCircle color="#0a6ee7">
            <PhoneIcon size={13} color="white" weight="fill" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </FooterIconCircle>
          <p className="text-meta leading-[20px] text-[#101828]">
            สอบถามข้อมูลเพิ่มเติม / สนใจลงทุน ติดต่อผู้แนะนำการลงทุนของท่าน หรือ{" "}
            <strong>Online-Service 02-009-8000</strong>
          </p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5" style={{ backgroundColor: "rgba(255,255,255,0.72)" }}>
          <FooterIconCircle color="#e47200">
            <WarningIcon size={13} color="white" weight="fill" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} />
          </FooterIconCircle>
          <p className="text-meta leading-[20px] text-[#6a7282]">
            ข้อมูลนี้เป็นเพียงข้อมูลเบื้องต้น ผู้ลงทุนต้องศึกษารายละเอียดก่อนตัดสินใจ
            บริษัทมิได้รับประกันเงินต้นและผลตอบแทนตามเอกสารนี้
          </p>
        </div>
      </div>
    </div>
  );
}

type FCNPresentationModalProps = {
  product: StructuredProduct;
  open: boolean;
  onClose: () => void;
};

export function FCNPresentationModal({ product, open, onClose }: FCNPresentationModalProps) {
  const isMobile = useIsMobile();
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrintPDF = async () => {
    const card = cardRef.current;
    if (!card) return;

    const [{ toPng }, { jsPDF }] = await Promise.all([
      import("html-to-image"),
      import("jspdf"),
    ]);

    const PX_TO_MM = 25.4 / 96;
    const rect = card.getBoundingClientRect();
    const w = rect.width * PX_TO_MM;
    const h = rect.height * PX_TO_MM;

    const dataUrl = await toPng(card, { pixelRatio: 2 });
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: [w, h] });
    pdf.addImage(dataUrl, "PNG", 0, 0, w, h);
    pdf.save(`FCN_${product.underlying.replace(/ - /g, "-")}.pdf`);
  };

  const cardContent = (
    <div ref={cardRef}>
      <FCNCard product={product} />
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => { if (!next) onClose(); }}
        headerType="text"
        title="FCN Presentation"
        rightSide="action"
        actionLabel="ดาวน์โหลด PDF"
        onActionClick={handlePrintPDF}
        showHandle
        contentClassName="flex flex-col gap-0 overflow-y-auto pb-4 px-4"
      >
        {cardContent}
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Modal
          variant="content"
          title="FCN Presentation"
          showClose
          onClose={onClose}
          actionLayout="single"
          primaryLabel="ดาวน์โหลด PDF"
          onPrimaryClick={handlePrintPDF}
          className="!max-w-[720px] w-[calc(var(--vw)*100-2rem)]"
        >
          {cardContent}
        </Modal>
      </div>
    </div>
  );
}
