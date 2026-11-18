# Phase scope — what's in this handover, and what's switched off

The portal was built ahead of the delivery plan, so some finished features have
been held back from a release. They are **switched off, not deleted** — every
file is still in the repo, still compiles, and still type-checks.

The switches live in one place: [`src/lib/feature-flags.ts`](../src/lib/feature-flags.ts).

## Where things stand — Phase 2

Phase 1 switched off Notes, Calendar, Reminders and Call log. **Phase 2 turned
all four back on.** The only things held back now are four sidebar entries in
the Growth section.

| Flag                    | Feature                  | State   | Gates |
| ----------------------- | ------------------------ | ------- | ----- |
| `ORDER_BOOKING_ENABLED` | Order booking            | `true`  | whole feature |
| `KYC_ALERTS_ENABLED`    | KYC rows in the bell     | `true`  | whole feature |
| `NOTES_ENABLED`         | Notes                    | `true`  | whole feature |
| `CALENDAR_ENABLED`      | Calendar + Reminders page| `true`  | whole feature |
| `REMINDERS_ENABLED`     | Reminder surfaces        | `true`  | whole feature |
| `CALL_LOG_ENABLED`      | Call log                 | `true`  | whole feature |
| `PROMOTIONS_ENABLED`    | Promotion / Events       | `false` | sidebar link only |
| `PERFORMANCE_ENABLED`   | Performance              | `false` | sidebar link only |
| `IC_LEARNING_ENABLED`   | IC Learning              | `false` | sidebar link only |
| `YAA_TEAM_HEAD_ENABLED` | YAA / Team Head          | `false` | sidebar link only |

## Two kinds of gate

**Whole-feature gates** (the first six) remove every entry point: the route
redirects (`/notes`, `/calendar` and `/reminders` go to `/client-hub`; `/orders`
goes to `/product-catalog`), and every tab, tile, card and bell row tied to the
feature disappears.

**Sidebar-only gates** (the Growth four) hide the link and nothing else. The
routes — `/promotions`, `/performance`, `/ic-learning`, `/yaa-team-head` — still
render if opened by URL; nothing else in the app links to them. With the three
Growth entries off, the Growth heading in the sidebar stops rendering too.
`CampaignsProvider` stays mounted in the dashboard layout regardless.

## What each whole-feature flag hides

**`NOTES_ENABLED`**

- `/notes` — the Notes hub.
- The floating "New note" button, bottom-right on desktop
  ([`layout.tsx`](<../src/app/(dashboard)/layout.tsx>)).
- Client 360 → Full Profile → the **Notes** tab, and `?tab=notes`
  ([`client/[id]/page.tsx`](<../src/app/(dashboard)/client/[id]/page.tsx>)).
- The **Notes** shortcut tile and its dialog in the Client 360 side panel
  ([`ClientDetailPanel.tsx`](<../src/app/(dashboard)/client-hub/ClientDetailPanel.tsx>)).

**`CALENDAR_ENABLED`**

- `/calendar` — the month view, full screen.
- `/reminders` — the same reminders as one list. It used to be a second tab on
  `/calendar`; it is now its own sidebar entry, and `/calendar?tab=reminder`
  redirects to it.

**`REMINDERS_ENABLED`**

- The reminder rows in the header bell, and the modals a bell row opens.
  The bell itself stays as long as `KYC_ALERTS_ENABLED` is on.
- Client 360 → Full Profile → the **Reminders** tab, and `?tab=reminders`.
- The **Reminders** card on that profile's Overview tab
  ([`OverviewTab.tsx`](<../src/app/(dashboard)/client/[id]/OverviewTab.tsx>)).
- The **Reminder** shortcut tile and its dialog in the Client 360 side panel.

**`CALL_LOG_ENABLED`**

- Client 360 → Full Profile → the **Call Log** tab, and `?tab=call-log`.
- The **Call log** shortcut tile and its dialog in the Client 360 side panel.

## Dependencies

`CALL_LOG_ENABLED` stands on its own. The other three are one body of work:
a reminder *is* a date attached to a note, and the Calendar and Reminders pages
are those reminders laid out by day or by list. If they are switched off again,
switch them off together — the partial combinations aren't shapes the design
accounts for. The flag file spells out the details.

## What is deliberately left alone

- **"Last Contact"** — still out of scope, so the line is not rendered in the
  profile identity bar (the KYC countdown sits there instead). Two pieces survive
  it and have **no callers at all**, which makes them look like dead code to any
  automated sweep: the `lastContact` field in `data/clients.json`, and
  `lastContactFromCallLogs()` in `client/[id]/client-detail-data.ts`.
  **Keep both.** `lastContact` also stays a display string (`"2 days ago"`,
  `"Today"`) rather than a timestamp — nothing reads it, so converting it now
  would be unverifiable.
- **The `comingSoon` flag** on the side panel's shortcut tiles. That's a
  different mechanism from a phase gate: `comingSoon` shows a disabled tile with
  a badge, for a feature the user is *meant* to know is on the way. A
  phase-gated feature isn't advertised at all.
- **The flag file itself**, even with every whole-feature gate on. It is how a
  finished feature gets held back from a release without being deleted, and the
  next phase boundary will want it again.

## Turning a feature on or off

Flip the flag in `src/lib/feature-flags.ts`. Nothing else to wire up.
