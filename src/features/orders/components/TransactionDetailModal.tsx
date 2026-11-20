"use client";

/**
 * One client trade, opened from its row on the Stock / TFEX / Mutual Fund tab.
 *
 * Shaped like a receipt, which is what it is: a record of something that has
 * already happened, read once and occasionally quoted back to someone. The
 * verdict is a disc at the top with the trade named under it; everything else
 * is label-left / value-right rows between dashed rules, ending at the total.
 *
 * Read-only. Two things are pressable and both are marked: the client row
 * (chevron) goes to their profile, and the reference copies itself.
 *
 * Deliberately *not* the label/value grid of `BookingDetailModal` — that form
 * mirrors the booking form it came from, where every line is a field someone
 * filled in. Nothing here was filled in.
 */

import { CheckIcon, CircleHalfIcon, ClockIcon, XIcon } from "@phosphor-icons/react";
import { ResponsiveBottomSheetModal } from "@/components/ui/responsive-bottom-sheet-modal";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { getAccountIdentity } from "@/mocks/client-profiles";
import { maskName } from "@/lib/mask-name";
import type { ClientTransaction, TransactionStatus } from "@/types/domain";
import {
  ClientRow,
  CopyRow,
  SHEET_DASHED,
  SHEET_PANEL,
  SheetBlock,
  SheetRow,
  StatusDisc,
  TONE,
} from "./detail-sheet-ui";
import {
  SIDE_PILL,
  STATUS_TAG,
  formatAmount,
  formatPrice,
  formatQuantity,
  splitLogTime,
} from "@/features/orders/lib/transaction-display";
import { useT } from "@/i18n/I18nProvider";
import { useLocale } from "@/i18n/I18nProvider";

/** The disc's glyph — the verdict, before a word of it is read. */
const STATUS_GLYPH: Record<TransactionStatus, React.ReactNode> = {
  matched: <CheckIcon size={30} weight="bold" />,
  pending: <ClockIcon size={30} weight="fill" />,
  partial: <CircleHalfIcon size={30} weight="fill" />,
  cancelled: <XIcon size={30} weight="bold" />,
};

export function TransactionDetailModal({
  transaction,
  onClose,
}: {
  /** `null` keeps the modal closed — it stays mounted so it can animate out. */
  transaction: ClientTransaction | null;
  onClose: () => void;
}) {
  const dict = useT();
  return (
    <ResponsiveBottomSheetModal
      open={transaction !== null}
      onClose={onClose}
      title={dict.orders.transaction.title}
      titleId="transaction-detail-title"
      // The receipt opens with its own heading — the status, in colour, under
      // the disc. A second one above it in black said the same thing flatter.
      desktopTitleHidden
      desktopMaxWidth="max-w-[460px]"
    >
      {transaction && <Body t={transaction} />}
    </ResponsiveBottomSheetModal>
  );
}

