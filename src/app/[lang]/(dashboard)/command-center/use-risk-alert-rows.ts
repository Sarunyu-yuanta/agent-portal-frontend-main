"use client";

import { useCallback, useMemo } from "react";
import { usePrivacy } from "@/contexts/privacy-context";
import { useRiskAlertsResource } from "@/hooks/use-risk-alerts";
import { useStoredIds } from "@/hooks/use-stored-ids";
import type { RiskAlert } from "@/types/domain";
import {
  buildRiskAlertRows,
  isRiskAlertId,
  openRiskAlerts,
  riskAckId,
  RISK_ACK_IDS_PREF,
  type RiskAlertRow,
} from "./risk-feed";

/**
 * Every risk finding across the book, ranked, with the acknowledgement store
 * attached.
 *
 * One definition rather than one per surface — the Command Center card and
 * `/command-center/risk-alerts` both need the same four pieces wired together
 * (the feed, the privacy flag that masks the names, the stored set, and a way
 * to write to it), and two wirings is exactly how one of them quietly stops
 * honouring an acknowledgement. `use-nba-rows` exists for the same reason, and
 * only after the two surfaces had already diverged.
 *
 * Acknowledgement is held in preferences rather than in a context because it is
 * a set of ids and nothing more. `useStoredIds` is `useSyncExternalStore` over
 * `localStorage` with a `storage` listener, so acknowledging on the full page
 * moves the card without a remount — and does so in another tab, which a React
 * context cannot. The one thing that would force a context is "รับทราบ" having
 * to record *who* and *when* for the compliance audit log; that is a server
 * record, and when it lands this is the file that changes.
 */
export function useRiskAlertRows(): {
  /** Not yet acknowledged. The only set either surface draws — the Command
   *  Center card and `/command-center/risk-alerts` now show the same rows. */
  rows: RiskAlertRow[];
  /**
   * Acknowledged, same ranking. **Nothing renders these right now.**
   *
   * The sub page used to fold them back in behind a "รวมรายการที่รับทราบแล้ว"
   * toggle and that toggle is gone. Kept here with {@link unacknowledge}
   * because the pair is what any undo would be built on — a restored archive,
   * or an action on the toast that confirms the acknowledgement — and because
   * reconstructing them means re-deriving `riskAckId`, which is the part with
   * the subtlety in it.
   */
  acknowledgedRows: RiskAlertRow[];
  isLoading: boolean;
  /** A no-op on a finding the IC may not close — see `RiskAlert.dismissible`. */
  acknowledge: (alert: RiskAlert) => void;
  /** The way back. Also unused at the moment — see `acknowledgedRows`. */
  unacknowledge: (alert: RiskAlert) => void;
} {
  const { data: alerts, isLoading } = useRiskAlertsResource();
  const { isPrivate } = usePrivacy();
  const [ackIds, setAckIds] = useStoredIds<string>(
    RISK_ACK_IDS_PREF,
    isRiskAlertId,
  );

  const all = useMemo(
    () =>
      buildRiskAlertRows({
        alerts,
        acknowledgedIds: ackIds,
        isPrivate,
      }),
    [alerts, ackIds, isPrivate],
  );

  const rows = useMemo(() => openRiskAlerts(all), [all]);
  const acknowledgedRows = useMemo(
    () => all.filter((row) => row.acknowledged),
    [all],
  );

  const acknowledge = useCallback(
    (alert: RiskAlert) => {
      // The gate lives here, not only in the UI that hides the button: a
      // disabled control is a courtesy, not a control — the same position
      // `campaigns-context` takes about sharing unapproved material.
      if (!alert.dismissible) return;
      setAckIds(new Set([...ackIds, riskAckId(alert)]));
    },
    [ackIds, setAckIds],
  );

  const unacknowledge = useCallback(
    (alert: RiskAlert) => {
      const id = riskAckId(alert);
      setAckIds(new Set([...ackIds].filter((stored) => stored !== id)));
    },
    [ackIds, setAckIds],
  );

  return { rows, acknowledgedRows, isLoading, acknowledge, unacknowledge };
}
