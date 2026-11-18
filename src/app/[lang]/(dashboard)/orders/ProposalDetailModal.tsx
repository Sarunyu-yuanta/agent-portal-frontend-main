"use client";

/**
 * One Proposal, opened from its row in Order Management.
 *
 * The offer's own receipt, built from the same pieces as `BookingDetailModal`
 * so the two read as one family: the outcome as a disc and a coloured heading,
 * the product named under it, then a grey panel of label-left / value-right
 * rows.
 *
 * **What it deliberately does not have is an amount.** A booking's sheet ends
 * at the notional, because that is the figure the whole thing is about. An
 * offer has committed nothing, so there is no figure to end on; the sentence
 * at the foot says what the IC actually needs — whose move it is next.
 *
 * **One colour** — the disc, the badge and the outcome tag, and nothing else
 * on the sheet. Which colour is decided once, in `PROPOSAL_VARIANT`; it is the
 * variant left over after the booking statuses have theirs, which is what lets
 * a proposal look like a status without being mistaken for one.
 *
 * Every send to this client on this product is listed, newest first. A
 * re-pitch is a second row in the log (see {@link ProposalLog}) and the list is
 * where an IC sees they have already chased this one twice.
 */

import {
  CheckIcon,
  PaperPlaneTiltIcon,
  XIcon,
} from "@phosphor-icons/react";
import { Tag } from "@sarunyu/system-one";
import { ResponsiveBottomSheetModal } from "@/components/ResponsiveBottomSheetModal";
import { usePrivacy } from "@/contexts/privacy-context";
import { useOrders } from "@/contexts/orders-context";
import { getClientProfile } from "@/data/client-profiles";
import { maskName } from "@/lib/mask-name";
import type { OrderBook, ProposalLog } from "@/types/domain";
import { PROPOSAL_CHANNEL_META } from "./proposal-channels";
import type { BookableProduct } from "./bookable-products";
import {
  ClientRow,
  SHEET_DASHED,
  SHEET_PANEL,
  SheetBlock,
  SheetRow,
  StatusDisc,
  TONE,
  type Tone,
} from "./detail-sheet-ui";
import { formatLogTime } from "./order-book";
import { ProposalChip, PROPOSAL_VARIANT } from "./ProposalChip";
import {
  PROPOSAL_OUTCOME_LABEL,
  PROPOSAL_OUTCOME_VARIANT,
  proposalOutcome,
  proposalsFor,
  type ProposalOutcome,
} from "./order-proposals";

/**
 * The disc, by what came of the offer.
 *
 * `open` takes the paper plane of the press that sent it rather than a
 * waiting-room glyph: nothing is in progress anywhere, the document is simply
 * with the client. The other two borrow the booking sheet's own verdicts so a
 * won offer and the booking it produced do not disagree about what happened.
 */
const OUTCOME_DISC: Record<ProposalOutcome, { tone: Tone; glyph: React.ReactNode }> = {
  open: { tone: PROPOSAL_VARIANT, glyph: <PaperPlaneTiltIcon size={28} weight="fill" /> },
  won: { tone: "green", glyph: <CheckIcon size={30} weight="bold" /> },
  lost: { tone: "gray", glyph: <XIcon size={30} weight="bold" /> },
};


export function ProposalDetailModal({
  proposal,
  book,
  product,
  onClose,
}: {
  /** `null` keeps the modal closed. */
  proposal: ProposalLog | null;
  book: OrderBook;
  product: BookableProduct;
  onClose: () => void;
}) {
  return (
    <ResponsiveBottomSheetModal
      open={proposal !== null}
      onClose={onClose}
      title={`รายละเอียด Proposal ${product.underlying} ${product.coupon}`}
      titleId="proposal-detail-title"
      // The sheet opens with its own heading — the outcome in colour, with the
      // product named under it. A second heading above said both again.
      desktopTitleHidden
      desktopMaxWidth="max-w-[560px]"
    >
      {proposal && <Body proposal={proposal} book={book} product={product} />}
    </ResponsiveBottomSheetModal>
  );
}

