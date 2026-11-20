export type SubProduct = {
  id: string;
  name: string;
  ticker?: string;
  clientCount: number;
  totalAmountThb: number;
};

export const PRODUCT_SUB_DATA: Record<string, SubProduct[]> = {
  หุ้นไทย: [
    {
      id: "ptt",
      name: "PTT Public Co.",
      ticker: "PTT",
      clientCount: 6,
      totalAmountThb: 99_000_000,
    },
    {
      id: "advanc",
      name: "Advanced Info Service",
      ticker: "ADVANC",
      clientCount: 5,
      totalAmountThb: 87_800_000,
    },
    { id: "kbank", name: "กสิกรไทย", ticker: "KBANK", clientCount: 5, totalAmountThb: 74_500_000 },
    { id: "aot", name: "ท่าอากาศยานไทย", ticker: "AOT", clientCount: 4, totalAmountThb: 68_200_000 },
    { id: "scb", name: "ไทยพาณิชย์", ticker: "SCB", clientCount: 4, totalAmountThb: 62_000_000 },
    { id: "cpall", name: "ซีพีออลล์", ticker: "CPALL", clientCount: 3, totalAmountThb: 51_100_000 },
    {
      id: "tisco",
      name: "ทิสโก้ ไฟแนนเชียล",
      ticker: "TISCO",
      clientCount: 2,
      totalAmountThb: 39_400_000,
    },
  ],

  หุ้นต่างประเทศ: [
    { id: "aapl", name: "Apple Inc.", ticker: "AAPL", clientCount: 7, totalAmountThb: 112_000_000 },
    {
      id: "msft",
      name: "Microsoft Corp.",
      ticker: "MSFT",
      clientCount: 6,
      totalAmountThb: 98_500_000,
    },
    {
      id: "nvda",
      name: "NVIDIA Corp.",
      ticker: "NVDA",
      clientCount: 5,
      totalAmountThb: 87_300_000,
    },
    {
      id: "amzn",
      name: "Amazon.com Inc.",
      ticker: "AMZN",
      clientCount: 4,
      totalAmountThb: 72_000_000,
    },
    { id: "tsla", name: "Tesla Inc.", ticker: "TSLA", clientCount: 3, totalAmountThb: 63_200_000 },
    {
      id: "meta",
      name: "Meta Platforms",
      ticker: "META",
      clientCount: 3,
      totalAmountThb: 55_000_000,
    },
    {
      id: "googl",
      name: "Alphabet Inc.",
      ticker: "GOOGL",
      clientCount: 2,
      totalAmountThb: 44_000_000,
    },
  ],

  หุ้นกู้ที่มีอนุพันธ์แฝง: [
    {
      id: "kbank-sp1",
      name: "KBANK Barrier Reverse Conv.",
      ticker: "KBANK-SP1",
      clientCount: 5,
      totalAmountThb: 80_000_000,
    },
    {
      id: "scb-sp2",
      name: "SCB Capital Protected Note",
      ticker: "SCB-SP2",
      clientCount: 4,
      totalAmountThb: 65_000_000,
    },
    {
      id: "bbl-sp3",
      name: "BBL ELN USD/THB",
      ticker: "BBL-SP3",
      clientCount: 3,
      totalAmountThb: 48_000_000,
    },
    {
      id: "gs-sp5",
      name: "GS Autocall Note",
      ticker: "GS-SP5",
      clientCount: 4,
      totalAmountThb: 40_000_000,
    },
    {
      id: "kr-sp4",
      name: "Krungthai ELN SET50",
      ticker: "KR-SP4",
      clientCount: 2,
      totalAmountThb: 33_000_000,
    },
  ],

  กองทุนรวม: [
    { id: "kf-star", name: "KF-STAR กสิกรไทย", clientCount: 6, totalAmountThb: 56_000_000 },
    { id: "mfc-hi", name: "MFC Hi-Dividend", clientCount: 5, totalAmountThb: 44_300_000 },
    { id: "scb-mid", name: "SCBMID Mid-Small Cap", clientCount: 5, totalAmountThb: 38_700_000 },
    { id: "one-fin", name: "ONE-FINTECH", clientCount: 3, totalAmountThb: 43_200_000 },
    { id: "kkp-robo", name: "KKP Robo Wealth", clientCount: 4, totalAmountThb: 29_800_000 },
  ],

  ตราสารหนี้: [
    { id: "gov-5y", name: "พันธบัตรรัฐบาล 5 ปี", clientCount: 7, totalAmountThb: 47_900_000 },
    { id: "kbank-2y", name: "หุ้นกู้ KBANK 2 ปี", clientCount: 5, totalAmountThb: 45_200_000 },
    { id: "scb-3y", name: "หุ้นกู้ SCB 3 ปี", clientCount: 4, totalAmountThb: 36_500_000 },
    { id: "cpall-bd", name: "หุ้นกู้ CPALL 3.5%", clientCount: 3, totalAmountThb: 30_000_000 },
  ],

  อนุพันธ์: [
    { id: "set50-fut", name: "SET50 Index Futures", clientCount: 4, totalAmountThb: 32_000_000 },
    { id: "gold-fut", name: "Gold Futures (GF)", clientCount: 3, totalAmountThb: 18_500_000 },
    { id: "oil-fut", name: "Brent Crude Futures", clientCount: 2, totalAmountThb: 15_300_000 },
    { id: "usd-opt", name: "USD/THB Currency Option", clientCount: 2, totalAmountThb: 14_000_000 },
  ],

  ตราสารหนี้ต่างประเทศ: [
    { id: "us-10y", name: "US Treasury 10Y", clientCount: 5, totalAmountThb: 10_200_000 },
    { id: "hsbc-28", name: "HSBC Bond 2028", clientCount: 4, totalAmountThb: 8_700_000 },
    { id: "jgb-5y", name: "Japan Govt Bond 5Y", clientCount: 2, totalAmountThb: 5_100_000 },
    { id: "bund-7y", name: "German Bund 7Y", clientCount: 1, totalAmountThb: 2_600_000 },
  ],

  // เงินสด — ไม่มี sub-products
};
