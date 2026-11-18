// ─── Shared House View / Insights data ─────────────────────────────────────────
// Used by both the Insights list (page.tsx) and the Insight detail page ([id]/).

import { TOP_PICKS, type StructuredProduct } from "../client/[id]/structured-product-data";
import { FIXED_INCOME_BONDS, type FixedIncomeBond } from "../client/[id]/fixed-income-data";
import { GLOBAL_BOND_ISSUERS, type GlobalBondIssuer } from "../client/[id]/global-bond-data";

export function getCategory(strategy: { category?: string }): string {
  return strategy.category ?? "";
}

// ─── Related products ───────────────────────────────────────────────────────
// Each insight is tagged with an `assetClass` (Equity, Fixed Income, Alternatives,
// Mixed, Real Estate). We use that to pull whichever real product types are
// actually relevant — a plain "one array per type" shape (rather than a
// discriminated union per combo) so any mix can be composed without adding a
// new "kind" every time. Real Estate has no matching catalog data yet, so all
// three arrays stay empty rather than showing an unrelated product type.

const ALL_GLOBAL_BOND_ISSUERS: GlobalBondIssuer[] = Object.values(GLOBAL_BOND_ISSUERS);

export type RelatedProducts = {
  structured: StructuredProduct[];
  fixedIncome: FixedIncomeBond[];
  globalBond: GlobalBondIssuer[];
};

export function getRelatedProducts(strategy?: { assetClass?: string }): RelatedProducts {
  switch (strategy?.assetClass) {
    case "Fixed Income":
      // Domestic THB bonds + a USD-denominated global bond issuer — both are
      // fixed income, so both are relevant here.
      return {
        structured: [],
        fixedIncome: FIXED_INCOME_BONDS.slice(0, 1),
        globalBond: ALL_GLOBAL_BOND_ISSUERS.slice(0, 1),
      };
    case "Equity":
    case "Alternatives":
      return { structured: TOP_PICKS.slice(0, 2), fixedIncome: [], globalBond: [] };
    case "Mixed":
      return {
        structured: TOP_PICKS.slice(0, 1),
        fixedIncome: FIXED_INCOME_BONDS.slice(0, 1),
        globalBond: [],
      };
    case "Real Estate":
      return { structured: [], fixedIncome: [], globalBond: [] };
    default:
      // No specific strategy in context (e.g. the Insights list sidebar) —
      // show trending structured notes as a generic default.
      return { structured: TOP_PICKS.slice(0, 2), fixedIncome: [], globalBond: [] };
  }
}

export const CATEGORY_TAG_VARIANT: Record<string, "red" | "green" | "blue" | "lime" | "yellow" | "gray"> = {
  "Hot issue":           "red",
  "Buy list":            "green",
  "Asset performance":   "blue",
  "Market calendar":     "lime",
  "Asset class outlook": "yellow",
  "Market outlook":      "gray",
};

export const CATEGORY_ACCENT_COLOR: Record<string, string> = {
  "Hot issue":           "#ef4444",
  "Buy list":            "#22c55e",
  "Asset performance":   "#3b82f6",
  "Market calendar":     "#a855f7",
  "Asset class outlook": "#eab308",
  "Market outlook":      "#6b7280",
};

const CATEGORY_TH_LABEL: Record<string, string> = {
  "Hot issue":           "ประเด็นร้อน",
  "Buy list":            "รายการน่าซื้อ",
  "Asset performance":   "ผลตอบแทนสินทรัพย์",
  "Market calendar":     "ปฏิทินตลาด",
  "Asset class outlook": "มุมมองสินทรัพย์",
  "Market outlook":      "มุมมองตลาด",
};

// ─── Strategy detail (rationale only) — used as the AI Summary fallback ───────

