"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useT } from "@/i18n/I18nProvider";

/**
 * A horizontal chip strip. It scrolls by swipe/wheel on any device, but a
 * desktop mouse has no horizontal axis to scroll it with — so on desktop it
 * also gets caret buttons, faded into view rather than overlapping the last
 * chip, and shown only on the side that still has something left to reveal.
 *
 * Originated in the Product Catalog search overlay's category/recent-search
 * rows; reused wherever else the app needs the same "swipe on touch, caret on
 * desktop" chip strip rather than re-deriving it.
 */
export function ChipScroller({
  children,
  rowClassName = "px-3 py-2",
  leadInset = false,
  style,
}: {
  children: ReactNode;
  /** Padding for the scrolling row itself; sits inside the scroll area. */
  rowClassName?: string;
  /** Extra inset spacers so chips align with page padding at rest, but can bleed both edges once scrolled. */
  leadInset?: boolean;
  /** Applied to the outer wrapper — the arrow buttons position against it. */
  style?: CSSProperties;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });

  useEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    // 1px of slack: fractional layout widths mean scrollLeft rarely lands
    // exactly on 0 or on the maximum, which would leave a dead arrow visible.
    const update = () =>
      setOverflow({
        left: el.scrollLeft > 1,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      });
    update();
    el.addEventListener("scroll", update, { passive: true });
    // The viewport and the content are measured separately: the chip row's
    // own children can come and go (recent searches, category lists), which
    // changes the content width without ever resizing the scroll container.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    observer.observe(content);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction * Math.round(el.clientWidth * 0.7),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative" style={style}>
      <div
        ref={scrollRef}
        className="overflow-x-auto hide-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        <div ref={contentRef} className={`flex items-center gap-2 ${rowClassName}`}>
          {leadInset && <span aria-hidden className="w-4 shrink-0 md:w-8 lg:w-0" />}
          {children}
          {leadInset && <span aria-hidden className="w-4 shrink-0 md:w-8 lg:w-0" />}
        </div>
      </div>
      {overflow.left && <ChipScrollButton side="left" onClick={() => step(-1)} />}
      {overflow.right && <ChipScrollButton side="right" onClick={() => step(1)} />}
    </div>
  );
}

function ChipScrollButton({
  side,
  onClick,
}: {
  side: "left" | "right";
  onClick: () => void;
}) {
  const t = useT();
  const isLeft = side === "left";
  return (
    // The wrapper is click-through so it only fades the chips sliding under it;
    // the button itself takes pointer events back.
    <div
      className={`pointer-events-none absolute inset-y-0 hidden lg:flex items-center ${
        isLeft
          ? "left-0 pl-1.5 pr-6 bg-gradient-to-r from-white via-white to-transparent"
          : "right-0 pr-1.5 pl-6 bg-gradient-to-l from-white via-white to-transparent"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={isLeft ? t.shell.chipScroller.scrollLeft : t.shell.chipScroller.scrollRight}
        className="pointer-events-auto flex h-7 w-7 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm transition-colors cursor-pointer hover:bg-muted active:bg-[var(--fill-gray-200)]"
      >
        {isLeft ? <CaretLeftIcon size={14} /> : <CaretRightIcon size={14} />}
      </button>
    </div>
  );
}
