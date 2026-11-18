"use client";

import { UsersThreeIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "../coming-soon-page";
import { useT } from "@/i18n/I18nProvider";

/**
 * One page for two readers of the same numbers: a Team Head looking at how
 * each IC on their team is performing, and an IC looking at their own YAA.
 * Not built yet — the nav entry lands ahead of the feature, same as
 * `/ic-learning`.
 */
export default function YaaTeamHeadPage() {
  const t = useT();
  return (
    <ComingSoonPage
      icon={<UsersThreeIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title={t.learning.yaaTeamHead.title}
      body={t.learning.yaaTeamHead.body}
    />
  );
}
