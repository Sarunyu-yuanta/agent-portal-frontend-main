# สถาปัตยกรรมโค้ด — Yuanta IC Portal

เอกสารนี้อธิบาย **โค้ดจัดวางอย่างไร ข้อมูลไหลอย่างไร และต้องแก้ตรงไหนเมื่อต่อ API**
สถานะโปรเจกต์และเรื่องธุรกิจอยู่ใน [handover.md](handover.md)

---

## 1. โครงสร้างโฟลเดอร์

```
src/
  app/[lang]/…          route เท่านั้น — page.tsx, layout.tsx, error.tsx, not-found.tsx
  features/<feature>/   โค้ดของแต่ละ feature
    api/                endpoint (ฝั่งอ่าน) และ mutation — ที่เดียวที่อ่าน src/mocks ได้
    hooks/              hook ที่หน้าจอใช้ (คืน Resource<T>)
    components/         UI ของ feature
    views/              หน้าจอเต็ม ๆ ที่ page.tsx re-export
    store/              React context ฝั่งเขียน (orders, notes, campaigns, privacy)
    lib/                logic ล้วน ไม่มี JSX (sort, filter, derive, format เฉพาะ feature)
  components/
    ui/                 primitive ใช้ร่วม (shadcn-style, kebab-case)
    charts/             กราฟใช้ร่วม
    providers/          provider ระดับแอป (QueryProvider)
  hooks/                hook ทั่วไป ไม่ผูก feature (media query, debounce, scroll …)
  lib/
    api/                http client, endpoint, mutation, query client, Resource
    format/             จัดรูปตัวเลข
    routes.ts           path ของแอป (ROUTES, clientPath …)
    pagination.ts, constants.ts, report-error.ts, utils.ts (cn)
  config/               env (zod), feature flags, external links
  types/                domain type ที่หลาย feature ใช้ (client, order, campaign …)
  mocks/                ข้อมูล mock ทั้งหมด (JSON + generator)
  i18n/                 dictionary TH/EN, provider, formatter, navigation
```

**feature** ปัจจุบัน: `auth`, `shell` (sidebar/header/breadcrumb/notification), `clients`
(ข้อมูลลูกค้า ไม่มี UI), `client-hub`, `client-profile`, `portfolio`, `command-center`,
`catalog` (แยกย่อยตามสินค้า: `stock`, `mutual-fund`, `fixed-income`, `global-bond`,
`structured-product`, `robo-advisory`, `top-idea`, `product-trending`), `orders`, `calendar`,
`notes`, `promotions`, `insights`, `compliance`, และหน้าต้นแบบ `ai-insights`, `pipeline`, `performance`

### route บาง ๆ

`page.tsx` ไม่มี logic — re-export view จาก feature:

```ts
// src/app/[lang]/(dashboard)/client-hub/page.tsx
export { ClientHubView as default } from "@/features/client-hub/views/ClientHubView";
```

## 2. กฎ dependency (ESLint บังคับ — ผิดคือ build ไม่ผ่าน)

```
app (routes)  →  features  →  components / hooks / lib / config / types / i18n
```

| กฎ                                                                       | เหตุผล                                                 |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| ห้าม import ด้วย `../` — ใช้ `./x` ในโฟลเดอร์เดียวกัน, ที่เหลือ `@/…`             | ย้ายไฟล์แล้ว import ไม่พัง อ่านแล้วรู้ทันทีว่ามาจากไหน            |
| ห้าม import จาก `@/app/*` (ยกเว้น `*.css`)                                 | route ไม่ใช่ library                                    |
| `components/ hooks/ lib/ types/ i18n/ config/` ห้าม import `@/features/*` | ชั้นล่างต้องไม่รู้จักชั้นบน — ของที่หลาย feature ใช้ให้ย้ายลงมา      |
| ห้าม import `@/mocks/*` นอก `features/*/api/**`                           | หน้าจออ่านข้อมูลผ่าน endpoint เท่านั้น → ต่อ API แล้วไม่มีจุดตกหล่น |
| `no-console` — ใช้ `reportError()` (`src/lib/report-error.ts`)            | ต่อ Sentry/monitoring ที่เดียว                            |

ไฟล์ `lib/` ที่ยังอ่าน mock ตรง ๆ มีรายชื่อชัดเจนใน `LEGACY_MOCK_READERS` (`eslint.config.mjs`)
**ห้ามเพิ่มรายชื่อ** — ย้ายการอ่านของไฟล์นั้นไปหลัง endpoint แล้วลบออกจากลิสต์ (ดู §8)

## 3. ข้อมูลไหลอย่างไร

### ฝั่งอ่าน

