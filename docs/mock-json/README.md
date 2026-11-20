# Mock Data — JSON Files

Every mock data domain from [`../mock-data-inventory.md`](../mock-data-inventory.md), as plain JSON files, for reference.

Synced with the code on **2026-11-17**. 23 files are byte-for-byte copies of `src/mocks/*.json`. The other 15 don't exist as JSON anywhere in the codebase — they're hardcoded in `.ts`/`.tsx` files and were extracted here by running those modules, so everything is in one place. Where a file's content is scaled, synthesized or computed at runtime rather than stored as-is, that's called out below.

**This folder is a snapshot.** `src/mocks/` is the source of truth; if the two ever disagree, the code wins. To refresh: copy `src/mocks/*.json` over the first table's files, and re-extract the second table's from the source modules listed.

## Copied verbatim from `src/mocks/`

| File | Doc section | Notes |
|---|---|---|
| `clients.json` | 1.1 | raw numbers (`aum` in THB, `plYtdPct` in percent) — formatted at render |
| `nba-actions.json` | 1.2 | |
| `pipeline-deals.json` | 1.3 | |
| `mini-kanban.json` | 1.4 | |
| `insights.json` | 1.5 | |
| `compliance-alerts.json` | 1.6 | |
| `kyc-data.json` | 1.7 | client `110008` has no record |
| `order-requirements.json` | 1.7a | only `wealth` and `acknowledge` are stored — `kyc` and `risk-profile` are derived |
| `order-books.json` | 1.7b | dates are `daysAgo` offsets, stamped from today at import |
| `house-view-strategies.json` | 1.8 | |
| `performance.json` | 1.9 | |
| `client-details.json` | 1.10 | |
| `notifications.json` | 1.11 | **unreferenced** — the header bell builds its own feed; don't build an endpoint for this shape |
| `risk-alerts.json` | 1.13 | `dueOffset` in days, `detectedMinutesAgo` in minutes |
| `investment-solutions.json` | 3.1 | |
| `top-ideas.json` | 3.2 | |
| `structured-products.json` | 3.3 | 20 real records; `meta.allCount: 328` is display-only (records are cloned to fill lists) |
| `global-bonds.json` | 3.4 | 15 seed rows cycled to fake `meta.allOverseasBondsCount: 100` |
| `fixed-income.json` | 3.5 | `companyOrder` lists 8 tickers but only 3 have `companies` records |
| `mutual-funds.json` | 3.6 | only one fund has a full detail record |
| `mutual-fund-nav-history.json` | 3.6 | NAV history for that one fund |
| `market-holidays.json` | 4.1 | `recurring` applies to any year; `byYear` holds lunar days (⚠️ **2026/2027 lunar dates are placeholders, not SET's list**). Weekend substitution days are computed, not stored |
| `campaigns.json` | 5.3 | 10 promotions + 5 events; dates are offsets from today |

## Extracted from TypeScript (no JSON exists in the codebase)

| File | Doc section | Source |
|---|---|---|
| `analysts.json` | 1.12 | `mockAnalysts` in `src/mocks/mock-data.ts` |
| `call-log.json` | 2.1 | `src/mocks/call-log-data.ts` — keyed by clientId; a client with no entry falls back to the `"default"` key |
| `client-profiles.json` | 2.2 | `src/mocks/client-profiles.ts` (via `getClientProfile`) — includes `accountNo` and `nameTh`; `"default"` is the fallback profile |
| `liabilities-template.json` | 2.3 | `src/mocks/liabilities-details.ts` — **not per-client data**: one template rescaled at render time to a client's total liabilities |
| `asset-account-details.json` | 2.4 | `src/mocks/asset-account-details.ts` — `defaultAssetAccounts` is **the same list for every client**; `assetAccountDetails` keyed by account number, `assetProductDetails` by asset-class label. The derived `position` block (avg cost, current price) is omitted |
| `product-sub-data.json` | 2.5 | `src/mocks/product-sub-data.ts` — keyed by asset-class label; cash has no entry |
| `calendar-market-feed.json` | 4.1 | `marketFeed()` in `calendar/mock-market-feed.ts` — **one month's output (September 2026), not stored data**. `XC` and `quarterly-briefing` are deliberately unknown codes, to prove the fallback path |
| `performance-page-extras.json` | 4.2 | `performance/performance-data.ts` (`GAP_ITEMS`, `AI_STEPS`) — colour fields dropped |
| `house-view-extras.json` | 4.3 | `insights/house-view-data.ts` — `strategyDetail` keyed by strategy id, `insightDetail` by insight id |
| `important-forms.json` | 4.4 | `client/[id]/client-detail-data.ts` — **the same 6 forms for every client** |
| `pipeline-checklist.json` | 4.5 | `pipeline/pipeline-data.ts` — keyed by stage name |
| `compliance-page-extras.json` | 4.6 | `compliance/KpiBar.tsx` + `AlertCards.tsx` — KPI values are hardcoded, not computed; `alertTimestamps` maps by position onto `compliance-alerts.json` |
| `ai-insights-page-extras.json` | 4.8 | `ai-insights/page.tsx` — KPI tiles, AI summary card, model stats and tab counts, all hardcoded |
| `research.json` | 4.7 | `insights/Research.tsx` + `insights/research-data.ts` — every report links to the same placeholder PDF; landing tiles keep `id`/`title`/`subtitle` only |
| `notes-shape-example.json` | 5.1 | **not mock content** — Notes has zero seeded data; these 2 records only illustrate the `Note` shape |

## Not here

- **Transactions** (1.7c) — generated deterministically in `src/mocks/transaction-mock-data.ts`; nothing stored to copy.
- **Thai structured, stocks / ETF / DR, Robo-Advisory / Definit, product trending** (3.3a, 3.7–3.9) — inline TS under `client/[id]/`, not yet extracted.
- `command-center.json` was removed: its source (`command-center-data.ts`) no longer exists. The Command Center now derives everything from the datasets above.
