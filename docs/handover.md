# ส่งงานต่อ — Yuanta IC Portal

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4
Design system: `@sarunyu/system-one`

---

## สถานะ

**Frontend ล้วน ยังไม่มี Backend** — ทุก endpoint ตอบจาก mock ในบันเดิล (`NEXT_PUBLIC_API_MODE=mock`)
แต่ชั้นต่อ API พร้อมแล้ว: HTTP client, TanStack Query, env config — ดู [docs/architecture.md](architecture.md)
มี `src/proxy.ts` (ชื่อใหม่ของ middleware ใน Next 16) ตัวเดียว ใช้แค่เลือกภาษา — ดู [ภาษา (TH / EN)](#ภาษา-th--en)

ข้อมูลทั้งหมด: `src/mocks/*` → endpoint (`src/features/<feature>/api/*.api.ts`) → hook → หน้าจอ

**Phase 2** — ทุกฟีเจอร์ที่เคยถูกปิดใน Phase 1 (Notes, Calendar, Reminders, Call log)
เปิดกลับมาแล้ว ส่วนเมนูกลุ่ม Growth ยังซ่อนจาก sidebar ดู [Feature flags](#feature-flags)

**สองภาษา** — ทุกหน้าใช้ได้ทั้ง `/th/...` และ `/en/...` (ค่าเริ่มต้น `th`)
ข้อความ UI ทั้งหมดอยู่ใน dictionary ไม่มีเขียนตรงใน JSX แล้ว

## ภาพรวมสถาปัตยกรรม

```
IC / RM  →  IC Portal (repo นี้)  →  BFF / API (ยังไม่มี ต้องสร้าง)  →  ระบบหลังบ้าน
                 │
                 └─ วันนี้ตอบจาก src/mocks แทน (ทีละ endpoint)
```

ระบบหลังบ้านที่ Portal ต้องได้ข้อมูล แบ่งเป็น 6 กลุ่ม

| กลุ่ม         | ระบบ                                                                 | ชื่อในโค้ดแล้ว? |
| ----------- | -------------------------------------------------------------------- | ----------- |
| Identity    | SSO / IdP — login, ชื่อ ตำแหน่ง ทีมของ IC                                | —           |
| ลูกค้า & พอร์ต | CRM, Portfolio / Custody, Call log                                   | —           |
| Compliance  | Yuanta e-KYC, Wealth Declare, Risk Consent, Risk & compliance alerts | ✓ (3 ตัวแรก) |
| สินค้า & ตลาด | Product master, ข้อมูลกองทุน / NAV, Market data, Research / House View  | —           |
| การซื้อขาย    | Order management / Back office, Transactions (Stock · TFEX · MF)     | —           |
| ช่องทาง & AI | YSInvest, Email, LINE, Voice AI, NBA / AI engine                     | ✓ (ช่องทาง)  |

ชื่อที่ไม่มีเครื่องหมาย ✓ เป็นชื่อที่เสนอจากข้อมูลที่หน้าจอใช้ — **ต้องยืนยันชื่อระบบจริงกับทีมหลังบ้าน**

แนะนำให้มี **BFF (Backend for Frontend)** คั่นกลาง ไม่ให้ Portal เรียกระบบหลังบ้านตรง ๆ
เพราะต้องรวมข้อมูลหลายระบบต่อหน้า, ซ่อน credential ของระบบภายใน, บังคับกฎทางธุรกิจ
ที่ server และต้องมีปลายทางรับ webhook สถานะคำสั่งซื้อ

## ชั้นข้อมูล

หน้าจออ่านข้อมูลผ่าน hook ที่คืน `Resource<T>` (`src/lib/api/resource.ts`)

```ts
type Resource<T> = {
  data: T;
  isLoading: boolean;
  error: Error | null; // โหลดครั้งแรกไม่สำเร็จ
  isStale: boolean; // มีข้อมูลเก่าอยู่ แต่รอบล่าสุดดึงไม่สำเร็จ
  retry: () => void;
};
```

**ทุกหน้ามี Skeleton, ErrorState และ empty / not-found state เตรียมไว้แล้ว ผูกกับ field เหล่านี้**
ในโหมด mock ข้อมูลพร้อมตั้งแต่ frame แรก (`isLoading` = `false`) — พอต่อ API จริง state ต่าง ๆ
ทำงานเองโดยไม่ต้องแก้ component ดู [สถานะของหน้าจอ](#สถานะของหน้าจอ-loading--error--empty--not-found)

## ต่อ API — เพิ่ม `http` ให้ endpoint ทีละตัว

รายละเอียดเต็มอยู่ใน [docs/architecture.md](architecture.md) สรุปสั้น ๆ:

1. ตั้ง `.env.local` — `NEXT_PUBLIC_API_MODE=http` และ `NEXT_PUBLIC_API_BASE_URL=...` (ดู `.env.example`)
2. เปิดไฟล์ endpoint ของ feature นั้น เช่น `src/features/clients/api/clients.api.ts` แล้วเพิ่ม `http`:

```ts
export const clientsEndpoint = defineEndpoint("clients", {
  mock: () => mockClients,
  http: (signal) => apiFetch("/clients", { schema: clientListSchema, signal }),
});
```

endpoint ที่ยังไม่มี `http` จะตอบจาก mock ต่อไปแม้อยู่ในโหมด `http` — ต่อทีละตัวได้
**hook และหน้าจอไม่ต้องแก้** ค่า `fallback` ที่ hook ส่งให้ `useEndpoint` เป็นค่าว่าง (`[]`, `null`) เสมอ
ไม่ใช่ mock — API ล่มต้องเห็น ErrorState ไม่ใช่ข้อมูลปลอม

### ฝั่งอ่าน (endpoint ตาม feature)

| ไฟล์                                                     | ครอบคลุม                                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------------------- |
| `src/features/clients/api/clients.api.ts`               | ลูกค้า, Client 360 detail, KYC, profile, call log, บัญชี/holdings, หนี้สิน, เลขบัญชี |
| `src/features/catalog/api/catalog.api.ts`               | Product Catalog ทั้งหมด (SP, bond, หุ้นกู้, กองทุน, หุ้น, Robo/Definit)              |
| `src/features/insights/api/insights.api.ts`             | House View, นักวิเคราะห์, Research                                             |
| `src/features/command-center/api/command-center.api.ts` | NBA, Risk & Compliance alerts                                               |
| `src/features/compliance/api/compliance.api.ts`         | Compliance alerts                                                           |
| `src/features/promotions/api/promotions.api.ts`         | Promotion / Events (+ seed ของ store)                                       |
| `src/features/orders/api/*.api.ts`                      | รายการซื้อขาย Stock / TFEX / MF (+ seed ของ `OrdersProvider`)                 |
| `src/features/auth/api/*.api.ts`                        | IC ที่ล็อกอินอยู่ (`useCurrentIc`), sign-in / reset password                      |
| `ai-insights`, `pipeline`, `performance` (`api/`)       | หน้าต้นแบบที่ยังไม่อยู่ใน sidebar                                                   |

target type อยู่ที่ `src/types/*.ts` (แยกไฟล์ตาม domain)

### ฝั่งเขียน (stores)

mutator ทุกตัวเป็น `async` และทุกที่เรียกใช้ `await` อยู่แล้ว — ต่อ endpoint จริงแก้ในไฟล์ store ไฟล์เดียว
(คำสั่งแบบไม่มี state เช่น sign-in ใช้ `defineMutation` ใน `src/lib/api/mutation.ts`)

| Store                                                 | mutators                                                                        | หมายเหตุ                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| `src/features/orders/store/orders-context.tsx`        | `placeOrder`, `cancelBooking`, submit, `sendRequirementRequest`, `sendProposal` | มี **timer จำลองระบบภายนอก 3 ตัว** — ดูด้านล่าง |
| `src/features/notes/store/notes-context.tsx`          | `addNote`, `editNote`, `removeNote`                                             | React state ล้วน — reload แล้วหาย            |
| `src/features/promotions/store/campaigns-context.tsx` | `shareMaterial`, `setClientStatus`, `registerClients`, `setRsvpStatus`          | กฎ 3 ข้อในไฟล์ต้องบังคับที่ server ด้วย            |

## ⚠️ ต้องรู้ก่อนออกแบบ API

**API จะส่ง shape แบบไหนมาก็ได้** — mock ในโปรเจกต์เป็นแค่ตัวอย่างว่าอยากได้ข้อมูลอะไร
ไม่ใช่ข้อกำหนดว่า response ต้องหน้าตาแบบนี้

จุดที่รับความต่างคือ **`http` ของ endpoint** — จะ `snake_case`, ซ้อนหลายชั้น,
ชื่อ field ไม่ตรง, หน่วยต่างกัน ก็ map เข้า type ใน `src/types/*.ts` ในฟังก์ชันนั้นที่เดียว
**หน้าจอไม่ต้องแก้เลย** ตรวจ response ตอน runtime ด้วย zod ผ่าน option `schema` ของ `apiFetch`

ตัวเลขใน `clients.json` เป็นค่าดิบ ไม่ใช่ข้อความจัดรูปแล้ว — จัดรูปตอน render:

```
aum       = 450000000   (THB)          → formatAumThb()   → "฿ 450M"
plYtdPct  = 12.4        (percent)      → formatPlYtdPct() → "+12.4%"
```

ยกเว้น `lastContact` ที่ยังเก็บเป็นข้อความ (`"2 days ago"`) เพราะ **ยังไม่มีใครอ่าน** —
บรรทัด Last Contact ใน identity bar ของ Client 360 ยังซ่อนอยู่ (ช่อง KYC countdown อยู่แทน)
ถ้าเฟสหน้าเปิดใช้แล้ว API ส่ง ISO date มา ให้แปลงใน fetcher
ตัวอย่าง `formatLastContact` อยู่ใน `git show d2c4623:src/lib/api.ts`

> ⚠️ `lastContact` ใน `clients.json` และ `lastContactFromCallLogs()` ใน
> `client-detail-data.ts` **ไม่มีใครเรียกเลย แต่ห้ามลบ** (ดู `phase-scope.md`)
> เครื่องมือหา dead code จะชี้ว่าลบได้ ซึ่งผิด

**ข้อมูลบางชุดเป็นของ generate ไม่ใช่ data model** ต้อง model ใหม่ก่อนทำ endpoint

- `ALL_OVERSEAS_BONDS` — `Array.from({length: N})` วนซ้ำจาก seed ไม่กี่ตัว id เป็นของปลอม
- `GLOBAL_BOND_ISSUERS` — `Record` keyed by id ไม่ใช่ collection
- `resolveFixedIncomeCompany` — สังเคราะห์บริษัทจากรายการหุ้นกู้เมื่อไม่มี record
- Structured products — `meta.allCount: 328` ใช้แสดงผลเท่านั้น ข้อมูลจริงมี 20 รายการ ที่เหลือ clone

**`clientId` → ชื่อลูกค้า join ที่ import time** ใน `src/mocks/mock-data.ts`
(NBA, Pipeline, Insights, KYC, Compliance alerts, Order books — ชื่อลูกค้าอยู่ใน
`clients.json` ที่เดียว) ต้องตัดสินใจว่า API embed ชื่อมาให้ หรือ frontend join เอง

**IC ที่ล็อกอินอยู่มาจาก `useCurrentIc()`** — ตอนนี้ endpoint `currentIcEndpoint`
(`src/features/auth/api/session.api.ts`) ตอบจาก `src/mocks/session.ts`
หน้า `/login` เรียก `signIn` (stand-in หน่วง 2 วินาที) แล้วเข้า `/` เลย ไม่มีการตรวจสิทธิ์
ต่อ backend: เพิ่ม `http` ให้ `currentIcEndpoint` และ `signIn`, ตั้ง token ผ่าน `setAuthHeaderProvider`
(`src/lib/api/http.ts`) และเพิ่ม route guard ใน `src/proxy.ts`

**Notes เป็น React state ล้วน** — optimistic create + map `localId → serverId`
ที่รองรับ async ถูกถอดออกแล้ว ถ้าต้องการกู้ได้จาก
`git show d2c4623:src/contexts/notes-context.tsx` (path ก่อนย้ายโครงสร้าง)

## Feature flags

`src/config/feature-flags.ts` — โค้ดยังอยู่ครบ เปลี่ยน `true`/`false` ได้เลย

| Flag                    | สถานะ   | ปิดแล้วหายอะไร                                           |
| ----------------------- | ------- | ------------------------------------------------------ |
| `ORDER_BOOKING_ENABLED` | **เปิด** | ปุ่มจองบนหน้าสินค้า, `/orders`, แถวคำสั่งซื้อในกระดิ่ง            |
| `KYC_ALERTS_ENABLED`    | **เปิด** | แถว KYC ในกระดิ่ง                                        |
| `NOTES_ENABLED`         | **เปิด** | `/notes`, ปุ่ม New note, แท็บ/ไดอะล็อก Notes ใน Client 360 |
| `CALENDAR_ENABLED`      | **เปิด** | `/calendar` และ `/reminders`                           |
| `REMINDERS_ENABLED`     | **เปิด** | แถว reminder ในกระดิ่ง, แท็บ/การ์ด/ไดอะล็อก Reminders       |
| `CALL_LOG_ENABLED`      | **เปิด** | แท็บ/ไดอะล็อก Call log ใน Client 360                     |
| `PROMOTIONS_ENABLED`    | ปิด      | ลิงก์ใน sidebar เท่านั้น                                    |
| `PERFORMANCE_ENABLED`   | ปิด      | ลิงก์ใน sidebar เท่านั้น                                    |
| `IC_LEARNING_ENABLED`   | ปิด      | ลิงก์ใน sidebar เท่านั้น                                    |
| `YAA_TEAM_HEAD_ENABLED` | ปิด      | ลิงก์ใน sidebar เท่านั้น                                    |

Notes / Calendar / Reminders พึ่งพากัน ถ้าจะปิดควรปิดพร้อมกันทั้งชุด

สี่ตัวสุดท้าย (กลุ่ม Growth) **ซ่อนแค่ลิงก์ใน sidebar** — route ยังเปิดได้ถ้าพิมพ์ URL ตรง
เมื่อปิดครบทั้ง 3 ตัวของกลุ่ม Growth หัวข้อ Growth ใน sidebar จะหายไปด้วย

## Calendar และ Reminders

Reminders แยกออกจาก Calendar เป็นหน้าของตัวเองที่ `/reminders` (มีเมนูใน sidebar)
ทั้งสองหน้าอ่านข้อมูลชุดเดียวกันจาก `NotesProvider` — Calendar แสดงเป็นรายวัน,
Reminders แสดงเป็นรายการ ทั้งคู่อยู่ใต้ `CALENDAR_ENABLED`

- `/notes`, `/calendar`, `/reminders` ใช้พื้นที่เต็มจอ ไม่มี padding และหน้าไม่ scroll
  (`isFullHeight` + `isEdgeToEdge` ใน `page-chrome.ts`)
- ลิงก์เก่า `/calendar?tab=reminder` redirect ไป `/reminders`
- การ์ด Reminders บน Command Center ลิงก์ไป `/reminders`

## ⚠️ Order booking — ฟีเจอร์หลักที่ "เขียน"

การจองคำสั่งซื้อสร้างข้อมูลใหม่ — เก็บใน React state (`src/features/orders/store/orders-context.tsx`)
และมี **สาม timer ที่จำลองระบบภายนอก** ต้องถอดออกตอนต่อ backend จริง

| ค่าคงที่                              | จำลองอะไร                                    | ของจริงคือ                      |
| ---------------------------------- | -------------------------------------------- | ----------------------------- |
| `REQUIREMENT_TURNAROUND_MS` (15 วิ) | ลูกค้าไปกรอกฟอร์มในระบบอื่นจนเสร็จ                 | webhook หรือ poll ระบบนั้น       |
| `BACKOFFICE_PICKUP_MS` (10 วิ)      | หลังบ้านรับงาน (basket ที่ครบ / bond order ที่ส่งมา) | job ฝั่งหลังบ้าน หรือ webhook      |
| `SUBMISSION_TURNAROUND_MS` (12 วิ)  | หลังบ้านตอบผลคำสั่งซื้อ                            | สถานะบน order record ที่ส่งกลับมา |

ค่าคงที่อื่นที่ควรมาจาก backend: `USD_THB = 36.5`, โควตาหุ้นกู้ (`fixedIncomeQuotaThb`,
`globalBondQuotaUsd`), `THAI_MIN_TICKET` / `THAI_NOTIONAL`

`sendProposal` ยัง**ไม่ได้ส่งอะไรจริง** (ไม่มีบริการ YSInvest / Email / LINE / Voice AI ต่ออยู่)
แค่บันทึก log ไว้

รายละเอียดทั้งหมดอยู่ที่ [`order-booking.md`](order-booking.md)

## Promotion / Events

เก็บใน `src/features/promotions/store/campaigns-context.tsx` (React state, seed จาก `src/mocks/campaign-mock-data.ts`)
ลิงก์ใน sidebar ถูกซ่อนด้วย `PROMOTIONS_ENABLED` แต่ provider mount อยู่ใน layout เสมอ
กฎที่ต้องบังคับฝั่ง server ด้วยเมื่อต่อ backend:

1. แชร์ได้เฉพาะสื่อที่อนุมัติแล้ว
2. แคมเปญที่ปิดแล้วรับแชร์ไม่ได้
3. ทุกการแชร์ต้องเขียน share log (append-only — เป็น compliance record)

## ภาษา (TH / EN)

**แปลเฉพาะ UI** — เมนู ปุ่ม หัวตาราง empty state toast ฯลฯ
**เนื้อหา** (ชื่อสินค้า บทวิเคราะห์ ข้อความแคมเปญ ชื่อลูกค้า) ไม่แปลฝั่ง frontend —
API ต้องส่งมาเป็นภาษาที่ขอ ตอนนี้ mock เป็นภาษาเดียว หน้า EN จึงยังเห็นเนื้อหาภาษาไทยปน ซึ่งถูกต้องแล้ว

### URL และการเลือกภาษา

- ทุก route อยู่ใต้ `src/app/[lang]/` → `/th/client-hub`, `/en/client-hub`
- `src/proxy.ts`: path ที่ไม่มีภาษานำหน้าจะ redirect ตามลำดับ cookie `NEXT_LOCALE` → `Accept-Language` → `th`
  (ไม่ยุ่งกับไฟล์ที่มีนามสกุล เช่น `/icon.svg`, `/products/*.png`)
- ปุ่มสลับภาษา (TH | EN) อยู่บนแถบด้านบน ข้างกระดิ่งแจ้งเตือน และมุมขวาบนของหน้า login
- ⚠️ สลับภาษาแล้ว root layout remount — ข้อมูลที่เก็บใน React state (notes, การจองที่เพิ่งทำ) หาย
  ตอนนี้เป็นข้อจำกัดของ mock พอต่อ backend ข้อมูลจะโหลดกลับมาเอง

**path ภายในโค้ดไม่มีภาษานำหน้า** (`/client-hub`) — ตัวช่วยเติม / ตัดให้เอง:

| ใช้                                                   | แทน              |
| ---------------------------------------------------- | ---------------- |
| `LocaleLink` (`@/i18n/navigation`)                   | `next/link`      |
| `useLocalizedRouter()`                               | `useRouter()`    |
| `useAppPathname()` (ตัด `/th` ออกแล้ว)                 | `usePathname()`  |
| `setQueryState` / `withQuery` (`lib/query-state.ts`) | — เติมภาษาให้อยู่แล้ว |
| `redirect(localizePath(path, locale))`               | `redirect(path)` |

### Dictionary

- `src/i18n/dictionaries/th/` คือต้นฉบับ `en/` ต้องมี key ตรงกันทุกตัว
  (`satisfies` — ขาด key ตัวไหน `tsc` แดงทันที)
- แบ่งไฟล์ตามโมดูล: `orders`, `client`, `fund`, `stock`, `products`, `commandCenter`, `planner`,
  `shell`, `research`, `compliance`, `pipeline`, `performance`, `campaigns`, `learning`, `dates`
  และกลุ่มกลาง (`common`, `states`, `nav`, …) ใน `index.ts`
- ใน component: `const t = useT()` (ถ้าชื่อ `t` ชนตัวแปรอื่น ใช้ `dict`)
  ฟังก์ชันที่ไม่ใช่ component รับ `t: Dictionary` / `locale: Locale` เป็น parameter
- ข้อความที่มีค่าแทรกเป็น **ฟังก์ชัน** เช่น `readyCount: (n, total) => ...`
  ห้ามต่อข้อความหลายท่อนเองที่ call site — ไทยกับอังกฤษเรียงคำไม่เหมือนกัน
  พหูพจน์ภาษาอังกฤษใช้ `plural()` (`src/i18n/plural.ts`)
- ข้อความที่มีตัวหนาข้างใน รับ callback `em` เช่น `t.products.pagination.showing(range, em)`

### วันที่และตัวเลข

`src/i18n/format.ts` (ใน component ใช้ `useFormat()`)

- TH = พ.ศ. (`18 พ.ย. 2569`), EN = ค.ศ. (`18 Nov 2026`) — มาจาก locale `th-TH-u-ca-buddhist`
  **ห้ามบวก 543 เอง**
- ทุก formatter ระบุ `timeZone` (`Asia/Bangkok` หรือ `UTC`) — ไม่งั้น server กับ browser
  render ไม่ตรงกันแล้วเกิด hydration error
- ยกเว้น Research / House View ที่ข้อมูลเป็น พ.ศ. แบบข้อความแล้วเอามาเทียบกัน —
  **ขอให้ API ส่งวันที่เป็น ISO** แล้วค่อยเปลี่ยนไปใช้ `format.ts`

### สิ่งที่ API ต้องรองรับ

- รับภาษาจาก header `Accept-Language` (หรือ query `lang`) แล้วส่งเนื้อหาเป็นภาษานั้น
- วันที่ส่งเป็น ISO 8601 เสมอ ไม่ส่งข้อความวันที่ที่จัดรูปแล้ว

### ยังค้าง — รอ `@sarunyu/system-one` เวอร์ชันใหม่ (Step 6)

ข้อความบางส่วนฝังอยู่ใน design system Portal ส่งภาษาเข้าไปไม่ได้ ตกลงกันว่า**ยังไม่แก้** สเปกจดไว้ที่
[`system-one-i18n-spec.md`](system-one-i18n-spec.md) สิ่งที่หน้า EN ยังเห็นเป็นไทย:

- ปฏิทินของ `DateInput` (ตัวกรองวันที่ใน Research, วันเตือนใน Notes) — ชื่อเดือนไทย + พ.ศ.
- chip "ยังไม่ลงทะเบียน" / "เต็มแล้ว" บนการ์ดแคมเปญ
- aria-label ของ Modal / Pagination / Toast ฯลฯ เป็นภาษาอังกฤษในหน้า TH (มองไม่เห็นบนจอ มีผลกับ screen reader)

## สถานะของหน้าจอ (loading / error / empty / not-found)

component กลางอยู่ที่ `src/components/ui/empty-state.tsx` ลำดับการเช็คต้องเป็น

```
isLoading → error → not-found → empty → data
```

`ResourceView` ทำลำดับนี้ให้สำหรับ `Resource` ตัวเดียว

| สถานะ            | ใช้                                            | เมื่อไหร่                                              |
| ---------------- | --------------------------------------------- | --------------------------------------------------- |
| โหลดไม่สำเร็จ      | `ErrorState` + ปุ่ม "ลองใหม่" (`resource.retry`) | `error` และไม่มีข้อมูลเก่า                               |
| ข้อมูลเก่า          | `StaleBanner`                                 | `isStale` — ยังแสดงข้อมูลเดิม พร้อมแถบเตือน               |
| ไม่พบ record      | `NotFoundState` + ปุ่มกลับ                       | id ใน URL ไม่มีอยู่ — **ห้าม fallback ไปแสดง record อื่น** |
| ว่างจริง           | `EmptyState` "ยังไม่มี…"                         | ไม่มีข้อมูลเลย                                          |
| ค้นหา / กรองไม่เจอ | `EmptyState` "ไม่พบ…" + "ล้างตัวกรอง"            | มีข้อมูล แต่ตัวกรองซ่อนหมด                                |

กฎเพิ่มเติม

- section ที่ว่างแสดง `EmptyState size="compact"` ใต้หัวข้อ ไม่ปล่อยว่าง
  และซ่อน "ดูทั้งหมด" กับ pagination เมื่อไม่มีรายการ
- query param ที่ชี้ record ที่ไม่มี (`?client=`, `?clientId=`, `?note=`, `?flash=`)
  → แสดง toast "ไม่พบ…" แล้วลบ param ออกจาก URL
- param ที่เป็นแค่ UI (tab, market, chip) ผิด → กลับไปค่า default ได้ ไม่ต้องเตือน
- เขียนข้อมูลไม่สำเร็จ (จอง, บันทึกโน้ต, แชร์) → toast error และ**ไม่**ขึ้นข้อความว่าสำเร็จ
  ปุ่มกลับมากดได้ ข้อความที่พิมพ์ไว้ไม่หาย
- error ที่หลุดถึงระดับหน้า → `error.tsx` ของ dashboard, ระดับ root → `global-error.tsx`

## ข้อตกลงในโปรเจกต์

**ข้อความ UI ทุกตัวอยู่ใน dictionary** ทั้ง th และ en — ห้ามเขียนตรงใน JSX หรือใน data file
(label ใน data file ให้เก็บเป็น id แล้วเปิด dictionary ตอน render)

**เช็ค `isLoading` ต้องอยู่เหนือเช็ค not-found** ไม่งั้นพอต่อ API จริงจะขึ้น
"ไม่พบข้อมูล" แว่บหนึ่งทุกครั้งก่อนข้อมูลมา (ตอนนี้ยังไม่เห็นเพราะ `isLoading` เป็น false ตลอด)

**Loading อยู่ที่จุดที่หาข้อมูล** — component ที่รับ object สำเร็จรูปมาทาง props
ไม่ถือ skeleton ให้ route page ถือแทน ห้ามใช้ timer หรือ flag จำลอง loading

**View state อยู่ใน URL ไม่ใช่ `useState`** — dashboard layout ไม่ remount ตอนเปลี่ยนหน้า
`useState` จะหาย (`src/lib/query-state.ts`, `src/features/shell/lib/nav-memory.ts`)

**Column filter ของ Client 360 จำถาวร** ผ่าน `src/lib/preferences.ts` (localStorage)
filter อื่นรีเซ็ตทุก refresh โดยตั้งใจ

**รูป** — ไฟล์ใหญ่ใช้ `next/image`, ไอคอน SVG ใช้ `<img>` เพราะ image optimizer
ไม่รับ SVG (ตอบ 400) ทุกจุดที่เป็น `<img>` มีคอมเมนต์บอกเหตุผลไว้

โครงสร้างโฟลเดอร์, กฎ import, styling token และ coding convention ดู
[`architecture.md`](architecture.md) และ [`../CONTRIBUTING.md`](../CONTRIBUTING.md)

## เอกสารอื่น

| ไฟล์                                                  | เนื้อหา                                                            |
| ---------------------------------------------------- | ---------------------------------------------------------------- |
| [`architecture.md`](architecture.md)                 | **โครงสร้างโค้ด ชั้นข้อมูล และวิธีต่อ API** — อ่านคู่กับไฟล์นี้                  |
| [`api-by-page.md`](api-by-page.md)                   | **แต่ละหน้า แต่ละส่วน ต้องการข้อมูลอะไรจาก API** — เริ่มที่นี่ถ้าจะออกแบบ API  |
| [`mock-data-inventory.md`](mock-data-inventory.md)   | รายการข้อมูลทุกชุด — **ใช้อ้างอิงตอนออกแบบ API**                        |
| [`order-booking.md`](order-booking.md)               | ฟีเจอร์จองคำสั่งซื้อ และจุดที่ต้องต่อ backend                               |
| [`phase-scope.md`](phase-scope.md)                   | ขอบเขตแต่ละเฟส และอะไรถูกซ่อน                                       |
| [`system-one-i18n-spec.md`](system-one-i18n-spec.md) | prop ที่ต้องเพิ่มใน design system เพื่อให้แปลภาษาได้ครบ (Step 6 — ยังไม่ทำ) |
| [`mock-json/`](mock-json/)                           | ข้อมูล mock แบบ JSON ล้วน                                           |
