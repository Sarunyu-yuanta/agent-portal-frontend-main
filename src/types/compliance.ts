/** KYC records and compliance alerts. */

export type KycStatus = "success" | "error" | "hold" | "processing";

export type RiskRating = "Low" | "Medium" | "High";

/** A client's KYC record, as stored. */
export type KycRecordData = {
  id: string;
  clientId: string;
  riskRating: RiskRating;
  kycStatus: KycStatus;
  /** Days until the next review is due; negative once overdue. */
  daysUntilExpiry: number;
};

/** A KYC record with the client name joined and the review date resolved. */
export type KycRecord = KycRecordData & {
  /** ISO date (YYYY-MM-DD) of the next review. */
  nextReview: string;
  /** Client display name. */
  client: string;
};

export type ComplianceAlertType = "critical" | "warning";

export type ComplianceAlert = {
  id: string;
  type: ComplianceAlertType;
  title: string;
  /** `null` for alerts not tied to a known client. */
  clientId: string | null;
  /** Client display name ("Unknown" when there is no client). */
  client: string;
  message: string;
  action1: string;
  action2: string | null;
};
