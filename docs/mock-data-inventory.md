# Mock Data Inventory

This app runs entirely on mock data — there is no backend behind any of it. This doc catalogs every distinct piece of mock data in the codebase so whoever builds the real API knows what data models to design endpoints around.

Scope note: this doc is the ground truth of what data exists; the API design is a separate exercise. (There was once an `public/openapi.yaml` sketch, a Swagger page at `/api-docs`, a `/admin` data studio and a mock `/api/mock/*` route. All four have been removed. Nothing in the app calls `fetch` today.)

**How screens read this data**: never directly. Every dataset reaches a screen through a hook that returns `Resource<T> = { data, isLoading }` (see [`handover.md`](handover.md) → "ต่อ API"), or through one of the three writable stores in §5. Each entry's **Used in** line names that hook where one exists.

**Prefer plain JSON?** [`mock-json/`](mock-json/) holds every dataset as a standalone `.json` file — copies of `src/mocks/*.json` plus the inline TS data extracted to JSON. See [`mock-json/README.md`](mock-json/README.md). It is a **snapshot** (last synced 2026-11-17): when it and `src/mocks/` disagree, `src/mocks/` wins.

## How to read each entry

- **What**: one-line business meaning
- **Lives in**: exact file path(s)
- **Shape**: fields and types
- **Records**: how much mock data exists today
- **Used in**: where in the app it's read

---

## 1. Core dashboard data

Raw JSON in `src/mocks/*.json`, reshaped/typed by `src/mocks/mock-data.ts` (or a sibling `src/mocks/*-mock-data.ts`). Target types live in `src/types/*.ts`, one module per domain.

### 1.1 Clients

- **What**: A book-of-business row — one wealth-management client's tier, AUM, cash-idle %, YTD P&L, AI score, status, risk profile.
- **Lives in**: `src/mocks/clients.json` (raw) + `src/mocks/mock-data.ts` (`mockClients`)
- **Shape**:
  ```
  { id: string, name: string, tier: string, membershipTier: string,
    aum: number (THB), cashIdlePct: number, plYtdPct: number (percent),
    aiScore: number, status: "success"|"error"|"hold"|"processing",
    lastContact: string, riskProfile: string,
    advisoryAccounts: { robo: string, definit: string } }
  ```
  Numbers are raw values, formatted at render (`formatAumThb`, `formatPlYtdPct`). `lastContact` is the one display string left — nothing reads it this phase; see [`phase-scope.md`](phase-scope.md).
- **Records**: 8 clients (ids `110001`–`110008`)
- **Used in**: `useClients()` / `useClientsResource()` in `src/features/clients/hooks/use-clients.ts` — everywhere client info shows up. Every other dataset joins its `clientId` to a name from this file.

### 1.2 NBA (Next-Best-Action) Actions

- **What**: An AI-drafted outreach recommendation for one client (insight, draft message, suggested action, revenue impact).
- **Lives in**: `src/mocks/nba-actions.json` + `mock-data.ts` (`mockNBAActions`)
- **Shape**: `{ id, clientId, tier, priority, priorityVariant: "red"|"yellow"|"blue", insight, aiDraft, action, revenueImpact }` (all strings)
- **Records**: 4 actions — only for clients `110001`, `110002`, `110004`, `110005`
- **Used in**: `useNBAActions()` — Command Center, `/command-center/next-best-actions`

### 1.3 Pipeline Deals

- **What**: One active sales opportunity in an RM's pipeline for a client.
- **Lives in**: `src/mocks/pipeline-deals.json` + `mock-data.ts` (`mockPipelineDeals`)
- **Shape**: `{ id, clientId, product, dealSize: string, probability: number, stage: string, daysInStage: number, stalled: boolean }`
- **Records**: 10 deals across 7 clients
- **Used in**: `usePipelineDeals()` — Pipeline board

### 1.4 Mini Kanban

- **What**: A condensed deal card for the Command Center's mini-kanban widget.
- **Lives in**: `src/mocks/mini-kanban.json` + `mock-data.ts` (`mockMiniKanban`)
- **Shape**: `{ id, clientId, dealName, dealSize: string, stage: string }`
- **Records**: 4 items
- **Used in**: `useMiniKanban()` — Command Center

### 1.5 Insights (AI feed)