```
src/mocks/*  ──┐
               ├─ defineEndpoint(key, { mock, http? })   features/<f>/api/<f>.api.ts
apiFetch() ────┘                │
                                ▼
                   useEndpoint(endpoint, args, { fallback })   (TanStack Query)
                                │
                                ▼
                   hook ของ feature → Resource<T> → หน้าจอ
```

- **`defineEndpoint`** (`src/lib/api/endpoint.ts`) — ประกาศการอ่านหนึ่งอย่าง
  `mock` บังคับมี, `http` ใส่เมื่อ backend พร้อม
- **โหมด** (`NEXT_PUBLIC_API_MODE`) — `mock`: ทุก endpoint ตอบจาก mock;
  `http`: endpoint ที่มี `http` เรียก API, ที่ยังไม่มีตอบ mock ต่อ → **ต่อทีละ endpoint ได้**
- **`useEndpoint`** — cache, ไม่ยิงซ้ำเมื่อหลาย component ใช้ key เดียวกัน, ยกเลิก request
  เมื่อ unmount, `pollMs` สำหรับข้อมูลที่ต้อง refresh (ดู tier ใน `api-by-page.md`)
  ในโหมด mock ข้อมูลพร้อมตั้งแต่ frame แรก จึงไม่มี skeleton กระพริบ
- **`fallback`** — ค่าระหว่างรอ / เมื่อโหลดครั้งแรกล้มเหลว ต้องเป็น **ค่าว่าง** (`[]`, `null`)
  ห้ามใส่ mock และเป็นค่าคงที่นอก component (array ใหม่ทุก render ทำให้ memo พัง)
- **`apiFetch`** (`src/lib/api/http.ts`) — base URL จาก env, header `Authorization` จาก
  `setAuthHeaderProvider`, timeout 8 วินาที, error แบบมี type (`ApiError`, `TimeoutError`,
  `ResponseShapeError`), ตรวจ response ด้วย zod ผ่าน `schema`

### ฝั่งเขียน

- **คำสั่งที่ไม่มี state** (sign-in, reset password): `defineMutation({ mock, http? })`
  (`src/lib/api/mutation.ts`) ตัวอย่างใน `src/features/auth/api/auth.api.ts`
- **store** (`features/*/store/*-context.tsx`): mutator เป็น `async` ทุกตัว
  ค่าเริ่มต้นมาจาก seed ใน `features/<f>/api/*.api.ts` — ต่อ backend แล้วแนวทางคือ
  โหลดข้อมูลผ่าน endpoint และเปลี่ยน mutator เป็น request แล้ว `invalidateQueries`
  (หรือย้ายไป `useMutation` ของ TanStack Query)

### ผู้ใช้ที่ล็อกอิน

`useCurrentIc()` (`src/features/auth/hooks/use-current-ic.ts`) — ชื่อ ตำแหน่ง ทีม ตัวย่อ
ทุกที่ที่บันทึกผู้สร้าง (โน้ต, การจอง, การแชร์) และตัวกรอง "ของฉัน" อ่านจากที่นี่

## 4. ต่อ endpoint แรก — ตัวอย่างเต็ม

```ts
// src/features/clients/api/clients.schema.ts
import { z } from "zod";

const clientSchema = z.object({
  client_id: z.string(),
  full_name: z.string(),
  aum_thb: z.number(),
  // …
});
export const clientListSchema = z.array(clientSchema);
```

```ts
// src/features/clients/api/clients.api.ts
export const clientsEndpoint = defineEndpoint("clients", {
  mock: () => mockClients,
  http: async (signal) => {
    const rows = await apiFetch("/clients", { schema: clientListSchema, signal });
    // map รูปแบบของ API → type ของแอป ที่นี่ที่เดียว
    return rows.map((r) => ({ id: r.client_id, name: r.full_name, aum: r.aum_thb /* … */ }));
  },
});
```

แล้วตั้ง `.env.local`:

```
NEXT_PUBLIC_API_MODE=http
NEXT_PUBLIC_API_BASE_URL=https://bff.example.com/v1
```

hook (`useClients`) และทุกหน้าจอที่ใช้ไม่ต้องแก้ — skeleton / error state ทำงานเอง

## 5. เพิ่มหน้า / feature ใหม่

1. route: `src/app/[lang]/(dashboard)/<path>/page.tsx` → re-export view
2. view: `src/features/<feature>/views/<Name>View.tsx` (`"use client"` ถ้าใช้ hook)
3. ข้อมูล: type ใน `src/types/` (ถ้าหลาย feature ใช้) หรือ `features/<f>/lib/`
   → mock ใน `src/mocks/` → endpoint ใน `features/<f>/api/` → hook ใน `features/<f>/hooks/`
4. ข้อความ: เพิ่ม key ใน `src/i18n/dictionaries/th/*.ts` และ `en/*.ts`
   (`en` ใช้ `satisfies` — key ไม่ครบ compile ไม่ผ่าน)