export const STRATEGY_DETAIL: Record<string, { rationale: string }> = {
  s1:  { rationale: "Micron เซ็น SCA ครบ 16 ฉบับ ขณะที่ supply ยังตึงถึงปี 2028 — จังหวะนี้คือ valuation reset ไม่ใช่จุดจบ cycle นักลงทุนที่ออกไปรอ correction อาจพลาด re-rating ที่เกิดขึ้นแล้ว" },
  s2:  { rationale: "Core CPI ต่ำกว่าคาด 3 เดือนติด ตลาดยังไม่ price in โอกาสที่ Fed หยุดรอแทนที่จะขึ้น — กำไรบริษัทเป็นตัวชี้วัดที่สำคัญกว่า yield level" },
  s3:  { rationale: "Hyperscaler capex ขยายสู่ Sovereign AI และ Enterprise — addressable market ใหญ่กว่าที่นักวิเคราะห์คาด 3 เท่า ขณะที่ราคาหุ้นยังสะท้อนเฉพาะ Hyperscaler demand" },
  s4:  { rationale: "Geopolitical risk premium ลดลงหลังการเจรจา ขณะที่ Rotation จาก Growth สู่ Value เริ่มชัดเจน — สินทรัพย์ที่ได้รับ premium จาก geopolitical fear จะถูก re-price" },
  s5:  { rationale: "เมื่อเฟดส่งสัญญาณขึ้นดอกเบี้ยลายปี Bear Flattening ยิ่งชัด — Playbook ของพอร์ตต้องเปลี่ยนตาม ลด duration ยาว เพิ่ม floating rate และ short-end exposure" },
  s6:  { rationale: "HBM4E เข้าสู่รอบ qualification เร็วกว่าคาด ขณะที่ Intel Foundry turnaround และ BESI ยกเป้าปี 2030 ยืนยัน AI semiconductor supercycle ยังไม่จบ" },
  s7:  { rationale: "FERC และ ERCOT ออกกฎใหม่ Time to Power สำหรับ AI data center ขนาดใหญ่ เพิ่ม visibility ต่อ capex ด้านพลังงาน — utilities และ power infrastructure เป็น beneficiary โดยตรง" },
  s8:  { rationale: "หุ้นเกาหลีพุ่งนำโลกสัปดาห์นี้ ขณะพลังงานและทองคำโดนแรงขาย — Selective plays ในกลุ่ม Value ที่ยังมี dividend yield น่าสนใจในสภาวะ rotation" },
  s9:  { rationale: "Bank lending pullback creates a supply gap in senior secured private credit. Direct lending at 9–11% yield with first-lien security — asymmetric risk/reward." },
  s10: { rationale: "Strongest GDP trajectory in G20 at 6.5–7%. Demographic dividend, manufacturing FDI inflows, and middle-class consumption boom create a multi-decade compounding story." },
  s11: { rationale: "เมื่อ AI ก้าวสู่ Agentic AI กำไรบริษัทจดทะเบียนแรงสุดในรอบ 5 ปี ขณะที่ตลาด Memory โลกถูกปรับประมาณการขึ้น" },
  s12: { rationale: "เมื่อ rack ของ NVIDIA ในปี 2028 ใช้ไฟมากกว่า 1 เมกะวัตต์ สถาปัตยกรรม 800VDC ไม่ใช่แค่เรื่องวิศวกรรม — แต่คือธีมการลงทุนใหม่" },
  s13: { rationale: "เมื่อน้ำมันดิ้งและชิปพุ่ง ตลาดโลกเดือนมิถุนายนบอกอะไรเราเกี่ยวกับโอกาสและความเสี่ยงที่กำลังจะมาถึง" },
  s14: { rationale: "CIO มองตลาด selective overweight ใน quality equity ขณะที่ bond duration ยังคง neutral รอสัญญาณ Fed ที่ชัดขึ้นใน H2" },
  s15: { rationale: "เมื่อ Nvidia ทำสถิติรายได้ใหม่และ Jensen Huang บินตรงสู่ไทยก่อน Computex — Supercycle นี้ยังไม่หยุด ยังมี room ขึ้นอีก" },
  s16: { rationale: "ดีลสันติภาพ US-Iran กดสปอตน้ำมัน ขณะ SpaceX IPO พิสูจน์ว่าไม่ใช่แค่บริษัทจรวด — สองธีมที่เปลี่ยน portfolio allocation" },
  s17: { rationale: "หุ้นเกาหลีพุ่งนำโลกสัปดาห์นี้ ขณะพลังงานและทองคำโดนแรงขาย — สัญญาณ rotation ที่ชัดเจนที่สุดในรอบไตรมาส" },
  s18: { rationale: "IG spread แคบลงต่อเนื่อง ขณะที่ HY เริ่มแยกทาง — signal สำคัญที่ตลาดหุ้นมักจะตามมาใน 4–6 สัปดาห์" },
  s19: { rationale: "CIO ยืนยัน equity overweight ต่อ พร้อมส่งสัญญาณเริ่ม rotate เข้า EM ที่ valuation ยังถูกเมื่อเทียบกับ DM" },
  s20: { rationale: "ธนาคารกลางซื้อทองสูงสุดในรอบ 50 ปี — de-dollarisation ไม่ใช่ทฤษฎีอีกต่อไป แต่เป็นข้อมูลที่วัดได้และ price in ยังไม่เต็ม" },
  s21: { rationale: "พฤษภาคมปิดด้วย gold +4.2% นำโลก ขณะ EM bond ฟื้นตัวแรงหลัง Fed pause signal ชัด — positioning เริ่มเปลี่ยน" },
  s22: { rationale: "FDI เข้า India ทำสถิติ — Apple, Samsung, TSMC ต่างมาลงทุน manufacturing renaissance เพิ่งเริ่มและจะยาวนาน 10+ ปี" },
  s23: { rationale: "Beijing ปล่อย stimulus รอบสอง หลัง PMI ฟื้น — HK-listed tech เป็นจุดเข้าที่ดีที่สุดในรอบ 3 ปี valuation ถูกกว่า US tech 40%" },
  s24: { rationale: "Dollar อ่อนค่าลง ขณะ EM central bank ลด rate — FX carry ใน ASEAN ให้ yield เพิ่มเติม 2–3% ต่อปีโดยไม่รับ credit risk" },
  s25: { rationale: "AI ย่น timeline drug discovery จาก 10 ปีเหลือ 3 ปี — Big Pharma กำลัง hunt acquisition เพื่อเติม pipeline ราคา M&A premium สูงขึ้น" },
  s26: { rationale: "CIO คัดกรอง 5 กองทุนเด่นประจำเดือน ครอบคลุมทุก risk profile ตั้งแต่ conservative bond ถึง aggressive growth equity" },
  s27: { rationale: "Quantum milestone ใกล้มากกว่าที่คิด — thematic allocation เล็กๆ ให้ option value สูงมากในพอร์ต ความเสี่ยงจำกัดแต่ upside ไม่จำกัด" },
  s28: { rationale: "สัปดาห์ที่มี event สำคัญหนาแน่น — volatility อาจพุ่งสั้นๆ เป็นโอกาส rebalance และ add position ในจุดที่อ่อนตัว" },
  s29: { rationale: "ทองแดงเป็นโลหะแห่ง energy transition — EV + grid + AI data center สร้าง demand ที่ mine supply ตามไม่ทัน deficit ยาวถึงปี 2030" },
  s30: { rationale: "Soft landing, Re-acceleration หรือ Stagflation — 3 scenario พร้อม portfolio playbook สำหรับแต่ละกรณี ความน่าจะเป็นและ positioning ที่เหมาะสม" },
};

