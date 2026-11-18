"use client";

import { use } from "react";
import { InsightDetail } from "./InsightDetail";

export default function InsightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <InsightDetail id={id} />;
}
