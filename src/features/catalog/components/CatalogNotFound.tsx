"use client";

import { NotFoundState } from "@/components/ui/empty-state";

/**
 * Shown when a catalog detail route's id doesn't resolve. The shared
 * {@link NotFoundState} under its original name, so the catalog routes that
 * already import it are unchanged.
 */
export function CatalogNotFound({ message, onBack }: { message: string; onBack: () => void }) {
  return <NotFoundState message={message} onBack={onBack} />;
}
