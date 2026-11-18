import type { StructuredProduct } from "./structured-product-data";

export type ThaiStructuredProduct = {
  theme: string;
  product: string;
  ccy: string;
  bbg1: string;
  bbg2: string;
  bbg3: string;
  couponPa: string;
  koType: string;
  koBarrier: string;
  strike: string;
  kiBarrier: string;
  tenor: number;
};

export const THAI_STRUCTURED_PRODUCTS: ThaiStructuredProduct[] = [
  { theme: "Big Data", product: "FCN", ccy: "USD", bbg1: "PLTR US", bbg2: "SNOW US", bbg3: "MSFT US", couponPa: "16.90%", koType: "Period End", koBarrier: "100.00%", strike: "75.00%", kiBarrier: "55.00%", tenor: 6 },
  { theme: "Chips", product: "FCN", ccy: "USD", bbg1: "AMD US", bbg2: "NVDA US", bbg3: "QCOM US", couponPa: "24.17%", koType: "Period End", koBarrier: "100.00%", strike: "80.00%", kiBarrier: "60.00%", tenor: 6 },
  { theme: "Magnificent 7", product: "FCN", ccy: "USD", bbg1: "GOOGL US", bbg2: "AMZN US", bbg3: "META US", couponPa: "11.78%", koType: "Period End", koBarrier: "100.00%", strike: "85.00%", kiBarrier: "70.00%", tenor: 6 },
  { theme: "Streaming Media", product: "FCN", ccy: "USD", bbg1: "NFLX US", bbg2: "DIS US", bbg3: "ROKU US", couponPa: "3.93%", koType: "Period End", koBarrier: "100.00%", strike: "85.00%", kiBarrier: "65.00%", tenor: 6 },
  { theme: "Semiconductor", product: "FCN", ccy: "USD", bbg1: "INTC US", bbg2: "QCOM US", bbg3: "AVGO US", couponPa: "33.81%", koType: "Period End", koBarrier: "100.00%", strike: "80.00%", kiBarrier: "60.00%", tenor: 6 },
  { theme: "Enterprise Software", product: "FCN", ccy: "USD", bbg1: "ADBE US", bbg2: "ORCL US", bbg3: "CRM US", couponPa: "27.65%", koType: "Period End", koBarrier: "100.00%", strike: "80.00%", kiBarrier: "65.00%", tenor: 6 },
  { theme: "Metaverse", product: "FCN", ccy: "USD", bbg1: "RBLX US", bbg2: "META US", bbg3: "NVDA US", couponPa: "27.38%", koType: "Period End", koBarrier: "100.00%", strike: "80.00%", kiBarrier: "65.00%", tenor: 6 },
  { theme: "Healthcare", product: "FCN", ccy: "USD", bbg1: "UNH US", bbg2: "NVO US", bbg3: "LLY US", couponPa: "11.88%", koType: "Period End", koBarrier: "100.00%", strike: "85.00%", kiBarrier: "70.00%", tenor: 6 },
  { theme: "Energy", product: "FCN", ccy: "USD", bbg1: "XOM US", bbg2: "CVX US", bbg3: "OXY US", couponPa: "4.16%", koType: "Period End", koBarrier: "100.00%", strike: "90.00%", kiBarrier: "85.00%", tenor: 6 },
  { theme: "Bank", product: "FCN", ccy: "USD", bbg1: "BAC US", bbg2: "C US", bbg3: "WFC US", couponPa: "8.25%", koType: "Period End", koBarrier: "100.00%", strike: "90.00%", kiBarrier: "85.00%", tenor: 6 },
  { theme: "Investment", product: "FCN", ccy: "USD", bbg1: "JPM US", bbg2: "MS US", bbg3: "GS US", couponPa: "11.26%", koType: "Period End", koBarrier: "100.00%", strike: "90.00%", kiBarrier: "85.00%", tenor: 6 },
  { theme: "Payments", product: "FCN", ccy: "USD", bbg1: "V US", bbg2: "MA US", bbg3: "AXP US", couponPa: "13.61%", koType: "Period End", koBarrier: "100.00%", strike: "100.00%", kiBarrier: "85.00%", tenor: 6 },
  { theme: "Sharing Economy", product: "FCN", ccy: "USD", bbg1: "UBER US", bbg2: "ABNB US", bbg3: "GRAB US", couponPa: "18.60%", koType: "Period End", koBarrier: "100.00%", strike: "90.00%", kiBarrier: "65.00%", tenor: 6 },
  { theme: "Apparel", product: "FCN", ccy: "USD", bbg1: "NKE US", bbg2: "LULU US", bbg3: "ONON US", couponPa: "22.74%", koType: "Period End", koBarrier: "100.00%", strike: "85.00%", kiBarrier: "65.00%", tenor: 6 },
  { theme: "Food & Beverage", product: "FCN", ccy: "USD", bbg1: "MNST US", bbg2: "SHAK US", bbg3: "KO US", couponPa: "15.72%", koType: "Period End", koBarrier: "100.00%", strike: "85.00%", kiBarrier: "65.00%", tenor: 6 },
];

