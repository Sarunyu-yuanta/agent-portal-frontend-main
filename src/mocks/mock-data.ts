import clientsRaw from "@/mocks/clients.json";
import type { MembershipTier } from "@/components/ui/tier-badge";
import nbaActionsRaw from "@/mocks/nba-actions.json";
import pipelineDealsRaw from "@/mocks/pipeline-deals.json";
import miniKanbanRaw from "@/mocks/mini-kanban.json";
import insightsRaw from "@/mocks/insights.json";
import complianceAlertsRaw from "@/mocks/compliance-alerts.json";
import kycDataRaw from "@/mocks/kyc-data.json";
import houseViewStrategiesRaw from "@/mocks/house-view-strategies.json";
import performanceRaw from "@/mocks/performance.json";
import clientDetailsRaw from "@/mocks/client-details.json";
import notificationsRaw from "@/mocks/notifications.json";

// ── Narrow string-literal types that JSON cannot express ──────────────────────

type ClientStatus = "success" | "error" | "hold" | "processing";
type PriorityVariant = "red" | "yellow" | "blue";
type ComplianceType = "critical" | "warning";
type KYCStatus = "success" | "error" | "hold" | "processing";
type ConvictionVariant = "green" | "yellow" | "red";
type NotificationType = "icon";
type PerformanceStatus = "Lagging" | "On Track";

// ── Single source of truth: client name lives only in clients.json ────────────

export const mockClients = clientsRaw as Array<
  Omit<(typeof clientsRaw)[number], "status" | "membershipTier"> & {
    status: ClientStatus;
    membershipTier: MembershipTier;
  }
>;

// Lookup map — used below to enrich all other datasets
const nameById = Object.fromEntries(mockClients.map((c) => [c.id, c.name]));

// Abbreviated name: "Somchai Rattanakul" → "Somchai R."
const shortName = (id: string) => {
  const full = nameById[id] ?? id;
  const parts = full.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : full;
};

// ── Enriched exports (clientId → clientName/client derived at import time) ────

export const mockNBAActions = nbaActionsRaw.map((a) => ({
  ...a,
  clientName: nameById[a.clientId] ?? a.clientId,
  priorityVariant: a.priorityVariant as PriorityVariant,
}));

export const mockPipelineDeals = pipelineDealsRaw.map((d) => ({
  ...d,
  client: nameById[d.clientId] ?? d.clientId,
}));

export const mockMiniKanban = miniKanbanRaw.map((k) => ({
  ...k,
  client: shortName(k.clientId),
}));

export const mockInsights = insightsRaw.map((i) => ({
  ...i,
  clientName: nameById[i.clientId] ?? i.clientId,
}));

/**
 * KYC records, with `nextReview` stamped from today rather than authored.
 *
 * `kyc-data.json` carries `daysUntilExpiry` — an offset from "now" — and this
 * turns it into the `nextReview` date every consumer reads. Two reasons:
 *
 * 1. Hard-coded review dates rot. The file previously held literal dates
 *    alongside a stored countdown, and by the time anyone looked, all seven
 *    rows disagreed with their own dates (`nextReview` months in the past next
 *    to `daysUntilExpiry: 14`) — so the "KYC ครบกำหนด" card called a client due
 *    soon while the countdown on their profile said long overdue. Deriving one
 *    from the other makes that disagreement impossible to author.
 * 2. The expiry checkpoints (30 / 15 / 7 / 1 / 0 days) can only be demonstrated
 *    if some client is actually sitting in each band. Anchored to today, the
 *    spread in the JSON keeps demonstrating them next month too.
 *
 * Only the mock inverts the relationship. `nextReview` stays the field of
 * record, so consumers — and `kycExpiry`, which does the arithmetic — behave
 * exactly as they will against a real backend that returns a date.
 */
export const mockKYCData = kycDataRaw.map((k) => {
  const now = new Date();
  // UTC midnight, matching how `kycExpiry` reads the date back out, so the
  // round-trip lands on exactly the offset authored here.
  const review = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + k.daysUntilExpiry),
  );
  return {
    ...k,
    nextReview: review.toISOString().slice(0, 10),
    client: nameById[k.clientId] ?? k.clientId,
    kycStatus: k.kycStatus as KYCStatus,
  };
});

/**
 * A compliance alert may quote the client's KYC review date and countdown, so
 * those are written as `{kycNextReview}` / `{kycDaysUntilExpiry}` placeholders
 * and filled from the record here.
 *
 * Spelling them out in the JSON is how the KYC alert came to say "14 Days" and
 * "due 2026-06-11" about a client whose record says neither — the same drift
 * `mockKYCData` fixes by stamping the date rather than authoring it.
 */
