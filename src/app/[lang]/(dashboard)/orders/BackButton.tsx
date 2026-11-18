"use client";

import { Button } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

/**
 * The back arrow of the order and proposal flows — beside the title on a
 * pointer device, at the top of the pane on a phone, whose sheet header takes
 * no icon.
 */
export function BackButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label?: string;
}) {
  const t = useT();
  label ??= t.orders.backToClientPicker;
  return (
    <Button
      variant="plain-black"
      size="icon-sm"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="-ml-1 shrink-0"
    >
      <ArrowLeftIcon size={20} />
    </Button>
  );
}
