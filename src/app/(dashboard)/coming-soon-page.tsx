"use client";

import type { ReactNode } from "react";
import { Card } from "@sarunyu/system-one";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Whole-page placeholder for a sidebar entry whose feature hasn't shipped yet
 * — the nav shape lands ahead of the build, the same way `lib/feature-flags.ts`
 * holds a finished feature back rather than deleting its entry point.
 *
 * `EmptyState` alone floors at 400px, floaty on an otherwise-empty page — the
 * `min-h` here is what makes it read as the page's content instead of a stray
 * fragment.
 */
export function ComingSoonPage({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card variant="default" className="min-h-[60vh] w-full items-center justify-center">
      <EmptyState icon={icon} title={title} body={body} />
    </Card>
  );
}