- **What**: An AI-generated insight about a client — product match, risk alert, engagement drop, portfolio note — with a confidence score.
- **Lives in**: `src/mocks/insights.json` + `mock-data.ts` (`mockInsights`)
- **Shape**: `{ id, type: string, clientId, tier, insight: string, confidence: number, revenueImpact: string, category: string }`
- **Records**: 8 (one per client)
- **Used in**: ⚠️ **no hook** — imported directly by `ai-insights/page.tsx` and `ai-insights/insight-config.ts`. Give it a hook before wiring an endpoint.

### 1.6 Compliance Alerts

- **What**: A compliance/KYC exception needing action — blocked trade, sanctions match, missing docs, expiring KYC.
- **Lives in**: `src/mocks/compliance-alerts.json` + `mock-data.ts` (`mockComplianceAlerts`)
- **Shape**: `{ id, type: "critical"|"warning", title, clientId: string|null, client: string|null, message, action1: string, action2: string|null }`
- **Records**: 4 (the sanctions-match record has `clientId: null`)
- **Used in**: ⚠️ **no hook** — `compliance/compliance-data.ts`, `AlertCards.tsx`, `KycDetailPanel.tsx`

### 1.7 KYC Data

- **What**: A client's KYC/risk-review record — risk rating, KYC status, next review date, days until expiry.
- **Lives in**: `src/mocks/kyc-data.json` + `mock-data.ts` (`mockKYCData`)
- **Shape**: `{ id, clientId, riskRating: string, kycStatus: "success"|"error"|"hold"|"processing", nextReview: string (date), daysUntilExpiry: number }` — the raw JSON stores only the `daysUntilExpiry` offset; `nextReview` is stamped from it at import. The real API should send `nextReview` (ISO day) and let the UI derive the countdown.
- **Records**: 7 — **client `110008` has no KYC record at all**
- **Used in**: ⚠️ **no hook**, and the widest reach of any dataset — Compliance page, Client Hub, Client 360 (KYC countdown), the header bell's KYC rows, order readiness (`order-requirements.ts`), and the campaign and risk seeds. One dataset, many readers: wire it once, through a hook, before any of them.

### 1.7a Order Requirements (per-client)

- **What**: The two stored halves of the booking gate — whether a client has declared their wealth, and whether they have acknowledged the product class.
- **Lives in**: `src/mocks/order-requirements.json` + `src/mocks/order-mock-data.ts` (`mockClientRequirements`)
- **Shape**: `{ clientId: string, wealth: RequirementStatus, acknowledge: RequirementStatus }` where status is `"passed"|"pending"|"expired"|"missing"|"failed"`
- **Records**: 8 (one per client), spread across every status so each state is demonstrable
- **Note**: the booking form checks **four** things; the other two (`kyc`, `risk-profile`) are **deliberately absent here** — both are derived from the KYC record and the client's risk rating, and storing them would be how the two start disagreeing.
- **Used in**: `clientReadiness()` in `app/(dashboard)/orders/order-requirements.ts`

### 1.7b Order Books (bookings, submissions, proposals, requirement requests)

- **What**: Orders an IC has booked for clients against one product, the orders sent downstream, the offers sent to clients, and the requests sent to clients to go and complete their forms.
- **Lives in**: `src/mocks/order-books.json` + `src/mocks/order-mock-data.ts` (`seedBookings`, `seedSubmissions`, `seedProposals`, `seedOfferedProposals`, `seedRequirementRequests`) — then held and mutated in `src/features/orders/store/orders-context.tsx` (§5.2)
- **Shape**:
  ```
  books: [{ productId,
            bookings:    [{ id, clientId, amount: number, daysAgo: number, status? }],
            submissions: [{ id, bookingIds: string[], daysAgo, status: "processing"|"completed"|"rejected", backendRef }],
            proposals?:  [...] }]
  requirementRequests: [{ id, clientId, productId, keys: RequirementKey[], daysAgo, status: "sent"|"completed" }]
  ```
- **Records**: 34 books — 15 Global Structured, 15 Thai Structured (`thai-`), 2 Fixed Income (`fi-`), 2 Global Bond (`gb-`) — holding 76 bookings, 24 submissions and 7 proposals; plus 5 requirement requests
- **Note**: every date is a `daysAgo` offset stamped from today at import. Currency, notional target and minimum ticket are **not** here — they are read off the product itself. The activity log is derived, not stored.
- **Used in**: `use-order-books.ts` (9 hooks) — `/orders`, `/orders/client/[clientId]`, product pages, the booking modal, the header bell. See [`order-booking.md`](order-booking.md).

### 1.7c Transactions (Stock · TFEX · Mutual Fund)