// ─── Insight detail (full content — AI summary + article sections) ────────────
// Only s1 has hand-authored sections today. Every other id reuses those same
// sections as placeholder body content (see getInsightDetail()) — a stand-in
// until each insight's article content is served from a real API.

export type InsightSection = {
  heading: string;
  content: string;
  image?: string;
};

export type InsightDetail = {
  date: string;
  subtitle: string;
  aiSummary: string;
  sections: InsightSection[];
};

export const INSIGHT_DETAIL: Record<string, InsightDetail> = {
  s1: {
    date: "01 กรกฎาคม 2026",
    subtitle: "บทวิเคราะห์ประเด็นร้อนประจำเดือน กรกฎาคม 2569",
    aiSummary:
      "Memory shortage ที่ลากยาวถึงปี 2028 ประกอบกับ Micron SCA 16 ฉบับที่สร้าง margin floor สูงกว่า peak cycle เดิม ทำให้ risk/reward ของกลุ่ม Semiconductor และ Memory Equipment กลับมาน่าสนใจหลังปรับฐาน แนะนำสะสม SCBSEMI, SMH, AMAT19, LRCX19, KLAC19, TAIWAN19 และ EWY/DRAM",
    sections: [
      {
        heading: "Memory Upcycle ยังไม่จบ: Valuation Reset คือโอกาส ไม่ใช่สัญญาณ End-of-Cycle",
        content:
          "ในเดือนกรกฎาคม 2569 ภาพการลงทุนในกลุ่ม Semiconductor และ Memory ยังคงน่าสนใจอย่างมีนัยสำคัญ โดย Yuanta CIO มองว่าการปรับฐานของหุ้น memory ล่าสุดเป็น valuation reset มากกว่าสัญญาณจบ cycle เพราะปัจจัยพื้นฐานกลับแข็งแกร่งขึ้นหลังผลประกอบการของ Micron ขณะที่ valuation ปรับลงใกล้ช่วงต้น พ.ค. ก่อน re-rating รอบล่าสุด ทำให้ risk/reward กลับมาน่าสนใจอีกครั้ง",
        image: "/insights/s1-profitability.svg",
      },
      {
        heading: "Revenue Growth by Segment / Technology: อุปสงค์กระจายตัวกว้างกว่าที่ตลาดคาด",
        content:
          "แรงหนุนหลักยังคงมาจากกลุ่ม HBM ที่ demand จาก AI accelerator เติบโตก้าวกระโดด ขณะที่ DRAM commodity และ NAND เริ่มฟื้นตัวตามหลัง supply ที่ตึงตัวต่อเนื่อง ด้าน Foundry Equipment และ Test & Assembly ได้อานิสงส์จาก capex cycle ที่ขยายวงกว้างขึ้น สะท้อนว่า supercycle รอบนี้ไม่ได้จำกัดอยู่แค่ผู้เล่นรายใหญ่ไม่กี่ราย",
        image: "/insights/s1-revenue-growth.svg",
      },
    ],
  },
};

