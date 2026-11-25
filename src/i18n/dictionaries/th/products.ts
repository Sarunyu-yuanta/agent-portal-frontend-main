/** `products` namespace — see th/index.ts for the rules. */
import { createElement, Fragment, type ReactNode } from "react";

/**
 * A sentence with highlighted values in it, e.g. the pagination summary whose
 * numbers are bold. The caller passes how to render a value (`em`); the
 * dictionary owns the word order.
 */
const rich = (...parts: ReactNode[]): ReactNode => createElement(Fragment, null, ...parts);

const products = {
  common: {
    back: "กลับ",
    all: "ทั้งหมด",
    filter: "ตัวกรอง",
    filterTitle: (n: number) => (n > 0 ? `ตัวกรอง (${n})` : "ตัวกรอง"),
    filterCount: (n: number) => `ตัวกรอง (${n})`,
    removeFilter: (label: string) => `ลบ ${label}`,
    clearSelection: "ล้างตัวเลือก",
    clearAllSelection: "ล้างตัวเลือกทั้งหมด",
    confirmSelection: "ยืนยันตัวเลือก",
    showResults: "แสดงผล",
    viewAll: "ดูทั้งหมด",
    viewInfo: "ดูข้อมูล",
    viewDetails: "ดูรายละเอียด",
    details: "รายละเอียด",
    updatedAt: (date: string) => `อัปเดตล่าสุด ${date}`,
    itemCount: (n: number) => `จำนวน ${n} รายการ`,
    items: (n: number) => `${n} รายการ`,
    noFilterMatch: "ไม่พบรายการที่ตรงกับตัวกรอง",
    notFound: "ไม่พบข้อมูล",
    createOrder: "สร้างคำสั่งซื้อ",
    bookForClient: "จองซื้อให้ลูกค้า",
    processingOrder: "กำลังดำเนินการสั่งซื้อ",
    sendProposal: "ส่ง Proposal",
    sendProposalToClient: "ส่ง Proposal ให้ลูกค้า",
    interested: "สนใจลงทุน",
    documents: "เอกสาร",
    relatedDocuments: "เอกสารที่เกี่ยวข้อง",
    topPick: "Top Pick",
    factsheet: "Factsheet",
    termSheet: "Term Sheet",
    scrollTabsLeft: "เลื่อนแท็บไปทางซ้าย",
    scrollTabsRight: "เลื่อนแท็บไปทางขวา",
    /** The Detail / Order tabs on a product's detail page. */
    detailTabs: { detail: "รายละเอียด", orders: "คำสั่งซื้อ" },
  },

  pagination: {
    perPage: "แสดงต่อหน้า",
    showing: (r: { from: number; to: number; total: number }, em: (n: number) => ReactNode) =>
      rich("แสดง ", em(r.from), " – ", em(r.to), " จาก ", em(r.total), " รายการ"),
  },

  fixedIncome: {
    category: { primary: "หุ้นกู้ตลาดแรก", secondary: "หุ้นกู้ตลาดรอง" },
    action: { invest: "สร้างคำสั่งซื้อ", follow: "ติดตาม", followed: "ติดตามแล้ว" },
    booking: {
      open: (period: string) => `เปิดขาย ${period}`,
      expected: (period: string) => `คาดว่าเปิดขาย ${period}`,
    },
    maturesOn: (date: string) => `ครบกำหนด: ${date}`,
    ratingAndRisk: (rating: string, risk: string) => `${rating} / ความเสี่ยง ${risk}`,
    active: "เปิดขาย",
    inactive: "ยังไม่เปิดขาย",
    columns: {
      bond: "หุ้นกู้",
      company: "บริษัท",
      status: "สถานะ",
      type: "ประเภท",
      couponRate: "อัตราดอกเบี้ย",
      couponPeriod: "งวดดอกเบี้ย",
      tenor: "อายุ",
      maturity: "วันครบกำหนด",
      risk: "ความเสี่ยง",
      guarantee: "การค้ำประกัน",
      offerType: "ประเภทเสนอขาย",
      expectedOpen: "คาดว่าเปิดขาย",
    },
    detail: {
      ytm: "อัตราผลตอบแทน (YTM)",
      couponRate: "อัตราดอกเบี้ย (Coupon)",
      couponPeriod: "งวดดอกเบี้ย",
      tenor: "อายุ",
      maturity: "วันครบกำหนด",
      companyRating: "Ratings บริษัท",
      bondRating: "Ratings หุ้นกู้",
      risk: "ความเสี่ยง",
      guarantee: "การค้ำประกัน",
      offerType: "ประเภทเสนอขาย",
      subscriptionPeriod: "เปิดขายวันที่",
      documents: "เอกสารที่เกี่ยวข้อง",
    },
    company: {
      assetDetails: "รายละเอียดสินทรัพย์",
      ticker: (ticker: string) => `Ticker : ${ticker}`,
      offeringType: (type: string) => `ประเภทการเสนอขาย : ${type}`,
      minSubscription: (amount: string) => `สั่งซื้อขั้นต่ำ : ${amount}`,
    },
    filter: {
      company: "บริษัท",
      coupon: "ดอกเบี้ย",
      offerType: "เสนอขาย",
      risk: "ความเสี่ยง",
      couponOptions: {
        lt2: "น้อยกว่า 2%",
        "2to4": "ระหว่าง 2 - 4%",
        "5to7": "ระหว่าง 5 - 7%",
        gt7: "มากกว่า 7%",
      },
      couponChips: {
        lt2: "ดอกเบี้ย น้อยกว่า 2%",
        "2to4": "ดอกเบี้ย 2 - 4%",
        "5to7": "ดอกเบี้ย 5 - 7%",
        gt7: "ดอกเบี้ย มากกว่า 7%",
      },
      riskOptions: { lt3: "น้อยกว่า 3", "4to5": "4 - 5", "6to7": "6 - 7", "8": "8" } as Record<
        string,
        string
      >,
      riskChip: (label: string) => `ความเสี่ยง ${label}`,
    },
  },

  globalBond: {
    /** Column headers and accordion row labels — the English ones are the desk's own terms. */
    columns: {
      bonds: "Bonds",
      isin: "ISIN",
      currency: "Currency",
      couponRate: "Coupon Rate",
      price: "Price",
      estimatedYield: "ผลตอบแทนโดยประมาณ",
      yield: "ผลตอบแทน",
      maturity: "วันครบกำหนด",
      durationYears: "ระยะเวลา (ปี)",
      documents: "เอกสาร",
      order: "คำสั่งซื้อ",
      action: "Action",
      issuer: "ผู้ออกตราสาร",
      creditRating: "Credit Rating",
      topPick: "Top pick",
    },
    filter: {
      allTickers: "Ticker ทั้งหมด",
      allCouponRates: "Coupon Rate ทั้งหมด",
      estimatedYield: "ผลตอบแทนโดยประมาณ",
      timeToMaturity: "ระยะเวลาครบกำหนด",
      short: "ระยะสั้น (≤3 ปี)",
      long: "ระยะยาว (> 3ปี)",
    },
    hero: {
      ticker: (ticker: string) => `Ticker : ${ticker}`,
      tickerLabel: "Ticker:",
      currency: (currency: string) => `Currency : ${currency}`,
      estimatedYield: "ผลตอบแทนโดยประมาณ :",
      timeToMaturity: "ระยะเวลาครบกำหนด :",
    },
    all: {
      title: "Overseas Bonds ทั้งหมด",
      /** Two lines on mobile, one line (joined by a space) elsewhere. */
      subtitleLines: ["รวม Overseas bonds ทั้งหมด", "ที่สามารถทำการซื้อขายได้"] as [string, string],
    },
    tab: {
      title: "ตราสารหนี้ต่างประเทศแนะนำ",
      recommended: "ตราสารหนี้แนะนำ",
    },
    recommendedBonds: "ตราสารหนี้แนะนำ",
  },

  structured: {
    /** Labels for the feed's tag values (`STRUCTURED_TAG`). */
    tags: { almostFull: "ใกล้เต็ม", principalProtected: "รับประกันเงินต้น" },
    all: {
      title: "Structured Products ทั้งหมด",
      subtitle: "รวม Structured Products ทั้งหมด ที่สามารถทำการซื้อขายได้",
    },
    couponFilter: {
      all: "ทั้งหมด",
      low: "Low Coupon [0-15%]",
      medium: "Medium Coupon [15-30%]",
      high: "High Coupon [30-40%]",
      ultra: "Ultra High Coupon [40% ++]",
    },
    detail: {
      coupon: "อัตราดอกเบี้ย (Coupon)",
      offerDate: "วันเสนอขาย",
      couponPeriod: "งวดดอกเบี้ย",
      tenor: "ระยะเวลาการลงทุน (Tenor)",
      productName: "ผลิตภัณฑ์",
      productType: "ประเภท",
      currency: "สกุลเงินลงทุน",
      minInvestment: "ลงทุนขั้นต่ำ",
      moreInfo: "ข้อมูลเพิ่มเติม",
    },
    sentRef: (ref: string) => `ส่งแล้ว (${ref})`,
    notSentYet: "ยังไม่ส่งคำสั่งซื้อ",
    tenorMonths: (months: number | string) => `${months} เดือน`,
  },

  fcn: {
    asOf: (date: string) => `ณ วันที่ ${date}`,
    contact: (em: (s: string) => ReactNode) =>
      rich(
        "สอบถามข้อมูลเพิ่มเติม / สนใจลงทุน ติดต่อผู้แนะนำการลงทุนของท่าน หรือ ",
        em("Online-Service 02-009-8000"),
      ),
    disclaimer:
      "ข้อมูลนี้เป็นเพียงข้อมูลเบื้องต้น ผู้ลงทุนต้องศึกษารายละเอียดก่อนตัดสินใจ บริษัทมิได้รับประกันเงินต้นและผลตอบแทนตามเอกสารนี้",
    downloadPdf: "ดาวน์โหลด PDF",
  },

  packageFiles: {
    title: "ชุดเอกสารครบชุด",
    downloadZip: "ดาวน์โหลด .zip",
    downloadAll: "ดาวน์โหลดทั้งหมด (.zip)",
    summary: (count: number, em: (s: string) => ReactNode, zipName: string) =>
      rich(`${count} ไฟล์ · จะถูกรวมใน `, em(zipName)),
    downloading: (zipName: string, count: number) => `กำลังดาวน์โหลด ${zipName}\n(${count} ไฟล์)`,
    docs: {
      presentation: "เอกสารนำเสนอ FCN",
      termSheet: "Term Sheet",
      prospectus: "หนังสือชี้ชวน",
      riskDisclosure: "เอกสารเปิดเผยความเสี่ยง",
      kfs: "Key Fact Statement (KFS)",
      subscriptionForm: "แบบฟอร์มสมัครลงทุน",
    },
  },

  topIdea: {
    /** Before the highest coupon on a Top idea card — "สูงสุด 30.5%". */
    upTo: "สูงสุด",
  },

  catalog: {
    searchPlaceholder: "ค้นหาสินทรัพย์",
    recentSearches: "ค้นหาล่าสุด",
    clearHistory: "ล้างประวัติ",
    noMatchFor: (query: string) => `ไม่พบสินทรัพย์ที่ตรงกับ “${query}”`,
    noneInCategory: "ไม่พบสินทรัพย์ในหมวดนี้",
    allGlobalStructured: "Global Structured Product ทั้งหมด",
    allThaiFcn: "Thai FCN ทั้งหมด",
    /** Tabs shipped before their content — keyed by catalog tab id. */
    emptyTabs: {
      tfex: {
        title: "TFEX",
        body: "สัญญาฟิวเจอร์สและออปชันในตลาดอนุพันธ์ (TFEX) จะแสดงที่นี่ ขณะนี้ยังอยู่ระหว่างพัฒนา โปรดกลับมาตรวจสอบอีกครั้ง",
      },
    } as Record<string, { title: string; body: string } | undefined>,
  },

  trending: {
    title: "สินค้าแนะนำ",
    intro:
      "หุ้นและกองทุนเรียงตามยอดขายสัปดาห์ล่าสุด · สินค้าที่จองเป็นตะกร้าเรียงตามยอดจองในตะกร้า และแสดงเฉพาะตะกร้าที่ยังเปิดให้จอง",
    salesUpdatedAt: (date: string) => `ยอดขาย 7 วันล่าสุด | Latest update: ${date}`,
    liveFill: "ยอดจองในตะกร้าตามเวลาจริง — แสดงเฉพาะตะกร้าที่ยังเปิดให้จอง",
    sortBy: "เรียงตาม",
    sorts: { "best-seller": "รายการขายดี", highlight: "Yuanta Highlight", "cio-view": "CIO View" },
    emptyBestSeller: "ยังไม่มีสินค้าที่เปิดขายในกลุ่มนี้",
    emptyCurated: (sortLabel: string) => `${sortLabel} ยังไม่ได้เลือกสินค้าในกลุ่มนี้`,
    orderCount: (n: number) => `${n.toLocaleString("en-US")} ออเดอร์`,
    columns: {
      rank: "อันดับ",
      product: "สินค้า",
      fill: "ยอดจองในตะกร้า",
      sales: "ยอดขาย",
      orders: "ออเดอร์",
      change: "เทียบสัปดาห์ก่อน",
    },
  },

  documentActions: {
    download: "ดาวน์โหลดเอกสาร",
    presentation: "Presentation PDF",
    presentationHint: "สำหรับนำเสนอลูกค้า",
    packageHint: "สำหรับปิดการขาย (.zip)",
  },

  /** Portfolio Advisory — Robo Advisory and Definit x Yuanta. */
  advisory: {
    sectionTitle: "บริการวางแผนพอร์ต",
    sectionSubtitle: "ให้ Yuanta ช่วยคุณบริหารสินทรัพย์ด้วยแผนการลงทุน Robo Advisory และจากผู้เชี่ยวชาญ",
    /** Service blurbs, broken into the lines each layout's Figma frame shows. */
    robo: {
      tagline: {
        cardCompact: [
          "คือบริการลงทุนแบบอัตโนมัติด้วย AI",
          "ที่จะช่วยให้บรรลุเป้าหมายการลงทุนได้",
          "อย่างง่ายดาย",
        ] as string[],
        cardDesktop: [
          "คือบริการลงทุนแบบอัตโนมัติด้วย AI ที่จะช่วยให้บรรลุ",
          "เป้าหมายการลงทุนได้อย่างง่ายดาย",
        ] as string[],
        heroMobile: [
          "คือบริการลงทุนแบบอัตโนมัติด้วย AI ที่จะช่วยให้บรรลุเป้าหมายการลงทุน",
          "ได้อย่างง่ายดาย",
        ] as string[],
        full: "คือบริการลงทุนแบบอัตโนมัติด้วย AI ที่จะช่วยให้บรรลุเป้าหมายการลงทุนได้อย่างง่ายดาย",
      },
    },
    definit: {
      tagline: {
        card: [
          "เหมาะกับนักลงทุนในตลาดไทย ",
          "วิเคราะห์ปัจจัยรอบด้านทั้ง พื้นฐาน ",
          "มูลค่า และ เทคนิค ",
        ] as string[],
        heroDesktop: [
          "เหมาะกับนักลงทุนในตลาดไทย วิเคราะห์ปัจจัยรอบด้านทั้ง",
          "พื้นฐานมูลค่า และ เทคนิค",
        ] as string[],
        heroMobile: [
          "เหมาะกับนักลงทุนในตลาดไทย",
          "วิเคราะห์ปัจจัยรอบด้านทั้ง พื้นฐาน",
          "มูลค่า และ เทคนิค",
        ] as string[],
      },
    },
    /** Plan labels. Kept in English in both languages, as designed. */
    planLabels: {
      availableRoom: "Available Room",
      modelType: "Model type",
      rebalanceTiming: "Rebalance Timing",
      tradingStyle: "Trading style:",
      marketTiming: "Market Timing",
      timing: "Timing",
      knowledgeStyle: "Knowledge style:",
    },
    allPlans: (n: number) => `แผนลงทุนทั้งหมด (${n})`,
    /** A plan card's stats — two-line labels for the narrow columns, one line where there is room. */
    stats: {
      minInvestmentLines: ["เงินตั้งต้น", "ขั้นต่ำ (บาท)"] as [string, string],
      minInvestment: "เงินตั้งต้นขั้นต่ำ (บาท)",
      holdingPeriodLines: ["ระยะเวลา", "ถือครอง"] as [string, string],
      holdingPeriod: "ระยะเวลาถือครอง",
      dividendLines: ["เงินปันผล", "ต่อปี"] as [string, string],
    },
    riskTier: {
      low: "ความเสี่ยงต่ำ",
      "low-medium": "ความเสี่ยงต่ำ-กลาง",
      medium: "ความเสี่ยงกลาง",
      high: "ความเสี่ยงสูง",
      "super-high": "ความเสี่ยงสูงมาก",
    },
    filter: {
      risk: "ความเสี่ยง",
      riskOptions: { medium: "กลาง", high: "สูง", "super-high": "สูงมาก" },
    },
    account: { open: "เปิดบัญชีแล้ว", none: "ยังไม่เปิดบัญชี" },
    suitability: { suitable: "เหมาะกับลูกค้า", exceeds: "เกินระดับความเสี่ยง" },
    cta: { changePlan: "เปลี่ยนแผน", openAccount: "เปิดบัญชี" },
    detail: {
      downloadDocuments: "ดาวน์โหลดเอกสารเพิ่มเติม",
      topUpMin: "ยอดขั้นต่ำสำหรับการเพิ่มทุน (ต่อครั้ง)",
      targetInvestors: "แผนที่เหมาะกับนักลงทุนแบบไหน:",
      allocation: "สัดส่วนการลงทุน",
      allocationTotal: "การลงทุนทั้งหมด = 100%",
      fees: "ค่าธรรมเนียม",
    },
    picker: {
      title: "เลือกลูกค้า",
      intro: (service: string) => `เลือกลูกค้าเพื่อดูแผน ${service} ที่เหมาะกับระดับความเสี่ยงของเขา`,
      searchPlaceholder: "ค้นหาชื่อหรือรหัสลูกค้า",
      /** No clients at all — a search or segment that matched none uses `t.states`. */
      noClients: "ยังไม่มีลูกค้า",
      /** Toast when `?clientId=` matches no client; the param is dropped and the picker opens. */
      clientParamNotFound: "ไม่พบลูกค้าตามลิงก์ — เลือกลูกค้าจากรายการ",
      viewPlans: "ดูแผนการลงทุน",
      changeClient: "เปลี่ยนลูกค้า",
      accountFilter: { all: "ทั้งหมด", open: "เปิดบัญชีแล้ว", none: "ยังไม่เปิดบัญชี" },
      segment: (label: string, n: number) => `${label} (${n})`,
    },
  },

  /** Not-found messages on the catalog's detail routes. */
  notFound: {
    bond: "ไม่พบตราสารหนี้นี้",
    investmentSolution: "ไม่พบชุดการลงทุนนี้",
    fund: "ไม่พบกองทุนนี้",
    productGroup: "ไม่พบหมวดสินค้านี้",
    company: "ไม่พบบริษัทนี้",
    issuer: "ไม่พบผู้ออกตราสารนี้",
    topIdea: "ไม่พบ Top idea นี้",
  },

  /**
   * "Nothing here yet" titles for the catalog's lists and sections. A filter
   * or search that matched nothing uses `t.states.noFilterResultTitle` /
   * `noResultTitle` instead.
   */
  states: {
    noOpenProducts: "ยังไม่มีสินค้าที่เปิดขาย",
    noTopIdeas: "ยังไม่มี Top idea",
    noInvestmentSolutions: "ยังไม่มี Investment Solution",
    noBonds: "ยังไม่มีหุ้นกู้",
    noGlobalBonds: "ยังไม่มีตราสารหนี้",
    noPlans: "ยังไม่มีแผนลงทุน",
    noTrendingGroups: "ยังไม่มีสินค้าแนะนำ",
  },

  filterResults: {
    title: "ผลการกรอง",
    titleFor: (fundType: string) => `ผลการกรอง ${fundType}`,
  },
};

export default products;
