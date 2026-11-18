import type { ReactNode } from "react";
import { Button } from "@sarunyu/system-one";
import { useT } from "@/i18n/I18nProvider";

/**
 * A scroll-capped list plus a "View all" button below it — the shape a quick
 * dialog uses so a long list doesn't outgrow the screen: a few items' worth
 * before it scrolls, past that "View all" is the way out rather than more
 * scrolling.
 *
 * `contentClassName` carries the scroll cap and item gap, not just the gap —
 * callers with different item shapes (a bordered card vs. a day-sectioned
 * list) need different vertical rhythm, so the default here is only what the
 * two plain card lists in `ClientDetailPanel` use.
 */
export function CompactList({
  onViewAll,
  contentClassName = "gap-3 max-h-[380px] overflow-y-auto pr-1 -mr-1",
  children,
}: {
  onViewAll?: () => void;
  contentClassName?: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex flex-col ${contentClassName}`}>{children}</div>
      {onViewAll && (
        <Button variant="plain" size="sm" className="self-end" onClick={onViewAll}>
          {t.shell.compactList.viewAll}
        </Button>
      )}
    </div>
  );
}
