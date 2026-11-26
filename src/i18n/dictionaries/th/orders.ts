/**
 * Order Management — labels that used to live as maps beside the order code
 * (`ORDER_WORDS`, `BOOKING_PHASE_LABEL`, `dealStatus` text …), now keyed by the
 * same ids.
 *
 * `words` is per booking mode (a basket is "จอง", a bond is "ส่งคำสั่งซื้อ").
 * Compound sentences are whole messages here rather than a word glued into a
 * sentence at the call site: "ยืนยันจองซื้อ" and "Confirm booking" put the verb
 * in different places.
 */

const words = {
  basket: {
    action: "จองซื้อ",
    actionBusy: "กำลังจอง…",
    cta: "จองซื้อให้ลูกค้า",
    ctaShort: "จองซื้อ",
    record: "การจอง",
    placedAt: "จองเมื่อ",
    cancel: "ยกเลิกการจอง",
    prereq: "ข้อมูลที่ต้องมีก่อนจองซื้อ",
    asOf: "ณ วันที่จอง",
    availabilityOpen: "เปิดจอง",
    remainingLabel: "ยังจองได้",
    modalTitle: (underlying: string, coupon: string) => `ทำรายการจองซื้อ ${underlying} ${coupon}`,
    detailTitle: (underlying: string, coupon: string) => `รายละเอียดการจอง ${underlying} ${coupon}`,
    detailSection: "รายละเอียดการจอง",
    prereqIncomplete: (done: number, total: number) =>
      `ข้อมูลที่ต้องมีก่อนจองซื้อยังไม่ครบ (${done}/${total}) — ทำให้ครบก่อนจึงจะจองซื้อได้`,
    actionFailed: "จองซื้อไม่สำเร็จ ลองใหม่อีกครั้ง",
    readyCount: (ready: number, total: number) => `จองได้เลย ${ready} จาก ${total} ราย`,
    overRemaining: (amount: string) => `เกินยอดที่ยังจองได้ ${amount}`,
    remaining: (amount: string) => `ยังจองได้ ${amount}`,
    summaryTitle: "สรุปรายการจองซื้อ",
    summaryHint: "ตรวจสอบให้ถูกต้องก่อนจองซื้อ",
    confirm: "ยืนยันจองซื้อ",
    confirmCancelOf: (name: string) => `ยืนยันยกเลิกการจองของ ${name}?`,
    confirmCancel: "ยืนยันยกเลิกการจอง",
    cancelling: "กำลังยกเลิก…",
    cancelFailed: "ยกเลิกการจองไม่สำเร็จ ลองใหม่อีกครั้ง",
    cancelled: (name: string) => `ยกเลิกการจองของ ${name} แล้ว`,
    listAria: "รายการการจอง",
    noneYet: "ยังไม่มีการจอง",
    noneYetHint: "กด “จองซื้อ” เพื่อทำรายการให้ลูกค้ารายแรก — รายการจะแสดงที่นี่",
    myTotal: "ยอดการจองของฉัน",
  },
  quota: {
    action: "ส่งคำสั่งซื้อ",
    actionBusy: "กำลังส่ง…",
    cta: "สร้างคำสั่งซื้อ",
    ctaShort: "สร้างคำสั่งซื้อ",
    record: "คำสั่งซื้อ",
    placedAt: "ส่งเมื่อ",
    cancel: "ยกเลิกคำสั่งซื้อ",
    prereq: "ข้อมูลที่ต้องมีก่อนส่งคำสั่งซื้อ",
    asOf: "ณ วันที่ส่งคำสั่งซื้อ",
    availabilityOpen: "เปิดรับคำสั่งซื้อ",
    remainingLabel: "โควตาคงเหลือ",
    modalTitle: (underlying: string, coupon: string) => `ทำรายการส่งคำสั่งซื้อ ${underlying} ${coupon}`,
    detailTitle: (underlying: string, coupon: string) => `รายละเอียดคำสั่งซื้อ ${underlying} ${coupon}`,
    detailSection: "รายละเอียดคำสั่งซื้อ",
    prereqIncomplete: (done: number, total: number) =>
      `ข้อมูลที่ต้องมีก่อนส่งคำสั่งซื้อยังไม่ครบ (${done}/${total}) — ทำให้ครบก่อนจึงจะส่งคำสั่งซื้อได้`,
    actionFailed: "ส่งคำสั่งซื้อไม่สำเร็จ ลองใหม่อีกครั้ง",
    readyCount: (ready: number, total: number) => `ส่งได้เลย ${ready} จาก ${total} ราย`,
    overRemaining: (amount: string) => `เกินโควตาคงเหลือ ${amount}`,
    remaining: (amount: string) => `โควตาคงเหลือ ${amount}`,
    summaryTitle: "สรุปรายการส่งคำสั่งซื้อ",
    summaryHint: "ตรวจสอบให้ถูกต้องก่อนส่งคำสั่งซื้อ",
    confirm: "ยืนยันส่งคำสั่งซื้อ",
    confirmCancelOf: (name: string) => `ยืนยันยกเลิกคำสั่งซื้อของ ${name}?`,
    confirmCancel: "ยืนยันยกเลิกคำสั่งซื้อ",
    cancelling: "กำลังยกเลิก…",
    cancelFailed: "ยกเลิกคำสั่งซื้อไม่สำเร็จ ลองใหม่อีกครั้ง",
    cancelled: (name: string) => `ยกเลิกคำสั่งซื้อของ ${name} แล้ว`,
    listAria: "รายการคำสั่งซื้อ",
    noneYet: "ยังไม่มีคำสั่งซื้อ",
    noneYetHint: "กด “สร้างคำสั่งซื้อ” เพื่อทำรายการให้ลูกค้ารายแรก — รายการจะแสดงที่นี่",
    myTotal: "ยอดคำสั่งซื้อของฉัน",
  },
};