- **What**: A client's buy/sell transactions through the trading platforms — read-only, shown on Order Management's transaction tabs.
- **Lives in**: `src/mocks/transaction-mock-data.ts` — **generated**, no JSON. A fixed-seed sequence over the catalogue's products and the mock clients, so every symbol and name on screen is one the rest of the app knows.
- **Shape**: `ClientTransaction` in `src/types/transaction.ts`
- **Used in**: `useTransactions(asset)` in `orders/use-transactions.ts` — the only reader; nothing imports the mock file directly.

### 1.8 House View Strategies

- **What**: A CIO research/strategy pitch — hot issue, buy-list entry, asset-performance recap — with conviction level and matched-client count.
- **Lives in**: `src/mocks/house-view-strategies.json` + `mock-data.ts` (`mockHouseViewStrategies`)
- **Shape**: `{ id, name, conviction: "High"|"Medium"|"Low", convictionVariant: "green"|"yellow"|"red", targetAllocation: string, pitchHook: string, products: string[], matchedClients: number, assetClass: string, category: string, period: "monthly"|"weekly", periodLabel: string }`
- **Records**: 30, spanning weekly/monthly periods
- **Used in**: `useInsightStrategies()` / `useInsightStrategy(id)` in `use-catalog.ts` — `/insights`, `/insights/[id]`. Also read directly by `command-center/dashboard-data.ts` (house view → product joins) and `page-breadcrumbs.ts`.

### 1.9 Performance Data

- **What**: An RM's book-level scorecard — YTD revenue vs. target, AUM growth, net-new-money, product penetration — plus income-by-product breakdown and an AI action plan.
- **Lives in**: `src/mocks/performance.json` + `mock-data.ts` (`mockPerformanceData`)
- **Shape**: single object with 4 metric sub-objects `{ value: string, target: string, progress: number, status: "Lagging"|"On Track" }`, `overallGrade: string`, `incomeByProduct: {product, revenue: number, target: number}[]` (5 rows), `aiActionPlan: string[]` (4 items)
- **Records**: 1 singleton
- **Used in**: nothing visible — `/performance` renders a Coming-soon placeholder. `KpiRow` / `MainColumn` / `DarkSidebar` read this data but are not mounted. Not needed this phase.

### 1.10 Client Details (per-client 360 record)

- **What**: The deep-dive data behind a client's Overview tab — net asset value, allocation pie, top holdings, behavioral profile, open tasks, recent activity timeline, AI priority/risk alert callouts.
- **Lives in**: `src/mocks/client-details.json` + `mock-data.ts` (`mockClientDetails`; typed by `ClientDetail` in `src/types/client.ts`)
- **Shape**: keyed `Record<clientId, ClientDetail>`; `assetSummary` is optional per record; `aiHighPriority`/`aiRiskAlert` nullable
- **Records**: 8 (keys `"110001"`–`"110008"`)
- **Used in**: Client 360 Overview tab, `ClientAssetSidebarContent.tsx`, Client Hub

### 1.11 Notifications — unreferenced

- **What**: A notification-bell feed item grouped by day.
- **Lives in**: `src/mocks/notifications.json` + `mock-data.ts` (`notificationGroups`)
- **Records**: 2 groups, 4 items
- **Used in**: **nothing.** The header bell in `layout.tsx` builds its own `notificationGroups` from live feeds — KYC expiries, reminders, and order events (`orders/use-order-notification-feed.tsx`). The export in `mock-data.ts` has no importer. Don't build an endpoint for this shape.

### 1.12 Analysts

- **What**: Research analyst directory entries (name, title, photo).
- **Lives in**: hardcoded in `src/mocks/mock-data.ts` (`mockAnalysts`) — **no JSON file**
- **Shape**: `{ id: string, name: string, title: string, photo: string }`
- **Records**: 8
- **Used in**: bundled with research reports as `RESEARCH_FEED` in `insights/research-data.ts` → `useResearch()`; also `insights/[id]/InsightDetail.tsx`

### 1.13 Risk & Compliance Alerts

