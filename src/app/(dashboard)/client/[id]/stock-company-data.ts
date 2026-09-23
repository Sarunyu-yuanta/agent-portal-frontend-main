/** Figma node 21204:80781 — Company tab / Company Events calendar. */

export const COMPANY_SUB_TABS = ["Company Profile", "Financials", "Company Events"] as const;

export type CompanySubTab = (typeof COMPANY_SUB_TABS)[number];

export type CorporateActionKind = "XT" | "XW" | "XD";

/** One labelled line of a corporate action's detail sheet. */
export type CorporateActionDetailRow = {
  label: string;
  /** Pre-formatted by the feed. "-" is the design's own empty marker. */
  value: string;
};

/**
 * One corporate action on one day — the only thing this calendar carries.
 *
 * Issuer events (the AGM card Figma showed) were dropped on request. The grid is
 * a corporate-action feed and the gear filters it by the SET taxonomy; a meeting
 * sitting in the same day panel answered to none of that and read as a second,
 * unrelated calendar sharing the month.
 */
export type CorporateCalendarMarker = {
  kind: CorporateActionKind;
  /** What the cell prints — "XD : BBL". */
  label: string;
  /** Already gone ex: still shown, but no longer competing for attention. */
  muted?: boolean;
  /**
   * The detail sheet's rows, in display order and grouped — Figma draws a rule
   * between groups and nothing between rows of the same group, so the grouping
   * is the separator's only source rather than a second list of indices.
   *
   * Held per marker, not per kind: two XDs a year apart are different figures.
   */
  detail: CorporateActionDetailRow[][];
};

export type StockCompanyEvents = {
  /** Month shown on first load — Figma defaults to April 2026. */
  initialMonth: { year: number; month: number };
  /** Keyed by `calendar-grid`'s `dayKey`. */
  markersByDay: Record<string, CorporateCalendarMarker[]>;
};

function markerLabel(action: CorporateActionKind, symbol: string) {
  return `${action} : ${symbol}`;
}

/**
 * Rows every SET corporate action carries, whatever its kind.
 *
 * Figma (node 24635:107155) specifies the detail sheet for XD only, and its
 * extra columns — dividend per share, adjusted DPS, yield, par — are dividend
 * facts that would be meaningless on an XT or an XW. So the other kinds list
 * this shared set alone until their own sheets are drawn, rather than inventing
 * fields the feed has no answer for.
 */
function commonDetail(dates: {
  xDate: string;
  announce: string;
  board: string;
  record: string;
  bookClosing: string;
}): CorporateActionDetailRow[][] {
  return [
    [
      { label: "X-Date", value: dates.xDate },
      { label: "Announce Date", value: dates.announce },
    ],
    [
      { label: "Board Date", value: dates.board },
      { label: "Record Date", value: dates.record },
      { label: "Book Closing Date", value: dates.bookClosing },
    ],
  ];
}

/** Shared Figma sample; symbol labels follow the active quote. */
export function getStockCompanyEvents(symbol: string): StockCompanyEvents {
  return {
    initialMonth: { year: 2026, month: 3 },
    markersByDay: {
      "2026-3-2": [
        {
          kind: "XW",
          label: markerLabel("XW", symbol),
          detail: commonDetail({
            xDate: "02/04/26",
            announce: "18/02/26",
            board: "18/02/26",
            record: "03/04/26",
            bookClosing: "-",
          }),
        },
      ],
      "2026-3-6": [
        {
          kind: "XT",
          label: markerLabel("XT", symbol),
          detail: commonDetail({
            xDate: "06/04/26",
            announce: "24/02/26",
            board: "24/02/26",
            record: "07/04/26",
            bookClosing: "-",
          }),
        },
      ],
      "2026-3-29": [
        {
          kind: "XD",
          label: markerLabel("XD", symbol),
          // Figma node 24635:107155's own sample, year-shifted onto this mock
          // month. "-" is the design's empty marker, not a missing value here.
          detail: [
            [
              { label: "X-Date", value: "29/04/26" },
              { label: "Announce Date", value: "05/03/26" },
            ],
            [
              { label: "Dividend (per Share)", value: "0.70 THB" },
              { label: "Adjusted DPS", value: "0.70 THB" },
            ],
            [
              { label: "Operation Period", value: "-" },
              { label: "Source of Dividend", value: "RE" },
            ],
            [
              { label: "Payment Date", value: "21/05/26" },
              { label: "Price before X-Date", value: "-" },
              { label: "Price on X-Date", value: "-" },
            ],
            [
              { label: "Dividend Yield", value: "-" },
              { label: "Par", value: "1.00" },
            ],
            [
              { label: "Board Date", value: "05/03/26" },
              { label: "Record Date", value: "02/05/26" },
              { label: "Book Closing Date", value: "-" },
            ],
          ],
        },
      ],
      "2026-4-2": [
        {
          kind: "XT",
          label: markerLabel("XT", symbol),
          muted: true,
          detail: commonDetail({
            xDate: "02/05/26",
            announce: "20/03/26",
            board: "20/03/26",
            record: "05/05/26",
            bookClosing: "-",
          }),
        },
      ],
    },
  };
}
