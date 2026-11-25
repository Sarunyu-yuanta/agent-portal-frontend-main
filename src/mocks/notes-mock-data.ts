import type { Note } from "@/types/note";
import { MOCK_CURRENT_IC } from "@/mocks/session";

/**
 * TEMPORARY — one sample note so the Notes screens aren't empty in demos.
 *
 * To remove: make `seedNotesEndpoint`'s mock (`features/notes/api/notes.api.ts`)
 * return `[]` and delete this file. Nothing else reads it. Its id doesn't carry
 * `LOCAL_ID_PREFIX`, so the sidebar doesn't animate it in as a new note.
 *
 * Fixed timestamps, no reminder: a time computed at module load would differ
 * between the server render and the browser and break hydration.
 */
export const MOCK_SEED_NOTES: Note[] = [
  {
    id: "mock-note-1",
    clientIds: ["110002"],
    title: "ทบทวนพอร์ตไตรมาส 4",
    body: "ลูกค้าสนใจเพิ่มสัดส่วนตราสารหนี้ต่างประเทศ ประมาณ 10% ของพอร์ต\nขอข้อมูล Global Bond อายุไม่เกิน 3 ปี และ Term Sheet ประกอบการตัดสินใจ\nนัดคุยรายละเอียดอีกครั้งสัปดาห์หน้า",
    author: MOCK_CURRENT_IC.name,
    createdAt: "2026-11-24T03:30:00.000Z",
    updatedAt: "2026-11-24T03:30:00.000Z",
    reminderAt: null,
    reminderDone: false,
  },
];
