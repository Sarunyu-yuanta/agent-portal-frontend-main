# Mock Data Inventory

This app currently runs entirely on hardcoded/mock data — there is no real backend behind almost any of it. This doc catalogs every distinct piece of mock data in the codebase so whoever builds the real API knows what data models to design endpoints around.

Scope note: this doc is the ground truth of what data exists; the API design is a separate exercise. (There was once an `public/openapi.yaml` sketch and a Swagger page at `/api-docs`, plus a `/admin` data studio and a mock `/api/mock/*` route. All four have been removed — they only ever covered a handful of these domains, and the app now runs purely off the JSON described below.)

**Prefer plain JSON?** Every domain below also exists as a standalone `.json` file in [`mock-json/`](mock-json/) — see [`mock-json/README.md`](mock-json/README.md) for the full file list and which section each one corresponds to.

## How to read each entry

- **What**: one-line business meaning
- **Lives in**: exact file path(s)
- **Shape**: fields and types
- **Records**: how much mock data exists today
- **Used in**: where in the app it's read

---

## 1. Core dashboard data

Raw JSON in `src/data/*.json`, reshaped/typed by `src/lib/mock-data.ts`.

### 1.1 Clients
- **What**: A book-of-business row — one wealth-management client's tier, AUM, cash-idle %, YTD P&L, AI score, status, risk profile.
- **Lives in**: `src/data/clients.json` (raw) + `src/lib/mock-data.ts` (`mockClients`)
- **Shape**:
  ```
  { id: string, name: string, tier: string, aum: string, cashIdlePct: number,
    plYtd: string, plPositive: boolean, aiScore: number,
    status: "success"|"error"|"hold"|"processing",
    lastContact: string, riskProfile: string }
  ```
  Wire-shape counterpart `ApiClient` in `src/types/api.ts` uses `number` for `aum`/`plYtd` instead of display strings.
- **Records**: 8 clients (ids `110001`–`110008`)
- **Used in**: `useClients()` / `useClientsResource()` in `src/hooks/use-api.ts` — this is the **only** dataset with a real seeded route (see §5). Everywhere client info shows up.

### 1.2 NBA (Next-Best-Action) Actions
- **What**: An AI-drafted outreach recommendation for one client (insight, draft message, suggested action, revenue impact).
- **Lives in**: `src/data/nba-actions.json` + `mock-data.ts` (`mockNBAActions`)
- **Shape**: `{ id, clientId, tier, priority, priorityVariant: "red"|"yellow"|"blue", insight, aiDraft, action, revenueImpact }` (all strings except id/clientId)
- **Records**: 4 actions — only for clients `110001`, `110002`, `110004`, `110005`
- **Used in**: `useNBAActions()` — Command Center, client AI cards

### 1.3 Pipeline Deals
- **What**: One active sales opportunity/deal in an RM's pipeline for a client.
- **Lives in**: `src/data/pipeline-deals.json` + `mock-data.ts` (`mockPipelineDeals`)
- **Shape**: `{ id, clientId, product, dealSize: string, probability: number, stage: string, daysInStage: number, stalled: boolean }`
- **Records**: 10 deals across 7 clients
- **Used in**: `usePipelineDeals()` — Pipeline board

### 1.4 Mini Kanban
- **What**: A condensed deal card for the Command Center's mini-kanban widget.
- **Lives in**: `src/data/mini-kanban.json` + `mock-data.ts` (`mockMiniKanban`)
- **Shape**: `{ id, clientId, dealName, dealSize: string, stage: string }`
- **Records**: 4 items
- **Used in**: `useMiniKanban()` — Command Center

### 1.5 Insights (AI feed)
- **What**: An AI-generated insight/alert about a client — product match, risk alert, engagement drop, portfolio note — with a confidence score.
- **Lives in**: `src/data/insights.json` + `mock-data.ts` (`mockInsights`)
- **Shape**: `{ id, type: string, clientId, tier, insight: string, confidence: number, revenueImpact: string, category: string }`
- **Records**: 8 (one per client)
- **Used in**: consumed directly (no hook — no live fetch attempted at all) in the AI Insights page

