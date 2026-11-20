import type th from "@/i18n/dictionaries/th/compliance";

const compliance = {
  kpi: {
    criticalAlerts: "Critical Alerts",
    criticalAlertsSub: "Require immediate action",
    pendingKyc: "Pending KYC",
    pendingKycSub: "Documents outstanding",
    suitabilityFlags: "Suitability Flags",
    suitabilityFlagsSub: "Trade blocked",
    expiring30: "Expiring in 30 Days",
  },
  alerts: {
    title: "Active Compliance Alerts",
    openCount: (n: number) => `${n} open`,
    empty: "No open alerts",
    severity: { critical: "Critical", warning: "Warning" },
    hoursAgo: (n: number) => `${n} hrs ago`,
    today: "Today",
  },
  riskRating: { High: "High", Medium: "Medium", Low: "Low" } as Record<string, string>,
  riskRatingLabel: (rating: string) => `${rating} Risk`,
  kycStatus: {
    stop: "Stop",
    success: "Success",
    hold: "Hold",
    processing: "Processing",
    error: "Error",
  },
  table: {
    title: "KYC & Document Pipeline",
    export: "Export",
    filterBy: "Filter by:",
    filters: {
      all: "All Statuses",
      success: "Verified",
      processing: "Processing",
      hold: "On Hold",
      error: "Expired",
    },
    columns: {
      client: "Client",
      riskRating: "Risk Rating",
      kycStatus: "KYC Status",
      nextReview: "Next Review",
      expiry: "Expiry",
    },
    daysShort: (n: number) => `${n}d`,
    emptyBody: "Try another filter, or clear filters to see everything.",
    empty: "No KYC records yet",
  },
  detail: {
    kycStatus: "KYC Status",
    riskRating: "Risk Rating",
    nextReview: "Next Review",
    expiry: "Expiry",
    days: (n: number) => `${n} days`,
    actions: { remind: "Remind", upload: "Upload", schedule: "Schedule", aiBrief: "AI Brief" },
    expiresUrgent: "KYC expires in less than 7 days. Immediate action required.",
    expiresSoon: (n: number) => `KYC expires in ${n} days. Schedule review soon.`,
    relatedAlerts: "Compliance Alerts",
  },
  guide: {
    title: "AI Compliance Guide",
    activeAlert: "Active Alert",
    activeAlertTitle: "Unsuitable Trade Blocked",
    riskMismatch: "Risk mismatch",
    resolutionSteps: "Resolution Steps",
    steps: [
      "Review client transaction history for anomalies",
      "Cross-reference sanctions & adverse media databases",
      "Prepare & upload documentation checklist",
      "Escalate to compliance officer with full report",
    ],
    links: {
      sanctions: { label: "Sanctions Database", sub: "Search adverse media" },
      docs: { label: "Doc Checklist", sub: "KYC requirements" },
      escalation: { label: "Escalation Form", sub: "Compliance officer" },
    },
    askPlaceholder: "Ask compliance AI…",
  },
} satisfies typeof th;

export default compliance;
