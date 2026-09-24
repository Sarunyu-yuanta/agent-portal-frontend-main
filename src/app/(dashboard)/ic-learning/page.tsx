"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "../coming-soon-page";

export default function IcLearningPage() {
  return (
    <ComingSoonPage
      icon={<GraduationCapIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title="IC Learning"
      body="Training modules and certification tracking will live here. Not built yet — check back soon."
    />
  );
}
