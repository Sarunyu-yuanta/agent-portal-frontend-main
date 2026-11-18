/** `commandCenter` namespace — see th/index.ts for the rules. */
import type { ReactNode } from "react";

const commandCenter = {
  greeting: (name: string) => `สวัสดี ${name}`,
  viewAll: "ดูทั้งหมด",
  viewAllItems: (n: number) => `ดูทั้ง ${n} รายการ`,
  moreItems: (n: number) => `ดูอีก ${n} รายการ`,
  contactChannels: "ช่องทางติดต่อ",
  backToDashboard: "กลับไปหน้า Dashboard",

  statTiles: {
    clients: "จำนวน Client",
    totalAum: "AUM รวมทั้งหมด",
    viewAllAria: (label: string) => `${label} — ดูรายการทั้งหมด`,
  },

  assetSummary: {
    title: "ภาพรวมสินทรัพย์",
    caption: (clients: number, classes: number) => `จาก ${clients} ลูกค้า · ${classes} ประเภทสินทรัพย์`,
    emptyTitle: "ยังไม่มีข้อมูลสินทรัพย์",
    emptyBody: "ภาพรวมจะแสดงเมื่อลูกค้าในพอร์ตมีสินทรัพย์",
  },

  clientList: {
    title: "รายชื่อ Client",
    empty: "ไม่มีลูกค้าในระบบ",
  },

  reminders: {
    title: "Reminders",
    loadError: "โหลดรายการเตือนไม่สำเร็จ",
  },

  calendar: {
    prevMonth: "เดือนก่อนหน้า",
    nextMonth: "เดือนถัดไป",
    addReminder: "เพิ่มรายการเตือน",
    addNote: "เพิ่มโน้ต",
    reminderAdded: "เพิ่มรายการเตือนแล้ว",
    reminderAddError: "เพิ่มรายการเตือนไม่สำเร็จ ลองใหม่อีกครั้ง",
  },

  kyc: {
    title: "KYC ใกล้หมดอายุ",
    emptyTitle: "ไม่มี KYC ใกล้หมดอายุ",
    emptyBody: "ลูกค้าทุกรายมี KYC ที่ยังไม่เข้าช่วงเตือน",
    /** Sits between the "N more" count and the nearest deadline. */
    nearestSeparator: " · ใกล้สุด ",
  },

  nba: {
    title: "AI Next Best Actions",
    pageTitle: "Next Best Actions",
    comingSoon: "Coming Soon",
    comingSoonMessage: {
      book: "ทุกเช้า AI จะบอกว่าวันนี้ควรดูแลลูกค้ารายไหนก่อน ด้วยเรื่องอะไร และเพราะอะไร",
      client: "AI จะแนะนำว่าควรคุยเรื่องอะไรกับลูกค้ารายนี้ต่อ เพราะอะไร พร้อมร่างข้อความให้",
    },
    emptyTitle: "ไม่มีข้อเสนอค้างอยู่",
    emptyBody: "AI จะเสนอ action ใหม่เมื่อมีสัญญาณจากพอร์ตหรือพฤติกรรมของลูกค้า",
    category: {
      revenue: "โอกาสสร้างรายได้",
      compliance: "ความเสี่ยงด้าน Compliance",
      productMatch: "สินค้าที่ตรงกับลูกค้า",
      reengage: "กลับมาติดต่อ",
    },
    revenueOpportunity: "โอกาสรายได้",
    dismissAria: "ไม่สนใจข้อเสนอนี้",
    dismiss: "ไม่สนใจ",
  },

  callLog: {
    title: "Call Log",
    emptyTitle: "ยังไม่มีบันทึกการโทร",
    emptyBodyAll: "สายที่บันทึกไว้จากลูกค้าทุกรายจะมารวมกันที่นี่",
    emptyBodyClient: "ยังไม่มีสายที่บันทึกไว้สำหรับลูกค้ารายนี้",
    detailTitle: "รายละเอียดการโทร",
    viewClientHistory: "ดูประวัติการโทรทั้งหมดของลูกค้า",
    direction: { outbound: "โทรออก", inbound: "รับสาย" },
    allClients: (n: number) => `ลูกค้าทั้งหมด (${n})`,
    perPage: "แสดงต่อหน้า",
    /** The pager's range line; the three figures arrive already styled. */
    showingRange: (from: ReactNode, to: ReactNode, total: ReactNode): ReactNode[] => [
      "แสดง ",
      from,
      " – ",
      to,
      " จาก ",
      total,
      " สาย",
    ],
    columns: {
      client: "ลูกค้า",
      date: "วันที่",
      direction: "ประเภทการโทร",
      duration: "ระยะเวลา",
      summary: "สรุป",
    },
  },

  risk: {
    title: "Proactive Compliance Alerts",
    loadError: "โหลดรายการความเสี่ยงไม่สำเร็จ",
    emptyTitle: "ไม่มีรายการความเสี่ยงค้างอยู่",
    emptyBody: "ระบบจะแจ้งเตือนทันทีเมื่อพบความเสี่ยงด้านมาร์จิ้น ความเหมาะสมของการลงทุน หรือพฤติกรรมการซื้อขาย",
    emptySeverity: "ไม่มีรายการในระดับนี้",
    emptyCategory: "ไม่มีรายการในหมวดนี้",
    emptyFilteredBody: "เลือก “ทั้งหมด” เพื่อดูรายการความเสี่ยงอื่น",
    noFilterResultTitle: "ไม่พบรายการตามตัวกรอง",
    noFilterResultBody: "ลองเลือกหมวดหรือระดับความเสี่ยงอื่น หรือล้างตัวกรองเพื่อดูทั้งหมด",
    severityChipAria: (label: string, n: number) => `${label} ${n} รายการ`,
    acknowledged: "รับทราบแล้ว",
    /** Placeholder, like `t.risk.cta` — names the finding the button fired on. */
    ctaToast: (ruleCode: string, client: string) => `Lorem ipsum — ${ruleCode} · ${client}`,
  },

  riskDetail: {
    title: "รายละเอียดความเสี่ยง",
    viewClientProfile: "ดูโปรไฟล์ลูกค้า",
    details: "รายละเอียด",
    triggerFigures: "ตัวเลขที่ทำให้เกิดการแจ้งเตือน",
    contactRestriction: "ข้อจำกัดในการติดต่อ",
    acknowledge: "รับทราบ",
  },
};

export default commandCenter;