### 1.6 Compliance Alerts
- **What**: A compliance/KYC exception needing action — blocked trade, sanctions match, missing docs, expiring KYC.
- **Lives in**: `src/data/compliance-alerts.json` + `mock-data.ts` (`mockComplianceAlerts`)
- **Shape**: `{ id, type: "critical"|"warning", title, clientId: string|null, client: string|null, message, action1: string, action2: string|null }`
- **Records**: 4 (one, the sanctions-match record, has `clientId: null`)
- **Used in**: consumed directly (no hook) — Compliance page

### 1.7 KYC Data
- **What**: A client's KYC/risk-review record — risk rating, KYC status, next review date, days until expiry.
- **Lives in**: `src/data/kyc-data.json` + `mock-data.ts` (`mockKYCData`)
- **Shape**: `{ id, clientId, riskRating: string, kycStatus: "success"|"error"|"hold"|"processing", nextReview: string (date), daysUntilExpiry: number }`
- **Records**: 7 — **client `110008` has no KYC record at all**
- **Used in**: consumed directly (no hook) — Compliance page, Client Hub

### 1.7a Order Requirements (per-client)
- **What**: The two stored halves of the booking gate — whether a client has declared their wealth, and whether they have acknowledged the product class.
- **Lives in**: `src/data/order-requirements.json` + `src/lib/order-mock-data.ts` (`mockClientRequirements`)
- **Shape**: `{ clientId: string, wealth: RequirementStatus, acknowledge: RequirementStatus }` where status is `"passed"|"pending"|"expired"|"missing"|"failed"`
- **Records**: 8 (one per client), spread across every status so each state is demonstrable
- **Note**: the booking form checks **four** things; the other two (`kyc`, `risk-profile`) are **deliberately absent here** — both are derived from the KYC record and the client's risk rating, and storing them would be how the two start disagreeing.
- **Used in**: `clientReadiness()` in `app/(dashboard)/orders/order-requirements.ts`

### 1.7b Order Books (bookings, submissions, requirement requests)
- **What**: Future orders an IC has booked for clients against one product, the orders sent downstream, and the requests sent to clients to go and complete their forms.
- **Lives in**: `src/data/order-books.json` + `src/lib/order-mock-data.ts` (`seedBookings`, `seedSubmissions`, `seedRequirementRequests`) — then held and mutated in `src/contexts/orders-context.tsx`
- **Shape**:
  ```
  books: [{ productId, bookings: [{ id, clientId, amount: number, daysAgo: number, status? }],
            submissions: [{ id, bookingIds: string[], daysAgo, status: "processing"|"completed"|"rejected", backendRef }] }]
  requirementRequests: [{ id, clientId, productId, keys: RequirementKey[], daysAgo, status: "sent"|"completed" }]
  ```
- **Records**: 6 books (13 bookings, 3 submissions), 2 outstanding requests — 4 on the Global Structured desk, 2 on the Thai desk (`thai-` prefixed ids)
- **Note**: every date is a `daysAgo` offset stamped from today at import, like `mockKYCData`. Currency, notional target and minimum ticket are **not** here — they are read off the product itself. The activity log is derived, not stored.
- **Used in**: `useOrderBooks()` / `useOrderBook()` in `app/(dashboard)/orders/use-order-books.ts` — `/orders`, `/orders/[productId]`, the booking modal, the header bell. See [`order-booking.md`](order-booking.md).

### 1.8 House View Strategies
- **What**: A CIO research/strategy pitch — hot issue, buy-list entry, asset-performance recap — with conviction level and matched-client count.
- **Lives in**: `src/data/house-view-strategies.json` + `mock-data.ts` (`mockHouseViewStrategies`)
- **Shape**: `{ id, name, conviction: "High"|"Medium"|"Low", convictionVariant: "green"|"yellow"|"red", targetAllocation: string, pitchHook: string, products: string[], matchedClients: number, assetClass: string, category: string, period: "monthly"|"weekly", periodLabel: string }`
- **Records**: 30, spanning weekly/monthly periods
- **Used in**: consumed directly (no hook) — House View page, Insights page