5. ลิงก์: ใช้ `ROUTES` / builder ใน `src/lib/routes.ts` กับ `LocaleLink` / `useLocalizedRouter`
6. ลำดับ state ของหน้า: `isLoading → error → not-found → empty → data`
   (`ResourceView` ใน `src/components/ui/empty-state.tsx`)
7. เมนู sidebar: `src/features/shell/components/AppSidebar.tsx`, title/breadcrumb:
   `src/features/shell/lib/page-chrome.ts`, `page-breadcrumbs.ts`

## 6. Styling

- **Tailwind v4** (CSS-first ใน `src/app/globals.css`) + design system `@sarunyu/system-one`
- **สี ใช้ token ห้ามใช้ hex**: `text-neutral-900`, `bg-neutral-50`, `border-brand-600`, `border-black/10`
  (`neutral-*` = `--fill-gray-*`, `brand-*` = `--fill-p1-*` ของ system-one)
  - ⚠️ **ห้ามใช้ `text-gray-*` / `bg-gray-*`** — system-one มี class ชื่อเดียวกันที่อยู่นอก
    `@layer` จึงชนะ variant ของ Tailwind ทุกตัว (`lg:`, `hover:`) เงียบ ๆ
  - token เชิงความหมายของ system-one ใช้ผ่าน `var()`: `text-[var(--text-default-placeholder)]`
- **className แบบมีเงื่อนไขใช้ `cn()`** (`src/lib/utils.ts`) — ไม่ใช่ template literal
  `cn` รู้จัก text size ที่ custom ไว้ ทำให้ merge ถูก
- `!important` ใน `globals.css` มีเพราะ stylesheet ของ system-one ไม่อยู่ใน `@layer`
  และโหลดหลัง — มีคอมเมนต์อธิบายทุกจุด
- ตัวเลขเงิน: `formatInteger` / `formatDecimal` (`src/lib/format/number.ts`),
  วันที่และตัวเลขในประโยค: `useFormat()` (`src/i18n/I18nProvider`)

## 7. Security — ข้อมูลที่ไปถึง browser

**กฎข้อแรก: ทุกอย่างที่ส่งไปถึง browser คนที่กด Inspect / DevTools เห็นได้ทั้งหมด**
ได้แก่ JS bundle (แท็บ Sources), response ของ API (แท็บ Network), React Query cache
และ props (React DevTools), localStorage, cookie ที่ไม่ใช่ httpOnly และ console

| เรื่อง               | กติกา                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ข้อมูลจาก API        | ให้ backend ส่งเฉพาะ field ที่หน้านั้นใช้จริง การซ่อน field ใน UI ไม่ได้ทำให้มันหายไปจาก response                                                                                                                         |
| Privacy mode / สิทธิ์ | `maskName()` แค่ซ่อนบนจอ ข้อมูลดิบยังอยู่ใน cache ถ้าต้องปิดจริง (เช่นตามสิทธิ์ผู้ใช้) backend ต้อง mask มาให้                                                                                                                   |
| env                | `NEXT_PUBLIC_*` ถูกฝังเข้า bundle ห้ามใส่ secret เด็ดขาด ค่าลับใช้ได้เฉพาะโค้ดฝั่ง server และไฟล์นั้นต้อง `import "server-only"`                                                                                             |
| Auth               | session/token เก็บใน cookie แบบ `HttpOnly; Secure; SameSite=Lax` ที่ BFF ตั้งให้ ห้ามเก็บ token ใน localStorage/sessionStorage `setAuthHeaderProvider` (`src/lib/api/http.ts`) ใช้เฉพาะเมื่อ backend บังคับ header จริง ๆ |
| Web storage        | localStorage/sessionStorage เก็บได้แค่ค่าที่ไม่ลับ (preference, id ที่กดรับทราบ) ห้ามเก็บข้อมูลลูกค้า                                                                                                                        |
| Console            | log error ผ่าน `reportError()` เท่านั้น production log แค่ context กับชนิด error ไม่ log payload (มี test กำกับ)                                                                                                      |
| Mock data          | ต้องเป็นข้อมูลสมมติล้วน อีเมลใช้ `@example.com` เบอร์ใช้ `+66 00 000 xxxx` ห้ามใช้ชื่อ/อีเมล/เบอร์ของคนจริง                                                                                                                  |
| Source map         | ปิดใน production (`productionBrowserSourceMaps: false` ใน `next.config.ts`)                                                                                                                                  |
| Response headers   | ตั้งใน `next.config.ts`: CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS และปิด `X-Powered-By` ถ้าเพิ่มโดเมนภายนอก (รูป, analytics) ต้องเพิ่มใน CSP ด้วย                              |

