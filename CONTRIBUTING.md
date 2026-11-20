# Contributing

อ่าน [docs/architecture.md](docs/architecture.md) ก่อน — กฎส่วนใหญ่ด้านล่าง ESLint บังคับให้อยู่แล้ว

## ตั้งชื่อไฟล์

| ชนิด                          | รูปแบบ                          | ตัวอย่าง                  |
| ---------------------------- | ------------------------------ | ----------------------- |
| component (ไฟล์ละ 1 ตัวหลัก)    | `PascalCase.tsx`, named export | `ClientDetailPanel.tsx` |
| หลาย component เล็ก ๆ รวมไฟล์  | `kebab-case.tsx`               | `stock-ui.tsx`          |
| hook                         | `use-kebab-case.ts(x)`         | `use-order-books.ts`    |
| logic / data / type          | `kebab-case.ts`                | `order-book.ts`         |
| endpoint                     | `<feature>.api.ts` ใน `api/`   | `clients.api.ts`        |
| primitive ใน `components/ui` | `kebab-case.tsx` (แบบ shadcn)  | `empty-state.tsx`       |
| test                         | ข้างไฟล์ที่ทดสอบ `*.test.ts(x)`    | `pagination.test.ts`    |

## เขียนโค้ด

- **ข้อความ UI อยู่ใน dictionary** (`src/i18n/dictionaries/{th,en}`) — ห้ามเขียนตรงใน JSX
- **ข้อมูลอ่านผ่าน hook ของ feature** — ห้าม import `@/mocks` นอก `features/*/api`
- **ลิงก์** ใช้ `ROUTES` / builder ใน `src/lib/routes.ts` กับ `LocaleLink` / `useLocalizedRouter`
- **สี** ใช้ token (`neutral-*`, `brand-*`, `var(--…)`) ห้ามใช้ hex และห้าม `text-gray-*` (ดู architecture §6)
- **className มีเงื่อนไข** ใช้ `cn()`
- **view state** (tab, filter, panel ที่เปิด) เก็บใน URL ผ่าน `src/lib/query-state.ts`
- **ลำดับ state** `isLoading → error → not-found → empty → data`
- **error ที่กู้คืนได้** ส่ง `reportError()` — ห้าม `console.*`
- type-only import ใช้ `import type`; ห้าม `any`; หลีกเลี่ยง `as unknown as` และ `!`
- คอมเมนต์อธิบาย **ทำไม** ไม่ใช่ **ทำอะไร**

## Commit

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `refactor:`, `style:`,
`docs:`, `test:`, `chore:` — scope เป็นชื่อ feature เช่น `feat(orders): …`

## PR checklist

- [ ] `npm run check` ผ่าน และ `npm run build` ผ่าน
- [ ] ข้อความใหม่มีทั้ง `th` และ `en`
- [ ] หน้าใหม่ / ข้อมูลใหม่มี loading, error, empty state
- [ ] ทดสอบทั้ง desktop และ mobile, ทั้ง `/th` และ `/en`
- [ ] ถ้าเปลี่ยนสิ่งที่ backend ต้องรู้ อัปเดต `docs/api-by-page.md` / `docs/mock-data-inventory.md`
