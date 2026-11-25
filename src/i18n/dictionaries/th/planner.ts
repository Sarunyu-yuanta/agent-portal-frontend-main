/** `planner` namespace — see th/index.ts for the rules. Calendar, Notes and Reminders. */
const planner = {
  /** Shared across the Calendar, Notes and the reminder surfaces. */
  newReminder: "เพิ่มการเตือน",
  addNote: "เพิ่มโน้ต",
  delete: "ลบ",
  noAdditionalText: "ไม่มีข้อความเพิ่มเติม",
  /** A note's title when it has none — a day item, a pill. */
  untitledNote: "โน้ตไม่มีชื่อ",
  saved: "บันทึกแล้ว",
  deleted: "ลบแล้ว",
  saveFailedKept: "บันทึกไม่สำเร็จ ข้อความยังอยู่ ลองใหม่อีกครั้ง",
  deleteReminderTitle: "ลบการเตือนนี้?",
  deleteNoteBody: "โน้ตนี้จะถูกลบอย่างถาวร",

  /**
   * SET corporate-action codes. Keyed by the exchange's code; a code missing
   * here prints as itself. `short` is the name without the "Excluding" prefix,
   * for the filter list where every row would otherwise start with it.
   */
  actionKinds: {
    XD: { name: "ไม่ได้รับสิทธิรับเงินปันผล", short: "เงินปันผล" },
    XR: { name: "ไม่ได้รับสิทธิจองซื้อหุ้นเพิ่มทุน", short: "สิทธิจองซื้อหุ้นเพิ่มทุน" },
    XW: { name: "ไม่ได้รับสิทธิจองซื้อใบสำคัญแสดงสิทธิ", short: "ใบสำคัญแสดงสิทธิ" },
    XI: { name: "ไม่ได้รับสิทธิรับดอกเบี้ย", short: "ดอกเบี้ย" },
    XP: { name: "ไม่ได้รับสิทธิรับเงินต้น", short: "เงินต้น" },
    XA: { name: "ไม่ได้รับสิทธิทั้งหมด", short: "สิทธิทั้งหมด" },
    XB: { name: "ไม่ได้รับสิทธิประโยชน์อื่น", short: "สิทธิประโยชน์อื่น" },
    XE: { name: "ไม่ได้รับสิทธิการใช้สิทธิแปลงสภาพ", short: "การใช้สิทธิแปลงสภาพ" },
    XM: { name: "ไม่ได้รับสิทธิเข้าประชุมผู้ถือหุ้น", short: "สิทธิเข้าประชุมผู้ถือหุ้น" },
    XN: { name: "ไม่ได้รับสิทธิรับเงินคืนทุน", short: "เงินคืนทุน" },
    XT: {
      name: "ไม่ได้รับสิทธิจองซื้อหุ้นเพิ่มทุนที่โอนสิทธิได้",
      short: "สิทธิจองซื้อหุ้นเพิ่มทุนที่โอนสิทธิได้",
    },
    // Product events — not SET codes, so no exchange abbreviation to print;
    // the pill shows an icon instead (see `market-taxonomy`).
    "FI-COUPON": { name: "วันจ่ายดอกเบี้ย", short: "วันจ่ายดอกเบี้ย" },
    "FI-MATURITY": { name: "วันครบกำหนดไถ่ถอน", short: "วันครบกำหนดไถ่ถอน" },
    "FI-TRADE-CLOSE": { name: "วันปิดการซื้อขาย", short: "วันปิดการซื้อขาย" },
    "SN-SUB-CLOSE": { name: "วันปิดรับจอง", short: "วันปิดรับจอง" },
    "SN-COUPON": { name: "วันจ่าย Coupon", short: "วันจ่าย Coupon" },
    "SN-KO-OBS": { name: "วันสังเกตการณ์ KO", short: "วันสังเกตการณ์ KO" },
    "SN-MATURITY": { name: "วันครบกำหนดอายุ", short: "วันครบกำหนดอายุ" },
    "MF-IPO-CLOSE": { name: "วันปิดเสนอขาย IPO", short: "วันปิดเสนอขาย IPO" },
    "MF-DIVIDEND": { name: "วันจ่ายปันผลกองทุน", short: "วันจ่ายปันผลกองทุน" },
  } as Record<string, { name: string; short: string }>,

  /**
   * Which product a market item is about. Equity carries the SET X-codes;
   * the others carry the product's own dates. Groups the Calendar's filter and
   * legend. A class missing here prints as its own slug.
   */
  assetClasses: {
    equity: "หุ้น",
    "fixed-income": "ตราสารหนี้",
    "structured-note": "Structured Note",
    "mutual-fund": "กองทุนรวม",
  } as Record<string, string>,

  /** Desk event categories. A category missing here is title-cased from its slug. */
  eventCategories: {
    seminar: "สัมมนา",
    promotion: "โปรโมชัน",
    deadline: "วันครบกำหนด",
    other: "อื่น ๆ",
  } as Record<string, string>,

  /** The circle a day item leads with — its accessible name. */
  badge: {
    note: "โน้ต",
    corporateAction: "สิทธิประโยชน์ผู้ถือหุ้น",
  },

  calendar: {
    loading: "กำลังโหลดปฏิทิน…",
    today: "วันนี้",
    goToToday: (day: string) => `ไปที่วันนี้ · ${day}`,
    previousMonth: "เดือนก่อนหน้า",
    nextMonth: "เดือนถัดไป",
    previousYear: "ปีก่อนหน้า",
    nextYear: "ปีถัดไป",
    changeMonth: "เปลี่ยนเดือน",
    reminderAddFailed: "เพิ่มรายการเตือนไม่สำเร็จ ลองใหม่อีกครั้ง",
    reminderAdded: "เพิ่มรายการเตือนแล้ว",
    legend: {
      holiday: "วันหยุดตลาด",
      note: "โน้ต / การเตือนของคุณ",
      doneNote: "เตือนที่ทำแล้ว",
      /** Row headings — the legend is grouped by what the item is about. */
      title: "คำอธิบายสี",
      showAll: "ดูทั้งหมด",
      hide: "ซ่อน",
      groups: { event: "กิจกรรม", other: "อื่น ๆ" },
      groupLabel: (group: string) => `คำอธิบายสี · ${group}`,
    },
    filter: {
      layers: {
        equity: "หุ้น",
        "fixed-income": "ตราสารหนี้",
        "structured-note": "Structured Note",
        "mutual-fund": "กองทุนรวม",
        event: "กิจกรรม",
        holiday: "วันหยุด",
        note: "การเตือน",
      },
      toggleTypes: (open: boolean, n: number, layer: string) =>
        `${open ? "ซ่อน" : "แสดง"}ประเภท${layer}ทั้ง ${n} รายการ`,
      showEverything: "แสดงทั้งหมด",
      noResultBody: "ทุกรายการในเดือนนี้ถูกซ่อนด้วยตัวกรอง ล้างตัวกรองเพื่อดูทั้งหมด",
      filter: "ตัวกรอง",
      filterCount: (n: number) => `ตัวกรอง · ${n}`,
      filterHidden: (n: number) => `ตัวกรอง · ซ่อน ${n}`,
    },
    day: {
      overdue: "เลยกำหนด",
      today: "วันนี้",
      itemCount: (n: number) => `${n} รายการ`,
      nothingScheduled: "ไม่มีรายการ",
      marketClosed: (market: string) => `${market} ปิดทำการ`,
      holidayLabel: (name: string, market: string) => `${name} · ${market} ปิดทำการ`,
      heldBy: (symbol: string, n: number) => `${symbol} · ลูกค้าถืออยู่ ${n} ราย`,
      more: (n: number) => `+${n} รายการ`,
    },
    alert: {
      fallbackTitle: "การแจ้งเตือน",
      publishedByExchange: "ประกาศโดยตลาดหลักทรัพย์",
      addedByDesk: "เพิ่มโดยเดสก์",
      holders: (n: number) => `ผู้ถือ · ${n}`,
      recordLabel: (kindName: string, symbol: string) => `รายละเอียด ${kindName} ของ ${symbol}`,
      noHolders: "ยังไม่มีลูกค้าในรายการนี้",
      noDetails: "ยังไม่มีรายละเอียดจากตลาดหลักทรัพย์",
      viewProduct: "ดูรายละเอียดสินค้า",
    },
    contact: {
      none: "ไม่มีข้อมูลติดต่อ",
      noneForClient: "ไม่มีข้อมูลติดต่อของลูกค้ารายนี้",
      copied: "คัดลอกแล้ว",
      phone: "โทรศัพท์",
      email: "อีเมล",
      lineId: "LINE ID",
      backToAlert: "กลับไปที่การแจ้งเตือน",
      viewProfile: "ดูโปรไฟล์ทั้งหมด",
    },
  },

  reminders: {
    emptyTitle: "ยังไม่มีรายการเตือน",
    emptyBody: "รายการเตือนจากโน้ต ปฏิทินตลาด และกิจกรรมของเดสก์จะมารวมกันที่นี่",
    noneToday: "ไม่มีรายการวันนี้",
    jumpToToday: "ไปยังวันปัจจุบัน",
    earlierDays: "วันก่อนหน้า",
    laterDays: "วันถัดไป",
    previewEmptyTitle: "ยังไม่มีการเตือน",
    previewEmptyHint: "ตั้งการเตือนได้จากโน้ตในแท็บโน้ต",
  },

  notes: {
    newNote: "โน้ตใหม่",
    /** The list's button and an untitled row — title case in English. */
    newNoteTitle: "โน้ตใหม่",
    newNoteDraft: "โน้ตใหม่ — มีฉบับร่างค้างอยู่",
    saveFailedRetry: "บันทึกไม่สำเร็จ ลองใหม่",
    createFailed: "สร้างบันทึกไม่สำเร็จ ข้อความยังอยู่ ลองพิมพ์ต่อเพื่อบันทึกอีกครั้ง",
    noteDeleted: "ลบบันทึกแล้ว",
    noteDeleteFailed: "ลบบันทึกไม่สำเร็จ ลองใหม่อีกครั้ง",
    /** `?note=` named a note that doesn't exist — deleted, or a bad link. */
    noteNotFound: "ไม่พบโน้ตที่ต้องการ อาจถูกลบไปแล้ว",
    emptyTitle: "ยังไม่มีโน้ต",
    emptyBody: "เขียนโน้ตแรกของคุณ แล้วโน้ตจะแสดงในรายการด้านซ้าย",
    deleteNoteTitle: "ลบโน้ตนี้?",
    deleteNote: "ลบโน้ต",
    autosaved: "บันทึกอัตโนมัติแล้ว",
    saveFailedInline: "บันทึกไม่สำเร็จ ·",
    fields: {
      client: "ลูกค้า",
      selectClients: "เลือกลูกค้า",
      reminder: "การเตือน",
      date: "วันที่",
      clear: "ล้าง",
      attributes: "ลูกค้า, การเตือน",
      done: "เสร็จสิ้น",
      title: "หัวข้อ",
      body: "เริ่มพิมพ์…",
    },
    composer: {
      minimize: "ย่อ",
      discard: "ทิ้ง",
      discardTitle: "ทิ้งโน้ตนี้?",
      discardBody: "สิ่งที่คุณเขียนไว้จะหายไป",
      keepWriting: "เขียนต่อ",
    },
    list: {
      tabs: { all: "ทั้งหมด", clients: "ลูกค้า", reminders: "การเตือน" },
      filterNotes: "กรองโน้ต",
      search: "ค้นหา",
      clearSearch: (shown: number, total: number) => `ล้างการค้นหา · ${shown} จาก ${total}`,
      hasReminder: "มีการเตือน",
      noMatch: "ไม่พบโน้ตที่ตรงกัน",
      noClientNotes: "ไม่มีโน้ตที่ผูกกับลูกค้า",
      noClientNotesHint: "ผูกโน้ตกับลูกค้าได้จากช่องลูกค้าในโน้ต",
      noOpenReminders: "ไม่มีการเตือนที่ค้างอยู่",
      noOpenRemindersHint: "ตั้งการเตือนในโน้ต แล้วโน้ตจะแสดงที่นี่",
      noNotes: "ไม่มีโน้ต",
    },
  },
};

export default planner;
