"use client";

import { UsersThreeIcon } from "@phosphor-icons/react";
import { ComingSoonPage } from "../coming-soon-page";

/**
 * One page for two readers of the same numbers: a Team Head looking at how
 * each IC on their team is performing, and an IC looking at their own YAA.
 * Not built yet — the nav entry lands ahead of the feature, same as
 * `/ic-learning`.
 */
export default function YaaTeamHeadPage() {
  return (
    <ComingSoonPage
      icon={<UsersThreeIcon size={40} className="text-[var(--text-default-placeholder)]" />}
      title="YAA/Team Head"
      body="Team Heads will track the performance of ICs on their team, and ICs will see their own YAA here. Not built yet — check back soon."
    />
  );
}
