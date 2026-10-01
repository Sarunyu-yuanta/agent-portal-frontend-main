# ส่งงานต่อ — Yuanta IC Portal

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4
Design system: `@sarunyu/system-one`

---

## สถานะ

**Frontend ล้วน ยังไม่มี Backend** — ไม่มี `fetch`, ไม่มี API route, ไม่มี middleware
และไม่อ่าน env var เลยสักตัว

ข้อมูลทั้งหมด: `src/data/*.json` → `lib/mock-data.ts` → hooks → หน้าจอ

## ชั้นข้อมูล

หน้าจอไม่อ่าน JSON ตรง ๆ แต่อ่านผ่าน hook ที่คืน

```ts
type Resource<T> = { data: T; isLoading: boolean };
```

**ทุกหน้ามี Skeleton เตรียมไว้แล้ว ผูกกับ `isLoading` ตัวนี้** ตอนนี้เป็น `false` ตลอด
เพราะข้อมูลอยู่ในบันเดิล — พอต่อ API จริง Skeleton จะทำงานเองโดยไม่ต้องแก้ component

## ต่อ API — แก้แค่ 2 ไฟล์

| ไฟล์                       | จำนวน hook                             |
| -------------------------- | -------------------------------------- |
| `src/hooks/use-catalog.ts` | 13 (Product Catalog + Insights)        |
| `src/hooks/use-api.ts`     | 5 (ลูกค้า, NBA, Pipeline, Mini Kanban) |

เปลี่ยน body จาก `useStatic(mock)` เป็น `useResource(label, fetcher, mock)`
argument ตัวที่ 3 คือ fallback เวลา API ล่ม ควรใส่ไว้

target type อยู่ที่ `src/types/domain.ts`

## ⚠️ ต้องรู้ก่อนออกแบบ API

**API จะส่ง shape แบบไหนมาก็ได้** — mock ในโปรเจกต์เป็นแค่ตัวอย่างว่าอยากได้ข้อมูลอะไร
ไม่ใช่ข้อกำหนดว่า response ต้องหน้าตาแบบนี้

จุดที่รับความต่างคือ **`fetcher`** ที่ส่งเข้า `useResource` — จะ `snake_case`, ซ้อนหลายชั้น,
ชื่อ field ไม่ตรง, หน่วยต่างกัน ก็เขียน map เข้า type ใน `types/domain.ts` ในฟังก์ชันเดียว
**หน้าจอไม่ต้องแก้เลย**

ตัวเลขใน `clients.json` เป็นค่าดิบ ไม่ใช่ข้อความจัดรูปแล้ว — จัดรูปตอน render:

```
aum       = 450000000   (THB)          → formatAumThb()   → "฿ 450M"
plYtdPct  = 12.4        (percent)      → formatPlYtdPct() → "+12.4%"
```

ยกเว้น `lastContact` ที่ยังเก็บเป็นข้อความ (`"2 days ago"`) เพราะ **ยังไม่มีใครอ่าน** —
UI ที่แสดงมันไม่อยู่ในเฟสนี้ ถ้าเฟสหน้าเปิดใช้แล้ว API ส่ง ISO date มา ให้แปลงใน fetcher
ตัวอย่าง `formatLastContact` อยู่ใน `git show d2c4623:src/lib/api.ts`

> ⚠️ `lastContact` ใน `clients.json` และ `lastContactFromCallLogs()` ใน
> `client-detail-data.ts` **ไม่มีใครเรียกเลย แต่ห้ามลบ** — ถูกซ่อนไว้เพราะไม่อยู่ในเฟสนี้
> (ดู `phase-scope.md`) เครื่องมือหา dead code จะชี้ว่าลบได้ ซึ่งผิด

**ข้อมูลบางชุดเป็นของ generate ไม่ใช่ data model** ต้อง model ใหม่ก่อนทำ endpoint

- `ALL_OVERSEAS_BONDS` — `Array.from({length: N})` วนซ้ำจาก seed ไม่กี่ตัว id เป็นของปลอม
- `GLOBAL_BOND_ISSUERS` — `Record` keyed by id ไม่ใช่ collection
- `resolveFixedIncomeCompany` — สังเคราะห์บริษัทจากรายการหุ้นกู้เมื่อไม่มี record