- **What**: A rule-based finding on a client's account — margin call, force sell, overdue settlement, concentration, expired suitability, price band, wash trade — with a due date, metrics and a recommended action.
- **Lives in**: `src/mocks/risk-alerts.json` + `src/mocks/risk-mock-data.ts` (`mockRiskAlerts`)
- **Shape**: `RiskAlert` in `src/types/risk-alert.ts`. Raw: `{ id, kind, severity, ruleCode, clientId, accountLabel, title, message, metrics, recommendedAction, contactAllowed, contactNote, dismissible, detectedMinutesAgo, dueOffset }`
- **Records**: 12 across 10 kinds
- **Note**: two offsets in two units on purpose — `dueOffset` in **days** (a deadline is a date), `detectedMinutesAgo` in **minutes** (a detection is a span). The real API sends `dueDate` and a detection timestamp; `daysLeft` is computed client-side.
- **Used in**: `useRiskAlertsResource()` / `useRiskAlert(id)` in `src/features/command-center/hooks/use-risk-alerts.ts` — Command Center risk panel, `/command-center/risk-alerts`

---

## 2. Client 360 ancillary data

`.ts` generator files in `src/mocks/` — not raw JSON, but functions/lookup maps that produce the data.

### 2.1 Call Log Entries

- **What**: A phone-call history entry for a client — date, direction, duration, summary.
- **Lives in**: `src/mocks/call-log-data.ts` (`CallLogEntry` type, `CALL_LOG_DATA` map, `getCallLogs()` helper, `DEFAULT_LOGS` fallback)
- **Shape**: `{ id, date: string, time: string, duration: string, direction: "inbound"|"outbound", summary: string }`
- **Records**: 5 clients have explicit logs (13 entries total); the other 3 fall back to 4 shared `DEFAULT_LOGS` entries
- **Used in**: `useClientCallLogs(clientId)` — Client 360 Call Log tab, Client Hub quick view. ⚠️ The Command Center call-log panel bypasses the hook: `command-center/call-log-feed.ts` reads `CALL_LOG_DATA` directly (to skip the `DEFAULT_LOGS` fallback), so give it its own hook when wiring an endpoint.

### 2.2 Client Profiles

- **What**: A client's personal/demographic record — phone, email, birthday, address, occupation, family members, risk profile, referral source.
- **Lives in**: `src/mocks/client-profiles.ts` (`ClientProfile` type, `PROFILES` map, `DEFAULT_PROFILE` fallback, `getClientProfile()`)
- **Shape**: `{ phone, email, lineId?, birthday, age: number, nationality, address, occupation, company, riskProfile, relationshipSince, referredBy?, familyMembers?: {relation, name}[] }`
- **Records**: 8 profiles + 1 default fallback
- **Used in**: `useClientProfile(clientId)` — KYC tab. ⚠️ Holder contact cards (`calendar/HolderContact.tsx`, used by Calendar, Reminders, KYC alerts, risk alerts) and the order screens call `getClientProfile()` directly, bypassing the hook.

### 2.3 Liabilities Detail

- **What**: A client's liabilities breakdown (debt, payables, receivables, short positions) as categories + line items, scaled proportionally from a client's total liabilities figure.
- **Lives in**: `src/mocks/liabilities-details.ts` (`BASE_CATEGORIES`/`BASE_SUB_ITEMS`/`BASE_TOTAL` template + `getLiabilitiesDetail(totalAmount, lastUpdated)` generator)
- **Shape**: `{ categories: { id, label, percent: number, color: string, subItems: {label, amount: string}[] }[], lastUpdated: string }`
- **Records**: not record-based — 1 template (4 categories, 7 sub-items) rescaled at call time
- **Used in**: Client asset sidebar, Liabilities detail modal

### 2.4 Asset Account Details / Holdings

- **What**: A client's brokerage sub-accounts (Cash, Global, Margin, Derivative, Fixed Income…) and, per account, the individual holdings with quantity, cost, market value.
- **Lives in**: `src/mocks/asset-account-details.ts` (`DEFAULT_ASSET_ACCOUNTS`; `ASSET_ACCOUNT_DETAILS` keyed by account number; `ASSET_PRODUCT_DETAILS` keyed by asset-class label; `computePosition()` derives avg cost/current price)
- **Shape**: `AssetAccountItem = { name, accountNo, value: string, changeAmount?, changePercent?, changePositive?, avgYield?, statusIcon }`; `HoldingItem = { id, symbol, fullName, value, changeAmount, changePercent, changePositive, collateral?, quantity?, position? }`
- **Records**: 7 default accounts — **the same 7 for every client** (`useClientAssetAccounts` ignores its `clientId`); 7 account numbers with detail; 6 asset-class buckets
- **Used in**: `useClientAssetAccounts(clientId)`, `AssetAccountCard`, `AssetAccountDetailModal`, `HoldingDetailContent`

### 2.5 Product Sub-Data

