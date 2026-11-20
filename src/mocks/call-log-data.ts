import type { CallLogEntry } from "@/types/call-log";

const DEFAULT_LOGS: CallLogEntry[] = [
  {
    id: "c1",
    date: "14 Jul 2026",
    time: "10:30",
    duration: "18 min",
    direction: "outbound",
    summary:
      "Discussed portfolio rebalancing — client agreed to increase equity allocation from 40% to 55%.",
  },
  {
    id: "c2",
    date: "30 Jun 2026",
    time: "14:15",
    duration: "9 min",
    direction: "inbound",
    summary:
      "Client called to inquire about structured note maturity date. Confirmed payout on 15 Aug.",
  },
  {
    id: "c3",
    date: "12 Jun 2026",
    time: "09:00",
    duration: "25 min",
    direction: "outbound",
    summary:
      "Annual review call — reviewed YTD performance (+12.4%), discussed tax optimization strategy.",
  },
  {
    id: "c4",
    date: "28 May 2026",
    time: "11:45",
    duration: "6 min",
    direction: "inbound",
    summary: "Quick check on bond coupon payment — confirmed receipt of ฿ 240K coupon on schedule.",
  },
];

export const CALL_LOG_DATA: Record<string, CallLogEntry[]> = {
  "110001": [
    {
      id: "c1",
      date: "14 Jul 2026",
      time: "10:30",
      duration: "18 min",
      direction: "outbound",
      summary: "Discussed portfolio rebalancing — agreed to increase equity allocation to 55%.",
    },
    {
      id: "c2",
      date: "30 Jun 2026",
      time: "14:15",
      duration: "9 min",
      direction: "inbound",
      summary: "Client inquired about structured note maturity date. Confirmed payout on 15 Aug.",
    },
    {
      id: "c3",
      date: "12 Jun 2026",
      time: "09:00",
      duration: "25 min",
      direction: "outbound",
      summary: "Annual review — YTD +12.4%, discussed tax optimization strategy for Q3.",
    },
  ],
  "110002": [
    {
      id: "c1",
      date: "11 Jul 2026",
      time: "13:00",
      duration: "14 min",
      direction: "outbound",
      summary: "Pitched Global Private Equity fund — client requested prospectus before deciding.",
    },
    {
      id: "c2",
      date: "22 Jun 2026",
      time: "16:30",
      duration: "7 min",
      direction: "inbound",
      summary: "Client asked about FX exposure. Suggested partial USD hedge.",
    },
  ],
  "110003": [
    {
      id: "c1",
      date: "10 Jul 2026",
      time: "09:30",
      duration: "20 min",
      direction: "outbound",
      summary: "Reviewed idle cash position — agreed to deploy ฿ 50M into short-term bond ladder.",
    },
    {
      id: "c2",
      date: "25 Jun 2026",
      time: "11:00",
      duration: "12 min",
      direction: "outbound",
      summary:
        "Follow-up on KBANK structured note proposal — client requested 2-week extension to decide.",
    },
    {
      id: "c3",
      date: "5 Jun 2026",
      time: "15:45",
      duration: "5 min",
      direction: "inbound",
      summary: "Client confirmed receipt of monthly performance report.",
    },
  ],
  "110004": [
    {
      id: "c1",
      date: "13 Jul 2026",
      time: "10:00",
      duration: "30 min",
      direction: "outbound",
      summary:
        "Structured Note Series 12 pitch — AI confidence 91%. Client wants to review term sheet.",
    },
    {
      id: "c2",
      date: "1 Jul 2026",
      time: "14:00",
      duration: "15 min",
      direction: "inbound",
      summary:
        "Follow-up on Global PE fund allocation. Client requested risk analysis for Q3 deployment.",
    },
  ],
  "110007": [
    {
      id: "c1",
      date: "12 Jul 2026",
      time: "11:30",
      duration: "22 min",
      direction: "outbound",
      summary: "Discussed FX hedging strategy for 42% USD exposure ahead of US rate decision.",
    },
    {
      id: "c2",
      date: "28 Jun 2026",
      time: "09:15",
      duration: "10 min",
      direction: "inbound",
      summary: "Client confirmed referral pipeline — 2 HNW prospects scheduled for intro meeting.",
    },
    {
      id: "c3",
      date: "15 Jun 2026",
      time: "16:00",
      duration: "8 min",
      direction: "outbound",
      summary: "Confirmed bond portfolio closed won — ฿ 890M transferred to custody.",
    },
  ],
};

export function getCallLogs(clientId: string): CallLogEntry[] {
  return CALL_LOG_DATA[clientId] ?? DEFAULT_LOGS;
}
