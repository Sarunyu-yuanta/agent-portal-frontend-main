/** `stock` namespace — see th/index.ts for the rules. */
const stock = {
  /** Footer stamp under every Stock board — the timestamp is the feed's. */
  latestUpdate: (stamp: string) => `อัปเดตล่าสุด: ${stamp}`,
  chart30Day: "กราฟข้อมูลย้อนหลัง 30 วัน",

  /** Keyed by `MarketStatusValue`. */
  marketStatus: {
    "Pre-Open": "ก่อนเปิดตลาด",
    Open: "เปิดตลาด",
    "Pre-Close": "ก่อนปิดตลาด",
    Closed: "ปิดตลาด",
    Suspend: "ห้ามซื้อขายชั่วคราว",
    Halt: "หยุดการซื้อขาย",
    Expired: "หมดอายุ",
    Intermission: "พักการซื้อขาย",
    Break: "พักตลาด",
  } as Record<string, string>,

  /** The market chips above the Stock tab, keyed by `MarketId`. */
  markets: { th: "ตลาดหุ้นไทย", us: "ตลาดหุ้นสหรัฐฯ" } as Record<string, string>,

  tab: {
    recommendationTitle: "หุ้นแนะนำ",
    recommendationDesc: "ติดตามทุกความเคลื่อนไหวในตลาดทุน",
    topGain: "Top Gain",
    topLoss: "Top Loss",
    topPick: "Top Pick",
    crossSellTitle: "เปิดโอกาสลงทุนในสินทรัพย์อื่นผ่านตลาดหุ้นไทย",
    crossSellDesc: "เข้าถึงการลงทุนรูปแบบอื่นได้สะดวกยิ่งขึ้น",
    drTitle: "DR (Depositary Receipt)",
    etfTitle: "ETF (Exchange Traded Fund)",
    etfDesc: "กองทุนดัชนีที่ซื้อขายได้เหมือนหุ้น",
    viewAll: "ดูทั้งหมด",
  },

  sectorSection: {
    title: "กลุ่มอุตสาหกรรม SET",
    desc: "เลือกหุ้นพื้นฐานดีจากกลุ่มอุตสาหกรรมที่คุณสนใจ",
  },

  /** Sector names by market, then sector id. Unknown ids fall back to the feed's own name. */
  sectorNames: {
    th: {
      resources: "ทรัพยากร",
      services: "บริการ",
      industrials: "สินค้าอุตสาหกรรม",
      "consumer-products": "สินค้าอุปโภคบริโภค",
      "agro-food": "เกษตรและอุตสาหกรรมอาหาร",
      financials: "ธุรกิจการเงิน",
      technology: "เทคโนโลยี",
      "property-construction": "อสังหาริมทรัพย์และก่อสร้าง",
    } as Record<string, string>,
    us: {
      energy: "พลังงาน",
      material: "วัสดุ",
      industrials: "อุตสาหกรรม",
      "consumer-discretionary": "สินค้าฟุ่มเฟือย",
      "consumer-staples": "สินค้าจำเป็น",
      "health-care": "การดูแลสุขภาพ",
      financials: "การเงิน",
      "information-technology": "เทคโนโลยีสารสนเทศ",
      "communication-services": "บริการสื่อสาร",
      utilities: "สาธารณูปโภค",
      "real-estate": "อสังหาริมทรัพย์",
    } as Record<string, string>,
  },

  /** Heatmap-tile spellings (line breaks are layout) — only for sectors whose
   *  tile label differs from the list name. */
  sectorTileNames: {
    th: {
      "consumer-products": "สินค้า\nอุปโภคบริโภค",
      "agro-food": "เกษตรและ\nอุตสาหกรรม\nอาหาร",
    } as Record<string, string>,
    us: {
      energy: "ทรัพยากร",
      material: "บริการ",
      "consumer-discretionary": "สินค้า\nฟุ่มเฟือย",
      "consumer-staples": "สินค้า\nจำเป็น",
      "communication-services": "บริการ\nสื่อสาร",
    } as Record<string, string>,
  },

  detailList: {
    count: (n: number) => `${n} รายการ`,
    sort: { all: "ทั้งหมด", gain: "Top Gain", loss: "Top Loss" },
    sortAria: (label: string) => `เรียงตาม: ${label}`,
    loadingMore: "กำลังโหลดข้อมูล",
  },

  notFound: "ไม่พบข้อมูล",
  /** A stock route id that is no ticker, index or sector. */
  notFoundSymbol: "ไม่พบหลักทรัพย์นี้",

  /** Sections and lists with nothing to show yet. */
  empty: {
    indices: "ยังไม่มีข้อมูลดัชนี",
    stocks: "ยังไม่มีหุ้นในรายการนี้",
    crossSell: "ยังไม่มีสินทรัพย์ในหมวดนี้",
    sectors: "ยังไม่มีข้อมูลกลุ่มอุตสาหกรรม",
    list: "ยังไม่มีหลักทรัพย์ในรายการนี้",
  },

  indexDetail: {
    /** Back-header title per board, keyed by `MarketId`. */
    boardTitle: { th: "ดัชนีตลาดหุ้นไทย", us: "ดัชนีตลาดหุ้นต่างประเทศ" } as Record<string, string>,
    fallbackTitle: "ดัชนีตลาด",
  },

  crossSell: {
    kinds: {
      dr: {
        title: "DR (Depositary Receipt)",
        description:
          "ผลิตภัณฑ์การลงทุนที่ซื้อขายในตลาดหลักทรัพย์แห่งประเทศไทย\nออกแบบมาเพื่อเพิ่มโอกาสการลงทุนให้นักลงทุนไทย",
      },
      etf: {
        title: "ETF (Exchange Traded Fund)",
        description:
          "นโยบายการลงทุนที่อ้างอิงดัชนีต่าง ๆ เช่น หุ้น สินค้าโภคภัณฑ์ \nและตราสารหนี้ โดยมุ่งสร้างผลตอบแทนใกล้เคียงกับการเคลื่อนไหวของดัชนี",
      },
    },
    filter: "ตัวกรอง",
    filterTitle: (n: number) => `ตัวกรอง (${n})`,
    issuer: "ผู้ออก",
    region: "ภูมิภาค / ประเทศ",
    clearAll: "ล้างทั้งหมด",
    confirm: "ยืนยัน",
    close: "ปิด",
    /** Country chips, keyed by the filter option's id. */
    countries: {
      thailand: "ไทย",
      us: "สหรัฐฯ",
      taiwan: "ไต้หวัน",
      china: "จีน",
      japan: "ญี่ปุ่น",
      vietnam: "เวียดนาม",
      "hong-kong": "ฮ่องกง",
      singapore: "สิงคโปร์",
      india: "อินเดีย",
      europe: "ยุโรป",
      denmark: "เดนมาร์ก",
      france: "ฝรั่งเศส",
      italy: "อิตาลี",
      netherlands: "เนเธอร์แลนด์",
    } as Record<string, string>,
  },

  detail: {
    /** Keyed by `StockDetailTab`. */
    tabs: {
      "Market Info": "ข้อมูลตลาด",
      "Related Product": "สินค้าที่เกี่ยวข้อง",
      Company: "บริษัท",
      Research: "บทวิเคราะห์",
      Technical: "ปัจจัยทางเทคนิค",
      News: "ข่าว",
    } as Record<string, string>,
    tabNotice: (tab: string) => `ข้อมูล${tab}จะพร้อมให้บริการเร็ว ๆ นี้`,
    noTabData: "ยังไม่มีข้อมูลในส่วนนี้",
    noRelated: "ยังไม่มีสินค้าที่เกี่ยวข้องกับหุ้นตัวนี้",
    proposalDocuments: "บทวิเคราะห์หุ้น",
    lastUpdated: (stamp: string) => `อัปเดตล่าสุด: ${stamp}`,
    quote: {
      volume: "ปริมาณ",
      value: "มูลค่า",
      mktCap: "Mkt Cap",
      daysRange: "ช่วงราคาระหว่างวัน",
    },
    orderBook: {
      title: "Order Book",
      volume: "ปริมาณ",
      bestBid: "Best Bid",
      bid: "Bid",
      offer: "Offer",
    },
    timeSales: {
      title: "Time&Sales",
      tick: "Tick by Tick",
      volumeAnalysis: "Volume Analysis",
      cols: { time: "เวลา", price: "ราคา", volume: "ปริมาณ", side: "ฝั่ง" },
      side: { Buy: "ซื้อ", Sell: "ขาย" },
    },
    advance: {
      title: "ข้อมูลเพิ่มเติม",
      daysRange: "ช่วงราคาระหว่างวัน",
      week52: "52 สัปดาห์",
      close: "ปิด",
      /** Keyed by `AdvanceStat.key`. */
      stats: {
        volume: "ปริมาณ",
        open: "ราคาเปิด",
        floor: "Floor",
        avgVol10d: "ปริมาณเฉลี่ย (10 วัน)",
        week52Low: "ต่ำสุด 52 สัปดาห์",
        turnoverRatio: "อัตราการหมุนเวียน",
        freeFloatPct: "%Free Float",
        lotSize: "หน่วยการซื้อขาย",
        pe: "P/E",
        dividend: "เงินปันผล",
        marginRate: "Margin Rate",
        value: "มูลค่า",
        preClose: "ราคาปิดก่อนหน้า",
        ceiling: "Ceiling",
        mktCap: "Mkt Cap",
        week52High: "สูงสุด 52 สัปดาห์",
        turnover: "มูลค่าการซื้อขาย",
        freeFloat: "Free Float",
        totalShares: "จำนวนหุ้นทั้งหมด",
        pb: "P/B",
        dividendYield: "อัตราเงินปันผลตอบแทน",
      } as Record<string, string>,
    },
  },

  company: {
    /** Keyed by `CompanySubTab`. */
    subTabs: {
      profile: "ข้อมูลบริษัท",
      financials: "งบการเงิน",
      events: "ปฏิทินบริษัท",
    } as Record<string, string>,
    comingSoon: (label: string) => `${label}จะพร้อมให้บริการเร็ว ๆ นี้`,
    noData: "ยังไม่มีข้อมูลบริษัทของหุ้นตัวนี้",
    actionCount: (n: number) => `${n} รายการ`,
    today: "วันนี้",
    goToToday: (date: string) => `ไปที่วันนี้ · ${date}`,
    nothingScheduled: "ไม่มีรายการ",
    previousMonth: "เดือนก่อนหน้า",
    nextMonth: "เดือนถัดไป",
    filterActions: "กรองประเภทรายการ",
    more: (n: number) => `+${n} รายการ`,
  },

  related: {
    /** Keyed by `RelatedProductKind`. */
    chips: {
      dr: "DR",
      derivative: "อนุพันธ์",
      structured: "Global Structured Product",
      "thai-structured": "Thai Structured Product",
      "fixed-income": "ตราสารหนี้",
      "global-bond": "Global Bond",
      "mutual-fund": "กองทุนรวม",
    } as Record<string, string>,
    drYuanta: "DR ที่ออกโดย Yuanta",
    drOthers: "DR ที่ออกโดยโบรกเกอร์อื่น",
    symbols: (n: number) => `${n} หลักทรัพย์`,
    im: (value: string) => `IM: ${value}`,
    points: "จุด",
    relatedFutures: "ฟิวเจอร์สที่เกี่ยวข้อง",
    contracts: (n: number) => `${n} สัญญา`,
    viewMode: "รูปแบบการแสดงผล",
    viewTable: "ตาราง",
    viewCard: "การ์ด",
    volumeContracts: "ปริมาณ (สัญญา)",
    oiContracts: "Open Interest (สัญญา)",
    futuresUpdated: (stamp: string) =>
      `ราคาสะท้อนเฉพาะการซื้อขายแบบ Auto-Matching อัปเดตล่าสุด: ${stamp}`,
    symbol: "Symbol",
    totalFutures: "รวมฟิวเจอร์ส",
    /** Column headers; `\n` is where the header wraps. */
    cols: {
      lastTradingDay: "วันซื้อขาย\nวันสุดท้าย",
      lastPrice: "ราคาล่าสุด",
      im: "IM",
      change: "เปลี่ยนแปลง",
      changePercent: "% เปลี่ยนแปลง",
      open: "ราคาเปิด",
      high: "สูงสุด",
      low: "ต่ำสุด",
      volume: "ปริมาณ",
      openInterest: "Open\nInterest",
      settlementPrice: "ราคา\nSettlement",
    },
    remark: {
      title: "หมายเหตุ",
      price: "• ราคา:",
      priceBody: "ไม่รวมรายการซื้อขายแบบ Block Trade",
      chg: "• Chg (เปลี่ยนแปลง):",
      chgBody: "เปลี่ยนแปลงจากราคา Settlement ก่อนหน้า",
      oi: "• OI (Open Interest):",
      oiDay: "- ระหว่าง Day Session ค่า Open Interest เป็นค่า ณ Night Session ของวันก่อนหน้า",
      oiNight: "- ระหว่าง Night Session ค่า Open Interest เป็นค่า ณ Afternoon Session ของวันปัจจุบัน",
      im: "• IM:",
      imBody: "Initial Margin",
    },
    topPick: "Top pick",
    allThaiFcn: "Thai FCN ทั้งหมด",
    yield: "ผลตอบแทน",
  },
};

export default stock;