/** `theme` is the row's natural key — it doubles as the detail route segment. */
export function getThaiStructuredProduct(
  theme: string,
): ThaiStructuredProduct | null {
  return THAI_STRUCTURED_PRODUCTS.find((p) => p.theme === theme) ?? null;
}

// ── Booking ──────────────────────────────────────────────────────────────────

/**
 * The ticket terms the Thai desk writes these notes at.
 *
 * The two numbers a booking gate needs that the rows above genuinely do not
 * carry: a minimum per client, and the notional a book has to fill before the
 * order goes out. The global desk's products carry both as fields
 * (`minInvestment`, `requestNotionalSize`); these rows carry neither, and every
 * one of them is the same USD FCN structure written at the same size.
 *
 * One constant rather than a column repeated fifteen times — and here, next to
 * the rows it describes, rather than in the order module, so that whoever adds
 * a sixteenth theme finds it.
 */
const THAI_MIN_TICKET = "10,000 USD";
const THAI_NOTIONAL = "100,000";

/**
 * The id a Thai theme is booked and routed under.
 *
 * Prefixed because `/orders/:id` is one namespace shared with the global desk,
 * and a theme that slugged to the same string as a global product's id would
 * resolve to the wrong book. The prefix is also what
 * {@link findBookableProduct} splits on, so it is load-bearing rather than
 * decorative.
 */
export function thaiBookableId(theme: string): string {
  return `thai-${theme.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * Each underlying's own mock photograph, in `public/underlying-logos`.
 *
 * A Thai row is theme, tickers and terms — it has never carried artwork, so
 * every surface that draws one next to a global product (Order Management's
 * cards and tables) had half its rows blank. These are the same kind of
 * stand-in the global desk's fixtures use, in the same size and format: 80×80
 * Unsplash photographs, one per ticker rather than ten shared among
 * forty-two, so no two unrelated underlyings wear the same picture.
 *
 * Derived from the ticker rather than listed per theme, because tickers repeat
 * across themes — QCOM US is in both "Chips" and "Semiconductor", and one
 * mapping is what keeps them the same picture in both.
 *
 * The files are committed; `npm run logos` re-downloads them after a theme is
 * added. Nothing here reaches the network at runtime.
 */
function underlyingLogo(ticker: string): string {
  // "NVDA US" → "nvda" — the ticker without its exchange suffix, which is what
  // `scripts/generate-underlying-logos.mjs` names the files after.
  const slug = ticker.split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `/underlying-logos/${slug}.jpg`;
}

/**
 * A Thai row in the shape the rest of the app reads a structured product in.
 *
 * This conversion already existed inside `ThaiStructuredProductDetail`, where
 * it fed the two document modals. It lives here now because the booking flow
 * needs the same conversion and two of them would be two answers to "what is
 * this product's currency".
 */
export function toBookableProduct(p: ThaiStructuredProduct): StructuredProduct {
  const tickers = [p.bbg1, p.bbg2, p.bbg3].filter(Boolean);
  const underlying = tickers.join(" - ");
  return {
    id: thaiBookableId(p.theme),
    underlying,
    coupon: p.couponPa,
    tenor: `${p.tenor} เดือน`,
    ko: p.koBarrier,
    strike: p.strike,
    ki: p.kiBarrier,
    tags: [],
    // One per underlying, the same rule the global fixtures follow.
    logos: tickers.map(underlyingLogo),
    offerDate: "-",
    couponPeriod: "-",
    detailTenor: `${p.tenor} เดือน`,
    // The theme, not the underlying. This is what names the book in Order
    // Management, and "Big Data" is how the Thai desk refers to the deal —
    // the tickers are already the row above it.
    productName: `${p.product} · ${p.theme}`,
    productType: p.product,
    currency: p.ccy,
    minInvestment: THAI_MIN_TICKET,
    // Only the denominator is read (see `orderTargetFor`); the numerator is
    // this book's own live total, which the order store owns.
    requestNotionalSize: `0 / ${THAI_NOTIONAL}`,
    updatedAt: "-",
  };
}