### 1.9 Performance Data
- **What**: An RM's book-level performance scorecard — YTD revenue vs. target, AUM growth, net-new-money, product penetration — plus income-by-product breakdown and an AI action plan.
- **Lives in**: `src/data/performance.json` + `mock-data.ts` (`mockPerformanceData`)
- **Shape**: single object with 4 metric sub-objects `{ value: string, target: string, progress: number, status: "Lagging"|"On Track" }`, `overallGrade: string`, `incomeByProduct: {product, revenue: number, target: number}[]` (5 rows), `aiActionPlan: string[]` (4 items)
- **Records**: 1 singleton
- **Used in**: Performance page

### 1.10 Client Details (per-client 360 record)
- **What**: The deep-dive data behind a client's Overview tab — net asset value, allocation pie, top holdings, behavioral profile, open tasks, recent activity timeline, AI priority/risk alert callouts.
- **Lives in**: `src/data/client-details.json` + `mock-data.ts` (types `ClientDetail`/`AllocationSlice`/`AllocationKpi`/`AssetAllocationSlice`/`AssetSummary`/`Holding`/`AIAlert`; export `mockClientDetails`)
- **Shape**: fully typed via `ClientDetail` in `mock-data.ts` — keyed `Record<clientId, ClientDetail>`; `assetSummary` is optional per record (only client `110001` has `allocationSlices`); `aiHighPriority`/`aiRiskAlert` nullable
- **Records**: 8 (keys `"110001"`–`"110008"`), each with ~4-5 top holdings, 3-4 tasks, 4 activity entries
- **Used in**: Client 360 Overview tab, `ClientAssetSidebarContent.tsx`, Client Hub

### 1.11 Notifications
- **What**: A notification-bell feed item — NBA ready, compliance alert, KYC warning, deal update — grouped by day.
- **Lives in**: `src/data/notifications.json` + `mock-data.ts` (`notificationGroups`)
- **Shape**: `{ label: string, items: { id, title, description, time, unread: boolean, type: "icon" }[] }[]`
- **Records**: 2 groups ("Today", "Yesterday"), 4 items total
- **Used in**: `src/app/(dashboard)/layout.tsx` — note: the actual header bell is now driven by real Notes/reminders (`calendar/use-notification-feed.tsx`), not this dataset; this JSON may be dead weight worth double-checking

### 1.12 Analysts
- **What**: Research analyst directory entries (name, title, photo).
- **Lives in**: hardcoded directly in `src/lib/mock-data.ts` — **no JSON file**
- **Shape**: `{ id: string, name: string, title: string, photo: string }`
- **Records**: 8
- **Used in**: Insights page's "Analyst Contact" / Research tab

---

## 2. Client 360 ancillary data

`.ts` generator files in `src/data/` — not raw JSON, but functions/lookup maps that produce the data.

### 2.1 Call Log Entries
- **What**: A phone-call history entry for a client — date, direction, duration, summary.
- **Lives in**: `src/data/call-log-data.ts` (`CallLogEntry` type, `CALL_LOG_DATA` map, `getCallLogs()` helper, `DEFAULT_LOGS` fallback)
- **Shape**: `{ id, date: string, time: string, duration: string, direction: "inbound"|"outbound", summary: string }`
- **Records**: 5 clients have explicit logs (13 entries total); the other 3 clients fall back to 4 shared `DEFAULT_LOGS` entries
- **Used in**: Client 360 Call Log tab, Client Hub quick view

### 2.2 Client Profiles
- **What**: A client's personal/demographic record — phone, email, birthday, address, occupation, family members, risk profile, referral source.
- **Lives in**: `src/data/client-profiles.ts` (`ClientProfile` type, `PROFILES` map, `DEFAULT_PROFILE` fallback, `getClientProfile()`)
- **Shape**: `{ phone, email, lineId?, birthday, age: number, nationality, address, occupation, company, riskProfile, relationshipSince, referredBy?, familyMembers?: {relation, name}[] }`
- **Records**: 8 profiles + 1 default fallback
- **Used in**: KYC tab, holder contact card (Calendar alerts)