**`clientId` → ชื่อลูกค้า join ที่ import time** ใน `lib/mock-data.ts`
(NBA, Pipeline, Insights, KYC, Compliance alerts — ชื่อลูกค้าอยู่ใน `clients.json` ที่เดียว)
ต้องตัดสินใจว่า API embed ชื่อมาให้ หรือ frontend join เอง

**Notes เป็น React state ล้วน** — optimistic create + map `localId → serverId`
ที่รองรับ async ถูกถอดออกแล้ว ถ้าต้องการกู้ได้จาก
`git show d2c4623:src/contexts/notes-context.tsx`

## Feature flags

`src/lib/feature-flags.ts` — โค้ดยังอยู่ครบ เปลี่ยน `false` เป็น `true` ได้เลย

| Flag                    | สถานะ    |
| ----------------------- | -------- |
| `NOTES_ENABLED`         | ปิด      |
| `CALENDAR_ENABLED`      | ปิด      |
| `REMINDERS_ENABLED`     | ปิด      |
| `CALL_LOG_ENABLED`      | ปิด      |
| `KYC_ALERTS_ENABLED`    | **เปิด** |
| `ORDER_BOOKING_ENABLED` | **เปิด** |

Notes / Calendar / Reminders พึ่งพากัน ควรเปิดพร้อมกันทั้งชุด

## ⚠️ Order booking เป็นฟีเจอร์เดียวที่ "เขียน"

ที่เหลือในแอปอ่านอย่างเดียว แต่การจองคำสั่งซื้อสร้างข้อมูลใหม่ — เก็บใน React state
(`src/contexts/orders-context.tsx`) แบบเดียวกับ Notes และมี **สอง `setTimeout` ที่จำลอง
ระบบภายนอก** ต้องถอดออกตอนต่อ backend จริง

รายละเอียดทั้งหมดอยู่ที่ [`order-booking.md`](order-booking.md)

## ข้อตกลงในโปรเจกต์

**เช็ค `isLoading` ต้องอยู่เหนือเช็ค not-found** ไม่งั้นพอต่อ API จริงจะขึ้น
"ไม่พบข้อมูล" แว่บหนึ่งทุกครั้งก่อนข้อมูลมา (ตอนนี้ยังไม่เห็นเพราะ `isLoading` เป็น false ตลอด)

**Loading อยู่ที่จุดที่หาข้อมูล** — component ที่รับ object สำเร็จรูปมาทาง props
ไม่ถือ skeleton ให้ route page ถือแทน

**View state อยู่ใน URL ไม่ใช่ `useState`** — dashboard layout ไม่ remount ตอนเปลี่ยนหน้า
`useState` จะหาย (`lib/query-state.ts`, `lib/nav-memory.ts`)

**Column filter ของ Client 360 จำถาวร** ผ่าน `lib/preferences.ts` (localStorage)
filter อื่นรีเซ็ตทุก refresh โดยตั้งใจ

**รูป** — ไฟล์ใหญ่ใช้ `next/image`, ไอคอน SVG ใช้ `<img>` เพราะ image optimizer
ไม่รับ SVG (ตอบ 400) ทุกจุดที่เป็น `<img>` มีคอมเมนต์บอกเหตุผลไว้

## เอกสารอื่น

| ไฟล์                                               | เนื้อหา                                          |
| -------------------------------------------------- | ------------------------------------------------ |
| [`mock-data-inventory.md`](mock-data-inventory.md) | รายการข้อมูลทุกชุด — **ใช้อ้างอิงตอนออกแบบ API** |
| [`order-booking.md`](order-booking.md)             | ฟีเจอร์จองคำสั่งซื้อ และจุดที่ต้องต่อ backend    |
| [`phase-scope.md`](phase-scope.md)                 | ขอบเขตแต่ละเฟส และอะไรถูกตัดออก                  |
| [`mock-json/`](mock-json/)                         | ข้อมูล mock แบบ JSON ล้วน                        |
