"use client";

import { BottomSheet, Button, Modal } from "@sarunyu/system-one";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useT } from "@/i18n/I18nProvider";

/**
 * One content, two containers: a bottom sheet on mobile and a centered modal on
 * tablet/desktop. Children render once, so the body markup lives in a single
 * place instead of being duplicated per breakpoint.
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  headerAction,
  onBack,
  mobileContentClassName,
  desktopContentClassName,
  closeOnBackdrop = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /**
   * A button on the title row, pushed to the far end of it — "ล้างทั้งหมด" on
   * a filter dialog, and anything else of that shape.
   *
   * A label and a handler rather than a node, so both halves can render the
   * same control from it. `BottomSheet` does have its own action slot, and it
   * is the same `plain` button — but at its own size and weight, which would
   * leave the control looking different either side of 768px. This draws its
   * own on both sides so there is one answer at every width.
   */
  headerAction?: { label: string; onClick: () => void };
  /**
   * A back arrow before the title, for a dialog with steps — set on every step
   * after the first. Drawn by this component on both halves, for the same
   * reason as {@link headerAction}.
   */
  onBack?: () => void;
  /** Applied to the BottomSheet body on mobile. */
  mobileContentClassName?: string;
  /** Applied to the wrapper inside the Modal on desktop. */
  desktopContentClassName?: string;
  /** Close when the desktop backdrop is clicked (mobile always closes on scrim). */
  closeOnBackdrop?: boolean;
  children: React.ReactNode;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const t = useT();

  /** The action itself, identical on both halves. */
  const actionButton = headerAction ? (
    <Button
      variant="plain"
      size="sm"
      className="shrink-0"
      onClick={headerAction.onClick}
    >
      {headerAction.label}
    </Button>
  ) : null;

  const backButton = onBack ? (
    // Black and 20px, the same as the booking modal's own back arrow
    // (`BackButton` in `OrderBookingModal`) — the two sit one step apart in
    // the same flow, and a blue arrow then a black one read as two controls.
    <Button
      variant="plain-black"
      size="icon-sm"
      className="-ml-1 shrink-0"
      onClick={onBack}
      aria-label={t.shell.dialog.back}
      title={t.shell.dialog.back}
    >
      <ArrowLeftIcon size={20} />
    </Button>
  ) : null;

  /** The sheet's and the modal's own headers only know a plain title. */
  const customHeader = Boolean(headerAction || onBack);

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        showHandle
        // The sheet's own header is suppressed when there is an action, and
        // replaced below, so the button matches the desktop one exactly. The
        // title keeps the sheet's own type, so only the control changes.
        showHeader={!customHeader}
        rightSide="none"
        contentClassName={mobileContentClassName}
      >
        {customHeader && (
          <div className="flex items-center justify-between gap-4 pr-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              {backButton}
              <p className="min-w-0 flex-1 truncate text-base font-bold leading-[28px] text-foreground">
                {title}
              </p>
            </div>
            {actionButton}
          </div>
        )}
        {children}
      </BottomSheet>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={
        closeOnBackdrop
          ? (e) => {
              if (e.target === e.currentTarget) onOpenChange(false);
            }
          : undefined
      }
    >
      <Modal
        variant="content"
        actionLayout="none"
        /**
         * `Modal` lays its header out as `justify-between` between the title
         * and the close button, and sizes the title to its content — so an
         * action rendered inside the title lands next to it rather than at the
         * far end. This lets the title take the slack, which puts the action
         * where the sheet already puts it.
         *
         * It reaches into the DS's own markup, which is why it is scoped to the
         * case that needs it: if that structure ever changes the action simply
         * stops being pushed over, rather than anything breaking.
         */
        className={customHeader ? "[&>div:first-child>p]:flex-1" : undefined}
        title={
          customHeader
            ? // `title` is typed `string` but rendered as a child, so a node
              // works. Phrasing content only — it lands inside a `<p>`, and a
              // `<button>` is allowed there.
              ((
                <span className="flex items-center justify-between gap-4">
                  <span className="flex min-w-0 items-center gap-1">
                    {backButton}
                    <span className="min-w-0 truncate">{title}</span>
                  </span>
                  {actionButton}
                </span>
              ) as unknown as string)
            : title
        }
        onClose={() => onOpenChange(false)}
      >
        <div className={desktopContentClassName}>{children}</div>
      </Modal>
    </div>
  );
}