### 2.3 Liabilities Detail
- **What**: A client's liabilities breakdown (debt, payables, receivables, short positions) as categories + line items, scaled proportionally from a client's total liabilities figure.
- **Lives in**: `src/data/liabilities-details.ts` (types + `BASE_CATEGORIES`/`BASE_SUB_ITEMS`/`BASE_TOTAL` template + `getLiabilitiesDetail(totalAmount, lastUpdated)` generator)
- **Shape**: `{ categories: { id, label, percent: number, color: string, subItems: {label, amount: string}[] }[], lastUpdated: string }`
- **Records**: not record-based — 1 hardcoded template (4 categories, 7 sub-items) algorithmically rescaled at call time to whatever total is passed in
- **Used in**: Client asset sidebar, Liabilities detail modal

### 2.4 Asset Account Details / Holdings
- **What**: A client's brokerage sub-accounts (Cash, Global, Margin, Derivative, Fixed Income…) and, per account, the individual security/fund holdings with quantity, cost, market value.
- **Lives in**: `src/data/asset-account-details.ts` (`AssetAccountItem`/`HoldingItem`/`HoldingSection`/`AssetAccountDetail`/`PositionSummary` types; `DEFAULT_ASSET_ACCOUNTS`; `ASSET_ACCOUNT_DETAILS` keyed by account number; `ASSET_PRODUCT_DETAILS` keyed by asset-class label; `computePosition()` derives avg cost/current price)
- **Shape**: `AssetAccountItem = { name, accountNo, value: string, changeAmount?, changePercent?, changePositive?, avgYield?, statusIcon }`; `HoldingItem = { id, symbol, fullName, value, changeAmount, changePercent, changePositive, collateral?, quantity?, position? }`
- **Records**: 7 default accounts; 7 account numbers with detail (~16 holding line items total); 6 asset-class buckets
- **Used in**: `AssetAccountCard`, `AssetAccountDetailModal`, `HoldingDetailContent`, Client Hub quick view

### 2.5 Product Sub-Data
- **What**: For one asset-class product (e.g. "หุ้นไทย"), the list of specific tickers/instruments held, with client-count and total THB invested — feeds the Client Hub Product view drill-down.
- **Lives in**: `src/data/product-sub-data.ts` (`SubProduct` type, `PRODUCT_SUB_DATA` map)
- **Shape**: `{ id, name, ticker?, clientCount: number, totalAmountThb: number }`
- **Records**: 7 asset-class buckets, ~33 sub-product rows total (cash bucket intentionally empty)
- **Used in**: `client-hub/ProductDetailDrawer.tsx`

---

## 3. Product catalog data

Raw JSON + a companion shaping `.ts` file, both under `src/app/(dashboard)/client/[id]/`.

### 3.1 Investment Solutions
- **What**: A pre-packaged investment-solution tier (Secure Income / Balanced Growth / High Conviction) shown as hero cards.
- **Lives in**: `src/data/investment-solutions.json` + `client/[id]/investment-solution-data.ts` (adds UI-only gradient/layout constants not from JSON)
- **Shape**: raw `{ id, name, desc, couponRange: string, tenor: string, heroImage, showCoupon: boolean }`
- **Records**: 3
- **Used in**: Investment solution detail page

### 3.2 Top Ideas (sector themes)
- **What**: Sector "hot theme" tiles on the product-catalog home strip and "all" grid.
- **Lives in**: `src/data/top-ideas.json` + `client/[id]/top-idea-data.ts`
- **Shape**: `meta: {maxCoupon, updatedAt, updatedAtMobile}`, `sectors: {id, theme, subtitle}[]`, `homeStrip: string[]` (sector ids), `allGrid: string[]` (sector ids, with repeats)
- **Records**: 5 sectors (home strip and all-grid just repeat these 5 ids)
- **Used in**: `TopIdeaCard`, `TopIdeaDetail`

