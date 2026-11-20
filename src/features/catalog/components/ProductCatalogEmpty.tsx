"use client";

import { FunnelSimpleIcon, TrayIcon } from "@phosphor-icons/react";
import { EmptyState } from "@/components/ui/empty-state";
import { useT } from "@/i18n/I18nProvider";

const ICON_CLS = "text-[var(--text-default-placeholder)]";

/**
 * The compact state a catalog section shows under its heading when it has
 * nothing to list, instead of a heading over blank space.
 *
 * - Without `onClearFilters`: truly empty — `title` says what there isn't yet.
 * - With `onClearFilters`: a filter (or search) matched nothing — the shared
 *   "no result" copy plus a way to clear it. `title` is ignored.
 */
export function CatalogSectionEmpty({
  title,
  onClearFilters,
  search = false,
}: {
  title?: string;
  onClearFilters?: () => void;
  /** The narrowing was a text search rather than filter chips. */
  search?: boolean;
}) {
  const t = useT();
  if (onClearFilters) {
    return (
      <EmptyState
        size="compact"
        icon={<FunnelSimpleIcon size={40} className={ICON_CLS} />}
        title={search ? t.states.noResultTitle : t.states.noFilterResultTitle}
        body={search ? t.states.noResultBody : t.states.noFilterResultBody}
        action={{ label: t.states.clearFilters, onClick: onClearFilters }}
      />
    );
  }
  return (
    <EmptyState
      size="compact"
      icon={<TrayIcon size={40} className={ICON_CLS} />}
      title={title ?? t.states.empty}
    />
  );
}