function toGregorianDate(periodLabel: string): string {
  const match = periodLabel.match(/^(\S+)\s+(\d{4})$/);
  if (!match) return periodLabel;
  const [, month, buddhistYear] = match;
  return `01 ${month} ${parseInt(buddhistYear, 10) - 543}`;
}

// Placeholder body content shared by every insight that has no authored sections
// of its own yet — swap this for a real per-insight fetch once the API exists.
const PLACEHOLDER_SECTIONS: InsightSection[] = INSIGHT_DETAIL.s1.sections;

/** Resolves full detail for an insight. Ids without hand-authored content reuse
 *  PLACEHOLDER_SECTIONS as a stand-in body, pending real API-backed content. */
export function getInsightDetail(strategy: { id: string; category?: string; period?: string; periodLabel?: string }): InsightDetail {
  const authored = INSIGHT_DETAIL[strategy.id];
  if (authored) return authored;

  const category = getCategory(strategy);
  const periodLabel = strategy.periodLabel ?? "";
  const periodUnit = strategy.period === "weekly" ? "สัปดาห์" : "เดือน";

  return {
    date: toGregorianDate(periodLabel),
    subtitle: `บทวิเคราะห์${CATEGORY_TH_LABEL[category] ?? category}ประจำ${periodUnit} ${periodLabel}`,
    aiSummary: STRATEGY_DETAIL[strategy.id]?.rationale ?? "",
    sections: PLACEHOLDER_SECTIONS,
  };
}