### 3.3 Structured Products
- **What**: A structured note/FCN product offer — underlying basket, coupon, KO/strike/KI barriers, tenor, notional size.
- **Lives in**: `src/data/structured-products.json` + `client/[id]/structured-product-data.ts`
- **Shape**: fully typed `StructuredProduct = { id, underlying, coupon: string, tenor, ko, strike, ki, tags: string[], logos: string[], offerDate, couponPeriod, detailTenor, productName, productType, currency, minInvestment, updatedAt, requestNotionalSize?, confirmedRequest?, issuer?, underlyingNames?, underlyingSectors? }`
- **Records**: 17 distinct raw records (topPicks 3 + products 5 + allProductsBase 5 + topIdeaDetailBase 4). ⚠️ `meta.allCount: 328` is display-only — the frontend synthesizes larger lists (12/20/20 items) by **cloning** base records under new ids. Real inventory is 17, not 328.
- **Used in**: `StructuredProductCard`, `StructuredProductDetail`, `StructuredProductAllPage`, Thai structured product table

### 3.4 Global (Overseas) Bonds
- **What**: A US/global corporate-bond issuer (Apple, Microsoft, Meta, Amazon, Coca-Cola, Amex, Nvidia, Walmart) and its bond line items — ISIN, coupon, price, yield, duration.
- **Lives in**: `src/data/global-bonds.json` + `client/[id]/global-bond-data.ts`
- **Shape**: typed via `GlobalBondIssuer`/`GlobalBondRow`/`DetailRecommendedCard`
- **Records**: 8 issuers (~17 raw bond rows). ⚠️ `meta.allOverseasBondsCount: 100` is also display-only — 14 template rows are **cycled/repeated** to synthesize 100 rows (`aob-1`..`aob-100`). Real inventory is ~17, not 100.
- **Used in**: `GlobalBondAllPage` and detail components

### 3.5 Fixed Income (Thai bonds)
- **What**: A Thai corporate bond offering (primary or secondary market) — coupon, YTM, tenor, credit rating, subscription window — plus the issuing company profile.
- **Lives in**: `src/data/fixed-income.json` + `client/[id]/fixed-income-data.ts`
- **Shape**: typed via `FixedIncomeBond`/`FixedIncomeCompany`
- **Records**: 14 primary-market bonds, 2 secondary-market bonds, 3 full company records (though `companyOrder` lists 8 tickers — 5 have no company record behind them)
- **Used in**: `FixedIncomeTab` and filter/detail components

---

## 4. Mock data embedded directly in page/component files

These never made it into `src/data/` — they're inline arrays/objects living in the page or component that renders them. Several files literally comment that this is placeholder data waiting on a real endpoint.