const orders = {
  words,

  /** Booking phases, per desk — a bond has no "จองแล้ว" step. */
  phase: {
    basket: {
      pending: "จองแล้ว",
      processing: "กำลังดำเนินการรับคำสั่งซื้อ",
      completed: "รับคำสั่งซื้อสำเร็จ",
      cancelled: "ยกเลิก",
    } as Partial<Record<"pending" | "processing" | "completed" | "cancelled", string>>,
    quota: {
      processing: "กำลังดำเนินการรับคำสั่งซื้อ",
      completed: "รับคำสั่งซื้อสำเร็จ",
      cancelled: "ยกเลิก",
    } as Partial<Record<"pending" | "processing" | "completed" | "cancelled", string>>,
  },
  phaseEmpty: {
    basket: {
      all: "ยังไม่มีรายการจอง",
      pending: "ไม่มีรายการที่จองไว้",
      processing: "ไม่มีรายการที่กำลังดำเนินการรับคำสั่งซื้อ",
      completed: "ยังไม่มีรายการที่รับคำสั่งซื้อสำเร็จ",
      cancelled: "ไม่มีรายการที่ยกเลิก",
    } as Partial<Record<"all" | "pending" | "processing" | "completed" | "cancelled", string>>,
    quota: {
      all: "ยังไม่มีคำสั่งซื้อ",
      processing: "ไม่มีคำสั่งซื้อที่กำลังดำเนินการ",
      completed: "ยังไม่มีคำสั่งซื้อที่รับสำเร็จ",
      cancelled: "ไม่มีคำสั่งซื้อที่ยกเลิก",
    } as Partial<Record<"all" | "pending" | "processing" | "completed" | "cancelled", string>>,
  },
  stepAll: "ทั้งหมด",
  stepOffered: "ส่ง Proposal แล้ว",
  offeredEmpty: "ไม่มี Proposal ที่ยังรอลูกค้าตัดสินใจ",
  noRowsInPhase: (phase: string) => `ไม่มีรายการที่อยู่ในขั้น “${phase}”`,
  availabilityClosed: "ปิด",

  /** The deal / payment / email columns. */
  deal: {
    cancelled: "ยกเลิกแล้ว",
    completed: "รับคำสั่งซื้อสำเร็จ",
    rejected: "ถูกปฏิเสธ",
    processing: "กำลังดำเนินการรับคำสั่งซื้อ",
    booked: "จองแล้ว",
  },
  payment: {
    none: "—",
    paid: "ชำระแล้ว",
    awaiting: "รอชำระ",
    notRequired: "ไม่ต้องชำระ",
    reserved: "กันเงินแล้ว",
  },
  email: {
    none: "—",
    confirmed: "ยืนยันแล้ว",
    cancelled: "ยกเลิก",
    sent: "ส่งแล้ว",
  },

  /** Trades on the Stock / TFEX / Mutual Fund tabs. */
  side: { buy: "ซื้อ", sell: "ขาย", switch: "สับเปลี่ยน" },
  tradeStatus: {
    matched: "สำเร็จ",
    partial: "จับคู่บางส่วน",
    pending: "รอดำเนินการ",
    cancelled: "ยกเลิก",
  },
  quantityLabel: { stock: "จำนวน (หุ้น)", tfex: "จำนวน (สัญญา)", "mutual-fund": "จำนวน (หน่วย)" },
  quantityUnit: { stock: "หุ้น", tfex: "สัญญา", "mutual-fund": "หน่วย" },
  priceLabel: { stock: "ราคา", tfex: "ราคา", "mutual-fund": "NAV" },
  statusBucket: {
    proposed: "ส่ง Proposal แล้ว",
    processing: "กำลังดำเนินการ",
    done: "สำเร็จ",
    cancelled: "ยกเลิก",
  },
  tabAll: "ทั้งหมด",

  /** Proposals. */
  proposalOutcome: { open: "รอลูกค้าตัดสินใจ", won: "จองแล้ว", lost: "ไม่ได้จอง" },
  proposalChannelHint: {
    app: "แจ้งเตือนและเอกสารในแอปของลูกค้า",
    email: "ส่งเอกสารแนบไปยังอีเมลของลูกค้า",
    line: "ส่งข้อความพร้อมลิงก์เอกสารทาง LINE",
    "voice-ai": "โทรแนะนำสินค้าให้ลูกค้าด้วยเสียง AI",
  },

  /** Order evidence. */
  evidence: {
    call: { label: "โทรศัพท์", hint: "ไฟล์เสียงที่อัดไว้ตอนคุยกับลูกค้า" },
    email: { label: "อีเมล", hint: "ไฟล์อีเมล (.eml / .msg) PDF หรือภาพหน้าจอ" },
    chat: { label: "แชท / LINE", hint: "ภาพหน้าจอบทสนทนา หรือไฟล์แชทที่บันทึกไว้" },
    other: { label: "อื่นๆ", hint: "เอกสารหรือไฟล์อื่นที่ยืนยันคำสั่งของลูกค้า" },
  },
  callDirection: { inbound: "สายเข้า", outbound: "โทรออก" },

  /** Readiness checks. */
  requirementDetail: {
    expired: "แบบแจ้งหมดอายุ ต้องยื่นใหม่",
    noKyc: "ยังไม่มีข้อมูล KYC ในระบบ",
    kycUnreadable: (date: string) => `รอตรวจสอบวันหมดอายุ (${date})`,
    kycExpiredToday: (date: string) => `หมดอายุวันนี้ (${date})`,
    kycExpired: (days: number, date: string) => `หมดอายุแล้ว ${days} วัน (${date})`,
    riskBelow: (required: string) => `ต่ำกว่าระดับ ${required} ที่ผลิตภัณฑ์ต้องการ`,
  },

  /* ── Step 4: on-screen copy, grouped by component ─────────────────────── */

  backToClientPicker: "ย้อนกลับไปเลือกลูกค้า",
  back: "ย้อนกลับ",
  backToEdit: "กลับไปแก้ไข",

  notice: {
    processingTitle: "กำลังดำเนินการสั่งซื้อ",
    processing: (ref: string) => `คำสั่งซื้อ ${ref} อยู่ระหว่างดำเนินการที่ระบบหลังบ้าน — ปิดรับจองเพิ่ม`,
    completedTitle: "รับคำสั่งซื้อสำเร็จ",
    completed: (ref: string) => `คำสั่งซื้อ ${ref} สำเร็จแล้ว — สินค้านี้ปิดรับจอง`,
    rejectedTitle: "คำสั่งซื้อถูกยกเลิก",
    rejected: (ref: string) => `ระบบหลังบ้านปฏิเสธคำสั่งซื้อ ${ref} — สินค้านี้ปิดรับจอง`,
  },

  /** `DealProgress` — and the matching totals on the product's Order tab. */
  progress: {
    dealTotal: "ยอดจองทั้งดีล",
    quotaUsed: "โควตาที่ใช้ไป",
    mine: "ของฉัน",
    otherIcs: "IC อื่น",
    remaining: "คงเหลือ",
    progressAria: (
      label: string,
      mine: string,
      others: string,
      remaining: string,
      target: string,
      currency: string,
    ) => `${label}: ของฉัน ${mine}, IC อื่น ${others}, คงเหลือ ${remaining} จาก ${target} ${currency}`,
  },

  /** `detail-sheet-ui` — rows shared by every detail sheet. */
  sheet: {
    copied: "คัดลอกแล้ว",
    client: "ลูกค้า",
  },

  clientPage: {
    noBookingsInDesk: "หมวดนี้ไม่มีรายการจอง",
    backToOrders: "กลับไป Order Management",
    subtitle: (clientId: string, accountNo: string, desk: string) =>
      `${clientId} · บัญชี ${accountNo} · ${desk}`,
    clientTotal: "ยอดรวมของลูกค้า",
    products: "สินค้า",
    productCount: (n: number) => `${n} รายการ`,
    emptyTitle: "ยังไม่มีรายการจองในหมวดนี้",
    emptyBody: (name: string, desk: string) =>
      `${name} ยังไม่มีการจอง ${desk} — เริ่มจองได้จากหน้าสินค้าใน Product Catalog`,
    col: {
      product: "สินค้า",
      booked: "ยอดจอง",
      deal: "สถานะดีล",
      payment: "ชำระเงิน",
      updated: "อัปเดตล่าสุด",
    },
    openDealAria: (product: string) => `ดูดีล ${product}`,
  },

  /** `ProductTermsModal`. */
  terms: {
    title: "รายละเอียดสินค้า",
    underlying: "Underlying",
    coupon: "Coupon",
    goToProduct: "ไปหน้าสินค้า",
  },

  viewOrder: "ดูคำสั่งซื้อ",
  quotaFull: "เต็มโควตา",

  /** Labels the Thai screens already write in English. */
  field: {
    customer: "Customer",
    fullNameTh: "Full Name (TH)",
    accountNo: "Account No",
    icName: "IC Name",
    icTeam: "IC Team",
    ic: "IC",
    dealStatus: "Deal Status",
    paymentStatus: "Payment Status",
    emailPreConfirmation: "Email Pre-Confirmation",
    notionalAmount: "Notional Amount",
    currency: "Currency",
  },

  /** Sending a Proposal — `SendProposalDialog`, `useSendProposal`, the tally line. */
  proposal: {
    sendToClients: "ส่ง Proposal ให้ลูกค้า",
    tallyOffered: (n: number) => `ส่ง Proposal แล้ว ${n} ราย`,
    tallyBooked: (n: number) => `ส่ง Proposal แล้ว ${n} ราย · จองแล้ว`,
    noClientsFound: "ไม่ได้ส่ง Proposal — ไม่พบลูกค้าที่เลือกในระบบ",
    sendFailed: "ส่ง Proposal ไม่สำเร็จ ลองใหม่อีกครั้ง",
    sentToOne: (underlying: string, name: string) => `ส่ง Proposal ${underlying} ให้ ${name} แล้ว`,
    sentToMany: (underlying: string, n: number) => `ส่ง Proposal ${underlying} ให้ลูกค้า ${n} คนแล้ว`,
    defaultDocuments: "Presentation PDF และชุดเอกสาร",
    stockDocuments: "บทวิเคราะห์หุ้น",
    clientList: "รายชื่อลูกค้า",
    clearPicked: "ล้างที่เลือก",
    pickAll: "เลือกทั้งหมด",
    hideRecipients: "ซ่อนรายชื่อ",
    showRecipients: (n: number) => `ดูรายชื่อทั้งหมด ${n} คน`,
    sendingTo: "ส่งถึง",
    people: (n: number) => `${n} คน`,
    removeRecipient: (name: string) => `เอา ${name} ออก`,
    channels: "ช่องทางการส่ง",
    next: "ถัดไป",
    nextPicked: (n: number) => `ถัดไป · เลือกแล้ว ${n} คน`,
    backOfficeNote: "ระบบหลังบ้านจะส่งเอกสารผ่านช่องทางที่เลือก และบันทึกการส่งไว้เพื่อวัดผล",
    send: "ส่ง Proposal",
    sendToN: (n: number) => `ส่ง Proposal ${n} คน`,
    searchClient: "ค้นหาชื่อหรือรหัสลูกค้า",
    scopeAll: "ทั้งหมด",
    scopeEligible: "ส่งได้",
    scopeIneligible: "ส่งไม่ได้",
    tierRequired: (tier: string) => `ต้องเป็น ${tier} ขึ้นไป`,
    tierRule: (min: string) => `เฉพาะ ${min} ขึ้นไป`,
    tierRequiredWhy: (min: string) =>
      `สินค้านี้เสนอได้เฉพาะลูกค้าระดับ ${min} ขึ้นไป ลูกค้าที่ระดับต่ำกว่านั้นยังแสดงในรายชื่อ แต่เลือกส่ง Proposal ไม่ได้`,
    channelsMin: "เลือกอย่างน้อย 1 ช่องทาง",
    comingSoon: "Coming Soon",
    sheetTitle: (underlying: string, coupon: string) =>
      `ส่ง Proposal · ${underlying}${coupon ? ` ${coupon}` : ""}`,
  },

  /** `ProposalDetailModal`. */
  proposalDetail: {
    title: (underlying: string, coupon: string) => `รายละเอียด Proposal ${underlying} ${coupon}`,
    badge: "Proposal",
    section: "รายละเอียด Proposal",
    sentAt: "ส่งเมื่อ",
    outcome: "ผลของ Proposal",
    channels: "ช่องทางที่ส่ง",
    sentTimes: (n: number) => `ส่งไปแล้ว ${n} ครั้ง`,
    latest: "ครั้งล่าสุด",
    nth: (n: number) => `ครั้งที่ ${n}`,
    footOpen: "ยังไม่มีการจองจาก Proposal นี้ — ลูกค้าจองเองจากแอป หรือติดต่อให้ IC จองให้ก็ได้",
    footWon: "ลูกค้าจองหลังได้รับ Proposal นี้ — ดูรายละเอียดได้ที่รายการจองของลูกค้า",
    footLost: "สินค้าปิดรับไปแล้วโดยไม่มีการจองจาก Proposal นี้",
  },

  /** The list tabs' toolbar, filter dialog and table — All / Stock / TFEX / Mutual Fund. */
  list: {
    filter: "ตัวกรอง",
    searchPlaceholder: "ค้นหาสินค้า หรือลูกค้า",
    clearAll: "ล้างทั้งหมด",
    asset: "สินทรัพย์",
    side: "ประเภท",
    sideListedOnly: "ประเภท (เฉพาะ Stock / TFEX / Mutual Fund)",
    channel: "ช่องทาง",
    viewResults: (n: number) => `ดูผลลัพธ์ (${n})`,
    noSearchMatch: "ไม่พบรายการที่ค้นหา",
    noFilterMatch: "ไม่มีรายการในเงื่อนไขนี้",
    emptyTitle: "ยังไม่มีคำสั่งซื้อ",
    noMatchHint: "ลองเปลี่ยนตัวกรอง หรือค้นหาด้วยชื่อสินค้า รหัสลูกค้า หรือชื่อลูกค้า",
    perPage: "แสดงต่อหน้า",
    col: {
      time: "วันเวลา",
      client: "ลูกค้า",
      product: "สินค้า",
      side: "ประเภท",
      asset: "สินทรัพย์",
      amount: "มูลค่า",
      quantity: "จำนวน",
      channel: "ช่องทาง",
      status: "สถานะ",
    },
    openRowAria: (title: string, name: string) => `ดูรายละเอียด ${title} ของ ${name}`,
    openTradeAria: (symbol: string, name: string) => `ดูรายละเอียดรายการ ${symbol} ของ ${name}`,
    clientAccount: (clientId: string, accountNo: string) => `${clientId} · บัญชี ${accountNo}`,
    sentVia: (channels: string) => `ส่งทาง ${channels}`,
    totalRows: (n: number) => `ทั้งหมด ${n} รายการ`,
  },

  /** `TransactionDetailModal`. */
  transaction: {
    title: "รายละเอียดรายการซื้อขาย",
    section: "รายละเอียดรายการ",
    account: "บัญชี",
    channel: "ช่องทาง",
    time: "เวลา",
    date: "วันที่",
    reference: "เลขที่รายการ",
    quantity: "จำนวน",
    total: "รวม",
  },

  /** `BasketBooksPanel` / `QuotaBooksPanel` empty states. */
  books: {
    searchHint: "ลองค้นหาด้วยชื่อลูกค้า Account No ชื่อสินค้า หรือเลขคำสั่งซื้อ",
    basketEmptyHint: "เริ่มจองให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — การจองจะมารวมกันที่นี่",
    quotaEmptyHint:
      "ส่งคำสั่งซื้อให้ลูกค้าได้จากหน้าสินค้าใน Product Catalog — กดครั้งเดียวส่งถึงหลังบ้านเลย ทำได้จนกว่าจะเต็มโควตา",
    quotaEmptyHintInline: 'กด "สร้างคำสั่งซื้อ" ที่หุ้นกู้ด้านบน — กดครั้งเดียวส่งถึงหลังบ้านเลย ทำได้จนกว่าจะเต็มโควตา',
    goToCatalog: "ไปที่ Product Catalog",
  },

  /** `OrderRecordsTable` — the deal's fill under each product. */
  records: {
    quotaFill: (used: string, target: string, pct: number) =>
      `โควตาใช้ไป ${used} / ${target} · ${pct}%`,
    basketFill: (amount: string, target: string, pct: number) =>
      `ตะกร้า ${amount} / ${target} · ${pct}%`,
  },

  orderRef: "เลขที่คำสั่งซื้อ",
  keepBooking: "ไม่ยกเลิก",
  cancellableUntilTaken: "ยกเลิกได้จนกว่าระบบหลังบ้านจะรับคำสั่งซื้อไปดำเนินการ",

  /** The order-evidence block on the booking sheet and the order summary. */
  evidenceSheet: {
    title: "หลักฐานการรับคำสั่ง",
    channel: "ช่องทาง",
    callFromLog: "สายจาก Call Log",
    callType: "ประเภทสาย",
    callSummary: "สรุปการสนทนา",
    file: "ไฟล์",
    size: "ขนาด",
    note: "หมายเหตุ",
    attachedAt: "แนบเมื่อ",
  },

  /** `OrderSubmissionDetailModal`. */
  submission: {
    title: "รายละเอียดคำสั่งซื้อ",
    completed: "คำสั่งซื้อสำเร็จ",
    rejected: "คำสั่งซื้อถูกปฏิเสธ",
    processing: "กำลังดำเนินการรับคำสั่งซื้อ",
    sentAt: "ส่งเมื่อ",
    sentBy: "ส่งโดย",
    rejectedAt: "ปฏิเสธเมื่อ",
    completedAt: "สำเร็จเมื่อ",
    clients: (n: number) => `ลูกค้าในคำสั่งซื้อนี้ (${n})`,
    viewInOrders: "ดูใน Order Management",
  },

  /** Requirement columns on a product's Order tab — English on the Thai screen too. */
  checkColumn: {
    wealth: "Wealth Status",
    acknowledge: "Acknowledge Status",
    kyc: "KYC Status",
    "risk-profile": "Risk Profile Status",
  } as Record<"wealth" | "acknowledge" | "kyc" | "risk-profile", string>,

  /** `ProductOrderSection` — a product's Order tab. */
  productOrders: {
    notBookable: "สินค้านี้ยังไม่เปิดให้จองผ่านระบบ",
    searchClient: "ค้นหาลูกค้า",
    openBookingAria: (name: string) => `ดูรายละเอียดการจองของ ${name}`,
    account: (accountNo: string) => `บัญชี ${accountNo}`,
    othersLine: (n: number) => `ลูกค้าของ IC อื่น ${n} รายการ · ยอดรวม`,
    myCompleted: "สำเร็จของฉัน",
    dealCompleted: "สำเร็จทั้งดีล",
    allCompleted: "สำเร็จทั้งหมด",
    totalRecords: (n: number) => `ทั้งหมด ${n} รายการ`,
  },

  /** `CreateOrderButton` — the asset / product picker. */
  create: {
    createOrder: "สร้าง Order",
    mode: { order: "ส่งคำสั่งซื้อ", proposal: "ส่ง Proposal" },
    modeAria: "ประเภทรายการ",
    minimum: (amount: string) => `ขั้นต่ำ ${amount}`,
    pickAsset: "เลือกสินทรัพย์",
    openCount: (n: number) => `เปิดรับ ${n} รายการ`,
    availableCount: (n: number) => `มี ${n} รายการ`,
    noneOpen: "ไม่มีสินค้าที่เปิดรับ",
    searchProduct: "ค้นหาสินค้า",
    pickProduct: (n: number) => `เลือกสินค้า (${n})`,
    noProductMatch: "ไม่พบสินค้าที่ค้นหา",
    noneOpenNow: "ไม่มีสินค้าที่เปิดรับอยู่ตอนนี้",
  },

  /** The order log's one-line summaries (`buildLogs` in `order-book.ts`). */
  log: {
    bookingCreated: (client: string, amount: string) => `จองให้ ${client} ${amount}`,
    bookingCancelled: (client: string, amount: string) => `ยกเลิกการจองของ ${client} ${amount}`,
    requirementSent: (client: string) => `ส่งคำขอข้อมูลให้ ${client}`,
    requirementCompleted: (client: string) => `${client} กรอกข้อมูลครบแล้ว`,
    orderCollected: (n: number) => `ระบบหลังบ้านรับคำสั่งซื้อไป ${n} รายการ`,
    orderSent: (n: number) => `ส่งคำสั่งซื้อ ${n} รายการ`,
    orderCompleted: (ref: string) => `คำสั่งซื้อสำเร็จ (${ref})`,
    orderRejected: (ref: string) => `คำสั่งซื้อถูกปฏิเสธ (${ref})`,
  },

  /** The header bell's order rows. */
  notification: {
    iconLabel: "คำสั่งซื้อ",
    requirementCompleted: (n: number) => `กรอกข้อมูลครบแล้ว ${n} รายการ — กลับไปตรวจสอบได้`,
    bookFullTitle: (product: string) => `${product} ครบยอดแล้ว`,
    bookFull: (amount: string) => `จองครบ ${amount} — รอระบบหลังบ้านมารับคำสั่งซื้อ`,
  },

  /** `OrderBookingModal` — client picker, checks and toasts. */
  booking: {
    change: "เปลี่ยน",
    orderSent: (amount: string, client: string, ref: string) =>
      `ส่งคำสั่งซื้อ ${amount} ของ ${client} แล้ว (${ref})`,
    booked: (amount: string, client: string) => `จอง ${amount} ให้ ${client} แล้ว`,
    pickClient: "เลือกลูกค้า",
    searchClient: "ค้นหาชื่อหรือรหัสลูกค้า",
    loadingClients: "กำลังโหลดรายชื่อลูกค้า…",
    clientsLoadFailed: "โหลดรายชื่อลูกค้าไม่สำเร็จ",
    noClientMatch: (query: string) => `ไม่พบลูกค้าที่ตรงกับ “${query}”`,
    noClients: "ยังไม่มีลูกค้าในพอร์ต",
    requestFailed: (item: string) => `ส่ง "${item}" ให้ลูกค้าไม่สำเร็จ ลองใหม่อีกครั้ง`,
    requestSent: (item: string, client: string) =>
      `ส่ง "${item}" ให้ ${client} ดำเนินการแล้ว — จะแจ้งเตือนเมื่อลูกค้าทำเสร็จ`,
    sendToClient: "ส่งให้ลูกค้า",
    blockedTitle: "ลูกค้ารายนี้ยังซื้อผลิตภัณฑ์นี้ไม่ได้",
    blockedRisk: (risk: string) =>
      `ระดับความเสี่ยงที่ลูกค้ารับได้ (${risk}) ต่ำกว่าที่ผลิตภัณฑ์นี้กำหนด — ต้องให้ลูกค้าทำแบบประเมินความเสี่ยงใหม่ก่อน`,
    inReview: "ลูกค้าดำเนินการแล้ว อยู่ระหว่างรอผลตรวจสอบ — จะแจ้งเตือนเมื่อผ่าน",
  },

  /** A client's readiness verdict, and what is still outstanding. */
  readiness: {
    ready: { text: "ครบแล้ว", outstanding: (items: string) => ` ${items}` },
    "in-review": { text: "รอตรวจสอบ", outstanding: (items: string) => `รอผล ${items}` },
    blocked: { text: "ยังไม่ครบ", outstanding: (items: string) => `ยังขาด ${items}` },
    withCount: (verdict: string, n: number) => `${verdict} (${n} รายการ)`,
  },

  /** The amount step. */
  amount: {
    quotaFull: (product: string) => `${product} เต็มโควตาแล้ว — ไม่สามารถจองเพิ่มได้`,
    orderSent: (product: string) => `ส่งคำสั่งซื้อของ ${product} แล้ว — สินค้านี้ปิดรับจอง`,
    orderProcessing: (product: string) =>
      `คำสั่งซื้อของ ${product} กำลังดำเนินการที่ระบบหลังบ้าน — ไม่สามารถจองเพิ่มได้`,
    digitsOnly: "กรอกได้เฉพาะตัวเลข 0–9 เท่านั้น",
    belowMinimum: (amount: string) => `ต่ำกว่าขั้นต่ำ ${amount}`,
    overCash: (amount: string) => `เกินเงินสดคงเหลือของลูกค้า ${amount}`,
    cashBalance: "เงินสดคงเหลือของลูกค้า",
    overCashAlert: "จำนวนมากกว่าเงินสดคงเหลือของลูกค้า — ลดจำนวนลง หรือให้ลูกค้าเติมเงินก่อนจึงจะทำรายการได้",
  },

  /** The evidence step of the booking form. */
  evidenceForm: {
    title: "หลักฐานการรับคำสั่งจากลูกค้า",
    required: "จำเป็นต้องแนบ",
    fromCallLog: "เลือกจาก Call Log",
    attachAudio: "แนบไฟล์เสียง",
    pickCall: "เลือกสายที่ลูกค้าให้คำสั่งซื้อนี้",
    noCalls: "ยังไม่มีประวัติการโทรของลูกค้ารายนี้ — แนบไฟล์เสียงแทน",
    callLogAria: "Call Log",
    changeFile: "เปลี่ยนไฟล์",
    pickFile: "เลือกไฟล์ หรือลากไฟล์มาวาง",
    note: "หมายเหตุ",
    noteOptional: "หมายเหตุ (ถ้ามี)",
    notePlaceholderRequired: "ระบุว่าไฟล์นี้คืออะไร และลูกค้าสั่งมาทางไหน",
    notePlaceholder: "เช่น ลูกค้ายืนยันยอดและเงื่อนไขแล้ว",
    noteRequired: "กรุณาระบุหมายเหตุสำหรับหลักฐานประเภทอื่นๆ",
  },

  /** The summary step and the footer. */
  summary: {
    section: "รายละเอียดคำสั่ง",
    product: "สินค้า",
    type: "ประเภท",
    review: "ตรวจสอบรายการ",
  },
};

export default orders;