function Body({
  proposal,
  book,
  product,
}: {
  proposal: ProposalLog;
  book: OrderBook;
  product: BookableProduct;
}) {
  const { isPrivate } = usePrivacy();
  const { proposals } = useOrders();

  const profile = getClientProfile(proposal.clientId);
  const name = maskName(proposal.clientName, isPrivate);
  const outcome = proposalOutcome(proposal, book);
  const disc = OUTCOME_DISC[outcome];
  /** Every send to this client on this product — a re-pitch is a second row. */
  const history = proposalsFor(proposals, book.productId).filter(
    (p) => p.clientId === proposal.clientId,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center px-6 pb-6 pt-2 text-center">
          <StatusDisc variant={disc.tone}>{disc.glyph}</StatusDisc>
          <p className={`pt-3 text-title-lg leading-[32px] font-bold ${TONE[disc.tone].text}`}>
            {PROPOSAL_OUTCOME_LABEL[outcome]}
          </p>
          <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-4">
            {/* The proposal's own colour, where the booking sheet's badge is
                blue — this names a different kind of record entirely. */}
            <span className="shrink-0 rounded-full bg-[var(--fill-blue-100)] px-2 py-0.5 text-meta font-semibold text-[var(--fill-blue-700)]">
              Proposal
            </span>
            <span className="text-title-sm leading-[28px] font-bold text-foreground">
              {product.underlying}
            </span>
            <span className="min-w-0 truncate text-label text-muted-foreground">
              {product.coupon}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5 pt-2 md:px-6">
          <div className={`flex flex-col gap-3 ${SHEET_PANEL}`}>
            <SheetBlock title="รายละเอียด Proposal">
              <ClientRow clientId={proposal.clientId} name={name} />
              <SheetRow label="Full Name (TH)" value={maskName(profile.nameTh, isPrivate)} />
              <SheetRow label="Account No" value={profile.accountNo} />
              <SheetRow label="IC Name" value={proposal.sentBy} />
              <SheetRow label="ส่งเมื่อ" value={formatLogTime(proposal.sentAt)} />
              <SheetRow label="ผลของ Proposal">
                {outcome === "open" ? (
                  <ProposalChip label={PROPOSAL_OUTCOME_LABEL.open} size="lg" />
                ) : (
                  <Tag
                    text={PROPOSAL_OUTCOME_LABEL[outcome]}
                    variant={PROPOSAL_OUTCOME_VARIANT[outcome]}
                    size="large"
                  />
                )}
              </SheetRow>
              <SheetRow label="ช่องทางที่ส่ง">
                <div className="flex flex-wrap items-center justify-end gap-1">
                  {proposal.channels.map((c) => {
                    const { label, Icon } = PROPOSAL_CHANNEL_META[c];
                    return (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--border-default)] bg-white px-2 py-0.5 text-meta font-semibold text-muted-foreground"
                      >
                        <Icon size={11} weight="fill" className="shrink-0" />
                        {label}
                      </span>
                    );
                  })}
                </div>
              </SheetRow>
            </SheetBlock>

            {/* Only once there is more than one: a list of one repeats the row
                three lines above it. */}
            {history.length > 1 && (
              <>
                <div className={SHEET_DASHED} />
                <SheetBlock title={`ส่งไปแล้ว ${history.length} ครั้ง`}>
                  {history.map((p, i) => (
                    <SheetRow
                      key={p.id}
                      label={i === 0 ? "ครั้งล่าสุด" : `ครั้งที่ ${history.length - i}`}
                      value={formatLogTime(p.sentAt)}
                    />
                  ))}
                </SheetBlock>
              </>
            )}
          </div>

          {/* Plainly, because it is the whole point of the record: nothing here
              is a commitment, and the next move is the client's. */}
          <p className="px-1 text-center text-label leading-snug text-muted-foreground">
            {outcome === "open"
              ? "ยังไม่มีการจองจาก Proposal นี้ — ลูกค้าจองเองจากแอป หรือติดต่อให้ IC จองให้ก็ได้"
              : outcome === "won"
                ? "ลูกค้าจองหลังได้รับ Proposal นี้ — ดูรายละเอียดได้ที่รายการจองของลูกค้า"
                : "สินค้าปิดรับไปแล้วโดยไม่มีการจองจาก Proposal นี้"}
          </p>
        </div>
      </div>
    </div>
  );
}