| # | What | Lives in | Records |
|---|---|---|---|
| 4.1 | Calendar market feeds — SET corporate actions (XD/XW/XT/…) against a symbol, the desk's own dated events (seminar, promotion, deadline, …), and the Thai market holiday calendar | `calendar/mock-market-feed.ts` (`marketFeed(anchorMonth)`, `holidaysByDay(viewDate)`); contract types in `calendar/market-feed.ts`; holidays in `src/data/market-holidays.json` | 26 corporate actions + 6 events **per month**, generated into whichever month is being viewed from fixed days-of-month, not stored dates. Holidays are real stored dates — 15 fixed-date entries applied to any year, plus per-year lunar entries for 2026/2027, plus substitution days computed for any that land on a weekend. See 4.1a below |
| 4.2 | Command Center: automation log, KPI tiles, client intelligence briefings | `command-center/command-center-data.ts` (`automationLog`, `kpiItems`, `clientIntelligenceMap`) | 5 log entries, 4 KPI tiles, 4 client briefings — **⚠️ `clientIntelligenceMap` is keyed `"1"`–`"4"`, not real client ids `110001`+, so it doesn't line up with any client automatically** |
| 4.3 | Performance page: gap-to-target tiles, AI action steps | `performance/performance-data.ts` (`GAP_ITEMS`, `AI_STEPS`) | 3 gap items, 3 AI steps |
| 4.4 | House View: CIO stances, investment themes, per-strategy sales playbook | `house-view/house-view-data.ts` (`STANCES`, `THEMES`, `STRATEGY_DETAIL`) | 6 stances, 4 themes, playbooks for 4 strategy ids |
| 4.5 | Important compliance forms checklist (Wealth Declaration, FATCA/CRS, W-8BEN, Suitability Test, etc.) | `client/[id]/client-detail-data.ts` (`IMPORTANT_FORMS`) | 6 forms — **same 6 shown for every client**, not actually per-client despite living in a per-client-page file |
| 4.6 | Pipeline stage-advance checklist | `pipeline/pipeline-data.ts` (`ADVANCE_CHECKLIST`) | 4 stages × 3 items = 12 |
| 4.7 | Compliance page KPI tiles + alert timestamps | `compliance/KpiBar.tsx`, `compliance/AlertCards.tsx` (`ALERT_TIMESTAMPS`) | 4 KPI tiles, 4 timestamp strings |
| 4.8 | AI Insights page: KPI tiles, AI summary card, model-confidence stats, tab counts | `ai-insights/page.tsx` (inline arrays) | 4 KPI tiles, 4 model-stat rows, 5 tabs |
| 4.9 | Research: category taxonomy, landing tiles, research report list | `insights/Research.tsx` (`RESEARCH_CATS`, `MOCK_RESEARCH`, `RESEARCH_LANDING_TILES`) | 20 categories, 23 reports, 14 landing tiles — every report links to the same placeholder PDF at `/mock-reports/sample-report.pdf` |

### 4.1a Calendar market feeds — notes for whoever builds the endpoint

Three feeds, and they are deliberately three rather than one; see the header of `calendar/market-feed.ts` for the full reasoning. The short version:

- **`corporateActions`** — `{id, date, kind, symbol, name?, detail?, record?, clientIds?}`. `date` is `YYYY-MM-DD` read as a **local Bangkok calendar day**, not an instant: an X-date is a whole day, and an ISO timestamp drifts it across midnight. `record` is the sheet the action opens into, as **groups of `{label, value}`** — the UI draws a rule between groups and never inside one, so the grouping is the separator's only source. The mock sends the six-group dividend sheet Figma drew (node 24635:107155) for XD and the two-group date sheet for everything else. `name` is the issuer's legal name for the sheet's header.
- **`events`** — `{id, date, category, title, detail?, facts?, clientIds?}`. The desk's own dated things: seminars, campaigns, subscription deadlines. `facts` is a flat list here — the UI wraps it into one group.
- **`holidays`** — `{id, date, name, market, substitute?}`. `market` distinguishes a SET closure from a bank one. A holiday is **not** a row on anyone's list: it has nothing to open, so the frontend keys it by day and uses it to tint the cell rather than queueing it behind reminders.

⚠️ **`clientIds` on a corporate action is not rendered as a holder list.** An XD is a fact about a company; the record sheet it opens says nothing about who owns what. The field exists so the desk's *personal* surfaces — the header bell, a client's Reminders tab, the Dashboard queue — can decide whether the action is worth raising at all (`concernsSomeone` in `day-items`, which drops anything naming nobody). Desk **events** do show their people, because "who is this for" is the question you open a seminar to answer.

⚠️ **`kind` and `category` are open-ended strings, not enums.** SET publishes eleven corporate-action codes today and the desk's event types are whatever the backend defines. The frontend resolves a colour, a label and an icon for *anything* that arrives (`calendar/market-taxonomy.tsx`), so adding a code server-side needs no frontend release. Don't constrain them to the values the mock happens to emit — the mock deliberately includes one unknown code (`XC`) and one unknown category (`quarterly-briefing`) to keep that path exercised.

