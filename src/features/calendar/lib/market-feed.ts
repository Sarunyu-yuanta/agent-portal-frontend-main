/**
 * The shape of everything the Calendar shows that the user did not write.
 *
 * Three feeds, kept apart because they answer different questions and land on
 * the grid differently:
 *
 * - **Corporate actions** — a dated fact about one security: the exchange's own
 *   taxonomy (XD, XW, XT, …) for a share, a coupon / maturity / closing date
 *   for a bond, a structured note or a fund. Each carries its asset class.
 *   Many on one day, so they are drawn grouped by kind.
 * - **Market events** — a seminar, a campaign, anything the desk puts on the
 *   calendar that isn't an exchange fact. One row each.
 * - **Holidays** — a property of the *day*, not a row in it. A non-trading day
 *   has no holders, nothing to open and nothing to act on; it tints the cell and
 *   heads the day panel instead of queueing behind the reminders.
 *
 * Types only. The mock that fills them is `mock-market-feed`, deliberately a
 * separate file so replacing it with a fetch is a deletion — this contract is
 * what the UI is written against and is meant to survive that.
 *
 * ## Why `kind` and `category` are plain strings
 *
 * SET publishes eleven corporate-action codes today and the desk's own event
 * types are whatever the backend decides to define. A union type here would
 * make every new code a frontend release: the pill would fail to typecheck, or
 * worse, look up `undefined` in a colour table and render unstyled. So the
 * taxonomy is open — the UI resolves a colour, a label and an icon for anything
 * that arrives (see `market-taxonomy`), and the codes it knows by name are a
 * presentation detail rather than a contract.
 */

/** A labelled line in a detail panel. Pre-formatted by the feed — the UI does
 *  no unit, currency or date maths on these. */
export type MarketFact = { label: string; value: string };

/** `YYYY-MM-DD`, read as a local calendar day. Not a timestamp: an X-date is a
 *  whole day in Bangkok, and an ISO instant would drift it across midnight for
 *  anyone reading in another zone. */
export type IsoDay = string;

export type CorporateActionFeedItem = {
  id: string;
  date: IsoDay;
  /**
   * Which kind of product the security is — "equity", "fixed-income",
   * "structured-note", "mutual-fund". Open-ended like `kind`.
   *
   * The Calendar groups its filter and legend by this. A SET X-code is a
   * stock's event; a bond, a structured note and a fund have dates of their
   * own (coupon, maturity, subscription close), and one flat list of every
   * code left a reader unable to tell how many kinds of alert there were, or
   * which product each one was about.
   */
  assetClass: string;
  /** The SET code — "XD", "XW", "XT", "XM", … — or, for a product that is not
   *  a listed share, the product event's own id ("FI-COUPON", "SN-KO-OBS").
   *  Open-ended, see above. */
  kind: string;
  /** The security it lands on, as the exchange writes it — "PTT", "AMKR03". */
  symbol: string;
  /** The product's page in the catalog, when there is one to open. */
  href?: string;
  /** The issuer's legal name, for the record sheet's header line. Falls back to
   *  the symbol when the feed has none. */
  name?: string;
  /** One line under the title. Empty is allowed. */
  detail?: string;
  /**
   * The full record, grouped the way the sheet prints it: a rule between
   * groups, nothing between rows of the same group.
   *
   * Grouping comes from the feed rather than from a list of indices in the UI,
   * because it is a property of the record — an XD's dividend figures belong
   * together and its dates belong together, and only the thing that knows what
   * the fields mean can say so.
   */
  record?: MarketFact[][];
  /**
   * Clients in the book holding `symbol`.
   *
   * **Not rendered as a holder list.** A corporate action is a fact about a
   * company, not about a person, and the record sheet it opens says nothing
   * about who owns what. This is here so the desk's own surfaces — the bell, a
   * client's Reminders tab, the Dashboard queue — can tell whether the action
   * is worth raising at all; see `concernsSomeone` in `day-items`. Absent means
   * "nobody in this book", not "unknown".
   */
  clientIds?: string[];
};

export type MarketEventFeedItem = {
  id: string;
  date: IsoDay;
  /** "seminar", "promotion", … Open-ended, see above. */
  category: string;
  title: string;
  detail?: string;
  facts?: MarketFact[];
  /** Who it concerns — invitees for a seminar, the eligible book for a campaign. */
  clientIds?: string[];
};

export type MarketHoliday = {
  id: string;
  date: IsoDay;
  name: string;
  /** Which calendar is closed — "SET" for an exchange holiday, "BANK" for a
   *  settlement one. The two do not always agree, which is the whole reason
   *  this is a field and not an assumption. */
  market: string;
  /** A weekday the market closes because the holiday itself fell on a weekend. */
  substitute?: boolean;
};

export type MarketCalendarFeed = {
  corporateActions: CorporateActionFeedItem[];
  events: MarketEventFeedItem[];
};
