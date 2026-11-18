"use client";

import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

/**
 * Shown when a catalog detail route's id doesn't resolve.
 *
 * Detail pages are reached by id now rather than by handing over the object a
 * card already had, so a stale link, a renamed product or a collection missing
 * from the lookup used to render a completely blank page with no way out.
 */
export function CatalogNotFound({
  message,
  onBack,
}: {
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full text-center px-4 py-24">
      <MagnifyingGlassIcon
        size={40}
        weight="duotone"
        className="text-muted-foreground/40"
      />
      <p className="type-subtitle-1 font-semibold text-[var(--text-default-secondary)]">
        {message}
      </p>
      <Button
        variant="plain"
        size="sm"
        leftIcon={<ArrowLeftIcon size={16} />}
        onClick={onBack}
      >
        กลับ
      </Button>
    </div>
  );
}