- **What**: For one asset class (e.g. "หุ้นไทย"), the specific instruments held across the book, with client count and total THB invested.
- **Lives in**: `src/mocks/product-sub-data.ts` (`SubProduct` type, `PRODUCT_SUB_DATA` map)
- **Shape**: `{ id, name, ticker?, clientCount: number, totalAmountThb: number }`
- **Records**: 7 asset-class buckets, ~33 rows (cash bucket intentionally empty)
- **Used in**: `client-hub/ProductDetailDrawer.tsx`

---

## 3. Product catalog data

Raw JSON in `src/mocks/` (where one exists) plus a shaping `.ts` file under `src/features/catalog/<product>/lib/`. Every dataset here is served by an endpoint in `src/features/catalog/api/catalog.api.ts` and read through `src/features/catalog/hooks/use-catalog.ts`.

### 3.1 Investment Solutions

- **What**: A pre-packaged investment-solution tier (Secure Income / Balanced Growth / High Conviction).
- **Lives in**: `src/mocks/investment-solutions.json` + `investment-solution-data.ts` (adds UI-only gradient/layout constants)
- **Shape**: raw `{ id, name, desc, couponRange: string, tenor: string, heroImage, showCoupon: boolean }`
- **Records**: 3
- **Used in**: `useInvestmentSolution(id)`

### 3.2 Top Ideas (sector themes)

- **What**: Sector "hot theme" tiles on the catalogue home strip and "all" grid.
- **Lives in**: `src/mocks/top-ideas.json` + `top-idea-data.ts`
- **Shape**: `meta: {maxCoupon, updatedAt, updatedAtMobile}`, `sectors: {id, theme, subtitle}[]`, `homeStrip: string[]`, `allGrid: string[]` (sector ids, with repeats)
- **Records**: 5 sectors
- **Used in**: `useTopIdeas()`, `useTopIdeaProducts(sector)`

### 3.3 Structured Products (Global)

- **What**: A structured note/FCN offer — underlying basket, coupon, KO/strike/KI barriers, tenor, notional size.
- **Lives in**: `src/mocks/structured-products.json` + `structured-product-data.ts`
- **Shape**: `StructuredProduct = { id, underlying, coupon: string, tenor, ko, strike, ki, tags: string[], logos: string[], offerDate, couponPeriod, detailTenor, productName, productType, currency, minInvestment, updatedAt, requestNotionalSize?, confirmedRequest?, issuer?, underlyingNames?, underlyingSectors? }`
- **Records**: 20 distinct raw records (topPicks 3 + products 7 + allProductsBase 5 + topIdeaDetailBase 5). ⚠️ `meta.allCount: 328` is display-only — larger lists are synthesized by **cloning** base records under new ids.
- **Used in**: `useStructuredProducts()`, `useStructuredProduct(id)`; bookable (basket desk) — see `order-booking.md`

### 3.3a Thai Structured Products

- **What**: Thai-desk structured notes grouped by theme.
- **Lives in**: `thai-structured-data.ts` — **inline TS, no JSON**
- **Note**: rows carry no minimum ticket or notional; both are constants (`THAI_MIN_TICKET`, `THAI_NOTIONAL`) next to the rows. The real API should send them per product.
- **Used in**: `useThaiStructuredProducts()`, `useThaiStructuredProduct(theme)`; bookable (basket desk, `thai-` ids)

### 3.4 Global (Overseas) Bonds

- **What**: A US/global corporate-bond issuer (Apple, Microsoft, Meta, Amazon, Coca-Cola, Amex, Nvidia, Walmart) and its bond lines — ISIN, coupon, price, yield, duration.
- **Lives in**: `src/mocks/global-bonds.json` + `global-bond-data.ts`
- **Shape**: `GlobalBondIssuer` / `GlobalBondRow` / `DetailRecommendedCard`
- **Records**: 8 issuers, 5 top-pick rows, 15 seed rows. ⚠️ `meta.allOverseasBondsCount: 100` is display-only — the 15 seed rows are **cycled** into 100 (`ALL_OVERSEAS_BONDS`). `GLOBAL_BOND_ISSUERS` is a `Record` keyed by id, not a collection.
- **Used in**: `useOverseasBonds()`, `useGlobalBondIssuer(id)`; bookable (quota desk, `gb-` ids)

### 3.5 Fixed Income (Thai bonds)