function Body({ t }: { t: ClientTransaction }) {
  const locale = useLocale();
  const dict = useT();
  const { isPrivate } = usePrivacy();
  const profile = getAccountIdentity(t.clientId);
  // A status this app doesn't know yet reads as itself, in grey, rather than
  // crashing the sheet.
  const tag = {
    text: dict.orders.tradeStatus[t.status] ?? String(t.status),
    variant: STATUS_TAG[t.status]?.variant ?? ("gray" as const),
  };
  const name = maskName(t.clientName, isPrivate);
  const { date, time } = splitLogTime(t.at, locale);
  const cancelled = t.status === "cancelled";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* The verdict, centred, on the sheet's own white. The disc says what
            happened and the heading says it in words — one for the glance, one
            for the reader who came for the detail. */}
        <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
          <StatusDisc variant={tag.variant}>{STATUS_GLYPH[t.status]}</StatusDisc>
          {/* The status alone, in its own colour — the side rides the badge
              below, so a heading reading "ขายสำเร็จ" was saying half of that
              twice. Coloured because it is the word the sheet was opened for. */}
          <p className={`pt-3 text-title-lg leading-[32px] font-bold ${TONE[tag.variant].text}`}>
            {tag.text}
          </p>
          {/* Side and symbol on one line, the company under it. The badge is a
              one-word fact and the symbol is what the row was scanned by —
              together they are the identifier, and the full name is only here
              because the table had to clip it. Its own line unconditionally:
              trailing a forty-character name off the symbol made the pair read
              as one long title, and on a narrow sheet it wrapped anyway. */}
          {/* `pt-4`, not the 6px it had: the heading is 20px bold and the
              line under it is 16px, and at six pixels apart the two read as
              one run-on phrase rather than a verdict and what it is about. */}
          <div className="flex max-w-full flex-col items-center gap-1 pt-4">
            <span className="flex items-center gap-2">
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-meta font-semibold ${SIDE_PILL[t.side]}`}
              >
                {dict.orders.side[t.side]}
              </span>
              <span className="text-title-sm leading-[28px] font-bold text-foreground">
                {t.symbol}
              </span>
            </span>
            {/* Wraps rather than ellipsising: the name is on its own line to
                be read in full, so cutting it here would undo the point. */}
            <span className="max-w-full text-label leading-[20px] text-balance text-muted-foreground">
              {t.name}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-2 pb-5 md:px-6">
          {/* Everything that is read off the record sits on one grey panel;
              the total stays outside it, on the sheet's white, which is what
              makes it the answer rather than the last of eight rows. */}
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title={dict.orders.transaction.section}>
              <ClientRow clientId={t.clientId} name={name} />
              <SheetRow label={dict.orders.transaction.account} value={profile.accountNo} />
              {/* No ประเภท row: the badge under the heading now says ซื้อ/ขาย
                  in colour, and a second copy of one word a hundred pixels
                  below it was the list's longest-serving dead weight. */}
              <SheetRow label={dict.orders.transaction.channel} value={t.channel} />
              <SheetRow label={dict.orders.transaction.time} value={time} />
              <SheetRow label={dict.orders.transaction.date} value={date} />
              <CopyRow label={dict.orders.transaction.reference} value={t.id} />
            </SheetBlock>

            <div className={SHEET_DASHED} />

            <SheetBlock>
              {/* "จำนวน", not `QUANTITY_LABEL`'s "จำนวน (หุ้น)": the unit rides
                  with the figure here, and the table's bracketed heading would
                  have said it twice on one line. */}
              <SheetRow
                label={dict.orders.transaction.quantity}
                value={`${formatQuantity(t.asset, t.quantity)} ${dict.orders.quantityUnit[t.asset]}`}
              />
              <SheetRow
                label={dict.orders.priceLabel[t.asset]}
                value={formatPrice(t.asset, t.price)}
              />
            </SheetBlock>
          </div>

          {/* Outside the grey panel and on a tint of its own — the figure the
              sheet was opened for, which as a plain line on white was walked
              past. Same card the booking sheet gives its notional: the tint
              and the app's primary ink carry it, so the size stays in step
              with the other figures. A cancelled trade goes grey and struck:
              that amount is what it *would* have been. */}
          <div
            className={`flex items-center justify-between gap-4 rounded-xl px-4 py-3 ${
              cancelled ? "bg-[var(--fill-gray-100)]" : "bg-[var(--fill-p1-100)]"
            }`}
          >
            <p className="text-body-sm font-bold text-foreground">
              {dict.orders.transaction.total}
            </p>
            <p
              className={`text-title-lg leading-[32px] font-bold tabular-nums ${
                cancelled ? "text-muted-foreground line-through" : "text-primary-action"
              }`}
            >
              {formatAmount(t.amount)}
              <span
                className={`ml-1 text-label font-medium ${
                  cancelled ? "text-muted-foreground" : "text-primary-action"
                }`}
              >
                {t.currency}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
