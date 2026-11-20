"use client";

import { useT } from "@/i18n/I18nProvider";
import { CatalogSectionEmpty } from "@/features/catalog/components/ProductCatalogEmpty";
import { PLAN_CARD_SHADOW } from "./portfolio-advisory-ui";

/**
 * What a Portfolio Advisory plan list shows in place of its cards when there
 * are none. On a white card, because the list sits on the hero's gradient.
 *
 * `onClearFilters` given → the filter emptied the list ("no result", with a
 * way back); omitted → the service has no plans at all.
 */
export function AdvisoryPlansEmpty({ onClearFilters }: { onClearFilters?: () => void }) {
  const t = useT();
  return (
    <div className="w-full rounded-xl bg-white px-4" style={{ boxShadow: PLAN_CARD_SHADOW }}>
      <CatalogSectionEmpty title={t.products.states.noPlans} onClearFilters={onClearFilters} />
    </div>
  );
}
