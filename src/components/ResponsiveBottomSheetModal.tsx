"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { BottomSheet, useIsMobile } from "@sarunyu/system-one";
import { XIcon } from "@phosphor-icons/react";

export function ResponsiveBottomSheetModal({
  open,
  onClose,
  title,
  titleId,
  desktopMaxWidth = "max-w-[520px]",
  desktopRoundedClassName = "rounded-xl",
  desktopTitleClassName = "leading-6",
  desktopTitleIcon,
  desktopTitleHidden = false,
  headerAction,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  desktopMaxWidth?: string;
  desktopRoundedClassName?: string;
  desktopTitleClassName?: string;
  desktopTitleIcon?: ReactNode;
  /**
   * Takes the desktop heading out of the picture while keeping it in the
   * accessibility tree — for a body that opens with its own headline and would
   * otherwise say the same thing twice. The ✕ stays where it was.
   *
   * Desktop only. The mobile sheet's header row is also the only thing it has
   * to dismiss with, and a drawer whose accessible name is blank is worse than
   * one that repeats itself.
   */
  desktopTitleHidden?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose();
        }}
        title={title}
        showHandle
        rightSide="action"
        actionLabel="Close"
        onActionClick={onClose}
        contentClassName="flex min-h-0 max-h-[calc(100dvh-10rem)] flex-col overflow-hidden pt-0"
      >
        {children}
      </BottomSheet>
    );
  }

  if (!open) return null;

  /**
   * Portalled to `<body>`, not left where it was rendered.
   *
   * `position: fixed` escapes scrolling, but not stacking: a sticky, transformed
   * or filtered ancestor creates a stacking context, and everything inside it —
   * `z-[60]` included — is ranked only against its siblings. The Dashboard's
   * right rail is `position: sticky`, so a modal opened from a card in it sat
   * under the app header's `z-30` no matter how high its own z-index went.
   *
   * The mobile branch above has never had the problem: `BottomSheet` is a vaul
   * drawer and portals itself.
   */
  const overlay = (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-white border border-[rgba(0,0,0,0.1)] ${desktopRoundedClassName} w-full ${desktopMaxWidth} max-h-[85vh] flex flex-col overflow-hidden shadow-lg`}
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
      >
        {/* `pt-2` when the heading is hidden: the row is then just the ✕, and
            the full `pt-4` left it floating in a band of its own. */}
        <div
          className={`flex gap-4 items-center px-4 pb-0 shrink-0 ${
            desktopTitleHidden ? "pt-2" : "pt-4"
          }`}
        >
          <div className="flex flex-1 gap-2 items-center min-w-0">
            {!desktopTitleHidden && desktopTitleIcon}
            <p
              id={titleId}
              className={
                desktopTitleHidden
                  ? "sr-only"
                  : `type-h6 font-bold text-[var(--text-default-primary)] ${desktopTitleClassName} flex-1 min-w-0`
              }
            >
              {title}
            </p>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-0.5 text-[var(--text-default-tertiary)] hover:text-[var(--text-default-primary)] cursor-pointer"
            aria-label="Close"
          >
            <XIcon size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );

  return typeof document === "undefined" ? overlay : createPortal(overlay, document.body);
}
