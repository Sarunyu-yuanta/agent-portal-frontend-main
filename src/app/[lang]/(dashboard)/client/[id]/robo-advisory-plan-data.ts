import type { RoboRiskTier } from "./robo-risk-level";

/** Figma 33787:150290 — orange-scale allocation palette. */
export type RoboPlanAllocation = {
  label: string;
  percent: number;
  color: string;
};

export type RoboPlanFee = {
  label: string;
  value: string;
};

export type RoboPlanDetail = {
  topUpMin: string;
  tradingStyle: string;
  marketTiming: string;
  timing: string;
  knowledgeStyles: string[];
  targetInvestors: string[];
  allocation: RoboPlanAllocation[];
  fees: RoboPlanFee[];
  feeFootnote: string;
  accountOpeningNote: string;
};

/** Figma 33787:149512 / 33787:150203 — Robo Advisory plan cards + detail modal. */
export type RoboAdvisoryPlan = {
  id: string;
  provider: string;
  name: string;
  description: string;
  /** Figma 33787:149969 — risk tier drives label + bar color. */
  riskTier: RoboRiskTier;
  availableRoom: string;
  minInvestment: string;
  holdingPeriod: string;
  dividendPerYear: string;
  maxDrawdown: string;
  detail: RoboPlanDetail;
};

const GROWTH_ALLOCATION: RoboPlanAllocation[] = [
  { label: "Thai Equity", percent: 35, color: "#7E2A0C" },
  { label: "Foreign Equity", percent: 20, color: "#CA3500" },
  { label: "Government Bond", percent: 20, color: "#FF6900" },
  { label: "Property", percent: 10, color: "#FF8904" },
  { label: "Commodity", percent: 10, color: "#FFD7A8" },
  { label: "Cash", percent: 5, color: "#FFF7ED" },
];

const HIGH_RETURN_ALLOCATION: RoboPlanAllocation[] = [
  { label: "Thai Equity", percent: 40, color: "#7E2A0C" },
  { label: "Foreign Equity", percent: 35, color: "#CA3500" },
  { label: "Government Bond", percent: 10, color: "#FF6900" },
  { label: "Property", percent: 5, color: "#FF8904" },
  { label: "Commodity", percent: 5, color: "#FFD7A8" },
  { label: "Cash", percent: 5, color: "#FFF7ED" },
];

const DEFAULT_FEES: RoboPlanFee[] = [
  { label: "ค่าธรรมเนียมการซื้อขาย", value: "0.25 %*" },
  { label: "ค่าธรรมเนียมในการจัดการ", value: "1 %" },
  { label: "ค่าธรรมเนียมผลการดำเนินงาน", value: "1 %" },
];

export const ROBO_ADVISORY_PLANS: RoboAdvisoryPlan[] = [
  {
    id: "alpha-wealth-growth",
    provider: "Alpha Wealth",
    name: "สร้างการเติบโตของเงินทุน",
    description: "กระจายการลงทุนอย่างสมดุลระหว่างหุ้น พันธบัตร อสังหาริมทรัพย์ ทองคำ และเงินสด ",
    riskTier: "medium",
    availableRoom: "10/20",
    minInvestment: "500,000",
    holdingPeriod: "3 - 5 ปี",
    dividendPerYear: "5%",
    maxDrawdown: "-10%",
    detail: {
      topUpMin: "100,000.00 บาท",
      tradingStyle: "Buy & Hold",
      marketTiming: "Bull / Bear / Sideways Market",
      timing: "Monthly Rebalance",
      knowledgeStyles: [
        "Fundamental Analysis",
        "Technical Analysis",
        "Ensemble Tree Model",
        "Black-Litterman Model",
      ],
      targetInvestors: [
        "นักลงทุนที่มองหาผลตอบแทนระยะยาวโดยมีการกระจายการลงทุนอย่างสมดุล",
        "มีระยะเวลาออมอย่างน้อย 3-5 ปี",
      ],
      allocation: GROWTH_ALLOCATION,
      fees: DEFAULT_FEES,
      feeFootnote: "* ของมูลค่าเงินลงทุนเริ่มต้น โดยคิดตาม ระดับเงินลงทุน",
      accountOpeningNote: "ใช้เวลาดำเนินการเปิดบัญชีประมาณ 1-2 วันทำการ",
    },
  },
  {
    id: "alpha-wealth-high-return",
    provider: "Alpha Wealth",
    name: "มุ่งหวังผลตอบแทนสูง",
    description: "ลงทุนในหุ้นสูงถึง 75% ทั้งในประเทศและต่างประเทศ มุ่งเน้นโอกาสการเติบโตและผลตอบแทนที่สูง",
    riskTier: "high",
    availableRoom: "2/20",
    minInvestment: "500,000",
    holdingPeriod: "3-5 ปี",
    dividendPerYear: "7%",
    maxDrawdown: "-10%",
    detail: {
      topUpMin: "100,000.00 บาท",
      tradingStyle: "Buy & Hold",
      marketTiming: "Bull / Bear / Sideways Market",
      timing: "Monthly Rebalance",
      knowledgeStyles: [
        "Fundamental Analysis",
        "Technical Analysis",
        "Ensemble Tree Model",
        "Black-Litterman Model",
      ],
      targetInvestors: [
        "นักลงทุนที่ยอมรับความเสี่ยงสูงเพื่อผลตอบแทนระยะยาว",
        "มีระยะเวลาออมอย่างน้อย 3-5 ปี",
      ],
      allocation: HIGH_RETURN_ALLOCATION,
      fees: DEFAULT_FEES,
      feeFootnote: "* ของมูลค่าเงินลงทุนเริ่มต้น โดยคิดตาม ระดับเงินลงทุน",
      accountOpeningNote: "ใช้เวลาดำเนินการเปิดบัญชีประมาณ 1-2 วันทำการ",
    },
  },
];
