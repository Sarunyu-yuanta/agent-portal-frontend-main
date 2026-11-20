"use client";

import { use } from "react";
import { CampaignDetail } from "@/features/promotions/components/CampaignDetail";

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <CampaignDetail id={id} />;
}