- **What**: A Thai corporate bond offering (primary or secondary market) — coupon, YTM, tenor, rating, subscription window — plus the issuing company profile.
- **Lives in**: `src/mocks/fixed-income.json` + `fixed-income-data.ts`
- **Shape**: `FixedIncomeBond` / `FixedIncomeCompany`
- **Records**: 14 primary-market bonds, 2 secondary-market, 3 company records (`companyOrder` lists 8 tickers — `resolveFixedIncomeCompany` **synthesizes** the missing 5 from their bonds)
- **Used in**: `useFixedIncomeBonds()`, `useFixedIncomeBond(id)`, `useFixedIncomeCompanyDetail(id)`; bookable (quota desk, `fi-` ids, only bonds with `action: "invest"`)

### 3.6 Mutual Funds

- **What**: The fund universe by category, top performers, fund insights, themed collections, per-fund detail and NAV history, tax-planning tools.
- **Lives in**: `src/mocks/mutual-funds.json` + `src/mocks/mutual-fund-nav-history.json` + `mutual-fund-data.ts`
- **Shape**: `MutualFund` / `MutualFundDetail` / `MutualFundTheme` (in `mutual-fund-data.ts`)
- **Records**: 11 categories, top performers for 3 categories, 8 insights, 5 themes — but **only 1 fund has a full detail record and NAV history** (`mf-ugisfx-n`)
- **Used in**: `useMutualFundCatalog()`, `useMutualFund(id)`, `useMutualFundUniverse()`, `useMutualFundInsights(page)`, `useMutualFundTheme(id)`

### 3.7 Stocks, ETF, DR and market indices

- **What**: Market catalogues, index pages, industry-sector pages, stock product detail with company events, research, technical and news tabs.
- **Lives in**: `stock-data.ts`, `stock-index-data.ts`, `stock-industry-sector-data.ts`, `stock-product-detail-data.ts`, `stock-company-data.ts` — **inline TS, no JSON**
- **Used in**: `useMarketCatalog(id)`, `useMarketIndexPage(slug)`, `useIndustrySectorPage(slug)`, `useStockProductDetail(id)`, `useStockCrossSellDetail`, `useStockRelatedProducts`, `useStockCompanyInfo`, `useStockResearch`, `useStockTechnical`, `useStockNews`

### 3.8 Robo-Advisory and Definit plans

- **What**: Managed-portfolio plans a client can open; "เปิดบัญชี" links out to the Yuanta website.
- **Lives in**: `robo-advisory-plan-data.ts`, `robo-advisory-filter-data.ts`, `definit-plan-data.ts` — inline TS. Per-client account state is `advisoryAccounts` on the client row (§1.1).
- **Used in**: `useRoboAdvisoryPlans()`, `useDefinitPlans()`

### 3.9 Product Trending

- **What**: Trending product groups on the catalogue home.
- **Lives in**: `product-trending-data.ts` — inline TS
- **Used in**: `useProductTrendingGroups()`

---

## 4. Mock data embedded directly in page/component files

These never made it into `src/mocks/` — they're inline arrays/objects living next to the screen that renders them.

| #   | What                                                                                                                          | Lives in                                                                                                                                                                         | Records                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Calendar market feeds — SET corporate actions (XD/XW/XT/…), the desk's own dated events, and the Thai market holiday calendar | `calendar/mock-market-feed.ts` (`marketFeed(anchorMonth)`, `holidaysByDay(viewDate)`); contract types in `calendar/market-feed.ts`; holidays in `src/mocks/market-holidays.json` | 26 corporate actions + 6 events **per month**, generated into whichever month is viewed. Holidays are stored dates — 15 fixed-date entries for any year, per-year lunar entries for 2026/2027, plus computed substitution days. See 4.1a |
| 4.2 | Performance page: gap-to-target tiles, AI action steps                                                                        | `performance/performance-data.ts` (`GAP_ITEMS`, `AI_STEPS`)                                                                                                                      | 3 gap items, 3 AI steps                                                                                                                                                                                                                  |
| 4.3 | Insights: category styling, per-strategy rationale, per-insight detail                                                        | `insights/house-view-data.ts` (`CATEGORY_TAG_VARIANT`, `CATEGORY_ACCENT_COLOR`, `STRATEGY_DETAIL`, `INSIGHT_DETAIL`)                                                             | rationale and detail keyed by strategy/insight id                                                                                                                                                                                        |
| 4.4 | Important compliance forms checklist (Wealth Declaration, FATCA/CRS, W-8BEN, Suitability Test, …)                             | `client/[id]/client-detail-data.ts` (`IMPORTANT_FORMS`)                                                                                                                          | 6 forms — **the same 6 for every client**                                                                                                                                                                                                |
| 4.5 | Pipeline stage-advance checklist                                                                                              | `pipeline/pipeline-data.ts` (`ADVANCE_CHECKLIST`)                                                                                                                                | 4 stages × 3 items                                                                                                                                                                                                                       |
| 4.6 | Compliance page KPI tiles + alert timestamps                                                                                  | `compliance/KpiBar.tsx` (values hardcoded, e.g. `"2"` critical), `compliance/AlertCards.tsx` (`ALERT_TIMESTAMPS`)                                                                | 4 KPI tiles, 4 timestamps — **not computed from §1.6 / §1.7**                                                                                                                                                                            |
| 4.7 | Research: category taxonomy, landing tiles, report list                                                                       | `insights/Research.tsx` (`RESEARCH_CATS`, `RESEARCH_LANDING_TILES`); reports in `insights/research-data.ts` (`MOCK_RESEARCH`)                                                    | every report links to the same placeholder PDF, `/mock-reports/sample-report.pdf`                                                                                                                                                        |
| 4.8 | AI Insights page: KPI tiles, AI summary card (model updated, avg confidence), model-stat breakdown, tab counts                | `ai-insights/page.tsx` (inline)                                                                                                                                                  | 4 KPI tiles, 4 stat rows, 5 tabs — **hardcoded, not computed from §1.5**                                                                                                                                                                 |

