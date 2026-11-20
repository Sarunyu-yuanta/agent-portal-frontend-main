import { mockAnalysts, type AnalystItem } from "@/lib/mock-data";

/**
 * The Research tab's mock feed — published reports and the analyst directory.
 * Read through `useResearch` (`@/hooks/use-catalog`), not imported by screens.
 */

export type ResearchItem = { id: string; date: string; category: string; title: string };

const MOCK_RESEARCH: ResearchItem[] = [
  { id: "r01", date: "03/08/2569", category: "Derivative", title: "DERIVATIVES - AFTERNOON" },
  {
    id: "r02",
    date: "03/08/2569",
    category: "Yuanta Global Wealth",
    title: "Global Insights - Cancelled Attacks on Iran: Unlocking Energy Market Overhang",
  },
  {
    id: "r03",
    date: "03/08/2569",
    category: "Chart Perspective Afternoon",
    title: "TECHNICAL - BDMS, LH, M",
  },
  {
    id: "r04",
    date: "03/08/2569",
    category: "จับข่าวมาเล่าหุ้น",
    title: "จับข่าวมาเล่าหุ้น - ENERGY, BANPU, TLI, TASCO",
  },
  {
    id: "r05",
    date: "03/08/2569",
    category: "Wealth Designs Daily",
    title: "Sentiment การลงทุนยังดีในช่วงสั้น แนะนำสะสม CBG, SJWD, TASCO, JMART",
  },
  {
    id: "r06",
    date: "03/08/2569",
    category: "Wealth Signal",
    title:
      "WEALTH SIGNAL - The Pullback Has a Purpose: Repricing Risk, Revealing the Winners - Part 2",
  },
  {
    id: "r07",
    date: "03/08/2569",
    category: "Wealth Signal",
    title:
      "WEALTH SIGNAL - The Pullback Has a Purpose: Repricing Risk, Revealing the Winners - Part 1",
  },
  {
    id: "r08",
    date: "03/08/2569",
    category: "Chart Perspective Morning",
    title: "TECHNICAL - STA, HMPRO, JMART, SISB, SAMART, CKP",
  },
  {
    id: "r09",
    date: "03/08/2569",
    category: "Power Investing",
    title: "POWER INVESTING - CBG, SJWD, TASCO",
  },
  {
    id: "r10",
    date: "03/08/2569",
    category: "Top 5 DCA",
    title: "TOP 5 DCA - GULF, SJWD, TASCO, ITC, MTC",
  },
  {
    id: "r11",
    date: "02/08/2569",
    category: "Wealth Designs Daily",
    title: "Market Wrap - SET ปรับตัวขึ้น นำโดยกลุ่มพลังงานและธนาคาร",
  },
  {
    id: "r12",
    date: "02/08/2569",
    category: "Theme Strategy",
    title: "THEME STRATEGY - AI Infrastructure Play: Data Center & Power",
  },
  {
    id: "r13",
    date: "02/08/2569",
    category: "Trading Portfolio",
    title: "TRADING PORTFOLIO UPDATE - สัปดาห์ที่ 31/2569",
  },
  {
    id: "r14",
    date: "02/08/2569",
    category: "Commodities Highlight",
    title: "COMMODITIES HIGHLIGHT - Gold & Oil Outlook Q3/2026",
  },
  {
    id: "r15",
    date: "01/08/2569",
    category: "Wealth Compass",
    title: "WEALTH COMPASS - Asset Allocation Monthly: สิงหาคม 2569",
  },
  {
    id: "r16",
    date: "01/08/2569",
    category: "ELN Pick",
    title: "ELN PICK - DELTA, AOT, PTT: Attractive Entry for Structured Products",
  },
  {
    id: "r17",
    date: "01/08/2569",
    category: "SBL IDEA",
    title: "SBL IDEA - Short Selling Opportunity: GULF, INTUCH",
  },
  {
    id: "r18",
    date: "01/08/2569",
    category: "Yuanta Universe",
    title: "YUANTA UNIVERSE - Monthly Model Portfolio Rebalancing",
  },
  {
    id: "r19",
    date: "01/08/2569",
    category: "ความเห็นนักวิเคราะห์",
    title: "Daily Morning Note - Macro Outlook & Stock Picks",
  },
  {
    id: "r20",
    date: "31/07/2569",
    category: "บทวิเคราะห์หุ้นรายตัว",
    title: "PTTEP - Maintain BUY, TP 155 บาท: Strong Cash Flow Despite Oil Weakness",
  },
  {
    id: "r21",
    date: "31/07/2569",
    category: "บทวิเคราะห์อุตสาหกรรม",
    title: "Sector Report: Thai Banking Sector - Asset Quality Improvement Ahead",
  },
  {
    id: "r22",
    date: "31/07/2569",
    category: "Technical Trading Portfolio",
    title: "TECHNICAL TRADING - Buy Signals: ADVANC, CPALL, GULF",
  },
  {
    id: "r23",
    date: "30/07/2569",
    category: "เอกสารการสัมมนา",
    title: "Wealth Seminar: Navigating Volatility in Global Markets - สไลด์ประกอบการสัมมนา",
  },
];

export type ResearchFeed = { reports: ResearchItem[]; analysts: AnalystItem[] };

/** One object, built once, so the resource hands back a stable reference. */
export const RESEARCH_FEED: ResearchFeed = { reports: MOCK_RESEARCH, analysts: mockAnalysts };
