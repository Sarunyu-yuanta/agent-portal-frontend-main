/**
 * Thai — the source of truth for every UI string's key and shape.
 *
 * `en/index.ts` must match this object key for key (it is typed
 * `satisfies Dictionary`), so a string added here without an English twin is
 * a compile error rather than a blank on the English site.
 *
 * Rules for writing entries:
 * - A message with values in it is a **function** — `(n) => …` — never a
 *   template assembled from fragments at the call site. Thai and English put
 *   words in different orders; a fragment glued to another fragment only reads
 *   right in the language it was written in.
 * - Name keys by what the string *is for*, not by its current wording.
 * - Content (product names, research, campaign text) does not belong here — it
 *   comes from the API already in the requested language.
 */

import orders from "./orders";
import dates from "./dates";
import fund from "./fund";
import stock from "./stock";
import products from "./products";
import client from "./client";
import commandCenter from "./commandCenter";
import planner from "./planner";
import shell from "./shell";
import research from "./research";
import compliance from "./compliance";
import pipeline from "./pipeline";
import performance from "./performance";
import campaigns from "./campaigns";
import learning from "./learning";

const th = {
  orders,
  dates,
  fund,
  stock,
  products,
  client,
  commandCenter,
  planner,
  shell,
  research,
  compliance,
  pipeline,
  performance,
  campaigns,
  learning,
  common: {
    back: "กลับ",
    backHome: "กลับหน้าแรก",
    close: "ปิด",
    cancel: "ยกเลิก",
    save: "บันทึก",
    saving: "กำลังบันทึก…",
    sending: "กำลังส่ง…",
    loading: "กำลังโหลด…",
    noData: "ไม่มีข้อมูล",
    notSpecified: "ไม่ระบุ",
    showing: (from: number, to: number, total: number) => `แสดง ${from}–${to} จาก ${total} รายการ`,
  },

  states: {
    loadErrorTitle: "โหลดข้อมูลไม่สำเร็จ",
    loadErrorBody: "ตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง",
    staleBanner: "ข้อมูลอาจไม่เป็นปัจจุบัน — อัปเดตล่าสุดไม่สำเร็จ",
    retry: "ลองใหม่",
    saveError: "บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง",
    deleteError: "ลบไม่สำเร็จ ลองใหม่อีกครั้ง",
    sendError: "ส่งไม่สำเร็จ ลองใหม่อีกครั้ง",
    empty: "ยังไม่มีข้อมูล",
    noResultTitle: "ไม่พบรายการที่ตรงกับการค้นหา",
    noResultBody: "ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรอง",
    noFilterResultTitle: "ไม่พบรายการที่ตรงกับตัวกรอง",
    noFilterResultBody: "ลองเปลี่ยนหรือล้างตัวกรอง",
    clearFilters: "ล้างตัวกรอง",
    notFoundPage: "ไม่พบหน้าที่ต้องการ",
    notFoundPageBody: "หน้าที่คุณกำลังมองหาอาจถูกย้าย ลบ หรือไม่มีอยู่ในระบบ",
    notFoundClient: "ไม่พบลูกค้ารายนี้",
    notFoundProduct: "ไม่พบสินค้านี้",
    notFoundOrder: "ไม่พบคำสั่งซื้อนี้",
    backToClientHub: "กลับไป Client 360",
    pageErrorTitle: "หน้านี้แสดงผลไม่สำเร็จ",
    pageErrorBody: "เกิดข้อผิดพลาดระหว่างแสดงข้อมูล ลองใหม่อีกครั้ง หรือไปหน้าอื่นจากเมนูด้านซ้าย",
  },

  nav: {
    sections: {
      workspace: "Workspace",
      sales: "Sales",
      planner: "Planner",
      growth: "Growth",
    },
    items: {
      "command-center": "Command Center",
      "client-hub": "Client 360",
      insights: "Insights",
      promotions: "Promotion/Events",
      "product-catalog": "Product Catalog",
      orders: "Order Management",
      performance: "Performance",
      "ic-learning": "IC Learning",
      "yaa-team-head": "YAA/Team Head",
      notes: "Notes",
      calendar: "Calendar",
      reminders: "Reminders",
    },
    expandSidebar: "ขยายแถบเมนู",
    collapseSidebar: "ย่อแถบเมนู",
    showClientNames: "แสดงชื่อลูกค้า",
    hideClientNames: "ซ่อนชื่อลูกค้า",
    openNavigation: "เปิดเมนู",
    openNotifications: "เปิดการแจ้งเตือน",
    notifications: "การแจ้งเตือน",
    noNotifications: "ไม่มีการแจ้งเตือน",
    logout: "ออกจากระบบ",
    language: "ภาษา",
    accountOf: (name: string) => `บัญชีของ ${name}`,
  },

  /** Page titles in the top bar — keyed by the route's unprefixed root path. */
  pageTitles: {
    "/command-center": "Command Center",
    "/client-hub": "Client 360",
    "/pipeline": "Pipeline",
    "/ai-insights": "AI Insights",
    "/promotions": "Promotion/Events",
    "/client": "Client 360",
    "/performance": "Performance",
    "/compliance": "Compliance & Risk",
    "/insights": "Insights",
    "/ic-learning": "IC Learning",
    "/yaa-team-head": "YAA/Team Head",
    "/product-catalog": "Product Catalog",
    "/orders": "Order Management",
    "/notes": "Notes",
    "/calendar": "Calendar",
    "/reminders": "Reminders",
  },

  auth: {
    loginTitle: "เข้าสู่ระบบ IC Portal",
    employeeId: "รหัสพนักงาน",
    password: "รหัสผ่าน",
    forgotPassword: "ลืมรหัสผ่าน",
    login: "เข้าสู่ระบบ",
    signingIn: "กำลังเข้าสู่ระบบ",
    showPassword: "แสดงรหัสผ่าน",
    hidePassword: "ซ่อนรหัสผ่าน",
    copyright: "©Copyright 2016 Yuanta Securities (Thailand). All Rights Reserved",
    errors: {
      credentials: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง",
      locked: "บัญชีถูกระงับชั่วคราว ติดต่อผู้ดูแลระบบ",
      network: "เชื่อมต่อระบบไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่",
    },
    forgot: {
      title: "ลืมรหัสผ่าน",
      body: "กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้ทางอีเมล",
      email: "อีเมล",
      submit: "ส่งลิงก์รีเซ็ตรหัสผ่าน",
      emailRequired: "กรุณากรอกอีเมล",
      emailInvalid: "รูปแบบอีเมลไม่ถูกต้อง",
      requestFailed: "ส่งลิงก์ไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองใหม่",
      sentTitle: "ส่งอีเมลแล้ว",
      sentBodyBefore: "หากอีเมล",
      sentBodyAfter: "มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจสอบกล่องขาเข้าของคุณ",
    },
    reset: {
      title: "ตั้งรหัสผ่านใหม่",
      body: "กรุณาตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ",
      newPassword: "รหัสผ่านใหม่",
      confirmPassword: "ยืนยันรหัสผ่านใหม่",
      submit: "บันทึกรหัสผ่านใหม่",
      passwordRequired: "กรุณากรอกรหัสผ่าน",
      passwordTooShort: (min: number) => `รหัสผ่านต้องมีอย่างน้อย ${min} ตัวอักษร`,
      confirmRequired: "กรุณายืนยันรหัสผ่าน",
      mismatch: "รหัสผ่านไม่ตรงกัน",
      requestFailed: "ตั้งรหัสผ่านไม่สำเร็จ ตรวจสอบการเชื่อมต่อแล้วลองใหม่",
      doneTitle: "เปลี่ยนรหัสผ่านสำเร็จ",
      doneBody: "คุณสามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
      invalidTitle: "ลิงก์ไม่ถูกต้องหรือหมดอายุ",
      invalidBody: "ลิงก์ตั้งรหัสผ่านใช้ได้ครั้งเดียวและมีอายุจำกัด ขอลิงก์ใหม่เพื่อตั้งรหัสผ่านอีกครั้ง",
      requestNew: "ขอลิงก์ใหม่",
    },
  },

  /**
   * Asset-class names. Keyed by the Thai label because that is what the data
   * uses as the key today (`allocationSlices`, holdings sections); look up with
   * `t.assetClass[label] ?? label` so an unknown class still shows as itself.
   */
  assetClass: {
    หุ้นไทย: "หุ้นไทย",
    หุ้นต่างประเทศ: "หุ้นต่างประเทศ",
    อนุพันธ์: "อนุพันธ์",
    กองทุนรวม: "กองทุนรวม",
    ตราสารหนี้: "ตราสารหนี้",
    ตราสารหนี้ต่างประเทศ: "ตราสารหนี้ต่างประเทศ",
    หุ้นกู้ที่มีอนุพันธ์แฝง: "หุ้นกู้ที่มีอนุพันธ์แฝง",
    เงินสด: "เงินสด",
  } as Record<string, string>,

  clientHub: {
    columns: {
      clientId: "Client ID",
      client: "Client",
      aum: "AUM (บาท)",
      thaiStock: "หุ้นไทย (บาท)",
      foreignStock: "หุ้นต่างประเทศ (บาท)",
      derivatives: "TFEX (บาท)",
      mutualFund: "กองทุนรวม (บาท)",
      bond: "ตราสารหนี้ (บาท)",
      foreignBond: "ตราสารหนี้ต่างประเทศ (บาท)",
      structuredBond: "หุ้นกู้ที่มีอนุพันธ์แฝง (บาท)",
      cashIdle: "เงินสด (บาท)",
      plYtd: "กำไร/ขาดทุน YTD (%)",
      liabilities: "หนี้สิน (บาท)",
    } as Record<string, string>,
  },

  promotions: {
    seatState: { available: "ยังไม่เต็ม", full: "เต็มแล้ว", past: "ผ่านไปแล้ว" },
    product: { stock: "หุ้น", "mutual-fund": "กองทุน", global: "Global", fcn: "FCN", bond: "Bond" },
    status: { upcoming: "เร็ว ๆ นี้", active: "กำลังดำเนินการ", ended: "หมดเขต" },
    segment: {
      uhnw: "UHNW",
      hnw: "HNW",
      aggressive: "รับความเสี่ยงสูง",
      moderate: "รับความเสี่ยงปานกลาง",
      conservative: "รับความเสี่ยงต่ำ",
      "idle-cash": "มีเงินสดคงค้าง",
    },
    format: { online: "Online", onsite: "Onsite" },
    type: { promotion: "โปรโมชัน", event: "สัมมนา/อีเว้นท์" },
    clientStatus: { "not-sent": "ยังไม่ส่ง", sent: "ส่งแล้ว", interested: "สนใจ", redeemed: "ใช้สิทธิ์แล้ว" },
    rsvp: { registered: "ลงทะเบียน", confirmed: "ยืนยัน", attended: "เข้าร่วม", "no-show": "ไม่มา" },
    noPeriod: "ไม่ระบุช่วงเวลา",
    statusLine: {
      running: "กำลังดำเนินการ",
      endedOn: (date: string) => `หมดเขตเมื่อ ${date}`,
      notStarted: "ยังไม่เริ่ม",
      lastDayToday: "วันสุดท้ายวันนี้",
      daysLeft: (n: number) => `เหลืออีก ${n} วัน`,
    },
  },

  /** Time buckets — the bell's past groups and the reminder queues. */
  buckets: {
    past: { today: "วันนี้", yesterday: "เมื่อวาน", week: "7 วันที่ผ่านมา", earlier: "ก่อนหน้านี้" },
    reminder: { overdue: "เลยกำหนด", today: "วันนี้", upcoming: "กำลังจะถึง", done: "เสร็จแล้ว" },
    zone: {
      overdue: "เลยกำหนด",
      today: "วันนี้",
      tomorrow: "พรุ่งนี้",
      thisWeek: "สัปดาห์นี้",
      next2Weeks: "2 สัปดาห์ข้างหน้า",
    },
  },

  catalog: {
    fundDetailTabs: {
      overview: "ภาพรวม",
      returns: "ผลตอบแทน",
      allocation: "สัดส่วนการลงทุน",
      info: "ข้อมูลกองทุน",
    },
  },

  insights: {
    allResearch: "บทวิเคราะห์ทั้งหมด",
  },

  risk: {
    severity: { critical: "วิกฤต", warning: "เฝ้าระวัง", watch: "ข้อสังเกต" },
    category: {
      margin: "มาร์จิ้น/วงเงิน",
      suitability: "ความเหมาะสมการลงทุน",
      conduct: "พฤติกรรมการซื้อขาย",
      other: "อื่น ๆ",
    },
    all: "ทั้งหมด",
    /** Placeholder until the desk decides what the action is. */
    cta: "Lorem ipsum",
  },

  globalError: {
    title: "ระบบแสดงผลไม่สำเร็จ",
    body: "เกิดข้อผิดพลาดที่ไม่คาดคิด ลองใหม่อีกครั้ง",
  },
};

export default th;
export type Dictionary = typeof th;
