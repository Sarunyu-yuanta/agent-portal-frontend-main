"use client";

import { MegaphoneIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "../coming-soon-page";

export default function PromotionsPage() {
  return (
    <ComingSoonPage
      icon={<MegaphoneIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title="Promotion/Events"
      body="Campaigns and client events will live here. Not built yet — check back soon."
    />
  );
}
