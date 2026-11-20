"use client";

import { usePrivacy } from "@/features/shell/store/privacy-context";
import { maskName } from "@/lib/mask-name";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import { amountCheck } from "@/features/orders/lib/amount-check";
import {
  bookingRemaining,
  formatOrderAmount,
  isBookingOpen,
} from "@/features/orders/lib/order-book";
import { useOrderBook } from "@/features/orders/hooks/use-order-books";
import {
  SHEET_DASHED,
  SHEET_PANEL,
  SheetBlock,
  SheetRow,
} from "@/features/orders/components/detail-sheet-ui";
import { EVIDENCE_CHANNEL, formatFileSize } from "@/features/orders/components/order-evidence";
import { useAccountIdentity } from "@/features/clients/hooks/use-clients";
import { useCurrentIc } from "@/features/auth/hooks/use-current-ic";
import { useT } from "@/i18n/I18nProvider";
import type { Client } from "@/types/client";
import type { OrderEvidence } from "@/types/order";

// ── Reviewing before it is sent ──────────────────────────────────────────────

/**
 * The order read back, between the form and the send.
 *
 * Everything the IC decided on the screen before — who, how much, on what
 * proof — as statements rather than fields, in the order a supervisor would
 * check them. Nothing here is editable: a summary that can be changed is a
 * second form, and the point is to see the one that is about to go.
 */
export function BookingSummary({
  product,
  client,
  raw,
  evidence,
  cashAvailable,
}: {
  product: BookableProduct;
  client: Client;
  raw: string;
  evidence: OrderEvidence | null;
  cashAvailable: number;
}) {
  const currentIc = useCurrentIc();
  const getAccountIdentity = useAccountIdentity();
  const t = useT();
  const { isPrivate } = usePrivacy();
  const { data: book } = useOrderBook(product.id);
  const { amount } = amountCheck(
    product,
    book ? bookingRemaining(book) : null,
    book ? !isBookingOpen(book) : false,
    cashAvailable,
    raw,
  );
  const words = t.orders.words[bookingModeFor(product)];
  const channel = evidence ? EVIDENCE_CHANNEL[evidence.channel] : null;
  const ChannelIcon = channel?.icon;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="type-body-2 !font-semibold text-foreground">{words.summaryTitle}</p>
        <p className="type-caption text-muted-foreground">{words.summaryHint}</p>
      </div>

      {/* The figure first and largest: it is the one value a slip of the
          keyboard can make wrong by a factor of ten. */}
      <div className={`flex flex-col items-center gap-1 ${SHEET_PANEL} py-4`}>
        <span className="type-caption text-muted-foreground">
          {`Notional Amount (${product.currency})`}
        </span>
        <span className="text-primary-action text-[32px] leading-[1.3] font-bold tabular-nums">
          {formatOrderAmount(amount, product.currency)}
        </span>
      </div>

      <SheetBlock title={t.orders.summary.section}>
        <SheetRow label={t.orders.summary.product}>
          <span className="truncate text-body-sm font-semibold text-foreground">
            {product.underlying}
            {product.coupon && <span className="text-primary-action ml-1.5">{product.coupon}</span>}
          </span>
        </SheetRow>
        {product.productType && (
          <SheetRow label={t.orders.summary.type} value={product.productType} />
        )}
        <SheetRow
          label={t.orders.sheet.client}
          value={`${client.id} - ${maskName(client.name, isPrivate)}`}
        />
        <SheetRow
          label={t.orders.field.accountNo}
          value={getAccountIdentity(client.id).accountNo}
        />
        <SheetRow label={t.orders.field.ic} value={`${currentIc.name} · ${currentIc.team}`} />
      </SheetBlock>

      {evidence && channel && (
        <>
          <div className={SHEET_DASHED} />
          <SheetBlock title={t.orders.evidenceSheet.title}>
            <SheetRow label={t.orders.evidenceSheet.channel}>
              <span className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-foreground">
                {ChannelIcon && (
                  <ChannelIcon size={15} weight="fill" className="shrink-0 text-muted-foreground" />
                )}
                {t.orders.evidence[evidence!.channel].label}
              </span>
            </SheetRow>
            {evidence.source === "call-log" && evidence.callLog ? (
              <>
                <SheetRow
                  label={t.orders.evidenceSheet.callFromLog}
                  value={`${evidence.callLog.date} ${evidence.callLog.time}`}
                />
                <SheetRow
                  label={t.orders.evidenceSheet.callType}
                  value={`${t.orders.callDirection[evidence.callLog.direction]} · ${evidence.callLog.duration}`}
                />
              </>
            ) : (
              <SheetRow label={t.orders.evidenceSheet.file}>
                <span className="text-right text-body-sm font-semibold break-all text-foreground">
                  {evidence.fileName}
                  {evidence.fileSize != null && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({formatFileSize(evidence.fileSize)})
                    </span>
                  )}
                </span>
              </SheetRow>
            )}
            {evidence.note && (
              <SheetRow label={t.orders.evidenceSheet.note}>
                <span className="text-right text-body-sm font-semibold whitespace-pre-line text-foreground">
                  {evidence.note}
                </span>
              </SheetRow>
            )}
          </SheetBlock>
        </>
      )}
    </div>
  );
}