function fillKycPlaceholders(text: string, clientId: string | null): string {
  if (!text.includes("{kyc")) return text;
  const record = clientId ? mockKYCData.find((k) => k.clientId === clientId) : undefined;
  if (!record) return text;
  return text
    .replace("{kycNextReview}", record.nextReview)
    .replace("{kycDaysUntilExpiry}", String(record.daysUntilExpiry));
}

export const mockComplianceAlerts = complianceAlertsRaw.map((a) => ({
  ...a,
  // "Unknown" entries have no clientId — fall back to the literal "client" field
  client: a.clientId ? (nameById[a.clientId] ?? a.clientId) : (a.client ?? "Unknown"),
  title: fillKycPlaceholders(a.title, a.clientId),
  message: fillKycPlaceholders(a.message, a.clientId),
  type: a.type as ComplianceType,
}));

export const mockHouseViewStrategies = houseViewStrategiesRaw as Array<
  Omit<(typeof houseViewStrategiesRaw)[number], "convictionVariant"> & {
    convictionVariant: ConvictionVariant;
  }
>;

export type AnalystItem = { id: string; name: string; title: string; photo: string };

export const mockAnalysts: AnalystItem[] = [
  {
    id: "a01",
    name: "ธนกร ศิริวัฒน์",
    title: "หัวหน้าฝ่ายวิเคราะห์หลักทรัพย์",
    photo: "/avatars/analyst-01.jpg",
  },
  {
    id: "a02",
    name: "ปิยะ เจริญสุข",
    title: "นักกลยุทธ์การลงทุน และนักวิเคราะห์ปัจจัยพื้นฐาน กลุ่มธนาคารและอสังหาริมทรัพย์",
    photo: "/avatars/analyst-02.jpg",
  },
  {
    id: "a03",
    name: "วรากร ทองสุข",
    title: "นักวิเคราะห์ปัจจัยทางเทคนิค",
    photo: "/avatars/analyst-03.jpg",
  },
  {
    id: "a04",
    name: "อรรถพล ไชยวงศ์",
    title: "นักวิเคราะห์ปัจจัยทางเทคนิค",
    photo: "/avatars/analyst-04.jpg",
  },
  {
    id: "a05",
    name: "สุพจน์ มั่นคง",
    title: "นักวิเคราะห์ปัจจัยพื้นฐาน กลุ่มพลังงานและปิโตรเคมี",
    photo: "/avatars/analyst-05.jpg",
  },
  { id: "a06", name: "ชัยวัฒน์ พูนทรัพย์", title: "นักวิเคราะห์อนุพันธ์", photo: "/avatars/analyst-06.jpg" },
  {
    id: "a07",
    name: "กิตติพงษ์ รุ่งเรือง",
    title: "นักวิเคราะห์ตราสารหนี้",
    photo: "/avatars/analyst-07.jpg",
  },
  {
    id: "a08",
    name: "ณัฐวุฒิ แสงทอง",
    title: "ผู้เชี่ยวชาญกองทุนและผลิตภัณฑ์การลงทุน",
    photo: "/avatars/analyst-08.jpg",
  },
];

export const mockPerformanceData = performanceRaw as typeof performanceRaw & {
  revenueYtd: { status: PerformanceStatus };
  aumGrowth: { status: PerformanceStatus };
  netNewMoney: { status: PerformanceStatus };
  productPenetration: { status: PerformanceStatus };
};

// ── ClientDetail types (kept here for page imports) ───────────────────────────

type AllocationSlice = { name: string; value: number; fill: string };
type AllocationKpi = {
  label: string;
  value: string;
  ytd: string;
  ytdPositive: boolean;
  warning?: string;
};
type AssetAllocationSlice = { label: string; percent: number; statusIcon: string };
type AssetSummary = {
  netValue: string;
  changeAmount: string;
  changePercent: string;
  changePositive: boolean;
  lineAvailable: string;
  cash: string;
  lastUpdatedDate: string;
  lastUpdatedTime: string;
  allocationSlices?: AssetAllocationSlice[];
};
type Holding = {
  asset: string;
  value: string;
  pnl: string;
  pnlPct: string;
  positive: boolean;
  pct: string;
};
type AIAlert = { title: string; message: string; primaryAction: string; secondaryAction: string };

export type ClientDetail = {
  assetSummary?: AssetSummary;
  allocationData: AllocationSlice[];
  allocationBreakdown: AllocationKpi[];
  topHoldings: Holding[];
  behavioralProfile: { label: string; value: string }[];
  tasks: { id: string; done: boolean; task: string; urgent: boolean }[];
  recentActivity: { label: string; description: string; date: string; dotColor: string }[];
  aiHighPriority: AIAlert | null;
  aiRiskAlert: { title: string; message: string; action: string } | null;
};

export const mockClientDetails = clientDetailsRaw as Record<string, ClientDetail>;

export const notificationGroups = notificationsRaw as Array<{
  label: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    type: NotificationType;
  }>;
}>;