**ก่อน release:** `npm run build && npm run check:bundle` สคริปต์นี้สแกน `.next/static` หา
string ที่ดูเป็น secret (fail เสมอ) และข้อมูล mock (fail เมื่อ build ด้วย `NEXT_PUBLIC_API_MODE=http`)

## 8. งานที่ยังค้าง (tech debt ที่รู้แล้ว)

| เรื่อง                                                  | ที่อยู่                                                             | ทำอย่างไร                                                                                                                                  |
| ----------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| ไฟล์ `lib/` ที่ยังอ่าน mock ตรง ๆ (15 ไฟล์)                 | `LEGACY_MOCK_READERS` ใน `eslint.config.mjs`                    | ย้ายการอ่านไปหลัง endpoint ทีละไฟล์ แล้วลบออกจากลิสต์                                                                                             |
| Breadcrumb หาชื่อ entity แบบ sync จาก mock              | `src/features/shell/lib/page-breadcrumbs.ts`                    | ให้หน้า detail ส่งชื่อผ่าน `header-slot-context` หรืออ่านจาก query cache                                                                          |
| ข้อมูลที่ generate ไม่ใช่ data model                        | ดู handover.md "ต้องรู้ก่อนออกแบบ API"                               | model ใหม่ก่อนทำ endpoint                                                                                                                   |
| timer จำลองระบบภายนอก 3 ตัว                            | `src/features/orders/store/orders-context.tsx`                  | ลบเมื่อมี push / polling จริง                                                                                                                 |
| store ยังเป็น React state ล้วน                           | `features/*/store/`                                             | โหลดผ่าน endpoint + mutation + invalidate                                                                                                  |
| className แบบ template literal (~585 จุด)              | ทั่วโปรเจกต์                                                       | เปลี่ยนเป็น `cn()` เมื่อแก้ไฟล์นั้น (ระวัง tailwind-merge ตัด class ที่ชนกัน)                                                                           |
| hex ที่ไม่อยู่ใน palette (~150 จุด) และ inline `style={{}}` | ทั่วโปรเจกต์                                                       | ขอ token จาก design system แล้วแทน                                                                                                         |
| system-one CSS ไม่อยู่ใน `@layer`                        | `src/app/[lang]/layout.tsx`                                     | ย้ายเข้า layer แล้วลบ `!important` ใน `globals.css` (ต้องทดสอบทั้งแอป)                                                                          |
| ฟอร์มยัง validate ด้วยมือ                                 | `features/auth/views/*`, `features/orders/components/booking/*` | ติดตั้ง `react-hook-form` + `zod` ไว้แล้ว — ใช้กับฟอร์มใหม่และตอนแก้ฟอร์มเดิม                                                                         |
| ปุ่ม CTA ของ Risk alert ยังเป็น "Lorem ipsum"             | `src/features/command-center/lib/risk-config.ts`                | รอ product กำหนด                                                                                                                          |
| URL ระบบส่งคำสั่งซื้อยังเป็น placeholder                     | `src/config/external-links.ts`                                  | ใส่ URL จริง / ย้ายไป env                                                                                                                    |
| ข้อความใน design system ยังเป็นไทย                       | [system-one-i18n-spec.md](system-one-i18n-spec.md)              | รอ system-one เวอร์ชันใหม่                                                                                                                   |
| dark mode — token และ class `dark:` มีอยู่แต่ยังไม่เปิดใช้    | `globals.css`, greeting card                                    | ตัดสินใจว่าจะทำหรือลบ                                                                                                                         |
| ข้อมูล mock ทั้งชุดอยู่ใน JS bundle                          | `src/mocks/*`, `defineEndpoint` import แบบ static               | เมื่อทุก endpoint มี `http` แล้ว ให้ build โหมด http ไม่รวม `src/mocks` (เช่น alias ไป stub ใน `next.config.ts`) แล้วให้ `npm run check:bundle` ผ่าน |
| CSP ยังใช้ `'unsafe-inline'`                            | `next.config.ts`                                                | เปลี่ยนเป็น CSP แบบ nonce ตาม `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md` (ทุกหน้าจะเป็น dynamic)                 |

## 9. คำสั่ง

| คำสั่ง                                  |                                                              |
| ------------------------------------- | ------------------------------------------------------------ |
| `npm run dev`                         | dev server                                                   |
| `npm run check`                       | typecheck + lint + test (ต้องผ่านก่อนเปิด PR)                    |
| `npm run typecheck` / `lint` / `test` | แยกทีละตัว                                                     |
| `npm run format`                      | Prettier ทั้ง repo (pre-commit hook ทำให้เฉพาะไฟล์ที่ stage อยู่แล้ว) |
| `npm run build`                       | build production                                             |
| `npm run check:bundle`                | หลัง build: สแกน bundle หา secret และ mock data (ดู §7)        |
