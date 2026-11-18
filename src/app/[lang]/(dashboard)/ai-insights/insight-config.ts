import {
  ChartBarIcon,
  SparkleIcon,
  UsersIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import type { mockInsights } from "@/lib/mock-data";

export type SortOption = "priority" | "recent";
export type TabId = "all" | "product" | "risk" | "engagement" | "portfolio";
export type Insight = (typeof mockInsights)[number];

export const CATEGORY_CONFIG = {
  "Product Match": {
    color: "var(--text-brand-primary)",
    bg: "var(--bg-brand-light)",
    Icon: SparkleIcon,
    tagVariant: "green" as const,
    tagText: "Product Match",
    primaryAction: "Draft Proposal",
  },
  "Risk Alert": {
    color: "var(--text-danger-primary)",
    bg: "var(--bg-danger-light)",
    Icon: WarningIcon,
    tagVariant: "red" as const,
    tagText: "Risk Alert",
    primaryAction: "View Allocation",
  },
  "Engagement": {
    color: "var(--text-warning-primary)",
    bg: "var(--bg-warning-light)",
    Icon: UsersIcon,
    tagVariant: "yellow" as const,
    tagText: "Engagement",
    primaryAction: "Call Now",
  },
  "Portfolio": {
    color: "var(--text-brand-secondary)",
    bg: "var(--bg-brand-light)",
    Icon: ChartBarIcon,
    tagVariant: "blue" as const,
    tagText: "Portfolio",
    primaryAction: "Review Portfolio",
  },
} as const;

export function confidenceColor(confidence: number): string {
  if (confidence >= 85) return "var(--text-success-primary)";
  if (confidence >= 70) return "var(--text-warning-primary)";
  return "var(--text-danger-primary)";
}
