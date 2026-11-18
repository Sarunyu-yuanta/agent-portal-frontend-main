/** `performance` namespace — see th/index.ts for the rules. */
const performance = {
  comingSoon: {
    title: "Performance",
    body: "การติดตามรายได้ ความครอบคลุมของ Pipeline และเป้าหมายจะอยู่ที่นี่ ยังไม่เปิดใช้งาน — โปรดติดตามเร็ว ๆ นี้",
  },
  kpi: {
    revenueYtd: "รายได้ YTD",
    aumGrowth: "การเติบโตของ AUM",
    netNewMoney: "Net New Money",
    productPenetration: "จำนวนผลิตภัณฑ์ต่อลูกค้า",
    overall: "ภาพรวม",
    progressTarget: (progress: number, target: string) => `${progress}% · เป้าหมาย ${target}`,
  },
  status: { "On Track": "ตามเป้า", Exceeded: "เกินเป้า", Lagging: "ต่ำกว่าเป้า" } as Record<string, string>,
  gap: {
    title: "Gap Analysis",
    items: {
      revenue: { label: "รายได้ที่ยังขาด", sub: "เพื่อให้ถึงเป้า Q2" },
      aum: { label: "ส่วนต่างการเติบโตของ AUM", sub: "ต่ำกว่าอัตราเป้าหมาย" },
      penetration: { label: "จำนวนผลิตภัณฑ์ต่อลูกค้า", sub: "ส่วนต่างผลิตภัณฑ์ / ลูกค้า" },
    },
  },
  actionPlan: {
    title: "AI Action Plan",
    subtitle: (gap: string) => `ขั้นตอนตามลำดับความสำคัญเพื่อปิดส่วนต่างรายได้ ${gap}`,
  },
  income: {
    title: "Income Tracker",
    estCommission: "ค่าคอมมิชชันประมาณการ (YTD)",
    vsLastQuarter: (delta: string) => `${delta} เทียบไตรมาสก่อน`,
    byProduct: "รายได้ตามประเภทผลิตภัณฑ์",
  },
  coverage: {
    title: "Pipeline Coverage",
    insightBefore: "Pipeline ของคุณครอบคลุม",
    insightEmphasis: (pct: number) => `${pct}% ของส่วนต่างรายได้`,
    insightAfter: (n: number) => `หากปิดได้ตามแผน ควรโฟกัสปิด ${n} ดีลที่อยู่ในขั้นเจรจา`,
    dealsInPipeline: "ดีลใน Pipeline",
    weightedValue: "มูลค่าถ่วงน้ำหนัก",
  },
  crossSell: {
    title: "Cross-Sell Diagnostics",
    singleProduct: "ลูกค้าที่ถือผลิตภัณฑ์เดียว",
    singleProductSub: "เสี่ยงย้ายออกสูง",
    multiProduct: "ลูกค้าที่ถือหลายผลิตภัณฑ์ (3+)",
    multiProductSub: "รักษาฐานลูกค้าได้ดี",
    overReliance: (asset: string, pct: string) => `พึ่งพา${asset}มากเกินไป (${pct} ของพอร์ต)`,
    equities: "หุ้น",
  },
  engagement: {
    title: "Client Engagement",
    atRisk: (n: number) => `เสี่ยง ${n} ราย`,
    active: "Active",
    dormant: "ไม่เคลื่อนไหว >30 วัน",
    activePct: (pct: number) => `Active ${pct}%`,
    dormantPct: (pct: number) => `ไม่เคลื่อนไหว ${pct}%`,
    viewDormant: "ดูลูกค้าที่ไม่เคลื่อนไหว",
  },
  simulator: {
    title: "Outcome Simulator",
    subtitle: "ปรับจำนวนดีลที่ปิดได้เพื่อดูผลต่อเป้า Q2",
    dealsClosed: "ดีลที่ปิดได้จาก Pipeline",
    deals: (n: number) => `${n} ดีล`,
    all: (n: number) => `ทั้งหมด ${n}`,
    projectedTarget: "% เป้าหมายที่คาดการณ์",
    estTotalCommission: "ค่าคอมฯ รวมประมาณการ",
  },
};

export default performance;
