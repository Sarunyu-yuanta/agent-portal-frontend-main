"use client";

import { useToasts } from "@/hooks/use-toasts";
import type { RiskAlertRow } from "./risk-feed";

/**
 * What the CTA on a risk finding does — mocked, and in one place.
 *
 * **This is a stand-in**, and so is the button that fires it — see
 * `RISK_CTA_LABEL`, which is Lorem Ipsum until somebody decides what a desk
 * can actually do from an alert. Pressing it raises a toast and stops there,
 * which is the honest shape for this app — the data
 * layer is local fixtures (`risk-mock-data`) and there is no case to file
 * against. When a backend exists, this hook is the one file that changes: both
 * surfaces already call `act(row)` and neither knows what it does.
 *
 * A hook rather than a component, because the Command Center card and
 * `/command-center/risk-alerts` each render their own rows *and* their own
 * `RiskAlertDetail`, and all four places have to agree about what the button
 * does. A `<RiskCtaButton>` owning its own toast would put a `Toaster` inside
 * every row of the list.
 *
 * Acknowledgement is deliberately not in here. That is a real state change
 * this app does persist (`RISK_ACK_IDS_PREF`), it already has its own path
 * through `useRiskAlertRows`, and folding a pretend action in beside a real
 * one is how a demo starts lying about which is which.
 */
export function useRiskCta() {
  const { toasts, addToast, removeToast } = useToasts();

  /** Fires the finding's one action. Takes the row, not the alert, so the
   *  confirmation can still name what it was fired on — the rule code and the
   *  client as the list shows them, masked when privacy mode is on.
   *
   *  The message is placeholder prose to match `RISK_CTA_LABEL`. It names the
   *  finding so the button is visibly wired to the row under it, and says
   *  nothing about what happened, because nothing did and nobody has decided
   *  what should. */
  const act = (row: RiskAlertRow) => {
    addToast({
      status: "information",
      multiline: true,
      message: `Lorem ipsum — ${row.alert.ruleCode} · ${row.displayName}`,
    });
  };

  return { act, toasts, removeToast };
}
