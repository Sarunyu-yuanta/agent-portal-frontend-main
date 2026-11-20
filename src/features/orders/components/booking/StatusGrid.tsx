"use client";

import { useState } from "react";

import { Alert, type ToastStatus } from "@sarunyu/system-one";
import { usePrivacy } from "@/features/shell/store/privacy-context";
import { useOrders } from "@/features/orders/store/orders-context";
import { maskName } from "@/lib/mask-name";
import { bookingModeFor, type BookableProduct } from "@/features/orders/lib/bookable-products";
import { requestableKeys, requirementDetailText } from "@/features/orders/lib/order-requirements";
import { STATUS_CHIP } from "@/features/orders/lib/status-chip";
import { useClientReadiness } from "@/features/orders/hooks/use-order-books";
import { SheetRow } from "@/features/orders/components/detail-sheet-ui";
import { useLocale, useT } from "@/i18n/I18nProvider";
import { reportError } from "@/lib/report-error";
import type { Client } from "@/types/client";
import type { RequirementItem, RequirementKey } from "@/types/order";

// ── The status block ─────────────────────────────────────────────────────────

export function StatusGrid({
  product,
  client,
  onNotice,
}: {
  product: BookableProduct;
  client: Client;
  onNotice: (message: string, status: ToastStatus) => void;
}) {
  const locale = useLocale();
  const t = useT();
  const { isPrivate } = usePrivacy();
  const { sendRequirementRequest } = useOrders();
  const readiness = useClientReadiness(client, product);
  const sendable = requestableKeys(readiness);
  const displayName = maskName(client.name, isPrivate);
  /** Which row is in flight, by key — `null` while none is. */
  const [sendingKey, setSendingKey] = useState<RequirementKey | null>(null);

  /**
   * Sends the client off to complete one record.
   *
   * One request per row, where this used to send the whole outstanding set at
   * once. The single button was a fair reading while the four were cards and
   * the action had nowhere to sit inside them; as rows they each have room
   * beside their own label, and only *some* of them are sendable — KYC is
   * started at a branch with the client present, and a risk rating below the
   * product's is not something a form can fix. A button that acts on "whatever
   * of these four happens to qualify" is a button whose effect the IC has to
   * work out from the count in its label.
   *
   * In the real screen each record lives in its own system (Wealth Declare,
   * Risk Consent), so one row is one routing target anyway. Here there is
   * nowhere to route to and the store answers on a timer — same round trip,
   * minus the other applications. See `contexts/orders-context`.
   */
  const sendOne = async (item: RequirementItem) => {
    // One send at a time: a second row pressed mid-flight would otherwise
    // clear the first row's pending label before its request settled.
    if (sendingKey) return;
    setSendingKey(item.key);
    try {
      await sendRequirementRequest({
        clientId: client.id,
        clientName: client.name,
        productId: product.id,
        keys: [item.key],
      });
    } catch (err) {
      reportError("[sendRequirementRequest]", err);
      onNotice(t.orders.booking.requestFailed(item.label), "critical");
      return;
    } finally {
      // Always cleared, so the row never sits on "กำลังส่ง…" after a failure.
      setSendingKey(null);
    }
    onNotice(t.orders.booking.requestSent(item.label, displayName), "success");
  };

  const verdictText = t.orders.readiness[readiness.status].text;

  return (
    <>
      {/* A heading over the four, with the verdict. The chips answer each row;
          this answers the set, so the reader is not re-counting ticks every
          time the form re-renders under them.

          Rendered here rather than through `SheetBlock`, whose title is a
          string: the verdict rides beside the words and has to be a node. The
          type matches that block's own so the two headings in this panel are
          the same heading. */}
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <span className="text-body-sm font-bold text-foreground">
          {t.orders.words[bookingModeFor(product)].prereq}
        </span>
        {/* The same word the customer list gave this client a moment ago — the
            IC picked the row that said "ยังไม่ครบ" and the next screen has to
            agree with it. The count rides along here, where the grid under it
            says which ones; in the list it was the whole of the answer, which
            is what made it unreadable. */}
        <span
          className={`type-caption rounded-full px-2 py-0.5 tabular-nums ${
            readiness.status === "ready"
              ? "bg-[var(--fill-green-100)] text-[var(--fill-green-600)]"
              : "bg-[var(--fill-gray-100)] text-muted-foreground"
          }`}
        >
          {readiness.status === "ready"
            ? verdictText
            : t.orders.readiness.withCount(verdictText, readiness.outstanding.length)}
        </span>
      </div>

      {/* One row each, in the panel's own language. They were four grey cards
          in a 2×2 grid, which made the block that needs no attention — every
          one of them passes, nine times in ten — the heaviest thing on the
          screen. A row says the same thing and sits level with the facts above
          it.

          The risk row prints its rating *instead of* an icon: a tick beside the
          word "Aggressive" is the same verdict twice. That is what
          `item.value !== null` means. */}
      {readiness.items.map((item) => {
        const chip = STATUS_CHIP[item.status];
        const Icon = chip.icon;
        const canSend = sendable.includes(item.key);
        const inFlight = sendingKey === item.key;
        return (
          <SheetRow
            key={item.key}
            label={item.label}
            hint={requirementDetailText(item.detail, t, locale)}
            // The action sits beside the label, so the row names the record and
            // the move on it in one breath. See `sendOne`.
            action={
              canSend ? (
                <button
                  type="button"
                  disabled={inFlight}
                  onClick={() => void sendOne(item)}
                  className="text-primary-action shrink-0 cursor-pointer text-label font-semibold hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  {inFlight ? t.common.sending : t.orders.booking.sendToClient}
                </button>
              ) : undefined
            }
          >
            {item.value ? (
              <span className={`text-body-sm font-bold ${chip.fg}`}>{item.value}</span>
            ) : (
              <Icon size={20} weight="fill" className={`shrink-0 ${chip.fg}`} />
            )}
          </SheetRow>
        );
      })}

      {/* One line under the grid, only when the grid alone would leave the IC
          guessing why the button is dead. The red boxes say *what* is wrong;
          these say what to do about it. */}
      {readiness.status === "blocked" && sendable.length === 0 && (
        <Alert
          status="critical"
          title={t.orders.booking.blockedTitle}
          message={t.orders.booking.blockedRisk(String(client.riskProfile))}
          multiline
          className="mt-4"
        />
      )}
      {readiness.status === "in-review" && (
        <Alert
          status="information"
          message={t.orders.booking.inReview}
          multiline
          className="mt-4"
        />
      )}
    </>
  );
}
