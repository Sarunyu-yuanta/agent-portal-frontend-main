# IC Portal

Portal สำหรับ IC / RM ของ Yuanta — ข้อมูลลูกค้า, พอร์ตการลงทุน, และแคตตาล็อกผลิตภัณฑ์

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4

## เริ่มใช้งาน

```bash
npm install
npm run dev
```

เปิด http://localhost:3000 — **ไม่ต้องตั้งค่า `.env` หรืออะไรเพิ่ม**

| คำสั่ง               |                  |
| ------------------ | ---------------- |
| `npm run dev`      | dev server       |
| `npm run build`    | build production |
| `npm run lint`     | ESLint           |
| `npx tsc --noEmit` | ตรวจ TypeScript  |

## สถานะ

**เป็น Frontend ล้วน ยังไม่มี Backend** — ข้อมูลทั้งหมดเป็นไฟล์ JSON ใน `src/data`
ไม่มีการเรียก API, ไม่มี API route, ไม่อ่าน environment variable

โครงสร้างเตรียมไว้ให้ต่อ API ได้โดยไม่ต้องแก้หน้าจอ — ทุกหน้าอ่านข้อมูลผ่าน hook ที่คืน
`{ data, isLoading }` และมี Skeleton ผูกกับ `isLoading` ไว้แล้ว

## 📄 อ่านก่อนเริ่มงาน

| เอกสาร                                                     |                                          |
| ---------------------------------------------------------- | ---------------------------------------- |
| **[docs/handover.md](docs/handover.md)**                   | **เริ่มที่นี่** — สถานะ, วิธีต่อ API, ข้อควรระวัง   |
| [docs/mock-data-inventory.md](docs/mock-data-inventory.md) | รายการข้อมูลทุกชุด — ใช้อ้างอิงตอนออกแบบ API    |
| [docs/phase-scope.md](docs/phase-scope.md)                 | ขอบเขตแต่ละเฟส และของที่ถูกซ่อนไว้ (**อย่าลบ**) |

> ⚠️ มีโค้ดบางส่วนที่ไม่มีใครเรียกแต่ **ห้ามลบ** — ถูกซ่อนไว้เพราะไม่อยู่ในเฟสนี้
> รายละเอียดใน `docs/phase-scope.md`
