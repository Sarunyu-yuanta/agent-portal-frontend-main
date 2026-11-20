/** `client` namespace — see th/index.ts for the rules. Client 360 (hub + profile) and the asset panels it shares. */
const client = {
  /** Full Profile sub-tabs, keyed by the `?tab=` id. */
  tabs: {
    overview: "ภาพรวม",
    kyc: "KYC",
    assets: "สินทรัพย์",
    orders: "คำสั่งซื้อขาย",
    "call-log": "บันทึกการโทร",
    reminders: "รายการเตือน",
    notes: "บันทึก",
  },

  profile: {
    totalAum: "AUM รวม",
    ytdPl: "กำไร/ขาดทุน YTD",
  },

  overview: {
    currentAllocation: "สัดส่วนการลงทุนปัจจุบัน",
    topHoldings: "สินทรัพย์ที่ถือครองสูงสุด",
    recentActivity: "กิจกรรมล่าสุด",
    viewAll: "ดูทั้งหมด",
    remindersLoadError: "โหลดรายการเตือนไม่สำเร็จ",
    noHoldings: "ยังไม่มีสินทรัพย์ที่ถือครอง",
    noActivity: "ยังไม่มีกิจกรรม",
  },

  holdings: {
    asset: "สินทรัพย์",
    marketValue: "มูลค่าตลาด",
    unrealizedPl: "กำไร/ขาดทุนที่ยังไม่รับรู้",
    portfolioPct: "% ของพอร์ต",
  },

  callLog: {
    emptyTitle: "ยังไม่มีประวัติการโทร",
    emptyBody: "บันทึกการโทรของลูกค้ารายนี้จะแสดงที่นี่",
    outbound: "โทรออก",
    inbound: "สายเข้า",
    date: "วันที่",
    direction: "ประเภทสาย",
    duration: "ระยะเวลา",
    summary: "สรุป",
  },

  kyc: {
    totalAum: "AUM รวม",
    clientId: "Client ID",
    accountOpened: "วันที่เปิดบัญชี",
    riskProfile: "ระดับความเสี่ยง",
    wealthStatus: "สถานะความมั่งคั่ง",
    expiryDate: "วันหมดอายุ KYC",
    noRecord: "ไม่มีข้อมูล KYC ของลูกค้ารายนี้",
    /** The countdown beside the date, as an aside about it. */
    countdownAside: (countdown: string) => `(${countdown})`,
    personal: "ข้อมูลส่วนตัว",
    birthday: "วันเกิด",
    age: "อายุ",
    ageYears: (n: number) => `${n} ปี`,
    nationality: "สัญชาติ",
    contact: "ข้อมูลติดต่อ",
    phone: "เบอร์โทรศัพท์",
    email: "อีเมล",
    line: "LINE",
    address: "ที่อยู่",
    importantForms: "แบบฟอร์มสำคัญ",
    formUpdated: (date: string) => `อัปเดตล่าสุด: ${date}`,
    /** Keyed by `IMPORTANT_FORMS[].id`. */
    forms: {
      wealthDeclaration: {
        title: "Wealth Declaration",
        description: "แบบแจ้งการเป็นผู้ลงทุนรายใหญ่ / รายใหญ่พิเศษ / ที่มีลักษณะเฉพาะ",
      },
      fatcaCrs: {
        title: "FATCA and CRS",
        description: "แบบแจ้งความเป็นบุคคลอเมริกัน และผู้มีถิ่นที่อยู่ทางภาษีในประเทศอื่น",
      },
      w8ben: {
        title: "W-8Ben",
        description: "แบบฟอร์มภาษีของกรมสรรพากรแห่งสหรัฐอเมริกา",
      },
      knowledgeAssessment: {
        title: "แบบประเมินความรู้ความสามารถในการลงทุน (Knowledge Assessment)",
        description: "สำหรับการลงทุนในผลิตภัณฑ์ในตลาดทุนที่มีความเสี่ยงสูงหรือมีความซับซ้อน",
      },
      bondKnowledgeTest: {
        title: "แบบทดสอบความรู้ผู้ลงทุน เกี่ยวกับตราสารหนี้",
        description: "สำหรับการจองซื้อ/ซื้อขายตราสารหนี้ (Perpetual Bond)",
      },
      suitabilityTest: {
        title: "แบบประเมินความเหมาะสมในการลงทุน (Suitability Test)",
        description: "ประเมินระดับความสามารถในการรับความเสี่ยงจากการลงทุน เพื่อหาประเภทหลักทรัพย์ที่เหมาะสม",
      },
    },
  },

  notes: {
    saveFailed: "บันทึกไม่สำเร็จ ข้อความยังอยู่ ลองใหม่อีกครั้ง",
    added: "เพิ่มบันทึกแล้ว",
    saved: "บันทึกแล้ว",
    deleteFailed: "ลบบันทึกไม่สำเร็จ ลองใหม่อีกครั้ง",
    deleted: "ลบบันทึกแล้ว",
    addNote: "เพิ่มบันทึก",
    deleteConfirm: "ลบบันทึกนี้?",
    untitled: "บันทึกไม่มีชื่อ",
    loadError: "โหลดบันทึกไม่สำเร็จ",
    noneForClient: "ยังไม่มีบันทึกของลูกค้ารายนี้",
    /** A `?note=` that matches none of this client's notes. */
    notFound: "ไม่พบบันทึกนี้",
  },

  reminders: {
    emptyTitle: "ไม่มีรายการเตือน",
    emptyBody: "ตั้งรายการเตือนได้จากบันทึกในแท็บบันทึก",
    status: "สถานะ",
    date: "วันที่",
    source: "ที่มา",
    reminder: "รายการเตือน",
    detail: "รายละเอียด",
    sourceNote: "บันทึก",
    sourceSystem: "ระบบ",
    noAdditionalText: "ไม่มีข้อความเพิ่มเติม",
    nothingDueToday: "วันนี้ไม่มีรายการ",
    daySection: (day: string, count: number) => `${day} · ${count}`,
  },

  /** Client 360's list page. */
  hub: {
    customerTab: "ลูกค้า",
    customerTabCount: (n: number) => `ลูกค้า (${n})`,
    productTab: "ผลิตภัณฑ์",
    productTabCount: (n: number) => `ผลิตภัณฑ์ (${n})`,
    searchClients: "ค้นหาลูกค้า…",
    searchProducts: "ค้นหาผลิตภัณฑ์…",
    perPage: "แสดงต่อหน้า",
    /** Each value is passed in already wrapped (it is bolded on screen). */
    showingClients: <T>(from: T, to: T, total: T): (string | T)[] => [
      "แสดง ",
      from,
      " – ",
      to,
      " จาก ",
      total,
      " ราย",
    ],
    rowNo: "ลำดับ",
    viewClientProfile: "ดูโปรไฟล์ลูกค้า",
    noClientResultBody: "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูรายชื่อลูกค้าทั้งหมด",
    noProductResultBody: "ลองค้นหาด้วยคำอื่น หรือล้างตัวกรองเพื่อดูสินค้าทั้งหมด",
    noClientsYet: "ยังไม่มีลูกค้า",
    noProductsYet: "ยังไม่มีผลิตภัณฑ์ที่ลูกค้าถือครอง",
    /** A `?client=` that matches no one — shown as a toast, the param is dropped. */
    clientParamNotFound: "ไม่พบลูกค้าตามลิงก์ที่เปิด",
    columnsButton: "คอลัมน์",
    showHideColumns: "แสดง / ซ่อนคอลัมน์",
    resetColumns: "รีเซ็ต",
    productTable: {
      product: "ผลิตภัณฑ์",
      clientCount: "จำนวนลูกค้า",
      totalAum: "AUM รวม (บาท)",
      avgAllocation: "สัดส่วนเฉลี่ย",
    },
  },

  /** The five KPI cards over the client list. */
  summary: {
    totalClients: "ลูกค้าทั้งหมด",
    clientsUnit: "ราย",
    bySegment: "สัดส่วนตาม Segment",
    wealthUnderAdvice: "Wealth Under Advice",
    totalAumSub: "AUM รวมทั้งหมด",
    assetValue: "มูลค่าทรัพย์สิน",
    excludingCash: "ไม่รวม cash",
    byAssetValue: "ลูกค้าเรียงตามมูลค่าทรัพย์สิน",
    kycDue: "KYC ครบกำหนด",
    within30Days: "ภายใน 30 วัน",
    kycDueTitle: "ลูกค้าที่ KYC ใกล้หมดอายุ",
    cashUnderAdvice: "Cash Under Advice",
    idleCash: "เงินรอลงทุน",
    byIdleCash: "ลูกค้าเรียงตามเงินรอลงทุน",
    expand: "ขยาย",
    expandList: (title: string) => `ขยาย${title}`,
    noIdleCash: "ไม่มีลูกค้าที่มีเงินรอลงทุน",
    cashSub: (tier: string, pct: number) => `${tier} · ${pct}% ของ AUM`,
    kycDays: (n: number) => `${n}d`,
    kycFilterAria: "กรองรายการ KYC",
    kycFilter: { all: "ทั้งหมด", upcoming: "ใกล้หมดอายุ", expired: "หมดอายุแล้ว" },
    kycFilterCount: (label: string, n: number) => `${label} (${n})`,
    noKycDue: "ไม่มีลูกค้าที่ KYC ใกล้ครบกำหนด",
    noAssetClients: "ยังไม่มีลูกค้า",
  },

  /** The quick-view panel a client row opens. */
  panel: {
    callLog: "บันทึกการโทร",
    reminder: "รายการเตือน",
    notes: "บันทึก",
    comingSoon: "เร็ว ๆ นี้",
    viewFullProfile: "ดูโปรไฟล์ทั้งหมด",
    liabilities: "หนี้สิน",
    noCallHistory: "ยังไม่มีประวัติการโทร",
    callLogFor: (name: string) => `บันทึกการโทร — ${name}`,
    remindersFor: (name: string) => `รายการเตือน — ${name}`,
    notesFor: (name: string) => `บันทึก — ${name}`,
  },

  nineBox: {
    /** Cell names, keyed by `NineBoxCell` id. */
    cells: {
      protect: "ปกป้อง",
      nurture: "ดูแลใกล้ชิด",
      prioritize: "ให้ความสำคัญสูงสุด",
      reEngage: "ดึงกลับมามีส่วนร่วม",
      develop: "พัฒนา",
      grow: "เติบโต",
      monitor: "ติดตาม",
      activate: "กระตุ้น",
      risingStars: "ดาวรุ่ง",
    },
    tiers: { high: "สูง", medium: "กลาง", low: "ต่ำ" },
    cellSubtitle: (aumTier: string, aiTier: string) => `AUM ${aumTier} · AI Score ${aiTier}`,
    noClients: "ไม่มีลูกค้าในกลุ่มนี้",
    clientCount: (n: number) => `${n} ราย`,
  },

  productDrawer: {
    clientCount: (n: number) => `${n} ราย`,
    totalAum: "AUM รวม",
    avgAllocation: "สัดส่วนเฉลี่ย",
    holdingsTab: (n: number) => `รายการถือครอง (${n})`,
    clientsTab: (n: number) => `ลูกค้า (${n})`,
    /** The unit under a sub-product's client count — English pluralises on it. */
    clientsBadge: (_n: number) => "ราย",
    noHolders: "ยังไม่มีลูกค้าที่ถือผลิตภัณฑ์นี้",
  },

  /** Asset panels: the net-value card, the asset list and holding details. */
  assets: {
    netValue: "มูลค่าสุทธิ (THB)",
    netValueInfoAria: "ดูรายละเอียดมูลค่าสุทธิ",
    lineAvailable: "วงเงินคงเหลือ (THB)",
    cash: "เงินสด (THB)",
    liabilities: "หนี้สิน (THB)",
    lastUpdated: "อัปเดตล่าสุด",
    allocationBreakdown: "สัดส่วนสินทรัพย์",
    assetList: "รายการสินทรัพย์",
    filterAria: "กรองรายการสินทรัพย์",
    byProduct: "ตามผลิตภัณฑ์",
    byAccount: "ตามบัญชี",
    expandAll: "ขยายทั้งหมด",
    collapseAll: "ย่อทั้งหมด",
    avgYield: (pct: string) => `อัตราผลตอบแทนเฉลี่ย: ${pct}%`,
    avgCost: (value: string) => `ราคาทุนเฉลี่ย ${value}`,
    closeDetail: "ปิดรายละเอียด",
    totalValue: "มูลค่ารวม",
    pl: "กำไร/ขาดทุน",
    positionSummary: "สรุปสถานะการถือครอง",
    collateral: "หลักประกัน",
    noHoldingsTitle: "ยังไม่มีรายการถือครอง",
    noHoldingsBody: "บัญชีหรือสินทรัพย์นี้ยังไม่มีหลักทรัพย์ในระบบ",
    noAssets: "ยังไม่มีรายการสินทรัพย์",
    noAllocation: "ยังไม่มีข้อมูลสัดส่วนการลงทุน",
    /** Position fields, keyed by `PositionField.id`. */
    position: {
      avgCost: "ราคาทุนเฉลี่ย (THB)",
      currentPrice: "ราคาปัจจุบัน (THB)",
      costAmount: "มูลค่าต้นทุน (THB)",
      marketValue: "มูลค่าตลาด (THB)",
      quantity: "จำนวนหน่วย",
    },
  },

  liabilities: {
    modalTitle: "รายละเอียดหนี้สิน",
    /** Keyed by `LiabilityCategory.id`. */
    categories: {
      debt: "ภาระหนี้",
      payable: "ยอดค้างจ่าย",
      receivable: "ยอดค้างรับ",
      short: "มูลค่าขายชอร์ต",
    } as Record<string, string>,
    lastUpdated: (when: string) => `อัปเดตล่าสุด ${when}`,
    empty: "ยังไม่มีรายการหนี้สิน",
  },

  netValueInfo: {
    title: "รายละเอียด",
    heading: "มูลค่าความมั่งคั่งสุทธิ (THB)",
    /** `bold` wraps the two emphasised terms. */
    description: <T>(bold: (text: string) => T): (string | T)[] => [
      "มูลค่าความมั่งคั่งสุทธิคือ มูลค่าคงเหลือของ ",
      bold("สินทรัพย์ทั้งหมด"),
      " (THB) หักลบ ",
      bold("ภาระหนี้ทั้งหมด"),
      " (THB)",
    ],
    notesLabel: "หมายเหตุ:",
    notes: [
      "ไม่รวมกำไร-ขาดทุนของ TFEX, หุ้นกู้ที่มีอนุพันธ์แฝง และตราสารหนี้",
      "กองทุนรวม หุ้นกู้ที่มีอนุพันธ์แฝง และตราสารหนี้ จะแสดงเป็นมูลค่าล่าสุดของวันทำการก่อนหน้า (T-1)",
      "ข้อมูลทั้งหมดเป็นผลรวมจากหลายหน่วยงาน ซึ่งอาจมีการเปลี่ยนแปลงไปแล้ว ทำให้ข้อมูลเชิงจำนวนนี้ไม่ตรงกับในหน้าหน่วยงานอื่น",
    ],
    fxNote: "สินทรัพย์ต่างประเทศคำนวนจากอัตราแลกเปลี่ยน ณ วันที่ 22 มิ.ย. 67",
  },
};

export default client;
