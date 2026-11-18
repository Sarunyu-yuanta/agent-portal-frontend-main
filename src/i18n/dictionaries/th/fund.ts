/** `fund` namespace — see th/index.ts for the rules. */
const fund = {
  /** Strings shared by the mutual-fund list pages. */
  list: {
    seeMore: "ดูเพิ่มเติม",
    viewAll: "ดูทั้งหมด",
    searchPlaceholder: "ค้นหากองทุน",
    filter: "ตัวกรอง",
    scrollLeft: "เลื่อนซ้าย",
    scrollRight: "เลื่อนขวา",
    previousPeriod: "ช่วงเวลาก่อนหน้า",
    nextPeriod: "ช่วงเวลาถัดไป",
    count: (n: number) => `${n} รายการ`,
    noMatchForQuery: (query: string) => `ไม่พบกองทุนที่ตรงกับ "${query}"`,
    noFundsInCategory: "ไม่พบกองทุนในหมวดนี้",
    noFundsInTheme: "ไม่พบกองทุนในธีมนี้",
    asOf: (date: string) => `ข้อมูล ณ วันที่ ${date}`,
    recommendedFunds: "กองทุนแนะนำ",
    allFunds: "กองทุนทั้งหมด",
  },

  /** Badges on fund cards. Product terms — English in both languages. */
  tags: {
    view: "View",
    highlight: "Highlight",
    pick: "Pick",
    creditCard: "Credit Card",
    risk: (level: number) => `risk: ${level}`,
  },

  /** Category tabs / filter chips, keyed by `MobileFundGroupId`. */
  groups: {
    all: "ทั้งหมด",
    "fixed-income": "ตราสารหนี้ไทย",
    "global-fixed-income": "ตราสารหนี้ต่างประเทศ",
    "thai-equity": "หุ้นไทย",
    "foreign-equity": "หุ้นต่างประเทศ",
    "commodities-group": "Commodities",
    "tax-saving": "ลดหย่อนภาษี",
    others: "อื่นๆ",
  },

  legend: {
    title: "คำอธิบายสถานะการแนะนำกองทุน",
    open: "ดูคำอธิบาย",
    viewDescription: "แสดงกองทุนแนะนำตามมุมมองของ CIO Office ที่วิเคราะห์จากแนวโน้มเศรษฐกิจและทิศทางสินทรัพย์",
    highlightDescription: "แสดงกองทุนแนะนำตามทีมผลิตภัณฑ์กองทุนของ Yuanta",
  },

  topPerformers: {
    title: "กองทุนผลตอบแทนเด่น",
    heroSubtitle: "คัดสรรกองทุนเด่น เพื่อคุณโดยเฉพาะ",
    oneYearPerformance: "ผลดำเนินงานย้อนหลัง 1 ปี",
  },

  themes: {
    sectionTitle: "5 ธีมกองทุนเด่น",
    sectionSubtitle: "ธีมกองทุนผลตอบแทนโดดเด่น",
    detailTitle: "ธีมกองทุนเด่น",
  },

  insights: {
    titleShort: "เจาะลึกโอกาสลงทุน",
    titleLong: "เจาะลึกโอกาสลงทุนเด่น",
    subtitle: "บทวิเคราะห์จาก Yuanta CIO",
  },

  /** The two quick-action tiles; each title is drawn on two lines. */
  quickActions: {
    searchLine1: "ค้นหากองทุน",
    searchLine2: "ที่คุณสนใจ",
    taxLine1: "แนะนำกองทุน",
    taxLine2: "ลดหย่อนภาษี",
  },

  filter: {
    title: "ค้นหากองทุนที่คุณสนใจ",
    clear: "ล้าง",
    clearAll: "ล้างทั้งหมด",
    apply: "ตกลง",
    sections: {
      category: "หมวดหมู่",
      taxSaving: "กองทุนลดหย่อนภาษี",
      dividendPolicy: "นโยบายการจ่ายปันผล",
      investmentPolicy: "นโยบายการลงทุน",
      managementCompany: "บริษัทจัดการกองทุน",
      riskLevel: "ระดับความเสี่ยง",
    },
    /** Keyed by `DividendPolicyId`. */
    dividendPolicy: { pay: "จ่าย", "no-pay": "ไม่จ่าย" },
    /** Keyed by `InvestmentPolicyId`. */
    investmentPolicy: { active: "เชิงรุก", passive: "เชิงรับ" },
    /** 9 stands for "8+" — funds riskier than level 8. */
    riskLevel: (level: number) => (level >= 9 ? "Level 8+" : `Level ${level}`),
    noMatches: "ไม่พบผลลัพธ์ที่ตรงกับตัวกรองที่คุณเลือก",
    showAllFunds: "แสดงกองทุนทั้งหมด",
  },

  dividend: {
    historyTitle: "ประวัติการจ่ายปันผล",
    bookCloseDate: "วันที่ปิดสมุด",
    paymentDate: "วันที่จ่ายปันผล",
    perUnit: "บาท/หน่วย",
    none: "กองทุนนี้ไม่มีการจ่ายปันผล",
  },

  detail: {
    historicalReturns: "ผลตอบแทนย้อนหลัง",
    investmentPolicy: "นโยบายการลงทุน",
    readMore: "อ่านเพิ่มเติม",
    fees: "ค่าธรรมเนียม",
    feeBuy: "ซื้อ",
    feeSell: "ขาย",
    feeManagement: "จัดการ",
    frontEndFee: "(Front-end Fee)",
    lastDividend: "การจ่ายปันผลครั้งล่าสุด",
    lastDividendPaymentDate: "วันที่จ่าย",
    fundDetails: "รายละเอียดกองทุน",
    info: {
      prospectus: "หนังสือชี้ชวน",
      viewProspectus: "ดูหนังสือชี้ชวน",
      name: "ชื่อกองทุน",
      managementCompany: "บลจ.",
      fundType: "ประเภทกอง",
      taxBenefit: "สิทธิประโยชน์ทางภาษี",
      foreignInvestment: "ลงทุนในต่างประเทศ",
      fxRisk: "ความเสี่ยงอัตราแลก เปลี่ยน",
      riskScore: "ค่าความเสี่ยง",
      dividendPolicy: "นโยบายการจ่ายปันผล",
      currencyPolicy: "นโยบายค่าเงิน",
      managementFee: "ค่าธรรมเนียมการจัดการ",
      minimumInvestment: "ขั้นต่ำการลงทุน",
      registrationDate: "วันที่จดทะเบียนกองทุน",
      netAssetValue: "มูลค่าทรัพย์สินสุทธิ",
    },
    returnsTable: {
      period: "ช่วงเวลา",
      return: "ผลตอบแทน",
      volatility: "ความผันผวนกองทุน",
      maxDrawdown: "Maximum Drawdown",
    },
    topHoldings: "หลักทรัพย์ 5 อันดับแรก",
    assetAllocation: "สัดส่วนการลงทุน",
    minimumTrade: "มูลค่าขั้นต่ำในการซื้อขาย",
    minInitialPurchase: "มูลค่าขั้นต่ำของการซื้อครั้งแรก",
    minSubsequentPurchase: "มูลค่าขั้นต่ำของการซื้อครั้งถัดไป",
    minRedemption: "มูลค่าขายขั้นต่ำ",
    tradingHours: "เวลาทำรายการ",
    purchaseCutoff: "เวลาปิดรับคำสั่งซื้อ",
    redemptionCutoff: "เวลาปิดรับคำสั่งขาย",
    settlement: "วันที่จะได้รับเงิน",
    feeTable: {
      item: "รายการค่าธรรมเนียม",
      actual: "เก็บจริง",
      maximum: "ไม่เกิน",
    },
  },

  taxPlanning: {
    title: "วางแผนภาษี",
    fundType: "ประเภทกองทุน",
    maxInvestment: "ลงทุนได้สูงสุด",
    incomeTitle: "รายได้ของคุณ",
    incomeHint: "รวมรายได้ทั้งหมดที่ได้รับในปี",
    incomePlaceholder: "รายได้ต่อปี",
    digitsOnly: "กรุณากรอกเฉพาะตัวเลข",
    calculate: "คำนวณ",
    disclaimer:
      "เครื่องมือวางแผนภาษีนี้เป็นเพียงการประมาณการสิทธิลดหย่อนภาษีเบื้องต้นจากรายได้ที่ระบุและเป็นไปตามหลักเกณฑ์ทั่วไป โดยยังไม่รวมสิทธิลดหย่อนอื่น และมิใช่คำแนะนำภาษีเฉพาะบุคคลหรือการรับรองสิทธิ โปรดตรวจสอบเกณฑ์สรรพากรและเงื่อนไขล่าสุดก่อนตัดสินใจลงทุน",
    unitThb: "THB",
  },
  /** A route id that names no theme / category / tax-saving type. */
  notFound: {
    theme: "ไม่พบธีมกองทุนนี้",
    category: "ไม่พบหมวดกองทุนนี้",
    taxType: "ไม่พบประเภทกองทุนลดหย่อนภาษีนี้",
  },

  /** Sections and lists with nothing to show yet. */
  empty: {
    themes: "ยังไม่มีธีมกองทุนเด่น",
    themeFunds: "ยังไม่มีกองทุนในธีมนี้",
    categoryFunds: "ยังไม่มีกองทุนในหมวดนี้",
    insights: "ยังไม่มีบทวิเคราะห์",
    recommendedFunds: "ยังไม่มีกองทุนแนะนำ",
  },
};

export default fund;
