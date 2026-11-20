import { parseAmount } from "@/lib/client-utils";
import type { LiabilitiesDetail, LiabilityCategory, LiabilitySubItem } from "@/types/portfolio";

const BASE_CATEGORIES: Omit<LiabilityCategory, "subItems" | "amount">[] = [
  { id: "debt", label: "ภาระหนี้", percent: 42, color: "#8B1538" },
  { id: "payable", label: "ยอดค้างจ่าย", percent: 28, color: "#E11D48" },
  { id: "receivable", label: "ยอดค้างรับ", percent: 20, color: "#0A6EE7" },
  { id: "short", label: "มูลค่าขายชอร์ต", percent: 10, color: "#F9A8D4" },
];

const BASE_SUB_ITEMS: Record<string, LiabilitySubItem[]> = {
  debt: [
    { label: "Credit Balance a/c", amount: "55,000" },
    { label: "Derivative a/c", amount: "22,700" },
  ],
  payable: [
    { label: "Settlement Payable", amount: "32,400" },
    { label: "Fee Payable", amount: "19,400" },
  ],
  receivable: [
    { label: "Dividend Receivable", amount: "22,000" },
    { label: "Coupon Receivable", amount: "15,000" },
  ],
  short: [{ label: "Short Sell Position", amount: "18,500" }],
};

const BASE_TOTAL = 185_000;

function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function scaleSubItems(items: LiabilitySubItem[], categoryTotal: number): LiabilitySubItem[] {
  const baseSum = items.reduce((sum, item) => sum + parseAmount(item.amount), 0);
  if (baseSum <= 0) return items;

  let allocated = 0;

  return items.map((item, index) => {
    if (index === items.length - 1) {
      return {
        label: item.label,
        amount: formatAmount(Math.max(0, categoryTotal - allocated)),
      };
    }

    const scaled = Math.round((parseAmount(item.amount) / baseSum) * categoryTotal);
    allocated += scaled;

    return {
      label: item.label,
      amount: formatAmount(scaled),
    };
  });
}

export function getLiabilitiesDetail(totalAmount: string, lastUpdated: string): LiabilitiesDetail {
  const total = parseAmount(totalAmount) || BASE_TOTAL;

  const categories: LiabilityCategory[] = BASE_CATEGORIES.map((category) => {
    const categoryTotal = Math.round(total * (category.percent / 100));

    return {
      ...category,
      amount: formatAmount(categoryTotal),
      subItems: scaleSubItems(BASE_SUB_ITEMS[category.id], categoryTotal),
    };
  });

  return {
    categories,
    lastUpdated,
  };
}
