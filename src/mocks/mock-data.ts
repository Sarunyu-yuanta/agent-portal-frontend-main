import clientsRaw from "@/mocks/clients.json";
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
import type { Client, ClientDetail } from "@/types/client";
import type { ComplianceAlert, KycRecord, KycRecordData } from "@/types/compliance";
import type { Analyst, HouseViewStrategy } from "@/types/research";
import type {
  AiInsight,
  MiniKanbanItem,
  NbaAction,
  PerformanceData,
  PipelineDeal,
} from "@/types/sales";

// ── Single source of truth: client name lives only in clients.json ────────────

export const mockClients = clientsRaw as Client[];

// Lookup map — used below to enrich all other datasets
const nameById = Object.fromEntries(mockClients.map((c) => [c.id, c.name]));

// Abbreviated name: "Somchai Rattanakul" → "Somchai R."
const shortName = (id: string) => {
  const full = nameById[id] ?? id;
  const parts = full.split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : full;
};

// ── Enriched exports (clientId → clientName/client derived at import time) ────

export const mockNBAActions: NbaAction[] = nbaActionsRaw.map((a) => ({
  ...a,
  clientName: nameById[a.clientId] ?? a.clientId,
  priority: a.priority as NbaAction["priority"],
  priorityVariant: a.priorityVariant as NbaAction["priorityVariant"],
  tier: a.tier as NbaAction["tier"],
}));

export const mockPipelineDeals: PipelineDeal[] = pipelineDealsRaw.map((d) => ({
  ...d,
  client: nameById[d.clientId] ?? d.clientId,
}));

export const mockMiniKanban: MiniKanbanItem[] = miniKanbanRaw.map((k) => ({
  ...k,
  client: shortName(k.clientId),
}));

export const mockInsights: AiInsight[] = insightsRaw.map((i) => ({
  ...i,
  type: i.type as AiInsight["type"],
  category: i.category as AiInsight["category"],
  tier: i.tier as AiInsight["tier"],
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
export const mockKYCData: KycRecord[] = (kycDataRaw as KycRecordData[]).map((k) => {
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

export const mockComplianceAlerts: ComplianceAlert[] = complianceAlertsRaw.map((a) => ({
  ...a,
  // "Unknown" entries have no clientId — fall back to the literal "client" field
  client: a.clientId ? (nameById[a.clientId] ?? a.clientId) : (a.client ?? "Unknown"),
  title: fillKycPlaceholders(a.title, a.clientId),
  message: fillKycPlaceholders(a.message, a.clientId),
  type: a.type as ComplianceAlert["type"],
}));

export const mockHouseViewStrategies = houseViewStrategiesRaw as HouseViewStrategy[];

export const mockAnalysts: Analyst[] = [
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

export const mockPerformanceData = performanceRaw as PerformanceData;

export const mockClientDetails = clientDetailsRaw as Record<string, ClientDetail>;

export const notificationGroups = notificationsRaw as Array<{
  label: string;
  items: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    type: "icon";
  }>;
}>;
