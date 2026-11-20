"use client";

import { use } from "react";
import { InsightDetail } from "@/features/insights/components/InsightDetail";

export default function InsightDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <InsightDetail id={id} />;
}
