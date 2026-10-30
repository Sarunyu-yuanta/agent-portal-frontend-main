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
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { getClientProfile } from "@/data/client-profiles";
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
  PRICE_LABEL,
  QUANTITY_LABEL,
  SIDE_LABEL,
  SIDE_PILL,
  STATUS_TAG,
  formatAmount,
  formatPrice,
  formatQuantity,
  splitLogTime,
  unitOf,
} from "./transaction-display";

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
  return (
    <ResponsiveBottomSheetModal
      open={transaction !== null}
      onClose={onClose}
      title="รายละเอียดรายการซื้อขาย"
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
  const { isPrivate } = usePrivacy();
  const profile = getClientProfile(t.clientId);
  const name = maskName(t.clientName, isPrivate);
  const { date, time } = splitLogTime(t.at);
  const cancelled = t.status === "cancelled";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* The verdict, centred, on the sheet's own white. The disc says what
            happened and the heading says it in words — one for the glance, one
            for the reader who came for the detail. */}
        <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
          <StatusDisc variant={STATUS_TAG[t.status].variant}>
            {STATUS_GLYPH[t.status]}
          </StatusDisc>
          {/* The status alone, in its own colour — the side rides the badge
              below, so a heading reading "ขายสำเร็จ" was saying half of that
              twice. Coloured because it is the word the sheet was opened for. */}
          <p
            className={`pt-3 text-[20px] leading-7 font-bold ${TONE[STATUS_TAG[t.status].variant].text}`}
          >
            {STATUS_TAG[t.status].text}
          </p>
          {/* Side, symbol, then the company. Three sizes in one line, biggest
              in the middle: the badge is a one-word fact, the symbol is what
              the row was scanned by, and the full name is only here because
              the table had to clip it. Wraps rather than ellipsising the lot —
              on a narrow sheet the name takes its own line. */}
          {/* `pt-4`, not the 6px it had: the heading is 20px bold and the
              line under it is 16px, and at six pixels apart the two read as
              one run-on phrase rather than a verdict and what it is about. */}
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIDE_PILL[t.side]}`}
            >
              {SIDE_LABEL[t.side]}
            </span>
            <span className="text-[16px] leading-6 font-bold text-foreground">{t.symbol}</span>
            <span className="min-w-0 truncate text-[12px] text-muted-foreground">{t.name}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-2 md:px-6">
          {/* Everything that is read off the record sits on one grey panel;
              the total stays outside it, on the sheet's white, which is what
              makes it the answer rather than the last of eight rows. */}
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title="รายละเอียดรายการ">
              <ClientRow clientId={t.clientId} name={name} />
              <SheetRow label="บัญชี" value={profile.accountNo} />
              {/* No ประเภท row: the badge under the heading now says ซื้อ/ขาย
                  in colour, and a second copy of one word a hundred pixels
                  below it was the list's longest-serving dead weight. */}
              <SheetRow label="ช่องทาง" value={t.channel} />
              <SheetRow label="เวลา" value={time} />
              <SheetRow label="วันที่" value={date} />
              <CopyRow label="เลขที่รายการ" value={t.id} />
            </SheetBlock>

            <div className={SHEET_DASHED} />

            <SheetBlock>
              {/* "จำนวน", not `QUANTITY_LABEL`'s "จำนวน (หุ้น)": the unit rides
                  with the figure here, and the table's bracketed heading would
                  have said it twice on one line. */}
              <SheetRow
                label="จำนวน"
                value={`${formatQuantity(t.asset, t.quantity)} ${unitOf(QUANTITY_LABEL[t.asset])}`}
              />
              <SheetRow label={PRICE_LABEL[t.asset]} value={formatPrice(t.asset, t.price)} />
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
            <p className="text-[13px] font-bold text-foreground">รวม</p>
            <p
              className={`text-[20px] leading-7 font-bold tabular-nums ${
                cancelled ? "text-muted-foreground line-through" : "text-primary-action"
              }`}
            >
              {formatAmount(t.amount)}
              <span
                className={`ml-1 text-[12px] font-medium ${
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

