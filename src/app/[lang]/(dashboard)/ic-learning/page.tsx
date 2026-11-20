"use client";

import { GraduationCapIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "@/features/shell/components/ComingSoonPage";
import { useT } from "@/i18n/I18nProvider";

export default function IcLearningPage() {
  const t = useT();
  return (
    <ComingSoonPage
      icon={<GraduationCapIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title={t.learning.icLearning.title}
      body={t.learning.icLearning.body}
    />
  );
}
