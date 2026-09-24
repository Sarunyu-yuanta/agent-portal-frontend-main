import { useMemo } from "react";
import { IdentificationCardIcon } from "@phosphor-icons/react";
import type { Client } from "@/types/domain";
import { kycExpiry, kycExpiryLabelTh } from "./client/[id]/client-detail-data";
import { zoneForDays, type ZonedNotification } from "./notification-zones";

/**
 * The checkpoints a KYC expiry rings at: 30 days out, then 15, 7, 1, and the
 * expiry day itself. Once one is crossed the row stays in the bell until the
 * next is crossed, so an expiry that rang at 15 days doesn't go quiet until 7
 * and read as though it had been dealt with in between — the same reasoning
 * `NOTIFICATION_ZONES` in the reminder feed spells out.
 *
 * 30 days is where a client first appears, the same window Client 360's
 * "KYC ครบกำหนด" card uses, so the bell and that card agree on what counts
 * as due.
 */
const CHECKPOINTS = [30, 15, 7, 1, 0] as const;

/**
 * The most recent checkpoint this expiry has crossed, or `null` while it is
 * still further out than the first one. Past the expiry day the answer stays
 * `0` — the day it lapsed is the last thing that fired.
 *
 * The narrowing loop matters: `find` would return 30 for everything, since an
 * expiry 5 days out has crossed 30 as well as 15 and 7, and it's the *smallest*
 * one it still satisfies that fired most recently.
 *
 * Exported because the Dashboard's queue rows carry the same checkpoint in
 * their id for the same reason the bell's do — see `dashboard/dashboard-data`.
 * Two surfaces deriving that number separately is how they start disagreeing
 * about which crossing a row belongs to.
 */
export function lastCheckpointCrossed(daysLeft: number): number | null {
  let crossed: number | null = null;
  for (const c of CHECKPOINTS) {
    if (daysLeft <= c) crossed = c;
  }
  return crossed;
}

/** How this expiry reads in a line of its own — the checkpoint says how close
 *  it is, which is what picks the colour. */
function checkpointTone(daysLeft: number): string {
  if (daysLeft <= 0) return "bg-[var(--fill-red-100)] text-[var(--fill-red-600)]";
  if (daysLeft <= 7) return "bg-[var(--fill-orange-100)] text-[var(--fill-orange-600)]";
  return "bg-[var(--fill-yellow-100)] text-[var(--fill-yellow-600)]";
}

/**
 * The header bell's KYC rows — one per client whose KYC has lapsed or is close
 * enough to have rung a checkpoint, tagged with the zone its *expiry* falls in.
 *
 * Placed by deadline, not by the day the checkpoint fired. The feed used to do
 * the latter, on the reasoning that a notification list is read newest-first
 * and the heading should answer "when did this arrive". That holds for news;
 * "KYC จะหมดอายุในอีก 1 วัน" is a deadline, and the thing an RM decides from is
 * how long is left — so it now shares one axis with the reminder feed, which
 * also lets the two merge into a single ordered list instead of being
 * concatenated. See `./notification-zones`.
 *
 * Countdowns come from {@link kycExpiry}, which derives them from `nextReview`,
 * rather than from `getKycDueClients`, which reads the record's stored
 * `daysUntilExpiry` — the bell has to say the same number as the countdown pill
 * on the client's own profile, and only one of those two is still right once a
 * stored count has been sitting in a file for a month.
 *
 * A record whose `nextReview` can't be parsed raises nothing: there is no
 * countdown to place it by, and guessing which day it fired is worse than
 * staying quiet. It still shows as a date on the client's own KYC tab.
 */
export function useKycNotificationFeed(clients: Client[]) {
  return useMemo(() => {
    // `onItemClick` hands back only the `NotificationItem`, which has nowhere
    // to carry a client id — so this is the side table the click reads.
    const targets = new Map<string, string>();

    const rows: ZonedNotification[] = [];
    for (const client of clients) {
      const expiry = kycExpiry(client.id);
      if (!expiry || expiry.daysLeft === null) continue;
      const checkpoint = lastCheckpointCrossed(expiry.daysLeft);
      if (checkpoint === null) continue; // hasn't rung its first checkpoint yet

      // Two gates, not one. `lastCheckpointCrossed` decides whether this expiry
      // has started ringing at all (30 days out); `zoneForDays` decides where in
      // the bell it sits. An expiry 25 days out has rung, but its zone is `null`
      // — beyond the 15-day horizon the panel shows — so it waits rather than
      // needing a sixth heading of its own.
      const zone = zoneForDays(expiry.daysLeft);
      if (!zone) continue;

      // The checkpoint is part of the id, not just the client: the bell
      // remembers which rows have been seen, and an id that stayed
      // `kyc-110004` from 30 days out to the day it lapsed would be marked
      // seen once and then never announce another checkpoint again. One id per
      // checkpoint makes each crossing its own notification.
      const id = `kyc-${client.id}-d${checkpoint}`;
      rows.push({
        zone,
        daysLeft: expiry.daysLeft,
        item: {
          id,
          title: client.name,
          // The same sentence the profile's identity bar shows, from the same
          // helper — two surfaces phrasing one fact differently is how they
          // start disagreeing. No raw expiry date here: in this row the small
          // print sits where a notification timestamp goes, so a date there
          // reads as "when this arrived" rather than "when KYC lapses". The
          // date itself is on the KYC tab the row opens.
          description: kycExpiryLabelTh(client.id) ?? "",
          // Left blank on purpose. The reminder feed puts the exact day here
          // for the bell's "กำลังจะถึง" screen to print, but a KYC row's
          // `description` already ends in "อีก N วัน" — printing a day beside
          // it would say the same thing twice in two formats.
          time: "",
          // `unread` is left to the bell, which is what knows whether this row
          // has been seen — from here every row looks equally new.
          icon: (
            <span
              role="img"
              aria-label="KYC"
              className={`flex size-6 shrink-0 items-center justify-center rounded-full ${checkpointTone(
                expiry.daysLeft,
              )}`}
            >
              <IdentificationCardIcon size={15} />
            </span>
          ),
        },
      });
      targets.set(id, client.id);
    }

    // No grouping and no badge count here — the shell groups the merged list
    // once, and the bell counts the rows the user hasn't seen, which is a
    // question only it can answer.
    return {
      kycNotificationRows: rows,
      kycNotificationTargets: targets,
    };
  }, [clients]);
}