The Command Center itself mocks nothing new: `command-center/dashboard-data.ts` derives everything from datasets above (KYC, reminders, risk alerts, NBA, house views, advisory accounts).

### 4.1a Calendar market feeds — notes for whoever builds the endpoint

Three feeds, and they are deliberately three rather than one; see the header of `calendar/market-feed.ts` for the full reasoning. The short version:

- **`corporateActions`** — `{id, date, kind, symbol, name?, detail?, record?, clientIds?}`. `date` is `YYYY-MM-DD` read as a **local Bangkok calendar day**, not an instant: an X-date is a whole day, and an ISO timestamp drifts it across midnight. `record` is the sheet the action opens into, as **groups of `{label, value}`** — the UI draws a rule between groups and never inside one. `name` is the issuer's legal name for the sheet's header.
- **`events`** — `{id, date, category, title, detail?, facts?, clientIds?}`. The desk's own dated things: seminars, campaigns, subscription deadlines. `facts` is a flat list — the UI wraps it into one group.
- **`holidays`** — `{id, date, name, market, substitute?}`. `market` distinguishes a SET closure from a bank one. A holiday is **not** a row on anyone's list: the frontend keys it by day and uses it to tint the cell.

⚠️ **`clientIds` on a corporate action is not rendered as a holder list.** It exists so the personal surfaces — the header bell, a client's Reminders tab, the Command Center queue — can decide whether the action is worth raising at all (`concernsSomeone` in `day-items` drops anything naming nobody). Desk **events** do show their people.

⚠️ **`kind` and `category` are open-ended strings, not enums.** The frontend resolves a colour, a label and an icon for _anything_ that arrives (`calendar/market-taxonomy.tsx`), so adding a code server-side needs no frontend release. The mock deliberately includes one unknown code (`XC`) and one unknown category (`quarterly-briefing`) to keep that path exercised.

⚠️ **The lunar holiday dates are placeholders.** Fixed-date holidays in `market-holidays.json` are correct for any year; Makha Bucha, Visakha Bucha, Asalha Bucha and Buddhist Lent are announced per year. Use SET's published list.

**Filtering**: `calendar/CalendarFilter.tsx` stores what is **hidden**, never what is shown, so a code the backend adds later starts visible; it offers the union of the taxonomy's known codes and whatever the feed sent this month.

---

## 5. Writable datasets

Everything above is read-only. Three stores hold data the IC creates at runtime. All three live in React state, are mounted once in the dashboard layout, and expose `async` mutators awaited at every call site — so each becomes HTTP calls in its own file without touching a screen. A page reload resets all three to their seed.

### 5.1 Notes (and the reminders hung on them)

- **What**: A free-text note an RM/IC writes, optionally tagged to clients, with an optional reminder date. `/calendar` and `/reminders` are both views of the notes that carry a reminder.
- **Lives in**: `NotesProvider` / `useNotes()` in `src/features/notes/store/notes-context.tsx`
- **Shape**: `Note` in `src/types/note.ts`:
  ```
  { id: string, clientIds: string[],
    title: string|null, body: string, author: string,
    createdAt: string, updatedAt: string,
    reminderAt: string|null, reminderDone: boolean }
  ```
