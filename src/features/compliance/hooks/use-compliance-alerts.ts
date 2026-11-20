"use client";

import { useEndpoint } from "@/lib/api/endpoint";
import type { Resource } from "@/lib/api/resource";
import type { ComplianceAlert } from "@/types/compliance";
import { complianceAlertsEndpoint } from "@/features/compliance/api/compliance.api";

const NONE: ComplianceAlert[] = [];

export function useComplianceAlerts(): Resource<ComplianceAlert[]> {
  return useEndpoint(complianceAlertsEndpoint, [], { fallback: NONE });
}