⚠️ **The lunar holiday dates are placeholders.** Thailand's fixed-date holidays in `market-holidays.json` are correct for any year. Makha Bucha, Visakha Bucha, Asalha Bucha and Buddhist Lent follow the lunar calendar and are announced per year — the entries under `byYear` are plausible stand-ins, not an authority. Use SET's own published holiday list.

**Filtering**: the Calendar's toolbar has a dropdown (`calendar/CalendarFilter.tsx`) that switches each layer off — company events, events, holidays, reminders — plus each corporate-action code and event category inside the first two. It stores what is **hidden**, never what is shown, so a code the backend adds later starts visible instead of being silently swallowed; and it offers the union of the taxonomy's known codes and whatever the feed actually sent this month, so a row you can see is always a row you can switch off.

**History**: this replaced `calendar/mock-alerts.ts`, which faked the same thing in prose ("PTT — ex-dividend") rather than in the exchange's taxonomy. Those three dividends are still here as `XD` rows, now with the full record sheet behind them.

---

## 5. Notes — the one writable dataset

Everything above is static and read-only. Notes is the exception: it is created by the user at runtime, so it is the one dataset with no JSON file behind it.

- **What**: A free-text note an RM/IC writes, optionally tagged to one or more clients (or none, for a general note), with an optional reminder date.
- **Lives in**: `useNotes()` / `NotesProvider` in `src/contexts/notes-context.tsx` — React state, and nothing else.
- **Shape**: the `Note` type in `src/types/domain.ts`:
  ```
  { id: string, clientIds: string[],
    title: string|null, body: string, author: string,
    createdAt: string, updatedAt: string,
    reminderAt: string|null, reminderDone: boolean }
  ```
- **Records**: **0 seeded.** Starts empty and holds only what gets created during the session; a page reload clears it.
- **Designing the real endpoint**: `NotesProvider` exposes `addNote` / `editNote` / `removeNote`, all `async` and all awaited by their callers, so they can become HTTP calls without touching a single screen. Its `isLoading` is currently hardcoded `false`; making it true during a fetch is what brings the notes skeletons back (see `useStatic` in `src/hooks/use-api.ts` for the same seam on the read-only datasets).
- **History worth knowing**: this used to run against a mock `/api/mock/*` route backed by an in-process store (or Vercel KV if configured). That route also technically served `nba-actions`, `pipeline-deals` and `mini-kanbans`, but nothing ever seeded them, so it answered those three with an **empty list** — which the frontend then rendered over the JSON it had started from. Removing the route fixed that: those screens now show the JSON in this doc.

---

## Gotchas worth knowing before building the real API

- **Only two things are wired to any kind of live backend today**: `clients` (via the mock route, seeded) and `notes` (via the mock route, fully dynamic). Everything else in this doc is imported directly into components — no fetch, no loading state, nothing to replace at the network layer beyond swapping the import.
- **Displayed "total count" fields don't reflect real record counts** in two datasets: Structured Products (`meta.allCount: 328` vs. 17 real records) and Global Bonds (`meta.allOverseasBondsCount: 100` vs. ~17 real records) — the frontend clones/cycles the real records to pad out lists for pagination demos. Don't build an endpoint that promises 328 or 100 rows; build one that returns the real inventory.
- **`clientIntelligenceMap` (Command Center) uses fake keys** (`"1"`–`"4"`) instead of real client ids (`110001`+) — flag this with whoever owns that feature before an endpoint gets built around it, since right now it isn't actually looked up by any real client.
- **Some "per-client" data isn't actually per-client**: `IMPORTANT_FORMS` (compliance forms checklist) shows the identical 6 forms for every client despite living in a per-client-page file.
- **Client id format is consistently the 6-digit string** (`"110001"`–`"110008"`) everywhere except the Command Center exception above.
- Several JSON files carry a `meta.updatedAt`-style "freshness" timestamp that's just static display text, not derived from the records (Fixed Income, Global Bonds, Structured Products, Top Ideas) — the real API will need an actual "last synced" value here.