- **Records**: **0 seeded** (`SEED_NOTES = []`)
- **Mutators**: `addNote`, `editNote`, `removeNote`. `isLoading` comes from `staticResource(SEED_NOTES)`.
- **History**: this once ran against a mock `/api/mock/*` route with an in-process store. The optimistic-create + `localId → serverId` machinery that route needed was removed with it; recover it from `git show d2c4623:src/contexts/notes-context.tsx` if the real API needs it.

### 5.2 Orders

- **Lives in**: `OrdersProvider` in `src/features/orders/store/orders-context.tsx`, seeded from §1.7a / §1.7b
- **Mutators**: `placeOrder`, `cancelBooking`, order submission, `sendRequirementRequest`, `sendProposal`
- **⚠️ Three timers stand in for external systems** (`REQUIREMENT_TURNAROUND_MS`, `BACKOFFICE_PICKUP_MS`, `SUBMISSION_TURNAROUND_MS`). Full detail in [`order-booking.md`](order-booking.md).

### 5.3 Campaigns (Promotion / Events)

- **What**: Promotions and events an IC invites clients to — eligibility conditions, approved share materials, per-client invite status, RSVPs, and the share log.
- **Lives in**: `src/mocks/campaigns.json` + `src/mocks/campaign-mock-data.ts` (`mockCampaigns`, `seedCampaignClients`, `seedRsvps`, `seedShareLogs`) — held and mutated in `src/features/promotions/store/campaigns-context.tsx`
- **Shape**: `Campaign` in `src/types/campaign.ts`. Raw: `{ id, type: "promotion"|"event", title, summary, description, cover, featured, products, segments, startOffset, endOffset, conditions, terms, disclaimer, materials, clients }`
- **Records**: 15 campaigns — 10 promotions, 5 events. Dates are offsets from today, like the order seeds.
- **Mutators**: `shareMaterial`, `setClientStatus`, `registerClients`, `setRsvpStatus` — only `shareMaterial` has a UI caller. Event invites ("ชวนลูกค้า") also go through `shareMaterial`, not `registerClients`, so they don't check or reserve seats. The other three are store-only today.
- **Rules the endpoint must enforce** (the store enforces them today; a disabled button is not a control): only an approved material can be shared; a closed campaign takes no shares; every share writes a `ShareLog`, which is append-only — it is the compliance record.
- **Used in**: `useCampaigns()` / `useCampaign(id)` in `src/features/promotions/hooks/use-campaigns.ts` — `/promotions`, `/promotions/[id]` (sidebar link hidden by `PROMOTIONS_ENABLED`)

---

## Gotchas worth knowing before building the real API

- **Nothing is wired to a backend.** Every dataset is bundled. Every screen reads through an endpoint (`src/features/*/api`), so wiring one is adding its `http` implementation — see `docs/architecture.md` §4. Still outside endpoints: the inline data in §4 and the files listed in `LEGACY_MOCK_READERS` (`eslint.config.mjs`).
- **Displayed "total count" fields don't reflect real record counts**: Structured Products (`meta.allCount: 328` vs. 20 real records) and Global Bonds (`meta.allOverseasBondsCount: 100` vs. 15 seed rows). Build an endpoint that returns the real inventory.
- **Some "per-client" data isn't per-client**: `IMPORTANT_FORMS` shows the same 6 forms for everyone, and `useClientAssetAccounts` returns the same 7 accounts whatever `clientId` it gets.
- **Some data is synthesized, not modelled**: `ALL_OVERSEAS_BONDS`, `resolveFixedIncomeCompany`, the liabilities template, transactions (§1.7c). Model these properly before designing their endpoints.
- **Client names are joined at import time**, from `clients.json`, in every dataset that carries a `clientId`. Decide whether the API embeds names or the frontend joins them.
- **Client id format is consistently the 6-digit string** (`"110001"`–`"110008"`).
- Several JSON files carry a `meta.updatedAt`-style timestamp that is static display text (Fixed Income, Global Bonds, Structured Products, Top Ideas) — the real API needs an actual "last synced" value.
- **Hardcoded business constants** that belong on the product or in the session: `USD_THB = 36.5`, bond quotas, `THAI_MIN_TICKET` / `THAI_NOTIONAL` (see `order-booking.md`), and the signed-in IC (`src/mocks/session.ts`, read through `useCurrentIc()`).
