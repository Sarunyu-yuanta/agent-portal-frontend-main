import type { RoboRiskTier } from "./robo-risk-level";
import type { RoboPlanDetail } from "./robo-advisory-plan-data";

/** Figma 34315:85739 / 34315:85740 — Definit x Yuanta plan cards. */
export type DefinitPlan = {
  id: string;
  name: string;
  intro: string;
  factors: string[];
  riskTier: RoboRiskTier;
  availableRoom: string;
  minInvestment: string;
  holdingPeriod: string;
  maxDrawdown: string;
  /** Figma 34315:86458 — plan detail modal. */
  detail: RoboPlanDetail;
};

const DEFINIT_KNOWLEDGE_STYLES = ["Quantamental", "Factor model", "Systematic trading"] as const;

const DEFINIT_FEES: RoboPlanDetail["fees"] = [
  { label: "ค่าธรรมเนียมการซื้อขาย (ต่อมูลค่าการซื้อขาย)", value: "0.25 %" },
  { label: "ค่าธรรมเนียมในการจัดการ (ต่อปี)", value: "0.75 %" },
  { label: "ค่าธรรมเนียมผลการดำเนินงาน (ต่อปี)", value: "15 %" },
];

const DEFINIT_ACCOUNT_OPENING_NOTE = "ใช้เวลาดำเนินการเปิดบัญชีประมาณ 5 วันทำการ";

export const DEFINIT_PLANS: DefinitPlan[] = [
  {
    id: "dss",
    name: "Definit Set Select (DSS)",
    intro: "คัดเลือกหุ้นไทยอย่างเป็นระบบด้วย 3 ปัจจัยสำคัญ ได้แก่",
    factors: [
      "Earnings การปรับเพิ่มคาดการณ์กำไรของนักวิเคราะห์",
      "Valuation P/E ไม่แพงเมื่อเทียบกับ อุตสาหกรรม",
      "Technical ราคาหุ้นมี โมเมนตัมเชิงบวกระยะสั้น",
    ],
    riskTier: "high",
    availableRoom: "400/2000",
    minInvestment: "500,000",
    holdingPeriod: "3 - 5 ปี",
    maxDrawdown: "-33.20%",
    detail: {
      topUpMin: "100,000.00 บาท",
      tradingStyle: "Position trading",
      marketTiming: "",
      timing: "Monthly Rebalance",
      knowledgeStyles: [...DEFINIT_KNOWLEDGE_STYLES],
      targetInvestors: [
        "นักลงทุนที่รับความเสี่ยงได้สูง หาทางเลือกการลงทุนในหุ้นไทย",
        "นักลงทุนที่ไม่มีเวลาเลือกหุ้น เฝ้าพอร์ต ลงทุนด้วยกลยุทธ์การลงทุนคุณภาพโดยทีมงาน Definit",
        "นักลงทุนที่ต้องการพอร์ตหุ้นคัดสรรตามปัจจัย Fundamental และ Technical",
        "นักลงทุนที่มองหาการลงทุนระยะกลางถึงยาวในตลาดหลักทรัพย์ไทย",
      ],
      allocation: [{ label: "Thai Equity", percent: 100, color: "#7E2A0C" }],
      fees: DEFINIT_FEES,
      feeFootnote: "",
      accountOpeningNote: DEFINIT_ACCOUNT_OPENING_NOTE,
    },
  },
  {
    id: "dgs",
    name: "Definit Global Select (DGS)",
    intro: "คัดเลือก DR อย่างเป็นระบบด้วย 2 ปัจจัยสำคัญ ได้แก่",
    factors: [
      "Earnings การปรับเพิ่มคาดการณ์กำไรของนักวิเคราะห์",
      "Momentum ราคาหุ้นมีโมเมนตัมเชิงบวกระยะกลาง",
    ],
    riskTier: "high",
    availableRoom: "700/2000",
    minInvestment: "500,000",
    holdingPeriod: "3 - 5 ปี",
    maxDrawdown: "-37.88%",
    detail: {
      topUpMin: "100,000.00 บาท",
      tradingStyle: "Position trading",
      marketTiming: "",
      timing: "Monthly Rebalance",
      knowledgeStyles: [...DEFINIT_KNOWLEDGE_STYLES],
      targetInvestors: [
        "นักลงทุนที่รับความเสี่ยงได้สูง หาทางเลือก การลงทุนในหุ้นต่างประเทศ ด้วย DR",
        "นักลงทุนที่ไม่มีเวลาเลือกหุ้น เฝ้าพอร์ต ลงทุนด้วยกลยุทธ์การลงทุนคุณภาพโดยทีมงาน Definit",
        "นักลงทุนที่ไม่ต้องการจัดการภาษีเงินได้จากการลงทุนต่างประเทศ",
        "นักลงทุนที่ต้องการลงทุนต่างประเทศด้วยสกุลเงินบาท",
      ],
      allocation: [{ label: "Depository Receipt", percent: 100, color: "#7E2A0C" }],
      fees: DEFINIT_FEES,
      feeFootnote: "",
      accountOpeningNote: DEFINIT_ACCOUNT_OPENING_NOTE,
    },
  },
];
