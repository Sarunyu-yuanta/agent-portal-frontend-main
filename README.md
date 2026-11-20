# IC Portal

Portal สำหรับ IC / RM ของ Yuanta — ข้อมูลลูกค้า, พอร์ตการลงทุน, แคตตาล็อกผลิตภัณฑ์ และการจองคำสั่งซื้อ

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 · TanStack Query · zod
Design system: `@sarunyu/system-one`

## เริ่มใช้งาน

ต้องใช้ Node 24 (`.nvmrc`)

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — โหมดเริ่มต้นตอบข้อมูลจาก mock **ไม่ต้องตั้ง `.env`**
จะต่อ backend ให้คัดลอก `.env.example` เป็น `.env.local` (ดู [docs/architecture.md](docs/architecture.md#4-ต่อ-endpoint-แรก--ตัวอย่างเต็ม))

| คำสั่ง                |                                               |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | dev server                                    |
| `npm run build`     | build production                              |
| `npm run check`     | typecheck + lint + test — **ต้องผ่านก่อนเปิด PR** |
| `npm run typecheck` | TypeScript                                    |
| `npm run lint`      | ESLint (รวมกฎทิศทาง import)                    |
| `npm test`          | Vitest                                        |
| `npm run format`    | Prettier                                      |

pre-commit hook (husky + lint-staged) รัน ESLint และ Prettier กับไฟล์ที่ stage อัตโนมัติ

## สถานะ

**เป็น Frontend ล้วน ยังไม่มี Backend** — ทุก endpoint ตอบจากข้อมูลใน `src/mocks`
ชั้นต่อ API (HTTP client, cache, env) พร้อมแล้ว ต่อ backend ได้ทีละ endpoint โดยไม่ต้องแก้หน้าจอ

## โครงสร้างย่อ

```
src/app/[lang]/     route (บาง ๆ re-export view)
src/features/       โค้ดแต่ละ feature: api/ hooks/ components/ views/ store/ lib/
src/components/     UI ใช้ร่วม
src/lib/            api client, routes, format, utils
src/types/          domain type
src/mocks/          ข้อมูล mock
src/i18n/           TH / EN
```

## 📄 อ่านก่อนเริ่มงาน

| เอกสาร                                                     |                                                   |
| ---------------------------------------------------------- | ------------------------------------------------- |
| **[docs/handover.md](docs/handover.md)**                   | **เริ่มที่นี่** — สถานะ, ระบบหลังบ้าน, ข้อควรระวัง          |
| **[docs/architecture.md](docs/architecture.md)**           | โครงสร้างโค้ด, ชั้นข้อมูล, วิธีต่อ API, styling, tech debt |
| [CONTRIBUTING.md](CONTRIBUTING.md)                         | convention การเขียนโค้ด, commit, PR checklist       |
| [docs/api-by-page.md](docs/api-by-page.md)                 | แต่ละหน้าต้องการข้อมูลอะไรจาก API                      |
| [docs/mock-data-inventory.md](docs/mock-data-inventory.md) | รายการข้อมูลทุกชุด — ใช้อ้างอิงตอนออกแบบ API             |
| [docs/phase-scope.md](docs/phase-scope.md)                 | ขอบเขตแต่ละเฟส และของที่ถูกซ่อนไว้ (**อย่าลบ**)          |

> ⚠️ มีโค้ดบางส่วนที่ไม่มีใครเรียกแต่ **ห้ามลบ** — ถูกซ่อนไว้เพราะไม่อยู่ในเฟสนี้
> รายละเอียดใน `docs/phase-scope.md`
