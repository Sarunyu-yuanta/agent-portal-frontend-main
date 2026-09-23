/** Figma node 21204:80781 — Company tab / Company Events calendar. */

export const COMPANY_SUB_TABS = ["Company Profile", "Financials", "Company Events"] as const;

export type CompanySubTab = (typeof COMPANY_SUB_TABS)[number];

export type CorporateActionKind = "XT" | "XW" | "XD";

export type CorporateCalendarMarker =
  | { kind: CorporateActionKind; label: string; muted?: boolean }
  | { kind: "event"; label: "Event" };

export type CorporateActionEvent = {
  type: "corporate-action";
  action: CorporateActionKind;
  symbol: string;
};

export type CorporateMeetingEvent = {
  type: "meeting";
  title: string;
  datetime: string;
  location: string;
  speakers: string;
  seatsTaken: number;
  seatsTotal: number;
};

export type CorporateDayEvent = CorporateActionEvent | CorporateMeetingEvent;

export type StockCompanyEvents = {
  /** Month shown on first load — Figma defaults to April 2026. */
  initialMonth: { year: number; month: number };
  /** `calendar-grid` day key for the initially selected cell. */
  initialDayKey: string;
  markersByDay: Record<string, CorporateCalendarMarker[]>;
  eventsByDay: Record<string, CorporateDayEvent[]>;
};

function markerLabel(action: CorporateActionKind, symbol: string) {
  return `${action} : ${symbol}`;
}

/** Shared Figma sample; symbol labels follow the active quote. */
export function getStockCompanyEvents(symbol: string): StockCompanyEvents {
  return {
    initialMonth: { year: 2026, month: 3 },
    initialDayKey: "2026-3-2",
    markersByDay: {
      "2026-3-2": [
        { kind: "XW", label: markerLabel("XW", symbol) },
        { kind: "event", label: "Event" },
      ],
      "2026-3-6": [{ kind: "XT", label: markerLabel("XT", symbol) }],
      "2026-3-29": [{ kind: "XD", label: markerLabel("XD", symbol) }],
      "2026-4-2": [{ kind: "XT", label: markerLabel("XT", symbol), muted: true }],
    },
    eventsByDay: {
      "2026-3-2": [
        { type: "corporate-action", action: "XW", symbol },
        {
          type: "meeting",
          title: "Annual General Meeting of Shareholders 2025",
          datetime: "2 April 2026 14:00 - 18:00 PM",
          location: "IR Plus AGM (Online)",
          speakers: "Speakers: Sopakij Chearavanont์, Korsak Chairasmisak",
          seatsTaken: 100,
          seatsTotal: 200,
        },
      ],
    },
  };
}
